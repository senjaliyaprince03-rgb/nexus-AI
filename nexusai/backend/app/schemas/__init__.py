from __future__ import annotations

"""
All Pydantic v2 request / response schemas.
These are distinct from ORM models — they define the API contract,
not the DB schema.
"""
import uuid
from datetime import datetime
from typing import Any, Generic, Literal, TypeVar

from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator


# ── Base helpers ──────────────────────────────────────────────────────────────

class APIResponse(BaseModel):
    """Generic success wrapper."""
    ok: bool = True
    message: str = "success"


class APIError(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    ok: bool = False
    error: APIError
    detail: str | None = None
    errors: list[dict[str, Any]] | None = None


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    workspace_name: str | None = Field(None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None  # seconds


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=100)


class UserProfileUpdate(BaseModel):
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    phone_number: str | None = Field(None, max_length=20)
    location: str | None = Field(None, max_length=200)
    avatar_url: str | None = None
    theme: str | None = Field(None, max_length=20)
    timezone: str | None = Field(None, max_length=50)
    social_links: dict[str, str] | None = None
    notification_preferences: dict[str, bool] | None = None
    privacy_settings: dict[str, str] | None = None

class UserPublic(BaseModel):
    id: str
    email: str
    role: str
    first_name: str | None = None
    last_name: str | None = None
    bio: str | None = None
    phone_number: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    theme: str | None = None
    timezone: str | None = None
    social_links: dict[str, str] | None = None
    notification_preferences: dict[str, bool] | None = None
    privacy_settings: dict[str, str] | None = None
    workspace_id: str | None
    default_workspace_id: str | None = None
    is_verified: bool = False
    is_active: bool = True
    is_totp_enabled: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspacePublic(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    owner_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class AuthSessionResponse(TokenResponse):
    user: UserPublic | None = None
    workspace: WorkspacePublic | None = None
    requires_2fa: bool = False
    two_factor_token: str | None = None


class CurrentUserResponse(BaseModel):
    user: UserPublic
    workspace: WorkspacePublic | None = None


# ── Document ──────────────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str = "Upload received. Ingestion started."


class DocumentListItem(BaseModel):
    id: str
    filename: str
    status: str
    chunk_count: int
    file_size_bytes: int
    content_type: str
    created_at: datetime
    error_message: str | None = None

    model_config = {"from_attributes": True}


class IngestionProgressEvent(BaseModel):
    """
    Server-Sent Event payload emitted during document ingestion.
    event: progress | complete | error
    """
    event: Literal["progress", "complete", "error"]
    document_id: str
    step: str                          # "parsing" | "chunking" | "embedding" | "storing"
    progress: float = Field(ge=0, le=1)  # 0.0 – 1.0
    chunk_count: int | None = None
    message: str | None = None


# ── Chat / RAG ────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000, validation_alias=AliasChoices("question", "query"))
    session_id: str | None = None    # None = create new session
    workspace_id: str
    top_k: int = Field(default=5, ge=1, le=20)
    use_agents: bool = False               # true = multi-agent graph, false = simple RAG
    mode: Literal["document", "support"] = "document"
    support_intent: Literal["billing", "technical", "account", "privacy", "other"] | None = None
    source_policy: Literal["combined", "workspace_docs", "faq"] = "combined"


class SupportFeedbackRequest(BaseModel):
    session_id: str | None = None
    message_id: str | None = None
    run_id: str | None = None
    rating: Literal["up", "down"]
    comment: str | None = Field(default=None, max_length=500)
    support_intent: Literal["billing", "technical", "account", "privacy", "other"] | None = None


class AgentRunRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000, validation_alias=AliasChoices("question", "input", "query"))
    top_k: int = Field(default=5, ge=1, le=20)
    agent_type: str = Field(default="auto", max_length=40)
    resource_url: str | None = Field(default=None, max_length=2048)


class SourceChunk(BaseModel):
    """A document chunk returned as a citation."""
    chunk_id: str
    document_id: str
    document_filename: str
    content: str
    score: float                           # cosine similarity score
    page_number: int | None = None
    chunk_index: int


class StreamEvent(BaseModel):
    """
    SSE payload. Frontend parses `event` to decide rendering.
    token  → append to current assistant message
    source → store citation
    done   → message complete, show citations
    error  → display error UI
    """
    event: Literal["token", "source", "done", "error"]
    data: str | dict[str, Any] | list[Any]


class ChatMessagePublic(BaseModel):
    id: str
    role: str
    content: str
    source_chunk_ids: list[str]
    confidence_score: float | None
    created_at: datetime
    mode: Literal["document", "support"] = "document"
    metadata: dict[str, Any] = {}

    model_config = {"from_attributes": True}


class ChatSessionPublic(BaseModel):
    id: str
    title: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessagePublic] = []
    mode: Literal["document", "support"] = "document"
    metadata: dict[str, Any] = {}

    model_config = {"from_attributes": True}


# ── Workspace ─────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def no_leading_trailing_whitespace(cls, v: str) -> str:
        return v.strip()


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class AgentRunPublic(BaseModel):
    id: str
    workspace_id: str
    user_id: str | None = None
    agent_type: str = "rag"
    input: dict[str, Any]
    output: dict[str, Any] | None = None
    status: str
    confidence: float | None = None
    citations: list[dict[str, Any]] = []
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class AnalyticsEventPublic(BaseModel):
    id: str
    workspace_id: str
    user_id: str | None = None
    event_type: str
    payload: dict[str, Any] = {}
    created_at: datetime


# ── Pagination ────────────────────────────────────────────────────────────────

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool
