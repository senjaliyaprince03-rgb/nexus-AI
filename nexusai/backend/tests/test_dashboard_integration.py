from __future__ import annotations

from bson import ObjectId
from httpx import AsyncClient
import pytest

from app.core.mongo import utc_now
from app.services.mongo_store import store


@pytest.mark.asyncio
async def test_integrations_projects_are_sanitized(client: AsyncClient, auth_headers):
    res = await client.get("/api/integrations/projects?check_health=false", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["summary"]["project_count"] == 6
    assert body["summary"]["capability_count"] >= 30
    assert all(project["id"] != "personal-nexusai-isolated" for project in body["projects"])
    assert "local_path" not in body["projects"][0]
    assert "source_url" not in body["projects"][0]
    assert body["projects"][0]["native_href"].startswith("/dashboard")


@pytest.mark.asyncio
async def test_integrations_require_auth(client: AsyncClient):
    res = await client.get("/api/integrations/projects?check_health=false")
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_dashboard_overview_aggregates_workspace_data(client: AsyncClient, auth_headers, workspace, user):
    workspace_oid = ObjectId(workspace.id)
    user_oid = ObjectId(user.id)
    document = await store.create_document(
        workspace_id=workspace_oid,
        owner_id=user_oid,
        filename="strategy.pdf",
        file_type="application/pdf",
        file_size_bytes=2048,
        s3_key="static://strategy.pdf",
    )
    await store.update_document_status(document["_id"], "ready", chunk_count=4)
    await store.append_chat_message(
        session_id=ObjectId(),
        workspace_id=workspace_oid,
        user_id=user_oid,
        role="assistant",
        content="The latest answer is grounded in strategy.pdf.",
        confidence_score=0.91,
    )
    await store.log_event(
        workspace_id=workspace_oid,
        user_id=user_oid,
        event_type="query",
        payload={"latency_ms": 840},
    )
    await store.agent_runs.insert_one(
        {
            "_id": ObjectId(),
            "workspace_id": workspace_oid,
            "user_id": user_oid,
            "agent_type": "research",
            "input": {"question": "Summarize strategy"},
            "output": {"answer": "Research report ready."},
            "status": "complete",
            "confidence": 0.87,
            "citations": [],
            "error": None,
            "steps": [],
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )

    res = await client.get("/api/dashboard/overview?check_health=false", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["workspace"]["id"] == workspace.id
    assert body["health"]["project_count"] == 6
    assert body["metrics"][0]["value"] == 1
    assert body["metrics"][1]["value"] == 1
    assert body["metrics"][2]["value"] == 89
    assert len(body["workflow"]) == 5
    assert len(body["projects"]) == 6
    assert any(output["id"] == "citations" for output in body["outputs"])


@pytest.mark.asyncio
async def test_dashboard_overview_requires_auth(client: AsyncClient):
    res = await client.get("/api/dashboard/overview?check_health=false")
    assert res.status_code in (401, 403)
