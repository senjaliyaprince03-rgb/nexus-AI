"""MongoDB reindex workers."""
from __future__ import annotations

import asyncio
from typing import Any

import redis.asyncio as aioredis
import structlog
from bson import ObjectId

from app.ai.embeddings import embed_texts
from app.core.config import settings
from app.core.mongo import to_object_id, utc_now
from app.services.mongo_store import store
from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

BATCH_SIZE = 64
PROGRESS_KEY = "reindex:progress:{job_id}"
PROGRESS_TTL = 7200


@celery_app.task(
    name="app.workers.reindex.reindex_workspace_task",
    bind=True,
    max_retries=0,
    soft_time_limit=600,
    time_limit=660,
)
def reindex_workspace_task(self: Any, workspace_id: str, job_id: str, new_model: str | None = None) -> dict[str, int]:
    log.info("reindex.started", workspace_id=workspace_id, job_id=job_id)
    return asyncio.run(_reindex(workspace_id, job_id, new_model))


@celery_app.task(
    name="app.workers.reindex.reindex_document",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    soft_time_limit=300,
    time_limit=360,
)
def reindex_document(self: Any, document_id: str, workspace_id: str) -> dict[str, Any]:
    log.info("reindex_document.started", document_id=document_id)
    from app.workers.ingestion import ingest_document_task

    async def _get_s3_key() -> str:
        document = await store.get_document(document_id, workspace_id)
        if not document:
            raise ValueError("Document not found")
        return document["s3_key"]

    try:
        s3_key = asyncio.run(_get_s3_key())
        ingest_document_task.delay(document_id=document_id, s3_key=s3_key, workspace_id=workspace_id)
        return {"document_id": document_id, "status": "requeued"}
    except Exception as exc:
        log.error("reindex_document.failed", document_id=document_id, error=str(exc))
        raise self.retry(exc=exc)


async def _reindex(workspace_id: str, job_id: str, new_model: str | None) -> dict[str, int]:
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    model_name = new_model or settings.embedding_model
    try:
        chunks = await _fetch_chunks(workspace_id)
        if not chunks:
            return {"total": 0, "updated": 0, "failed": 0}
        updated, failed = await _process_chunks(job_id, model_name, chunks, redis_client)
        return {"total": len(chunks), "updated": updated, "failed": failed}
    finally:
        await redis_client.aclose()


async def _fetch_chunks(workspace_id: str) -> list[dict[str, Any]]:
    cursor = store.document_chunks.find({"workspace_id": to_object_id(workspace_id)})
    return [chunk async for chunk in cursor]


async def _process_chunks(job_id: str, model_name: str, chunks: list[dict[str, Any]], redis_client: Any) -> tuple[int, int]:
    updated = 0
    failed = 0
    total = len(chunks)
    for offset in range(0, total, BATCH_SIZE):
        batch = chunks[offset:offset + BATCH_SIZE]
        texts = [chunk.get("content") or chunk.get("text") or "" for chunk in batch]
        try:
            embeddings = await asyncio.to_thread(embed_texts, texts, model_name)
        except Exception as exc:
            log.error("reindex.embed_failed", batch_offset=offset, error=str(exc))
            failed += len(batch)
            continue

        for chunk, embedding in zip(batch, embeddings, strict=False):
            await store.document_chunks.update_one(
                {"_id": chunk["_id"]},
                {"$set": {"embedding": embedding, "updated_at": utc_now()}},
            )
            updated += 1

        await _set_progress(redis_client, job_id, updated, total)
    return updated, failed


async def _set_progress(redis_client: Any, job_id: str, done: int, total: int) -> None:
    await redis_client.setex(PROGRESS_KEY.format(job_id=job_id), PROGRESS_TTL, f"{done}/{total}")
