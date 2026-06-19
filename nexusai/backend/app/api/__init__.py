"""
API Routes Package

This package contains all the API route handlers for the NexusAI application.
"""

from . import auth
from . import documents
from . import chat
from . import agents
from . import workspaces
from . import analytics
from . import support
from . import deps

# Import the enhanced module API
from ..modules.agents.enhanced_api import router as modules_router

# Include all routers
__all__ = [
    "auth",
    "documents", 
    "chat",
    "agents",
    "workspaces",
    "analytics",
    "support",
    "deps",
    "modules_router"
]
