#!/bin/bash
# Clean restart — kills old processes, clears ALL caches, restarts fresh
echo "=== CLEAN RESTART ==="

# Kill any running uvicorn or vite processes
echo "Stopping old processes..."
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

cd "$(dirname "$0")"

# Clear ALL Python caches
echo "Clearing Python caches..."
find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find backend -name "*.pyc" -delete 2>/dev/null

# Touch all Python files to force recompile
echo "Touching Python source files..."
find backend/app -name "*.py" -exec touch {} +

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf frontend/node_modules/.vite

# Verify genre_tagger exists
if [ -f backend/app/genre_tagger.py ]; then
    echo "genre_tagger.py: FOUND"
else
    echo "WARNING: genre_tagger.py NOT FOUND!"
fi

# Verify search.py has AUTO-TAG
if grep -q "AUTO-TAG" backend/app/search.py; then
    echo "search.py AUTO-TAG logging: FOUND"
else
    echo "WARNING: search.py missing AUTO-TAG logging!"
fi

# Verify models.py has sub_genres
if grep -q "sub_genres" backend/app/models.py; then
    echo "models.py sub_genres field: FOUND"
else
    echo "WARNING: models.py missing sub_genres field!"
fi

echo ""
echo "Starting app..."

# Use Homebrew Python 3.11 if available
if command -v python3.11 &>/dev/null; then
  PYTHON=python3.11
elif command -v /opt/homebrew/bin/python3.11 &>/dev/null; then
  PYTHON=/opt/homebrew/bin/python3.11
else
  PYTHON=python3
fi

echo "Using Python: $PYTHON"

# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd ../frontend
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
