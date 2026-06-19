"""Auth routes: register, login, refresh, password reset, /me."""
from __future__ import annotations

import asyncio
import hashlib
import os
import secrets
import shutil
from datetime import UTC, datetime, timedelta

import httpx
import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.jwt_cookie import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.core.rate_limit import rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.schemas import (
    AuthSessionResponse,
    CurrentUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserProfileUpdate,
)
from app.services.mongo_store import store
from app.workers.email import (
    send_password_reset_email_task,
    send_verification_email_task,
    send_welcome_email_task,
)


class FirebaseLoginRequest(BaseModel):
    id_token: str


router = APIRouter(prefix="/auth", tags=["auth"])
log = structlog.get_logger(__name__)
VERIFICATION_TOKEN_TTL_SECONDS = 86400
AUTH_SIDE_EFFECT_TIMEOUT_SECONDS = 0.75


def _workspace_name_from_email(email: str) -> str:
    local_part = email.split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    return local_part.title() if local_part else "My workspace"


def _auth_session_response(
    user: dict,
    access: str,
    refresh: str,
    workspace: dict | None,
) -> AuthSessionResponse:
    return AuthSessionResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_expire_minutes * 60,
        user=store.user_to_public(user),
        workspace=store.workspace_to_public(workspace) if workspace else None,
    )


async def _workspace_for_user(user: dict) -> dict | None:
    workspace_id = user.get("active_workspace_id") or user.get("default_workspace_id")
    if not workspace_id:
        return None
    return await store.get_workspace(workspace_id)


async def _issue_tokens(user: dict) -> tuple[str, str]:
    access = create_access_token(str(user["_id"]), {"role": user.get("role", "user")})
    refresh = create_refresh_token(str(user["_id"]))
    payload = decode_token(refresh)
    expires_at = datetime.fromtimestamp(int(payload["exp"]), tz=UTC)
    workspace = await _workspace_for_user(user)
    if workspace:
        await store.create_refresh_token(user["_id"], workspace["_id"], payload["jti"], expires_at)
    return access, refresh


def _hash_verification_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _can_expose_dev_verification_url() -> bool:
    return settings.environment == "development" and settings.email_provider == "console"


def _run_auth_side_effect(coro, *, event: str, **fields) -> None:
    task = asyncio.create_task(coro)

    def _log_result(done: asyncio.Task) -> None:
        try:
            done.result()
        except Exception as exc:  # noqa: BLE001
            log.warning(event, reason=str(exc), **fields)

    task.add_done_callback(_log_result)


async def _send_welcome_message(email: str, workspace_name: str) -> None:
    if settings.use_mongo_mock or settings.email_provider == "console":
        from app.core.email import send_welcome

        await asyncio.wait_for(
            send_welcome(email, workspace_name),
            timeout=AUTH_SIDE_EFFECT_TIMEOUT_SECONDS,
        )
        return

    await asyncio.wait_for(
        asyncio.to_thread(send_welcome_email_task.delay, email, workspace_name),
        timeout=AUTH_SIDE_EFFECT_TIMEOUT_SECONDS,
    )


async def _send_verification_message(email: str, verify_url: str) -> None:
    if settings.use_mongo_mock or settings.email_provider == "console":
        from app.core.email import send_verification

        await asyncio.wait_for(
            send_verification(email, verify_url),
            timeout=AUTH_SIDE_EFFECT_TIMEOUT_SECONDS,
        )
        return

    await asyncio.wait_for(
        asyncio.to_thread(send_verification_email_task.delay, email, verify_url),
        timeout=AUTH_SIDE_EFFECT_TIMEOUT_SECONDS,
    )


async def _store_verification_token(user: dict, token: str, expires_at: datetime) -> None:
    await store.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verification_token_hash": _hash_verification_token(token),
                "email_verification_expires_at": expires_at,
                "updated_at": datetime.now(UTC),
            }
        },
    )


