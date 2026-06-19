param(
    [int]$Port = 8000,
    [string]$HostAddress = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $backendDir ".venv\Scripts\python.exe"
$outFile = Join-Path $backendDir "..\backend-start.out.log"
$errFile = Join-Path $backendDir "..\backend-start.err.log"

if (-not (Test-Path -LiteralPath $python)) {
    Write-Host "Missing backend virtual environment: $python" -ForegroundColor Red
    Write-Host "Create it or install the backend dependencies before starting." -ForegroundColor Yellow
    exit 1
}

Remove-Item $outFile,$errFile -ErrorAction SilentlyContinue

Set-Location $backendDir

$command = 'set USE_MONGO_MOCK=true&& "' + $python + '" -m uvicorn app.main:app --host ' + $HostAddress + ' --port ' + $Port

Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $command -WorkingDirectory $backendDir -RedirectStandardOutput $outFile -RedirectStandardError $errFile -WindowStyle Hidden

Write-Host "Backend start requested." -ForegroundColor Green
Write-Host "Output log: $outFile" -ForegroundColor DarkGray
Write-Host "Error log:  $errFile" -ForegroundColor DarkGray
