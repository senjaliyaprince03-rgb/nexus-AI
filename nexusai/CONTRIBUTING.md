# Contributing to NexusAI

Thank you for your interest in contributing. This guide covers everything you need to go from zero to a merged pull request.

## Quick start

```bash
cd nexusai
cp backend/.env.example backend/.env
make dev                               # start full stack
make db-seed                           # seed demo data into MongoDB
```

The stack auto-reloads on file changes. Frontend at `http://localhost:3000`, API docs at `http://localhost:8000/docs`.

If you came from the Streamlit/Groq/AstraDB reference project, read
`docs/index.md`, `docs/reference-crosswalk.md`, and `docs/onboarding.md` first so you do not
follow the wrong setup flow.

## Project structure

```
nexusai/
├── backend/      FastAPI + Python — AI pipeline, API, Celery workers
├── frontend/     Next.js 14 — chat UI, documents, analytics
├── infra/        nginx and SSL scripts
├── legacy/       archived PostgreSQL / Alembic / pgvector files
└── Makefile      All developer shortcuts (run `make help`)
```

## Development workflow

### Backend changes

```bash
make be-shell                          # shell into backend container
# edit files — uvicorn reloads automatically

make lint-be                           # ruff check
make fmt-be                            # ruff format --fix
make test-be                           # pytest
make test-one f=tests/test_auth.py     # single file, fast feedback
make test-cov                          # full suite with coverage report
```

### Frontend changes

```bash
# Files hot-reload via Next.js dev server inside Docker
# Or run outside Docker:
cd frontend && npm run dev

make lint-fe                           # eslint
make fmt-fe                            # eslint --fix
make test-fe                           # vitest
make test-e2e                          # playwright (stack must be running)
```

### Database changes

```bash
# MongoDB indexes are created automatically at app startup.
# If you add a new collection or query pattern, update:
# - backend/app/core/mongo.py
# - backend/app/services/mongo_store.py
```

## Pull request checklist

Before opening a PR, ensure:

- [ ] `make lint` passes with zero errors
- [ ] `make test-be` passes with ≥ 70% coverage
- [ ] `make test-fe` passes
- [ ] Docs match the current repo stack (`make dev`, not `streamlit run app.py`)
- [ ] Reference-project comparisons are labeled as reference-only, not current requirements
- [ ] New features have corresponding tests
- [ ] New MongoDB collections or index changes are reflected in `backend/app/core/mongo.py`
- [ ] No real API keys or secrets in any file
- [ ] `make fmt` applied (no formatting diff)

## Code conventions

### Python (backend)
- **Async everywhere** — all DB and network calls use `async/await`
- **Thin routes** — route handlers call services; services hold logic
- **Structured logging** — use `structlog.get_logger(__name__)`, never `print()`
- **Type hints** — all function signatures annotated; `mypy` must pass

### TypeScript (frontend)
- **Strict mode** — `tsconfig.json` has `"strict": true`; no implicit `any`
- **Server Components by default** — only add `"use client"` when you need browser APIs
- **Zustand for client state** — server state goes through TanStack Query
- **No `console.log`** in committed code — use the error boundary or structlog

### AI / RAG changes
When modifying the retrieval pipeline or prompts:
- Run the full RAG test suite: `make test-one f=tests/test_rag.py`
- Run retrieval tests: `make test-one f=tests/test_retrieval.py`
- Prompt changes go in `backend/app/ai/prompts/*.jinja2` — never hardcode in Python

## Feature parity checklist

Use this before claiming parity with the Streamlit reference project:

- [ ] The target feature exists in the current repo as a real page or API route
- [ ] The docs explain how the current implementation differs from the reference repo
- [ ] The feature is wired into the current auth/workspace model
- [ ] Any provider-specific setup is documented in `.env.example` or `.env.production.example`
- [ ] The feature has a test or an explicit note explaining why it is still pending

## Reporting bugs

Open a GitHub issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Environment (OS, Python version, Node version)
- Relevant logs (`make logs svc=backend`)

## Proposing features

Open a GitHub Discussion before writing code for large features. For small fixes, a PR is fine without prior discussion.

## Licence

By contributing, you agree your work will be released under the [MIT License](LICENSE).
