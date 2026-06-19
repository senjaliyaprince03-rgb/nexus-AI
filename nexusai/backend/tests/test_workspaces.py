"""Workspace API tests."""
from __future__ import annotations

from datetime import UTC, datetime

import pytest
from bson import ObjectId
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workspace(client: AsyncClient, auth_headers):
    res = await client.post(
        "/api/workspaces/",
        json={"name": "New Workspace"},
        headers=auth_headers,
    )
    assert res.status_code in (200, 201)


@pytest.mark.asyncio
async def test_list_workspaces(client: AsyncClient, auth_headers):
    res = await client.get("/api/workspaces/", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_invite_requires_admin(client: AsyncClient, auth_headers, workspace):
    res = await client.post(
        f"/api/workspaces/{workspace.id}/invite",
        json={"email": "test@test.com"},
        headers=auth_headers,
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_invite_as_admin(client: AsyncClient, admin_headers, workspace):
    from app.services.mongo_store import store

    invited, _ = await store.create_default_workspace_for_user(
        email="user@test.com",
        password_hash="hashed-password",
        workspace_name="Invited User",
    )
    res = await client.post(
        f"/api/workspaces/{workspace.id}/invite",
        json={"email": "user@test.com"},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert "accepted" in res.json()["message"]


@pytest.mark.asyncio
async def test_workspace_name_required(client: AsyncClient, auth_headers):
    res = await client.post("/api/workspaces/", json={}, headers=auth_headers)
    assert res.status_code == 422   # Pydantic validation error


@pytest.mark.asyncio
async def test_workspace_unauthenticated(client: AsyncClient):
    res = await client.get("/api/workspaces/")
    assert res.status_code in (401, 403)
