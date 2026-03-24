@echo off
setlocal ENABLEEXTENSIONS

:: ================================
:: Config
:: ================================
set PORT=5500

:: Simple cache-busting value (changes every run)
set CACHE_BUSTER=%RANDOM%

:: ================================
:: Change to this script's directory
:: ================================
pushd "%~dp0"

echo.
echo ==========================================
echo  Local Exam App Server
echo  Root: %CD%
echo  URL : http://localhost:%PORT%/index.html?v=%CACHE_BUSTER%
echo ==========================================
echo.

:: ================================
:: Auto-open default browser at the HTTP URL
:: (IMPORTANT: this is NOT file:/// anymore)
:: ================================
start "" "http://localhost:%PORT%/index.html?v=%CACHE_BUSTER%"

:: ================================
:: Start simple Python HTTP server
:: Tries 'py' first, then 'python'
:: ================================
py -m http.server %PORT% --bind 127.0.0.1 2>nul
if errorlevel 1 (
    echo 'py' not found or failed, trying 'python'...
    python -m http.server %PORT% --bind 127.0.0.1
)

echo.
echo Server stopped.
popd
pause
endlocal
