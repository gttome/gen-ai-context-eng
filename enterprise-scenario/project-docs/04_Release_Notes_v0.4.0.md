# Release Notes (v0.4.0)

## Patch: v0.4.0 (Audit Mode visibility + UX fix)
- Fix: **Audit Mode now auto-switches to the Response tab** so the audit panel is visible when toggled.
- Fix: Audit now audits the **current response textarea text** (not only the last scored response).
- UX: Removed confusing automatic `Saved.` toast spam; Audit toggle shows **Audit enabled/disabled** instead.
- Doc: Footer version string in `index.html` updated to match.

## Fixed
- X-Ray view no longer crashes (added missing `escapeReg` helper used for heading checks).

## Unchanged
- All Iteration 2 features from v0.3.0 remain as-is (scenario packs, Evidence Map, Saved Runs).

## Known limitations
- Evidence matching is heuristic (keyword overlap); it is a learning aid, not a compliance tool.

## v0.4.0
- Added 10 new business-domain scenarios across Support/HR/Ops (19 total).
- Updated scenarios.json; no code changes beyond version bump.
