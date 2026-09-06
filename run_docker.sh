#!/usr/bin/env bash
set -e

echo "================================================================="
echo "   X-Ray Audit Copilot: Turnkey Docker Deployment               "
echo "================================================================="

# Check Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH."
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker daemon is not running."
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

echo "🐳 Building and starting X-Ray Audit Copilot containers..."
echo "• Backend:  FastAPI + LangGraph on http://localhost:8000"
echo "• Frontend: Next.js + FortuneSheet on http://localhost:3000"
echo ""

if docker compose version &> /dev/null; then
    docker compose up --build
elif command -v docker-compose &> /dev/null; then
    docker-compose up --build
else
    echo "❌ Error: Neither 'docker compose' nor 'docker-compose' found."
    exit 1
fi
