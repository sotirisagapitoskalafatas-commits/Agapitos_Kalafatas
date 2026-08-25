@echo off
REM Atlas AI Agent - Start Script (Windows)
REM Launches the voice-enabled AI agent

echo ===================================
echo   Atlas AI Agent
echo   by Agapitos Kalafatas
echo ===================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Install Python from https://python.org
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

REM Check for API key
if not defined GEMINI_API_KEY (
    if not exist "config\.gemini_key" (
        echo.
        echo GEMINI_API_KEY not set!
        echo.
        echo Option 1: Set environment variable
        echo   set GEMINI_API_KEY=your_key_here
        echo.
        echo Option 2: Create config\.gemini_key file
        echo   echo your_key_here > config\.gemini_key
        echo.
        echo Get your key at: https://aistudio.google.com/app/apikey
        echo.
        pause
        exit /b 1
    )
)

REM Start the agent in text chat mode
echo.
echo Starting Atlas AI Agent...
echo Type your message and press Enter. Say 'goodbye atlas' to exit.
echo.
python -m agent.main --chat

pause
