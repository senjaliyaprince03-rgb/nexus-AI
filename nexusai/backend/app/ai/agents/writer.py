"""Writer agent node — formats the verified answer with numbered citation links."""
from __future__ import annotations
from app.ai.agents.graph import AgentState


def writer_node(state: AgentState) -> dict:
    """
    Format the analyst draft into clean Markdown with citation footer.
    The draft already contains [N] markers from the analyst — the writer
    adds a Sources section mapping numbers to document names.
    """
    draft = state.get("analyst_draft", "")
    citations = state.get("citations", [])
    chunks = state.get("retrieved_chunks", [])

    # Build a sources section from retrieved chunks
    source_lines: list[str] = []
    seen: set[str] = set()
    for i, chunk in enumerate(chunks, 1):
        key = f"{chunk['document_filename']}"
        if key not in seen:
            page = f", p.{chunk['page_number']}" if chunk.get("page_number") else ""
            source_lines.append(f"[{i}] {chunk['document_filename']}{page}")
            seen.add(key)

    sources_section = "\n\n---\n**Sources**\n" + "\n".join(source_lines) if source_lines else ""

    final = draft + sources_section

    steps = list(state.get("steps", []))
    steps.append("writer: answer formatted")
    return {"final_answer": final, "steps": steps}
