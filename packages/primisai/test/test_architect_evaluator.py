import json
import shutil
from pathlib import Path

from primisai.nexus.architect.evaluator import Evaluator


class DummySupervisor:
    def __init__(self, workflow_id: str, response: str = "4") -> None:
        self.workflow_id = workflow_id
        self._response = response
        self.calls: list[str] = []

    def chat(self, query: str) -> str:
        self.calls.append(query)
        return self._response


def _write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(json.dumps(row) for row in rows) + "\n",
        encoding="utf-8",
    )


def test_resolve_history_path_uses_standard_layout():
    path = Evaluator._resolve_history_path("sample_workflow")

    assert path == Path("nexus_workflows") / "sample_workflow" / "history.jsonl"


def test_evaluate_supervisor_reads_history_from_supervisor_workflow_id(monkeypatch):
    root = Path(__file__).resolve().parents[1] / ".tmp_architect_evaluator"
    shutil.rmtree(root, ignore_errors=True)
    root.mkdir(parents=True, exist_ok=True)

    try:
        benchmark_path = root / "benchmark.jsonl"
        _write_jsonl(
            benchmark_path,
            [
                {
                    "id": "math-1",
                    "question": "What is 2 + 2?",
                    "answer": "4",
                    "difficulty": "easy",
                }
            ],
        )

        history_path = root / "nexus_workflows" / "dummy_run" / "history.jsonl"
        _write_jsonl(
            history_path,
            [
                {
                    "role": "system",
                    "content": "You are a helpful supervisor.",
                    "sender_type": "main_supervisor",
                    "sender_name": "MainSupervisor",
                    "workflow_id": "dummy_run",
                },
                {
                    "role": "user",
                    "content": "What is 2 + 2?",
                    "sender_type": "user",
                    "sender_name": "user",
                    "workflow_id": "dummy_run",
                },
                {
                    "role": "assistant",
                    "content": "4",
                    "sender_type": "main_supervisor",
                    "sender_name": "MainSupervisor",
                    "workflow_id": "dummy_run",
                },
            ],
        )

        evaluator = Evaluator(
            llm_config={"model": "dummy", "api_key": "dummy"},
            benchmark_path=str(benchmark_path),
            subset_size=1,
        )
        monkeypatch.setattr(evaluator, "_check_answer_correctness", lambda actual, predicted: True)
        monkeypatch.setattr(
            evaluator,
            "_resolve_history_path",
            lambda workflow_id: history_path if workflow_id == "dummy_run" else (_ for _ in ()).throw(AssertionError(workflow_id)),
        )

        supervisor = DummySupervisor(workflow_id="dummy_run", response="4")
        results = evaluator.evaluate_supervisor(supervisor, workflow_id="ignored", iteration=0, is_factory=False)

        assert supervisor.calls == ["What is 2 + 2?"]
        assert results["accuracy"] == 1.0
        assert results["correct_answers"] == 1
        assert results["wrong_answers"] == 0
        assert results["detailed_results"][0]["chat"].strip() == "User to MainSupervisor: What is 2 + 2?\n\nMainSupervisor to User : 4"
    finally:
        shutil.rmtree(root, ignore_errors=True)
