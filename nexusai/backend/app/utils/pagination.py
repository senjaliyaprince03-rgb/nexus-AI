"""Generic pagination helpers for NexusAI list endpoints."""
from __future__ import annotations
from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool


def paginate(items: list[T], total: int, page: int, page_size: int) -> PaginatedResponse[T]:
    return PaginatedResponse(
        items=items, total=total, page=page,
        page_size=page_size, has_next=(page * page_size) < total,
    )
