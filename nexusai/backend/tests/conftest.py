"""Shared pytest fixtures for NexusAI test suite."""
from __future__ import annotations

import os
import shutil
import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path
from bson import ObjectId
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["USE_MONGO_MOCK"] = "true"
os.environ["MONGODB_URI"] = "mongomock://localhost/nexusai"
os.environ["MONGODB_DB_NAME"] = "nexusai_test"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-bytes-long"
os.environ["MINIO_ACCESS_KEY"] = "test-access"
os.environ["MINIO_SECRET_KEY"] = "test-secret"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["ALLOW_LOCAL_VECTOR_FALLBACK"] = "true"
_TMP_ROOT = os.path.join(os.path.dirname(__file__), ".tmp")
os.makedirs(_TMP_ROOT, exist_ok=True)
os.environ["TMP"] = _TMP_ROOT
os.environ["TEMP"] = _TMP_ROOT
os.environ["TMPDIR"] = _TMP_ROOT

from app.core.database import get_database, init_indexes
from app.core.mongo import utc_now
from app.core.security import create_access_token, hash_password
from app.main import app
from app.services.mongo_store import store

_COLLECTIONS = (
    "users",
    "workspaces",
    "workspace_members",
    "documents",
    "document_chunks",
    "chat_sessions",
    "chat_messages",
    "agent_runs",
    "analytics_events",
    "refresh_tokens",
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_indexes() -> None:
    await init_indexes()


@pytest.fixture
def tmp_path() -> Path:
    path = Path(tempfile.mkdtemp(dir=_TMP_ROOT))
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator:
    db = get_database()
    for name in _COLLECTIONS:
        await db[name].delete_many({})
    yield db
    for name in _COLLECTIONS:
        await db[name].delete_many({})


@pytest_asyncio.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def workspace(db_session) -> SimpleNamespace:
    workspace_id = ObjectId()
    await db_session.workspaces.insert_one(
        {
            "_id": workspace_id,
            "name": "Test Workspace",
            "slug": "test-workspace",
            "owner_id": None,
            "plan": "free",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    return SimpleNamespace(id=str(workspace_id), name="Test Workspace", slug="test-workspace")


@pytest_asyncio.fixture
async def user(db_session, workspace: SimpleNamespace) -> SimpleNamespace:
    workspace_oid = ObjectId(workspace.id)
    user_id = ObjectId()
    await db_session.users.insert_one(
        {
            "_id": user_id,
            "email": "test@nexusai.dev",
            "password_hash": hash_password("password123"),
            "provider_id": None,
            "role": "user",
            "is_active": True,
            "is_verified": False,
            "default_workspace_id": workspace_oid,
            "active_workspace_id": workspace_oid,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    await db_session.workspace_members.insert_one(
        {
            "_id": ObjectId(),
            "workspace_id": workspace_oid,
            "user_id": user_id,
            "role": "member",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    return SimpleNamespace(
        id=str(user_id),
        email="test@nexusai.dev",
        role="user",
        workspace_id=workspace.id,
    )


@pytest_asyncio.fixture
async def admin(db_session, workspace: SimpleNamespace) -> SimpleNamespace:
    workspace_oid = ObjectId(workspace.id)
    admin_id = ObjectId()
    await db_session.users.insert_one(
        {
            "_id": admin_id,
            "email": "admin@nexusai.dev",
            "password_hash": hash_password("password123"),
            "provider_id": None,
            "role": "admin",
            "is_active": True,
            "is_verified": False,
            "default_workspace_id": workspace_oid,
            "active_workspace_id": workspace_oid,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    await db_session.workspaces.update_one(
        {"_id": workspace_oid},
        {"$set": {"owner_id": admin_id, "updated_at": utc_now()}},
    )
    await db_session.workspace_members.insert_one(
        {
            "_id": ObjectId(),
            "workspace_id": workspace_oid,
            "user_id": admin_id,
            "role": "owner",
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
    )
    return SimpleNamespace(
        id=str(admin_id),
        email="admin@nexusai.dev",
        role="admin",
        workspace_id=workspace.id,
    )


@pytest.fixture
def user_token(user: SimpleNamespace) -> str:
    return create_access_token(user.id, {"role": user.role})


@pytest.fixture
def admin_token(admin: SimpleNamespace) -> str:
    return create_access_token(admin.id, {"role": admin.role})


@pytest.fixture
def auth_headers(user_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(autouse=True)
def mock_redis():
    client_mock = AsyncMock()
    client_mock.get = AsyncMock(return_value=None)
    client_mock.set = AsyncMock(return_value=True)
    client_mock.setex = AsyncMock(return_value=True)
    client_mock.delete = AsyncMock(return_value=1)
    client_mock.publish = MagicMock(return_value=1)
    client_mock.pubsub = MagicMock()

    mock_pipe = MagicMock()
    mock_pipe.execute = AsyncMock(return_value=[None, None, 1, None])
    mock_pipe.zcard = MagicMock(return_value=mock_pipe)
    mock_pipe.zadd = MagicMock(return_value=mock_pipe)
    mock_pipe.expire = MagicMock(return_value=mock_pipe)
    mock_pipe.zremrangebyscore = MagicMock(return_value=mock_pipe)
    client_mock.pipeline = MagicMock(return_value=mock_pipe)

    with patch("app.core.redis._pool") as pool_mock:
        pool_mock.get = AsyncMock(return_value=client_mock)
        yield client_mock


@pytest.fixture
def mock_llm():
    async def fake_stream(*args, **kwargs):
        tokens = ["This ", "is ", "a ", "test ", "response."]
        for token in tokens:
            yield token

    mock = MagicMock()
    with patch("app.ai.rag.get_async_openai_client", return_value=mock):
        yield mock


@pytest.fixture
def mock_minio():
    with patch("app.utils.storage.upload_file_to_storage", new_callable=AsyncMock) as up, patch(
        "app.utils.storage.delete_file_from_storage", new_callable=AsyncMock
    ) as dl, patch("app.utils.storage.download_file_from_storage", new_callable=AsyncMock) as down:
        down.return_value = b"fake content"
        yield {"upload": up, "delete": dl, "download": down}
