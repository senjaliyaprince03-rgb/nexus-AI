"""
Celery application factory for NexusAI.

Queue layout:
  ingestion — document parsing, chunking, embedding (CPU/IO heavy)
  agents    — LangGraph multi-agent runs (LLM heavy)
  default   — everything else (analytics events, notifications)
"""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "nexusai",
    broker="memory://" if settings.use_mongo_mock else settings.redis_url,
    backend="cache+memory://" if settings.use_mongo_mock else settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,             # re-queue on worker crash
    worker_prefetch_multiplier=1,    # one task per worker at a time (LLM tasks are slow)
    result_expires=3600,             # keep results for 1 hour
    task_always_eager=settings.use_mongo_mock,
    task_eager_propagates=settings.use_mongo_mock,
    task_routes={
        "app.workers.ingestion.*": {"queue": "ingestion"},
        "app.workers.agent_run.*": {"queue": "agents"},
        "app.workers.reindex.*":   {"queue": "ingestion"},
        "app.workers.email.*":     {"queue": "default"},
    },
    # Autodiscover: Celery will import these modules and register their tasks.
    # All three modules must exist — this was the crash source in the gap analysis.
    include=[
        "app.workers.ingestion",
        "app.workers.agent_run",
        "app.workers.reindex",
        "app.workers.email",
        "app.workers.scheduled",
    ],
)

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "retry_failed_documents_daily": {
        "task": "app.workers.scheduled.retry_failed_documents",
        "schedule": crontab(hour=3, minute=0),
    },
    "analytics_heartbeat_every_5m": {
        "task": "app.workers.scheduled.analytics_heartbeat",
        "schedule": crontab(minute="*/5"),
    },
}
