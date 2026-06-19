"""FastAPI dependency injection for NexusAI."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.core.security import decode_token
from app.services.mongo_store import AccessDeniedError, MongoStore, NotFoundError, store


async def get_current_user(request: Request) -> dict:
    """
    Resolve the authenticated user from either the auth cookie or Bearer token.
    Returns the MongoDB user document so route handlers can keep access control
    decisions close to the data layer.
    """
    from app.core.jwt_cookie import get_token_from_request

    token = get_token_from_request(request)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token.startswith("nx_"):
        key_record = await store.get_api_key_record(token)
        if not key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key",
            )
        return {
            "_id": key_record["created_by"],
            "email": "api_key@nexusai.local",
            "role": "user",
            "is_active": True,
            "active_workspace_id": key_record["workspace_id"],
            "default_workspace_id": key_record["workspace_id"],
        }

    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user = await store.get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def require_workspace(user: dict) -> str:
    workspace_id = user.get("active_workspace_id") or user.get("default_workspace_id")
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no workspace",
        )
    return str(workspace_id)


async def ensure_workspace_access(user: dict, workspace_id: str) -> None:
    try:
        await store.require_workspace_access(user["_id"], workspace_id)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    except AccessDeniedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace access denied")
