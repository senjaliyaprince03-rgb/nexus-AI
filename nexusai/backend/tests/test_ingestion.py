"""Ingestion worker tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.mongo import utc_now


def _fake_pdf_bytes() -> bytes:
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF"


def test_parse_plain_text():
    from app.workers.ingestion import _parse_document

    result = _parse_document(b"Hello world. This is test content.", "text/plain", "test.txt")
    assert "Hello world" in result


def test_parse_csv():
    from app.workers.ingestion import _parse_document

    csv = b"col1,col2\nvalue1,value2\nvalue3,value4"
    result = _parse_document(csv, "text/csv", "data.csv")
    assert "col1" in result
    assert "value1" in result


def test_chunk_document_from_text():
    from app.ai.chunker import chunk_document

    text = "This is a sentence. " * 150
    chunks = chunk_document(text, content_type="text/plain")
    assert len(chunks) > 1
    assert all(c.content.strip() for c in chunks)
    assert all(c.chunk_index == i for i, c in enumerate(chunks))


@pytest.mark.asyncio
async def test_ingest_task_marks_document_ready(db_session, workspace, user):
    from app.services.mongo_store import store
    from app.workers.ingestion import _ingest

    document = await store.create_document(
        workspace_id=workspace.id,
        owner_id=user.id,
        filename="test.txt",
        file_type="text/plain",
        file_size_bytes=100,
        s3_key=f"{workspace.id}/test.txt",
    )

    sample_text = b"This document contains important information. " * 20

    with patch(
        "app.workers.ingestion._download_from_storage",
        new_callable=AsyncMock,
        return_value=(sample_text, "text/plain"),
    ), patch("app.workers.ingestion.redis.from_url") as mock_redis_sync, patch(
        "app.ai.embeddings.embed_texts", return_value=[[0.1] * 384] * 5
    ):
        task_mock = MagicMock()
        task_mock.retry = MagicMock(side_effect=Exception("retry"))
        result = await _ingest(
            task_mock,
            str(document["_id"]),
            f"{workspace.id}/test.txt",
            workspace.id,
        )

    updated = await store.get_document(str(document["_id"]))
    assert result["chunk_count"] > 0
    assert updated is not None
    assert updated["status"] == "ready"


def test_ingest_task_registers_with_celery():
    from app.workers.celery_app import celery_app

    registered = celery_app.tasks.keys()
    assert "app.workers.ingestion.ingest_document_task" in registered
    assert "app.workers.email.send_welcome_email_task" in registered
    assert "app.workers.email.send_verification_email_task" in registered
    assert "app.workers.email.send_password_reset_email_task" in registered


@pytest.mark.asyncio
async def test_download_raises_on_missing_key():
    with patch(
        "app.utils.storage.download_file_from_storage",
        new_callable=AsyncMock,
        side_effect=Exception("NoSuchKey"),
    ):
        from app.workers.ingestion import _download_from_storage

        with pytest.raises(Exception, match="NoSuchKey"):
            await _download_from_storage("missing/key.pdf")
