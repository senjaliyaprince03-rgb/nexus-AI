import asyncio
from collections.abc import AsyncGenerator

import redis.asyncio as aioredis

from app.core.config import settings


class _RedisPool:
    """Encapsulates the shared aioredis client lifecycle.

    Replaces the bare module-level ``_pool`` global and its ``global``
    statements. An ``asyncio.Lock`` prevents the concurrent-write race
    where two coroutines both observe ``_client is None`` and each
    construct a separate client with its own connection pool.
    """

    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None
        self._lock = asyncio.Lock()

    async def get(self) -> aioredis.Redis:
        if self._client is None:
            async with self._lock:
                if self._client is None:
                    self._client = aioredis.from_url(
                        settings.redis_url,
                        encoding="utf-8",
                        decode_responses=True,
                        max_connections=20,
                    )
        return self._client

    async def close(self) -> None:
        async with self._lock:
            if self._client is not None:
                await self._client.aclose()
                self._client = None


_pool = _RedisPool()


async def get_redis_pool() -> aioredis.Redis:
    return await _pool.get()


async def get_redis_client() -> aioredis.Redis:
    """Alias used by scheduled tasks."""
    return await _pool.get()


async def publish(channel: str, message: str) -> None:
    """Publish a message to a Redis channel using the shared pool."""
    r = await _pool.get()
    await r.publish(channel, message)


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """FastAPI dependency — yields the shared Redis client."""
    yield await _pool.get()


async def close_redis() -> None:
    await _pool.close()
