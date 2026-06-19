"""Critic agent node — scores groundedness, loops back if confidence < 0.7."""
from __future__ import annotations
import json
import re
from app.ai.agents.graph import AgentState
from app.core.config import settings
from app.core.openai_clients import get_openai_client

_EXPECTED_KEYS = {"confidence", "verdict", "issues", "feedback"}
_VALID_VERDICTS = {"pass", "fail"}


def _extract_json(raw: str) -> dict:
    """Isolate and parse the first JSON object in *raw*.

    Strips everything outside the outermost ``{…}`` so prompt-injected text,
    markdown fences, or executable fragments cannot reach ``json.loads``.
    Raises ``ValueError`` when no valid object is found or the parsed value
    violates the declared schema contract.
    """
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("No JSON object found in LLM response")

    obj = json.loads(match.group())  # raises json.JSONDecodeError on malformed JSON

    if not isinstance(obj, dict):
        raise ValueError("LLM response is not a JSON object")

    # Reject keys outside the declared contract (prevents key-smuggling)
    unexpected = obj.keys() - _EXPECTED_KEYS
    if unexpected:
        raise ValueError(f"Unexpected keys in LLM response: {unexpected}")

    # Enforce value types so no executable object can be returned
    confidence = obj.get("confidence", 0.5)
    if not isinstance(confidence, (int, float)):
        raise ValueError("'confidence' must be a number")
    if not 0.0 <= float(confidence) <= 1.0:
        raise ValueError("'confidence' must be between 0.0 and 1.0")

    verdict = obj.get("verdict", "pass")
    if not isinstance(verdict, str) or verdict not in _VALID_VERDICTS:
        raise ValueError(f"'verdict' must be one of {_VALID_VERDICTS}")

    if not isinstance(obj.get("issues", []), list):
        raise ValueError("'issues' must be a list")

    if not isinstance(obj.get("feedback", ""), str):
        raise ValueError("'feedback' must be a string")

    return obj


def critic_node(state: AgentState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    passages = "\n\n".join(
        f"[{i+1}] {c['document_filename']}\n{c['content']}"
        for i, c in enumerate(chunks)
    )
    prompt = (
        f"Source passages:\n{passages}\n\n"
        f"Answer to verify:\n{state.get('analyst_draft', '')}\n\n"
        f"Citations: {json.dumps(state.get('citations', []))}\n\n"
        "Score groundedness. Respond with ONLY a JSON object:\n"
        '{"confidence": <0.0-1.0>, "verdict": "<pass|fail>", '
        '"issues": [<strings>], "feedback": "<instruction if fail>"}'
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        top_p=0.95,
        max_tokens=500,
        extra_body={"chat_template_kwargs": {"thinking": False}},
        stream=False
    )
    raw = response.choices[0].message.content.strip()

    try:
        result = _extract_json(raw)
    except (json.JSONDecodeError, ValueError):
        result = {"confidence": 0.5, "verdict": "pass", "issues": [], "feedback": ""}

    loops = state.get("critic_loops", 0) + 1
    steps = list(state.get("steps", []))
    confidence = float(result.get("confidence", 0.5))
    verdict = result.get("verdict", "pass")
    steps.append(f"critic: confidence={confidence:.2f} verdict={verdict} (loop {loops})")

    return {
        "confidence_score": confidence,
        "critic_feedback": result.get("feedback", "") if verdict == "fail" else None,
        "critic_loops": loops,
        "steps": steps,
    }
