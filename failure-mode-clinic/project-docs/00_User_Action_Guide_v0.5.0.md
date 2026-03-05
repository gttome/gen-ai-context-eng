# User Action Guide — Failure Mode Clinic v0.5.0

## Run locally on Windows
1. Unzip this release.
2. Open the `docs/` folder.
3. Double-click `start-server.bat`.
4. Open the localhost URL it prints.

## Use the app
### Clinic (main flow)
1. Pick/load a case (Library → Load in Clinic).
2. Diagnose: select Symptom / Cause / Fix → **Score**.
3. Generate fix: **Generate fix** → review blocks + diff.
4. Apply the fix in your real prompt/context (outside the app).
5. Verify: click **Verify fix** → paste the improved output → check rubric → **Save verification**.

### History
- Click **History** (top-right in Clinic) to:
  - view recent attempts
  - export history JSON
  - export a single attempt JSON

### Builder / Wizard
- Builder → **Open Wizard** to create a new case (stored in My Pack).
- Library → Manage packs / import / export packs (local only).

### Reset
- **Reset app** clears: progress, stats, user packs, and attempt history in this browser.

## GitHub Pages
- Publish from `/docs` (static hosting).
- If you see an older UI/version, hard refresh (Ctrl+F5) and confirm the pill shows **v0.5.0**.
