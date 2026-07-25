@echo off
setlocal ENABLEEXTENSIONS

:: ==========================================
:: Enterprise Readiness Navigator local server
:: ==========================================
set "PORT=5531"
set "CACHE_BUSTER=%RANDOM%%RANDOM%"

:: Always serve from the folder that contains this BAT file.
pushd "%~dp0"

:: Find Python.
where py >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=py"
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Python 3 was not found.
        echo Install Python 3 and make sure either "py" or "python" is available in PATH.
        echo.
        popd
        pause
        exit /b 1
    )
    set "PYTHON_CMD=python"
)

set "APP_URL=http://127.0.0.1:%PORT%/index.html?v=%CACHE_BUSTER%"
set "HEALTH_URL=http://127.0.0.1:%PORT%/index.html"

echo.
echo ==========================================
echo  Enterprise Readiness Navigator Server
echo  Root: %CD%
echo  URL : %APP_URL%
echo ==========================================
echo.
echo Starting the HTTP server. The browser will open only after the server responds.
echo Keep this window open while using the app. Press Ctrl+C to stop the server.
echo.

:: Wait until the HTTP server is actually reachable before opening the browser.
:: This removes the launch race that can otherwise produce a blank browser page.
start "" /B powershell.exe -NoProfile -WindowStyle Hidden -Command ^
  "$url='%APP_URL%'; $health='%HEALTH_URL%'; for($i=0; $i -lt 40; $i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri $health -TimeoutSec 1; if($r.StatusCode -eq 200){ Start-Process $url; exit 0 } } catch {}; Start-Sleep -Milliseconds 250 }; Start-Process $url"

:: Run the server in the foreground so request logs and server errors remain visible.
%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1

if errorlevel 1 (
    echo.
    echo ERROR: The local server stopped or could not start.
    echo A common cause is that port %PORT% is already in use.
)

echo.
echo Server stopped.
popd
pause
endlocal
