from __future__ import annotations

import asyncio
from urllib.parse import urlparse, urlunparse

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.mongo import ping_database


def _safe_target(uri: str) -> str:
    parsed = urlparse(uri)
    host = parsed.hostname or "unknown-host"
    port = parsed.port or 27017
    return f"{host}:{port}"


def _localhost_fallback_uri(uri: str) -> str:
    parsed = urlparse(uri)
    if parsed.hostname != "mongodb":
        return uri
    # When running on host, we map Docker's mongodb:27017 to localhost:27018
    netloc = parsed.netloc.replace("@mongodb:27017", "@localhost:27018")
    netloc = netloc.replace("@mongodb", "@localhost:27018")
    netloc = netloc.replace("mongodb:27017", "localhost:27018")
    if netloc == parsed.netloc and "mongodb" in netloc:
        netloc = netloc.replace("mongodb", "localhost:27018")
    return urlunparse(parsed._replace(netloc=netloc))


async def _ping_uri(uri: str) -> None:
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        await client[settings.mongodb_db_name].command("ping")
    finally:
        client.close()


async def main() -> int:
    print("NexusAI MongoDB health check")
    print(f"database={settings.mongodb_db_name}")
    print(f"use_mongo_mock={str(settings.use_mongo_mock).lower()}")
    print(f"allow_local_vector_fallback={str(settings.allow_local_vector_fallback).lower()}")

    if settings.use_mongo_mock:
        print("target=mongomock://local")
        print("status=ok")
        return 0

    print(f"target={_safe_target(settings.mongodb_uri)}")
    try:
        await ping_database()
        print("status=ok")
        return 0
    except Exception:
        fallback_uri = _localhost_fallback_uri(settings.mongodb_uri)
        if fallback_uri != settings.mongodb_uri:
            await _ping_uri(fallback_uri)
            print("status=ok")
            print("note=resolved Docker hostname 'mongodb' via localhost for host-side validation")
            return 0
        raise


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:
        print("status=error")
        print(f"error={exc}")
        raise SystemExit(1)
