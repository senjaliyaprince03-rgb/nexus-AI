param(
    [int]$Port = 3001,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"
$frontendDir = Join-Path $PSScriptRoot "nexusai\frontend"

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

$listener = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($listener) {
    if (-not $Restart) {
        Write-Host "Frontend is already running at http://127.0.0.1:$Port (PID $($listener.OwningProcess))." -ForegroundColor Green
        Write-Host "Run .\start_frontend.ps1 -Restart to restart it after code changes." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "Stopping frontend on port $Port (PID $($listener.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $listener.OwningProcess -Force
    Start-Sleep -Seconds 2
}

Set-Location -Path $frontendDir
npm run dev -- --hostname 127.0.0.1 -p $Port
