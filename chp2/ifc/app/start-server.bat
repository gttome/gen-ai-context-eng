@echo off
cd /d "%~dp0"
echo Running local server from:
echo %cd%
echo.
echo Open this URL in your browser:
echo http://localhost:8000/
start http://localhost:8000/
python -m http.server 8000
