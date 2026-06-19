from __future__ import annotations

import json
import os
import asyncio
from collections import Counter
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response


ROOT_DIR = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT_DIR / "integrations" / "projects.json"


def load_manifest() -> dict[str, Any]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as manifest_file:
        return json.load(manifest_file)


MANIFEST = load_manifest()


def build_service_index() -> dict[str, dict[str, Any]]:
    services: dict[str, dict[str, Any]] = {}
    for project in MANIFEST.get("projects", []):
        for service in project.get("services", []):
            service_id = service["id"]
            services[service_id] = {
                **service,
                "project_id": project["id"],
                "project_name": project["name"],
                "source_url": project.get("source_url"),
                "local_path": project.get("local_path"),
            }
    return services


SERVICES = build_service_index()

app = FastAPI(
    title="Nexus Master API Gateway",
    description="Unified API gateway and integration console for all Nexus components",
    version="3.0.0",
)


def public_project(project: dict[str, Any]) -> dict[str, Any]:
    local_path = project.get("local_path")
    exists = bool(local_path and (ROOT_DIR / local_path).exists())
    return {
        **project,
        "local_path_exists": exists,
        "service_count": len(project.get("services", [])),
    }


def port_conflicts() -> dict[str, list[str]]:
    ports = [
        (str(service.get("port")), service_id)
        for service_id, service in SERVICES.items()
        if service.get("port")
    ]
    counts = Counter(port for port, _ in ports)
    return {
        port: [service_id for service_port, service_id in ports if service_port == port]
        for port, count in counts.items()
        if count > 1
    }


def service_health_url(service: dict[str, Any]) -> str:
    base_url = service["url"].rstrip("/")
    health_path = service.get("health_path", "/")
    if health_path.startswith("http://") or health_path.startswith("https://"):
        return health_path
    return f"{base_url}/{health_path.lstrip('/')}"


async def check_service(client: httpx.AsyncClient, service_id: str, service: dict[str, Any]) -> dict[str, Any]:
    health_url = service_health_url(service)
    result = {
        "id": service_id,
        "name": service["name"],
        "project_id": service["project_id"],
        "project_name": service["project_name"],
        "type": service.get("type", "service"),
        "url": service["url"],
        "health_url": health_url,
        "port": service.get("port"),
        "proxy": bool(service.get("proxy")),
        "proxy_url": f"/{service_id}" if service.get("proxy") else None,
    }

    try:
        response = await client.get(health_url, follow_redirects=True)
        result["status"] = "online" if response.status_code < 500 else "degraded"
        result["code"] = response.status_code
    except httpx.TimeoutException:
        result["status"] = "offline"
        result["error"] = "Health check timed out"
    except httpx.ConnectError:
        result["status"] = "offline"
    except httpx.HTTPError as exc:
        result["status"] = "error"
        result["error"] = str(exc)

    return result


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "gateway": "running",
        "version": app.version,
        "manifest_version": MANIFEST.get("version"),
        "projects": len(MANIFEST.get("projects", [])),
        "services": len(SERVICES),
        "default_port": MANIFEST.get("gateway", {}).get("default_port", 9100),
    }


@app.get("/api/projects")
async def projects() -> dict[str, Any]:
    return {"projects": [public_project(project) for project in MANIFEST.get("projects", [])]}


@app.get("/api/projects/{project_id}")
async def project_detail(project_id: str) -> dict[str, Any]:
    for project in MANIFEST.get("projects", []):
        if project["id"] == project_id:
            return public_project(project)
    raise HTTPException(status_code=404, detail=f"Project '{project_id}' was not found")


@app.get("/api/services")
async def services() -> dict[str, Any]:
    return {"services": list(SERVICES.values())}


@app.get("/api/services/status")
async def services_status() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        service_results = await asyncio.gather(*[
            check_service(client, service_id, service)
            for service_id, service in SERVICES.items()
        ])
    return {
        "services": service_results,
        "summary": dict(Counter(service["status"] for service in service_results)),
    }


@app.get("/api/integration/summary")
async def integration_summary() -> dict[str, Any]:
    projects = [public_project(project) for project in MANIFEST.get("projects", [])]
    status_counts = Counter(project.get("status", "unknown") for project in projects)
    missing_paths = [
        {"id": project["id"], "local_path": project.get("local_path")}
        for project in projects
        if not project["local_path_exists"]
    ]
    return {
        "name": MANIFEST.get("name"),
        "version": MANIFEST.get("version"),
        "project_count": len(projects),
        "service_count": len(SERVICES),
        "status_counts": dict(status_counts),
        "missing_paths": missing_paths,
        "port_conflicts": port_conflicts(),
        "gateway": MANIFEST.get("gateway", {}),
    }


@app.get("/", response_class=HTMLResponse)
async def root() -> str:
    return HTML


