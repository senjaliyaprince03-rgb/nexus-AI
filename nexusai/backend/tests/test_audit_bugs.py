from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings
from app.services.document_service import (
    _sanitize_storage_filename,
    reingest_document,
    upload_document,
)


def test_sanitize_storage_filename_strips_path_segments() -> None:
    assert _sanitize_storage_filename("../../../etc/passwd.pdf") == "passwd.pdf"
    assert _sanitize_storage_filename(r"..\..\secret\report final?.pdf") == "report_final_.pdf"
    assert _sanitize_storage_filename("") == "upload.bin"


@pytest.mark.asyncio
async def test_upload_document_sanitizes_storage_key(db_session, workspace, user) -> None:
    upload = MagicMock(filename="../../../etc/passwd.pdf", content_type="application/pdf")

    with patch("app.services.document_service.validate_upload", new_callable=AsyncMock) as mock_validate, \
         patch("app.services.document_service.upload_file_to_storage", new_callable=AsyncMock) as mock_storage, \
         patch("app.services.document_service.ingest_document_task.delay") as mock_delay:
        mock_validate.return_value = b"%PDF-1.4 fake pdf bytes"

        response = await upload_document(upload, workspace.id, user.id, db_session)

    assert response["filename"] == "passwd.pdf"
    assert "../" not in mock_storage.await_args.kwargs["key"]
    assert "..\\" not in mock_storage.await_args.kwargs["key"]
    assert mock_storage.await_args.kwargs["key"].endswith("/passwd.pdf")
    mock_delay.assert_called_once()


@pytest.mark.asyncio
async def test_forgot_password_queues_celery_email_task(client, user) -> None:
    original_use_mongo_mock = settings.use_mongo_mock
    settings.use_mongo_mock = False
    try:
        with patch("app.api.auth.send_password_reset_email_task.delay") as mock_delay:
            response = await client.post(
                "/api/auth/forgot-password",
                json={"email": user.email},
            )

        assert response.status_code == 200
        mock_delay.assert_called_once()
        args = mock_delay.call_args.args
        assert args[0] == user.email
        assert isinstance(args[1], str) and args[1]
    finally:
        settings.use_mongo_mock = original_use_mongo_mock


@pytest.mark.asyncio
async def test_reingest_document_marks_processing_and_enqueues_task(workspace) -> None:
    document_id = "507f1f77bcf86cd799439011"
    doc = {
        "_id": document_id,
        "filename": "report.pdf",
        "s3_key": "bucket/report.pdf",
        "status": "ready",
    }

    with patch("app.services.document_service.store.get_document", new_callable=AsyncMock, return_value=doc), \
         patch("app.services.document_service.store.update_document_status", new_callable=AsyncMock) as mock_update, \
         patch("app.services.document_service.ingest_document_task.delay") as mock_delay:
        response = await reingest_document(document_id, workspace.id)

    assert response["status"] == "processing"
    mock_update.assert_awaited_once_with(
        document_id,
        "processing",
        chunk_count=0,
        error_message=None,
    )
    mock_delay.assert_called_once_with(
        document_id=str(document_id),
        s3_key=doc["s3_key"],
        workspace_id=str(workspace.id),
    )


# ── Audit Bug Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_audit_bug_enum_status(client, user, auth_headers) -> None:
    """
    Test that invalid enum values return 422 Unprocessable Entity instead of 500.
    """
    response = await client.get(
        "/api/documents/?status=INVALID_STATUS_THAT_CAUSED_500",
        headers=auth_headers
    )
    assert response.status_code == 422
    assert "Invalid status" in response.json()["detail"]


@pytest.mark.asyncio
async def test_audit_bug_race_condition(db_session, workspace, user) -> None:
    """
    Test that the document is created before enqueuing the Celery task.
    """
    upload = MagicMock(filename="test.pdf", content_type="application/pdf")
    created = {"done": False}
    created_document = {
        "_id": "507f1f77bcf86cd799439012",
        "filename": "test.pdf",
        "status": "pending",
        "created_at": "2026-01-01T00:00:00Z",
        "file_type": "application/pdf",
        "file_size_bytes": 4,
    }

    async def create_document(**kwargs):
        created["done"] = True
        return created_document

    def assert_delay(*args, **kwargs):
        assert created["done"] is True

    with patch("app.services.document_service.validate_upload", new_callable=AsyncMock) as mock_validate, \
         patch("app.services.document_service.upload_file_to_storage", new_callable=AsyncMock), \
         patch("app.services.document_service.public_storage_url", return_value="workspace/test.pdf"), \
         patch("app.services.document_service.store.create_document", new_callable=AsyncMock, side_effect=create_document), \
         patch("app.services.document_service.ingest_document_task.delay") as mock_delay:
        mock_delay.side_effect = assert_delay
        mock_validate.return_value = b"fake"

        await upload_document(upload, workspace.id, user.id)

    mock_delay.assert_called_once()


@pytest.mark.asyncio
async def test_audit_bug_input_validation(client) -> None:
    """
    Test that missing or malformed fields on Pydantic models return 422.
    """
    # Empty body
    response = await client.post("/api/auth/forgot-password", json={})
    assert response.status_code == 422
    
    # Missing required field
    response = await client.post("/api/auth/forgot-password", json={"not_email": "hello"})
    assert response.status_code == 422
    
    # Malformed email
    response = await client.post("/api/auth/forgot-password", json={"email": "not-an-email"})
    assert response.status_code == 422
