#!/bin/bash

# AI News Summarizer - Startup Script
echo "🚀 Starting AI News Summarizer & Sentiment Analyzer"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data/mongodb

# Set permissions
chmod +x scripts/*.sh 2>/dev/null || true

# Check if .env files exist, if not create them
echo "⚙️  Checking configuration files..."

if [ ! -f "server/.env" ]; then
    echo "📝 Creating server .env file from template..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your configuration"
fi

if [ ! -f "ai-services/.env" ]; then
    echo "📝 Creating AI services .env file from template..."
    cp ai-services/env.example ai-services/.env
fi

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Check AI Services
if curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ AI Services (Port 5000) - Healthy"
else
    echo "❌ AI Services (Port 5000) - Not responding"
fi

# Check Backend
if curl -f http://localhost:3001/health &> /dev/null; then
    echo "✅ Backend Server (Port 3001) - Healthy"
else
    echo "❌ Backend Server (Port 3001) - Not responding"
fi

# Check Frontend
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend (Port 3000) - Healthy"
else
    echo "❌ Frontend (Port 3000) - Not responding"
fi

echo ""
echo "🎉 AI News Summarizer is starting up!"
echo ""
echo "📱 Access Points:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   AI Services: http://localhost:5000"
echo ""
echo "📊 Admin Access:"
echo "   Go to: http://localhost:3000/admin"
echo "   Default admin: admin@example.com / admin123"
echo ""
echo "🔧 To stop all services:"
echo "   docker-compose down"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "Happy analyzing! 🚀"
