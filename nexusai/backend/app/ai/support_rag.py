"""Support-agent RAG stream for NexusAI help flows."""
from __future__ import annotations

import json
import re
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any

import structlog

from app.ai.rag import _build_context, _sse
from app.ai.retrieval import RetrievedChunk, hybrid_retrieve
from app.core.config import settings
from app.core.openai_clients import get_async_openai_client

log = structlog.get_logger(__name__)

SUPPORT_SYSTEM_PROMPT = """\
You are the NexusAI AI Help Desk assistant.

Rules:
- Clearly act as an AI assistant, not a human support agent.
- Use only the provided workspace document passages and NexusAI support FAQ passages.
- Cite factual claims with [N] where N matches the provided passage number.
- Never ask for passwords, full payment card numbers, API secrets, private keys, or one-time codes.
- If the answer is not covered by the sources, say what is missing and ask one focused clarifying question.
- No human handoff or ticketing is enabled in this version. Do not promise live agents, callbacks, or tickets.
- Keep the tone calm, professional, and useful.
"""


@dataclass(frozen=True)
class SupportFaq:
    chunk_id: str
    intent: str
    title: str
    content: str
    keywords: tuple[str, ...]


SUPPORT_FAQS: tuple[SupportFaq, ...] = (
    SupportFaq(
        "faq-billing-plans",
        "billing",
        "Billing, plans, and invoices",
        (
            "NexusAI billing support can help explain plan limits, invoices, upgrades, and payment questions. "
            "Billing pages should never collect full card numbers or bank credentials inside chat. "
            "Users should review billing details from the dashboard billing page and verify critical payment changes before acting."
        ),
        ("billing", "invoice", "plan", "payment", "upgrade", "price", "pricing", "subscription", "refund"),
    ),
    SupportFaq(
        "faq-technical-documents",
        "technical",
        "Document indexing and technical troubleshooting",
        (
            "For technical issues, first confirm the backend API is reachable, the user is signed in, and the workspace has indexed documents. "
            "Document answers require ready document chunks in the selected workspace. If no relevant chunks are found, the assistant should explain that more source material may be needed."
        ),
        ("technical", "error", "backend", "api", "document", "indexing", "upload", "chunks", "rag", "stream", "login"),
    ),
    SupportFaq(
        "faq-account-verification",
        "account",
        "Account access and verification",
        (
            "Account support covers sign in, sign up, email verification, password reset, and workspace access. "
            "Users should use the official verification and reset flows instead of sharing passwords or one-time codes in chat."
        ),
        ("account", "login", "sign in", "signup", "verification", "verify", "password", "workspace", "access"),
    ),
    SupportFaq(
        "faq-privacy-security",
        "privacy",
        "Privacy and security expectations",
        (
            "NexusAI support answers should avoid collecting sensitive secrets. "
            "The assistant should remind users not to paste passwords, full payment card numbers, API keys, private keys, or one-time codes. "
            "Workspace document answers must stay scoped to the authenticated user's workspace."
        ),
        ("privacy", "security", "data", "secret", "password", "card", "api key", "private", "policy"),
    ),
    SupportFaq(
        "faq-general-support",
        "other",
        "General support guidance",
        (
            "When the issue is unclear, the NexusAI support assistant should ask a concise clarifying question, suggest one safe next step, "
            "and cite any relevant support FAQ or workspace document source."
        ),
        ("help", "support", "question", "issue", "problem", "other", "general", "start"),
    ),
)

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _faq_to_chunk(faq: SupportFaq, score: float, index: int) -> Any:
    return RetrievedChunk(
        chunk_id=faq.chunk_id,
        document_id="support-faq",
        document_filename=f"NexusAI Support FAQ - {faq.title}",
        content=faq.content,
        score=score,
        vector_rank=None,
        bm25_rank=None,
        page_number=None,
        chunk_index=index,
    )


def _score_faqs(question: str, support_intent: str | None, top_k: int) -> list[Any]:
    text = question.lower()
    tokens = set(_TOKEN_RE.findall(text))
    scored: list[tuple[float, int, SupportFaq]] = []
    for index, faq in enumerate(SUPPORT_FAQS):
        keyword_hits = sum(1 for keyword in faq.keywords if keyword in text)
        token_hits = len(tokens.intersection(_TOKEN_RE.findall(faq.title.lower())))
        intent_boost = 2.0 if support_intent and faq.intent == support_intent else 0.0
        score = 0.62 + min((keyword_hits * 0.08) + (token_hits * 0.03) + intent_boost, 0.34)
        scored.append((score, index, faq))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [_faq_to_chunk(faq, round(score, 4), index) for score, index, faq in scored[:top_k]]


