@echo off
REM Start HealthBridge MedTrack Backend (Firebase Functions)
REM This will start the Firebase emulator with local functions

cd /d "%~dp0backend\functions"

echo Installing dependencies...
call npm install

echo.
echo Building TypeScript...
call npm run build

echo.
echo Starting Firebase Functions Emulator...
echo.
echo ========================================
echo Backend will be available at:
echo http://localhost:5001
echo Firebase Emulator UI: http://localhost:4000
echo ========================================
echo.

call npm run serve

pause
