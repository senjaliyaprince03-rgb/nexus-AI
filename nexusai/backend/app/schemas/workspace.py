import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class WorkspaceCreate(BaseModel):
    name: str
    slug: str

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-z0-9-]{2,80}$", v):
            raise ValueError("Slug must be 2-80 lowercase letters, numbers, or hyphens")
        return v


class WorkspaceUpdate(BaseModel):
    name: str | None = None


class WorkspacePublic(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    email: str


class MemberPublic(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: str

    model_config = {"from_attributes": True}
