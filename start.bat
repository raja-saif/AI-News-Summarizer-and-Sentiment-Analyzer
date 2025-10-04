@echo off
echo 🚀 Starting AI News Summarizer & Sentiment Analyzer
echo ==================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "data\mongodb" mkdir data\mongodb

REM Check if .env files exist, if not create them
echo ⚙️  Checking configuration files...

if not exist "server\.env" (
    echo 📝 Creating server .env file from template...
    copy "server\env.example" "server\.env"
    echo ⚠️  Please edit server\.env with your configuration
)

if not exist "ai-services\.env" (
    echo 📝 Creating AI services .env file from template...
    copy "ai-services\env.example" "ai-services\.env"
)

REM Start services with Docker Compose
echo 🐳 Starting services with Docker Compose...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check AI Services
curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ AI Services (Port 5000) - Healthy
) else (
    echo ❌ AI Services (Port 5000) - Not responding
)

REM Check Backend
curl -f http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Server (Port 3001) - Healthy
) else (
    echo ❌ Backend Server (Port 3001) - Not responding
)

REM Check Frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend (Port 3000) - Healthy
) else (
    echo ❌ Frontend (Port 3000) - Not responding
)

echo.
echo 🎉 AI News Summarizer is starting up!
echo.
echo 📱 Access Points:
echo    Frontend:    http://localhost:3000
echo    Backend API: http://localhost:3001
echo    AI Services: http://localhost:5000
echo.
echo 📊 Admin Access:
echo    Go to: http://localhost:3000/admin
echo    Default admin: admin@example.com / admin123
echo.
echo 🔧 To stop all services:
echo    docker-compose down
echo.
echo 📝 To view logs:
echo    docker-compose logs -f
echo.
echo Happy analyzing! 🚀
pause
