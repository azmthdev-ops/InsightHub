@echo off
echo ========================================
echo   Insight-Hub Production Launcher
echo ========================================
echo.

echo [1/3] Starting FastAPI Backend...
cd backend
start cmd /k "python main.py"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Next.js Frontend...
cd ..\web
start cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================
echo   All services started successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit launcher...
pause >nul
