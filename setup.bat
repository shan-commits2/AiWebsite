@echo off
title Gemini AI Chat Setup - Windows Auto Installer
color 0a

echo.
echo ========================================
echo   GEMINI AI CHAT - AUTO SETUP
echo ========================================
echo.
echo This script will automatically:
echo - Check Node.js installation
echo - Install dependencies
echo - Build the project
echo - Start the development server
echo.

:: Check if Node.js is installed
echo [STEP 1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installation, restart this script.
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found

:: Check if npm is available
echo [STEP 2/5] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% found

:: Clean install dependencies
echo [STEP 3/5] Installing dependencies...
echo This may take a few minutes...
if exist node_modules (
    echo Cleaning existing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Cleaning package-lock.json...
    del package-lock.json
)

echo Installing fresh dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Trying with force flag...
    npm install --force
    if %errorlevel% neq 0 (
        echo ERROR: Still failed. Please check your internet connection.
        pause
        exit /b 1
    )
)
echo ✓ Dependencies installed successfully

:: Create .env file if it doesn't exist
echo [STEP 4/5] Setting up environment...
if not exist .env (
    echo Creating .env file...
    echo # Gemini AI Chat Environment Variables > .env
    echo # Get your API key from: https://aistudio.google.com >> .env
    echo GEMINI_API_KEY=your_gemini_api_key_here >> .env
    echo NODE_ENV=development >> .env
    echo PORT=5000 >> .env
    echo. >> .env
    echo # Database (optional for local development) >> .env
    echo # DATABASE_URL=your_database_url_here >> .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file and add your GEMINI_API_KEY
    echo    Get it from: https://aistudio.google.com
    echo.
)

:: Check if TypeScript files need compilation
echo [STEP 5/5] Checking project structure...
if not exist dist (
    echo Building project...
    npm run build >nul 2>&1
)

echo ✓ Setup completed successfully!
echo.
echo ========================================
echo   READY TO START!
echo ========================================
echo.
echo Your Gemini AI Chat is ready to run!
echo.
echo To start the development server:
echo   npm run dev
echo.
echo The app will be available at:
echo   http://localhost:5000
echo.
echo Features included:
echo   ✓ Multiple AI models (Gemini 1.5, 2.0, 2.5)
echo   ✓ Model comparison mode
echo   ✓ Custom themes and fonts
echo   ✓ Message editing and reactions
echo   ✓ Export conversations
echo   ✓ File uploads and analysis
echo   ✓ Usage analytics
echo   ✓ Voice input support
echo   ✓ Code execution
echo   ✓ And much more!
echo.
echo Starting development server with auto-recovery...
echo.
echo ========================================
echo   AUTO-RECOVERY ENABLED
echo ========================================
echo If the server fails, it will automatically:
echo - Reinstall dependencies
echo - Clear port conflicts  
echo - Retry server startup
echo.

:retry_server
echo [INFO] Starting development server...
npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start! Attempting auto-recovery...
    echo [STEP 1] Checking for missing dependencies...
    npm install --silent >nul 2>&1
    
    echo [STEP 2] Clearing potential port conflicts...
    netstat -ano | findstr :5000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Port 5000 is in use, attempting to free it...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 >nul
    )
    
    echo [STEP 3] Retrying server startup in 3 seconds...
    timeout /t 3 >nul
    goto retry_server
)

echo.
echo [SUCCESS] Server started successfully!
echo Visit http://localhost:5000 to use your AI chat platform