# ══════════════════════════════════════════════════════════════════════════════
# NexusAI — developer Makefile
#
# Usage:  make <target>
#         make help          list all targets with descriptions
#
# Conventions:
#   - Targets that talk to Docker are prefixed by what they affect (db-, fe-, etc.)
#   - Targets that run inside the backend venv assume: source backend/.venv/bin/activate
#   - All targets are PHONY (no output files) unless noted otherwise
# ══════════════════════════════════════════════════════════════════════════════

# ── Configuration ──────────────────────────────────────────────────────────────
SHELL := /bin/bash
.DEFAULT_GOAL := help

# Detect OS for open-browser command
UNAME := $(shell uname -s)
ifeq ($(UNAME), Darwin)
  OPEN := open
else
  OPEN := xdg-open
endif

# Python interpreter — use the venv if it exists, else system python
PYTHON := $(shell [ -f backend/.venv/bin/python ] && echo backend/.venv/bin/python || echo python3)
PIP    := $(PYTHON) -m pip

# Docker Compose shorthand
DC      := docker compose
DC_PROD := docker compose --profile prod

# Colours for help output
BOLD  := \033[1m
RESET := \033[0m
CYAN  := \033[36m
GREEN := \033[32m
DIM   := \033[2m

# ── Phony declarations ─────────────────────────────────────────────────────────
.PHONY: help \
        dev down restart logs \
        be-install be-shell be-check \
        fe-install fe-dev fe-build fe-shell \
        db-migrate db-rollback db-reset db-shell db-seed migrate \
        test test-be test-fe test-e2e test-cov \
        lint lint-be lint-fe fmt fmt-be fmt-fe \
        worker worker-logs celery-purge \
        prod prod-down prod-logs \
        ssl-setup \
        open docs \
        clean nuke


# ══════════════════════════════════════════════════════════════════════════════
# HELP
# ══════════════════════════════════════════════════════════════════════════════

## Print this help message
help:
	@printf "\n$(BOLD)NexusAI — developer commands$(RESET)\n\n"
	@awk 'BEGIN {FS = ":.*##"; section=""} \
	  /^## ─/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0,4); next } \
	  /^## /  { desc=substr($$0,4); next } \
	  /^[a-zA-Z_-]+:/ { \
	    if (desc != "") { printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, desc; desc="" } \
	  }' $(MAKEFILE_LIST)
	@printf "\n"


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Local dev stack ───────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Start the full dev stack (db, redis, minio, backend, worker, frontend)
dev:
	@printf "$(GREEN)▶ Starting NexusAI dev stack...$(RESET)\n"
	$(DC) up -d
	@printf "\n$(GREEN)✓ Stack is up$(RESET)\n"
	@printf "  Frontend  → $(CYAN)http://localhost:3000$(RESET)\n"
	@printf "  API docs  → $(CYAN)http://localhost:8000/docs$(RESET)\n"
	@printf "  MinIO UI  → $(CYAN)http://localhost:9001$(RESET)  (minioadmin / minioadmin)\n\n"

## Stop all dev containers
down:
	$(DC) down

## Restart a specific service  (usage: make restart svc=backend)
restart:
	$(DC) restart $(svc)

## Tail logs from all services  (usage: make logs  or  make logs svc=backend)
logs:
	$(DC) logs -f $(svc)

## Rebuild images from scratch (no cache) and restart
rebuild:
	$(DC) build --no-cache
	$(DC) up -d


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Backend (Python) ──────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Create venv and install all Python deps (including dev extras)
be-install:
	@printf "$(GREEN)▶ Setting up Python environment...$(RESET)\n"
	python3 -m venv backend/.venv
	backend/.venv/bin/pip install --upgrade pip
	backend/.venv/bin/pip install -e "backend/.[dev]"
	@printf "$(GREEN)✓ Done. Activate with: source backend/.venv/bin/activate$(RESET)\n"

## Open a shell inside the running backend container
be-shell:
	$(DC) exec backend bash

## Run ruff + mypy against backend source (no fixes applied)
be-check:
	@printf "$(GREEN)▶ Linting backend...$(RESET)\n"
	$(DC) exec backend ruff check app/
	@printf "$(GREEN)▶ Type-checking backend...$(RESET)\n"
	$(DC) exec backend mypy app/ --ignore-missing-imports


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Frontend (TypeScript) ─────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Install frontend npm dependencies
fe-install:
	cd frontend && npm ci --frozen-lockfile

## Start the Next.js dev server locally (outside Docker)
fe-dev:
	cd frontend && npm run dev

## Build the Next.js production bundle locally
fe-build:
	cd frontend && npm run build

## Open a shell inside the running frontend container
fe-shell:
	$(DC) exec frontend sh

## Run TypeScript type-check (no emit)
fe-check:
	cd frontend && npx tsc --noEmit


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Database & migrations ─────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Legacy SQL migration targets are retired in the MongoDB build.
db-migrate db-rollback db-status db-gen:
	@printf "$(BOLD)Legacy target:$(RESET) this repo now uses MongoDB indexes, not Alembic migrations.\n"

## MongoDB uses startup index creation; no SQL migrations required
migrate:
	@printf "MongoDB uses startup index creation; no SQL migrations required.\n"

## Drop and recreate the MongoDB database (destructive)
db-reset:
	@printf "$(BOLD)⚠ This will destroy all data. Continue? [y/N] $(RESET)" && read ans && [ "$${ans:-N}" = "y" ]
	$(DC) exec mongodb mongosh --username nexusai --password secret --authenticationDatabase admin --eval "db.getSiblingDB('nexusai').dropDatabase()"
	$(DC) restart backend worker beat
	@printf "$(GREEN)✓ Mongo database dropped. Restarted services so indexes can be recreated.$(RESET)\n"

## Open a Mongo shell against the dev database
db-shell:
	$(DC) exec mongodb mongosh --username nexusai --password secret --authenticationDatabase admin

## Seed demo users and workspaces into MongoDB
db-seed:
	$(DC) exec backend python scripts/seed_demo.py


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Tests ──────────────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Run all tests (backend + frontend unit)
test: test-be test-fe

## Run backend pytest suite
test-be:
	@printf "$(GREEN)▶ Running backend tests...$(RESET)\n"
	$(DC) exec backend pytest tests/ -v --tb=short

## Run backend tests with coverage report
test-cov:
	$(DC) exec backend pytest tests/ -v \
	  --cov=app \
	  --cov-report=term-missing \
	  --cov-report=html:htmlcov \
	  --cov-fail-under=70
	@printf "$(GREEN)✓ Coverage report: backend/htmlcov/index.html$(RESET)\n"

## Run frontend Vitest unit tests
test-fe:
	@printf "$(GREEN)▶ Running frontend unit tests...$(RESET)\n"
	cd frontend && npx vitest run

## Run Playwright end-to-end tests (requires dev stack running)
test-e2e:
	@printf "$(GREEN)▶ Running E2E tests...$(RESET)\n"
	cd frontend && npx playwright test

## Run a single backend test file  (usage: make test-one f=tests/test_auth.py)
test-one:
	@[ -n "$(f)" ] || (printf "$(BOLD)Error:$(RESET) provide a file — make test-one f=tests/test_auth.py\n" && exit 1)
	$(DC) exec backend pytest $(f) -v --tb=long -s


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Lint & format ──────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Lint both backend and frontend
lint: lint-be lint-fe

## Lint backend (ruff check — no auto-fix)
lint-be:
	$(DC) exec backend ruff check app/ tests/

## Lint frontend (eslint)
lint-fe:
	cd frontend && npm run lint

## Auto-format both backend and frontend
fmt: fmt-be fmt-fe

## Auto-format backend (ruff format + ruff check --fix)
fmt-be:
	$(DC) exec backend ruff format app/ tests/
	$(DC) exec backend ruff check --fix app/ tests/
	@printf "$(GREEN)✓ Backend formatted$(RESET)\n"

## Auto-format frontend (prettier via eslint --fix)
fmt-fe:
	cd frontend && npx eslint --fix src/
	@printf "$(GREEN)✓ Frontend formatted$(RESET)\n"


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Celery workers ─────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Show Celery worker status and registered tasks
worker:
	$(DC) exec worker celery -A app.workers.celery_app inspect active
	$(DC) exec worker celery -A app.workers.celery_app inspect registered

## Tail Celery worker logs
worker-logs:
	$(DC) logs -f worker beat

## Purge all pending tasks from every queue (use with care)
celery-purge:
	@printf "$(BOLD)⚠ This will delete all queued tasks. Continue? [y/N] $(RESET)" && read ans && [ "$${ans:-N}" = "y" ]
	$(DC) exec worker celery -A app.workers.celery_app purge -f
	@printf "$(GREEN)✓ All queues purged$(RESET)\n"

## Trigger a test ingestion task for a document  (usage: make ingest doc_id=<uuid> ws_id=<uuid>)
ingest:
	@[ -n "$(doc_id)" ] || (printf "$(BOLD)Error:$(RESET) provide doc_id and ws_id\n" && exit 1)
	$(DC) exec backend python -c "
from app.workers.ingestion import ingest_document_task
result = ingest_document_task.delay('$(doc_id)', 'uploads/$(doc_id)', '$(ws_id)')
print(f'Task enqueued: {result.id}')
"


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Production stack ───────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Start the production stack (includes nginx, uses prod Docker targets)
prod:
	@printf "$(GREEN)▶ Starting production stack...$(RESET)\n"
	$(DC_PROD) up -d
	@printf "$(GREEN)✓ Production stack up → https://nexusai.example.com$(RESET)\n"

## Stop the production stack
prod-down:
	$(DC_PROD) down

## Tail production logs (all services)
prod-logs:
	$(DC_PROD) logs -f

## Reload nginx config without downtime (e.g. after cert renewal)
nginx-reload:
	$(DC_PROD) exec nginx nginx -s reload
	@printf "$(GREEN)✓ nginx reloaded$(RESET)\n"

## Test nginx config validity without restarting
nginx-test:
	$(DC_PROD) exec nginx nginx -t


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── SSL & certificates ─────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## One-time SSL setup — generate DH params + get Let's Encrypt cert
## Usage: make ssl-setup domain=nexusai.example.com email=admin@example.com
ssl-setup:
	@[ -n "$(domain)" ] || (printf "$(BOLD)Error:$(RESET) provide domain and email — make ssl-setup domain=... email=...\n" && exit 1)
	bash infra/setup_ssl.sh $(domain) $(email)

## Renew Let's Encrypt certificate (run via cron: 0 3 * * * make ssl-renew)
ssl-renew:
	docker run --rm \
	  -v /etc/letsencrypt:/etc/letsencrypt \
	  -v certbot_webroot:/var/www/certbot \
	  certbot/certbot renew --quiet
	$(MAKE) nginx-reload


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Open in browser ────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Open frontend, API docs, and MinIO console in your browser
open:
	$(OPEN) http://localhost:3000
	$(OPEN) http://localhost:8000/docs
	$(OPEN) http://localhost:9001

## Open FastAPI Swagger UI
docs:
	$(OPEN) http://localhost:8000/docs

## Open the coverage report in your browser (run make test-cov first)
cov:
	$(OPEN) backend/htmlcov/index.html


# ══════════════════════════════════════════════════════════════════════════════
# ## ─── Cleanup ─────────────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

## Remove Python cache files and build artifacts
clean:
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find backend -type f -name "*.pyc" -delete 2>/dev/null; true
	rm -rf backend/.mypy_cache backend/.ruff_cache backend/htmlcov backend/.coverage
	rm -rf frontend/.next frontend/out
	@printf "$(GREEN)✓ Build artifacts removed$(RESET)\n"

## Stop all containers AND delete volumes — destroys all local data
nuke:
	@printf "$(BOLD)⚠  WARNING: This deletes ALL containers, images, and volumes.\n"
	@printf "   MongoDB data, MinIO uploads, and Redis cache will be lost.\n"
	@printf "   Continue? [y/N] $(RESET)" && read ans && [ "$${ans:-N}" = "y" ]
	$(DC) down -v --rmi local --remove-orphans
	docker volume prune -f
	@printf "$(GREEN)✓ Everything removed$(RESET)\n"
