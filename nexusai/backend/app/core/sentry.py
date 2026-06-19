"""
Sentry error tracking integration for NexusAI backend.

Add to backend/.env:
  SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789

Add to frontend/.env.local:
  NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789

Call configure_sentry() at app startup in main.py lifespan.
"""
from __future__ import annotations
import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)


def configure_sentry(release: str = "nexusai@0.1.0") -> None:
    """
    Initialise Sentry SDK for FastAPI.
    Captures unhandled exceptions, slow requests, and DB query performance.

    Call from main.py lifespan:
        from app.core.sentry import configure_sentry
        configure_sentry()
    """
    if not settings.sentry_dsn:
        log.info("sentry.disabled", hint="Set SENTRY_DSN in .env to enable")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        import logging

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            release=release,
            environment=settings.environment,
            integrations=[
                FastApiIntegration(transaction_style="url"),
                CeleryIntegration(monitor_beat_tasks=True),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.WARNING,      # Breadcrumbs for WARNING+
                    event_level=logging.ERROR,  # Send events for ERROR+
                ),
            ],
            # Sample rates — tune per environment
            traces_sample_rate=0.1 if settings.is_production else 1.0,
            profiles_sample_rate=0.1,
            # PII scrubbing — never send passwords or tokens to Sentry
            send_default_pii=False,
            before_send=_scrub_sensitive,
        )
        log.info("sentry.enabled", environment=settings.environment)

    except ImportError:
        if settings.environment != "development":
            log.warning("sentry.not_installed", hint="pip install sentry-sdk[fastapi]")
        else:
            log.debug("sentry.not_installed")


def capture_exception(exc: Exception, context: dict | None = None) -> None:
    """Manually capture an exception with optional extra context."""
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(exc)
    except ImportError:
        # sentry-sdk not installed — already warned in configure_sentry().
        pass
    except RuntimeError as err:
        # sentry_sdk.capture_exception can raise RuntimeError when called
        # before init() or after the SDK is shut down.
        log.debug("sentry.capture_skipped", reason=str(err))


def set_user_context(user_id: str, email: str) -> None:
    """Call from auth middleware to attach user info to Sentry events."""
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk
        sentry_sdk.set_user({"id": user_id, "email": email})
    except ImportError:
        # sentry-sdk not installed — already warned in configure_sentry().
        pass
    except RuntimeError as err:
        # set_user can raise RuntimeError when the SDK hub is not initialised.
        log.debug("sentry.set_user_skipped", reason=str(err))


def _scrub_sensitive(event: dict, hint: dict) -> dict | None:
    """
    Before-send hook: strip sensitive fields from Sentry payloads.
    Removes hashed_password, access_token, and Authorization headers.
    """
    sensitive_keys = {"hashed_password", "password", "access_token",
                      "refresh_token", "authorization", "secret_key"}

    def scrub(obj: object) -> object:
        if isinstance(obj, dict):
            return {k: "[REDACTED]" if k.lower() in sensitive_keys else scrub(v)
                    for k, v in obj.items()}
        if isinstance(obj, list):
            return [scrub(item) for item in obj]
        return obj

    return scrub(event)  # type: ignore[return-value]
