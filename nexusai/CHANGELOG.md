# Changelog

All notable changes to NexusAI are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] — 2025-01-28

### 🚀 Production Deploy (Week 4)

#### Added
- Real-time analytics dashboard with WebSocket (Redis pub/sub → browser)
- `QueryVolumeChart` (Recharts AreaChart) and `DocumentHeatmap` (BarChart) components
- `LiveEventFeed` showing last 100 workspace events in real time
- `useAnalyticsSocket` hook for auto-reconnecting WebSocket subscription
- Redis sliding-window rate limiter (`app/core/rate_limit.py`) with per-route tiers
  - Chat: 60 req/min · Upload: 20 req/min · Agents: 10 req/min
- HTTP 429 response with `Retry-After` header; frontend toast countdown
- Structured JSON logging via structlog with `request_id` binding on every request
- Sentry error tracking for FastAPI + Celery + Next.js (`app/core/sentry.py`)
- LangSmith tracing integration (`LANGCHAIN_TRACING_V2`)
- `GET /health/detailed` endpoint reporting DB, Redis, and model status
- Multi-stage production Dockerfiles for backend and frontend
- GitHub Actions CI pipeline: ruff + mypy + pytest (≥80% coverage gate) + Docker build
- GitHub Actions CD pipeline: GHCR push + Railway deploy + Vercel deploy on `v*` tags
- Supabase PostgreSQL, Upstash Redis, Cloudflare R2, Railway, Vercel deployment configs
- Locust load-test suite (`tests/locustfile.py`) with Chat, Analytics, Upload user classes
- Playwright E2E test suite covering auth flows and all dashboard pages
- `infra/setup_ssl.sh` for Let's Encrypt cert provisioning + auto-renewal cron
- `.env.production.example` with all production environment variables documented
- `Makefile` with dev, test, lint, migrate, release targets

#### Fixed
- `Document.uploaded_by` FK changed from `SET DEFAULT` to `SET NULL` (correct PostgreSQL semantics)
- `Workspace.members` relationship `foreign_keys` now uses column object, not string
- `AnalyticsService.get_document_usage()` now correctly queries `ChatMessage.source_chunks` JSON for real hit counts
- `models/__init__.py` now imports all models so Alembic autogenerate detects every table

---

## [0.3.0] — 2025-01-21

### 🤖 Multi-Agent LangGraph System (Week 3)

#### Added
- `AgentState` TypedDict with 14 keys as shared LangGraph state schema
- LangGraph `StateGraph` with 5 nodes: Orchestrator → Retriever → Analyst → Critic → Writer
- Conditional edge `route_after_critic()`: loops Analyst on `verdict=fail` (max 2 retries)
- `orchestrator_node`: decomposes task into 1–3 targeted sub-queries via Claude JSON output
- `retriever_node`: fan-out multi-query search, dedup by chunk_id, top-8 re-rank by score
- `analyst_node`: cited draft in `{"answer", "citations"}` JSON, accepts `critic_issues` feedback
- `critic_node`: confidence score 0–1, issues list, `pass`/`fail` verdict via Claude
- `writer_node`: final Markdown with Sources section and `formatted_citations` list
- `app/workers/agent_run.py` Celery task dispatching graph via `asyncio.run()`
- `app/workers/reindex.py` task for re-embedding all workspace chunks
- `POST /api/agents/run` — enqueue agent task, returns `run_id`
- `GET /api/agents/runs/{id}/status` and `/result` backed by Redis job store
- Agent run panel frontend page with status badges and ConfidenceGauge component
- Jinja2 prompt templates for Analyst and Critic nodes (`app/ai/prompts/`)

#### Improved
- `app/ai/prompts/rag_system.jinja2` replaces hardcoded string in `rag.py`
- Critic confidence threshold configurable via `CONFIDENCE_THRESHOLD = 0.70`

---

## [0.2.0] — 2025-01-14

### ⚡ RAG Pipeline & Document Ingestion (Week 2)

#### Added
- MinIO/S3-compatible `StorageClient` (`app/utils/storage.py`) with upload, download, delete, presigned URL
- `POST /api/documents/upload` — MIME validation, MinIO upload, DB record, Celery task
- `app/workers/ingestion.py` — full ingestion pipeline: download → parse → chunk → embed → pgvector
- PyMuPDF PDF text extraction and python-docx DOCX parsing
- `chunk_by_sentence()` with configurable max_tokens and sentence overlap
- `chunk_by_tokens()` sliding-window fallback
- `all-MiniLM-L6-v2` embedding via sentence-transformers with `@lru_cache` model singleton
- `app/ai/retrieval.py` — hybrid BM25 + vector retrieval with RRF fusion
- pgvector HNSW index (`m=16, ef_construction=64`) for ANN cosine search
- Full-text GIN index on `document_chunks.content` for BM25 (migration 002)
- `rag_pipeline()` async generator: embed → hybrid_retrieve → build_context → Claude SSE stream
- `chat_service.stream_query()` — loads history, runs RAG, persists messages, publishes analytics
- `POST /api/chat/query` SSE endpoint: `token` → `source` → `done` events
- `POST /api/chat/sessions`, `GET /api/chat/history/{id}`, `GET /api/chat/sessions`
- Real-time SSE ingestion progress via Redis pub/sub (`ingestion:{doc_id}` channel)
- UploadDropzone component with 6-stage progress bar
- ChatWindow, MessageBubble (citation tooltips), ChatInput components
- `useChatStream` hook for streaming token rendering

#### Security
- `app/core/file_validation.py` — python-magic MIME detection (not header-based), 50 MB limit

---

## [0.1.0] — 2025-01-07

### 🏗 Foundation (Week 1)

#### Added
- FastAPI application factory with lifespan, CORS, GZip middleware
- PostgreSQL 16 + pgvector schema: users, workspaces, documents, document_chunks, chat_sessions, chat_messages
- SQLAlchemy 2 async ORM models with typed `Mapped[]` columns
- Alembic async migrations (`alembic/env.py` with `create_async_engine`)
- `POST /api/auth/register` — bcrypt password hashing, JWT access + refresh tokens
- `POST /api/auth/login` — credential verification, token pair
- `POST /api/auth/refresh` — **rotated** refresh tokens (old token revoked in Redis)
- `GET /api/auth/me` — current user profile
- `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (1-hour token)
- Google OAuth 2.0 login and callback endpoints
- RBAC: `user` / `admin` roles with `get_current_admin` dependency guard
- Workspace CRUD: create, list, invite user, list members
- `app/core/redis.py` — async Redis client with pub/sub and job-status helpers
- `app/utils/logging.py` — structlog JSON logging with `get_logger()`
- `app/utils/pagination.py` — generic `PaginatedResponse[T]` with offset pagination
- Docker Compose: 8 services (postgres, redis, minio, backend, celery, celery-beat, frontend, nginx)
- Next.js 14 App Router skeleton with login/signup pages, Zustand auth store, route middleware
- Full pytest suite with async SQLite fixtures (no real DB required in CI)

---

[1.0.0]: https://github.com/yourorg/nexusai/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/yourorg/nexusai/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yourorg/nexusai/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourorg/nexusai/releases/tag/v0.1.0
