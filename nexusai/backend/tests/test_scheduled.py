"""Celery beat periodic task tests."""
from __future__ import annotations

import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId



@pytest.mark.asyncio
async def test_retry_failed_documents_queues_failed_docs(db_session) -> None:
    from app.workers.scheduled import _retry_failed_documents_async

    doc_id = ObjectId()
    ws_id = ObjectId()
    await db_session.documents.insert_one(
        {
            "_id": doc_id,
            "workspace_id": ws_id,
            "status": "failed",
            "filename": "retry.pdf",
        }
    )

    with patch("app.workers.scheduled.celery_app") as mock_celery:
        mock_celery.send_task = MagicMock()
        result = await _retry_failed_documents_async()

    mock_celery.send_task.assert_called_once_with(
        "app.workers.reindex.reindex_document",
        kwargs={"document_id": str(doc_id), "workspace_id": str(ws_id)},
    )
    assert result["queued_for_reindex"] == 1


@pytest.mark.asyncio
async def test_retry_failed_documents_no_failed_docs() -> None:
    from app.workers.scheduled import _retry_failed_documents_async

    with patch("app.workers.scheduled.celery_app") as mock_celery:
        result = await _retry_failed_documents_async()

    mock_celery.send_task.assert_not_called()
    assert result["queued_for_reindex"] == 0


@pytest.mark.asyncio
async def test_analytics_heartbeat_publishes_to_redis() -> None:
    from app.workers.scheduled import _heartbeat_async

    with patch("app.core.redis.publish", new=AsyncMock()) as mock_publish:
        result = await _heartbeat_async()

    mock_publish.assert_called_once()
    channel, event_str = mock_publish.call_args[0]
    assert channel == "analytics:global"
    event = json.loads(event_str)
    assert event["event"] == "worker_heartbeat"
    assert event["worker"] == "celery-beat"
    assert "timestamp" in event
    assert result["published"] is True


@pytest.mark.asyncio
async def test_analytics_heartbeat_timestamp_is_recent() -> None:
    from app.workers.scheduled import _heartbeat_async

    published_events = []

    async def capture_publish(channel, message):
        published_events.append(json.loads(message))

    with patch("app.core.redis.publish", side_effect=capture_publish):
        await _heartbeat_async()

    assert len(published_events) == 1
    ts = published_events[0]["timestamp"]
    assert abs(ts - time.time()) < 5


def test_beat_schedule_has_expected_tasks() -> None:
    from app.workers.celery_app import celery_app

    schedule = celery_app.conf.beat_schedule
    task_names = [v["task"] for v in schedule.values()]
    assert "app.workers.scheduled.retry_failed_documents" in task_names
    assert "app.workers.scheduled.analytics_heartbeat" in task_names
