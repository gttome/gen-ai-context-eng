# Setup, Run, and Deploy

## Local Windows run
1. Extract the ZIP.
2. Keep `start-server.bat` in the same folder as `index.html`.
3. Double-click `start-server.bat`.
4. Open `http://localhost:8000/` if needed.

## Manual alternative
Run:

```bash
python -m http.server 8000
```

## GitHub Pages deploy
1. Create a GitHub repository.
2. Upload the full project contents.
3. Enable GitHub Pages from the root branch.
4. Wait for the site URL to publish.

## Troubleshooting
- If the browser does not open automatically, paste `http://localhost:8000/` into the browser manually.
- If Python is unavailable on Windows, install Python and ensure it is on PATH.
- Clipboard behavior may vary in restricted browser contexts; manual copy is still possible from the package text box.
