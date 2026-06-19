"""
Knowledge Consolidator

Consolidates research findings from multiple agents into a coherent
living document with version tracking.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class KnowledgeConsolidator:
    """Consolidates and manages living research documents"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.documents: Dict[str, Dict[str, Any]] = {}

    async def consolidate(self, findings: List[Dict[str, Any]], doc_id: Optional[str] = None) -> Dict[str, Any]:
        """Consolidate multiple research findings into a single document"""
        doc_id = doc_id or f"doc_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        existing = self.documents.get(doc_id, {"versions": [], "content": ""})
        merged_content = self._merge_findings(findings)

        version = {
            "version": len(existing["versions"]) + 1,
            "content": merged_content,
            "sources": len(findings),
            "timestamp": datetime.now().isoformat(),
        }
        existing["versions"].append(version)
        existing["content"] = merged_content
        existing["last_updated"] = datetime.now().isoformat()
        self.documents[doc_id] = existing

        return {
            "doc_id": doc_id,
            "version": version["version"],
            "content": merged_content,
            "sources_merged": len(findings),
            "timestamp": version["timestamp"],
        }

    def _merge_findings(self, findings: List[Dict[str, Any]]) -> str:
        """Merge multiple findings into a coherent document"""
        if not findings:
            return "No findings to consolidate."

        sections = ["## Consolidated Research Document\n"]
        for i, finding in enumerate(findings, 1):
            content = finding.get("content", "")
            source = finding.get("metadata", {}).get("type", f"source_{i}")
            confidence = finding.get("confidence", 0.0)
            sections.append(
                f"### Finding {i} (Source: {source}, Confidence: {confidence:.0%})\n\n{content}\n"
            )

        sections.append(
            f"\n---\n*Document consolidated from {len(findings)} sources on "
            f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"
        )
        return "\n".join(sections)

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a consolidated document"""
        return self.documents.get(doc_id)

    def get_document_history(self, doc_id: str) -> List[Dict[str, Any]]:
        """Get version history of a document"""
        doc = self.documents.get(doc_id)
        return doc.get("versions", []) if doc else []

    def list_documents(self) -> List[str]:
        """List all document IDs"""
        return list(self.documents.keys())
