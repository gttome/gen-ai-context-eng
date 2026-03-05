# Handoff Package (v0.4.0.1)


- Patch: X-Ray crash fix (escapeReg).
## What this package is
Enterprise Scenario Arcade static site (mobile-first) for Windows local dev + GitHub Pages deploy.

## How to run
- `docs\start-server.bat` → opens `http://localhost:8000/`

## Key files
- App: `docs/index.html`, `docs/js/app.js`, `docs/css/style.css`
- Scenarios: `docs/data/scenarios.json`
- Docs: `project-docs/` (PRD, backlog, QA scorecard, release notes, prompt pack, agent report)

## State/storage
- Uses `localStorage` keys:
  - `esa_state_v0_3`
  - `esa_history_v0_3`
  - `esa_saved_runs_v0_3`

## Next iteration focus (recommended)
- Facilitator Mode + scenario author workflow


Update: Added 10 scenarios (v0.4.0). Verify scenario dropdown counts: Support=6, HR=6, Ops=7.
