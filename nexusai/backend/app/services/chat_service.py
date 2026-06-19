"""Chat service: streaming RAG query + session persistence."""
from __future__ import annotations

import json
import time
from collections.abc import AsyncGenerator

from fastapi import HTTPException

from app.ai.rag import _sse, stream_rag
from app.ai.support_rag import stream_support_rag
from app.schemas import QueryRequest
from app.services.mongo_store import AccessDeniedError, NotFoundError, store


async def stream_query(body: QueryRequest, user: dict) -> AsyncGenerator[str, None]:
    workspace_id = body.workspace_id
    if not await store.user_has_workspace_access(user["_id"], workspace_id):
        raise HTTPException(status_code=403, detail="Workspace access denied")

    chat_session = None
    if body.session_id:
        chat_session = await store.get_chat_session(body.session_id, workspace_id=workspace_id, user_id=user["_id"])
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        chat_session = await store.create_chat_session(
            workspace_id=workspace_id,
            user_id=user["_id"],
            title=body.question[:60],
            mode=body.mode,
            metadata={
                "support_intent": body.support_intent,
                "source_policy": body.source_policy,
            } if body.mode == "support" else {},
        )

    await store.append_chat_message(
        session_id=chat_session["_id"],
        workspace_id=workspace_id,
        user_id=user["_id"],
        role="user",
        content=body.question,
        mode=body.mode,
        metadata={
            "support_intent": body.support_intent,
            "source_policy": body.source_policy,
        } if body.mode == "support" else {},
    )

    full_content = ""
    source_chunk_ids: list[str] = []
    confidence = 0.0
    done_metadata: dict = {}
    started_at = time.perf_counter()

    try:
        if getattr(body, "use_agents", False):
            async def _agent_stream() -> AsyncGenerator[str, None]:
                from app.ai.multi_agent_hub import run_multi_agent_hub_query
                
                result = await run_multi_agent_hub_query(
                    question=body.question,
                    workspace_id=workspace_id,
                    top_k=body.top_k
                )
                
                # Stream the final answer as a single token (or we could chunk it, but this works)
                answer = result.get("answer", "")
                if answer:
                    yield f"event: token\ndata: {json.dumps(answer)}\n\n"
                
                # Stream citations if any
                for citation in result.get("citations", []):
                    yield f"event: source\ndata: {json.dumps(citation)}\n\n"
                
                # Stream done event
                done_meta = {
                    "agent_type": result.get("agent_type"),
                    "agent_name": result.get("agent_name"),
                    "confidence_score": result.get("confidence_score"),
                    "steps": result.get("steps")
                }
                yield f"event: done\ndata: {json.dumps(done_meta)}\n\n"
            
            stream = _agent_stream()
        else:
            stream = (
                stream_support_rag(
                    question=body.question,
                    workspace_id=workspace_id,
                    session_id=str(chat_session["_id"]),
                    top_k=body.top_k,
                    support_intent=body.support_intent,
                    source_policy=body.source_policy,
                )
                if body.mode == "support"
                else stream_rag(
                    question=body.question,
                    workspace_id=workspace_id,
                    session_id=str(chat_session["_id"]),
                    top_k=body.top_k,
                )
            )
        async for frame in stream:
            if frame.startswith("event: token"):
                try:
                    data = json.loads(frame.split("data: ", 1)[1].strip())
                    full_content += data
                except Exception as e:
                    import structlog
                    structlog.get_logger(__name__).warning("chat.frame_parse_failed", error=str(e), frame=frame[:200])
            elif frame.startswith("event: source"):
                try:
                    data = json.loads(frame.split("data: ", 1)[1].strip())
                    chunk_id = data.get("chunk_id", "")
                    if isinstance(chunk_id, str) and chunk_id:
                        source_chunk_ids.append(chunk_id)
                except Exception as e:
                    import structlog
                    structlog.get_logger(__name__).warning("chat.frame_parse_failed", error=str(e), frame=frame[:200])
            elif frame.startswith("event: done"):
                try:
                    data = json.loads(frame.split("data: ", 1)[1].strip())
                    done_metadata = data if isinstance(data, dict) else {}
                    raw_score = data.get("confidence_score", 0.0)
                    confidence = float(raw_score) if isinstance(raw_score, (int, float)) else 0.0
                except Exception as e:
                    import structlog
                    structlog.get_logger(__name__).warning("chat.frame_parse_failed", error=str(e), frame=frame[:200])
            yield frame
    finally:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        if full_content:
            await store.append_chat_message(
                session_id=chat_session["_id"],
                workspace_id=workspace_id,
                user_id=user["_id"],
                role="assistant",
                content=full_content,
                source_chunk_ids=source_chunk_ids,
                confidence_score=confidence,
                mode=body.mode,
                metadata={
                    "support_intent": body.support_intent,
                    "source_policy": body.source_policy,
                    "latency_ms": elapsed_ms,
                    **done_metadata,
                } if body.mode == "support" else {},
            )
        if body.mode == "support":
            await store.log_event(
                workspace_id=workspace_id,
                user_id=user["_id"],
                event_type="support_query",
                payload={
                    "support_intent": body.support_intent or "other",
                    "source_policy": body.source_policy,
                    "confidence_score": confidence,
                    "latency_ms": elapsed_ms,
                    "fallback": bool(done_metadata.get("fallback")),
                    "source_coverage": done_metadata.get("source_coverage", {}),
                },
            )
