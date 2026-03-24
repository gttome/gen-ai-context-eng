# Setup, Run, and Deploy

## Local Windows run steps

1. Extract the application ZIP to a normal local folder.
2. Open the extracted folder.
3. Double-click `start-server.bat`.
4. Confirm the command window shows:
   - the current local folder
   - `http://localhost:8000/`
5. The browser should open automatically. If it does not, open that URL manually.

## Why the launcher matters

The included launcher:
- runs from its own folder with `cd /d "%~dp0"`
- uses `python -m http.server 8000`
- opens the browser to the local URL
- reduces relative-path issues for a non-software-engineer workflow

## GitHub Pages deployment steps

1. Create or open a repository for the app.
2. Copy the extracted app files into the repository root.
3. Commit and push the files.
4. In repository settings, enable GitHub Pages from the root branch/folder you want to publish.
5. Wait for the site URL to become available.
6. Confirm:
   - main app loads
   - Help page loads
   - Feedback page loads
   - theme toggle persists
   - environment pill changes from Local to GitHub Pages

## Folder assumptions

This build assumes:
- root-level `index.html`
- static assets under `assets/`
- continuation docs under `project-documents/`
- Windows local use through the included batch launcher

## Troubleshooting

### Blank or broken app on first open
Use `start-server.bat` instead of double-clicking `index.html`.

### Theme does not persist
Check whether browser storage is enabled.

### Resume behavior looks stale
Use the launcher reset/clear session option or clear local storage manually.

### Continuing in a new chat
Upload only the app ZIP and start with `project-documents/handoff-startup-prompt.md`.

## Notes for future iterations

If the project later adds more advanced routing or multiple app screens, keep the current launcher and root conventions unless there is a strong reason to change them.
