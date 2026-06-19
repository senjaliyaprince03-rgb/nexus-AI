"""
Celery tasks for transactional email delivery.

These run outside the FastAPI request lifecycle so provider latency/failures do
not depend on in-process background execution.
"""
from __future__ import annotations

import asyncio

from app.core.email import send_password_reset, send_verification, send_welcome
from app.workers.celery_app import celery_app


@celery_app.task(
    name="app.workers.email.send_welcome_email_task",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def send_welcome_email_task(self, to_email: str, workspace_name: str) -> None:
    asyncio.run(send_welcome(to_email, workspace_name))


@celery_app.task(
    name="app.workers.email.send_verification_email_task",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def send_verification_email_task(self, to_email: str, verify_url: str) -> None:
    asyncio.run(send_verification(to_email, verify_url))


@celery_app.task(
    name="app.workers.email.send_password_reset_email_task",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def send_password_reset_email_task(self, to_email: str, reset_token: str) -> None:
    asyncio.run(send_password_reset(to_email, reset_token))
