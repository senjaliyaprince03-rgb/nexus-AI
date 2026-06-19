"""Analytics routes: metrics + live WebSocket event stream."""
from __future__ import annotations

import json
import re

import structlog
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status

from app.api.deps import get_current_user, require_workspace
from app.core.redis import get_redis_pool
from app.core.security import decode_token
from app.services import analytics_service
from app.services.mongo_store import store

router = APIRouter(prefix="/analytics", tags=["analytics"])
log = structlog.get_logger(__name__)

_ALLOWED_EVENTS: frozenset[str] = frozenset({
    "query", "document_upload", "document_ready", "document_failed",
    "agent_run", "user_login", "workspace_update", "support_query", "support_feedback",
})

_UNSAFE_RE = re.compile(r"[<>\"'&]|[\x00-\x1f\x7f]")


def _sanitise_str(value: str, max_length: int = 256) -> str:
    return _UNSAFE_RE.sub("", value)[:max_length]


def _validate_and_sanitise(raw: str) -> str | None:
    try:
        obj = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return None
    if not isinstance(obj, dict):
        return None
    event = obj.get("event", "")
    if not isinstance(event, str) or event not in _ALLOWED_EVENTS:
        return None
    safe: dict = {}
    for key, value in obj.items():
        if not isinstance(key, str):
            continue
        if isinstance(value, str):
            safe[key] = _sanitise_str(value)
        elif isinstance(value, (int, float, bool)) or value is None:
            safe[key] = value
    return json.dumps(safe, ensure_ascii=False)


@router.get("/queries")
async def query_volume(
    days: int = 30,
    user: dict = Depends(get_current_user),
):
    return await analytics_service.get_query_volume(require_workspace(user), days)


@router.get("/documents/usage")
async def document_usage(
    user: dict = Depends(get_current_user),
):
    return await analytics_service.get_document_usage(require_workspace(user))


@router.websocket("/ws")
async def analytics_ws(websocket: WebSocket):
    try:
        user = await _resolve_websocket_user(websocket)
    except HTTPException:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    pubsub = None
    try:
        r = await get_redis_pool()
        pubsub = r.pubsub()
        await pubsub.subscribe(f"analytics:{require_workspace(user)}")
        async for message in pubsub.listen():
            if message["type"] == "message":
                safe = _validate_and_sanitise(message["data"])
                if safe is not None:
                    await websocket.send_text(safe)
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001
        log.warning("analytics.ws_unavailable", reason=str(exc))
        try:
            await websocket.close(code=1000)
        except Exception:  # noqa: BLE001
            pass
    finally:
        if pubsub is not None:
            try:
                await pubsub.unsubscribe()
            except Exception:  # noqa: BLE001
                pass
            try:
                await pubsub.aclose()
            except Exception:  # noqa: BLE001
                pass


async def _resolve_websocket_user(websocket: WebSocket) -> dict:
    token = (
        websocket.query_params.get("token")
        or websocket.cookies.get("nexusai_access")
        or websocket.headers.get("authorization", "").removeprefix("Bearer ").strip()
    )
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc
    user = await store.get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user
