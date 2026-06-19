"""
Enhanced Agent Router

Provides intelligent routing between different agent systems while
maintaining compatibility with existing LangGraph agents.
"""

import asyncio
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class AgentType(Enum):
    """Types of available agents"""

    ORCHESTRATOR = "orchestrator"
    RETRIEVER = "retriever"
    ANALYST = "analyst"
    CRITIC = "critic"
    WRITER = "writer"
    FINANCIAL = "financial"
    ACADEMIC = "academic"
    MATHEMATICAL = "mathematical"
    RAG = "rag"
    RAG_MEMORY = "rag_memory"
    RESEARCH_ANALYST = "research_analyst"
    RESEARCH_PLANNER = "research_planner"


class AgentSystem(Enum):
    """Available agent systems"""

    NEXUSAI = "nexusai"  # Existing LangGraph agents
    INTELLIGENCE_HUB = "intelligence_hub"  # Specialized agents
    DEEP_RESEARCH = "deep_research"  # Research system


@dataclass
class AgentContext:
    """Context for agent execution"""

    query: str
    user_id: str
    workspace_id: str
    system: AgentSystem
    agent_type: AgentType
    context: dict[str, Any] | None = None
    max_tokens: int = 2000
    temperature: float = 0.7


class AgentResponse:
    """Response from agent execution"""

    def __init__(
        self,
        content: str,
        agent_type: AgentType,
        system: AgentSystem,
        metadata: dict[str, Any] | None = None,
        confidence: float = 1.0,
    ):
        self.content = content
        self.agent_type = agent_type
        self.system = system
        self.metadata = metadata or {}
        self.confidence = confidence
        import time

        self.timestamp = time.time()

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "content": self.content,
            "agent_type": self.agent_type.value,
            "system": self.system.value,
            "metadata": self.metadata,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
        }


class BaseAgent:
    """Base class for all agents"""

    def __init__(self, agent_id: str, agent_type: AgentType, system: AgentSystem):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.system = system
        self.logger = logging.getLogger(f"{__name__}.{agent_id}")

    async def execute(self, context: AgentContext) -> AgentResponse:
        """Execute the agent with given context"""
        raise NotImplementedError("Subclasses must implement execute method")

    def supports_context(self, context: AgentContext) -> bool:
        """Check if agent supports the given context"""
        return True  # Default implementation


class NexusAIAgent(BaseAgent):
    """Wrapper for existing NexusAI LangGraph agents"""

    def __init__(self, agent_id: str, agent_type: AgentType, langgraph_agent):
        super().__init__(agent_id, agent_type, AgentSystem.NEXUSAI)
        self.langgraph_agent = langgraph_agent

    async def execute(self, context: AgentContext) -> AgentResponse:
        """Execute LangGraph agent"""
        try:
            # Convert context to expected format
            input_data = {
                **(context.context or {}),
                "query": context.query,
                "user_id": context.user_id,
                "workspace_id": context.workspace_id,
            }

            # Execute LangGraph agent
            result = await self.langgraph_agent.ainvoke(input_data)

            return AgentResponse(
                content=result.get("response", ""),
                agent_type=self.agent_type,
                system=self.system,
                metadata=result.get("metadata", {}),
                confidence=result.get("confidence", 1.0),
            )
        except Exception as e:
            self.logger.error(f"Error executing {self.agent_id}: {e}")
            return AgentResponse(
                content=f"Error: {str(e)}",
                agent_type=self.agent_type,
                system=self.system,
                confidence=0.0,
            )


class IntelligenceHubAgent(BaseAgent):
    """Specialized agent from Intelligence Hub"""

    def __init__(self, agent_id: str, agent_type: AgentType, agent_config: dict[str, Any]):
        super().__init__(agent_id, agent_type, AgentSystem.INTELLIGENCE_HUB)
        self.agent_config = agent_config
        self.agent_impl = self._create_agent_impl()

    def _create_agent_impl(self):
        """Create the actual agent implementation"""
        # This would integrate with the Intelligence Hub agents
        # For now, create a placeholder implementation
        return {
            "financial": FinancialAgentImpl(),
            "academic": AcademicAgentImpl(),
            "mathematical": MathematicalAgentImpl(),
            "rag": RAGAgentImpl(),
            "rag_memory": MemoryRAGAgentImpl(),
            "web_search": WebSearchAgentImpl(),
        }.get(self.agent_type.value.lower(), GenericAgentImpl())

    async def execute(self, context: AgentContext) -> AgentResponse:
        """Execute Intelligence Hub agent"""
        try:
            execution_context = {
                **(context.context or {}),
                "workspace_id": context.workspace_id,
                "user_id": context.user_id,
                "max_tokens": context.max_tokens,
                "temperature": context.temperature,
            }
            # Execute the specialized agent
            result = await self.agent_impl.execute(context.query, execution_context)

            return AgentResponse(
                content=result["content"],
                agent_type=self.agent_type,
                system=self.system,
                metadata=result.get("metadata", {}),
                confidence=result.get("confidence", 1.0),
            )
        except Exception as e:
            self.logger.error(f"Error executing {self.agent_id}: {e}")
            return AgentResponse(
                content=f"Error: {str(e)}",
                agent_type=self.agent_type,
                system=self.system,
                confidence=0.0,
            )


