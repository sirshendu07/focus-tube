@echo off
echo ===================================================
echo     FocusTube - Distraction-Free Study Platform
echo ===================================================
echo.
echo Starting Backend Server on http://localhost:5002 ...
start "FocusTube Backend" cmd /k "cd /d %~dp0backend && npm start"

echo Starting Frontend on http://localhost:5174 ...
start "FocusTube Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers have been launched!
echo Open your browser at: http://localhost:5174
echo.
pause
