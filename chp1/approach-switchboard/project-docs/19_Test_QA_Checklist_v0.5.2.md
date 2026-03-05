# 19_Test_QA_Checklist_v0.5.2.md
Date: 2026-02-25

## Gate A — Local smoke (Windows)
- [ ] Unzip package
- [ ] Open `docs/` and run `start-server.bat`
- [ ] App loads at http://localhost:8000/
- [ ] Version pill shows `v0.5.2`
- [ ] Environment pill shows `Local`
- [ ] Theme toggle works and persists after refresh
- [ ] Mode switch works: Simple hides advanced tools; Advanced shows them
- [ ] Demo story buttons load a scenario and update recommendation
- [ ] “Why?” opens an info modal and does not toggle the checkbox accidentally
- [ ] Tour button launches guided tour
- [ ] First-run tour behavior: shows once unless suppressed
- [ ] Help page opens and Back returns
- [ ] Feedback page opens and Back returns
- [ ] Scenario selector changes recommendation
- [ ] Toggle changes recommendation live
- [ ] Runner-up section updates
- [ ] Scoreboard updates (4 rows)
- [ ] Decision trace updates
- [ ] Copy recommendation works
- [ ] Download `.txt` works
- [ ] Snapshot save works (history item appears)
- [ ] Snapshot load works (state restores)
- [ ] Snapshot copy works (from history item)
- [ ] History export `.json` downloads
- [ ] History import works (same file re-import OK)
- [ ] No console errors

## Gate B — Mobile release gate (minimum)
- [ ] Phone portrait: no horizontal scroll in core UI
- [ ] Phone landscape usable
- [ ] Tap targets usable (≥ 44px intent)
- [ ] Keyboard nav works; focus visible; skip link works

## Gate C — Deploy gate (GitHub Pages)
Complete: `project-docs/21_Deployment_Checklist_GitHubPages_v0.5.2.md`

## Patch validation
- [ ] Confirm no console error about `normalizeHistory` on load
- [ ] Save Snapshot works (adds an item)
- [ ] Export history JSON downloads
- [ ] Import the exported JSON file and confirm history list repopulates


## E) Compare Snapshots (new in v0.5.2)
- [ ] Save 2 snapshots with different toggles
- [ ] In “Compare snapshots”, select Left = Snapshot A, Right = Snapshot B → results show:
  - [ ] Score delta table populated (4 approaches)
  - [ ] At least one signal listed under “Signals changed”
- [ ] Set Left = Current state, Right = a snapshot → results render without error

## E) Tour / Onboarding
- [ ] App is not blocked by the tour overlay on first load unless auto-tour is enabled
- [ ] Tour button opens the tour and shows step text (e.g., “Tour (1/N): …”)
- [ ] Tour can be closed with ✕ / Skip / Done
- [ ] “Don’t show again” suppresses auto tour on future visits
