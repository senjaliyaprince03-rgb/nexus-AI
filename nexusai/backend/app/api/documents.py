"""Document management routes."""
from __future__ import annotations

import asyncio
import json
import re
import uuid
from pathlib import PurePath

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.api.deps import ensure_workspace_access, get_current_user, require_workspace
from app.core.file_validation import validate_upload
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.schemas import DocumentUploadResponse
from app.services.mongo_store import store
from app.utils.storage import delete_file_from_storage, public_storage_url, upload_file_to_storage
from app.workers.ingestion import _ingest, ingest_document_task

router = APIRouter(prefix="/documents", tags=["documents"])

_FILENAME_SAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_storage_filename(filename: str | None) -> str:
    raw = (filename or "").replace("\\", "/")
    leaf = PurePath(raw).name.strip().strip(".")
    if not leaf:
        return "upload.bin"
    safe = _FILENAME_SAFE_CHARS.sub("_", leaf)
    safe = re.sub(r"_+", "_", safe).strip("._")
    return safe or "upload.bin"


@router.post("/upload", status_code=202, dependencies=[Depends(rate_limit(10, 60))])
async def upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    content = await validate_upload(file)
    safe_filename = _sanitize_storage_filename(file.filename)
    storage_key = f"{workspace_id}/{uuid.uuid4()}/{safe_filename}"
    await upload_file_to_storage(
        key=storage_key,
        data=content,
        content_type=file.content_type or "application/octet-stream",
    )
    file_url = public_storage_url(storage_key)
    document = await store.create_document(
        workspace_id=workspace_id,
        owner_id=user["_id"],
        filename=safe_filename,
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(content),
        s3_key=file_url,
    )
    if settings.use_mongo_mock:
        class _NoRetry:
            def retry(self, exc):  # type: ignore[no-untyped-def]
                raise exc

        await _ingest(_NoRetry(), str(document["_id"]), file_url, str(workspace_id))
    else:
        ingest_document_task.delay(
            document_id=str(document["_id"]),
            s3_key=file_url,
            workspace_id=str(workspace_id),
        )
    return DocumentUploadResponse(id=str(document["_id"]), filename=safe_filename, status=document["status"])


@router.get("/")
async def list_docs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    await ensure_workspace_access(user, workspace_id)
    allowed_statuses = {"pending", "processing", "ready", "failed"}
    if status and status not in allowed_statuses:
        raise HTTPException(
            status_code=422,
            detail="Invalid status. Expected one of: pending, processing, ready, failed.",
        )
    return await store.list_documents(workspace_id=workspace_id, page=page, page_size=page_size, search=search, status=status)


@router.delete("/{doc_id}", status_code=204)
async def delete_doc(
    doc_id: str,
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    document = await store.get_document(doc_id, workspace_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        await delete_file_from_storage(document["s3_key"])
    except Exception as exc:
        import structlog
        structlog.get_logger(__name__).error("document.delete_storage_failed", doc_id=doc_id, error=str(exc))
    await store.soft_delete_document(doc_id)


@router.post("/{doc_id}/reingest")
async def reingest(
    doc_id: str,
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    document = await store.get_document(doc_id, workspace_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    await store.update_document_status(doc_id, "processing", chunk_count=0, error_message=None)
    await store.delete_document_chunks(doc_id)
    if settings.use_mongo_mock:
        class _NoRetry:
            def retry(self, exc):  # type: ignore[no-untyped-def]
                raise exc

        await _ingest(_NoRetry(), str(doc_id), document["s3_key"], str(workspace_id))
    else:
        ingest_document_task.delay(
            document_id=str(doc_id),
            s3_key=document["s3_key"],
            workspace_id=str(workspace_id),
        )
    return DocumentUploadResponse(id=str(doc_id), filename=document["filename"], status="processing", message="Re-ingestion started. Old chunks deleted.")


@router.get("/{doc_id}/progress")
async def ingestion_progress(doc_id: str, user: dict = Depends(get_current_user)):
    """SSE stream of ingestion progress events from Redis pub/sub."""
    from app.core.redis import get_redis_pool

    channel = f"ingestion:progress:{doc_id}"

    async def generate():
        pubsub = None
        try:
            r = await get_redis_pool()
            pubsub = r.pubsub()
            import asyncio
            await pubsub.subscribe(channel)
            while True:
                try:
                    message = await asyncio.wait_for(pubsub.get_message(ignore_subscribe_messages=True, timeout=15.0), timeout=15.0)
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
                    continue

                if message is None:
                    yield ": keep-alive\n\n"
                    continue

                if message["type"] == "message":
                    data = message["data"]
                    yield f"event: progress\ndata: {data}\n\n"
                    try:
                        parsed = json.loads(data)
                        if parsed.get("event") in ("complete", "error"):
                            break
                    except (json.JSONDecodeError, AttributeError):
                        pass
        except Exception:
            return
        finally:
            if pubsub is not None:
                try:
                    await pubsub.unsubscribe(channel)
                except Exception as e:
                    import structlog
                    structlog.get_logger(__name__).warning("sse.unsubscribe_failed", error=str(e))
                try:
                    await pubsub.aclose()
                except Exception as e:
                    import structlog
                    structlog.get_logger(__name__).warning("sse.aclose_failed", error=str(e))

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
