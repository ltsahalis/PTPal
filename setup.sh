#!/bin/bash

# PTPal Setup Script - Run this once to set everything up
echo "========================================="
echo "PTPal Setup - One-time installation"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "Node.js found"

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed."
    echo "Please install Python 3 first."
    exit 1
fi
echo "Python 3 found"

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo "ERROR: OpenSSL is not installed."
    echo "Please install OpenSSL first."
    exit 1
fi
echo "OpenSSL found"

echo ""
echo "Step 1: Generating SSL certificates for HTTPS..."
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
    echo "SSL certificates generated"
else
    echo "SSL certificates already exist"
fi

echo ""
echo "Step 2: Setting up Python backend..."
cd backend

# Generate backend SSL certificates if they don't exist
echo "Generating backend SSL certificates..."
if [ ! -f "backend-cert.pem" ] || [ ! -f "backend-key.pem" ]; then
    bash generate_certificates.sh
else
    echo "Backend SSL certificates already exist"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "Python dependencies installed"

cd ..

echo ""
echo "========================================="
echo "Setup completed successfully"
echo "========================================="
echo ""
echo "To start PTPal, run:"
echo "  ./start.sh"
echo ""

