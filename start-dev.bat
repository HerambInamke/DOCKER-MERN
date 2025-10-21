@echo off
echo Starting DevHub Development Environment...
echo.

echo Installing dependencies...
cd server
call npm install
cd ../client
call npm install
cd ..

echo.
echo Starting services...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:5173
echo MongoDB will run on localhost:27017
echo.

start "DevHub Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
start "DevHub Frontend" cmd /k "cd client && npm run dev"

echo.
echo DevHub is starting up...
echo Check the terminal windows for any errors.
echo.
pause
