"""Support-agent chat, feedback, and metrics routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import get_current_user, require_workspace
from app.core.langsmith_tracing import add_feedback
from app.core.mongo import to_object_id
from app.core.rate_limit import rate_limit
from app.schemas import SupportFeedbackRequest
from app.services.mongo_store import store
from app.services.support_agent import stream_support_chat

router = APIRouter(prefix="/support", tags=["support"])


class ChatMessageDict(BaseModel):
    role: str
    content: str


class SupportQueryRequest(BaseModel):
    prompt: str
    history: list[ChatMessageDict] | None = None


@router.post("/chat", dependencies=[Depends(rate_limit(10, 60))])
async def support_chat(
    body: SupportQueryRequest,
    user: dict = Depends(get_current_user),
):
    """Chat with the NexusAI Support Agent."""
    history_dicts = [msg.model_dump() for msg in body.history] if body.history else None
    
    return StreamingResponse(
        stream_support_chat(body.prompt, history_dicts),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/feedback")
async def record_feedback(
    body: SupportFeedbackRequest,
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    if body.session_id:
        chat_session = await store.get_chat_session(body.session_id, workspace_id=workspace_id, user_id=user["_id"])
        if not chat_session:
            raise HTTPException(status_code=404, detail="Support session not found")

    score = 1.0 if body.rating == "up" else 0.0
    await store.log_event(
        workspace_id=workspace_id,
        user_id=user["_id"],
        event_type="support_feedback",
        payload={
            "session_id": body.session_id,
            "message_id": body.message_id,
            "rating": body.rating,
            "score": score,
            "comment": body.comment or "",
            "support_intent": body.support_intent or "other",
        },
    )

    if body.run_id:
        add_feedback(body.run_id, score, body.comment or "")

    return {"ok": True, "message": "Feedback recorded"}


@router.get("/metrics")
async def support_metrics(user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    query_cursor = store.analytics_events.find(
        {"workspace_id": to_object_id(workspace_id), "event_type": "support_query"}
    )
    feedback_cursor = store.analytics_events.find(
        {"workspace_id": to_object_id(workspace_id), "event_type": "support_feedback"}
    )

    query_count = 0
    fallback_count = 0
    latency_total = 0
    faq_sources = 0
    workspace_sources = 0
    async for event in query_cursor:
        payload = event.get("payload", {})
        query_count += 1
        fallback_count += 1 if payload.get("fallback") else 0
        latency_total += int(payload.get("latency_ms", 0) or 0)
        coverage = payload.get("source_coverage", {}) if isinstance(payload.get("source_coverage"), dict) else {}
        faq_sources += int(coverage.get("faq", 0) or 0)
        workspace_sources += int(coverage.get("workspace_docs", 0) or 0)

    feedback_count = 0
    positive_count = 0
    async for event in feedback_cursor:
        payload = event.get("payload", {})
        feedback_count += 1
        positive_count += 1 if payload.get("rating") == "up" else 0

    total_sources = faq_sources + workspace_sources
    return {
        "queries": query_count,
        "fallback_rate": round(fallback_count / query_count, 4) if query_count else 0.0,
        "csat": round(positive_count / feedback_count, 4) if feedback_count else None,
        "avg_response_ms": round(latency_total / query_count) if query_count else 0,
        "source_coverage": {
            "faq": faq_sources,
            "workspace_docs": workspace_sources,
            "workspace_doc_ratio": round(workspace_sources / total_sources, 4) if total_sources else 0.0,
        },
    }
