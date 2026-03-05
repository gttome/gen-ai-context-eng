# 27_Release_Notes_v0.5.2.md
Date: 2026-02-25

## Release summary
Patch release to fix a JavaScript syntax error that prevented the app from loading.

- Fixed: Removed a stray extra closing brace `}` in `docs/js/app.js` (threw `Uncaught SyntaxError: Unexpected token '}'`).
- No feature changes: retains v0.5.0 onboarding improvements (Demo Mode, Simple/Advanced, “Why?” explanations, Guided Tour).

## Fixed
- App load crash: `app.js` stray brace removed; app now starts without `Unexpected token '}'` syntax error.

## No changes
- Demo Mode (3 stories), Simple/Advanced mode, “Why?” signal explanations, and guided tour are unchanged from v0.5.0.
## Fixed
- Tour overlay no longer appears by default (CSS `.hidden` now reliably hides overlays).
- First-run tour now launches correctly and can be closed/advanced.
