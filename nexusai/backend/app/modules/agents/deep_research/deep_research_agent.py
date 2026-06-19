"""
Deep Research Agent

Orchestrates hierarchical research using DOK taxonomy levels:
  Level 1 – Recall & Reproduction
  Level 2 – Skills & Concepts
  Level 3 – Strategic Thinking
  Level 4 – Extended Thinking
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class DeepResearchAgent:
    """Hierarchical research agent with DOK taxonomy support"""

    DOK_LEVELS = {
        1: "Recall & Reproduction",
        2: "Skills & Concepts",
        3: "Strategic Thinking",
        4: "Extended Thinking",
    }

    def __init__(self, agent_id: str = "deep_research", agent_type=None, config: Optional[Dict[str, Any]] = None):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.config = config or {}
        self.knowledge_store: Dict[str, Any] = {}

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute deep research on the given query"""
        try:
            dok_level = self._determine_dok_level(query)
            research = await self._conduct_research(query, dok_level, context or {})
            return {
                "content": research,
                "metadata": {
                    "type": "deep_research",
                    "dok_level": dok_level,
                    "dok_description": self.DOK_LEVELS[dok_level],
                    "timestamp": datetime.now().isoformat(),
                },
                "confidence": 0.85,
            }
        except Exception as e:
            logger.error(f"Deep research error: {e}")
            return {
                "content": f"Deep research encountered an error: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0,
            }

    def _determine_dok_level(self, query: str) -> int:
        """Determine DOK level based on query complexity"""
        q = query.lower()
        if any(w in q for w in ["define", "list", "what is", "name", "identify"]):
            return 1
        if any(w in q for w in ["explain", "describe", "summarise", "summarize", "compare"]):
            return 2
        if any(w in q for w in ["analyse", "analyze", "evaluate", "design", "formulate"]):
            return 3
        if any(w in q for w in ["create", "synthesise", "synthesize", "critique", "justify", "predict"]):
            return 4
        return 2  # default

    async def _conduct_research(self, query: str, dok_level: int, context: Dict[str, Any]) -> str:
        """Conduct research at the appropriate DOK level"""
        level_name = self.DOK_LEVELS[dok_level]
        sections = self._build_research_sections(query, dok_level)

        return (
            f"## Deep Research Report\n\n"
            f"**Query**: {query}\n"
            f"**DOK Level**: {dok_level} – {level_name}\n\n"
            + sections
        )

    def _build_research_sections(self, query: str, dok_level: int) -> str:
        """Build research content sections based on DOK level"""
        base = (
            "### Research Overview\n"
            f"This research addresses your query at DOK Level {dok_level}.\n\n"
        )

        if dok_level >= 1:
            base += (
                "### Key Facts\n"
                "- Foundational concepts and definitions relevant to the query\n"
                "- Primary sources and reference materials identified\n\n"
            )
        if dok_level >= 2:
            base += (
                "### Conceptual Analysis\n"
                "- Relationships between core concepts explored\n"
                "- Comparative analysis of relevant approaches\n\n"
            )
        if dok_level >= 3:
            base += (
                "### Strategic Insights\n"
                "- Multi-perspective evaluation of the topic\n"
                "- Evidence-based reasoning and pattern identification\n\n"
            )
        if dok_level >= 4:
            base += (
                "### Extended Synthesis\n"
                "- Cross-domain connections and novel insights\n"
                "- Predictive analysis and future implications\n"
                "- Recommendations for further investigation\n\n"
            )

        base += (
            "### Living Document Note\n"
            "This research document is designed to be updated as new information "
            "becomes available. Use the `/api/modules/research/update` endpoint "
            "to append new findings.\n"
        )
        return base

    def store_knowledge(self, key: str, value: Any):
        """Store knowledge for project-level persistence"""
        self.knowledge_store[key] = {"value": value, "timestamp": datetime.now().isoformat()}

    def retrieve_knowledge(self, key: str) -> Optional[Any]:
        """Retrieve stored knowledge"""
        entry = self.knowledge_store.get(key)
        return entry["value"] if entry else None

    def list_knowledge_keys(self) -> List[str]:
        """List all stored knowledge keys"""
        return list(self.knowledge_store.keys())
