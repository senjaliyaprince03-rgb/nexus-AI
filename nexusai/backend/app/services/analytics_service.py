"""Analytics service: query volume + document usage from MongoDB citation data."""
from __future__ import annotations

from app.services.mongo_store import store


async def get_query_volume(workspace_id: str, days: int) -> list[dict]:
    return await store.get_query_volume(workspace_id=workspace_id, days=days)


async def get_document_usage(workspace_id: str) -> list[dict]:
    return await store.get_document_usage(workspace_id=workspace_id)
