# Nexus Master Intelligence Hub

This workspace is now a structured Nexus monorepo that combines your personal NexusAi project with the five requested Nexus agent repositories through a single master integration gateway.

## Integrated Projects

The canonical integration map is stored in `integrations/projects.json`.

| Project | Local path | Runtime |
| --- | --- | --- |
| Personal NexusAi Core | `nexusai` | UI `3000`, API `8000` |
| HimanshuBaurai/NexusAI-Multi-Agent-Intelligence-Hub | `apps/multi-agent-hub` | Streamlit `8501` |
| trilogy-group/nexus-agents | `apps/nexus-agents` | API `12000`, UI `12001` |
| svenhven/nexus-ai | `apps/nexus-ai` | API `8002`, UI `3002` |
| Amulya631/Nexus_Agent | `apps/nexus-gcp` | Local GCP-style agents `8081+` |
| PrimisAI/nexus | `packages/primisai` | Python package |
| Legacy Personal NexusAi Copy | `apps/personal-nexus-ai` | Archived duplicate; not the canonical runtime |

The master gateway now runs on `http://localhost:9100` so it does not collide with MinIO on port `9000`.

## Start

Validate the integration first:

```powershell
python .\scripts\validate_integrations.py
```

Start the gateway and available services:

```powershell
.\start_all.ps1
```

Start only the canonical NexusAI product stack:

```powershell
docker compose -f .\compose.yaml up -d
```

Start only the gateway:

```powershell
.\start_all.ps1 -GatewayOnly
```

## API

The gateway exposes:

| Endpoint | Purpose |
| --- | --- |
| `/api/health` | Gateway health |
| `/api/projects` | All integrated project metadata |
| `/api/services` | Registered service map |
| `/api/services/status` | Live service status checks |
| `/api/integration/summary` | Integration counts, missing paths, and port conflicts |

More detail is in `docs/master-integration.md`.
# nexus-AI
