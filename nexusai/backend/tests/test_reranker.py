"""
Cross-encoder reranker tests.

Covers: model loading/fallback, score replacement, top-k capping,
empty-input handling, and async thread-pool delegation.
The real cross-encoder model is never loaded — all scoring is mocked.
"""
from __future__ import annotations

import numpy as np
import pytest
from unittest.mock import MagicMock, patch

from app.ai.retrieval import RetrievedChunk


def _chunk(chunk_id: str, score: float = 0.5) -> RetrievedChunk:
    """Build a minimal RetrievedChunk with all required fields populated."""
    return RetrievedChunk(
        chunk_id=chunk_id,
        document_id="doc-1",
        document_filename="report.pdf",   # correct field name (not 'filename')
        content=f"Content for chunk {chunk_id}",
        score=score,
        vector_rank=None,
        bm25_rank=None,
        page_number=None,
        chunk_index=0,
    )


def _mock_cross_encoder(scores: list[float]):
    """Build a mock CrossEncoder whose predict() returns fixed scores."""
    model = MagicMock()
    model.predict = MagicMock(return_value=np.array(scores, dtype=np.float32))
    return model


# ── _rerank_sync unit tests ───────────────────────────────────────

def test_rerank_sync_returns_top_k() -> None:
    from app.ai.reranker import _rerank_sync
    chunks = [_chunk(f"c{i}") for i in range(10)]
    mock_model = _mock_cross_encoder([float(i) for i in range(10)])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("test query", chunks, top_k=3)

    assert len(result) == 3


def test_rerank_sync_scores_replaced_with_cross_encoder_logits() -> None:
    from app.ai.reranker import _rerank_sync
    chunks = [_chunk("c1", score=0.3), _chunk("c2", score=0.9)]
    mock_model = _mock_cross_encoder([5.0, 2.0])  # c1 gets higher logit

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("query", chunks, top_k=2)

    # c1 should now rank first (score 5.0 > 2.0) despite originally lower cosine
    assert result[0].chunk_id == "c1"
    assert result[0].score == pytest.approx(5.0, abs=0.01)


def test_rerank_sync_sorted_descending() -> None:
    from app.ai.reranker import _rerank_sync
    chunks = [_chunk("a"), _chunk("b"), _chunk("c")]
    mock_model = _mock_cross_encoder([1.0, 3.0, 2.0])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("query", chunks, top_k=3)

    scores = [r.score for r in result]
    assert scores == sorted(scores, reverse=True)


def test_rerank_sync_empty_input_returns_empty() -> None:
    from app.ai.reranker import _rerank_sync
    mock_model = _mock_cross_encoder([])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("query", [], top_k=6)

    assert result == []


def test_rerank_sync_falls_back_when_model_none() -> None:
    """If _get_cross_encoder returns None (ImportError), use original order."""
    from app.ai.reranker import _rerank_sync
    chunks = [_chunk(f"c{i}") for i in range(5)]

    with patch("app.ai.reranker._get_cross_encoder", return_value=None):
        result = _rerank_sync("query", chunks, top_k=3)

    assert len(result) == 3
    assert result[0].chunk_id == chunks[0].chunk_id  # original order preserved


def test_rerank_sync_top_k_greater_than_input() -> None:
    """top_k larger than the number of chunks — return all chunks."""
    from app.ai.reranker import _rerank_sync
    chunks = [_chunk("c1"), _chunk("c2")]
    mock_model = _mock_cross_encoder([0.8, 0.2])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("query", chunks, top_k=10)

    assert len(result) == 2


def test_rerank_sync_preserves_chunk_metadata() -> None:
    from app.ai.reranker import _rerank_sync
    chunks = [RetrievedChunk(
        chunk_id="cid-1",
        document_id="doc-99",
        document_filename="specific.pdf",
        content="My content",
        score=0.7,
        vector_rank=1,
        bm25_rank=2,
        page_number=5,
        chunk_index=3,
    )]
    mock_model = _mock_cross_encoder([3.14])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = _rerank_sync("query", chunks, top_k=1)

    assert result[0].chunk_id == "cid-1"
    assert result[0].document_id == "doc-99"
    assert result[0].document_filename == "specific.pdf"
    assert result[0].content == "My content"


# ── Async rerank() wrapper ────────────────────────────────────────

@pytest.mark.asyncio
async def test_rerank_async_delegates_to_sync() -> None:
    from app.ai.reranker import rerank
    chunks = [_chunk("c1"), _chunk("c2"), _chunk("c3")]
    mock_model = _mock_cross_encoder([0.9, 0.5, 0.1])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model):
        result = await rerank("what is the risk?", chunks, top_k=2)

    assert len(result) == 2
    assert isinstance(result, list)
    assert all(isinstance(r, RetrievedChunk) for r in result)


@pytest.mark.asyncio
async def test_rerank_async_empty_returns_empty() -> None:
    from app.ai.reranker import rerank
    result = await rerank("question", [], top_k=6)
    assert result == []


@pytest.mark.asyncio
async def test_rerank_async_uses_settings_top_k_when_none() -> None:
    from app.ai.reranker import rerank
    chunks = [_chunk(f"c{i}") for i in range(10)]
    mock_model = _mock_cross_encoder([float(i) for i in range(10)])

    with patch("app.ai.reranker._get_cross_encoder", return_value=mock_model), \
         patch("app.ai.reranker.settings") as mock_settings:
        mock_settings.rag_top_k = 4
        result = await rerank("query", chunks, top_k=None)

    assert len(result) <= 4


# ── Model constant ────────────────────────────────────────────────

def test_rerank_model_name_is_set() -> None:
    from app.ai.reranker import _RERANK_MODEL
    assert "ms-marco" in _RERANK_MODEL or "cross-encoder" in _RERANK_MODEL


def test_rerank_top_k_constant() -> None:
    from app.ai.reranker import _RERANK_TOP_K
    assert _RERANK_TOP_K > 0
