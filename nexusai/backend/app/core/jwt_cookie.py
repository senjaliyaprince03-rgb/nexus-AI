"""
Secure JWT persistence via httpOnly cookies.

Why httpOnly cookies instead of localStorage:
  - localStorage is readable by any JS on the page — XSS attack steals the token.
  - httpOnly cookies are inaccessible to JS — XSS can't read the token.
  - SameSite=Lax blocks CSRF in most cases (combined with the Origin check in CORS).

Usage in FastAPI routes:
    from app.core.jwt_cookie import set_auth_cookies, clear_auth_cookies

    @router.post("/login")
    async def login(response: Response, ...):
        tokens = ...
        set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
        return {"ok": True}

Usage in auth dependencies (replaces Bearer header extraction):
    from app.core.jwt_cookie import get_token_from_request

    async def get_current_user(request: Request):
        token = get_token_from_request(request)
        ...
"""
from __future__ import annotations

from fastapi import Request, Response

from app.core.config import settings

# Cookie names
ACCESS_COOKIE  = "nexusai_access"
REFRESH_COOKIE = "nexusai_refresh"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    access_max_age:  int = 3600,       # 1 hour
    refresh_max_age: int = 2592000,    # 30 days
) -> None:
    """
    Write JWT tokens into httpOnly, Secure, SameSite=Lax cookies.

    httpOnly  — JS cannot read the cookie (XSS protection).
    Secure    — Only sent over HTTPS (set to False in dev).
    SameSite  — Lax: sent on top-level navigations, blocks cross-site POST (CSRF protection).
    Path=/    — Available to all routes, not just the route that set it.
    """
    _set_cookie(response, ACCESS_COOKIE,  access_token,  access_max_age)
    _set_cookie(response, REFRESH_COOKIE, refresh_token, refresh_max_age)


def clear_auth_cookies(response: Response) -> None:
    """Delete both auth cookies (used on logout)."""
    response.delete_cookie(
        ACCESS_COOKIE, path="/", secure=settings.is_production, httponly=True, samesite="lax"
    )
    response.delete_cookie(
        REFRESH_COOKIE, path="/", secure=settings.is_production, httponly=True, samesite="lax"
    )


def get_token_from_request(request: Request) -> str | None:
    """
    Extract the access token from either:
      1. The httpOnly cookie (browser clients)
      2. The Authorization: Bearer header (API clients, mobile apps)

    Cookie takes precedence — browser always sends it automatically.
    """
    # 1. Cookie
    cookie_token = request.cookies.get(ACCESS_COOKIE)
    if cookie_token:
        return cookie_token

    # 2. Bearer header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]

    # 3. Query param (for EventSource SSE)
    query_token = request.query_params.get("token")
    if query_token:
        return query_token

    return None


def _set_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        path="/",
        secure=settings.is_production,   # False in dev (no HTTPS), True in production
        httponly=True,
        samesite="lax",
    )
