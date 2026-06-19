.PHONY: help install dev infra stop migrate test lint format clean

help:
	@echo ""
	@echo "  NexusAI Backend — available commands"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  make install   Install Python dependencies"
	@echo "  make dev       Start FastAPI dev server (port 8000)"
	@echo "  make worker    Start Celery worker"
	@echo "  make infra     Start Docker services (mongodb, redis, minio)"
	@echo "  make stop      Stop Docker services"
	@echo "  make migrate   Legacy placeholder; MongoDB creates indexes at startup"
	@echo "  make revision  Legacy placeholder"
	@echo "  make test      Run test suite"
	@echo "  make lint      Ruff lint check"
	@echo "  make format    Ruff auto-fix"
	@echo "  make clean     Remove __pycache__ and .pyc files"
	@echo ""

install:
	pip install -e ".[dev]"

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

worker:
	celery -A app.workers.celery_app.celery_app worker -l info -c 2

infra:
	docker compose up -d mongodb redis minio

stop:
	docker compose down

migrate:
	@echo "MongoDB uses startup index creation; no Alembic migration step."

revision:
	@echo "Legacy placeholder. MongoDB schema is defined in code."

test:
	pytest -v --tb=short --cov=app --cov-report=term-missing

lint:
	ruff check app tests

format:
	ruff check --fix app tests && ruff format app tests

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