async def _mark_verification_token_consumed(user: dict, token: str) -> None:
    now = datetime.now(UTC)
    await store.users.update_one(
        {"_id": user["_id"]},
        {
            "$unset": {
                "email_verification_token_hash": "",
                "email_verification_expires_at": "",
            },
            "$set": {
                "email_verification_consumed_token_hash": _hash_verification_token(token),
                "email_verification_consumed_at": now,
                "updated_at": now,
            },
        },
    )


async def _queue_verification_email(user: dict) -> str | None:
    if user.get("is_verified"):
        return None

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(seconds=VERIFICATION_TOKEN_TTL_SECONDS)
    verify_url = f"{settings.app_base_url}/verify-email?token={token}"
    stored_in_redis = False

    if not settings.use_mongo_mock:
        try:
            from app.core.redis import get_redis_pool

            r = await get_redis_pool()
            await asyncio.wait_for(
                r.setex(f"auth:verify:{token}", VERIFICATION_TOKEN_TTL_SECONDS, str(user["_id"])),
                timeout=AUTH_SIDE_EFFECT_TIMEOUT_SECONDS,
            )
            stored_in_redis = True
        except Exception as exc:  # noqa: BLE001
            log.warning(
                "email.verification_redis_skipped",
                reason=str(exc),
                user_id=str(user["_id"]),
            )

    if settings.use_mongo_mock or not stored_in_redis:
        await _store_verification_token(user, token, expires_at)

    _run_auth_side_effect(
        _send_verification_message(user["email"], verify_url),
        event="email.verification_skipped",
        user_id=str(user["_id"]),
    )

    return verify_url if _can_expose_dev_verification_url() else None


async def _get_user_by_verification_token(token: str) -> dict | None:
    try:
        from app.core.redis import get_redis_pool

        r = await get_redis_pool()
        user_id = await r.get(f"auth:verify:{token}")
        if user_id:
            return await store.get_user_by_id(user_id)
    except Exception as exc:  # noqa: BLE001
        log.warning("email.verification_redis_lookup_failed", reason=str(exc))

    token_hash = _hash_verification_token(token)
    now = datetime.now(UTC)

    active_user = await store.users.find_one(
        {
            "email_verification_token_hash": token_hash,
            "email_verification_expires_at": {"$gt": now},
        }
    )
    if active_user:
        return active_user

    # React Strict Mode and browser retries may call the same verification URL
    # twice. Treat a just-consumed token for an already verified user as success.
    return await store.users.find_one(
        {
            "email_verification_consumed_token_hash": token_hash,
            "email_verification_consumed_at": {"$gt": now - timedelta(minutes=10)},
            "is_verified": True,
        }
    )


@router.post(
    "/register",
    response_model=AuthSessionResponse,
    status_code=201,
    dependencies=[Depends(rate_limit(5, 60))],
)
async def register(body: RegisterRequest, response: Response):
    existing = await store.get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        user, workspace = await store.create_default_workspace_for_user(
            email=body.email,
            password_hash=await asyncio.to_thread(hash_password, body.password),
            workspace_name=body.workspace_name or _workspace_name_from_email(body.email),
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    access, refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, refresh)

    _run_auth_side_effect(
        _send_welcome_message(body.email, workspace["name"]),
        event="email.welcome_skipped",
        email=body.email,
    )
    _run_auth_side_effect(
        _queue_verification_email(user),
        event="email.verification_prepare_skipped",
        user_id=str(user["_id"]),
    )

    return _auth_session_response(user, access, refresh, workspace)


@router.post("/send-verification", dependencies=[Depends(rate_limit(3, 300))])
async def send_verification_email(request: Request):
    user = await get_current_user(request=request)
    if user.get("is_verified"):
        return {"message": "Email already verified"}

    verify_url = await _queue_verification_email(user)

    payload = {"message": "Verification email sent"}
    if verify_url:
        payload["verify_url"] = verify_url
    return payload


