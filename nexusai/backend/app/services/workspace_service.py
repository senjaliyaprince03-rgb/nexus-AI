"""Workspace business logic backed by MongoDB."""
from __future__ import annotations

from fastapi import HTTPException

from app.core.mongo import to_object_id, utc_now
from app.services.mongo_store import store


async def create_workspace(name: str, owner_id, session=None):  # noqa: D401, ANN001
    if not name.strip():
        raise HTTPException(status_code=422, detail="Workspace name is required")
    workspace = await store.create_workspace(owner_id=owner_id, name=name)
    return store.workspace_to_public(workspace)


async def invite_user(workspace_id, email: str, session=None):  # noqa: D401, ANN001
    user = await store.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    workspace = await store.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await store.workspace_members.update_one(
        {"workspace_id": to_object_id(workspace_id), "user_id": user["_id"]},
        {
            "$set": {
                "workspace_id": to_object_id(workspace_id),
                "user_id": user["_id"],
                "role": "member",
                "updated_at": utc_now(),
            },
            "$setOnInsert": {"created_at": utc_now()},
        },
        upsert=True,
    )
    return {"message": f"{email} added to workspace"}
