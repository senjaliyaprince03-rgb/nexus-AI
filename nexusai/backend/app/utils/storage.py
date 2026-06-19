"""Storage helpers with Mongo-mock memory mode, S3/MinIO, and local filesystem fallback."""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

from aiobotocore.session import get_session

from app.core.config import settings

_MEMORY_STORAGE: dict[str, bytes] = {}


def _normalized_mount_path() -> str:
    return "/" + settings.static_mount_path.strip("/")


def _static_root() -> Path:
    return Path(settings.static_dir).resolve()


def _uploads_root() -> Path:
    return (_static_root() / settings.static_upload_subdir.strip("/")).resolve()


def ensure_storage_dirs() -> None:
    _uploads_root().mkdir(parents=True, exist_ok=True)


def _normalize_key(key: str) -> str:
    return key.replace("\\", "/").lstrip("/")


def _public_prefix() -> str:
    server = settings.server_url.rstrip("/")
    mount = _normalized_mount_path().strip("/")
    subdir = settings.static_upload_subdir.strip("/")
    return f"{server}/{mount}/{subdir}".rstrip("/")


def _use_object_storage() -> bool:
    return bool(
        not settings.use_mongo_mock
        and settings.minio_endpoint
        and settings.minio_access_key
        and settings.minio_secret_key
        and settings.minio_bucket
    )


def _endpoint_url() -> str:
    endpoint = settings.minio_endpoint.strip()
    if endpoint.startswith(("http://", "https://")):
        return endpoint
    scheme = "https" if settings.minio_use_ssl else "http"
    return f"{scheme}://{endpoint}"


def _object_reference(key: str) -> str:
    return f"s3://{settings.minio_bucket}/{_normalize_key(key)}"


def public_storage_url(key: str) -> str:
    normalized_key = _normalize_key(key)
    if _use_object_storage():
        return _object_reference(normalized_key)
    return f"{_public_prefix()}/{normalized_key}"


def _key_from_reference(reference: str) -> str:
    normalized = reference.strip()
    public_prefix = _public_prefix()
    mount_prefix = f"{_normalized_mount_path()}/{settings.static_upload_subdir.strip('/')}".rstrip("/")

    if normalized.startswith("s3://"):
        parsed = urlparse(normalized)
        bucket = parsed.netloc
        path = parsed.path.lstrip("/")
        if bucket and bucket != settings.minio_bucket:
            return _normalize_key(f"{bucket}/{path}")
        return _normalize_key(path)

    if normalized.startswith(public_prefix):
        normalized = normalized[len(public_prefix):]
    else:
        parsed = urlparse(normalized)
        if parsed.scheme and parsed.netloc:
            normalized = parsed.path
            bucket_prefix = f"/{settings.minio_bucket}/"
            if normalized.startswith(bucket_prefix):
                normalized = normalized[len(bucket_prefix):]
        if normalized.startswith(mount_prefix):
            normalized = normalized[len(mount_prefix):]

    return _normalize_key(normalized)


def _path_for_key(key: str) -> Path:
    candidate = (_uploads_root() / _key_from_reference(key)).resolve()
    uploads_root = _uploads_root()
    if uploads_root != candidate and uploads_root not in candidate.parents:
        raise ValueError("Storage path escapes configured upload directory")
    return candidate


@asynccontextmanager
async def _storage_client():
    session = get_session()
    async with session.create_client(
        "s3",
        endpoint_url=_endpoint_url(),
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        region_name="us-east-1",
        use_ssl=settings.minio_use_ssl,
    ) as client:
        yield client


async def upload_file_to_storage(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    normalized_key = _normalize_key(key)
    if settings.use_mongo_mock:
        _MEMORY_STORAGE[normalized_key] = data
        return
    if _use_object_storage():
        async with _storage_client() as client:
            await client.put_object(
                Bucket=settings.minio_bucket,
                Key=normalized_key,
                Body=data,
                ContentType=content_type,
            )
        return
    ensure_storage_dirs()
    path = _path_for_key(normalized_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


async def download_file_from_storage(reference: str) -> bytes:
    key = _key_from_reference(reference)
    if settings.use_mongo_mock and key in _MEMORY_STORAGE:
        return _MEMORY_STORAGE[key]
    if _use_object_storage():
        async with _storage_client() as client:
            response = await client.get_object(Bucket=settings.minio_bucket, Key=key)
            return await response["Body"].read()
    return _path_for_key(key).read_bytes()


async def delete_file_from_storage(reference: str) -> None:
    key = _key_from_reference(reference)
    if settings.use_mongo_mock:
        _MEMORY_STORAGE.pop(key, None)
        return
    if _use_object_storage():
        async with _storage_client() as client:
            await client.delete_object(Bucket=settings.minio_bucket, Key=key)
        return
    path = _path_for_key(key)
    if path.exists():
        path.unlink()


async def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    normalized_key = _normalize_key(key)
    if _use_object_storage():
        async with _storage_client() as client:
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.minio_bucket, "Key": normalized_key},
                ExpiresIn=expires_in,
            )
    del expires_in
    return public_storage_url(normalized_key)
