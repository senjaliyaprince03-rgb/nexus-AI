# NexusAI Reference Crosswalk

This document maps the Streamlit/Groq/AstraDB reference project
`HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub` to the current
`Next.js + FastAPI` NexusAI repository.

Use this as the “what maps to what” guide when you are comparing the two codebases.
This repository is the source of truth for implementation.

## 1) High-level comparison

| Area | Streamlit reference repo | Current NexusAI repo |
|---|---|---|
| App shell | Single Streamlit UI (`app.py`) | Next.js frontend with dashboard pages |
| API layer | Streamlit app logic + helper modules | FastAPI backend under `backend/app/api` |
| Model routing | Groq-backed specialist agents | Workspace-aware chat + multi-agent pipeline |
| Vector store | AstraDB | MongoDB, Atlas Vector Search or local cosine fallback, Redis, MinIO |
| Document chat | RAG over uploaded PDFs / URLs | Documents, chat, agent runs, analytics, workspaces |
| Memory mode | LangGraph history-aware document chat | Session/workspace-aware chat with a separate agent pipeline |
| Primary run command | `streamlit run app.py` | `docker compose up -d` or `make dev` |

## 2) Feature crosswalk

| Reference feature | Current repo equivalent | Status |
|---|---|---|
| General Query | `frontend/src/app/(dashboard)/chat/page.tsx` using `POST /api/chat/query` | Partial — same intent, different stack and model pipeline |
| Financial Analysis | No dedicated domain page or route today | Not implemented |
| Academic Research | No dedicated arXiv workflow today | Not implemented |
| Math Calculator | No dedicated calculator route today | Not implemented |
| Wikipedia Search | No dedicated Wikipedia workflow today | Not implemented |
| News Summary | No dedicated news URL summariser today | Not implemented |
| YouTube Summary | No dedicated YouTube transcript workflow today | Not implemented |
| Chat with Documents | `frontend/src/app/dashboard/documents/page.tsx` + `POST /api/documents/upload` + `POST /api/chat/query` | Implemented |
| Advanced RAG with Memory | `frontend/src/app/(dashboard)/chat/page.tsx` with the Agents toggle + `POST /api/agents/run` | Partial — conceptually similar, but implemented as the current agent pipeline |

## 3) Current repo routes and pages

| User surface | Page / route | Backend route(s) |
|---|---|---|
| Main dashboard | `frontend/src/app/dashboard/page.tsx` | `GET /api/analytics/queries`, `GET /api/analytics/documents/usage` |
| Chat | `frontend/src/app/(dashboard)/chat/page.tsx` | `POST /api/chat/query`, `GET /api/chat/sessions` |
| Documents | `frontend/src/app/dashboard/documents/page.tsx` | `POST /api/documents/upload`, `GET /api/documents/`, `DELETE /api/documents/{id}`, `POST /api/documents/{id}/reingest` |
| Agents | `frontend/src/app/dashboard/agents/page.tsx` | `POST /api/agents/run`, `GET /api/agents/runs/{run_id}/status`, `GET /api/agents/runs/{run_id}/result` |
| Analytics | `frontend/src/app/dashboard/analytics/page.tsx` | `GET /api/analytics/queries`, `GET /api/analytics/documents/usage`, `WS /api/analytics/ws` |
| Settings | `frontend/src/app/dashboard/settings/page.tsx` | auth / environment hints only |
| Auth | `frontend/src/app/auth/*` and `frontend/src/app/(auth)/*` | `POST /api/auth/*`, `GET /api/auth/me`, refresh/logout routes |
| Workspaces | dashboard/workspace UI | `GET /api/workspaces/`, `POST /api/workspaces/`, `POST /api/workspaces/{id}/invite` |

## 4) Setup crosswalk

| Reference repo setup | Current repo setup |
|---|---|
| Create `.env` with `GROQ_API_KEY`, `ASTRA_DB_APPLICATION_TOKEN`, `ASTRA_DB_API_ENDPOINT` | Copy `backend/.env.example` to `backend/.env` and fill the current stack values |
| Install with `pip install -r requirements.txt` | Run `make dev` for the full stack, or use the backend/frontend package workflows separately |
| Run with `streamlit run app.py` | Run `docker compose up -d` or `make dev` from the repo root |
| Upload data into AstraDB | Upload docs through the dashboard; the backend stores documents, chat history, and analytics through its current persistence layer |
| Single-page Streamlit UI | Multi-page dashboard with auth, documents, chat, agents, analytics, and settings |

## 5) Feature parity backlog

If you want to evolve this repo toward the reference project, the remaining work is:

- Add dedicated domain agents for finance, academic search, Wikipedia, news, YouTube, and calculator flows.
- Decide whether those tools should live in the current FastAPI backend or in a separate thin UI module.
- Keep the current auth/workspace/document model intact unless you explicitly want to simplify the product back to a demo app.

## 6) Recommended reading order

1. `README.md`
2. `SETUP.md`
3. `docs/reference-crosswalk.md`
4. The reference repo: <https://github.com/HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub>
