"""
Research Planner

Plans and coordinates multi-step research tasks, breaking complex queries
into structured sub-tasks with dependencies.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ResearchTask:
    """A single research sub-task"""

    def __init__(self, task_id: str, description: str, dependencies: Optional[List[str]] = None):
        self.task_id = task_id
        self.description = description
        self.dependencies = dependencies or []
        self.status = "pending"
        self.result: Optional[str] = None
        self.created_at = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "description": self.description,
            "dependencies": self.dependencies,
            "status": self.status,
            "result": self.result,
            "created_at": self.created_at,
        }


class ResearchPlanner:
    """Plans hierarchical research workflows"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.plans: Dict[str, List[ResearchTask]] = {}

    async def create_plan(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a research plan for the given query"""
        plan_id = f"plan_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        tasks = self._decompose_query(query)
        self.plans[plan_id] = tasks

        return {
            "plan_id": plan_id,
            "query": query,
            "tasks": [t.to_dict() for t in tasks],
            "total_tasks": len(tasks),
            "estimated_steps": len(tasks),
            "created_at": datetime.now().isoformat(),
        }

    def _decompose_query(self, query: str) -> List[ResearchTask]:
        """Decompose a complex query into ordered research tasks"""
        tasks = [
            ResearchTask("t1", f"Background research: {query}"),
            ResearchTask("t2", "Identify key concepts and terminology", dependencies=["t1"]),
            ResearchTask("t3", "Gather primary sources and evidence", dependencies=["t1"]),
            ResearchTask("t4", "Analyse and synthesise findings", dependencies=["t2", "t3"]),
            ResearchTask("t5", "Generate final research report", dependencies=["t4"]),
        ]
        return tasks

    def get_plan(self, plan_id: str) -> Optional[List[ResearchTask]]:
        """Retrieve a research plan by ID"""
        return self.plans.get(plan_id)

    def update_task_status(self, plan_id: str, task_id: str, status: str, result: Optional[str] = None):
        """Update the status of a task within a plan"""
        tasks = self.plans.get(plan_id, [])
        for task in tasks:
            if task.task_id == task_id:
                task.status = status
                if result:
                    task.result = result
                break
