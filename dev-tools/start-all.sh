#!/bin/bash

# Start all services for Insight EDU

echo "🚀 Starting Insight EDU System..."
echo ""

# Check if database is running
echo "📊 Checking database..."
if podman ps | grep -q insight-edu-postgres; then
    echo "✅ Database is already running"
else
    echo "⚠️  Database is not running. Starting..."
    podman start insight-edu-postgres
    sleep 3
fi

echo ""
echo "🔧 Starting backend server on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!

echo ""
echo "🎨 Starting frontend server on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Access points:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3000/api"
echo "   - Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

