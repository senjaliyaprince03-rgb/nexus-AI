"""Dashboard overview aggregation."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.mongo import to_object_id, utc_now
from app.services.integration_registry import list_integrated_projects
from app.services.mongo_store import store


WORKFLOW = [
    {
        "id": "upload",
        "label": "Upload documents",
        "description": "Build the workspace knowledge base.",
        "href": "/dashboard/documents",
        "state": "ready",
    },
    {
        "id": "chat",
        "label": "Ask chat",
        "description": "Get cited answers from your files.",
        "href": "/chat",
        "state": "ready",
    },
    {
        "id": "agents",
        "label": "Run agents",
        "description": "Route complex questions to specialists.",
        "href": "/dashboard/agents",
        "state": "ready",
    },
    {
        "id": "research",
        "label": "Deep research",
        "description": "Create structured research reports.",
        "href": "/dashboard/modules",
        "state": "ready",
    },
    {
        "id": "analytics",
        "label": "Review analytics",
        "description": "Track usage, sources, and quality.",
        "href": "/dashboard/analytics",
        "state": "ready",
    },
]


async def build_dashboard_overview(*, user: dict[str, Any], check_health: bool = True) -> dict[str, Any]:
    workspace_id = user.get("active_workspace_id") or user.get("default_workspace_id")
    workspace_oid = to_object_id(workspace_id)
    workspace = await store.get_workspace(workspace_oid)

    integrations = await list_integrated_projects(check_health=check_health)

    total_docs = await store.documents.count_documents(
        {"workspace_id": workspace_oid, "deleted_at": None}
    )
    indexed_docs = await store.documents.count_documents(
        {"workspace_id": workspace_oid, "deleted_at": None, "status": "ready"}
    )
    query_count_today = await _count_today(workspace_oid, "query")
    support_count_today = await _count_today(workspace_oid, "support_query")
    agent_runs = await store.agent_runs.count_documents({"workspace_id": workspace_oid})
    avg_confidence = await _average_confidence(workspace_oid)
    avg_response_ms = await _average_response_ms(workspace_oid)

    latest_chat = await store.chat_messages.find_one(
        {"workspace_id": workspace_oid, "role": "assistant"},
        sort=[("created_at", -1)],
    )
    latest_agent = await store.agent_runs.find_one(
        {"workspace_id": workspace_oid},
        sort=[("created_at", -1)],
    )
    recent_activity = await _recent_activity(workspace_oid)

    metrics = [
        {
            "id": "documents",
            "label": "Documents indexed",
            "value": indexed_docs,
            "detail": f"{total_docs} total uploaded",
            "href": "/dashboard/documents",
            "tone": "blue",
        },
        {
            "id": "queries",
            "label": "Queries today",
            "value": query_count_today,
            "detail": f"{support_count_today} support questions today",
            "href": "/chat",
            "tone": "coral",
        },
        {
            "id": "confidence",
            "label": "Avg. confidence",
            "value": round(avg_confidence * 100) if avg_confidence is not None else None,
            "suffix": "%" if avg_confidence is not None else "",
            "detail": "From assistant and agent runs",
            "href": "/dashboard/analytics",
            "tone": "sage",
        },
        {
            "id": "systems",
            "label": "Integrated systems",
            "value": integrations["summary"]["project_count"],
            "detail": f"{integrations['summary']['capability_count']} capabilities mapped",
            "href": "/dashboard/modules",
            "tone": "violet",
        },
    ]

    outputs = _build_outputs(latest_chat, latest_agent, avg_response_ms)
    return {
        "workspace": {
            "id": str(workspace_oid),
            "name": workspace.get("name", "Workspace") if workspace else "Workspace",
            "plan": workspace.get("plan", "free") if workspace else "free",
        },
        "generated_at": utc_now().isoformat(),
        "health": integrations["summary"],
        "metrics": metrics,
        "workflow": WORKFLOW,
        "projects": integrations["projects"],
        "capability_catalog": _capability_catalog(integrations["projects"]),
        "outputs": outputs,
        "recent_activity": recent_activity,
        "next_actions": _next_actions(total_docs, query_count_today, agent_runs),
    }


async def _count_today(workspace_oid: Any, event_type: str) -> int:
    start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    return await store.analytics_events.count_documents(
        {
            "workspace_id": workspace_oid,
            "event_type": event_type,
            "created_at": {"$gte": start},
        }
    )


async def _average_confidence(workspace_oid: Any) -> float | None:
    values: list[float] = []
    messages = store.chat_messages.find(
        {"workspace_id": workspace_oid, "role": "assistant", "confidence_score": {"$ne": None}},
        projection={"confidence_score": 1},
    ).sort("created_at", -1).limit(100)
    async for message in messages:
        try:
            values.append(float(message["confidence_score"]))
        except (TypeError, ValueError, KeyError):
            pass

    runs = store.agent_runs.find(
        {"workspace_id": workspace_oid, "confidence": {"$ne": None}},
        projection={"confidence": 1},
    ).sort("created_at", -1).limit(100)
    async for run in runs:
        try:
            values.append(float(run["confidence"]))
        except (TypeError, ValueError, KeyError):
            pass

    if not values:
        return None
    return sum(values) / len(values)


async def _average_response_ms(workspace_oid: Any) -> int | None:
    values: list[float] = []
    cursor = store.analytics_events.find(
        {
            "workspace_id": workspace_oid,
            "event_type": {"$in": ["query", "support_query"]},
            "payload.latency_ms": {"$ne": None},
        },
        projection={"payload.latency_ms": 1},
    ).sort("created_at", -1).limit(100)
    async for event in cursor:
        try:
            values.append(float(event["payload"]["latency_ms"]))
        except (TypeError, ValueError, KeyError):
            pass
    if not values:
        return None
    return round(sum(values) / len(values))


async def _recent_activity(workspace_oid: Any) -> list[dict[str, Any]]:
    cursor = store.analytics_events.find(
        {"workspace_id": workspace_oid},
        projection={"event_type": 1, "payload": 1, "created_at": 1},
    ).sort("created_at", -1).limit(6)
    items = []
    async for event in cursor:
        items.append(
            {
                "id": str(event["_id"]),
                "event_type": event.get("event_type", "event"),
                "payload": _safe_payload(event.get("payload", {})),
                "created_at": event["created_at"].isoformat(),
            }
        )
    return items


def _safe_payload(payload: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}
    for key, value in payload.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            safe[key] = value
    return safe


def _capability_catalog(projects: list[dict[str, Any]]) -> list[dict[str, str]]:
    catalog: list[dict[str, str]] = []
    for project in projects:
        for capability in project["capabilities"]:
            catalog.append(
                {
                    "id": f"{project['id']}:{capability.lower().replace(' ', '-')}",
                    "label": capability,
                    "project_id": project["id"],
                    "project_name": project["name"],
                    "category": project["category"],
                    "href": project["native_href"],
                    "status": project["health"],
                    "primary_action": project["primary_action"],
                }
            )
    return catalog


def _build_outputs(
    latest_chat: dict[str, Any] | None,
    latest_agent: dict[str, Any] | None,
    avg_response_ms: int | None,
) -> list[dict[str, Any]]:
    chat_preview = (
        latest_chat.get("content", "")[:160]
        if latest_chat
        else "Ask one workspace question and cited answers will appear here."
    )
    agent_output = latest_agent.get("output") if latest_agent else None
    agent_preview = ""
    if isinstance(agent_output, dict):
        agent_preview = str(agent_output.get("answer") or agent_output.get("summary") or "")[:160]
    if not agent_preview and latest_agent and latest_agent.get("status") in {"queued", "running"}:
        agent_preview = "A research run is in progress. The summary will appear here when it completes."
    if not agent_preview:
        agent_preview = "Run one deep research query and the report summary will appear here."

    return [
        {
            "id": "citations",
            "label": "Cited answers",
            "value": chat_preview,
            "href": "/chat",
            "status": "live" if latest_chat else "waiting",
        },
        {
            "id": "research",
            "label": "Research reports",
            "value": agent_preview,
            "href": "/dashboard/modules",
            "status": latest_agent.get("status", "waiting") if latest_agent else "waiting",
        },
        {
            "id": "sentiment",
            "label": "Sentiment insight",
            "value": "Available through the integrated sentiment platform.",
            "href": "/dashboard/analytics",
            "status": "mapped",
        },
        {
            "id": "response-time",
            "label": "Response timing",
            "value": f"{avg_response_ms} ms average" if avg_response_ms else "Timing appears after your first live question.",
            "href": "/dashboard/analytics",
            "status": "live" if avg_response_ms else "waiting",
        },
    ]


def _next_actions(total_docs: int, query_count_today: int, agent_runs: int) -> list[dict[str, str]]:
    actions = []
    if total_docs == 0:
        actions.append(
            {
                "title": "Upload the first documents",
                "description": "Give NexusAI source material before asking cited questions.",
                "href": "/dashboard/documents",
            }
        )
    else:
        actions.append(
            {
                "title": "Upload fresh documents",
                "description": "Improve answer coverage with the latest workspace files.",
                "href": "/dashboard/documents",
            }
        )
    if query_count_today == 0:
        actions.append(
            {
                "title": "Ask a workspace question",
                "description": "Test retrieval, citations, and support mode from one chat.",
                "href": "/chat",
            }
        )
    else:
        actions.append(
            {
                "title": "Review source analytics",
                "description": "See which documents power recent answers.",
                "href": "/dashboard/analytics",
            }
        )
    if agent_runs == 0:
        actions.append(
            {
                "title": "Run a multi-agent query",
                "description": "Use specialist agents for a higher-complexity request.",
                "href": "/dashboard/agents",
            }
        )
    else:
        actions.append(
            {
                "title": "Open module catalog",
                "description": "Browse all mapped capabilities from the integrated systems.",
                "href": "/dashboard/modules",
            }
        )
    return actions
