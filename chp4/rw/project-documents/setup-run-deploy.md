# Setup, Run, and Deploy

## Local Windows run
1. Extract the ZIP.
2. Keep `start-server.bat` in the root next to `index.html`.
3. Double-click `start-server.bat`.
4. Open the local URL it prints.

## GitHub Pages deployment
1. Upload the project contents to a repository configured for GitHub Pages static hosting.
2. Preserve relative paths exactly.
3. After deployment, open `index.html`, `help.html`, and `feedback.html` from the deployed site and confirm they load correctly.

## Troubleshooting
- If the app shows a load error, confirm the `assets/data/` files are present and being served over HTTP.
- If theme toggle appears inconsistent, clear the browser `app_theme` key and reload.
- Because run persistence was removed intentionally, refresh will restart the active mission.
