#!/bin/bash
# Atlas AI Agent - Start Script (Mac/Linux)
# Launches the voice-enabled AI agent

echo "==================================="
echo "  Atlas AI Agent"
echo "  by Agapitos Kalafatas"
echo "==================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -q

# Check for API key
if [ -z "$GEMINI_API_KEY" ] && [ ! -f "config/.gemini_key" ]; then
    echo ""
    echo "GEMINI_API_KEY not set!"
    echo ""
    echo "Option 1: Set environment variable"
    echo "  export GEMINI_API_KEY=your_key_here"
    echo ""
    echo "Option 2: Create config/.gemini_key file"
    echo "  echo your_key_here > config/.gemini_key"
    echo ""
    echo "Get your key at: https://aistudio.google.com/app/apikey"
    echo ""
    exit 1
fi

# Start the agent
echo ""
echo "Starting Atlas AI Agent..."
echo "Type your message and press Enter. Say 'goodbye atlas' to exit."
echo ""
python -m agent.main --chat
