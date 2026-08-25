@echo off
REM QuickShow ML Service - Quick Deployment Script for Windows

echo ========================================
echo QuickShow ML Recommendation Service
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python found: 
python --version
echo.

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found
    pause
    exit /b 1
)

echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed successfully
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found
    if exist ".env.example" (
        copy .env.example .env
        echo Created .env from .env.example
        echo Please update .env with your MongoDB connection string
        echo.
    ) else (
        echo Please create .env file with required variables
        pause
        exit /b 1
    )
)

echo ========================================
echo Starting ML Recommendation Service...
echo ========================================
echo.
echo Access the service at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the service
echo.

python main.py

pause
