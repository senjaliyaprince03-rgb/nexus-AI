"""Hybrid retrieval tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.ai.retrieval import RetrievedChunk, hybrid_retrieve


def _chunk(i: int, score: float = 0.8) -> dict:
    return {
        "_id": f"chunk-{i}",
        "document_id": f"doc-{i}",
        "filename": f"doc{i}.pdf",
        "content": f"Content about topic {i}",
        "score": score,
        "page_number": i,
        "chunk_index": i,
    }


def test_retrieved_chunk_dataclass():
    chunk = RetrievedChunk(
        chunk_id="chunk-0",
        document_id="doc-0",
        document_filename="doc0.pdf",
        content="Content",
        score=0.95,
        vector_rank=None,
        bm25_rank=None,
        page_number=0,
        chunk_index=0,
    )
    assert chunk.chunk_id == "chunk-0"
    assert chunk.document_filename == "doc0.pdf"
    assert chunk.score == 0.95


@pytest.mark.asyncio
async def test_hybrid_retrieve_returns_top_k():
    chunks = [_chunk(i, 0.9 - i * 0.05) for i in range(10)]

    with patch("app.ai.retrieval.embed_query", new=AsyncMock(return_value=[0.1] * 384)), patch(
        "app.ai.retrieval.store.fetch_retrieval_chunks", new=AsyncMock(return_value=chunks)
    ):
        results = await hybrid_retrieve("test query", "ws-1", top_k=5)

    assert len(results) == 5
    assert all(isinstance(item, RetrievedChunk) for item in results)


@pytest.mark.asyncio
async def test_hybrid_retrieve_empty_results():
    with patch("app.ai.retrieval.embed_query", new=AsyncMock(return_value=[0.1] * 384)), patch(
        "app.ai.retrieval.store.fetch_retrieval_chunks", new=AsyncMock(return_value=[])
    ):
        results = await hybrid_retrieve("query", "ws-1", top_k=5)
    assert results == []


@pytest.mark.asyncio
async def test_hybrid_retrieve_preserves_scores():
    chunks = [_chunk(i, 0.8 - i * 0.1) for i in range(3)]
    with patch("app.ai.retrieval.embed_query", new=AsyncMock(return_value=[0.1] * 384)), patch(
        "app.ai.retrieval.store.fetch_retrieval_chunks", new=AsyncMock(return_value=chunks)
    ):
        results = await hybrid_retrieve("query", "ws-1", top_k=5)
    assert [round(item.score, 2) for item in results] == [0.8, 0.7, 0.6]
