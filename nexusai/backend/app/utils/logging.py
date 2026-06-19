# Re-export from app.core.logging to avoid duplicate implementations.
# Use: from app.utils.logging import get_logger
from app.core.logging import configure_logging, get_logger  # noqa: F401
