# NexusAI Onboarding Guide

This guide is for contributors who want to understand how the current NexusAI repo works and how it differs from the Streamlit/Groq/AstraDB reference project.

Start here if you want a quick mental model before making changes:

1. Read `docs/reference-crosswalk.md`
2. Read `README.md`
3. Read `SETUP.md`
4. Skim the backend routes and frontend pages that match your task

## How this repo runs

Use `make dev` from the repository root.

That starts:

- MongoDB
- Redis
- MinIO
- FastAPI
- Celery workers
- Next.js frontend

## Where to look for common changes

| Task | Start here |
|---|---|
| Chat / RAG flow | `backend/app/api/chat.py`, `backend/app/ai/` |
| Documents | `backend/app/api/documents.py`, `frontend/src/app/dashboard/documents/page.tsx` |
| Agent runs | `backend/app/api/agents.py`, `frontend/src/app/dashboard/agents/page.tsx` |
| Analytics | `backend/app/api/analytics.py`, `frontend/src/app/dashboard/analytics/page.tsx` |
| Workspaces / auth | `backend/app/api/workspaces.py`, `backend/app/api/auth.py`, `frontend/src/app/auth/` |

## What not to assume

- Do not assume Streamlit commands apply here.
- Do not assume AstraDB is the active persistence layer in this repo.
- Do not assume a reference-repo feature exists unless it appears in the current route/page map or backend code.

## Good first checks

- Verify the run command in `Makefile`.
- Verify the relevant frontend page under `frontend/src/app/`.
- Verify the matching backend route under `backend/app/api/`.
- Check `docs/reference-crosswalk.md` for the reference-repo mapping before changing docs or onboarding text.
