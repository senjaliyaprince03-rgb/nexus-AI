"""Document API tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.services.mongo_store import store


@pytest.mark.asyncio
async def test_upload_valid_pdf(client: AsyncClient, auth_headers, workspace, mock_minio):
    with patch(
        "app.workers.ingestion._download_from_storage",
        new_callable=AsyncMock,
        return_value=(b"Hello from uploaded file", "text/plain"),
    ), patch("app.ai.embeddings.embed_texts", return_value=[[0.1] * 384]):
        res = await client.post(
            "/api/documents/upload",
            headers=auth_headers,
            files={"file": ("test.txt", b"hello world from upload", "text/plain")},
        )
    assert res.status_code in (200, 202)


@pytest.mark.asyncio
async def test_upload_requires_auth(client: AsyncClient):
    res = await client.post(
        "/api/documents/upload",
        files={"file": ("test.pdf", b"%PDF content", "application/pdf")},
    )
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient, auth_headers):
    res = await client.get("/api/documents/", headers=auth_headers)
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, auth_headers, workspace, user):
    document = await store.create_document(
        workspace_id=workspace.id,
        owner_id=user.id,
        filename="delete.pdf",
        file_type="application/pdf",
        file_size_bytes=10,
        s3_key="delete.pdf",
    )
    res = await client.delete(f"/api/documents/{document['_id']}", headers=auth_headers)
    assert res.status_code == 204


@pytest.mark.asyncio
async def test_reingest_document(client: AsyncClient, auth_headers, workspace, user):
    document = await store.create_document(
        workspace_id=workspace.id,
        owner_id=user.id,
        filename="reingest.txt",
        file_type="text/plain",
        file_size_bytes=10,
        s3_key="reingest.txt",
    )
    with patch(
        "app.workers.ingestion._download_from_storage",
        new_callable=AsyncMock,
        return_value=(b"Hello from uploaded file", "text/plain"),
    ), patch("app.ai.embeddings.embed_texts", return_value=[[0.1] * 384]):
        res = await client.post(f"/api/documents/{document['_id']}/reingest", headers=auth_headers)
    assert res.status_code == 200
