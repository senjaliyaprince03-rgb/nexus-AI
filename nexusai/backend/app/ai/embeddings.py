"""
Embedding service for NexusAI.

Uses sentence-transformers (all-MiniLM-L6-v2) as the primary model.
Falls back to OpenAI text-embedding-3-small when OPENAI_API_KEY is set
and the local model fails.
Falls back to Hugging Face Inference API when HUGGINGFACE_API_KEY is set
and an embedding-capable model is configured.

The SentenceTransformer model is loaded once at module import time and
cached in memory — subsequent calls are near-instant.
"""
from __future__ import annotations

import asyncio
import hashlib
import math
from functools import lru_cache
from typing import Sequence

import structlog
from sentence_transformers import SentenceTransformer

from app.core.config import settings

log = structlog.get_logger(__name__)


@lru_cache(maxsize=1)
def _get_model(model_name: str) -> SentenceTransformer:
    """Load and cache the sentence-transformer model (once per process)."""
    log.info("embeddings.model_loading", model=model_name)
    model = SentenceTransformer(model_name, local_files_only=True)
    log.info("embeddings.model_ready", model=model_name, dim=model.get_embedding_dimension())
    return model


def embed_texts(
    texts: list[str],
    model_name: str | None = None,
    batch_size: int = 64,
    normalize: bool = True,
) -> list[list[float]]:
    """
    Embed a list of strings → list of float vectors.

    Args:
        texts:      Input strings (empty strings are replaced with a space).
        model_name: Override the configured embedding model.
        batch_size: How many texts to embed per forward pass.
        normalize:  L2-normalise output (required for cosine similarity).

    Returns:
        List of float vectors, one per input text.
    """
    if not texts:
        return []

    name = model_name or settings.embedding_model
    # Replace empty strings — sentence-transformers raises on them
    safe_texts = [t if t.strip() else " " for t in texts]

    try:
        model = _get_model(name)
        embeddings = model.encode(
            safe_texts,
            batch_size=batch_size,
            normalize_embeddings=normalize,
            show_progress_bar=False,
        )
        return [emb.tolist() for emb in embeddings]

    except Exception as exc:
        log.warning("embeddings.local_failed", error=str(exc), fallback="remote")
        llm_api_key, _ = settings.get_llm_credentials()
        if llm_api_key:
            try:
                return _embed_openai(safe_texts)
            except Exception as openai_exc:
                log.warning("embeddings.openai_failed", error=str(openai_exc), fallback="huggingface")
        if settings.huggingface_api_key:
            try:
                return _embed_huggingface(safe_texts)
            except Exception as hf_exc:
                log.warning("embeddings.huggingface_failed", error=str(hf_exc), fallback="deterministic")
        return _fallback_embeddings(safe_texts, settings.embedding_dimension)


def _embed_openai(texts: list[str]) -> list[list[float]]:
    """OpenAI-compatible embeddings fallback."""
    from app.core.openai_clients import get_openai_client

    client = get_openai_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]


def _embed_huggingface(texts: list[str]) -> list[list[float]]:
    """Hugging Face Inference API fallback for embedding-capable models."""
    from huggingface_hub import InferenceClient

    client = InferenceClient(
        model=settings.huggingface_model,
        token=settings.huggingface_api_key,
    )
    embeddings = client.feature_extraction(texts)
    if not embeddings:
        return []

    if isinstance(embeddings[0], (int, float)):
        embeddings = [embeddings]

    output: list[list[float]] = []
    for embedding in embeddings:
        output.append([float(value) for value in embedding])
    return output


def _fallback_embeddings(texts: list[str], dimension: int) -> list[list[float]]:
    """Deterministic offline embeddings for local development and tests."""
    return [_fallback_embedding(text, dimension) for text in texts]


def _fallback_embedding(text: str, dimension: int) -> list[float]:
    values: list[float] = []
    for index in range(dimension):
        digest = hashlib.sha256(f"{text}|{index}".encode("utf-8")).digest()
        raw = int.from_bytes(digest[:4], "big", signed=False) / 2**32
        values.append((raw * 2.0) - 1.0)

    magnitude = math.sqrt(sum(value * value for value in values)) or 1.0
    return [value / magnitude for value in values]


async def embed_texts_async(
    texts: list[str],
    model_name: str | None = None,
) -> list[list[float]]:
    """Async wrapper — runs embed_texts in a thread pool to avoid blocking the event loop."""
    return await asyncio.to_thread(embed_texts, texts, model_name)


async def embed_query(query: str) -> list[float]:
    """Async convenience function for a single query string."""
    return (await embed_texts_async([query]))[0]
