"""Integrated adapter for the upstream Streamlit/Agno multi-agent hub.

The original project is preserved under ``legacy/streamlit-multi-agent-hub``.
This module maps those capabilities into the FastAPI/Celery architecture used
by the production NexusAI app.
"""
from __future__ import annotations

import ast
import asyncio
import operator
import os
import re
from dataclasses import asdict, dataclass
from typing import Any, Callable

import structlog

from app.core.config import settings
from app.core.openai_clients import get_async_openai_client

log = structlog.get_logger(__name__)


@dataclass(frozen=True)
class HubAgent:
    id: str
    name: str
    category: str
    description: str
    upstream_tool: str
    prompt_role: str
    resource_hint: str | None = None


AGENT_CATALOG: dict[str, HubAgent] = {
    "auto": HubAgent(
        id="auto",
        name="Auto Router",
        category="orchestration",
        description="Routes the prompt to the most suitable specialist.",
        upstream_tool="Agno Team route mode",
        prompt_role="Route the query to the best specialist and answer with clear structure.",
    ),
    "general": HubAgent(
        id="general",
        name="General Query Agent",
        category="standard",
        description="Answers broad questions and synthesizes general knowledge.",
        upstream_tool="Agno Agent",
        prompt_role="Answer general questions clearly and concisely.",
    ),
    "web": HubAgent(
        id="web",
        name="Web Search Agent",
        category="standard",
        description="Searches for web information and cites sources when live tools are available.",
        upstream_tool="DuckDuckGoTools",
        prompt_role="Focus on factual web-style research with source-aware wording.",
    ),
    "finance": HubAgent(
        id="finance",
        name="Financial Data Analyst",
        category="standard",
        description="Analyzes stocks, company fundamentals, and market-style questions.",
        upstream_tool="YFinanceTools",
        prompt_role="Present financial analysis in tables and separate facts from interpretation.",
    ),
    "research": HubAgent(
        id="research",
        name="Academic Research Agent",
        category="standard",
        description="Finds and summarizes academic research topics.",
        upstream_tool="ArxivTools",
        prompt_role="Summarize research with titles, authors, dates, and core findings.",
    ),
    "math": HubAgent(
        id="math",
        name="Math Calculator",
        category="standard",
        description="Solves calculations and explains numerical work.",
        upstream_tool="CalculatorTools",
        prompt_role="Solve calculations step by step and provide a clear final result.",
    ),
    "wiki": HubAgent(
        id="wiki",
        name="Wikipedia Agent",
        category="standard",
        description="Summarizes encyclopedia-style topics.",
        upstream_tool="WikipediaTools",
        prompt_role="Explain encyclopedia topics neutrally with key facts and context.",
    ),
    "news": HubAgent(
        id="news",
        name="News Article Agent",
        category="standard",
        description="Summarizes article URLs and extracts key points.",
        upstream_tool="Newspaper4kTools",
        prompt_role="Summarize news articles by headline, source, entities, and key points.",
        resource_hint="Article URL",
    ),
    "youtube": HubAgent(
        id="youtube",
        name="YouTube Agent",
        category="standard",
        description="Summarizes videos from transcripts when available.",
        upstream_tool="YouTubeTools",
        prompt_role="Summarize video transcripts with topics and timestamp-style structure.",
        resource_hint="YouTube URL",
    ),
    "rag": HubAgent(
        id="rag",
        name="Document RAG Agent",
        category="rag",
        description="Uses the existing NexusAI document retrieval pipeline.",
        upstream_tool="LangChain RAG knowledge base",
        prompt_role="Answer from workspace documents with citations.",
    ),
    "rag_memory": HubAgent(
        id="rag_memory",
        name="Advanced RAG With Memory",
        category="rag",
        description="Uses NexusAI chat/session memory with the document retrieval pipeline.",
        upstream_tool="LangGraph memory RAG",
        prompt_role="Answer from documents while respecting previous conversation context.",
    ),
}

RAG_AGENT_TYPES = {"rag", "rag_memory"}

_CLASSIFICATION_TERMS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("finance", ("stock", "share", "ticker", "revenue", "earnings", "market cap", "balance sheet")),
    ("research", ("paper", "arxiv", "journal", "study", "research", "literature")),
    ("math", ("calculate", "solve", "equation", "interest", "sqrt", "square root", "percent")),
    ("wiki", ("wikipedia", "encyclopedia", "biography", "history of")),
    ("news", ("news", "article", "headline", "publication")),
    ("youtube", ("youtube", "video", "transcript")),
    ("web", ("latest", "current", "search", "web", "source")),
)


def list_hub_agents() -> list[dict[str, Any]]:
    return [asdict(agent) for agent in AGENT_CATALOG.values()]


def resolve_agent_type(agent_type: str | None, question: str) -> str:
    requested = (agent_type or "auto").strip().lower()
    if requested and requested != "auto":
        if requested not in AGENT_CATALOG:
            raise ValueError(f"Unsupported agent_type '{requested}'")
        return requested

    lowered = question.lower()
    for candidate, terms in _CLASSIFICATION_TERMS:
        if any(term in lowered for term in terms):
            return candidate
    return "general"


