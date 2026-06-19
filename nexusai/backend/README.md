# NexusAI Backend

**Multi-Agent RAG Platform** — FastAPI · MongoDB · LangGraph · Celery · MinIO

---

## Environment Setup

### Development (local — runs fully with Docker)

1. From the repo root, copy the backend env file:
   cp backend/.env.example backend/.env

2. Open `backend/.env` and set one OpenAI-compatible provider:
   LLM_PROVIDER=nvidia
   NVIDIA_API_KEY=your_key_from_nvidia
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   # or use OPENAI_API_KEY / MISTRAL_API_KEY / GEMINI_API_KEY with the matching base URL
   # backend/.env uses localhost for host-side checks; Compose overrides container hostnames.

3. Start everything from the repo root:
   docker compose up -d
   # or: make dev

App runs at http://localhost:3000

### Production (all free services, no credit card needed)

Sign up for these free services in order:

1. MongoDB Atlas — https://www.mongodb.com/atlas
   → Create a cluster → copy the MongoDB connection string

2. Upstash (Redis)    — https://upstash.com  
   → Create Database → Details tab → copy REDIS_TLS_URL

3. Cloudflare R2 (Storage) — https://cloudflare.com
   → R2 → Create bucket "nexusai-documents"
   → Manage R2 API Tokens → Create Token → copy 3 values

4. Resend (Email)     — https://resend.com
   → API Keys → Create API Key → copy key

5. Generate SECRET_KEY:
   python generate_secret.py

6. Fill in backend/.env.production with all values above

7. Deploy backend to Railway: https://railway.app
   Deploy frontend to Vercel: https://vercel.com
   (Both free with GitHub login)

## Architecture

```
Client ──► Nginx ──► FastAPI ──► ChatService ──► RAG Pipeline ──► OpenAI-compatible LLM (SSE stream)
                        │                             │
                        │                      Hybrid Retrieval
                        │                    MongoDB vector search / cosine fallback
                        │
                    Celery ──► ingestion.py ──► chunk → embed → MongoDB
                           └─► agent_run.py ──► LangGraph 5-node graph
```

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI 0.115, Uvicorn |
| Data access | Motor / MongoDB repositories |
| Data layer | MongoDB + Motor |
| Vector search | MongoDB Atlas Vector Search or local cosine fallback |
| Cache / Broker | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| LLM | OpenAI-compatible providers (NVIDIA / OpenAI / Mistral / Gemini) |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 (384-dim) |
| Retrieval | Atlas Vector Search or local cosine fallback |
| Agent Graph | LangGraph (Orchestrator→Retriever→Analyst→Critic→Writer) |
| Task Queue | Celery 5 |
| Startup schema | MongoDB collection indexes at startup |
| Auth | JWT (python-jose) + bcrypt + Google OAuth + refresh rotation |
| Rate Limiting | Redis sliding-window per user/IP |
| Observability | structlog + Sentry + LangSmith tracing |

## Quick Start (backend-only workflow)

```bash
# 1. Install
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 2. Configure
cp .env.example .env          # fill in LLM_PROVIDER and the matching API key

# 3. Start infrastructure
make infra                    # MongoDB + Redis + MinIO

# 4. API (port 8000)
make dev

# 5. Worker (second terminal)
make worker
```

## Docker (full stack)

```bash
cd ..
cp backend/.env.example backend/.env
docker compose up -d          # full local stack from the repo root
```

## Makefile commands

| Command | Description |
|---|---|
| `make install` | Install Python deps |
| `make dev` | FastAPI hot-reload server |
| `make worker` | Celery worker |
| `make infra` | Start Docker services |
| `make migrate` | Legacy placeholder only — MongoDB indexes are created at startup |
| `make test` | Full test suite with coverage |
| `make lint` | Ruff lint |
| `make format` | Ruff auto-fix |

## API Reference

### Auth
`POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh`
`GET /api/auth/me` · `POST /api/auth/forgot-password`
`POST /api/auth/reset-password` · `GET /api/auth/google/login`

### Documents
`POST /api/documents/upload` (50 MB max, PDF/DOCX/TXT/CSV)
`GET /api/documents/` · `GET /api/documents/{id}/progress`
`GET /api/documents/{id}/progress` (SSE) · `POST /api/documents/{id}/reindex`
`DELETE /api/documents/{id}`

### Chat
`POST /api/chat/sessions` · `GET /api/chat/sessions`
`POST /api/chat/query` (SSE streaming) · `GET /api/chat/sessions/{session_id}`
`PATCH /api/chat/sessions/{id}` · `DELETE /api/chat/sessions/{id}`

### Agents
`POST /api/agents/run` · `GET /api/agents/runs`
`GET /api/agents/runs/{id}/status` · `GET /api/agents/runs/{id}/result`
`DELETE /api/agents/runs/{id}` (cancel)

### Analytics
`GET /api/analytics/queries` · `GET /api/analytics/documents/usage`
`WS /api/analytics/ws` (live WebSocket)

### Workspaces
`POST /api/workspaces/` · `GET /api/workspaces/` · `DELETE /api/workspaces/{id}`
`POST /api/workspaces/{id}/invite` · `GET /api/workspaces/{id}/members`

## RAG Pipeline

```
Question
   │
   ├─► embed_query()              ← all-MiniLM-L6-v2 (384-dim)
   │
   ├─► MongoDB Atlas Vector Search
   ├─► local cosine fallback (if enabled)
   │
   ├─► build_context()           ← numbered [1]..[k] context block
   │
   └─► stream_rag_response()     ← OpenAI-compatible streaming API → SSE tokens
```

## LangGraph Agent Pipeline

```
orchestrator → retriever → analyst ──► critic
                                          │
                          confidence ≥ 0.7 ──► writer → DONE
                          confidence < 0.7  ──► analyst (max 2 retries)
```

## Tests

```bash
make test
# Current backend tests use Mongo mocks and stub external services
```
