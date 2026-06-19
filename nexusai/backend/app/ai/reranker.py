"""
Cross-encoder re-ranker for NexusAI RAG pipeline.

Runs AFTER hybrid_retrieve() to improve chunk ordering before passing
context to Claude. Uses a small cross-encoder model that scores
(query, passage) pairs — much more accurate than cosine similarity alone
for deciding which chunk is most relevant to a specific question.

Model: cross-encoder/ms-marco-MiniLM-L-6-v2
  - ~66 MB, runs on CPU
  - Input: query + passage pairs
  - Output: relevance logit (higher = more relevant)
  - Loaded once at process startup (same pattern as embeddings.py)

Usage:
    from app.ai.reranker import rerank
    chunks = await hybrid_retrieve(question, workspace_id, db)
    chunks = await rerank(question, chunks, top_k=6)
"""
from __future__ import annotations

import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

from app.ai.retrieval import RetrievedChunk
from app.core.config import settings

_RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_RERANK_TOP_K = 6

# Dedicated single-thread executor for CPU-bound cross-encoder scoring.
# A fixed max_workers=1 bound prevents unbounded thread growth (CWE-400)
# under concurrent requests. One thread is sufficient because the model
# is not thread-safe and scoring is already batched per call.
_executor: ThreadPoolExecutor | None = None
_executor_lock = threading.Lock()


def _get_executor() -> ThreadPoolExecutor:
    """Return the module-level executor, creating it once."""
    global _executor
    if _executor is None:
        with _executor_lock:
            if _executor is None:
                _executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="reranker")
    return _executor


def shutdown_executor() -> None:
    """Gracefully shut down the executor. Call from app lifespan teardown."""
    global _executor
    with _executor_lock:
        if _executor is not None:
            _executor.shutdown(wait=True)
            _executor = None


@lru_cache(maxsize=1)
def _get_cross_encoder():
    """Load the cross-encoder model once and cache it."""
    try:
        from sentence_transformers import CrossEncoder
        return CrossEncoder(_RERANK_MODEL, max_length=512)
    except ImportError:
        return None


def _rerank_sync(
    query: str,
    chunks: list[RetrievedChunk],
    top_k: int,
) -> list[RetrievedChunk]:
    """
    Synchronous cross-encoder scoring. Runs on CPU in a thread pool.
    Falls back to original RRF order if the model is unavailable.
    """
    model = _get_cross_encoder()
    if model is None or not chunks:
        return chunks[:top_k]

    pairs = [[query, chunk.content] for chunk in chunks]
    scores = model.predict(pairs, show_progress_bar=False)

    scored = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    reranked = []
    for chunk, score in scored[:top_k]:
        chunk.score = float(score)
        reranked.append(chunk)
    return reranked


async def rerank(
    query: str,
    chunks: list[RetrievedChunk],
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    """
    Async entry point — offloads CPU scoring to a bounded thread pool.

    Args:
        query:   The user's question.
        chunks:  Candidates from hybrid_retrieve() (typically top 18-20).
        top_k:   How many to return after re-ranking (default: settings.TOP_K).

    Returns:
        Re-ranked list of at most top_k chunks, best first.
    """
    k = top_k or settings.rag_top_k
    if not chunks:
        return []

    # asyncio.get_running_loop() + explicit executor avoids the deprecated
    # get_event_loop() call and bounds thread growth to max_workers=1.
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_get_executor(), _rerank_sync, query, chunks, k)
