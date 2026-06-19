"""
Document chunking strategies for NexusAI.

Two strategies:
  1. chunk_by_sentences  — splits on sentence boundaries, respects token limit.
     Best for prose (PDFs, Word docs, articles).
  2. chunk_by_tokens     — hard token-count split with overlap.
     Best for structured data (CSV, code, logs).

Both return list[dict] with keys: content, chunk_index, token_count, metadata.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

import structlog

log = structlog.get_logger(__name__)

# Simple whitespace tokeniser — accurate enough for chunk sizing.
# A real tokeniser (tiktoken) would be more precise but adds a heavy dependency.
_WORD_RE = re.compile(r"\S+")

# Sentence boundary pattern — handles abbreviations reasonably well.
_SENT_BOUNDARY = re.compile(
    r"(?<=[.!?])\s+(?=[A-Z\"\'])"
    r"|(?<=[.!?])\n"
    r"|\n{2,}"  # paragraph breaks always split
)


@dataclass
class Chunk:
    content: str
    chunk_index: int
    token_count: int
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "content": self.content,
            "chunk_index": self.chunk_index,
            "token_count": self.token_count,
            "metadata": self.metadata,
        }


def _count_tokens(text: str) -> int:
    """Approximate token count as word count (1 word ≈ 1.3 tokens on average)."""
    return len(_WORD_RE.findall(text))


def chunk_by_sentences(
    text: str,
    max_tokens: int = 200,
    overlap_sentences: int = 1,
    min_chunk_chars: int = 40,
    metadata: dict[str, Any] | None = None,
) -> list[Chunk]:
    """
    Split text into chunks at sentence boundaries.

    Args:
        text:               Full document text.
        max_tokens:         Maximum token count per chunk.
        overlap_sentences:  Sentences from the previous chunk to prepend
                            (improves context continuity at chunk edges).
        min_chunk_chars:    Discard chunks shorter than this (e.g. page headers).
        metadata:           Extra fields propagated to every chunk.

    Returns:
        List of Chunk objects.
    """
    if not text or not text.strip():
        return []

    meta = metadata or {}

    # Split into sentences
    raw_sentences = _SENT_BOUNDARY.split(text)
    sentences = [s.strip() for s in raw_sentences if s.strip()]

    chunks: list[Chunk] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = _count_tokens(sentence)

        # If adding this sentence exceeds the limit AND we already have content,
        # emit the current chunk first.
        if current_tokens + sentence_tokens > max_tokens and current_sentences:
            content = " ".join(current_sentences)
            if len(content) >= min_chunk_chars:
                chunks.append(Chunk(
                    content=content,
                    chunk_index=len(chunks),
                    token_count=current_tokens,
                    metadata=dict(meta),
                ))

            # Carry-over: start the next chunk with the last N sentences.
            # Guard: if the carry-over alone already exceeds max_tokens (e.g.
            # when overlap_sentences is large and the sentences are long), trim
            # the oldest carried sentences until they fit, so the next chunk
            # never starts out over-budget before even adding the new sentence.
            carry = current_sentences[-overlap_sentences:] if overlap_sentences > 0 else []
            carry_tokens = sum(_count_tokens(s) for s in carry)
            while carry and carry_tokens + sentence_tokens > max_tokens:
                removed = carry.pop(0)
                carry_tokens -= _count_tokens(removed)
            current_sentences = carry
            current_tokens = carry_tokens

        # Handle sentences that are longer than max_tokens by themselves
        if sentence_tokens > max_tokens:
            # Hard-split the sentence by words
            words = sentence.split()
            word_chunk: list[str] = []
            word_tokens = 0
            for word in words:
                word_tokens += 1
                word_chunk.append(word)
                if word_tokens >= max_tokens:
                    content = " ".join(word_chunk)
                    chunks.append(Chunk(
                        content=content,
                        chunk_index=len(chunks),
                        token_count=word_tokens,
                        metadata=dict(meta),
                    ))
                    word_chunk = []
                    word_tokens = 0
            if word_chunk:
                current_sentences.append(" ".join(word_chunk))
                current_tokens += word_tokens
        else:
            current_sentences.append(sentence)
            current_tokens += sentence_tokens

    # Emit any remaining content
    if current_sentences:
        content = " ".join(current_sentences)
        if len(content) >= min_chunk_chars:
            chunks.append(Chunk(
                content=content,
                chunk_index=len(chunks),
                token_count=current_tokens,
                metadata=dict(meta),
            ))

    log.debug("chunker.sentences", chunk_count=len(chunks), text_len=len(text))
    return chunks


def chunk_by_tokens(
    text: str,
    chunk_size: int = 200,
    overlap: int = 20,
    metadata: dict[str, Any] | None = None,
) -> list[Chunk]:
    """
    Hard split by token count with overlap.
    Better for structured/tabular content where sentence detection is unreliable.
    """
    if not text or not text.strip():
        return []

    meta = metadata or {}
    words = text.split()

    if not words:
        return []

    chunks: list[Chunk] = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        word_slice = words[start:end]
        content = " ".join(word_slice)
        chunks.append(Chunk(
            content=content,
            chunk_index=len(chunks),
            token_count=len(word_slice),
            metadata=dict(meta),
        ))
        if end == len(words):
            break
        start += chunk_size - overlap  # step back by overlap

    log.debug("chunker.tokens", chunk_count=len(chunks), word_count=len(words))
    return chunks


def chunk_document(
    text: str,
    content_type: str = "text/plain",
    metadata: dict[str, Any] | None = None,
) -> list[Chunk]:
    """
    Auto-select chunking strategy based on content type.

    - CSV / tabular  → chunk_by_tokens (no meaningful sentence structure)
    - Everything else → chunk_by_sentences
    """
    if content_type in ("text/csv", "application/csv"):
        return chunk_by_tokens(text, metadata=metadata)
    chunks = chunk_by_sentences(text, metadata=metadata)
    if chunks:
        return chunks
    fallback_text = text.strip()
    if not fallback_text:
        return []
    return [Chunk(
        content=fallback_text,
        chunk_index=0,
        token_count=_count_tokens(fallback_text),
        metadata=dict(metadata or {}),
    )]
