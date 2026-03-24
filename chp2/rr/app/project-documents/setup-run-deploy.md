# Setup, Run, and Deploy

## Local Windows run
1. Extract the ZIP.
2. Keep `start-server.bat` in the same folder as `index.html`.
3. Double-click `start-server.bat`.
4. The batch file switches to its own folder, opens the browser to `http://localhost:8000/`, and runs `python -m http.server 8000`.

## Manual local run alternative
From the project root:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000/`.

## GitHub Pages deployment
1. Create or use a GitHub repository.
2. Upload the extracted project root.
3. Make sure `index.html` sits at the site root.
4. Enable GitHub Pages from the repository root branch/folder you want to publish.
5. Wait for the site to publish and confirm the environment pill shows `GitHub Pages`.

## Folder assumptions
- The project root is the published site root.
- All asset paths are relative and designed for static hosting.
- No backend services are required.

## Troubleshooting
### The page is blank
- Make sure you are running from `http://localhost:8000/` or a hosted site, not from a broken path.
- Confirm `assets/data/scenarios.json` exists.
- Open the browser console and confirm there are no fetch or syntax errors.

### Theme does not persist
- Check browser localStorage availability.
- Confirm `app_theme` is not blocked by privacy settings.

### App state looks stale
- Clear localStorage keys `rr_lab_state_v1_2` and `rr_lab_feedback_v1_2`.
- Reload the site.

### Environment pill is wrong
- File mode: opened directly from disk
- Local: localhost or 127.0.0.1
- GitHub Pages: hostname ends with `github.io`
- Web: any other hosted environment
