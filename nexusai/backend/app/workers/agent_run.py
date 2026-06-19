"""Celery task: run an agentic answer flow and persist to MongoDB."""
from __future__ import annotations

import asyncio
import json
from typing import Any

import redis
import structlog
from celery import Task

from app.ai.embeddings import embed_query
from app.ai.multi_agent_hub import RAG_AGENT_TYPES, run_multi_agent_hub_query
from app.ai.retrieval import hybrid_retrieve
from app.core.config import settings
from app.core.openai_clients import get_async_openai_client
from app.services.mongo_store import store
from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

RUN_STATUS_KEY = "agent_run:status:{run_id}"
RUN_RESULT_KEY = "agent_run:result:{run_id}"
RUN_EVENTS_CHANNEL = "agent_run:events:{run_id}"
RUN_TTL_SECONDS = 3600


class AgentRunTask(Task):
    _redis: redis.Redis | None = None

    @property
    def redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(settings.redis_url, decode_responses=True)
        return self._redis


@celery_app.task(
    bind=True,
    base=AgentRunTask,
    name="app.workers.agent_run.run_agent_task",
    max_retries=1,
    soft_time_limit=120,
    time_limit=150,
)
def run_agent_task(
    self: AgentRunTask,
    run_id: str,
    question: str,
    workspace_id: str,
    user_id: str,
    top_k: int = 5,
    agent_type: str = "rag",
    resource_url: str | None = None,
) -> dict[str, Any]:
    log.info("agent_run.started", run_id=run_id, workspace_id=workspace_id, agent_type=agent_type)
    _set_status(self.redis, run_id, "running")
    return asyncio.run(
        _run_agent_task_async(
            redis_client=self.redis,
            run_id=run_id,
            question=question,
            workspace_id=workspace_id,
            top_k=top_k,
            agent_type=agent_type,
            resource_url=resource_url,
        )
    )


async def _run_agent_task_async(
    *,
    redis_client: redis.Redis,
    run_id: str,
    question: str,
    workspace_id: str,
    top_k: int,
    agent_type: str,
    resource_url: str | None,
) -> dict[str, Any]:
    await store.update_agent_run(run_id, status="running")

    try:
        result = await _run_agent(
            question=question,
            workspace_id=workspace_id,
            top_k=top_k,
            agent_type=agent_type,
            resource_url=resource_url,
        )
        _set_status(redis_client, run_id, "complete")
        _set_result(redis_client, run_id, result)
        await store.update_agent_run(
            run_id,
            status="complete",
            output=result,
            confidence=result.get("confidence_score"),
            citations=result.get("citations", []),
            steps=result.get("steps", []),
        )
        log.info("agent_run.complete", run_id=run_id, confidence=result.get("confidence_score"))
        return result
    except Exception as exc:
        log.error("agent_run.failed", run_id=run_id, error=str(exc))
        _set_status(redis_client, run_id, "failed")
        _set_result(redis_client, run_id, {"error": "Agent run failed"})
        await store.update_agent_run(run_id, status="failed", error=str(exc))
        raise


async def _run_agent(
    question: str,
    workspace_id: str,
    top_k: int,
    agent_type: str = "rag",
    resource_url: str | None = None,
) -> dict[str, Any]:
    if agent_type not in RAG_AGENT_TYPES:
        return await run_multi_agent_hub_query(
            question=question,
            workspace_id=workspace_id,
            top_k=top_k,
            agent_type=agent_type,
            resource_url=resource_url,
        )

    chunks = await hybrid_retrieve(query=question, workspace_id=workspace_id, top_k=top_k)
    citations = [
        {
            "chunk_id": chunk.chunk_id,
            "document_id": chunk.document_id,
            "document_filename": chunk.document_filename,
            "content": chunk.content[:400],
            "score": chunk.score,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
        }
        for chunk in chunks
    ]
    prompt_context = "\n\n".join(
        f"[{index + 1}] {chunk.document_filename}\n{chunk.content}"
        for index, chunk in enumerate(chunks)
    )
    messages = [
        {"role": "system", "content": "You are NexusAI. Answer only from the provided context and cite factual claims."},
        {"role": "user", "content": f"Context:\n{prompt_context}\n\nQuestion: {question}"},
    ]
    answer = ""
    if settings.use_mongo_mock:
        answer = _fallback_agent_answer(question, chunks)
    else:
        try:
            client = get_async_openai_client()
            completion = await client.chat.completions.create(
                model=settings.llm_model,
                max_tokens=settings.llm_max_tokens,
                messages=messages,
                stream=False,
                extra_body={"chat_template_kwargs": {"thinking": False}},
            )
            answer = completion.choices[0].message.content if completion.choices else ""
            if answer is None:
                answer = ""
        except Exception as exc:
            log.warning("agent_run.fallback", error=str(exc), workspace_id=workspace_id)
            answer = _fallback_agent_answer(question, chunks)
    confidence = round(sum(chunk.score for chunk in chunks) / len(chunks), 4) if chunks else 0.0
    return {
        "answer": answer,
        "citations": citations,
        "confidence_score": confidence,
        "steps": [{"node": "retriever", "timestamp": None, "output_keys": ["retrieved_chunks"]}],
        "agent_type": agent_type,
        "agent_name": "Document RAG Agent",
        "run_id": "",
        "workspace_id": workspace_id,
    }


def _fallback_agent_answer(question: str, chunks: list[Any]) -> str:
    if not chunks:
        return f"I don't have enough information in the provided documents to answer '{question}'."
    highlights = " ".join(chunk.content.strip() for chunk in chunks[:2] if getattr(chunk, "content", "").strip())
    if not highlights:
        return f"I found related passages, but I couldn't assemble a concise answer for '{question}'."
    return f"Based on the retrieved passages, the best concise answer to '{question}' is: {highlights[:500]}"


def _set_status(r: redis.Redis, run_id: str, status: str) -> None:
    r.setex(RUN_STATUS_KEY.format(run_id=run_id), RUN_TTL_SECONDS, status)


def _set_result(r: redis.Redis, run_id: str, result: dict[str, Any]) -> None:
    r.setex(RUN_RESULT_KEY.format(run_id=run_id), RUN_TTL_SECONDS, json.dumps(result))


def get_run_status(run_id: str) -> str:
    r = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        return r.get(RUN_STATUS_KEY.format(run_id=run_id)) or "unknown"
    finally:
        r.close()


def get_run_result(run_id: str) -> dict[str, Any] | None:
    r = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        raw = r.get(RUN_RESULT_KEY.format(run_id=run_id))
        return json.loads(raw) if raw else None
    finally:
        r.close()