# Placeholder implementations for Intelligence Hub agents
class FinancialAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "content": f"Financial analysis for: {query}",
            "metadata": {"type": "financial_analysis"},
            "confidence": 0.9,
        }


class AcademicAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "content": f"Academic research for: {query}",
            "metadata": {"type": "academic_research"},
            "confidence": 0.9,
        }


class MathematicalAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "content": f"Mathematical calculation for: {query}",
            "metadata": {"type": "mathematical_calculation"},
            "confidence": 0.9,
        }


class RAGAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        workspace_id = context.get("workspace_id")
        if not workspace_id:
            return {
                "content": "RAG requires a workspace_id to search the document index.",
                "metadata": {"type": "rag", "error": "missing_workspace_id"},
                "confidence": 0.0,
            }

        top_k = int(context.get("top_k", 5) or 5)
        from app.ai.rag import answer_rag

        result = await answer_rag(
            question=query,
            workspace_id=str(workspace_id),
            top_k=top_k,
        )
        return {
            "content": result.get("answer", ""),
            "metadata": {
                "type": "rag",
                "citations": result.get("citations", []),
                "confidence_score": result.get("confidence_score", 0.0),
            },
            "confidence": result.get("confidence_score", 0.0),
        }


class MemoryRAGAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        workspace_id = context.get("workspace_id")
        if not workspace_id:
            return {
                "content": "Memory RAG requires a workspace_id to search the document index.",
                "metadata": {"type": "rag_memory", "error": "missing_workspace_id"},
                "confidence": 0.0,
            }

        top_k = int(context.get("top_k", 5) or 5)
        from app.ai.rag import answer_rag_with_memory

        result = await answer_rag_with_memory(
            question=query,
            workspace_id=str(workspace_id),
            user_id=str(context.get("user_id")) if context.get("user_id") else None,
            session_id=str(context.get("session_id") or context.get("memory_session_id"))
            if context.get("session_id") or context.get("memory_session_id")
            else None,
            top_k=top_k,
        )
        return {
            "content": result.get("answer", ""),
            "metadata": {
                "type": "rag_memory",
                "citations": result.get("citations", []),
                "confidence_score": result.get("confidence_score", 0.0),
                "memory_session_id": result.get("memory_session_id", ""),
                "rewritten_question": result.get("rewritten_question", query),
                "memory_used": result.get("memory_used", False),
            },
            "confidence": result.get("confidence_score", 0.0),
        }


class WebSearchAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "content": f"Web search for: {query}",
            "metadata": {"type": "web_search"},
            "confidence": 0.9,
        }


class GenericAgentImpl:
    async def execute(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "content": f"Generic response for: {query}",
            "metadata": {"type": "generic"},
            "confidence": 0.5,
        }


class DeepResearchAgent(BaseAgent):
    """Agent from Deep Research system"""

    def __init__(self, agent_id: str, agent_type: AgentType, research_config: dict[str, Any]):
        super().__init__(agent_id, agent_type, AgentSystem.DEEP_RESEARCH)
        self.research_config = research_config

    async def execute(self, context: AgentContext) -> AgentResponse:
        """Execute Deep Research agent"""
        try:
            # This would integrate with the Deep Research system
            # For now, create a placeholder implementation
            research_result = await self._execute_research(context.query, context.context or {})

            return AgentResponse(
                content=research_result["content"],
                agent_type=self.agent_type,
                system=self.system,
                metadata=research_result.get("metadata", {}),
                confidence=research_result.get("confidence", 0.8),
            )
        except Exception as e:
            self.logger.error(f"Error executing {self.agent_id}: {e}")
            return AgentResponse(
                content=f"Error: {str(e)}",
                agent_type=self.agent_type,
                system=self.system,
                confidence=0.0,
            )

    async def _execute_research(self, query: str, context: dict[str, Any]) -> dict[str, Any]:
        """Execute research with Deep Research system"""
        return {
            "content": f"Deep research result for: {query}",
            "metadata": {"type": "deep_research", "sources": []},
            "confidence": 0.8,
        }


