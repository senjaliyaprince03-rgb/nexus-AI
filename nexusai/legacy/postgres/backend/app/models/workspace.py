import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(
        Enum("free", "pro", "enterprise", name="workspace_plan"),
        default="free",
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # relationships
    owner: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="owned_workspaces", foreign_keys=[owner_id]
    )
    documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]
        "Document", back_populates="workspace", cascade="all, delete-orphan"
    )
    members: Mapped[list["User"]] = relationship(  # type: ignore[name-defined]
        "User",
        back_populates="workspace",
        primaryjoin="Workspace.id == foreign(User.workspace_id)",
    )
