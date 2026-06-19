"""RAG pipeline tests."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai.rag import _build_context, _sse, stream_rag
from app.ai.retrieval import RetrievedChunk


def _make_chunk(i: int) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=f"chunk-{i}",
        document_id=f"doc-{i}",
        document_filename=f"doc{i}.pdf",
        content=f"Content of chunk {i}",
        score=0.9 - i * 0.1,
        vector_rank=None,
        bm25_rank=None,
        page_number=i + 1,
        chunk_index=i,
    )


def test_sse_formats_token():
    frame = _sse("token", "hello")
    assert frame.startswith("event: token\n")
    assert '"hello"' in frame
    assert frame.endswith("\n\n")


def test_sse_formats_dict():
    frame = _sse("done", {"session_id": "abc", "confidence_score": 0.9})
    assert "event: done" in frame
    assert "session_id" in frame


def test_build_context_includes_filenames():
    chunks = [_make_chunk(i) for i in range(3)]
    ctx = _build_context(chunks)
    assert "[1] doc0.pdf" in ctx
    assert "[2] doc1.pdf" in ctx
    assert "Content of chunk 0" in ctx


@pytest.mark.asyncio
async def test_stream_rag_emits_sources_then_tokens():
    chunks = [_make_chunk(0), _make_chunk(1)]

    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock(delta=MagicMock(content="hello "))]

    async def completion_stream():
        yield mock_chunk

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=completion_stream())

    with patch("app.ai.rag.hybrid_retrieve", new=AsyncMock(return_value=chunks)), patch(
        "app.ai.rag.get_async_openai_client", return_value=mock_client
    ), patch("app.ai.rag.settings.use_mongo_mock", False):
        events = []
        async for frame in stream_rag("test?", "ws-1", None, top_k=2):
            events.append(frame)

    event_types = [e.split("\n")[0].replace("event: ", "") for e in events]
    assert event_types[0] == "source"
    assert "token" in event_types
    assert event_types[-1] == "done"


@pytest.mark.asyncio
async def test_stream_rag_no_chunks_yields_error():
    with patch("app.ai.rag.hybrid_retrieve", new=AsyncMock(return_value=[])):
        events = []
        async for frame in stream_rag("test?", "ws-1", None):
            events.append(frame)
    assert any("event: error" in e for e in events)
