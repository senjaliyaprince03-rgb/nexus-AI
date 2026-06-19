"""Core RAG pipeline for NexusAI."""
from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

import structlog

from app.ai.retrieval import hybrid_retrieve
from app.core.config import settings
from app.core.openai_clients import get_async_openai_client

log = structlog.get_logger(__name__)

RAG_SYSTEM_PROMPT = """\
You are NexusAI, an expert assistant that answers questions strictly from the provided document context.

Rules:
- Answer ONLY from the context passages below. Do not use outside knowledge.
- Cite every factual claim with [N] where N is the passage number.
- If the context does not contain enough information, say "I don't have enough information in the provided documents to answer this."
- Be concise and accurate. Use Markdown formatting where it aids clarity.
"""


def _build_context(chunks: list[Any]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        header = f"[{i}] {chunk.document_filename}"
        if chunk.page_number:
            header += f" (page {chunk.page_number})"
        parts.append(f"{header}\n{chunk.content}")
    return "\n\n---\n\n".join(parts)


def _fallback_answer(question: str, chunks: list[Any]) -> str:
    if not chunks:
        return "I don't have enough information in the provided documents to answer this."
    highlights = " ".join(chunk.content.strip() for chunk in chunks[:2] if chunk.content.strip())
    if not highlights:
        return "I found relevant documents, but I couldn't extract a concise answer from them."
    return (
        f"Based on the most relevant document passage(s), here is a concise answer to '{question}': "
        f"{highlights[:500]}"
    )


async def stream_rag(
    question: str,
    workspace_id: str,
    session_id: str | None,
    top_k: int = 5,
) -> AsyncGenerator[str, None]:
    try:
        chunks = await hybrid_retrieve(
            query=question,
            workspace_id=workspace_id,
            top_k=top_k,
        )
        if not chunks:
            yield _sse("error", "No relevant documents found in this workspace.")
            return

        for chunk in chunks:
            yield _sse("source", {
                "chunk_id": chunk.chunk_id,
                "document_id": chunk.document_id,
                "document_filename": chunk.document_filename,
                "content": chunk.content[:400],
                "score": round(chunk.score, 4),
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
            })

        context = _build_context(chunks)
        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n\n{context}\n\nQuestion: {question}"},
        ]

        full_response = ""
        if settings.use_mongo_mock:
            full_response = _fallback_answer(question, chunks)
            for token in full_response.split():
                yield _sse("token", token + " ")
        else:
            try:
                client = get_async_openai_client()
                completion = await client.chat.completions.create(
                    model=settings.llm_model,
                    max_tokens=settings.llm_max_tokens,
                    messages=messages,
                    stream=True,
                    extra_body={"chat_template_kwargs": {"thinking": False}},
                )
                async for chunk in completion:
                    if not getattr(chunk, "choices", None):
                        continue
                    text = chunk.choices[0].delta.content
                    if text is None:
                        continue
                    full_response += text
                    yield _sse("token", text)
            except Exception as exc:
                log.warning("rag.fallback", error=str(exc), workspace_id=workspace_id)
                full_response = _fallback_answer(question, chunks)
                for token in full_response.split():
                    yield _sse("token", token + " ")

        chunk_ids = [c.chunk_id for c in chunks]
        avg_score = sum(c.score for c in chunks) / len(chunks) if chunks else 0.0
        yield _sse("done", {
            "session_id": session_id or "",
            "confidence_score": round(avg_score, 4),
            "source_chunk_ids": chunk_ids,
            "token_count": len(full_response.split()),
        })
        log.info("rag.complete", workspace_id=workspace_id, chunks=len(chunks), response_tokens=len(full_response.split()))
    except Exception as exc:
        log.error("rag.failed", error=str(exc), workspace_id=workspace_id)
        yield _sse("error", "An error occurred while processing your request.")


_ALLOWED_EVENTS: frozenset[str] = frozenset({"token", "source", "done", "error"})


def _sse(event: str, data: str | dict | list) -> str:
    if event not in _ALLOWED_EVENTS:
        raise ValueError(f"Disallowed SSE event name: {event!r}")
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"