async def run_multi_agent_hub_query(
    *,
    question: str,
    agent_type: str | None = "auto",
    workspace_id: str | None = None,
    top_k: int = 5,
    resource_url: str | None = None,
) -> dict[str, Any]:
    selected = resolve_agent_type(agent_type, question)
    agent = AGENT_CATALOG[selected]
    steps: list[str] = [
        "router: selected " + agent.name,
        "adapter: loaded upstream capability " + agent.upstream_tool,
    ]

    if selected == "math":
        math_answer = _try_local_math(question)
        if math_answer:
            steps.append("math: solved with local safe evaluator")
            return _result(
                answer=math_answer,
                agent=agent,
                steps=steps,
                confidence=0.92,
                workspace_id=workspace_id,
            )

    agno_answer = await _try_agno_agent(question=question, agent=agent, resource_url=resource_url)
    if agno_answer:
        steps.append("agno: completed with optional upstream tool runtime")
        return _result(
            answer=agno_answer,
            agent=agent,
            steps=steps,
            confidence=0.86,
            workspace_id=workspace_id,
        )

    steps.append("fallback: generated with NexusAI configured LLM")
    answer = await _llm_fallback(question=question, agent=agent, resource_url=resource_url)
    return _result(
        answer=answer,
        agent=agent,
        steps=steps,
        confidence=0.72,
        workspace_id=workspace_id,
    )


def _result(
    *,
    answer: str,
    agent: HubAgent,
    steps: list[str],
    confidence: float,
    workspace_id: str | None,
) -> dict[str, Any]:
    return {
        "answer": answer,
        "citations": [],
        "confidence_score": confidence,
        "steps": steps,
        "agent_type": agent.id,
        "agent_name": agent.name,
        "workspace_id": workspace_id or "",
    }


async def _try_agno_agent(*, question: str, agent: HubAgent, resource_url: str | None) -> str | None:
    if not os.getenv("GROQ_API_KEY"):
        return None

    try:
        from agno.agent import Agent
        from agno.models.groq import Groq
    except Exception as exc:  # noqa: BLE001
        log.info("multi_agent_hub.agno_unavailable", reason=str(exc))
        return None

    try:
        tools = _build_agno_tools(agent.id)
        runnable = Agent(
            name=agent.name,
            role=agent.prompt_role,
            model=Groq(id=_model_for_agent(agent.id)),
            tools=tools,
            instructions=_instructions_for_agent(agent),
            show_tool_calls=True,
            markdown=True,
        )
        prompt = _compose_prompt(question=question, agent=agent, resource_url=resource_url)
        response = await asyncio.to_thread(runnable.run, prompt)
        content = getattr(response, "content", None)
        return str(content).strip() if content else None
    except Exception as exc:  # noqa: BLE001
        log.warning("multi_agent_hub.agno_failed", agent=agent.id, reason=str(exc))
        return None


def _build_agno_tools(agent_id: str) -> list[Any]:
    if agent_id == "web":
        from agno.tools.duckduckgo import DuckDuckGoTools

        return [DuckDuckGoTools()]
    if agent_id == "finance":
        from agno.tools.yfinance import YFinanceTools

        return [
            YFinanceTools(
                stock_price=True,
                analyst_recommendations=True,
                stock_fundamentals=True,
                company_info=True,
            )
        ]
    if agent_id == "research":
        from agno.tools.arxiv import ArxivTools

        return [ArxivTools()]
    if agent_id == "math":
        from agno.tools.calculator import CalculatorTools

        return [CalculatorTools(enable_all=True)]
    if agent_id == "wiki":
        from agno.tools.wikipedia import WikipediaTools

        return [WikipediaTools()]
    if agent_id == "news":
        from agno.tools.newspaper4k import Newspaper4kTools

        return [Newspaper4kTools()]
    if agent_id == "youtube":
        from agno.tools.youtube import YouTubeTools

        return [YouTubeTools()]
    return []


def _model_for_agent(agent_id: str) -> str:
    if agent_id == "finance":
        return "llama-3.3-70b-versatile"
    if agent_id == "research":
        return "deepseek-r1-distill-llama-70b"
    if agent_id == "math":
        return "mistral-saba-24b"
    return "gemma2-9b-it"


def _instructions_for_agent(agent: HubAgent) -> list[str]:
    base = [
        agent.prompt_role,
        "Use clear headings, concise bullets, and tables when they improve readability.",
        "Separate factual observations from analysis.",
    ]
    if agent.resource_hint:
        base.append(f"If a {agent.resource_hint.lower()} is provided, prioritize it.")
    return base


