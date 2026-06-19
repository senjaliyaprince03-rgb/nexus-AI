"""
Re-exports from the canonical schemas package.
Kept for backwards-compat with any direct imports of app.schemas.document.
"""
from app.schemas import (  # noqa: F401
    DocumentUploadResponse,
    DocumentListItem,
    IngestionProgressEvent,
    PaginatedResponse,
)
