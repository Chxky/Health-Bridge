@echo off
REM Start HealthBridge MedTrack Mobile App (Flutter)
REM This will run the Flutter app on an emulator or connected device

cd /d "%~dp0mobile"

echo Installing Flutter dependencies...
call flutter pub get

echo.
echo Checking available devices...
call flutter devices

echo.
echo Starting Flutter App...
echo.
echo ========================================
echo Flutter App will launch on your device/emulator
echo ========================================
echo.
echo Press Ctrl+C to stop the app
echo.

call flutter run -d chrome
pause
