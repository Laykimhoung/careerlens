<#
.SYNOPSIS
    CareerLens Local Development Environment Launcher
.DESCRIPTION
    Launches Django REST Framework backend and Vite React frontend
    in synchronized development mode. Pass -WithBot to also launch the
    Telegram bot in local polling mode.
.USAGE
    .\scripts\dev.ps1
    .\scripts\dev.ps1 -WithBot
#>
param(
    [switch]$WithBot
)

$RootPath = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         CareerLens Local Development Launcher            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Validate Backend Virtual Environment
$BackendPath = Join-Path $RootPath "backend"
$VenvPython = Join-Path $BackendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Warning "Backend virtual environment not found at backend\.venv."
    Write-Host "Please create a virtual environment first: cd backend; python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 2. Validate Frontend Node Modules
$FrontendPath = Join-Path $RootPath "frontend"
$NodeModules = Join-Path $FrontendPath "node_modules"

if (-not (Test-Path $NodeModules)) {
    Write-Warning "Frontend node_modules not found at frontend\node_modules."
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $FrontendPath
    npm install
    Pop-Location
}

$TotalSteps = if ($WithBot) { 3 } else { 2 }

Write-Host "`n[1/$TotalSteps] Starting Django Backend on http://127.0.0.1:8000/ ..." -ForegroundColor Green
$BackendCmd = "cd '$BackendPath'; & '$VenvPython' manage.py runserver"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BackendCmd"

Write-Host "[2/$TotalSteps] Starting Vite Frontend on http://localhost:5173/ ..." -ForegroundColor Green
$FrontendCmd = "cd '$FrontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$FrontendCmd"

if ($WithBot) {
    Write-Host "[3/$TotalSteps] Starting Telegram Bot (polling mode) ..." -ForegroundColor Green
    $BotCmd = "cd '$BackendPath'; & '$VenvPython' manage.py run_telegram_bot"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BotCmd"
}

Write-Host "`nServices launched in separate windows!" -ForegroundColor Green
Write-Host "- Backend API:  http://127.0.0.1:8000/" -ForegroundColor Gray
Write-Host "- Frontend App: http://localhost:5173/" -ForegroundColor Gray
if ($WithBot) {
    Write-Host "- Telegram Bot: Polling mode (note: clears any active webhook)" -ForegroundColor Gray
}
Write-Host "Press Ctrl+C in any window to terminate that service.`n" -ForegroundColor Gray
