# Testing & Debug Playbook — RAG Snippet Surgeon — v0.3.0
**Date:** 2026-02-26

## Smoke test (60 seconds)
1. Load app → no console error
2. Choose question → excerpt library appears
3. Select 2–6 excerpts → stats update
4. Simulate → grounding block + coverage render

## Iteration 2 tests
### Export
- Click Export → downloads JSON
- Open file → valid JSON

### Import
- Click Import → select JSON
- UI restores (question, selected, trims)
- Simulate works after import

### Auto-trim
- Enable Scalpel Mode
- Open Scalpel for an excerpt
- Click Auto-trim → text changes, shorter, still meaningful
- Save trimmed → card shows “trimmed” in meta

## Debug protocol
- Copy console error
- Note the exact click path and filters used
- State device mode (phone/desktop) + browser