async def proxy_service(service_name: str, path: str, request: Request) -> Response:
    service = SERVICES.get(service_name)
    if not service:
        return JSONResponse(
            {
                "error": f"Service '{service_name}' was not found",
                "available_services": list(SERVICES.keys()),
            },
            status_code=404,
        )
    if not service.get("proxy"):
        return JSONResponse(
            {
                "error": f"Service '{service_name}' is a UI service and should be opened directly",
                "url": service["url"],
            },
            status_code=400,
        )

    target_url = f"{service['url'].rstrip('/')}/{path.lstrip('/')}"
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.request(
                method=request.method,
                url=target_url,
                params=request.query_params,
                content=await request.body(),
                headers=headers,
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type=response.headers.get("content-type"),
            )
        except httpx.ConnectError:
            return JSONResponse(
                {"error": f"Service '{service_name}' is not running", "url": service["url"]},
                status_code=503,
            )
        except httpx.HTTPError as exc:
            return JSONResponse(
                {"error": f"Gateway error for {service_name}", "detail": str(exc)},
                status_code=502,
            )


@app.api_route("/{service_name}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def gateway_root(service_name: str, request: Request) -> Response:
    return await proxy_service(service_name, "", request)


@app.api_route("/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def gateway(service_name: str, path: str, request: Request) -> Response:
    return await proxy_service(service_name, path, request)


HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nexus Integration Console</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d0f12;
      --panel: #15191d;
      --panel-2: #1b2026;
      --line: rgba(235, 239, 244, 0.1);
      --text: #f5f7fa;
      --muted: #9aa5b1;
      --soft: #cbd5df;
      --teal: #5eead4;
      --amber: #f7c66a;
      --red: #fb7185;
      --green: #86efac;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        linear-gradient(135deg, rgba(94, 234, 212, 0.08), transparent 30%),
        linear-gradient(315deg, rgba(247, 198, 106, 0.07), transparent 28%),
        var(--bg);
    }
    .shell {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }
    aside {
      border-right: 1px solid var(--line);
      background: rgba(13, 15, 18, 0.78);
      backdrop-filter: blur(18px);
      padding: 24px 18px;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--teal), var(--amber));
      box-shadow: 0 14px 35px rgba(94, 234, 212, 0.16);
    }
    .brand strong { display: block; font-size: 16px; }
    .brand span { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }
    .metric {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.035);
      margin-bottom: 10px;
    }
    .metric span { color: var(--muted); font-size: 12px; }
    .metric strong { display: block; font-size: 24px; margin-top: 4px; }
    nav { margin-top: 22px; display: grid; gap: 8px; }
    nav button {
      border: 1px solid transparent;
      color: var(--soft);
      background: transparent;
      border-radius: 10px;
      padding: 11px 12px;
      text-align: left;
      cursor: pointer;
      font: inherit;
    }
    nav button:hover, nav button.active {
      color: var(--text);
      border-color: var(--line);
      background: rgba(255, 255, 255, 0.045);
    }
    main {
      padding: 32px;
      overflow: auto;
    }
    .top {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 26px;
    }
    h1 {
      margin: 0;
      font-size: clamp(32px, 4vw, 56px);
      letter-spacing: 0;
      line-height: 1;
    }
    .lede {
      margin: 14px 0 0;
      max-width: 760px;
      color: var(--muted);
      line-height: 1.6;
    }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .button {
      appearance: none;
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--text);
      background: var(--panel-2);
      padding: 11px 14px;
      text-decoration: none;
      cursor: pointer;
      font-weight: 650;
    }
    .button.primary {
      color: #06100f;
      background: var(--teal);
      border-color: transparent;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    .project-card {
      grid-column: span 6;
      min-height: 320px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025));
      box-shadow: var(--shadow);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .project-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .project-card h2 {
      font-size: 20px;
      margin: 0 0 6px;
    }
    .category {
      color: var(--muted);
      font-size: 13px;
    }
    .badge {
      height: fit-content;
      padding: 6px 9px;
      border-radius: 999px;
      border: 1px solid var(--line);
      color: var(--soft);
      background: rgba(255,255,255,0.04);
      font-size: 12px;
      white-space: nowrap;
    }
    .summary {
      color: var(--soft);
      line-height: 1.55;
      margin: 0;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: auto;
    }
    .chip {
      color: var(--soft);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 9px;
      font-size: 12px;
      background: rgba(255,255,255,0.035);
    }
    .services {
      display: grid;
      gap: 8px;
    }
    .service {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 10px;
      background: rgba(0,0,0,0.18);
      border: 1px solid var(--line);
    }
    .service a {
      color: var(--text);
      text-decoration: none;
      font-weight: 650;
    }
    .service small { color: var(--muted); display: block; margin-top: 2px; }
    .state {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--muted);
    }
    .online .dot { background: var(--green); box-shadow: 0 0 14px rgba(134,239,172,.65); }
    .offline .dot, .timeout .dot { background: var(--red); }
    .degraded .dot { background: var(--amber); }
    .viewer {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      min-height: 680px;
      background: #070809;
      display: none;
    }
    .viewer.active { display: block; }
    .viewer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }
    iframe {
      width: 100%;
      height: 630px;
      border: 0;
      background: white;
    }
    .hidden { display: none; }
    @media (max-width: 980px) {
      .shell { grid-template-columns: 1fr; }
      aside { position: static; height: auto; }
      .project-card { grid-column: span 12; }
      .top { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <div class="brand">
        <div class="mark"></div>
        <div>
          <strong>Nexus Console</strong>
          <span>Master integration gateway</span>
        </div>
      </div>
      <div class="metric"><span>Projects Integrated</span><strong id="project-count">--</strong></div>
      <div class="metric"><span>Services Registered</span><strong id="service-count">--</strong></div>
      <div class="metric"><span>Gateway Port</span><strong>9100</strong></div>
      <nav id="project-nav"></nav>
    </aside>
    <main>
      <section class="top">
        <div>
          <h1>Nexus Integration Console</h1>
          <p class="lede">A single operational surface for your personal NexusAi workspace and the five imported Nexus agent systems. Each source is preserved, mapped, health-checked, and linked through this gateway.</p>
        </div>
        <div class="actions">
          <button class="button" onclick="refreshStatus()">Refresh Status</button>
          <a class="button primary" href="/api/integration/summary" target="_blank" rel="noreferrer">Integration JSON</a>
        </div>
      </section>
      <section class="grid" id="projects"></section>
      <section class="viewer" id="viewer">
        <div class="viewer-bar">
          <strong id="viewer-title">Preview</strong>
          <a class="button" id="viewer-open" href="#" target="_blank" rel="noreferrer">Open Full Page</a>
        </div>
        <iframe id="viewer-frame" title="Nexus service preview" src="about:blank"></iframe>
      </section>
    </main>
  </div>

  <script>
    let projects = [];
    let statuses = {};

    const statusClass = (status) => ["online", "offline", "timeout", "degraded"].includes(status) ? status : "";

    async function loadData() {
      const [projectResponse, statusResponse, summaryResponse] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/services/status"),
        fetch("/api/integration/summary")
      ]);
      projects = (await projectResponse.json()).projects;
      const statusData = await statusResponse.json();
      statuses = Object.fromEntries(statusData.services.map((service) => [service.id, service]));
      const summary = await summaryResponse.json();
      document.getElementById("project-count").textContent = summary.project_count;
      document.getElementById("service-count").textContent = summary.service_count;
      renderNav();
      renderProjects();
    }

    async function refreshStatus() {
      const response = await fetch("/api/services/status");
      const statusData = await response.json();
      statuses = Object.fromEntries(statusData.services.map((service) => [service.id, service]));
      renderProjects();
    }

    function renderNav() {
      const nav = document.getElementById("project-nav");
      nav.innerHTML = "";
      projects.forEach((project) => {
        const button = document.createElement("button");
        button.textContent = project.name;
        button.onclick = () => document.getElementById(`project-${project.id}`).scrollIntoView({ behavior: "smooth", block: "start" });
        nav.appendChild(button);
      });
    }

    function renderProjects() {
      const root = document.getElementById("projects");
      root.innerHTML = "";
      projects.forEach((project) => {
        const card = document.createElement("article");
        card.className = "project-card";
        card.id = `project-${project.id}`;
        const topCapabilities = project.capabilities.slice(0, 5);
        card.innerHTML = `
          <div class="project-head">
            <div>
              <h2>${project.name}</h2>
              <div class="category">${project.category}</div>
            </div>
            <span class="badge">${project.status}</span>
          </div>
          <p class="summary">${project.summary}</p>
          <div class="services">
            ${project.services.length ? project.services.map(renderService).join("") : `<div class="service"><div><strong>Package integration</strong><small>${project.local_path}</small></div><span class="state">library</span></div>`}
          </div>
          <div class="chips">${topCapabilities.map((item) => `<span class="chip">${item}</span>`).join("")}</div>
        `;
        root.appendChild(card);
      });
    }

    function renderService(service) {
      const state = statuses[service.id] || { status: "unchecked" };
      const klass = statusClass(state.status);
      const preview = service.type === "ui"
        ? `<button class="button" onclick="previewService('${service.id}')">Preview</button>`
        : `<a class="button" href="/${service.id}/" target="_blank" rel="noreferrer">Proxy</a>`;
      return `
        <div class="service">
          <div>
            <a href="${service.url}" target="_blank" rel="noreferrer">${service.name}</a>
            <small>${service.url}</small>
          </div>
          <div class="actions">
            <span class="state ${klass}"><span class="dot"></span>${state.status}</span>
            ${preview}
          </div>
        </div>
      `;
    }

    function previewService(serviceId) {
      const service = projects.flatMap((project) => project.services).find((item) => item.id === serviceId);
      if (!service) return;
      document.getElementById("viewer").classList.add("active");
      document.getElementById("viewer-title").textContent = service.name;
      document.getElementById("viewer-open").href = service.url;
      document.getElementById("viewer-frame").src = service.url;
      document.getElementById("viewer").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    loadData().catch((error) => {
      document.getElementById("projects").innerHTML = `<article class="project-card"><h2>Gateway data failed</h2><p class="summary">${error}</p></article>`;
    });
  </script>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("MASTER_GATEWAY_PORT", MANIFEST.get("gateway", {}).get("default_port", 9100)))
    uvicorn.run(app, host="0.0.0.0", port=port)
