"""
LangGraph multi-agent StateGraph for NexusAI.

Graph topology:
  START → orchestrator → retriever → analyst → critic ──pass──→ writer → END
                                         ↑──────fail──┘

The critic can loop back to the analyst up to MAX_CRITIC_LOOPS times.
"""
from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

MAX_CRITIC_LOOPS = 2


class AgentState(TypedDict):
    # Input
    question: str
    workspace_id: str
    top_k: int

    # Retrieval
    retrieved_chunks: list[dict[str, Any]]

    # Analysis
    analyst_draft: str
    citations: list[dict[str, Any]]
    gaps: list[str]
    contradictions: list[str]

    # Critic
    critic_feedback: str | None
    confidence_score: float
    critic_loops: int

    # Output
    final_answer: str
    steps: list[str]


def _should_loop(state: AgentState) -> str:
    """Conditional edge: route to writer on pass, back to analyst on fail."""
    if state["confidence_score"] >= 0.7 or state["critic_loops"] >= MAX_CRITIC_LOOPS:
        return "writer"
    return "analyst"


def build_agent_graph() -> Any:
    """Build and compile the LangGraph StateGraph."""
    from app.ai.agents.orchestrator import orchestrator_node
    from app.ai.agents.retriever import retriever_node
    from app.ai.agents.analyst import analyst_node
    from app.ai.agents.critic import critic_node
    from app.ai.agents.writer import writer_node

    graph = StateGraph(AgentState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("retriever", retriever_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("critic", critic_node)
    graph.add_node("writer", writer_node)

    graph.add_edge(START, "orchestrator")
    graph.add_edge("orchestrator", "retriever")
    graph.add_edge("retriever", "analyst")
    graph.add_edge("analyst", "critic")
    graph.add_conditional_edges("critic", _should_loop, {"writer": "writer", "analyst": "analyst"})
    graph.add_edge("writer", END)

    return graph.compile()
