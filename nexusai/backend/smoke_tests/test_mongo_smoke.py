from __future__ import annotations

import io
import time
import uuid

from fastapi.testclient import TestClient

from app.main import app


def _client() -> TestClient:
    return TestClient(app)


def _unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def _register_user(client: TestClient, email: str):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Passw0rd!123", "name": "Smoke User"},
    )
    assert response.status_code == 201
    payload = response.json()
    headers = {"Authorization": f"Bearer {payload['access_token']}"}
    cookies = response.cookies
    return payload, headers, cookies


def test_auth_refresh_and_me():
    client = _client()
    _, headers, cookies = _register_user(client, _unique_email("refresh"))

    refresh_token = cookies.get("nexusai_refresh")
    assert refresh_token

    refresh_response = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()

    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["user"]["email"].endswith("@example.com")
    assert me_response.json()["workspace"]["id"]


def test_document_chat_and_agent_flow():
    client = _client()
    registration, headers, cookies = _register_user(client, _unique_email("flow"))
    workspace_id = registration["workspace"]["id"]

    upload_response = client.post(
        "/api/documents/upload",
        files={"file": ("smoke.txt", io.BytesIO(b"Hello NexusAI. This is a smoke test document."), "text/plain")},
        headers=headers,
        cookies=cookies,
        data={"workspace_id": workspace_id},
    )
    assert upload_response.status_code == 202

    for _ in range(20):
        document_response = client.get("/api/documents/", headers=headers, cookies=cookies)
        items = document_response.json()["items"]
        if items and items[0]["status"] == "ready":
            break
        time.sleep(0.5)

    assert document_response.status_code == 200
    assert document_response.json()["items"][0]["chunk_count"] == 1

    chat_response = client.post(
        "/api/chat/query",
        json={"question": "What does the document say?", "workspace_id": workspace_id},
        headers=headers,
        cookies=cookies,
    )
    assert chat_response.status_code == 200
    assert "event: done" in chat_response.text

    sessions_response = client.get("/api/chat/sessions", headers=headers, cookies=cookies)
    assert sessions_response.status_code == 200
    assert len(sessions_response.json()) >= 1

    agent_response = client.post(
        "/api/agents/run",
        json={"question": "Summarize the document.", "top_k": 3},
        headers=headers,
        cookies=cookies,
    )
    assert agent_response.status_code == 202
    run_id = agent_response.json()["run_id"]

    for _ in range(20):
        status_response = client.get(f"/api/agents/runs/{run_id}/status", headers=headers, cookies=cookies)
        if status_response.json()["status"] == "complete":
            break
        time.sleep(0.5)

    result_response = client.get(f"/api/agents/runs/{run_id}/result", headers=headers, cookies=cookies)
    assert result_response.status_code == 200
    assert result_response.json()["answer"]
    assert result_response.json()["citations"]


def test_dashboard_analytics_endpoints_return_stable_shapes():
    client = _client()
    _, headers, cookies = _register_user(client, _unique_email("analytics"))

    queries_response = client.get("/api/analytics/queries", headers=headers, cookies=cookies)
    assert queries_response.status_code == 200
    assert isinstance(queries_response.json(), list)

    usage_response = client.get("/api/analytics/documents/usage", headers=headers, cookies=cookies)
    assert usage_response.status_code == 200
    assert isinstance(usage_response.json(), list)
