from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from mongomock_motor import AsyncMongoMockClient
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError
import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)


class MongoOperationError(RuntimeError):
    pass


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_object_id(value: str | ObjectId | None) -> ObjectId | None:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError, ValueError):
        return None


def stringify_object_ids(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [stringify_object_ids(item) for item in value]
    if isinstance(value, dict):
        return {key: stringify_object_ids(item) for key, item in value.items()}
    return value


def normalize_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = stringify_object_ids(document)
    if isinstance(normalized, dict):
        normalized.pop("_id", None)
        normalized["id"] = str(document["_id"])
    return normalized


@dataclass(slots=True)
class MongoContext:
    client: AsyncIOMotorClient
    db: AsyncIOMotorDatabase


# ── Singleton client management ──────────────────────────────
# We avoid @lru_cache because it can silently cache a stale real-
# MongoDB client that was created before the startup fallback
# switched us to mongomock.  Instead we keep a module-level ref
# that is set exactly once and can be force-reset by the lifespan
# handler when it detects MongoDB is unreachable.
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is not None:
        return _client
    if settings.use_mongo_mock or settings.mongodb_uri.startswith("mongomock://"):
        log.info("mongodb.client_init", mode="mock", database=settings.mongodb_db_name)
        _client = AsyncMongoMockClient()
    else:
        _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    return _client


def force_mock_client() -> None:
    """Force-switch to mongomock.  Called by the lifespan handler when
    real MongoDB is unreachable so every subsequent ``get_client()``
    call returns the mock."""
    global _client
    settings.use_mongo_mock = True
    _client = AsyncMongoMockClient()
    log.info("mongodb.client_init", mode="mock", database=settings.mongodb_db_name)


# Backward-compat shim so existing code that calls
# ``get_client.cache_clear()`` doesn't raise AttributeError.
get_client.cache_clear = lambda: None  # type: ignore[attr-defined]


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


def get_collection(name: str) -> AsyncIOMotorCollection:
    return get_database()[name]


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    yield get_database()


async def ping_database() -> None:
    if settings.use_mongo_mock or settings.mongodb_uri.startswith("mongomock://"):
        log.info("mongodb.connected", target="mock", database=settings.mongodb_db_name, mock=True)
        return
    try:
        await get_database().command("ping")
    except PyMongoError as exc:
        raise MongoOperationError(f"MongoDB ping failed for {_safe_target()}") from exc
    log.info(
        "mongodb.connected",
        target=_safe_target(),
        database=settings.mongodb_db_name,
        mock=settings.use_mongo_mock,
    )


async def init_indexes(db: AsyncIOMotorDatabase | None = None) -> None:
    database = db or get_database()
    await database.users.create_indexes(
        [
            IndexModel([("email", ASCENDING)], unique=True, name="uniq_users_email"),
            IndexModel([("default_workspace_id", ASCENDING)], name="idx_users_default_workspace"),
        ]
    )
    await database.workspaces.create_indexes(
        [
            IndexModel([("slug", ASCENDING)], unique=True, name="uniq_workspaces_slug"),
            IndexModel([("owner_id", ASCENDING)], name="idx_workspaces_owner"),
            IndexModel([("created_at", DESCENDING)], name="idx_workspaces_created_at"),
        ]
    )
    await database.workspace_members.create_indexes(
        [
            IndexModel([("workspace_id", ASCENDING), ("user_id", ASCENDING)], unique=True, name="uniq_workspace_member"),
            IndexModel([("workspace_id", ASCENDING)], name="idx_workspace_members_workspace"),
            IndexModel([("user_id", ASCENDING)], name="idx_workspace_members_user"),
        ]
    )
    await database.documents.create_indexes(
        [
            IndexModel([("workspace_id", ASCENDING), ("owner_id", ASCENDING)], name="idx_documents_workspace_owner"),
            IndexModel([("status", ASCENDING)], name="idx_documents_status"),
            IndexModel([("created_at", DESCENDING)], name="idx_documents_created_at"),
        ]
    )
    await database.document_chunks.create_indexes(
        [
            IndexModel([("document_id", ASCENDING)], name="idx_chunks_document"),
            IndexModel([("workspace_id", ASCENDING)], name="idx_chunks_workspace"),
            IndexModel([("workspace_id", ASCENDING), ("document_id", ASCENDING)], name="idx_chunks_workspace_document"),
            IndexModel([("workspace_id", ASCENDING), ("document_id", ASCENDING), ("chunk_index", ASCENDING)], name="idx_chunks_vector_lookup"),
        ]
    )
    await database.chat_sessions.create_indexes(
        [
            IndexModel([("workspace_id", ASCENDING), ("user_id", ASCENDING)], name="idx_chat_sessions_workspace_user"),
            IndexModel([("updated_at", DESCENDING)], name="idx_chat_sessions_updated_at"),
        ]
    )
    await database.chat_messages.create_indexes(
        [
            IndexModel([("session_id", ASCENDING)], name="idx_chat_messages_session"),
            IndexModel([("workspace_id", ASCENDING), ("created_at", DESCENDING)], name="idx_chat_messages_workspace_created"),
        ]
    )
    await database.agent_runs.create_indexes(
        [
            IndexModel([("workspace_id", ASCENDING), ("user_id", ASCENDING)], name="idx_agent_runs_workspace_user"),
            IndexModel([("status", ASCENDING)], name="idx_agent_runs_status"),
            IndexModel([("created_at", DESCENDING)], name="idx_agent_runs_created_at"),
        ]
    )
    await database.analytics_events.create_indexes(
        [
            IndexModel([("workspace_id", ASCENDING), ("created_at", DESCENDING)], name="idx_analytics_workspace_created"),
            IndexModel([("event_type", ASCENDING)], name="idx_analytics_event_type"),
        ]
    )
    await database.refresh_tokens.create_indexes(
        [
            IndexModel([("token_id", ASCENDING)], unique=True, name="uniq_refresh_token_id"),
            IndexModel([("user_id", ASCENDING)], name="idx_refresh_tokens_user"),
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="ttl_refresh_tokens_expires_at"),
        ]
    )
    log.info("mongodb.indexes_ready", database=settings.mongodb_db_name)


def now_fields() -> dict[str, datetime]:
    current = utc_now()
    return {"created_at": current, "updated_at": current}


def update_timestamp(document: dict[str, Any]) -> dict[str, Any]:
    document["updated_at"] = utc_now()
    return document


def _safe_target() -> str:
    if settings.use_mongo_mock:
        return "mongomock://local"
    parsed = urlparse(settings.mongodb_uri)
    host = parsed.hostname or "unknown-host"
    port = parsed.port or 27017
    return f"{host}:{port}"
