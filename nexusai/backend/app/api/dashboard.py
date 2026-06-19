"""Unified dashboard routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, require_workspace
from app.services.dashboard_service import build_dashboard_overview

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
async def overview(check_health: bool = True, user: dict = Depends(get_current_user)):
    require_workspace(user)
    return await build_dashboard_overview(user=user, check_health=check_health)
