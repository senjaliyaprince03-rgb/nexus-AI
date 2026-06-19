"""Redis sliding-window rate limiting for NexusAI FastAPI."""
from __future__ import annotations
import time
import uuid
from fastapi import HTTPException, Request, status
from app.core.redis import get_redis_pool


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """
    Sliding-window rate limiter using Redis sorted sets.
    Raises HTTP 429 when limit is exceeded.

    Each request is stored as a unique member (timestamp:uuid4) to prevent
    concurrent requests within the same microsecond from colliding and being
    treated as a single entry, which would allow bypassing the rate limit.
    """
    r = await get_redis_pool()
    now = time.time()
    window_start = now - window_seconds
    full_key = f"rl:{key}"

    # Unique member prevents concurrent-request key collisions (security fix)
    member = f"{now}:{uuid.uuid4()}"

    try:
        pipe = r.pipeline()
        pipe.zremrangebyscore(full_key, 0, window_start)
        pipe.zadd(full_key, {member: now})
        pipe.zcard(full_key)
        pipe.expire(full_key, window_seconds + 1)
        results = await pipe.execute()
        count = results[2]
    except Exception:
        return

    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {limit} requests per {window_seconds}s",
            headers={"Retry-After": str(window_seconds)},
        )


def rate_limit(limit: int = 60, window_seconds: int = 60):
    """FastAPI dependency factory for per-IP rate limiting.

    Uses X-Forwarded-For only when the request arrives from a trusted
    reverse-proxy address (127.0.0.1 or the RFC-1918 ranges). Direct
    internet clients cannot spoof their own rate-limit key.
    """
    _TRUSTED_PROXIES = ("127.0.0.1", "::1", "10.", "172.16.", "192.168.")

    async def dependency(request: Request) -> None:
        peer = request.client.host if request.client else "unknown"
        is_trusted_proxy = any(peer.startswith(p) for p in _TRUSTED_PROXIES)
        if is_trusted_proxy:
            client_ip = (
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or request.headers.get("X-Real-IP")
                or peer
            )
        else:
            client_ip = peer
        await check_rate_limit(f"ip:{client_ip}:{request.url.path}", limit, window_seconds)
    return dependency