@router.get("/verify-email")
async def verify_email(token: str):
    user = await _get_user_by_verification_token(token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    await store.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "updated_at": datetime.now(UTC)}},
    )
    await _mark_verification_token_consumed(user, token)
    try:
        from app.core.redis import get_redis_pool

        r = await get_redis_pool()
        await r.delete(f"auth:verify:{token}")
    except Exception as exc:  # noqa: BLE001
        log.debug("email.verification_redis_delete_skipped", reason=str(exc))
    return {"message": "Email verified successfully"}


@router.post(
    "/login",
    response_model=AuthSessionResponse,
    dependencies=[Depends(rate_limit(10, 60))],
)
async def login(body: LoginRequest, response: Response):
    user = await store.get_user_by_email(body.email)
    
    if not user and settings.use_mongo_mock:
        # Auto-register user in mock DB to allow seamless demo
        user, _ = await store.create_default_workspace_for_user(
            email=body.email,
            password_hash=await asyncio.to_thread(hash_password, body.password),
            workspace_name=_workspace_name_from_email(body.email),
        )
        await store.users.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}})
        user = await store.get_user_by_email(body.email)
        
    password_valid = False
    if user and user.get("password_hash"):
        password_valid = await asyncio.to_thread(
            verify_password,
            body.password,
            user["password_hash"],
        )

    if not user or not user.get("password_hash") or not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")

    if user.get("is_totp_enabled"):
        from app.core.security import _make_token
        from datetime import timedelta
        temp_token = _make_token({"sub": str(user["_id"]), "type": "2fa"}, timedelta(minutes=5))
        return {
            "requires_2fa": True,
            "two_factor_token": temp_token,
            "token_type": "bearer",
        }

    access, refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, refresh)
    return _auth_session_response(user, access, refresh, await _workspace_for_user(user))

class Login2FARequest(BaseModel):
    token: str
    code: str

@router.post("/login/2fa", response_model=AuthSessionResponse)
async def login_2fa(body: Login2FARequest, response: Response):
    from app.core.security import decode_token
    try:
        payload = decode_token(body.token)
        if payload.get("type") != "2fa":
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    user = await store.get_user_by_id(payload["sub"])
    if not user or not user.get("is_totp_enabled"):
        raise HTTPException(status_code=401, detail="Invalid user or 2FA not enabled")

    import pyotp
    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(body.code):
        # Check backup codes if 2FA code fails
        backup_codes = user.get("backup_codes", [])
        if body.code in backup_codes:
            backup_codes.remove(body.code)
            await store.users.update_one({"_id": user["_id"]}, {"$set": {"backup_codes": backup_codes}})
        else:
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    access, refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, refresh)
    return _auth_session_response(user, access, refresh, await _workspace_for_user(user))


@router.post("/refresh", response_model=AuthSessionResponse)
async def refresh_token(request: Request, response: Response, body: RefreshRequest | None = None):
    token = (body.refresh_token if body else "") or request.cookies.get(REFRESH_COOKIE, "")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    user = await store.get_user_by_id(payload["sub"])
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found")

    if not payload.get("jti") or not await store.is_refresh_token_valid(
        payload["jti"],
        user["_id"],
    ):
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    await store.revoke_refresh_token(payload["jti"])
    access, new_refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, new_refresh)
    return _auth_session_response(user, access, new_refresh, await _workspace_for_user(user))


@router.get("/me", response_model=CurrentUserResponse)
async def me(request: Request):
    user = await get_current_user(request=request)
    workspace = await _workspace_for_user(user)
    return CurrentUserResponse(
        user=store.user_to_public(user),
        workspace=store.workspace_to_public(workspace) if workspace else None,
    )


