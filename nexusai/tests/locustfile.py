"""
NexusAI load test — Locust
Usage:
    locust -f tests/locustfile.py --host=http://localhost:8000 \
           --users=50 --spawn-rate=5 --run-time=2m

Scenarios:
  - ChatUser      60%  — login + send chat queries
  - AnalyticsUser 30%  — login + poll analytics endpoints
  - UploadUser    10%  — login + upload a small PDF
"""
from __future__ import annotations

import json
import os
import random
import time

from locust import HttpUser, TaskSet, between, events, task

BASE_EMAIL = "loadtest@nexusai.dev"
BASE_PASS = "LoadTest1234!"
SMALL_PDF = b"%PDF-1.4 1 0 obj<</Type /Catalog>>endobj"  # minimal valid PDF bytes


# ── Shared token cache ────────────────────────────────────────────
_token_cache: dict[str, str] = {}


def get_token(client, email: str = BASE_EMAIL, password: str = BASE_PASS) -> str:
    if email in _token_cache:
        return _token_cache[email]
    with client.post("/api/auth/login", json={"email": email, "password": password},
                     catch_response=True, name="/api/auth/login") as r:
        if r.status_code == 200:
            token = r.json()["access_token"]
            _token_cache[email] = token
            return token
        elif r.status_code == 401:
            # User doesn't exist — register first
            client.post("/api/auth/register", json={
                "email": email, "password": password, "full_name": "Load Tester"
            })
            return get_token(client, email, password)
        r.failure(f"Login failed: {r.status_code}")
    return ""


# ── Chat tasks ────────────────────────────────────────────────────

QUESTIONS = [
    "What are the main topics covered in the documents?",
    "Summarise the key findings.",
    "What recommendations are made?",
    "Explain the methodology used.",
    "What are the limitations mentioned?",
]


class ChatTasks(TaskSet):
    token: str = ""
    workspace_id: str = ""

    def on_start(self) -> None:
        self.token = get_token(self.client)
        # Get or create workspace
        r = self.client.get("/api/workspaces/",
                            headers={"Authorization": f"Bearer {self.token}"})
        if r.status_code == 200 and r.json():
            self.workspace_id = r.json()[0]["id"]
        else:
            r2 = self.client.post("/api/workspaces/",
                                  json={"name": "Load WS", "slug": f"load-ws-{int(time.time())}"},
                                  headers={"Authorization": f"Bearer {self.token}"})
            if r2.status_code == 201:
                self.workspace_id = r2.json()["id"]

    @task(3)
    def send_chat_query(self) -> None:
        if not self.workspace_id:
            return
        question = random.choice(QUESTIONS)
        with self.client.post(
            "/api/chat/query",
            json={"question": question, "workspace_id": self.workspace_id},
            headers={"Authorization": f"Bearer {self.token}"},
            stream=True,
            catch_response=True,
            name="/api/chat/query (SSE)",
        ) as r:
            if r.status_code == 200:
                # Consume the stream
                for _ in r.iter_lines():
                    pass
                r.success()
            else:
                r.failure(f"Chat query failed: {r.status_code}")

    @task(1)
    def list_sessions(self) -> None:
        self.client.get("/api/chat/sessions",
                        headers={"Authorization": f"Bearer {self.token}"},
                        name="/api/chat/sessions")


class AnalyticsTasks(TaskSet):
    token: str = ""

    def on_start(self) -> None:
        self.token = get_token(self.client)

    @task(2)
    def get_query_volume(self) -> None:
        self.client.get("/api/analytics/queries",
                        headers={"Authorization": f"Bearer {self.token}"},
                        name="/api/analytics/queries")

    @task(1)
    def get_document_usage(self) -> None:
        self.client.get("/api/analytics/documents/usage",
                        headers={"Authorization": f"Bearer {self.token}"},
                        name="/api/analytics/documents/usage")

    @task(1)
    def health_check(self) -> None:
        self.client.get("/health", name="/health")


class UploadTasks(TaskSet):
    token: str = ""

    def on_start(self) -> None:
        self.token = get_token(self.client)

    @task
    def upload_document(self) -> None:
        with self.client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", SMALL_PDF, "application/pdf")},
            headers={"Authorization": f"Bearer {self.token}"},
            catch_response=True,
            name="/api/documents/upload",
        ) as r:
            if r.status_code in (200, 202, 400, 415):
                r.success()  # 400/415 expected for invalid PDF bytes
            else:
                r.failure(f"Upload failed: {r.status_code}")


# ── User classes (weight = approximate % of virtual users) ────────

class ChatUser(HttpUser):
    tasks = [ChatTasks]
    weight = 6
    wait_time = between(2, 8)


class AnalyticsUser(HttpUser):
    tasks = [AnalyticsTasks]
    weight = 3
    wait_time = between(1, 4)


class UploadUser(HttpUser):
    tasks = [UploadTasks]
    weight = 1
    wait_time = between(10, 30)


# ── Summary report ────────────────────────────────────────────────

@events.quitting.add_listener
def on_quitting(environment, **kw) -> None:
    stats = environment.stats
    print("\n=== NexusAI Load Test Summary ===")
    for name, entry in stats.entries.items():
        print(f"  {name[1]:40s}  "
              f"p50={entry.get_response_time_percentile(0.5):.0f}ms  "
              f"p95={entry.get_response_time_percentile(0.95):.0f}ms  "
              f"RPS={entry.current_rps:.1f}  "
              f"fail={entry.num_failures}")
