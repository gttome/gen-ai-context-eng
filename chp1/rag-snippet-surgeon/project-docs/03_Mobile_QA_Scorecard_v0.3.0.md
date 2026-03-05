# Mobile QA Scorecard — RAG Snippet Surgeon — v0.3.0
**Date:** 2026-02-26

## Required PASS gates (no exceptions)
- Viewport meta present and correct
- No horizontal scrolling at phone width
- Tap targets usable (primary buttons not cramped)
- Text readable on phone
- Theme toggle works and persists
- Keyboard navigation works for primary flows
- Visible focus indicator present
- No critical console errors
- Layout works in: phone portrait, phone landscape, tablet, desktop, narrow desktop window
- Shared features present: version/env pills, help/feedback stubs

## Iteration 2 feature checks (PASS/FAIL)
- Export creates a JSON file (downloads successfully)
- Import loads a JSON and restores:
  - selected question
  - selected excerpts
  - trimmed overrides
- Auto-trim produces non-empty trimmed text and updates token estimate
- Evidence Budget meter updates as excerpts are added/removed
- Score “why” reflects budget penalty when above target

## Test matrix
- Phone portrait (devtools)
- Phone landscape (devtools)
- Tablet (devtools)
- Desktop
- Narrow desktop window

## Result
- Status: **PENDING USER RUN**
- Notes: Record failures + repro steps if any gate fails.
