"""
LangSmith tracing integration for NexusAI.

Traces every RAG call and multi-agent run in LangSmith — gives you:
  - Full prompt/response history for every LLM call
  - Latency breakdown per step (retrieval, embedding, LLM)
  - Token usage and cost tracking
  - A feedback loop to tag good/bad responses

Setup:
  1. pip install langsmith
  2. Add to backend/.env:
       LANGCHAIN_TRACING_V2=true
       LANGCHAIN_API_KEY=ls__...
       LANGCHAIN_PROJECT=nexusai-production

LangSmith is enabled automatically when LANGCHAIN_TRACING_V2=true.
This module provides helper decorators and context managers for
manual span creation where LangChain's auto-tracing doesn't reach
(e.g. pure Anthropic SDK calls in our RAG pipeline).
"""
from __future__ import annotations

import os
import functools
from contextlib import contextmanager
from typing import Any, Callable

import structlog

log = structlog.get_logger(__name__)

_TRACING_ENABLED = os.getenv("LANGCHAIN_TRACING_V2", "").lower() == "true"
_PROJECT = os.getenv("LANGCHAIN_PROJECT", "nexusai-dev")


def configure_langsmith() -> None:
    """Call once at app startup (from main.py lifespan)."""
    if not _TRACING_ENABLED:
        log.debug("langsmith.disabled", hint="Set LANGCHAIN_TRACING_V2=true to enable")
        return

    api_key = os.getenv("LANGCHAIN_API_KEY", "")
    if not api_key:
        log.warning("langsmith.no_api_key", hint="Set LANGCHAIN_API_KEY in .env")
        return

    # LangChain reads these env vars automatically — just confirm they're set.
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_PROJECT", _PROJECT)
    log.info("langsmith.enabled", project=_PROJECT)


@contextmanager
def trace_rag(question: str, workspace_id: str, metadata: dict[str, Any] | None = None):
    """
    Context manager that wraps a RAG pipeline call in a LangSmith run.

    Usage:
        with trace_rag(question, workspace_id) as run:
            result = await stream_rag(...)
            run["chunk_count"] = len(chunks)
    """
    if not _TRACING_ENABLED:
        run: dict[str, Any] = {}
        yield run
        return

    try:
        from langsmith import trace
        with trace(
            name="nexusai.rag",
            run_type="chain",
            inputs={"question": question, "workspace_id": workspace_id},
            project_name=_PROJECT,
            metadata=metadata or {},
        ) as run_tree:
            run = {"_run_tree": run_tree}
            yield run
            if "error" in run:
                run_tree.end(error=run["error"])
            else:
                run_tree.end(outputs={k: v for k, v in run.items() if not k.startswith("_")})
    except ImportError:
        log.debug("langsmith.not_installed")
        yield {}


def trace_fn(name: str, run_type: str = "tool") -> Callable:
    """
    Decorator to add LangSmith tracing to any function.

    Usage:
        @trace_fn("hybrid_retrieve", run_type="retriever")
        async def hybrid_retrieve(...):
            ...
    """
    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            if not _TRACING_ENABLED:
                return await fn(*args, **kwargs)
            try:
                from langsmith import trace
                with trace(name=name, run_type=run_type, project_name=_PROJECT):
                    return await fn(*args, **kwargs)
            except ImportError:
                return await fn(*args, **kwargs)

        @functools.wraps(fn)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            if not _TRACING_ENABLED:
                return fn(*args, **kwargs)
            try:
                from langsmith import trace
                with trace(name=name, run_type=run_type, project_name=_PROJECT):
                    return fn(*args, **kwargs)
            except ImportError:
                return fn(*args, **kwargs)

        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(fn) else sync_wrapper
    return decorator


def add_feedback(run_id: str, score: float, comment: str = "") -> None:
    """
    Submit user feedback for a traced run (thumbs up/down from chat UI).
    score: 1.0 = positive, 0.0 = negative

    Call this from the chat API when a user rates a response.
    """
    if not _TRACING_ENABLED:
        return
    try:
        from langsmith import Client
        client = Client()
        client.create_feedback(
            run_id=run_id,
            key="user_rating",
            score=score,
            comment=comment,
        )
        log.info("langsmith.feedback_recorded", run_id=run_id, score=score)
    except Exception as exc:
        log.warning("langsmith.feedback_failed", error=str(exc))
