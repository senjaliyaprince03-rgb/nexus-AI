"""Tests for the modular agent router."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.modules.agents.intelligence_hub.rag_agent import MemoryRAGAgent, RAGAgent
from app.modules.shared.agent_router import (
    AgentContext,
    AgentSystem,
    AgentType,
    EnhancedAgentRouter,
    IntelligenceHubAgent,
)


@pytest.mark.asyncio
async def test_rag_agent_uses_workspace_documents() -> None:
    """The standalone RAG wrapper should call the document retrieval pipeline."""
    agent = RAGAgent(config={"top_k": 3})

    with patch(
        "app.ai.rag.answer_rag",
        new=AsyncMock(
            return_value={
                "answer": "document answer",
                "citations": [],
                "confidence_score": 0.91,
            }
        ),
    ) as mock_answer_rag:
        result = await agent.execute(
            "Summarize the policy changes",
            context={"workspace_id": "workspace-1", "top_k": 3},
        )

    assert result["content"] == "document answer"
    assert result["confidence"] == 0.91
    mock_answer_rag.assert_awaited_once_with(
        question="Summarize the policy changes",
        workspace_id="workspace-1",
        top_k=3,
    )


@pytest.mark.asyncio
async def test_memory_rag_agent_uses_session_context() -> None:
    """The memory-backed RAG wrapper should pass workspace, user, and session context through."""
    agent = MemoryRAGAgent(config={"top_k": 4})

    with patch(
        "app.ai.rag.answer_rag_with_memory",
        new=AsyncMock(
            return_value={
                "answer": "memory answer",
                "citations": [],
                "confidence_score": 0.84,
                "memory_session_id": "session-2",
                "rewritten_question": "What did we decide earlier?",
                "memory_used": True,
            }
        ),
    ) as mock_answer_rag_with_memory:
        result = await agent.execute(
            "What did we decide earlier?",
            context={
                "workspace_id": "workspace-1",
                "user_id": "user-1",
                "session_id": "session-2",
                "top_k": 4,
            },
        )

    assert result["content"] == "memory answer"
    assert result["metadata"]["memory_used"] is True
    mock_answer_rag_with_memory.assert_awaited_once_with(
        question="What did we decide earlier?",
        workspace_id="workspace-1",
        user_id="user-1",
        session_id="session-2",
        top_k=4,
    )


@pytest.mark.asyncio
async def test_explicit_rag_memory_request_routes_to_memory_pipeline() -> None:
    """A rag_memory request should route through the memory-backed RAG implementation."""
    router = EnhancedAgentRouter()
    router.register_agent(
        IntelligenceHubAgent(
            agent_id="hub_rag_memory",
            agent_type=AgentType.RAG_MEMORY,
            agent_config={},
        )
    )

    with patch(
        "app.ai.rag.answer_rag_with_memory",
        new=AsyncMock(
            return_value={
                "answer": "memory-aware answer",
                "citations": [{"chunk_id": "chunk-1"}],
                "confidence_score": 0.88,
                "memory_session_id": "session-1",
                "rewritten_question": "What did we decide earlier?",
                "memory_used": True,
            }
        ),
    ) as mock_memory_rag:
        responses = await router.route_query(
            AgentContext(
                query="What did we decide earlier?",
                user_id="user-1",
                workspace_id="workspace-1",
                system=AgentSystem.INTELLIGENCE_HUB,
                agent_type=AgentType.RAG_MEMORY,
                context={"session_id": "session-1", "top_k": 7},
            )
        )

    assert len(responses) == 1
    response = responses[0]
    assert response.agent_type == AgentType.RAG_MEMORY
    assert response.content == "memory-aware answer"
    assert response.metadata["memory_used"] is True
    mock_memory_rag.assert_awaited_once_with(
        question="What did we decide earlier?",
        workspace_id="workspace-1",
        user_id="user-1",
        session_id="session-1",
        top_k=7,
    )
