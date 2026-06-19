# Nexus Master Integration

This workspace now treats the imported Nexus projects as integrated sub-systems instead of loose folders.

## Canonical Map

The source of truth is `integrations/projects.json`. It records each imported repository, local path, verified commit, runtime ports, start commands, services, and capabilities.

## Imported Sources

| Project | Local path | Purpose |
| --- | --- | --- |
| HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub | `apps/multi-agent-hub` | Streamlit specialized agent hub |
| trilogy-group/nexus-agents | `apps/nexus-agents` | Deep research, MCP, DOK taxonomy |
| svenhven/nexus-ai | `apps/nexus-ai` | FastAPI/Next.js sentiment AI app |
| Amulya631/Nexus_Agent | `apps/nexus-gcp` | GCP/Gemini orchestrated task, calendar, memory agents |
| PrimisAI/nexus | `packages/primisai` | Reusable Python agent framework |
| Personal NexusAi | `nexusai` and `apps/personal-nexus-ai` | Your main app and an isolated side-by-side copy |

## Port Plan

The master gateway runs on `http://localhost:9100` by default. Port `9000` is left for MinIO.

| Service | Port |
| --- | ---: |
| Personal NexusAi UI/API | 3000 / 8000 |
| Isolated Personal NexusAi UI/API | 3001 / 8001 |
| Isolated Personal NexusAi MinIO | 9002 / 9003 |
| SvenHven Nexus AI UI/API | 3002 / 8002 |
| Multi-Agent Hub | 8501 |
| Nexus Agents UI/API | 12001 / 12000 |
| Nexus GCP local frontend/orchestrator | 8085 / 8081 |

## Verification

Run this before starting the gateway:

```powershell
python .\scripts\validate_integrations.py
python -m py_compile .\nexus_master_api.py .\scripts\validate_integrations.py
```

Then start the gateway:

```powershell
python .\nexus_master_api.py
```

Open `http://localhost:9100`.
