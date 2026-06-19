"""Analyst agent node — synthesises retrieved chunks into a structured draft."""
from __future__ import annotations
import json
import re
from app.ai.agents.graph import AgentState
from app.core.config import settings
from app.core.openai_clients import get_openai_client

_EXPECTED_KEYS = {"answer", "citations", "gaps", "contradictions"}


def _extract_json(raw: str) -> dict:
    """Isolate and parse the first JSON object in *raw*.

    Strips everything outside the outermost ``{…}`` so that prompt-injected
    text, markdown fences, or executable fragments cannot reach ``json.loads``.
    Raises ``ValueError`` when no valid JSON object is found or the parsed
    value is not a plain ``dict`` with only the expected string/list keys.
    """
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("No JSON object found in LLM response")

    obj = json.loads(match.group())          # raises json.JSONDecodeError on bad JSON

    if not isinstance(obj, dict):
        raise ValueError("LLM response is not a JSON object")

    # Reject any keys outside the declared contract (prevents key-smuggling)
    unexpected = obj.keys() - _EXPECTED_KEYS
    if unexpected:
        raise ValueError(f"Unexpected keys in LLM response: {unexpected}")

    # Enforce value types so no executable object can be returned
    if not isinstance(obj.get("answer", ""), str):
        raise ValueError("'answer' must be a string")
    for field in ("citations", "gaps", "contradictions"):
        if not isinstance(obj.get(field, []), list):
            raise ValueError(f"'{field}' must be a list")

    return obj


def analyst_node(state: AgentState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    feedback = state.get("critic_feedback") or ""

    passages = "\n\n".join(
        f"[{i+1}] {c['document_filename']}\n{c['content']}"
        for i, c in enumerate(chunks)
    )
    feedback_section = f"\n\nPrevious critic feedback to address:\n{feedback}" if feedback else ""

    prompt = (
        f"Question: {state['question']}\n\n"
        f"Passages:\n{passages}"
        f"{feedback_section}\n\n"
        "Produce a JSON object with keys: answer (str), citations (list), gaps (list), contradictions (list).\n"
        "Respond with ONLY the JSON. No markdown fences."
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        top_p=0.95,
        max_tokens=settings.llm_max_tokens,
        extra_body={"chat_template_kwargs": {"thinking": False}},
        stream=False
    )
    raw = response.choices[0].message.content.strip()

    try:
        result = _extract_json(raw)
    except (json.JSONDecodeError, ValueError):
        result = {"answer": raw, "citations": [], "gaps": [], "contradictions": []}

    steps = list(state.get("steps", []))
    steps.append("analyst: draft produced")
    return {
        "analyst_draft": result.get("answer", ""),
        "citations": result.get("citations", []),
        "gaps": result.get("gaps", []),
        "contradictions": result.get("contradictions", []),
        "steps": steps,
    }
