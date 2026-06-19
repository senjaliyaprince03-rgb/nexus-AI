"""Chat routes: streaming RAG query + session history."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user, require_workspace
from app.core.rate_limit import rate_limit
from app.schemas import QueryRequest
from app.services.chat_service import stream_query
from app.services.mongo_store import store

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", dependencies=[Depends(rate_limit(20, 60))])
async def query(
    body: QueryRequest,
    user: dict = Depends(get_current_user),
):
    if not await store.user_has_workspace_access(user["_id"], body.workspace_id):
        raise HTTPException(status_code=403, detail="Workspace access denied")
    return StreamingResponse(
        stream_query(body, user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    sessions = await store.list_chat_sessions(workspace_id=workspace_id, user_id=user["_id"], limit=50)
    return [
        {
            "id": str(session["_id"]),
            "title": session["title"],
            "workspace_id": str(session["workspace_id"]),
            "created_at": session["created_at"].isoformat() if hasattr(session["created_at"], "isoformat") else session["created_at"],
            "updated_at": session["updated_at"].isoformat() if hasattr(session["updated_at"], "isoformat") else session["updated_at"],
            "mode": session.get("mode", "document"),
            "metadata": session.get("metadata", {}),
        }
        for session in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    chat_session = await store.get_chat_session(session_id, workspace_id=workspace_id, user_id=user["_id"])
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await store.get_chat_messages(session_id)
    return {
        "id": str(chat_session["_id"]),
        "title": chat_session["title"],
        "messages": [
            {
                "id": str(message["_id"]),
                "role": message["role"],
                "content": message["content"],
                "source_chunk_ids": message.get("source_chunk_ids", []),
                "confidence_score": message.get("confidence_score"),
                "mode": message.get("mode", "document"),
                "metadata": message.get("metadata", {}),
                "created_at": message["created_at"].isoformat() if hasattr(message["created_at"], "isoformat") else message["created_at"],
            }
            for message in messages
        ],
    }


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    chat_session = await store.get_chat_session(session_id, workspace_id=workspace_id, user_id=user["_id"])
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")
    await store.chat_messages.delete_many({"session_id": chat_session["_id"]})
    await store.chat_sessions.delete_one({"_id": chat_session["_id"]})
