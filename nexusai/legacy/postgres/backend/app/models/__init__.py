"""
ORM model registry — import every model class here.

Alembic's env.py does `import app.models` and inspects Base.metadata.
If a model is never imported, its table is invisible to autogenerate.

Gap-analysis bug fixed: file was previously empty.
"""
from app.models.models import (  # noqa: F401
    Base,
    AgentRun,
    AgentRunStatus,
    ChatMessage,
    ChatSession,
    Document,
    DocumentChunk,
    DocumentStatus,
    MessageRole,
    User,
    UserRole,
    Workspace,
)

__all__ = [
    "Base", "AgentRun", "AgentRunStatus", "ChatMessage", "ChatSession", "Document",
    "DocumentChunk", "DocumentStatus", "MessageRole",
    "User", "UserRole", "Workspace",
]
