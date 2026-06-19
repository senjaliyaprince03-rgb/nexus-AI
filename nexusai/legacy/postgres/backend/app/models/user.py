import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )  # null for OAuth users
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(
        Enum("user", "admin", name="user_role"), default="user"
    )
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="SET NULL"),
        nullable=True,
    )
    google_sub: Mapped[str | None] = mapped_column(
        String(128), unique=True, nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # relationships
    workspace: Mapped["Workspace"] = relationship(  # type: ignore[name-defined]
        "Workspace", back_populates="members", foreign_keys=[workspace_id]
    )
    owned_workspaces: Mapped[list["Workspace"]] = relationship(  # type: ignore[name-defined]
        "Workspace", back_populates="owner", foreign_keys="Workspace.owner_id"
    )
    documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]
        "Document", back_populates="uploaded_by_user"
    )
    chat_sessions: Mapped[list["ChatSession"]] = relationship(  # type: ignore[name-defined]
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )
