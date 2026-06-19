"""Support-agent API and streaming tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.ai.support_rag import stream_support_rag
from app.services.mongo_store import store


@pytest.mark.asyncio
async def test_support_stream_uses_faq_fallback_when_docs_missing(workspace):
    with patch("app.ai.support_rag.hybrid_retrieve", new=AsyncMock(return_value=[])), patch(
        "app.ai.support_rag.settings.use_mongo_mock", True
    ):
        frames = []
        async for frame in stream_support_rag(
            "How do I fix account verification?",
            workspace.id,
            "session-1",
            support_intent="account",
        ):
            frames.append(frame)

    assert any("event: source" in frame and "support-faq" in frame for frame in frames)
    assert any("event: token" in frame for frame in frames)
    assert any("event: done" in frame and '"mode": "support"' in frame for frame in frames)


@pytest.mark.asyncio
async def test_support_feedback_and_metrics(client: AsyncClient, auth_headers, workspace, user):
    await store.log_event(
        workspace_id=workspace.id,
        user_id=user.id,
        event_type="support_query",
        payload={
            "fallback": True,
            "latency_ms": 420,
            "source_coverage": {"faq": 2, "workspace_docs": 1},
        },
    )

    feedback = await client.post(
        "/api/support/feedback",
        headers=auth_headers,
        json={"rating": "up", "support_intent": "technical"},
    )
    assert feedback.status_code == 200
    assert feedback.json()["ok"] is True

    metrics = await client.get("/api/support/metrics", headers=auth_headers)
    assert metrics.status_code == 200
    body = metrics.json()
    assert body["queries"] == 1
    assert body["fallback_rate"] == 1
    assert body["csat"] == 1
    assert body["avg_response_ms"] == 420
    assert body["source_coverage"]["faq"] == 2
