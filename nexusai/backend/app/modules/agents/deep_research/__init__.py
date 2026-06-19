"""
Deep Research Module

Hierarchical research system with DOK (Depth of Knowledge) taxonomy,
project-level knowledge management, and agent-to-agent communication.
"""

from .deep_research_agent import DeepResearchAgent
from .research_planner import ResearchPlanner
from .knowledge_consolidator import KnowledgeConsolidator

__all__ = [
    "DeepResearchAgent",
    "ResearchPlanner",
    "KnowledgeConsolidator",
]
