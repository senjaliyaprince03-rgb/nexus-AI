"""Embedding module tests."""
import pytest
from unittest.mock import patch
from app.ai.embeddings import embed_texts, embed_query, embed_texts_async


def test_output_dimension():
    texts = ["Hello world", "NexusAI is great"]
    result = embed_texts(texts)
    assert len(result) == 2
    assert len(result[0]) == 384   # all-MiniLM-L6-v2
    assert len(result[1]) == 384


def test_empty_input_returns_empty():
    assert embed_texts([]) == []


def test_empty_string_handled():
    result = embed_texts([""])
    assert len(result) == 1
    assert len(result[0]) == 384


def test_batch_consistency():
    text = "Consistent embedding test"
    r1 = embed_texts([text])
    r2 = embed_texts([text])
    assert r1[0] == r2[0]


def test_identical_inputs_identical_vectors():
    texts = ["same text", "same text"]
    result = embed_texts(texts)
    import math
    for a, b in zip(result[0], result[1]):
        assert math.isclose(a, b, abs_tol=1e-5)


def test_different_inputs_different_vectors():
    texts = ["cat", "quantum mechanics"]
    result = embed_texts(texts)
    assert result[0] != result[1]


@pytest.mark.asyncio
async def test_embed_query_single():
    vec = await embed_query("what is RAG?")
    assert isinstance(vec, list)
    assert len(vec) == 384


@pytest.mark.asyncio
async def test_normalized_vectors():
    """L2-normalized vectors should have magnitude ≈ 1.0."""
    import math
    vec = await embed_query("test normalization")
    magnitude = math.sqrt(sum(x**2 for x in vec))
    assert abs(magnitude - 1.0) < 0.01


@pytest.mark.asyncio
async def test_async_wrapper():
    result = await embed_texts_async(["async test"])
    assert len(result) == 1
    assert len(result[0]) == 384


def test_large_batch():
    texts = [f"document number {i}" for i in range(100)]
    result = embed_texts(texts)
    assert len(result) == 100
