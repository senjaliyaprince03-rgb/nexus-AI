"""Workspace CRUD + member invite routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.mongo import to_object_id, utc_now
from app.schemas import InviteUserRequest, WorkspaceCreate, WorkspacePublic
from app.services.mongo_store import store

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("/", response_model=WorkspacePublic, status_code=201)
async def create_workspace(
    body: WorkspaceCreate,
    user: dict = Depends(get_current_user),
):
    workspace = await store.create_workspace(owner_id=user["_id"], name=body.name)
    return store.workspace_to_public(workspace)


@router.get("/")
async def list_workspaces(
    user: dict = Depends(get_current_user),
):
    workspaces = await store.list_workspaces_for_user(user["_id"])
    if not workspaces:
        return []
    return [store.workspace_to_public(workspace) for workspace in workspaces]


@router.post("/{workspace_id}/invite")
async def invite_user(
    workspace_id: str,
    body: InviteUserRequest,
    user: dict = Depends(get_current_user),
):
    workspace = await store.require_workspace_access(user["_id"], workspace_id)
    if workspace.get("owner_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Workspace access denied")
    invited = await store.get_user_by_email(body.email)
    if not invited:
        raise HTTPException(status_code=404, detail="User not found")
    await store.workspace_members.update_one(
        {"workspace_id": workspace["_id"], "user_id": invited["_id"]},
        {
            "$set": {
                "workspace_id": workspace["_id"],
                "user_id": invited["_id"],
                "role": body.role,
                "updated_at": utc_now(),
            },
            "$setOnInsert": {
                "created_at": utc_now(),
            },
        },
        upsert=True,
    )
    return {"message": "Invitation accepted"}


@router.get("/{workspace_id}", response_model=WorkspacePublic)
async def get_workspace(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    workspace = await store.require_workspace_access(user["_id"], workspace_id)
    return store.workspace_to_public(workspace)


@router.get("/{workspace_id}/members")
async def list_workspace_members(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    await store.require_workspace_access(user["_id"], workspace_id)
    members_cursor = store.workspace_members.find(
        {"workspace_id": to_object_id(workspace_id)}
    )
    members = []
    async for m in members_cursor:
        member_user = await store.get_user_by_id(m["user_id"])
        if member_user:
            members.append(
                {
                    "id": str(m["user_id"]),
                    "email": member_user.get("email", ""),
                    "role": m.get("role", "member"),
                    "first_name": member_user.get("first_name"),
                    "last_name": member_user.get("last_name"),
                    "avatar_url": member_user.get("avatar_url"),
                    "joined_at": str(m.get("created_at", "")),
                }
            )
    return members


@router.get("/{workspace_id}/stats")
async def workspace_stats(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    await store.require_workspace_access(user["_id"], workspace_id)
    ws_oid = to_object_id(workspace_id)
    members_count = await store.workspace_members.count_documents(
        {"workspace_id": ws_oid}
    )
    docs_count = await store.documents.count_documents(
        {"workspace_id": ws_oid}
    )
    sessions_count = await store.chat_sessions.count_documents(
        {"workspace_id": ws_oid}
    )
    return {
        "members": members_count,
        "documents": docs_count,
        "chat_sessions": sessions_count,
    }
