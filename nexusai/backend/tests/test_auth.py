"""Auth API tests."""
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "email": "new@test.com", "password": "password123"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == "new@test.com"
    assert data["workspace"]["id"]
    assert data["access_token"]
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient, user):
    res = await client.post("/api/auth/register", json={
        "email": "test@nexusai.dev", "password": "password123"
    })
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient, user):
    res = await client.post("/api/auth/login", json={
        "email": "test@nexusai.dev", "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == user.email


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, user):
    res = await client.post("/api/auth/login", json={
        "email": "test@nexusai.dev", "password": "wrongpass"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, auth_headers):
    res = await client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_expired_token(client: AsyncClient):
    headers = {"Authorization": "Bearer totally.invalid.token"}
    res = await client.get("/api/auth/me", headers=headers)
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_route_blocked_for_user(client: AsyncClient, auth_headers, workspace):
    res = await client.post(f"/api/workspaces/{workspace.id}/invite",
                             json={"email": "x@x.com"}, headers=auth_headers)
    assert res.status_code == 403


# ── Rate limiting tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rate_limit_returns_429_on_excess(client: AsyncClient):
    """
    The forgot-password endpoint has limit=3 per 300s.
    After 3 requests the 4th should return 429.
    We mock the Redis rate limiter to avoid real Redis dependency.
    """
    from unittest.mock import patch, AsyncMock

    # Mock: first 3 calls pass, 4th raises HTTPException 429
    call_count = {"n": 0}

    async def mock_check_rate_limit(key, limit, window):
        call_count["n"] += 1
        if call_count["n"] > limit:
            from fastapi import HTTPException
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

    with patch("app.core.rate_limit.check_rate_limit", side_effect=mock_check_rate_limit):
        # First 3 requests succeed (even though user doesn't exist — always 200)
        for _ in range(3):
            res = await client.post("/api/auth/forgot-password",
                                    json={"email": "nobody@test.com"})
            assert res.status_code == 200

        # 4th request should be rate-limited
        res = await client.post("/api/auth/forgot-password",
                                json={"email": "nobody@test.com"})
        assert res.status_code == 429


@pytest.mark.asyncio
async def test_logout_endpoint(client: AsyncClient, user_token: str):
    res = await client.post("/api/auth/logout",
                             headers={"Authorization": f"Bearer {user_token}"})
    assert res.status_code == 200
    assert res.json()["message"] == "Logged out successfully"


@pytest.mark.asyncio
async def test_me_returns_user_data(client: AsyncClient, auth_headers: dict, user):
    res = await client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == user.email
    assert data["workspace"]["id"] == user.workspace_id
    assert "hashed_password" not in data["user"]


# ── is_verified field tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_new_user_not_verified(client: AsyncClient):
    """Freshly registered user should have is_verified=False."""
    res = await client.post("/api/auth/register", json={
        "email": "unverified@test.com", "password": "password123"
    })
    assert res.status_code == 201
    assert res.json()["user"]["is_verified"] is False
    assert res.json()["workspace"] is not None


@pytest.mark.asyncio
async def test_verify_email_flow(client: AsyncClient, db_session, workspace, mock_redis):
    """Full email verification cycle: register → get token → verify → is_verified True."""
    from app.services.mongo_store import store

    # Register
    res = await client.post("/api/auth/register", json={
        "email": "toverify@test.com", "password": "password123"
    })
    assert res.status_code == 201

    # Find the Mongo user document and verify the initial state.
    user_doc = await store.get_user_by_email("toverify@test.com")
    assert user_doc is not None
    assert user_doc["is_verified"] is False

    # Simulate token issuance via Redis mock
    import secrets
    token = secrets.token_urlsafe(32)
    mock_redis.get.return_value = str(user_doc["_id"])

    # Call verify endpoint
    res = await client.get(f"/api/auth/verify-email?token={token}")
    assert res.status_code == 200
    assert "verified" in res.json()["message"]

    res = await client.get(f"/api/auth/verify-email?token={token}")
    assert res.status_code == 200

    # Check the persisted Mongo document.
    updated_user_doc = await store.get_user_by_email("toverify@test.com")
    assert updated_user_doc is not None
    assert updated_user_doc["is_verified"] is True


@pytest.mark.asyncio
async def test_send_verification_dev_url_fallback(client: AsyncClient, auth_headers: dict, user):
    """Development console mode returns a usable verification URL without Redis storage."""
    from app.services.mongo_store import store

    res = await client.post("/api/auth/send-verification", headers=auth_headers)
    assert res.status_code == 200

    from app.core.config import settings
    data = res.json()
    assert data["message"] == "Verification email sent"
    assert data["verify_url"].startswith(f"{settings.app_base_url}/verify-email?token=")

    token = parse_qs(urlparse(data["verify_url"]).query)["token"][0]
    res = await client.get(f"/api/auth/verify-email?token={token}")
    assert res.status_code == 200

    updated_user_doc = await store.get_user_by_email(user.email)
    assert updated_user_doc is not None
    assert updated_user_doc["is_verified"] is True
    assert "email_verification_token_hash" not in updated_user_doc

    res = await client.get(f"/api/auth/verify-email?token={token}")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_invalid_verification_token(client: AsyncClient):
    res = await client.get("/api/auth/verify-email?token=totally-invalid-token")
    assert res.status_code == 400
