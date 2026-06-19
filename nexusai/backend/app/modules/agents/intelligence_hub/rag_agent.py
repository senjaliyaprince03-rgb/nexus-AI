"""
RAG Agent

Retrieval-Augmented Generation agent that integrates with the existing
NexusAI RAG pipeline (MongoDB vector store).
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class RAGAgent:
    """RAG agent wrapping the existing NexusAI retrieval pipeline"""

    def __init__(self, config: dict[str, Any]):
        self.config = config

    async def execute(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute RAG query against the document store"""
        try:
            workspace_id = (context or {}).get("workspace_id")
            top_k = int((context or {}).get("top_k", self.config.get("top_k", 5)) or 5)
            result = await self._retrieve_and_generate(query, workspace_id, top_k)
            return {
                "content": result.get("answer", ""),
                "metadata": {
                    "type": "rag",
                    "query": query,
                    "workspace_id": workspace_id,
                    "citations": result.get("citations", []),
                    "confidence_score": result.get("confidence_score", 0.0),
                },
                "confidence": result.get("confidence_score", 0.0),
            }
        except Exception as e:
            logger.error(f"RAG agent error: {e}")
            return {
                "content": f"RAG retrieval encountered an error: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0,
            }

    async def _retrieve_and_generate(
        self, query: str, workspace_id: str | None, top_k: int = 5
    ) -> dict[str, Any]:
        """Delegate to the core NexusAI RAG pipeline"""
        try:
            from app.ai.rag import answer_rag

            if not workspace_id:
                return {
                    "answer": (
                        "## RAG Response\n\n"
                        f"**Query**: {query}\n\n"
                        "A workspace id is required to retrieve documents."
                    ),
                    "citations": [],
                    "confidence_score": 0.0,
                }
            return await answer_rag(question=query, workspace_id=workspace_id, top_k=top_k)
        except ImportError:
            return {
                "answer": (
                    f"## RAG Response\n\n"
                    f"**Query**: {query}\n\n"
                    "The RAG pipeline module (`app.ai.rag`) could not be imported. "
                    "Ensure the backend is fully initialised and `MONGODB_URI` is set."
                ),
                "citations": [],
                "confidence_score": 0.0,
            }


class MemoryRAGAgent(RAGAgent):
    """RAG agent that uses recent chat/session memory before retrieval."""

    async def execute(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute memory-aware RAG query against the document store."""
        try:
            context = context or {}
            workspace_id = context.get("workspace_id")
            if not workspace_id:
                return {
                    "content": "Memory RAG requires a workspace_id to search the document index.",
                    "metadata": {"type": "rag_memory", "error": "missing_workspace_id"},
                    "confidence": 0.0,
                }

            top_k = int(context.get("top_k", self.config.get("top_k", 5)) or 5)
            from app.ai.rag import answer_rag_with_memory

            result = await answer_rag_with_memory(
                question=query,
                workspace_id=workspace_id,
                user_id=context.get("user_id"),
                session_id=context.get("session_id") or context.get("memory_session_id"),
                top_k=top_k,
            )
            return {
                "content": result.get("answer", ""),
                "metadata": {
                    "type": "rag_memory",
                    "query": query,
                    "workspace_id": workspace_id,
                    "citations": result.get("citations", []),
                    "confidence_score": result.get("confidence_score", 0.0),
                    "memory_session_id": result.get("memory_session_id", ""),
                    "rewritten_question": result.get("rewritten_question", query),
                    "memory_used": result.get("memory_used", False),
                },
                "confidence": result.get("confidence_score", 0.0),
            }
        except Exception as e:
            logger.error(f"Memory RAG agent error: {e}")
            return {
                "content": f"Memory RAG retrieval encountered an error: {str(e)}",
                "metadata": {"error": str(e)},
                "confidence": 0.0,
            }
