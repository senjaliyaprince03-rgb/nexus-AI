"""Agent run management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.ai.multi_agent_hub import list_hub_agents, resolve_agent_type
from app.api.deps import ensure_workspace_access, get_current_user, require_workspace
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.schemas import AgentRunRequest
from app.services.mongo_store import store

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/catalog")
async def agent_catalog(user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)
    return {"agents": list_hub_agents()}


@router.post("/run", status_code=202, dependencies=[Depends(rate_limit(10, 60))])
async def run_agent(
    body: AgentRunRequest,
    user: dict = Depends(get_current_user),
):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="question is required")
    try:
        agent_type = resolve_agent_type(body.agent_type, question)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)

    agent_run = await store.create_agent_run(
        workspace_id=workspace_id,
        user_id=user["_id"],
        agent_type=agent_type,
        input_payload={
            "question": question,
            "top_k": body.top_k,
            "requested_agent_type": body.agent_type,
            "agent_type": agent_type,
            "resource_url": body.resource_url,
        },
    )

    if settings.use_mongo_mock or settings.environment == "development":
        from app.workers.agent_run import _run_agent

        try:
            await store.update_agent_run(agent_run["_id"], status="running")
            result = await _run_agent(
                question=question,
                workspace_id=str(workspace_id),
                top_k=body.top_k,
                agent_type=agent_type,
                resource_url=body.resource_url,
            )
            await store.update_agent_run(
                agent_run["_id"],
                status="complete",
                output=result,
                confidence=result.get("confidence_score"),
                citations=result.get("citations", []),
                steps=result.get("steps", []),
            )
        except Exception as exc:
            await store.update_agent_run(agent_run["_id"], status="failed", error=str(exc))
            raise HTTPException(
                status_code=500,
                detail="Agent run failed. Check backend configuration and try again.",
            ) from exc
    else:
        from app.workers.agent_run import run_agent_task

        run_agent_task.delay(
            run_id=str(agent_run["_id"]),
            question=question,
            workspace_id=str(workspace_id),
            user_id=str(user["_id"]),
            top_k=body.top_k,
            agent_type=agent_type,
            resource_url=body.resource_url,
        )
    return {"run_id": str(agent_run["_id"]), "status": "queued", "agent_type": agent_type}


@router.get("/runs/{run_id}/status")
async def run_status(run_id: str, user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)
    agent_run = await store.get_agent_run(run_id, workspace_id=workspace_id)
    if not agent_run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "run_id": run_id,
        "status": agent_run["status"],
        "agent_type": agent_run.get("agent_type", "rag"),
    }


@router.get("/runs/{run_id}/result")
async def run_result(run_id: str, user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)
    agent_run = await store.get_agent_run(run_id, workspace_id=workspace_id)
    if not agent_run:
        raise HTTPException(status_code=404, detail="Result not found or run still in progress")
    if agent_run["status"] == "failed":
        return {"error": agent_run.get("error") or "Agent run failed"}
    if agent_run["status"] not in {"complete", "failed"}:
        raise HTTPException(status_code=404, detail="Result not found or run still in progress")
    return {
        "answer": (agent_run.get("output") or {}).get("answer", ""),
        "citations": agent_run.get("citations") or [],
        "confidence_score": agent_run.get("confidence"),
        "steps": (agent_run.get("output") or {}).get("steps", []),
        "agent_type": agent_run.get("agent_type", "rag"),
        "agent_name": (agent_run.get("output") or {}).get("agent_name"),
        "run_id": run_id,
        "workspace_id": str(agent_run["workspace_id"]),
    }


@router.get("/runs")
async def list_runs(user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)
    runs = await store.list_agent_runs(workspace_id=workspace_id, limit=25)
    return {"runs": [store.agent_run_to_public(run) for run in runs]}
