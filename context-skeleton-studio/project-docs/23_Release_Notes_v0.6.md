# Release Notes — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## Summary
This release adds a **Dark theme**, modernizes the **visual color system** across the app, and adds lightweight **Help** and **Feedback** navigation stubs.

## What Changed
- Theming + visual polish:
  - Added Light/Dark theme toggle (persisted in browser storage)
  - Refreshed UI palette using CSS variables (surfaces, borders, accents, focus ring)
  - Header made sticky for easier access to controls on long pages
- Navigation stubs:
  - Added **Help** link to `help.html` (placeholder)
  - Added **Feedback** link to `feedback.html` (placeholder)
  - Added back-navigation between pages
- App wiring:
  - New `docs/js/theme.js` applies theme early and dispatches a theme-change event

## Known Issues / Limits
- Theme contrast is good by design, but should still be verified across devices (Mobile QA Scorecard)
- Clipboard copy depends on browser permissions (use Download `.txt` as fallback)

## Next Required Gate
- **B-015**: Deploy and verify on GitHub Pages (Local + live), including Mobile QA Scorecard with no Blocker failures