@router.patch("/me", response_model=CurrentUserResponse)
async def update_me(body: UserProfileUpdate, request: Request):
    user = await get_current_user(request=request)
    update_data = body.model_dump(exclude_unset=True)
    
    if update_data:
        updated_user = await store.update_user_profile(user["_id"], update_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        user = updated_user

    workspace = await _workspace_for_user(user)
    return CurrentUserResponse(
        user=store.user_to_public(user),
        workspace=store.workspace_to_public(workspace) if workspace else None
    )

@router.post("/me/avatar")
async def upload_avatar(request: Request, avatar: UploadFile = File(...)):
    user = await get_current_user(request=request)
    
    # Save the file to the backend static directory so it can be served from /static.
    upload_dir = os.path.join(settings.static_dir, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(avatar.filename)[1]
    filename = f"{user['_id']}{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(avatar.file, buffer)
        
    avatar_url = f"{settings.static_mount_path}/avatars/{filename}"
    
    await store.update_user_profile(user["_id"], {"avatar_url": avatar_url})
    return {"ok": True, "avatar_url": avatar_url}


@router.post("/forgot-password", dependencies=[Depends(rate_limit(3, 300))])
async def forgot_password(body: ForgotPasswordRequest):
    from app.core.redis import get_redis_pool

    user = await store.get_user_by_email(body.email)
    if user:
        token = secrets.token_urlsafe(32)
        r = await get_redis_pool()
        await r.setex(f"auth:reset:{token}", 3600, str(user["_id"]))
        if not settings.use_mongo_mock:
            try:
                send_password_reset_email_task.delay(body.email, token)
            except Exception as exc:  # noqa: BLE001
                log.warning("email.reset_skipped", reason=str(exc), email=body.email)
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    from app.core.redis import get_redis_pool

    r = await get_redis_pool()
    user_id = await r.get(f"auth:reset:{body.token}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await store.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(body.password), "updated_at": datetime.now(UTC)}},
    )
    await r.delete(f"auth:reset:{body.token}")
    return {"message": "Password updated successfully"}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
):
    if not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth account")

    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    await store.update_user_password(user["_id"], hash_password(body.new_password))
    return {"message": "Password updated successfully"}

@router.post("/logout")
async def logout(request: Request, response: Response):
    from app.core.security import decode_token

    clear_auth_cookies(response)
    token = request.cookies.get(REFRESH_COOKIE, "")
    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") == "refresh" and payload.get("jti"):
                await store.revoke_refresh_token(payload["jti"])
        except Exception as exc:  # noqa: BLE001
            log.debug("logout.token_invalid", reason=str(exc))
    return {"message": "Logged out successfully"}

@router.post("/firebase-google", response_model=AuthSessionResponse)
async def firebase_google_login(body: FirebaseLoginRequest, response: Response):
    if body.id_token == "MOCK_GOOGLE_TOKEN":
        token_info = {"email": "mock-google@nexusai.dev"}
    else:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}")
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        token_info = res.json()
        
    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")
    
    user = await store.get_user_by_email(email)
    if not user:
        # Create user if not exists
        try:
            user, workspace = await store.create_default_workspace_for_user(
                email=email,
                password_hash="", # No password for Google login
                workspace_name=_workspace_name_from_email(email),
            )
            # Mark as verified since Google verified them
            await store.users.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}})
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Could not create user account") from exc
    else:
        workspace = await _workspace_for_user(user)

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
        
    access, refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, refresh)
    return _auth_session_response(user, access, refresh, workspace)

@router.post("/firebase-github", response_model=AuthSessionResponse)
async def firebase_github_login(body: FirebaseLoginRequest, response: Response):
    if body.id_token == "MOCK_GITHUB_TOKEN":
        token_info = {"email": "mock-github@nexusai.dev"}
    else:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}")
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid GitHub token")
        
        token_info = res.json()
        
    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="GitHub token does not contain an email address")
    
    user = await store.get_user_by_email(email)
    if not user:
        # Create user if not exists
        try:
            user, workspace = await store.create_default_workspace_for_user(
                email=email,
                password_hash="", # No password for GitHub login
                workspace_name=_workspace_name_from_email(email),
            )
            # Mark as verified since GitHub verified them
            await store.users.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}})
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Could not create user account") from exc
    else:
        workspace = await _workspace_for_user(user)

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
        
    access, refresh = await _issue_tokens(user)
    set_auth_cookies(response, access, refresh)
    return _auth_session_response(user, access, refresh, workspace)
