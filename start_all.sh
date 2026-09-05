#!/usr/bin/env bash
set -e

echo "================================================================="
echo "   X-Ray Audit Copilot: Autonomous Financial Lineage Agent      "
echo "================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Verifying Backend Python Environment..."
cd "$SCRIPT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    ./.venv/bin/pip install -r requirements.txt
fi

echo "[2/3] Starting FastAPI Backend on http://localhost:8000..."
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app &
BACKEND_PID=$!

echo "[3/3] Starting Next.js Frontend on http://localhost:3000..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================================="
echo "  🚀 X-Ray Audit Copilot is Running!"
echo "  • Frontend UI:    http://localhost:3000"
echo "  • Backend API:    http://localhost:8000"
echo "  • Swagger Docs:   http://localhost:8000/docs"
echo "================================================================="
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM EXIT
wait
