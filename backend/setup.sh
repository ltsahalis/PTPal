#!/bin/bash

# PTPal Backend Setup Script
echo "Setting up PTPal backend for data collection and angle calculation..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment (optional but recommended)
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing Python dependencies..."
pip install flask==2.3.3 flask-cors==4.0.0

echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "1. cd /Users/rachelbarume/PTPal/PTPal/backend"
echo "2. source venv/bin/activate  (if using virtual environment)"
echo "3. python3 app.py"
echo ""
echo "The backend will run on http://localhost:8000"
echo "Your frontend will send pose data to this backend"
echo "Angular measurements will be stored in SQLite database"
