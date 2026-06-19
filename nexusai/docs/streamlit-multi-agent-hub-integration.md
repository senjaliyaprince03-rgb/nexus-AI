# Streamlit Multi-Agent Hub Integration

Source repository:
`https://github.com/HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub`

The upstream project has been preserved in:

`legacy/streamlit-multi-agent-hub`

The production app integration is implemented through the existing FastAPI,
Celery, MongoDB, and Next.js stack.

## Integrated Capabilities

- Auto Router
- General Query Agent
- Web Search Agent
- Financial Data Analyst
- Academic Research Agent
- Math Calculator
- Wikipedia Agent
- News Article Agent
- YouTube Agent
- Document RAG Agent
- Advanced RAG With Memory

## API Surface

- `GET /api/agents/catalog`
  Returns the merged agent catalog.

- `POST /api/agents/run`
  Accepts `question`, `agent_type`, `top_k`, and optional `resource_url`.

- `GET /api/agents/runs/{run_id}/status`
  Polls a queued or completed run.

- `GET /api/agents/runs/{run_id}/result`
  Returns the final answer, confidence, trace, and selected agent metadata.

## Runtime Notes

The adapter works without optional Agno dependencies by falling back to the
configured NexusAI LLM/runtime. The math agent also includes a local safe
calculator path.

For the full upstream tool runtime, install:

```powershell
cd C:\Users\Prince\Downloads\NexusAi\nexusai
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.multi-agent-hub.txt
```

Then set `GROQ_API_KEY` in the backend environment. When those packages and
keys are available, the adapter can use the matching Agno tool runtime.