class EnhancedAgentRouter:
    """Central router for all agent systems"""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {}
        self.agent_systems: dict[AgentSystem, list[str]] = {
            AgentSystem.NEXUSAI: [],
            AgentSystem.INTELLIGENCE_HUB: [],
            AgentSystem.DEEP_RESEARCH: [],
        }
        self.logger = logging.getLogger(__name__)

    def register_agent(self, agent: BaseAgent):
        """Register an agent with the router"""
        self.agents[agent.agent_id] = agent
        self.agent_systems[agent.system].append(agent.agent_id)
        self.logger.info(f"Registered agent: {agent.agent_id} ({agent.system.value})")

    def get_agent(self, agent_id: str) -> BaseAgent | None:
        """Get agent by ID"""
        return self.agents.get(agent_id)

    def list_agents(self, system: AgentSystem | None = None) -> list[str]:
        """List available agents"""
        if system:
            return self.agent_systems.get(system, [])
        return list(self.agents.keys())

    async def route_query(self, context: AgentContext) -> list[AgentResponse]:
        """Route query to appropriate agents"""
        responses = []

        # Determine which agents to use based on query type and context
        target_agents = self._select_agents(context)

        # Execute agents in parallel
        tasks = []
        for agent_id in target_agents:
            agent = self.agents.get(agent_id)
            if agent and agent.supports_context(context):
                tasks.append(agent.execute(context))

        # Wait for all agents to complete
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, Exception):
                    self.logger.error(f"Agent execution error: {result}")
                elif isinstance(result, AgentResponse):
                    responses.append(result)

        return responses

    def _select_agents(self, context: AgentContext) -> list[str]:
        """Select appropriate agents for the given context"""
        explicit_agent_ids = [
            agent_id
            for agent_id, agent in self.agents.items()
            if agent.agent_type == context.agent_type and agent.system == context.system
        ]
        if explicit_agent_ids:
            return explicit_agent_ids

        fallback_agent_ids = [
            agent_id
            for agent_id, agent in self.agents.items()
            if agent.agent_type == context.agent_type
        ]
        if fallback_agent_ids:
            return fallback_agent_ids

        target_agents = []

        # Always include NexusAI core agents for RAG
        if context.system == AgentSystem.NEXUSAI:
            target_agents.extend(self.agent_systems[AgentSystem.NEXUSAI])

        # Add specialized agents based on query content
        query_lower = context.query.lower()

        if any(
            keyword in query_lower for keyword in ["financial", "stock", "investment", "market"]
        ):
            # Find financial agents
            financial_agents = [
                aid
                for aid in self.agents.keys()
                if self.agents[aid].agent_type == AgentType.FINANCIAL
            ]
            target_agents.extend(financial_agents)

        if any(keyword in query_lower for keyword in ["research", "paper", "study", "academic"]):
            # Find academic agents
            academic_agents = [
                aid
                for aid in self.agents.keys()
                if self.agents[aid].agent_type == AgentType.ACADEMIC
            ]
            target_agents.extend(academic_agents)

        if any(keyword in query_lower for keyword in ["calculate", "math", "equation", "formula"]):
            # Find mathematical agents
            math_agents = [
                aid
                for aid in self.agents.keys()
                if self.agents[aid].agent_type == AgentType.MATHEMATICAL
            ]
            target_agents.extend(math_agents)

        if any(
            keyword in query_lower for keyword in ["deep", "research", "analysis", "comprehensive"]
        ):
            # Find deep research agents
            research_agents = [
                aid
                for aid in self.agents.keys()
                if self.agents[aid].system == AgentSystem.DEEP_RESEARCH
            ]
            target_agents.extend(research_agents)

        return list(set(target_agents))  # Remove duplicates

    async def combine_responses(self, responses: list[AgentResponse]) -> AgentResponse:
        """Combine multiple agent responses into a single response"""
        if not responses:
            return AgentResponse("", AgentType.ORCHESTRATOR, AgentSystem.NEXUSAI, confidence=0.0)

        if len(responses) == 1:
            return responses[0]

        # Sort responses by confidence
        sorted_responses = sorted(responses, key=lambda x: x.confidence, reverse=True)

        # Combine content
        combined_content = []
        metadata = {"combined_from": []}

        for response in sorted_responses:
            if response.confidence > 0.5:  # Only include high-confidence responses
                combined_content.append(f"[{response.agent_type.value}] {response.content}")
                metadata["combined_from"].append(
                    {
                        "agent_id": getattr(response, "agent_id", response.agent_type.value),
                        "system": response.system.value,
                        "confidence": response.confidence,
                    }
                )

        final_content = "\n\n".join(combined_content)

        # Calculate combined confidence (weighted average)
        total_confidence = sum(r.confidence for r in sorted_responses)
        combined_confidence = total_confidence / len(sorted_responses)

        return AgentResponse(
            content=final_content,
            agent_type=AgentType.ORCHESTRATOR,
            system=AgentSystem.NEXUSAI,
            metadata=metadata,
            confidence=combined_confidence,
        )
