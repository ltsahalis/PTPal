#!/bin/bash

# PTPal Start Script - Launches both frontend and backend servers
echo "========================================="
echo "Starting PTPal..."
echo "========================================="
echo ""

# Check if setup has been run
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo "ERROR: SSL certificates not found."
    echo "Please run ./setup.sh first"
    exit 1
fi

if [ ! -d "backend/venv" ]; then
    echo "ERROR: Python virtual environment not found."
    echo "Please run ./setup.sh first"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down PTPal..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting Python backend server..."
cd backend
source venv/bin/activate
python3 app.py &
BACKEND_PID=$!
cd ..
echo "Backend running on http://localhost:8001 (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 2

# Start frontend HTTPS server
echo "Starting HTTPS frontend server..."
node https-server.js &
FRONTEND_PID=$!
echo "Frontend running on https://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "========================================="
echo "PTPal running successfully"
echo "========================================="
echo ""
echo "📱 Open your browser to: https://localhost:3000"
echo ""
echo "You will see a security warning - Click 'Advanced' and 'Proceed to localhost'"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

