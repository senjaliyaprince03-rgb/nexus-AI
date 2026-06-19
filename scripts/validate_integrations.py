from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "integrations" / "projects.json"


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    raise SystemExit(1)


def main() -> int:
    if not MANIFEST.exists():
        fail(f"Missing integration manifest: {MANIFEST}")

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    projects = data.get("projects", [])
    if not projects:
        fail("Manifest has no projects")

    project_ids = [project.get("id") for project in projects]
    duplicate_projects = [item for item, count in Counter(project_ids).items() if count > 1]
    if duplicate_projects:
        fail(f"Duplicate project ids: {duplicate_projects}")

    service_ids: list[str] = []
    checked_paths = 0
    missing_paths: list[str] = []
    invalid_urls: list[str] = []

    for project in projects:
        project_id = project.get("id", "<unknown>")
        local_path = project.get("local_path")
        if local_path:
            checked_paths += 1
            if not (ROOT / local_path).exists():
                missing_paths.append(f"{project_id}: {local_path}")

        for service in project.get("services", []):
            service_id = service.get("id")
            if not service_id:
                fail(f"Service without id in project {project_id}")
            service_ids.append(service_id)

            url = service.get("url", "")
            parsed = urlparse(url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                invalid_urls.append(f"{service_id}: {url}")

    duplicate_services = [item for item, count in Counter(service_ids).items() if count > 1]
    if duplicate_services:
        fail(f"Duplicate service ids: {duplicate_services}")
    if missing_paths:
        fail("Missing local paths:\n" + "\n".join(missing_paths))
    if invalid_urls:
        fail("Invalid service URLs:\n" + "\n".join(invalid_urls))

    print(
        "Integration manifest OK: "
        f"{len(projects)} projects, {len(service_ids)} services, {checked_paths} local paths verified."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
