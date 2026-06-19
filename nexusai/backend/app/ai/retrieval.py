"""MongoDB retrieval for NexusAI."""
from __future__ import annotations

from dataclasses import dataclass

from app.ai.embeddings import embed_query
from app.services.mongo_store import store


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_filename: str
    content: str
    score: float
    vector_rank: int | None
    bm25_rank: int | None
    page_number: int | None
    chunk_index: int


async def hybrid_retrieve(
    query: str,
    workspace_id: str,
    top_k: int = 5,
    vector_candidates: int = 20,
    bm25_candidates: int = 20,
) -> list[RetrievedChunk]:
    embedding = await embed_query(query)
    chunks = await store.fetch_retrieval_chunks(
        workspace_id=workspace_id,
        query_embedding=embedding,
        top_k=top_k,
    )
    results: list[RetrievedChunk] = []
    for chunk in chunks[:top_k]:
        results.append(
            RetrievedChunk(
                chunk_id=str(chunk["_id"]),
                document_id=str(chunk["document_id"]),
                document_filename=chunk.get("filename", "Unknown"),
                content=chunk.get("content") or chunk.get("text") or "",
                score=float(chunk.get("score", 0.0) or 0.0),
                vector_rank=None,
                bm25_rank=None,
                page_number=chunk.get("page_number"),
                chunk_index=int(chunk.get("chunk_index", 0) or 0),
            )
        )
    return results
