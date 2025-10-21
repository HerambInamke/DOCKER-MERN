@echo off
echo Starting DevHub with Docker...
echo.

echo Building and starting containers...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo DevHub is running!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo MongoDB Admin: http://localhost:8081
echo.
pause
