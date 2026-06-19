"""LangGraph multi-agent pipeline tests."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.ai.agents.graph import AgentState, _should_loop
from app.ai.agents.writer import writer_node
from app.ai.agents.orchestrator import orchestrator_node


def _base_state(**overrides) -> AgentState:
    state = AgentState(
        question="What is the revenue?", workspace_id="ws-1", top_k=5,
        retrieved_chunks=[], analyst_draft="", citations=[],
        gaps=[], contradictions=[], critic_feedback=None,
        confidence_score=0.0, critic_loops=0, final_answer="", steps=[],
    )
    state.update(overrides)
    return state


def test_orchestrator_initialises_state():
    state = _base_state()
    result = orchestrator_node(state)
    assert result["critic_loops"] == 0
    assert result["confidence_score"] == 0.0
    assert "orchestrator" in result["steps"][0]


def test_critic_routes_to_writer_on_high_confidence():
    state = _base_state(confidence_score=0.85, critic_loops=1)
    assert _should_loop(state) == "writer"


def test_critic_routes_to_analyst_on_low_confidence():
    state = _base_state(confidence_score=0.4, critic_loops=0)
    assert _should_loop(state) == "analyst"


def test_critic_routes_to_writer_after_max_loops():
    state = _base_state(confidence_score=0.3, critic_loops=2)
    assert _should_loop(state) == "writer"


def test_writer_formats_answer_with_sources():
    chunks = [
        {"chunk_id": "c1", "document_id": "d1", "document_filename": "report.pdf",
         "content": "Revenue was $10M", "score": 0.9, "page_number": 5, "chunk_index": 0},
    ]
    state = _base_state(
        analyst_draft="Revenue was $10M [1]",
        retrieved_chunks=chunks,
        confidence_score=0.9,
    )
    result = writer_node(state)
    assert "Revenue was $10M [1]" in result["final_answer"]
    assert "report.pdf" in result["final_answer"]
    assert "writer" in result["steps"][-1]


def test_writer_deduplicates_sources():
    chunks = [
        {"chunk_id": "c1", "document_id": "d1", "document_filename": "doc.pdf",
         "content": "chunk 1", "score": 0.9, "page_number": 1, "chunk_index": 0},
        {"chunk_id": "c2", "document_id": "d1", "document_filename": "doc.pdf",
         "content": "chunk 2", "score": 0.8, "page_number": 2, "chunk_index": 1},
    ]
    state = _base_state(analyst_draft="Answer.", retrieved_chunks=chunks)
    result = writer_node(state)
    # doc.pdf should appear only once in sources section
    assert result["final_answer"].count("doc.pdf") == 1


@pytest.mark.asyncio
async def test_full_graph_returns_answer():
    """Integration test: full graph run with mocked LLM and retrieval."""
    from app.ai.agents.graph import build_agent_graph

    analyst_json = '{"answer": "Revenue is $10M [1]", "citations": [], "gaps": [], "contradictions": []}'
    critic_json = '{"confidence": 0.9, "verdict": "pass", "issues": [], "feedback": ""}'

    class MockChunk:
        chunk_id = "c1"
        document_id = "d1"
        document_filename = "r.pdf"
        content = "Revenue $10M"
        score = 0.9
        page_number = 1
        chunk_index = 0
    chunks = [MockChunk()]

    with patch("app.ai.retrieval.hybrid_retrieve", new_callable=AsyncMock) as mock_retrieve, \
         patch("app.ai.agents.analyst.get_openai_client") as mock_analyst_client, \
         patch("app.ai.agents.critic.get_openai_client") as mock_critic_client:

        mock_retrieve.return_value = chunks

        analyst_choice = MagicMock()
        analyst_choice.message.content = analyst_json
        analyst_client = MagicMock()
        analyst_client.chat.completions.create.return_value.choices = [analyst_choice]
        mock_analyst_client.return_value = analyst_client

        critic_choice = MagicMock()
        critic_choice.message.content = critic_json
        critic_client = MagicMock()
        critic_client.chat.completions.create.return_value.choices = [critic_choice]
        mock_critic_client.return_value = critic_client

        graph = build_agent_graph()
        result = await graph.ainvoke({
            "question": "What is revenue?", "workspace_id": "ws-1", "top_k": 3,
            "retrieved_chunks": [], "analyst_draft": "", "citations": [],
            "gaps": [], "contradictions": [], "critic_feedback": None,
            "confidence_score": 0.0, "critic_loops": 0, "final_answer": "", "steps": [],
        })
        assert result["final_answer"] != ""
        assert result["confidence_score"] >= 0.7
