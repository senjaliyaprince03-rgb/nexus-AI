param(
    [switch]$GatewayOnly,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Continue"
$rootDir = $PSScriptRoot
$gatewayPort = if ($env:MASTER_GATEWAY_PORT) { $env:MASTER_GATEWAY_PORT } else { "9100" }

$pythonExe = if (Test-Path "$rootDir\nexusai\backend\.venv\Scripts\python.exe") { "$rootDir\nexusai\backend\.venv\Scripts\python.exe" } else { "python" }

function Test-CommandExists {
    param([string]$Name)
    if (Test-Path $Name) { return $true }
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-DockerReady {
    if ($SkipDocker -or -not (Test-CommandExists "docker")) {
        return $false
    }
    docker info *> $null
    return ($LASTEXITCODE -eq 0)
}

function Start-NexusProcess {
    param(
        [string]$Label,
        [string]$FilePath,
        [string]$ArgumentList,
        [string]$WorkingDirectory,
        [hashtable]$Environment,
        [switch]$Hidden
    )

    if (-not (Test-Path $WorkingDirectory)) {
        Write-Host "  - Skipping $Label; missing directory: $WorkingDirectory" -ForegroundColor Yellow
        return
    }

    if (-not (Test-CommandExists $FilePath)) {
        Write-Host "  - Skipping $Label; command not found: $FilePath" -ForegroundColor Yellow
        return
    }

    $windowStyle = if ($Hidden) { "Hidden" } else { "Minimized" }
    try {
        Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle $windowStyle
        Write-Host "  + Started $Label" -ForegroundColor Green
    } catch {
        Write-Host "  - Could not start ${Label}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  NEXUS MASTER INTELLIGENCE HUB STARTUP      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $rootDir

Write-Host "[1/3] Validating integration manifest..." -ForegroundColor Yellow
& $pythonExe "$rootDir\scripts\validate_integrations.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Manifest validation failed. Fix the reported issue before starting services." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1.5/3] Running pre-flight checks and clearing ports..." -ForegroundColor Yellow

function Test-IsNexusProcess {
    param([int]$pidToCheck)
    $maxDepth = 5
    $currentPid = $pidToCheck
    for ($i = 0; $i -lt $maxDepth; $i++) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid" -ErrorAction SilentlyContinue
        if (-not $proc) { break }
        
        $path = $proc.ExecutablePath
        $cmd = $proc.CommandLine
        
        if (($path -and $path -match [regex]::Escape($rootDir)) -or ($cmd -and $cmd -match [regex]::Escape($rootDir))) {
            return $true
        }
        
        if ($proc.ParentProcessId -eq 0 -or $proc.ParentProcessId -eq $currentPid) { break }
        $currentPid = $proc.ParentProcessId
    }
    return $false
}

$portsToCheck = @(8501, 8000, 3000, 3001, 12000, 12001, 8002, 3002, 8085, 8081, $gatewayPort)
foreach ($p in $portsToCheck) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $pidOwner = $conn.OwningProcess
        if (Test-IsNexusProcess -pidToCheck $pidOwner) {
            Write-Host "  - Port $p in use by NexusAi process (PID $pidOwner). Terminating safely..." -ForegroundColor Yellow
            Stop-Process -Id $pidOwner -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        } else {
            $extProc = Get-CimInstance Win32_Process -Filter "ProcessId = $pidOwner" -ErrorAction SilentlyContinue
            $extName = if ($extProc) { $extProc.Name } else { "Unknown" }
            Write-Host "  - ERROR: Port $p is blocked by external non-NexusAi process $extName (PID $pidOwner). Cannot start safely!" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "  - Checking backend dependencies dynamically via uv pip check..." -ForegroundColor Yellow
$origLoc = Get-Location
Set-Location "$rootDir\nexusai\backend"
& uv pip check
$checkExit = $LASTEXITCODE
Set-Location $origLoc
if ($checkExit -ne 0) {
    Write-Host "  - Missing or misconfigured dependencies detected. Please run 'uv sync' in nexusai/backend." -ForegroundColor Red
    exit 1
}

if (-not $GatewayOnly) {
    Write-Host "`n[2/3] Starting integrated services on non-conflicting ports..." -ForegroundColor Yellow

    Start-NexusProcess `
        -Label "Multi-Agent Hub (Streamlit :8501)" `
        -FilePath "streamlit" `
        -ArgumentList "run app.py --server.port 8501 --server.headless=true" `
        -WorkingDirectory "$rootDir\apps\multi-agent-hub"

    if (Test-DockerReady) {
        Start-NexusProcess `
            -Label "Nexus Agents infrastructure (Redis/Postgres)" `
            -FilePath "docker" `
            -ArgumentList "compose up -d" `
            -WorkingDirectory "$rootDir\apps\nexus-agents" `
            -Hidden

        Start-NexusProcess `
            -Label "Canonical NexusAI Docker stack (:3000/:8000)" `
            -FilePath "docker" `
            -ArgumentList "compose -f compose.yaml up -d" `
            -WorkingDirectory "$rootDir" `
            -Hidden
    } elseif (Test-Path "$rootDir\nexusai\start_local.ps1") {
        Start-NexusProcess `
            -Label "Canonical NexusAI local stack (:3000/:8000)" `
            -FilePath "powershell.exe" `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$rootDir\nexusai\start_local.ps1`"" `
            -WorkingDirectory "$rootDir\nexusai" `
            -Hidden
    } elseif ((Test-Path "$rootDir\start_backend.ps1") -and (Test-Path "$rootDir\start_frontend.ps1")) {
        Start-NexusProcess `
            -Label "Canonical NexusAI Backend (:8000)" `
            -FilePath "powershell.exe" `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$rootDir\start_backend.ps1`"" `
            -WorkingDirectory "$rootDir" `
            -Hidden
        Start-NexusProcess `
            -Label "Canonical NexusAI Frontend (:3001)" `
            -FilePath "powershell.exe" `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$rootDir\start_frontend.ps1`"" `
            -WorkingDirectory "$rootDir" `
            -Hidden
    } else {
        Write-Host "  - Docker is not ready; skipped Docker-backed services." -ForegroundColor Yellow
    }

    Start-NexusProcess `
        -Label "Nexus Agents API/UI (:12000/:12001)" `
        -FilePath "uv" `
        -ArgumentList "run python start.py --api-port 12000 --web-port 12001" `
        -WorkingDirectory "$rootDir\apps\nexus-agents"

    Start-NexusProcess `
        -Label "SvenHven Nexus AI API (:8002)" `
        -FilePath $pythonExe `
        -ArgumentList "main.py" `
        -WorkingDirectory "$rootDir\apps\nexus-ai\backend"

    Start-NexusProcess `
        -Label "SvenHven Nexus AI UI (:3002)" `
        -FilePath "npm" `
        -ArgumentList "run dev -- --hostname localhost -p 3002" `
        -WorkingDirectory "$rootDir\apps\nexus-ai\frontend"

    # Start GCP Agent frontend and orchestrator
    Start-NexusProcess `
        -Label "NEXUS GCP frontend (:8085)" `
        -FilePath $pythonExe `
        -ArgumentList "main.py" `
        -WorkingDirectory "$rootDir\apps\nexus-gcp\frontend" `
        -Environment @{ PORT = "8085" }

    Start-NexusProcess `
        -Label "NEXUS GCP orchestrator (:8081)" `
        -FilePath $pythonExe `
        -ArgumentList "main.py" `
        -WorkingDirectory "$rootDir\apps\nexus-gcp\orchestrator" `
        -Environment @{ PORT = "8081" }

    if (-not $env:GEMINI_API_KEY) {
        Write-Host "  - Warning: GEMINI_API_KEY is not set. Local GCP agent services will run but Gemini model requests will fail." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[2/3] GatewayOnly selected; sub-systems were not started." -ForegroundColor Yellow
}

Write-Host "`n[3/3] Starting Master Gateway API and Health Monitor..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Gateway running at http://localhost:$gatewayPort" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Prevent duplicate health monitors
$monitorProc = Get-WmiObject Win32_Process -Filter "Name='powershell.exe' AND CommandLine LIKE '%monitor_health.ps1%'" -ErrorAction SilentlyContinue
if (-not $monitorProc) {
    Write-Host "`n[+] Starting Background Health Monitor..." -ForegroundColor Green
    Start-Process powershell.exe -ArgumentList "-WindowStyle Hidden -File `"$rootDir\scripts\monitor_health.ps1`"" -WindowStyle Hidden
}

$env:MASTER_GATEWAY_PORT = $gatewayPort
& $pythonExe "$rootDir\nexus_master_api.py"