def _fallback_answer(question: str, chunks: list[Any], support_intent: str | None) -> str:
    if not chunks:
        return (
            "I am the NexusAI AI assistant. I do not have enough support or workspace information to answer this yet. "
            "Which area should I focus on: billing, technical, account, privacy, or something else?"
        )
    category = support_intent or "support"
    highlights = " ".join(chunk.content.strip() for chunk in chunks[:2] if chunk.content.strip())
    return (
        f"I am the NexusAI AI assistant. For this {category} question, the available sources suggest: "
        f"{highlights[:650]} "
        "Please do not share passwords, full card numbers, API keys, private keys, or one-time codes in chat."
    )


async def stream_support_rag(
    question: str,
    workspace_id: str,
    session_id: str | None,
    top_k: int = 5,
    support_intent: str | None = None,
    source_policy: str = "combined",
) -> AsyncGenerator[str, None]:
    try:
        chunks: list[Any] = []
        if source_policy != "faq":
            try:
                chunks.extend(await hybrid_retrieve(query=question, workspace_id=workspace_id, top_k=top_k))
            except Exception as exc:
                log.warning("support.retrieve_workspace_failed", error=str(exc), workspace_id=workspace_id)

        if source_policy != "workspace_docs":
            chunks.extend(_score_faqs(question, support_intent, top_k=max(2, top_k // 2)))

        # Keep strongest unique source IDs, with workspace sources naturally included when present.
        unique: dict[str, RetrievedChunk] = {}
        for chunk in sorted(chunks, key=lambda item: item.score, reverse=True):
            unique.setdefault(chunk.chunk_id, chunk)
        ranked = list(unique.values())[:top_k]

        if not ranked:
            yield _sse("error", "No relevant support or workspace information was found.")
            return

        for chunk in ranked:
            yield _sse(
                "source",
                {
                    "chunk_id": chunk.chunk_id,
                    "document_id": chunk.document_id,
                    "document_filename": chunk.document_filename,
                    "content": chunk.content[:400],
                    "score": round(chunk.score, 4),
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "source_type": "faq" if chunk.document_id == "support-faq" else "workspace_doc",
                    "support_intent": support_intent,
                },
            )

        context = _build_context(ranked)
        messages = [
            {"role": "system", "content": SUPPORT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Support intent: {support_intent or 'other'}\n"
                    f"Source policy: {source_policy}\n\n"
                    f"Context:\n\n{context}\n\nQuestion: {question}"
                ),
            },
        ]

        full_response = ""
        fallback_used = False
        if settings.use_mongo_mock:
            fallback_used = True
            full_response = _fallback_answer(question, ranked, support_intent)
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
                fallback_used = True
                log.warning("support.fallback", error=str(exc), workspace_id=workspace_id)
                full_response = _fallback_answer(question, ranked, support_intent)
                for token in full_response.split():
                    yield _sse("token", token + " ")

        chunk_ids = [chunk.chunk_id for chunk in ranked]
        avg_score = sum(chunk.score for chunk in ranked) / len(ranked) if ranked else 0.0
        yield _sse(
            "done",
            {
                "session_id": session_id or "",
                "confidence_score": round(avg_score, 4),
                "source_chunk_ids": chunk_ids,
                "token_count": len(full_response.split()),
                "mode": "support",
                "support_intent": support_intent,
                "fallback": fallback_used,
                "source_policy": source_policy,
                "source_coverage": {
                    "faq": sum(1 for chunk in ranked if chunk.document_id == "support-faq"),
                    "workspace_docs": sum(1 for chunk in ranked if chunk.document_id != "support-faq"),
                },
            },
        )
        log.info(
            "support.complete",
            workspace_id=workspace_id,
            chunks=len(ranked),
            response_tokens=len(full_response.split()),
            fallback=fallback_used,
        )
    except Exception as exc:
        log.error("support.failed", error=str(exc), workspace_id=workspace_id)
        yield _sse("error", "An error occurred while processing your support request.")
