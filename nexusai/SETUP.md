# NexusAI — Quick Start Guide

This guide is for the current `Next.js + FastAPI` NexusAI repo. If you are
coming from the Streamlit/Groq/AstraDB reference project, start with
[`docs/index.md`](docs/index.md) first.

## Prerequisites
| Tool | Min version | Install |
|---|---|---|
| Docker Desktop | 24+ | https://docker.com |
| Python | 3.11+ | https://python.org |
| Node.js | 20+ | https://nodejs.org |
| Git | 2.x | https://git-scm.com |

---

## 1. Clone & Configure

```bash
git clone <repo-url> nexusai
cd nexusai
cp backend/.env.example backend/.env
```

Minimum required manual input:
```
SECRET_KEY=your-long-random-secret
NVIDIA_API_KEY=your_real_key
```

MongoDB, Redis, and MinIO values are already set for local Docker in `backend/.env.example`.
The example uses `localhost` for host-side tools, while Docker Compose overrides service hostnames internally.

---

## 2. Start All Services (Docker)

```bash
docker compose up -d
# or use: make dev
# Starts: MongoDB, Redis, MinIO, FastAPI, Celery, Next.js
```

Wait ~60 seconds for first startup (embeddings model downloads).

| URL | Service |
|---|---|
| http://localhost:3000 | Next.js frontend |
| http://localhost:8000/docs | FastAPI Swagger UI |
| http://localhost:9001 | MinIO console (minioadmin / minioadmin) |

---

## 3. Backend Tests

```bash
cd backend
.\.venv\Scripts\pytest tests -q
```

---

## 4. Run Frontend Tests

```bash
cd frontend
npm install
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E (requires make dev running)
```

---

## 6. VS Code Development (without Docker)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload    # or use F5 in VS Code → "FastAPI (uvicorn)"
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### External services needed locally:
- None if you use Docker Compose.
- If you run only MongoDB in Docker and run the backend directly on Windows, keep `MONGODB_URI` pointed at `localhost`.

---

## 7. Production Deploy

```bash
make release VERSION=1.0.0
# Pushes git tag → triggers GitHub Actions CI/CD
# → Deploys to Railway (API) + Vercel (frontend) automatically
```

See `.env.production.example` for all production environment variables.

For a feature-by-feature map between the Streamlit reference project and this
repo’s current routes/pages, see `docs/reference-crosswalk.md`.

---

## Project Structure

```
nexusai/
├── backend/          FastAPI + LangGraph + Celery
├── frontend/         Next.js 14 App Router
├── infra/            Docker Compose, Nginx, SSL scripts
├── legacy/           Archived PostgreSQL / Alembic / pgvector files
├── docs/              Docs index, onboarding, and reference crosswalk
├── tests/e2e/        Playwright end-to-end tests
├── .github/          CI/CD workflows
├── .vscode/          VS Code settings + launch configs
├── Makefile          All dev commands
├── README.md         Full architecture docs
└── SETUP.md          This file
```
