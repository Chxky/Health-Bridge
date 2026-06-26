@echo off
REM Start All Components of HealthBridge MedTrack
REM This script will start backend, dashboard, and mobile in separate windows

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     HealthBridge MedTrack - Multi-Component Startup         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo Starting Backend (Firebase Functions) in new window...
start "HealthBridge Backend" cmd /k "call START_BACKEND.bat"

ping 127.0.0.1 -n 4 > nul

echo Starting Dashboard (React Web App) in new window...
start "HealthBridge Dashboard" cmd /k "call START_DASHBOARD.bat"

ping 127.0.0.1 -n 4 > nul

echo Starting Mobile (Flutter) in new window...
start "HealthBridge Mobile" cmd /k "call START_MOBILE.bat"

echo.
echo ════════════════════════════════════════════════════════════
echo All components are starting up...
echo.
echo 📱 Mobile:    flutter run (check device connection)
echo 🌐 Dashboard: http://localhost:5173
echo ⚙️  Backend:   http://localhost:5001
echo 📊 Emulator:  http://localhost:4000
echo.
echo Services starting in separate windows.
echo Check each window for status and logs.
echo ════════════════════════════════════════════════════════════
echo.

pause
