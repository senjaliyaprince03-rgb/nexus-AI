"""Integration registry service for imported Nexus systems."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

import httpx


PROJECT_ACTIONS: dict[str, dict[str, str]] = {
    "personal-nexusai-core": {
        "native_href": "/dashboard/workspace",
        "primary_action": "Open workspace",
    },
    "multi-agent-hub": {
        "native_href": "/dashboard/modules",
        "primary_action": "Open intelligence hub",
    },
    "nexus-agents": {
        "native_href": "/dashboard/modules",
        "primary_action": "Open deep research",
    },
    "svenhven-nexus-ai": {
        "native_href": "/dashboard/analytics",
        "primary_action": "Review sentiment signals",
    },
    "nexus-gcp": {
        "native_href": "/dashboard/agents",
        "primary_action": "Open task agents",
    },
    "primisai-nexus": {
        "native_href": "/dashboard/agents",
        "primary_action": "Inspect framework agents",
    },
}


def registry_path() -> Path:
    """Find the canonical integration registry from the backend package."""
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "integrations" / "projects.json"
        if candidate.exists():
            return candidate
    raise FileNotFoundError("integrations/projects.json was not found")


def _load_registry() -> dict[str, Any]:
    with registry_path().open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict) or not isinstance(data.get("projects"), list):
        raise ValueError("Invalid integration registry format")
    return data


async def _probe_service(health_path: str | None) -> str:
    if not health_path:
        return "unknown"
    probe_urls = [health_path]
    parsed = urlparse(health_path)
    if parsed.hostname in {"127.0.0.1", "localhost"}:
        probe_urls.append(
            urlunparse(parsed._replace(netloc=f"host.docker.internal:{parsed.port}" if parsed.port else "host.docker.internal"))
        )

    async with httpx.AsyncClient(timeout=0.45, follow_redirects=True) as client:
        for probe_url in probe_urls:
            try:
                response = await client.get(probe_url)
                if 200 <= response.status_code < 400:
                    return "online"
                if response.status_code < 500:
                    return "degraded"
            except Exception:
                continue
    return "offline"


def _static_service_health(service_id: str) -> str | None:
    """Avoid probing the frontend that is rendering the dashboard request."""
    if service_id in {"personal_nexusai_api", "personal_nexusai_ui"}:
        return "online"
    return None


async def list_integrated_projects(*, check_health: bool = True) -> dict[str, Any]:
    """Return sanitized, dashboard-safe project registry data."""
    registry = _load_registry()
    raw_projects = [
        project
        for project in registry.get("projects", [])
        if isinstance(project, dict) and project.get("status") != "optional"
    ]

    service_health: dict[str, str] = {}
    service_jobs: list[tuple[str, str | None]] = []
    for project in raw_projects:
        for service in project.get("services", []) or []:
            if not isinstance(service, dict):
                continue
            service_id = str(service.get("id", ""))
            static_health = _static_service_health(service_id)
            if static_health:
                service_health[service_id] = static_health
                continue
            if check_health:
                service_jobs.append((service_id, service.get("health_path")))

    if check_health and service_jobs:
        results = await asyncio.gather(
            *[_probe_service(health_path) for _, health_path in service_jobs],
            return_exceptions=False,
        )
        service_health.update(
            {service_id: result for (service_id, _), result in zip(service_jobs, results, strict=False)}
        )

    projects: list[dict[str, Any]] = []
    for project in raw_projects:
        project_id = str(project.get("id", ""))
        capabilities = [
            str(capability)
            for capability in project.get("capabilities", [])
            if isinstance(capability, str)
        ]
        services = []
        for service in project.get("services", []) or []:
            if not isinstance(service, dict):
                continue
            service_id = str(service.get("id", ""))
            health = service_health.get(service_id, "unknown")
            service_type = str(service.get("type", "service"))
            url = str(service.get("url", ""))
            services.append(
                {
                    "id": service_id,
                    "name": str(service.get("name", "Service")),
                    "type": service_type,
                    "port": service.get("port"),
                    "health": health,
                    "launch_url": url,
                    "embeddable": service_type == "ui" and health == "online",
                }
            )

        action = PROJECT_ACTIONS.get(project_id, {"native_href": "/dashboard/modules", "primary_action": "Open module"})
        project_health = _project_health(services)
        projects.append(
            {
                "id": project_id,
                "name": str(project.get("name", "Nexus system")),
                "status": str(project.get("status", "integrated")),
                "category": str(project.get("category", "Integrated system")),
                "summary": str(project.get("summary", "")),
                "capabilities": capabilities,
                "capability_count": len(capabilities),
                "health": project_health,
                "services": services,
                "native_href": action["native_href"],
                "primary_action": action["primary_action"],
            }
        )

    summary = _summary(projects)
    return {
        "version": registry.get("version"),
        "name": registry.get("name", "Nexus Master Integration"),
        "gateway": {
            "default_port": (registry.get("gateway") or {}).get("default_port"),
            "url": f"http://localhost:{(registry.get('gateway') or {}).get('default_port', 9100)}",
        },
        "summary": summary,
        "projects": projects,
    }


def _project_health(services: list[dict[str, Any]]) -> str:
    if not services:
        return "framework"
    states = {service.get("health", "unknown") for service in services}
    if "online" in states:
        return "online"
    if "degraded" in states:
        return "degraded"
    if states == {"offline"}:
        return "offline"
    return "unknown"


def _summary(projects: list[dict[str, Any]]) -> dict[str, int]:
    services = [service for project in projects for service in project["services"]]
    return {
        "project_count": len(projects),
        "capability_count": sum(project["capability_count"] for project in projects),
        "service_count": len(services),
        "online_services": sum(1 for service in services if service["health"] == "online"),
        "offline_services": sum(1 for service in services if service["health"] == "offline"),
        "unknown_services": sum(1 for service in services if service["health"] == "unknown"),
    }
