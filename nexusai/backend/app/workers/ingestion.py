"""Celery task: ingest a document into MongoDB."""
from __future__ import annotations

import asyncio
import io
import json
from typing import Any

import redis
import structlog

from app.core.config import settings
from app.services.mongo_store import store
from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

PROGRESS_CHANNEL = "ingestion:progress:{doc_id}"
PROGRESS_TTL = 3600


@celery_app.task(
    name="app.workers.ingestion.ingest_document_task",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    soft_time_limit=300,
    time_limit=360,
)
def ingest_document_task(self: Any, document_id: str, s3_key: str, workspace_id: str) -> dict[str, Any]:
    log.info("ingestion.started", document_id=document_id)
    return asyncio.run(_ingest(self, document_id, s3_key, workspace_id))


async def _ingest(task: Any, document_id: str, s3_key: str, workspace_id: str) -> dict[str, Any]:
    from app.ai.chunker import chunk_document
    from app.ai.embeddings import embed_texts

    r = redis.from_url(settings.redis_url, decode_responses=True)

    def _publish(step: str, progress: float, message: str = "") -> None:
        try:
            r.publish(
                PROGRESS_CHANNEL.format(doc_id=document_id),
                json.dumps({
                    "event": "progress",
                    "document_id": document_id,
                    "step": step,
                    "progress": progress,
                    "message": message,
                }),
            )
        except Exception:
            pass

    try:
        await store.update_document_status(document_id, "processing", chunk_count=0, error_message=None)
        _publish("downloading", 0.05, "Downloading from storage")
        raw_bytes, content_type = await _download_from_storage(s3_key)

        _publish("parsing", 0.15, "Extracting text")
        text = _parse_document(raw_bytes, content_type, s3_key)

        _publish("chunking", 0.30, "Splitting into chunks")
        chunks = _chunk(text, content_type, document_id, chunk_document)

        _publish("embedding", 0.45, f"Embedding {len(chunks)} chunks")
        embeddings = await _embed(chunks, embed_texts)

        _publish("storing", 0.80, "Writing to MongoDB")
        document = await store.get_document(document_id)
        await store.insert_document_chunks(
            document_id=document_id,
            workspace_id=workspace_id,
            filename=(document or {}).get("filename", s3_key.rsplit("/", 1)[-1]),
            chunks=[{
                "text": chunk.content,
                "chunk_index": chunk.chunk_index,
                "metadata": getattr(chunk, "metadata", {}) or {},
                "page_number": getattr(chunk, "page_number", None),
            } for chunk in chunks],
            embeddings=embeddings,
        )

        _publish_complete(r, document_id, len(chunks))
        log.info("ingestion.complete", document_id=document_id, chunks=len(chunks))
        return {"document_id": document_id, "chunk_count": len(chunks), "status": "ready"}

    except Exception as exc:
        await _mark_failed(document_id, exc)
        _publish_error(r, document_id, exc)
        raise task.retry(exc=exc)
    finally:
        r.close()


async def _download_from_storage(s3_key: str) -> tuple[bytes, str]:
    from app.utils.storage import download_file_from_storage

    body = await download_file_from_storage(s3_key)
    return body, "application/octet-stream"


def _parse_document(raw: bytes, content_type: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if "pdf" in content_type or ext == "pdf":
        import fitz
        doc = fitz.open(stream=raw, filetype="pdf")
        return "\n\n".join(page.get_text() for page in doc)
    if "wordprocessingml" in content_type or ext == "docx":
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(raw))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    import chardet
    detected = chardet.detect(raw[:4096])
    encoding = detected.get("encoding") or "utf-8"
    return raw.decode(encoding, errors="replace")


def _chunk(text: str, content_type: str, document_id: str, chunk_fn: Any) -> list[Any]:
    if not text.strip():
        raise ValueError("Document produced no extractable text")
    chunks = chunk_fn(text, content_type=content_type, metadata={"document_id": document_id})
    if not chunks:
        raise ValueError("Document produced no chunks")
    log.info("ingestion.chunked", document_id=document_id, chunk_count=len(chunks))
    return chunks


async def _embed(chunks: list[Any], embed_fn: Any) -> list[Any]:
    texts = [c.content for c in chunks]
    return await asyncio.to_thread(embed_fn, texts)


async def _mark_failed(document_id: str, exc: Exception) -> None:
    log.error("ingestion.failed", document_id=document_id, error=str(exc))
    await store.update_document_status(document_id, "failed", error_message=str(exc))


def _publish_complete(r: redis.Redis, document_id: str, chunk_count: int) -> None:
    try:
        r.publish(
            PROGRESS_CHANNEL.format(doc_id=document_id),
            json.dumps({
                "event": "complete",
                "document_id": document_id,
                "step": "complete",
                "progress": 1.0,
                "chunk_count": chunk_count,
            }),
        )
    except Exception:
        pass


def _publish_error(r: redis.Redis, document_id: str, exc: Exception) -> None:
    try:
        r.publish(
            PROGRESS_CHANNEL.format(doc_id=document_id),
            json.dumps({
                "event": "error",
                "document_id": document_id,
                "step": "failed",
                "progress": 0,
                "message": "Ingestion failed. Please retry or contact support.",
            }),
        )
    except Exception:
        pass
