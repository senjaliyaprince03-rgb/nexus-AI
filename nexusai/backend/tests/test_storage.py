"""Storage utility unit tests for filesystem fallback storage."""
from __future__ import annotations

from pathlib import Path
import shutil

import pytest

from app.core.config import settings
from app.utils.storage import (
    delete_file_from_storage,
    download_file_from_storage,
    ensure_storage_dirs,
    generate_presigned_url,
    public_storage_url,
    upload_file_to_storage,
)


@pytest.fixture
def local_storage():
    temp_root = Path.cwd() / "tests" / "_storage_runtime"
    shutil.rmtree(temp_root, ignore_errors=True)
    (temp_root / "static" / "uploads").mkdir(parents=True, exist_ok=True)
    original_static_dir = settings.static_dir
    original_server_url = settings.server_url
    original_mount_path = settings.static_mount_path
    original_upload_subdir = settings.static_upload_subdir
    original_use_mongo_mock = settings.use_mongo_mock
    original_minio_endpoint = settings.minio_endpoint
    original_minio_access_key = settings.minio_access_key
    original_minio_secret_key = settings.minio_secret_key
    original_minio_bucket = settings.minio_bucket

    settings.static_dir = str(temp_root / "static")
    settings.server_url = "http://localhost:8000"
    settings.static_mount_path = "/static"
    settings.static_upload_subdir = "uploads"
    settings.use_mongo_mock = False
    settings.minio_endpoint = ""
    settings.minio_access_key = ""
    settings.minio_secret_key = ""
    settings.minio_bucket = ""
    ensure_storage_dirs()

    try:
        yield temp_root
    finally:
        settings.static_dir = original_static_dir
        settings.server_url = original_server_url
        settings.static_mount_path = original_mount_path
        settings.static_upload_subdir = original_upload_subdir
        settings.use_mongo_mock = original_use_mongo_mock
        settings.minio_endpoint = original_minio_endpoint
        settings.minio_access_key = original_minio_access_key
        settings.minio_secret_key = original_minio_secret_key
        settings.minio_bucket = original_minio_bucket
        shutil.rmtree(temp_root, ignore_errors=True)


@pytest.mark.asyncio
async def test_upload_file_writes_to_static_upload_directory(local_storage: Path):
    await upload_file_to_storage("workspace/documents/test.txt", b"data", "text/plain")

    stored_file = local_storage / "static" / "uploads" / "workspace" / "documents" / "test.txt"
    assert stored_file.exists()
    assert stored_file.read_bytes() == b"data"


@pytest.mark.asyncio
async def test_download_file_supports_public_storage_url(local_storage: Path):
    key = "workspace/test.txt"
    await upload_file_to_storage(key, b"test content", "text/plain")

    data = await download_file_from_storage(public_storage_url(key))
    assert data == b"test content"


@pytest.mark.asyncio
async def test_delete_file_supports_public_storage_url(local_storage: Path):
    key = "workspace/delete-me.txt"
    await upload_file_to_storage(key, b"remove me", "text/plain")

    await delete_file_from_storage(public_storage_url(key))

    stored_file = local_storage / "static" / "uploads" / "workspace" / "delete-me.txt"
    assert not stored_file.exists()


@pytest.mark.asyncio
async def test_presigned_url_returns_public_static_url(local_storage: Path):
    url = await generate_presigned_url("workspace/test.txt")
    assert url == "http://localhost:8000/static/uploads/workspace/test.txt"
