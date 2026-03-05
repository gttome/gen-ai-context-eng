# User Action Guide — Context Tetris — v0.3.5
**Date:** 2026-02-27

## What you have
- A **mobile-first** HTML/CSS/JS app in `/docs` (GitHub Pages publish folder).
- A Windows launcher: `docs/start-server.bat` (must stay next to `index.html`).

## Run locally (Windows)
1. Unzip
2. Open: `docs/`
3. Double-click: `start-server.bat`
4. Use: `http://localhost:8000/`

> Tip: If you were running an older version in another folder/tab, close it and reopen this version (or use Ctrl+F5 once).

## Start state (important)
- The app now starts **empty** (no task selected) so you always begin fresh.
- Pick a task card to load its required/recommended blocks.

## Play (how to use)
1. Pick a **Task Card**
2. Add blocks from the **Block Queue** into the **Context Window**
3. Reorder with **Up/Down** (priority ladder)
4. Keep tokens under capacity
5. Click **Score Pack** to see pass/fail + breakdown
6. Use **Apply Quick Fixes** when overloaded/missing essentials
7. Optional: save and replay runs from **Run History**

## Reset
- **Reset Pack** (main controls): clears the current Context Window + results, keeps the selected task.
- **Reset App** (top header): clears task selection + pack + results (fresh start). History is preserved unless you clear it.

## Tutorial Overlay
- Auto-opens the first time (per browser).
- Re-open anytime via the **Tutorial** button.

## Troubleshooting
- If you see stale JS behavior, hard refresh:
  - Windows: `Ctrl+F5`
  - Mac: `Cmd+Shift+R`
- If tasks don’t load, confirm you are using `start-server.bat` (not `file://`).
