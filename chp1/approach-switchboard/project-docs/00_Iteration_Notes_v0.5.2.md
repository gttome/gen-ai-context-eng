# 00_Iteration_Notes_v0.5.2.md
Date: 2026-02-25

## What changed in v0.5.2
Patch release to fix a JavaScript syntax error that prevented the app from loading.

- Fixed: Removed a stray extra closing brace `}` in `docs/js/app.js` (threw `Uncaught SyntaxError: Unexpected token '}'`).
- No feature changes: retains v0.5.0 onboarding improvements (Demo Mode, Simple/Advanced, “Why?” explanations, Guided Tour).

## Why this patch existed
Some browsers stopped parsing `docs/js/app.js` at startup due to a syntax error. This patch restores a clean load.

## Next recommended action
Re-run Local Smoke (Gate A), then proceed to GitHub Pages live verification (B-015).

### Patch notes
- Fixed CSS specificity/order so `.hidden` actually hides `.overlay` elements.
- Enabled first-run auto tour using `shouldAutoTour()`.
