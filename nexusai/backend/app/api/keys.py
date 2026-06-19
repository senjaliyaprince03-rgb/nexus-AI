"""API Key routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_workspace
from app.services.mongo_store import store

router = APIRouter(prefix="/keys", tags=["keys"])

class CreateKeyRequest(BaseModel):
    name: str

class CreateKeyResponse(BaseModel):
    key: str
    key_record: dict

@router.post("/", status_code=201)
async def create_key(
    body: CreateKeyRequest,
    user: dict = Depends(get_current_user),
):
    workspace_id = require_workspace(user)
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Key name is required")
        
    raw_key, doc = await store.create_api_key(workspace_id=workspace_id, user_id=user["_id"], name=body.name)
    return {"key": raw_key, "key_record": doc}

@router.get("/")
async def list_keys(user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    keys = await store.list_api_keys(workspace_id=workspace_id)
    return {"keys": keys}

@router.delete("/{key_id}", status_code=204)
async def revoke_key(key_id: str, user: dict = Depends(get_current_user)):
    workspace_id = require_workspace(user)
    success = await store.revoke_api_key(key_id=key_id, workspace_id=workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or already revoked")
