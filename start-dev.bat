@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 echo No Node.js processes were running.

:: Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

:: Clean node_modules if needed
echo Cleaning up node_modules...
if exist "server\node_modules" (
    cd server
    rmdir /s /q node_modules
    cd ..
)
if exist "client\node_modules" (
    cd client
    rmdir /s /q node_modules
    cd ..
)

echo Starting server and client...

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Start the server in dev mode
cd server
echo Installing server dependencies...
call npm cache clean --force
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo Failed to install server dependencies
    exit /b 1
)

echo Starting server in development mode...
start /min cmd /c "npm run dev > ..\logs\server.log 2>&1"

:: Wait for server to initialize
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

:: Start the client
cd ../client
echo Installing client dependencies...
call npm cache clean --force
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo Failed to install client dependencies
    exit /b 1
)

echo Starting client...
start /min cmd /c "npm run dev > ..\logs\client.log 2>&1"

:: Wait for client to start
timeout /t 5 /nobreak >nul

:: Final message
echo Development environment is running...
echo Server is available at http://localhost:3001
echo Client is available at http://localhost:3000
echo.
echo Server and client are running in the background.
echo Check logs\server.log and logs\client.log for output.
echo Run 'taskkill /F /IM node.exe' to stop all processes.
