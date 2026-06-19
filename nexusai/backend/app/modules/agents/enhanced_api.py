"""
Enhanced API Endpoints for Modular Agent System

Provides API endpoints for the integrated agent systems, supporting
both existing NexusAI agents and new specialized agents.
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.services.mongo_store import AccessDeniedError, NotFoundError, store

from ..shared.agent_router import AgentContext, AgentSystem, AgentType, EnhancedAgentRouter
from ..shared.database_integration import MongoDBIntegration, UnifiedDatabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/modules", tags=["modules"])


# Global instances (would be properly initialized in main application)
router.agent_router = EnhancedAgentRouter()
router.unified_db = None


async def get_agent_router() -> EnhancedAgentRouter:
    """Get the agent router instance"""
    return router.agent_router


async def get_unified_db() -> UnifiedDatabase:
    """Get the unified database instance"""
    if router.unified_db is None:
        from app.core.database import get_database

        router.unified_db = UnifiedDatabase(MongoDBIntegration(get_database()))
    return router.unified_db


async def _require_module_workspace_access(user: dict, workspace_id: str) -> None:
    try:
        await store.require_workspace_access(user["_id"], workspace_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail="Workspace not found") from exc
    except AccessDeniedError as exc:
        raise HTTPException(status_code=403, detail="Workspace access denied") from exc


@router.post("/agents/route")
async def route_query(
    query: str,
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
    system: str | None = Query(default="nexusai", description="Agent system to use"),
    agent_type: str | None = Query(default="orchestrator", description="Specific agent type"),
    context: dict[str, Any] | None = None,
    max_tokens: int = Query(default=2000, ge=100, le=4000),
    temperature: float = Query(default=0.7, ge=0.0, le=2.0),
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Route a query to appropriate agents across different systems.

    This endpoint intelligently routes queries to the most suitable agents
    based on query content and available agent systems.
    """
    user_id = str(current_user["_id"])
    try:
        await _require_module_workspace_access(current_user, workspace_id)
        # Parse system and agent type
        try:
            agent_system = AgentSystem(system)
            agent_type_enum = AgentType(agent_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid system '{system}' or agent type '{agent_type}'. "
                f"Available systems: {[s.value for s in AgentSystem]}",
            )

        # Create agent context
        context_obj = AgentContext(
            query=query,
            user_id=user_id,
            workspace_id=workspace_id,
            system=agent_system,
            agent_type=agent_type_enum,
            context=context or {},
            max_tokens=max_tokens,
            temperature=temperature,
        )

        # Route query to agents
        responses = await agent_router.route_query(context_obj)

        # Combine responses if multiple
        if len(responses) > 1:
            combined_response = await agent_router.combine_responses(responses)
            return {
                "status": "success",
                "responses": [r.to_dict() for r in responses],
                "combined": combined_response.to_dict(),
                "agents_used": len(responses),
                "timestamp": datetime.now().isoformat(),
            }
        else:
            return {
                "status": "success",
                "response": responses[0].to_dict() if responses else None,
                "agents_used": len(responses),
                "timestamp": datetime.now().isoformat(),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in query routing: {e}")
        raise HTTPException(status_code=500, detail=f"Query routing failed: {str(e)}")


@router.get("/agents")
async def list_agents(
    system: str | None = Query(default=None, description="Filter by agent system"),
    current_user: dict = Depends(get_current_user),
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    List available agents.

    Optionally filter by agent system.
    """
    _ = current_user
    try:
        if system:
            try:
                agent_system = AgentSystem(system)
                agents = agent_router.list_agents(agent_system)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid system '{system}'. "
                    f"Available systems: {[s.value for s in AgentSystem]}",
                )
        else:
            agents = agent_router.list_agents()

        return {
            "status": "success",
            "agents": agents,
            "total": len(agents),
            "systems": {s.value: len(agent_router.list_agents(s)) for s in AgentSystem},
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing agents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")


@router.get("/agents/{agent_id}")
async def get_agent_details(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Get details about a specific agent.
    """
    _ = current_user
    try:
        agent = agent_router.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

        return {
            "status": "success",
            "agent": {
                "id": agent.agent_id,
                "type": agent.agent_type.value,
                "system": agent.system.value,
                "supports_context": agent.supports_context(None),  # Simplified for now
            },
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent details: {str(e)}")


@router.post("/agents/register")
async def register_agent(
    agent_id: str,
    agent_type: str,
    system: str,
    current_user: dict = Depends(get_current_user),
    config: dict[str, Any] | None = None,
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Register a new agent with the system.

    This endpoint allows dynamic registration of new agents.
    """
    _ = current_user
    try:
        # Parse system and agent type
        try:
            agent_system = AgentSystem(system)
            agent_type_enum = AgentType(agent_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid system '{system}' or agent type '{agent_type}'. "
                f"Available systems: {[s.value for s in AgentSystem]}",
            )

        # Create agent based on type and system
        agent = None

        if agent_system == AgentSystem.INTELLIGENCE_HUB:
            # Route all Intelligence Hub capabilities through the shared adapter
            # so the router always receives a compatible BaseAgent implementation.
            from ..shared.agent_router import IntelligenceHubAgent

            agent = IntelligenceHubAgent(agent_id, agent_type_enum, config or {})

        elif agent_system == AgentSystem.DEEP_RESEARCH:
            from ..shared.agent_router import DeepResearchAgent as _RouterDeepAgent

            agent = _RouterDeepAgent(agent_id, agent_type_enum, config or {})

        else:
            # For other systems, create a placeholder agent
            from ..shared.agent_router import BaseAgent

            agent = BaseAgent(agent_id, agent_type_enum, agent_system)

        # Register the agent
        agent_router.register_agent(agent)

        return {
            "status": "success",
            "message": f"Agent '{agent_id}' registered successfully",
            "agent": {
                "id": agent.agent_id,
                "type": agent.agent_type.value,
                "system": agent.system.value,
            },
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering agent: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register agent: {str(e)}")


@router.delete("/agents/{agent_id}")
async def unregister_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Unregister an agent from the system.
    """
    _ = current_user
    try:
        if agent_id not in agent_router.agents:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

        # Remove the agent
        del agent_router.agents[agent_id]

        # Remove from system lists
        for system, agents in agent_router.agent_systems.items():
            if agent_id in agents:
                agents.remove(agent_id)

        return {
            "status": "success",
            "message": f"Agent '{agent_id}' unregistered successfully",
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unregistering agent: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unregister agent: {str(e)}")


@router.post("/analyze/financial")
async def financial_analysis(
    query: str,
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
    context: dict[str, Any] | None = None,
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Perform financial analysis using specialized financial agent.
    """
    try:
        await _require_module_workspace_access(current_user, workspace_id)
        from ..agents.intelligence_hub.financial_agent import FinancialAgent

        # Create and initialize financial agent
        financial_agent = FinancialAgent({})
        await financial_agent.initialize()

        # Execute financial analysis
        result = await financial_agent.execute(query, context or {})

        # Clean up
        await financial_agent.close()

        return {"status": "success", "analysis": result, "timestamp": datetime.now().isoformat()}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Financial analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Financial analysis failed: {str(e)}")


@router.post("/analyze/academic")
async def academic_analysis(
    query: str,
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
    context: dict[str, Any] | None = None,
    agent_router: EnhancedAgentRouter = Depends(get_agent_router),
):
    """
    Perform academic research using specialized academic agent.
    """
    try:
        await _require_module_workspace_access(current_user, workspace_id)
        from ..agents.intelligence_hub.academic_agent import AcademicAgent

        # Create and initialize academic agent
        academic_agent = AcademicAgent({})
        await academic_agent.initialize()

        # Execute academic research
        result = await academic_agent.execute(query, context or {})

        # Clean up
        await academic_agent.close()

        return {"status": "success", "analysis": result, "timestamp": datetime.now().isoformat()}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Academic analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Academic analysis failed: {str(e)}")


@router.get("/systems")
async def get_system_info(current_user: dict = Depends(get_current_user)):
    """
    Get information about available agent systems and their status.
    """
    _ = current_user
    try:
        return {
            "status": "success",
            "systems": {
                "nexusai": {
                    "description": "Core NexusAI agents with LangGraph integration",
                    "agents": ["orchestrator", "retriever", "analyst", "critic", "writer"],
                    "status": "active",
                },
                "intelligence_hub": {
                    "description": (
                        "Specialized agents for financial, academic, and mathematical analysis"
                    ),
                    "agents": ["financial", "academic", "mathematical", "web_search", "youtube"],
                    "status": "active",
                },
                "deep_research": {
                    "description": "Hierarchical research system with DOK taxonomy",
                    "agents": ["research_analyst", "research_planner", "knowledge_consolidator"],
                    "status": "active",
                },
            },
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system info: {str(e)}")


@router.post("/research/deep")
async def deep_research(
    query: str,
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
    context: dict[str, Any] | None = None,
):
    """
    Perform deep research using the hierarchical DOK-taxonomy research system.
    """
    try:
        await _require_module_workspace_access(current_user, workspace_id)
        from ..agents.deep_research import DeepResearchAgent, KnowledgeConsolidator, ResearchPlanner

        agent = DeepResearchAgent()
        planner = ResearchPlanner()
        consolidator = KnowledgeConsolidator()

        plan = await planner.create_plan(query, context)
        result = await agent.execute(query, {"workspace_id": workspace_id, **(context or {})})
        consolidated = await consolidator.consolidate([result])

        return {
            "status": "success",
            "plan": plan,
            "research": result,
            "document": consolidated,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deep research error: {e}")
        raise HTTPException(status_code=500, detail=f"Deep research failed: {str(e)}")


@router.get("/health")
async def get_module_health():
    """
    Get health status of all modules.
    """
    try:
        health_status = {
            "status": "healthy",
            "modules": {
                "shared_components": "healthy",
                "intelligence_hub": "healthy",
                "deep_research": "healthy",
                "enhanced_api": "healthy",
            },
            "timestamp": datetime.now().isoformat(),
        }

        # Check if agent router has agents
        if hasattr(router, "agent_router") and router.agent_router.agents:
            health_status["agents_count"] = len(router.agent_router.agents)
        else:
            health_status["agents_count"] = 0

        return health_status

    except Exception as e:
        logger.error(f"Error getting health status: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}
