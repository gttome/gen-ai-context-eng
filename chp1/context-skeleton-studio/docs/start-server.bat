@echo off
setlocal
cd /d "%~dp0"
set PORT=8000
echo Starting local server from: %CD%
echo URL: http://localhost:%PORT%/
start "" http://localhost:%PORT%/
python -m http.server %PORT%
endlocal
