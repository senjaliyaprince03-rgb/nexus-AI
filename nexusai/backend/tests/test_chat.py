"""Chat API + streaming tests."""
from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from bson import ObjectId
from httpx import AsyncClient

from app.core.mongo import utc_now


def _make_sse_frames():
    frames = []
    frames.append(
        f'event: source\ndata: {json.dumps({"chunk_id": "c1", "document_filename": "doc.pdf", "content": "text", "score": 0.9, "page_number": 1, "chunk_index": 0, "document_id": "d1"})}\n\n'
    )
    for word in ["This ", "is ", "an ", "answer."]:
        frames.append(f'event: token\ndata: {json.dumps(word)}\n\n')
    frames.append(
        f'event: done\ndata: {json.dumps({"session_id": str(uuid.uuid4()), "confidence_score": 0.92, "source_chunk_ids": ["c1"], "token_count": 4})}\n\n'
    )
    return frames


@pytest.mark.asyncio
async def test_query_streams_events(client: AsyncClient, auth_headers, workspace):
    async def fake_stream(*args, **kwargs):
        for frame in _make_sse_frames():
            yield frame.encode()

    with patch("app.services.chat_service.stream_query", return_value=fake_stream()):
        res = await client.post(
            "/api/chat/query",
            headers=auth_headers,
            json={"question": "What is revenue?", "workspace_id": workspace.id},
        )
    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_query_requires_auth(client: AsyncClient, workspace):
    res = await client.post(
        "/api/chat/query",
        json={"question": "test", "workspace_id": workspace.id},
    )
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_query_rejects_workspace_mismatch(client: AsyncClient, auth_headers, db_session):
    other_workspace_id = ObjectId()
    await db_session.workspaces.insert_one(
        {
            "_id": other_workspace_id,
            "name": "Other",
            "slug": "other-workspace",
            "owner_id": None,
            "plan": "free",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    res = await client.post(
        "/api/chat/query",
        headers=auth_headers,
        json={"question": "test", "workspace_id": str(other_workspace_id)},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_list_sessions(client: AsyncClient, auth_headers):
    res = await client.get("/api/chat/sessions", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_delete_session(client: AsyncClient, auth_headers, db_session, user, workspace):
    session_id = ObjectId()
    await db_session.chat_sessions.insert_one(
        {
            "_id": session_id,
            "workspace_id": ObjectId(workspace.id),
            "user_id": ObjectId(user.id),
            "title": "Test",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )

    res = await client.delete(f"/api/chat/sessions/{session_id}", headers=auth_headers)
    assert res.status_code == 204


def test_sse_event_order():
    frames = _make_sse_frames()
    event_types = [f.split("\n")[0].replace("event: ", "") for f in frames]
    assert event_types[0] == "source"
    assert "token" in event_types
    assert event_types.index("source") < event_types.index("token")
    assert event_types[-1] == "done"
