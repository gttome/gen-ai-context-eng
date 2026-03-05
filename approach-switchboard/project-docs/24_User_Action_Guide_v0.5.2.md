# 24_User_Action_Guide_v0.5.2.md
Date: 2026-02-25

## A) Run locally (Windows)
1. Unzip the package.
2. Open the `docs/` folder.
3. Double-click `start-server.bat`.
4. Open: http://localhost:8000/
5. Run: `project-docs/19_Test_QA_Checklist_v0.5.2.md`.

## B) Quick start inside the app
- If this is your first time, the **Guided Tour** should appear automatically (or tap **Tour** in the header).
- Start with **Simple** mode to reduce overwhelm; switch to **Advanced** for snapshots, compare, scoreboard, and decision trace.
- Tap a **Demo story** to auto-fill scenario + signals and see how recommendations change.
- Tap **Why?** on a signal to understand what it changes.

## B) Use snapshots
- Click **Save Snapshot** to store the current decision (max 10).
- Click **Load** to restore a snapshot.
- Click **Export History .json** to download snapshots.
- Click **Import History** to merge a previously exported file.
- Click **Clear** to remove all snapshots from this browser.

## C) Debugging
1. Reproduce the issue locally.
2. Note device/browser + environment pill (Local / GitHub Pages / File / Web).
3. Capture console errors if any.
4. Fix → retest → update docs (QA, release notes, manifest, handoff).

## D) Deploy (GitHub Pages)
Follow: `project-docs/21_Deployment_Checklist_GitHubPages_v0.5.2.md`.


## F) Compare snapshots (learning feature)
1. Save two snapshots with different toggles (use “Save Snapshot”).
2. Open “Compare snapshots” in the Recommendation panel.
3. Select Left and Right (or “Current state” vs a snapshot).
4. Review:
   - Score deltas (Δ) per approach
   - Signals changed list (exact toggles that flipped)
