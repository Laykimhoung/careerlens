@echo off
setlocal EnableExtensions

REM ==========================================================
REM  CareerLens Local Development Environment Launcher
REM  Usage:
REM    scripts\dev.bat
REM    scripts\dev.bat --bot   (also starts Telegram bot polling)
REM ==========================================================

set "WITH_BOT=0"
for %%A in (%*) do (
    if /I "%%~A"=="--bot" set "WITH_BOT=1"
    if /I "%%~A"=="-WithBot" set "WITH_BOT=1"
    if /I "%%~A"=="--with-bot" set "WITH_BOT=1"
    if /I "%%~A"=="-bot" set "WITH_BOT=1"
)

for %%I in ("%~dp0..") do set "ROOT_PATH=%%~fI"
set "BACKEND_PATH=%ROOT_PATH%\backend"
set "VENV_PYTHON=%BACKEND_PATH%\.venv\Scripts\python.exe"
set "FRONTEND_PATH=%ROOT_PATH%\frontend"
set "NODE_MODULES=%FRONTEND_PATH%\node_modules"

echo ==========================================================
echo          CareerLens Local Development Launcher
echo ==========================================================

REM 1. Validate Backend Virtual Environment
if not exist "%VENV_PYTHON%" (
    echo [WARNING] Backend virtual environment not found at backend\.venv.
    echo Please create a virtual environment first:
    echo   cd backend ^&^& python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

REM 2. Validate Frontend Node Modules
if not exist "%NODE_MODULES%" (
    echo [WARNING] Frontend node_modules not found at frontend\node_modules.
    echo Installing frontend dependencies...
    pushd "%FRONTEND_PATH%"
    call npm install
    if errorlevel 1 (
        popd
        exit /b 1
    )
    popd
)

set "TOTAL_STEPS=2"
if "%WITH_BOT%"=="1" set "TOTAL_STEPS=3"

echo.
echo [1/%TOTAL_STEPS%] Starting Django Backend on http://127.0.0.1:8000/ ...
start "CareerLens Backend" /D "%BACKEND_PATH%" cmd /k ""%VENV_PYTHON%" manage.py runserver"

echo [2/%TOTAL_STEPS%] Starting Vite Frontend on http://localhost:5173/ ...
start "CareerLens Frontend" /D "%FRONTEND_PATH%" cmd /k npm run dev

if "%WITH_BOT%"=="1" (
    echo [3/%TOTAL_STEPS%] Starting Telegram Bot ^(polling mode^) ...
    start "CareerLens Telegram Bot" /D "%BACKEND_PATH%" cmd /k ""%VENV_PYTHON%" manage.py run_telegram_bot"
)

echo.
echo Services launched in separate windows!
echo - Backend API:  http://127.0.0.1:8000/
echo - Frontend App: http://localhost:5173/
if "%WITH_BOT%"=="1" (
    echo - Telegram Bot: Polling mode ^(note: clears any active webhook^)
)
echo Press Ctrl+C in any window to terminate that service.
echo.

endlocal
