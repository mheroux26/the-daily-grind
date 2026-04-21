#!/bin/bash
# Photo-to-TBR — start both backend and frontend
set -e

echo "Starting Photo-to-TBR..."

# Use Homebrew Python 3.11 if available, otherwise fall back
if command -v python3.11 &>/dev/null; then
  PYTHON=python3.11
elif command -v /opt/homebrew/bin/python3.11 &>/dev/null; then
  PYTHON=/opt/homebrew/bin/python3.11
else
  PYTHON=python3
fi

echo "Using Python: $PYTHON"

# Backend
echo "-> Starting backend (FastAPI on :8000)..."
cd "$(dirname "$0")/backend"
# Clear Python cache to ensure latest code runs
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
echo "   (cleared Python cache)"
if [ ! -d "venv" ]; then
  $PYTHON -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo "-> Starting frontend (Vite on :3000)..."
cd ../frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Photo-to-TBR is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
