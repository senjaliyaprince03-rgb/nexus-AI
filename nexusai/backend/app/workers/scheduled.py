"""Celery Beat periodic tasks for NexusAI."""
from __future__ import annotations

import asyncio
import json

import structlog

from app.services.mongo_store import store
from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)





@celery_app.task(name="app.workers.scheduled.retry_failed_documents")
def retry_failed_documents() -> dict:
    return asyncio.run(_retry_failed_documents_async())


async def _retry_failed_documents_async() -> dict:
    failed = []
    async for document in store.documents.find({"status": "failed"}).limit(20):
        failed.append(document)

    queued = 0
    failed_to_queue = 0
    for document in failed:
        try:
            celery_app.send_task(
                "app.workers.reindex.reindex_document",
                kwargs={
                    "document_id": str(document["_id"]),
                    "workspace_id": str(document["workspace_id"]),
                },
            )
            queued += 1
        except Exception as exc:  # noqa: BLE001
            log.warning("retry_failed_documents.send_failed", document_id=str(document["_id"]), error=str(exc))
            failed_to_queue += 1

    log.info("retry_failed_documents.complete", queued=queued, failed_to_queue=failed_to_queue)
    return {"queued_for_reindex": queued, "failed_to_queue": failed_to_queue}


@celery_app.task(name="app.workers.scheduled.analytics_heartbeat")
def analytics_heartbeat() -> dict:
    return asyncio.run(_heartbeat_async())


async def _heartbeat_async() -> dict:
    import time
    from app.core.redis import publish

    event = json.dumps({
        "event": "worker_heartbeat",
        "timestamp": time.time(),
        "worker": "celery-beat",
    })
    try:
        await publish("analytics:global", event)
    except OSError as exc:
        log.warning("analytics_heartbeat.redis_error", error=str(exc))
        return {"published": False, "error": str(exc)}
    return {"published": True}
