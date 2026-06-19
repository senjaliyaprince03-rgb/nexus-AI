"""Agent HTTP API tests."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from bson import ObjectId
from httpx import AsyncClient

from app.core.mongo import utc_now


@pytest.mark.asyncio
async def test_run_agent_returns_run_id(
    client: AsyncClient, auth_headers: dict, workspace
) -> None:
    with patch("app.workers.agent_run._run_agent") as mock_run:
        mock_run.return_value = {
            "answer": "Summarised risks",
            "confidence_score": 0.9,
            "citations": [],
            "steps": [],
        }
        resp = await client.post(
            "/api/agents/run",
            json={"question": "Summarise risks"},
            headers=auth_headers,
        )
    assert resp.status_code == 202
    data = resp.json()
    assert "run_id" in data
    assert data["status"] == "queued"
    assert data["agent_type"] == "general"


@pytest.mark.asyncio
async def test_agent_catalog_lists_integrated_upstream_agents(
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    resp = await client.get("/api/agents/catalog", headers=auth_headers)
    assert resp.status_code == 200
    agent_ids = {agent["id"] for agent in resp.json()["agents"]}
    assert {
        "web",
        "finance",
        "research",
        "math",
        "wiki",
        "news",
        "youtube",
        "rag_memory",
    }.issubset(agent_ids)


@pytest.mark.asyncio
async def test_math_agent_completes_without_external_tools(
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    resp = await client.post(
        "/api/agents/run",
        json={"question": "Calculate 12 * 8 + 4", "agent_type": "math"},
        headers=auth_headers,
    )
    assert resp.status_code == 202
    run_id = resp.json()["run_id"]

    result = await client.get(f"/api/agents/runs/{run_id}/result", headers=auth_headers)
    assert result.status_code == 200
    payload = result.json()
    assert payload["agent_type"] == "math"
    assert "100" in payload["answer"]


@pytest.mark.asyncio
async def test_run_status_not_found(client: AsyncClient, auth_headers: dict) -> None:
    resp = await client.get(f"/api/agents/runs/{uuid.uuid4()}/status", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_agents_require_auth(client: AsyncClient) -> None:
    resp = await client.post("/api/agents/run", json={"question": "x"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_agent_run_history_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/agents/runs")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_agent_run_history_lists_workspace_runs(
    client: AsyncClient,
    auth_headers: dict,
    db_session,
    workspace,
    user,
) -> None:
    run_id = ObjectId()
    await db_session.agent_runs.insert_one(
        {
            "_id": run_id,
            "workspace_id": ObjectId(workspace.id),
            "user_id": ObjectId(user.id),
            "agent_type": "general",
            "input": {"question": "hello"},
            "output": {"answer": "world"},
            "status": "complete",
            "confidence": 0.75,
            "citations": [],
            "error": None,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )

    resp = await client.get("/api/agents/runs", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["runs"][0]["id"] == str(run_id)


@pytest.mark.asyncio
async def test_module_routes_require_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/modules/systems")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_module_deep_research_rejects_cross_workspace(
    client: AsyncClient,
    auth_headers: dict,
    db_session,
) -> None:
    other_workspace_id = ObjectId()
    await db_session.workspaces.insert_one(
        {
            "_id": other_workspace_id,
            "name": "Other Workspace",
            "slug": "other-workspace",
            "owner_id": ObjectId(),
            "plan": "free",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )

    resp = await client.post(
        f"/api/modules/research/deep?query=test&workspace_id={other_workspace_id}",
        headers=auth_headers,
    )

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_billing_checkout_fails_safely_when_stripe_unconfigured(
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    resp = await client.post(
        "/api/billing/checkout",
        json={"plan": "pro", "interval": "monthly"},
        headers=auth_headers,
    )

    assert resp.status_code == 503
    assert "Billing is not configured" in resp.json()["detail"]
