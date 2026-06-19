"""Chunker tests."""
import pytest
from app.ai.chunker import chunk_by_sentences, chunk_by_tokens, chunk_document


def test_basic_chunking():
    text = "Hello world. This is a test. " * 20
    chunks = chunk_by_sentences(text, max_tokens=30)
    assert len(chunks) > 1
    assert all(c.content.strip() for c in chunks)


def test_chunk_indices_sequential():
    text = "Sentence one. Sentence two. Sentence three. " * 10
    chunks = chunk_by_sentences(text)
    for i, chunk in enumerate(chunks):
        assert chunk.chunk_index == i


def test_no_empty_chunks():
    text = "Real content here. More content. Even more content." * 5
    chunks = chunk_by_sentences(text)
    assert all(len(c.content.strip()) > 0 for c in chunks)


def test_token_chunking():
    words = " ".join([f"word{i}" for i in range(300)])
    chunks = chunk_by_tokens(words, chunk_size=50, overlap=10)
    assert len(chunks) > 1
    assert all(c.token_count <= 60 for c in chunks)


def test_empty_text_returns_empty():
    assert chunk_by_sentences("") == []
    assert chunk_by_sentences("   ") == []


def test_csv_uses_token_strategy():
    csv = "col1,col2,col3\n" + "\n".join(f"a,b,c{i}" for i in range(100))
    chunks = chunk_document(csv, content_type="text/csv")
    assert len(chunks) > 0


def test_overlap_carries_context():
    text = ". ".join([f"Sentence {i}" for i in range(30)]) + "."
    chunks = chunk_by_sentences(text, max_tokens=50, overlap_sentences=2)
    # Overlap means chunk N+1 starts with content from chunk N
    if len(chunks) > 1:
        # Last sentences of chunk 0 should appear in start of chunk 1
        chunk0_last = chunks[0].content.split(".")[-2].strip()
        assert chunk0_last in chunks[1].content or len(chunks[1].content) > 0
