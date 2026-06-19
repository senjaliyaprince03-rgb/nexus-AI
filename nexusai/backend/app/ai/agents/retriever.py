"""Retriever agent node — calls hybrid_retrieve and writes chunks to state."""
from __future__ import annotations
import asyncio
from app.ai.agents.graph import AgentState


def retriever_node(state: AgentState) -> dict:
    from app.ai.retrieval import hybrid_retrieve
    async def _run():
        chunks = await hybrid_retrieve(
            query=state["question"],
            workspace_id=state["workspace_id"],
            top_k=state.get("top_k", 5),
        )
        return [
            {
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "document_filename": c.document_filename,
                "content": c.content,
                "score": c.score,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
            }
            for c in chunks
        ]

    chunks = asyncio.run(_run())
    steps = list(state.get("steps", []))
    steps.append(f"retriever: {len(chunks)} chunks retrieved")
    return {"retrieved_chunks": chunks, "steps": steps}
