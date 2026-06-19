# NexusAI

An enterprise-grade, multi-agent RAG (Retrieval-Augmented Generation) platform. Upload documents, ask questions in natural language, and get answers backed by cited sources — powered by a team of collaborating AI agents.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![Next.js](https://img.shields.io/badge/next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)

---

## What it does

NexusAI lets teams build a searchable knowledge base from their documents. You upload PDFs, Word files, CSVs, or plain text. NexusAI chunks and embeds them into MongoDB. When you ask a question, a pipeline of five AI agents collaborates to find the most relevant passages, synthesise an answer, verify it against the source material, and return it with numbered citations you can click to inspect.

If you arrived here from the Streamlit/Groq/AstraDB reference project, start with
[`docs/index.md`](docs/index.md). That index points to the reference crosswalk
and the onboarding guide for this repository’s actual Next.js + FastAPI implementation.

**Core capabilities:**

- **Hybrid retrieval** — MongoDB Atlas Vector Search in production, with local cosine fallback for development and test environments.
- **Multi-agent pipeline** — Orchestrator → Retriever → Analyst → Critic → Writer. The Critic scores each claim for groundedness and loops back to the Analyst if confidence is below threshold.
- **Streaming responses** — tokens stream to the browser via Server-Sent Events as the LLM generates them. No waiting for the full response.
- **Workspace isolation** — documents, chat history, and embeddings are scoped to a workspace. Different teams see only their own knowledge.
- **Real-time analytics** — query volume, document usage heatmaps, and agent performance metrics pushed over WebSocket.

---

## Quickstart

**Prerequisites:** Docker Desktop (or Docker Engine + Compose), Git, Make.

This repository does **not** use `streamlit run app.py`.

```bash
# 1. Enter your local clone of the repo
cd nexusai

# 2. Configure environment
cp backend/.env.example backend/.env
# Open backend/.env and set the provider keys you want to use.
# Local Mongo, Redis, and MinIO defaults already match docker-compose.

# 3. Start everything
docker compose up -d
# or use: make dev
```

That’s it. Docker starts MongoDB, Redis, MinIO, the FastAPI backend, Celery, and the Next.js frontend automatically.

| Service      | URL                                          |
|--------------|----------------------------------------------|
| Frontend     | http://localhost:3000                        |
| API docs     | http://localhost:8000/docs                   |
| MinIO console| http://localhost:9001  (`minioadmin` / `minioadmin`) |

Seed demo users and workspaces:

```bash
make db-seed
```

---

## Local MongoDB Setup

### A. Docker MongoDB

Start only the local MongoDB service:

```bash
docker compose up -d mongodb
```

Use this in `backend/.env` when your backend runs on the host machine:

```env
MONGODB_URI=mongodb://nexusai:secret@localhost:27018/?authSource=admin
MONGODB_DB_NAME=nexusai
USE_MONGO_MOCK=false
ALLOW_LOCAL_VECTOR_FALLBACK=true
ATLAS_VECTOR_SEARCH_INDEX=
```

Docker exposes MongoDB on `localhost:27018` to avoid conflicts with any MongoDB
already installed on Windows at `localhost:27017`. When the backend runs inside
Docker Compose, the root `docker-compose.yml` overrides `MONGODB_URI` to use the
internal Docker hostname `mongodb`.

### B. Local MongoDB Without Auth

Use this only if your local MongoDB has no username or password:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nexusai
USE_MONGO_MOCK=false
ALLOW_LOCAL_VECTOR_FALLBACK=true
ATLAS_VECTOR_SEARCH_INDEX=
```

### C. Common MongoDB Errors

- `ECONNREFUSED localhost:27018` means Docker MongoDB is not running or the port is not exposed.
- `Authentication failed` on `localhost:27017` usually means you are hitting a different local MongoDB, not the Docker one.
- `Authentication failed` means the username, password, or `authSource` does not match your MongoDB setup.
- If the app is still using mock data, check that `USE_MONGO_MOCK=false` in non-test environments.
- `ATLAS_VECTOR_SEARCH_INDEX` can stay empty for local development when `ALLOW_LOCAL_VECTOR_FALLBACK=true`.
- MongoDB Atlas Vector Search requires MongoDB Atlas; normal local MongoDB uses the local cosine fallback.

---

## Billing Setup

Billing uses Stripe Checkout. Paid-plan upgrades are blocked until Stripe is configured; the app will not silently upgrade a workspace with mock billing.

Add these values to `backend/.env` for real checkout:

```env
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
```

When these values are empty, `/api/billing/checkout` returns a clear setup error and invoices remain empty.

---

## Architecture

```
Browser
  │
  ├── GET /               → Next.js 14 (App Router, SSR)
  ├── POST /api/chat/query → FastAPI (streaming SSE)
  ├── WS  /api/analytics/ws → FastAPI (WebSocket)
  └── POST /api/documents/upload → FastAPI → Celery → MongoDB chunks

FastAPI (backend:8000)
  ├── api/auth.py          JWT register / login / refresh
  ├── api/documents.py     Upload, list, delete, re-ingest
  ├── api/chat.py          Streaming RAG query, session history
  ├── api/agents.py        LangGraph agent run management
  ├── api/analytics.py     Metrics + live WebSocket feed
  └── api/workspaces.py    Workspace CRUD + invite

AI Core
  ├── ai/retrieval.py      Workspace-scoped vector retrieval
  ├── ai/rag.py            Full pipeline: embed → retrieve → LLM → stream
  ├── ai/embeddings.py     sentence-transformers (all-MiniLM-L6-v2)
  ├── ai/chunker.py        Sentence-boundary chunking with overlap
  └── ai/agents/
      ├── graph.py         LangGraph StateGraph
      ├── orchestrator.py  Decomposes query
      ├── retriever.py     Calls hybrid search
      ├── analyst.py       Synthesises answer draft
      ├── critic.py        Scores groundedness, loops if < 0.7
      └── writer.py        Formats final Markdown with citations

Celery Workers
  ├── ingestion.py         PDF/DOCX/TXT → chunks → embeddings → MongoDB
  ├── agent_run.py         Async LangGraph execution + Redis pub/sub
  └── reindex.py           Batch re-embed workspace on model change

Data layer
  ├── MongoDB              Documents, chunks, chat history, agent runs
  ├── Redis 7              Celery broker, cache, pub/sub events
  └── MinIO                Raw document object storage (S3-compatible)
```

### RAG pipeline — request lifecycle

```
User question
  │
  ▼
embed_query()          ← all-MiniLM-L6-v2 (384 dim)
  │
  └── vector_search()  ← Atlas Vector Search or local cosine fallback
       │
       ▼
  top-5 chunks + question
       │
       ▼
  OpenAI-compatible model
       │
       ▼
  SSE token stream ──→ Browser (token by token)
       │
       ▼
  Chat history saved to MongoDB
```

### Multi-agent pipeline (when `use_agents: true`)

```
Orchestrator
  └── decomposes question into sub-tasks
        │
        ▼
  Retriever  ←─────────────────────┐
  └── hybrid_retrieve()            │  loop if
        │                          │  confidence < 0.7
        ▼                          │
  Analyst                          │
  └── synthesises draft + citations│
        │                          │
        ▼                          │
  Critic ─── confidence ≥ 0.7 ─────┘
  └── scores each claim 0–1
        │ confidence ≥ 0.7
        ▼
  Writer
  └── formats Markdown + citation links
        │
        ▼
  Final answer
```

---

## Tech stack

### Backend (Python 3.11)

| Layer | Technology |
|---|---|
| API framework | FastAPI 0.111 + uvicorn |
| AI orchestration | LangChain 0.2 + LangGraph 0.1 |
| LLM | OpenAI-compatible providers (NVIDIA / OpenAI / Mistral / Gemini) |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 |
| Vector search | MongoDB Atlas Vector Search or local fallback |
| Keyword search | Metadata + local chunk scoring |
| Data access | Motor + pymongo |
| Task queue | Celery 5.4 + Redis 7 |
| Object storage | MinIO (aiobotocore async client) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 + python-magic |
| Observability | structlog (JSON in prod, colour in dev) |

### Frontend (TypeScript)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS + @tailwindcss/typography |
| State | Zustand 4 (client) + TanStack Query 5 (server) |
| Streaming | fetch() + ReadableStream (SSE), native WebSocket |
| Charts | Recharts + D3 |
| Markdown | react-markdown + react-syntax-highlighter |
| Testing | Vitest (unit) + Playwright (E2E) |

### Infrastructure

| Component | Technology |
|---|---|
| Database | MongoDB 7 |
| Cache / broker | Redis 7 |
| Object storage | MinIO (S3-compatible) |
| Reverse proxy | nginx 1.27 (SSL termination, rate limiting) |
| Containers | Docker Compose |
| CI/CD | GitHub Actions |
| Backend deploy | Railway |
| Frontend deploy | Vercel |

---

## Project structure

```
nexusai/
├── backend/
│   ├── app/
│   │   ├── api/          Route handlers (auth, chat, documents, agents…)
│   │   ├── core/         Config, database, security, Redis, logging
│   │   ├── schemas/      Pydantic request/response schemas
│   │   ├── services/     Business logic (document, chat, workspace…)
│   │   ├── ai/           RAG pipeline, embeddings, chunker, agents
│   │   └── workers/      Celery tasks (ingestion, agent_run, reindex)
│   ├── tests/            pytest suite
│   ├── scripts/          MongoDB health check + demo seed scripts
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   └── src/
│       ├── app/          Next.js App Router pages
│       ├── components/   React components (chat, documents, charts, UI)
│       ├── hooks/        useChatStream, useAnalyticsSocket, useDocumentUpload
│       ├── store/        Zustand stores
│       ├── lib/          API client, utilities
│       └── types/        TypeScript interfaces
├── infra/
│   ├── nginx.conf        Production reverse proxy
│   ├── proxy_params      Shared upstream headers
│   └── setup_ssl.sh      One-time Let's Encrypt certificate setup
├── legacy/postgres/      Archived PostgreSQL / pgvector / Alembic files
├── docs/
│   ├── index.md        Docs entry point
│   ├── onboarding.md   Contributor-friendly “where to look first” guide
│   └── reference-crosswalk.md  Map from the Streamlit reference repo to this codebase
├── .github/workflows/
│   ├── ci.yml            Lint, type-check, test on every PR
│   └── cd.yml            Build + deploy on push to main
├── docker-compose.yml
└── Makefile
```

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`. Add one real LLM API key before you start the stack.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NVIDIA_API_KEY` | Recommended | — | NVIDIA-hosted OpenAI-compatible model key |
| `MONGODB_URI` | **Yes** | docker default | MongoDB connection string |
| `REDIS_URL` | No | local redis | Redis connection string |
| `SECRET_KEY` | No* | `change-me…` | JWT signing secret (*required in prod) |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | sentence-transformers model name |
| `LLM_MODEL` | No | `deepseek-ai/deepseek-v4-pro` | OpenAI-compatible model ID |
| `RAG_TOP_K` | No | `5` | Chunks retrieved per query |
| `MINIO_ENDPOINT` | No | `minio:9000` in Docker | MinIO / S3 endpoint |
| `MINIO_ACCESS_KEY` | No | `minioadmin` | Object storage access key |
| `MINIO_SECRET_KEY` | No | `minioadmin` | Object storage secret key |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth (optional) |
| `ENVIRONMENT` | No | `development` | `development` \| `staging` \| `production` |

---

## Make commands

```
make dev              Start the full dev stack
make down             Stop all containers
make logs             Tail all logs  (make logs svc=backend for one service)
make db-reset         Drop + recreate Mongo database (destructive)
make db-seed          Seed demo workspace and users into MongoDB
make test             Run all tests (backend + frontend)
make test-be          Backend pytest suite
make test-cov         Backend tests with HTML coverage report
make test-e2e         Playwright end-to-end tests
make lint             Lint backend (ruff) + frontend (eslint)
make fmt              Auto-format backend (ruff) + frontend
make be-shell         Shell into the backend container
make worker-logs      Tail Celery worker + beat logs
make celery-purge     Purge all queued tasks
make open             Open frontend, API docs, MinIO in browser
make prod             Start production stack (with nginx)
make ssl-setup        One-time Let's Encrypt certificate setup
make clean            Remove build artifacts and caches
make nuke             Remove all containers, images, and volumes
```

---

## Development workflow

**After cloning for the first time:**

```bash
cp backend/.env.example backend/.env   # add one LLM API key
make dev                               # start the stack
make db-seed                           # seed demo data
make open                              # open in browser
```

**After pulling changes that affect backend collections or indexes:**

```bash
git pull
make restart svc=backend
```

**Running tests during development:**

```bash
make test-one f=tests/test_auth.py     # single file, fast feedback
make test-cov                          # full suite with coverage
make test-e2e                          # end-to-end (stack must be running)
```

**MongoDB indexes are created automatically on backend startup.**

---

## Production deployment

**First deploy (one-time):**

```bash
# 1. SSH into your server and enter your deployment checkout
cd nexusai

# 2. Set production environment variables
cp backend/.env.example backend/.env
# Set: one LLM API key, SECRET_KEY, MONGODB_URI, REDIS_URL

# 3. Update your domain in infra/nginx.conf
sed -i 's/nexusai.example.com/yourdomain.com/g' infra/nginx.conf

# 4. Get SSL certificate
make ssl-setup domain=yourdomain.com email=admin@yourdomain.com

# 5. Start the production stack
make prod
```

**Subsequent deploys** are handled automatically by the CD pipeline on every push to `main`.

**Certificate renewal** (add to cron on your server):

```bash
0 3 * * * cd /opt/nexusai && make ssl-renew
```

---

## API reference

Full interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

**Core endpoints:**

```
POST /api/auth/register       Create account
POST /api/auth/login          Get JWT tokens
POST /api/auth/refresh        Rotate access token

POST /api/documents/upload    Upload a document (multipart/form-data)
GET  /api/documents/          List workspace documents
POST /api/documents/{id}/reingest  Re-process a document (clears stale chunks)
DELETE /api/documents/{id}    Delete document + embeddings

POST /api/chat/query          Stream a RAG response (SSE)
GET  /api/chat/sessions       List conversation history

POST /api/agents/run          Start a multi-agent run
GET  /api/agents/runs/{id}/status  Poll run status
GET  /api/agents/runs/{id}/result  Get completed output

GET  /api/analytics/queries   Query volume over time
WS   /api/analytics/ws        Live analytics event stream
```

---

## File upload limits

| Property | Limit |
|---|---|
| Maximum file size | 50 MB |
| Accepted formats | PDF, DOCX, DOC, TXT, CSV, XLSX, Markdown |
| MIME validation | Content checked via file magic bytes, not the `Content-Type` header |

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Run `make dev` to start the stack
3. Make changes — the backend and frontend both hot-reload
4. Write or update tests: `make test`
5. Lint before committing: `make lint`
6. Open a pull request — CI runs automatically

---

## Licence

MIT — see [LICENSE](LICENSE).
