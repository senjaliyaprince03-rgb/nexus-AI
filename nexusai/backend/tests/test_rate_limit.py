"""Unit tests for the sliding-window rate limiter."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.testclient import TestClient

from app.core.rate_limit import check_rate_limit, rate_limit


def _make_mock_request(ip: str = "127.0.0.1", path: str = "/test") -> MagicMock:
    req = MagicMock(spec=Request)
    req.client = MagicMock()
    req.client.host = ip
    req.url = MagicMock()
    req.url.path = path
    req.headers = {}
    return req


@pytest.mark.asyncio
async def test_check_rate_limit_allows_under_limit(mock_redis) -> None:
    # Ensure the Redis pool returns our mocked Redis client
    mock_redis.get.return_value = mock_redis

    mock_pipe = MagicMock()
    # zcard is the 3rd operation in pipeline (index 2)
    mock_pipe.execute = AsyncMock(return_value=[None, None, 5, None])
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)

    # Should run without raising any exception since 5 <= 10
    await check_rate_limit(key="test-key", limit=10, window_seconds=60)

    mock_redis.pipeline.assert_called_once()
    mock_pipe.zremrangebyscore.assert_called_once()
    mock_pipe.zadd.assert_called_once()
    mock_pipe.zcard.assert_called_once()
    mock_pipe.expire.assert_called_once()


@pytest.mark.asyncio
async def test_check_rate_limit_blocks_over_limit(mock_redis) -> None:
    mock_redis.get.return_value = mock_redis

    mock_pipe = MagicMock()
    # zcard returns 15, which is > 10
    mock_pipe.execute = AsyncMock(return_value=[None, None, 15, None])
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)

    with pytest.raises(HTTPException) as exc_info:
        await check_rate_limit(key="test-key", limit=10, window_seconds=60)

    assert exc_info.value.status_code == 429
    assert "Rate limit exceeded" in exc_info.value.detail
    assert exc_info.value.headers["Retry-After"] == "60"


@pytest.mark.asyncio
async def test_rate_limit_dependency_factory(mock_redis) -> None:
    mock_redis.get.return_value = mock_redis

    mock_pipe = MagicMock()
    mock_pipe.execute = AsyncMock(return_value=[None, None, 1, None])
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)

    dep = rate_limit(limit=5, window_seconds=30)
    req = _make_mock_request(ip="192.168.1.50", path="/query")

    # Should run successfully
    await dep(req)


@pytest.mark.asyncio
async def test_rate_limit_dependency_proxy_header(mock_redis) -> None:
    mock_redis.get.return_value = mock_redis

    mock_pipe = MagicMock()
    mock_pipe.execute = AsyncMock(return_value=[None, None, 1, None])
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)

    dep = rate_limit(limit=5, window_seconds=30)
    req = _make_mock_request(ip="127.0.0.1", path="/query")
    req.headers = {"X-Forwarded-For": "203.0.113.195, 127.0.0.1"}

    await dep(req)