async def _llm_fallback(*, question: str, agent: HubAgent, resource_url: str | None) -> str:
    prompt = _compose_prompt(question=question, agent=agent, resource_url=resource_url)
    system = (
        "You are NexusAI's integrated Multi-Agent Intelligence Hub. "
        "The original upstream Streamlit/Agno agent project has been merged into this FastAPI app. "
        "Answer as the selected specialist. If live external tools are unavailable, be explicit about limits."
    )

    try:
        client = get_async_openai_client()
        completion = await client.chat.completions.create(
            model=settings.llm_model,
            max_tokens=settings.llm_max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            stream=False,
            extra_body={"chat_template_kwargs": {"thinking": False}},
        )
        answer = completion.choices[0].message.content if completion.choices else ""
        if answer:
            return answer
    except Exception as exc:  # noqa: BLE001
        log.warning("multi_agent_hub.llm_fallback_failed", agent=agent.id, reason=str(exc))

    return _offline_specialist_answer(question=question, agent=agent, resource_url=resource_url)


def _compose_prompt(*, question: str, agent: HubAgent, resource_url: str | None) -> str:
    resource = f"\nResource URL: {resource_url.strip()}" if resource_url else ""
    return (
        f"Selected specialist: {agent.name}\n"
        f"Capability: {agent.description}\n"
        f"Upstream tool mapping: {agent.upstream_tool}\n"
        f"{resource}\n\n"
        f"User request:\n{question}"
    )


def _offline_specialist_answer(*, question: str, agent: HubAgent, resource_url: str | None) -> str:
    resource_line = f"\n\nResource provided: {resource_url}" if resource_url else ""
    if agent.id == "finance":
        return (
            "## Financial Analysis Draft\n\n"
            f"Question: {question}{resource_line}\n\n"
            "- Live market tools or a working LLM provider are not available in this local run.\n"
            "- I can still structure the analysis safely: identify the company/ticker, compare revenue, profitability, debt, cash flow, valuation, and risk.\n"
            "- For final investment-style output, start the backend with a valid LLM key and optionally enable a live market-data tool.\n\n"
            "### Recommended Checks\n"
            "1. Company overview and business model\n"
            "2. Revenue growth and margin trend\n"
            "3. Balance-sheet strength\n"
            "4. Cash-flow quality\n"
            "5. Valuation compared with peers\n"
            "6. Key risks and assumptions"
        )
    if agent.id == "research":
        return (
            "## Academic Research Draft\n\n"
            f"Topic: {question}{resource_line}\n\n"
            "- Live arXiv/search tools or a working LLM provider are not available in this local run.\n"
            "- Use this structure for the final research answer: recent papers, methods, datasets, findings, limitations, and open questions.\n\n"
            "### Research Plan\n"
            "1. Define the exact research question\n"
            "2. Search recent papers and surveys\n"
            "3. Group findings by method or theme\n"
            "4. Compare strengths and weaknesses\n"
            "5. Summarize practical takeaways"
        )
    if agent.id == "math":
        return (
            "## Math Agent\n\n"
            f"I could not extract a safe arithmetic expression from: `{question}`.\n\n"
            "Try a direct expression such as `calculate 25 * 4 + 10` or `solve 120 / 6`."
        )
    if agent.id in {"web", "news", "youtube", "wiki"}:
        return (
            f"## {agent.name} Draft\n\n"
            f"Request: {question}{resource_line}\n\n"
            "- Live external tools are not available in this local run, so I will not invent current facts.\n"
            "- Once the related API/tool key is configured, this agent can fetch source-backed information.\n\n"
            "### Safe Output Structure\n"
            "1. Main answer or summary\n"
            "2. Important entities and dates\n"
            "3. Source/citation list\n"
            "4. Uncertainties or missing context"
        )
    return (
        "## NexusAI Agent Response\n\n"
        f"Question: {question}{resource_line}\n\n"
        "- The agent router is working, but the live LLM/tool runtime is not available for this request.\n"
        "- The dashboard can still create, track, and display agent runs.\n"
        "- Add a valid LLM API key to enable full generated answers."
    )


_BIN_OPS: dict[type[ast.operator], Callable[[float, float], float]] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPS: dict[type[ast.unaryop], Callable[[float], float]] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def _try_local_math(question: str) -> str | None:
    expression = _extract_arithmetic_expression(question)
    if not expression:
        return None
    try:
        value = _eval_math_ast(ast.parse(expression, mode="eval").body)
    except Exception:
        return None
    rendered = int(value) if float(value).is_integer() else round(float(value), 8)
    return f"Result: {rendered}\n\nExpression evaluated: `{expression}`"


def _extract_arithmetic_expression(question: str) -> str | None:
    cleaned = question.lower()
    cleaned = cleaned.replace("x", "*").replace("^", "**")
    matches = re.findall(r"[0-9][0-9+\-*/().% \t]*", cleaned)
    if not matches:
        return None
    expression = max(matches, key=len).strip().rstrip(".")
    return expression if any(op in expression for op in ("+", "-", "*", "/", "%")) else None


def _eval_math_ast(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        return _BIN_OPS[type(node.op)](_eval_math_ast(node.left), _eval_math_ast(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
        return _UNARY_OPS[type(node.op)](_eval_math_ast(node.operand))
    raise ValueError("Unsupported math expression")
