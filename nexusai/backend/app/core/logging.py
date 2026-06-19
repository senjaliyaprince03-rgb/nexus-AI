import logging
import sys

import structlog

from app.core.config import settings


class HealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Filter out uvicorn access logs for health check queries
        return "GET /health" not in record.getMessage()


def configure_logging() -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.is_production:
        # JSON output for log aggregators (Datadog, Loki, etc.)
        processors = shared_processors + [structlog.processors.JSONRenderer()]
    else:
        # Human-readable coloured output for local dev
        processors = shared_processors + [structlog.dev.ConsoleRenderer(colors=True)]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging so third-party libs show up
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Filter out health check access logs from polluting dev terminal
    logging.getLogger("uvicorn.access").addFilter(HealthCheckFilter())


def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name)
