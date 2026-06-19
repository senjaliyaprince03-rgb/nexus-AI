$ErrorActionPreference = "Continue"

Write-Host "============================================="
Write-Host "  NEXUS MASTER INTELLIGENCE HUB INSTALLER    "
Write-Host "============================================="

$rootDir = $PSScriptRoot

# 1. Install Master Gateway Dependencies
Write-Host "`n[1/7] Installing Master Gateway Dependencies..."
cd $rootDir
pip install fastapi uvicorn httpx

# 2. Install Multi-Agent Hub Dependencies
Write-Host "`n[2/7] Installing NexusAI Multi-Agent Hub Dependencies..."
cd "$rootDir\apps\multi-agent-hub"
pip install -r requirements.txt

# 3. Install Nexus Agents Dependencies
Write-Host "`n[3/7] Installing Nexus Agents Dependencies..."
cd "$rootDir\apps\nexus-agents"
pip install uv
uv sync

# 4. Install Nexus AI (GitHub) Dependencies
Write-Host "`n[4/7] Installing Nexus AI Dependencies..."
# Backend
Write-Host "  -> Installing Backend..."
cd "$rootDir\apps\nexus-ai\backend"
pip install -r requirements.txt
# Frontend
Write-Host "  -> Installing Frontend (requires Node.js/npm)..."
cd "$rootDir\apps\nexus-ai\frontend"
npm install

# 5. Install Nexus GCP Dependencies
Write-Host "`n[5/7] Installing Nexus GCP Dependencies..."
cd "$rootDir\apps\nexus-gcp\orchestrator"
pip install -r requirements.txt
cd "$rootDir\apps\nexus-gcp\calendar-agent"
pip install -r requirements.txt
cd "$rootDir\apps\nexus-gcp\task-agent"
pip install -r requirements.txt
cd "$rootDir\apps\nexus-gcp\memory-agent"
pip install -r requirements.txt

# 6. Install PrimisAI Package
Write-Host "`n[6/7] Installing PrimisAI Package..."
cd "$rootDir\packages\primisai"
pip install -e .

# 7. Install Personal NexusAi (Docker-based)
Write-Host "`n[7/7] Setting up Personal NexusAi Project..."
cd "$rootDir\apps\personal-nexus-ai"
Write-Host "  -> Personal NexusAi uses Docker Compose."
Write-Host "  -> To start: cd apps\personal-nexus-ai && docker compose up -d"
Write-Host "  -> Ports: Backend=8001, Frontend=3001, Postgres=5433, Redis=6380"

Write-Host "`n============================================="
Write-Host "  ALL INSTALLATIONS COMPLETE!                "
Write-Host "============================================="
Write-Host "You can now run '.\start_all.ps1' in the root directory to launch the Master Gateway."
