"""
Orchestrator agent node.
Validates the question and initialises state for the rest of the graph.
"""
from __future__ import annotations
from app.ai.agents.graph import AgentState


def orchestrator_node(state: AgentState) -> dict:
    steps = list(state.get("steps", []))
    steps.append("orchestrator: query validated")
    return {
        "steps": steps,
        "critic_loops": 0,
        "confidence_score": 0.0,
        "critic_feedback": None,
        "final_answer": "",
        "citations": [],
        "gaps": [],
        "contradictions": [],
    }
