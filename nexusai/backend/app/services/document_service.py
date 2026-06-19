"""Document service — MongoDB-backed upload, list, delete, and re-ingest."""
from __future__ import annotations

import re
import uuid
from pathlib import PurePath

from fastapi import HTTPException, UploadFile, status

from app.core.file_validation import validate_upload
from app.services.mongo_store import store
from app.utils.storage import delete_file_from_storage, public_storage_url, upload_file_to_storage
from app.workers.ingestion import ingest_document_task

_FILENAME_SAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_storage_filename(filename: str | None) -> str:
    raw = (filename or "").replace("\\", "/")
    leaf = PurePath(raw).name.strip().strip(".")
    if not leaf:
        return "upload.bin"
    safe = _FILENAME_SAFE_CHARS.sub("_", leaf)
    safe = re.sub(r"_+", "_", safe).strip("._")
    return safe or "upload.bin"


async def upload_document(file: UploadFile, workspace_id, user_id, session=None):  # noqa: ANN001
    content = await validate_upload(file)
    safe_filename = _sanitize_storage_filename(file.filename)
    storage_key = f"{workspace_id}/{uuid.uuid4()}/{safe_filename}"
    await upload_file_to_storage(
        key=storage_key,
        data=content,
        content_type=file.content_type or "application/octet-stream",
    )
    file_url = public_storage_url(storage_key)
    doc = await store.create_document(
        workspace_id=workspace_id,
        owner_id=user_id,
        filename=safe_filename,
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(content),
        s3_key=file_url,
    )
    ingest_document_task.delay(document_id=str(doc["_id"]), s3_key=file_url, workspace_id=str(workspace_id))
    return store.document_to_public(doc)


async def reingest_document(document_id, workspace_id, session=None):  # noqa: ANN001
    document = await store.get_document(document_id, workspace_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.get("status") == "processing":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document is currently being processed. Wait for it to finish.")
    await store.update_document_status(document_id, "processing", chunk_count=0, error_message=None)
    ingest_document_task.delay(document_id=str(document_id), s3_key=document["s3_key"], workspace_id=str(workspace_id))
    return {"id": str(document_id), "filename": document["filename"], "status": "processing", "message": "Re-ingestion started. Old chunks deleted."}


async def list_documents(workspace_id, session=None, page: int = 1, page_size: int = 20, search: str | None = None, status_filter: str | None = None):  # noqa: ANN001
    return await store.list_documents(workspace_id=workspace_id, page=page, page_size=page_size, search=search, status=status_filter)


async def delete_document(document_id, workspace_id, session=None):  # noqa: ANN001
    document = await store.get_document(document_id, workspace_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    try:
        await delete_file_from_storage(document["s3_key"])
    except Exception:
        pass
    await store.soft_delete_document(document_id)
