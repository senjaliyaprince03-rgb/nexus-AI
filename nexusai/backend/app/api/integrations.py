"""Integrated project registry routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, require_workspace
from app.services.integration_registry import list_integrated_projects

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/projects")
async def projects(check_health: bool = True, user: dict = Depends(get_current_user)):
    require_workspace(user)
    return await list_integrated_projects(check_health=check_health)
