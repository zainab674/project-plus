@echo off
echo Starting LiveKit Transcription Agent...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

REM Check environment variables
echo Checking environment configuration...
python -c "import os; from dotenv import load_dotenv; load_dotenv(); required=['DEEPGRAM_API_KEY', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET']; missing=[v for v in required if not os.getenv(v)]; print('Missing variables:', missing) if missing else print('Environment OK')"
if errorlevel 1 (
    echo Error: Environment validation failed
    echo Please check your .env file
    pause
    exit /b 1
)

REM Start the agent
echo Starting LiveKit agent...
echo Press Ctrl+C to stop the agent
echo.
python main.py

REM Deactivate virtual environment
deactivate
echo.
echo Agent stopped.
pause
