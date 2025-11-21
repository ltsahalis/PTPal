#!/bin/bash
# Quick setup script for OpenAI API integration

echo "=========================================="
echo "OpenAI API Integration Setup"
echo "=========================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✓ .env file already exists"
    
    # Check if it has the API key
    if grep -q "OPENAI_API_KEY=" .env; then
        echo "✓ OPENAI_API_KEY is set in .env"
        
        # Check if it's the placeholder
        if grep -q "sk-your-api-key-here" .env; then
            echo "⚠ Warning: You're still using the placeholder key"
            echo "  Replace it with your actual OpenAI API key"
        else
            echo "✓ API key appears to be configured"
        fi
    else
        echo "⚠ OPENAI_API_KEY not found in .env"
        echo "  Add this line to .env:"
        echo "  OPENAI_API_KEY=sk-your-actual-key-here"
    fi
else
    echo "Creating .env file..."
    cat > .env << 'ENVFILE'
# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Set the model to use (default is gpt-4)
# OPENAI_MODEL=gpt-4-turbo-preview
ENVFILE
    echo "✓ Created .env file"
    echo "  Edit it and add your actual OpenAI API key"
fi

echo ""
echo "Installing required packages..."
pip3 install -q openai python-dotenv
echo "✓ Packages installed"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Get your API key from: https://platform.openai.com/api-keys"
echo "2. Edit backend/.env and replace 'sk-your-api-key-here' with your actual key"
echo "3. Restart the backend server: python3 app.py"
echo ""
echo "For detailed instructions, see: OPENAI_SETUP.md"
