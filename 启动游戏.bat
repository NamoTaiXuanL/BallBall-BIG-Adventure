@echo off
echo Starting Ball Adventure Game...
echo Opening game in browser...

:: Try to open with default browser first
start "" "index.html"

:: If Python is available, start local server
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting local server at http://localhost:8000
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:8000"
    python -m http.server 8000
) else (
    echo Python not found, opened with file:// protocol
    echo Game should open in your default browser
)

pause