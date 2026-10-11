@echo off
title NCC Website - OD Generator Server
echo ========================================================
echo        NCC SAIRAM - PYTHON OD GENERATOR SERVER
echo ========================================================
echo.
cd /d "%~dp0\OD GENERATOR"

if exist ".venv\Scripts\python.exe" (
    echo Starting OD Generator using virtual environment Python...
    ".venv\Scripts\python.exe" app.py
) else (
    echo Starting OD Generator using system Python...
    python app.py
)

pause
