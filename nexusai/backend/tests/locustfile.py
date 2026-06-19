"""
Locust load test for NexusAI.

Simulates realistic user behaviour:
  - Auth (register/login)
  - Document upload
  - Chat queries (the most expensive operation)
  - Document listing

Run:
  pip install locust
  locust -f tests/locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10

Or headless:
  locust -f tests/locustfile.py --host=http://localhost:8000 \
    --users=100 --spawn-rate=10 --run-time=60s --headless \
    --html=load_test_report.html
"""
from __future__ import annotations

import random
import string
import time
from locust import HttpUser, SequentialTaskSet, TaskSet, between, task


def _random_email() -> str:
    rand = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"load_{rand}@nexusai-test.com"


SAMPLE_QUESTIONS = [
    "What are the key findings in the uploaded documents?",
    "Summarise the main risks mentioned across all files.",
    "What dates and deadlines are mentioned?",
    "Compare the methodology sections.",
    "What are the revenue figures for Q3?",
    "List all action items from the project plan.",
]

SAMPLE_TEXT = b"This is a sample document for load testing. " * 200


class ChatFlow(TaskSet):
    token: str = ""
    workspace_id: str = ""

    def on_start(self) -> None:
        """Register + login before running tasks."""
        email = _random_email()
        password = "LoadTest123!"

        # Register
        self.client.post("/api/auth/register", json={
            "email": email, "password": password,
            "workspace_name": f"LoadTest-{email[:8]}"
        })

        # Login
        with self.client.post("/api/auth/login",
                              json={"email": email, "password": password},
                              catch_response=True) as resp:
            if resp.status_code == 200:
                data = resp.json()
                self.token = data["access_token"]
                # Get workspace from /me
                me = self.client.get("/api/auth/me",
                                     headers={"Authorization": f"Bearer {self.token}"})
                if me.status_code == 200:
                    self.workspace_id = me.json().get("workspace_id", "")
            else:
                resp.failure(f"Login failed: {resp.status_code}")

    def _auth(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    @task(5)
    def chat_query(self) -> None:
        """Most frequent task — streaming chat query."""
        if not self.token or not self.workspace_id:
            return

        question = random.choice(SAMPLE_QUESTIONS)
        start = time.perf_counter()

        with self.client.post(
            "/api/chat/query",
            json={"question": question, "workspace_id": self.workspace_id, "top_k": 5},
            headers=self._auth(),
            stream=True,
            catch_response=True,
            name="/api/chat/query",
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"Chat failed: {resp.status_code}")
                return

            # Consume the SSE stream to completion
            tokens_received = 0
            for chunk in resp.iter_lines():
                if chunk and b"event: token" in chunk:
                    tokens_received += 1
                if chunk and b"event: done" in chunk:
                    break

            elapsed = time.perf_counter() - start
            if elapsed > 30:
                resp.failure(f"Chat too slow: {elapsed:.1f}s")
            else:
                resp.success()

    @task(3)
    def list_documents(self) -> None:
        """Frequent background task — document list."""
        if not self.token:
            return
        self.client.get("/api/documents/", headers=self._auth(), name="/api/documents/")

    @task(2)
    def list_sessions(self) -> None:
        """Chat history list."""
        if not self.token:
            return
        self.client.get("/api/chat/sessions", headers=self._auth(), name="/api/chat/sessions")

    @task(1)
    def upload_document(self) -> None:
        """Infrequent — document upload."""
        if not self.token:
            return
        self.client.post(
            "/api/documents/upload",
            files={"file": ("load_test.txt", SAMPLE_TEXT, "text/plain")},
            headers=self._auth(),
            name="/api/documents/upload",
        )

    @task(1)
    def health_check(self) -> None:
        self.client.get("/health", name="/health")


class NexusAIUser(HttpUser):
    """
    Simulates a realistic NexusAI user.
    wait_time: between 1 and 5 seconds between tasks (realistic think time).
    """
    tasks = [ChatFlow]
    wait_time = between(1, 5)


class HeavyChatUser(HttpUser):
    """
    Aggressive user — no wait time, hammers the chat endpoint.
    Use with weight=1 while NexusAIUser has weight=9 for a 10% spike scenario.
    """
    tasks = [ChatFlow]
    wait_time = between(0.1, 0.5)
    weight = 1
