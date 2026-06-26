@echo off
REM Start HealthBridge MedTrack Dashboard (React Web App)
REM This will start the Vite development server

cd /d "%~dp0dashboard"

echo Installing dependencies...
call npm install

echo.
echo Starting React Dashboard...
echo.
echo ========================================
echo Dashboard will be available at:
echo http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
