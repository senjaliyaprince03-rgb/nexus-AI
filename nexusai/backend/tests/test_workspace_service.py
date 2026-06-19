"""WorkspaceService unit tests."""
from __future__ import annotations

from bson import ObjectId
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.services.workspace_service import create_workspace, invite_user


@pytest.mark.asyncio
async def test_create_workspace_success() -> None:
    workspace = {"_id": "ws-1", "name": "My WS", "slug": "my-ws", "plan": "free"}
    public_workspace = {"id": "ws-1", "name": "My WS", "slug": "my-ws", "plan": "free"}

    with patch("app.services.workspace_service.store.create_workspace", new=AsyncMock(return_value=workspace)), patch(
        "app.services.workspace_service.store.workspace_to_public", return_value=public_workspace
    ):
        result = await create_workspace("My WS", "owner-1")

    assert result["id"] == "ws-1"


@pytest.mark.asyncio
async def test_create_workspace_blank_name_raises() -> None:
    with pytest.raises(HTTPException) as exc:
        await create_workspace("   ", "owner-1")
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_invite_user_success() -> None:
    user = {"_id": ObjectId(), "email": "invitee@test.com"}
    workspace = {"_id": ObjectId(), "name": "Test"}

    with patch("app.services.workspace_service.store.get_user_by_email", new=AsyncMock(return_value=user)), patch(
        "app.services.workspace_service.store.get_workspace", new=AsyncMock(return_value=workspace)
    ), patch("app.services.workspace_service.store.workspace_members.update_one", new=AsyncMock()):
        result = await invite_user(str(workspace["_id"]), "invitee@test.com")

    assert "added to workspace" in result["message"]


@pytest.mark.asyncio
async def test_invite_user_not_found_raises() -> None:
    with patch("app.services.workspace_service.store.get_user_by_email", new=AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc:
            await invite_user("ws-1", "ghost@test.com")
    assert exc.value.status_code == 404
