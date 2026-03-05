# Iteration Plan — Iteration 5 (v0.6.0)

## Version
- **Target Release:** v0.6.0
- **Date:** 2026-02-25

## Iteration Goal
Add **Dark Theme**, modernize the **visual color system** for both Light/Dark themes, and add lightweight **Help** and **Feedback** navigation stubs while preserving mobile-first usability.

## Scope (This Iteration)
### In
1. **Theme Toggle**
   - Light/Dark switch
   - Persist selection in localStorage
   - Apply theme immediately on page load

2. **Modern Palette**
   - CSS variables for surfaces/borders/text/accent/focus
   - Consistent styling across header, panels, inputs, action bar

3. **Help + Feedback Buttons**
   - Add buttons/links in header
   - Create placeholder pages: `help.html`, `feedback.html`
   - Provide navigation back to the main app

### Out
- No PWA / service worker / offline-first behavior
- No backend or external APIs

## Deliverables
- Updated UI (index)
- New `theme.js` helper
- New placeholder pages
- Updated documentation set (PRD, QA, Release Notes, Manifest, Handoff, User Action Guide)

## Acceptance Checks
### Gate A — Smoke
- App loads without console errors
- Theme toggle works and persists after reload
- Help and Feedback pages load and can return to the app
- Validate/Copy/Download/Tools actions still work

### Gate B — Mobile Release Gate (UI change)
- No horizontal scroll in phone portrait for core UI
- Tap targets remain usable
- Focus visibility remains present
- Mobile action bar remains usable

### Gate C — Deploy Gate (Deferred)
- GitHub Pages live verification remains pending until user runs B-015

## Implementation Notes
- Use `html[data-theme]` for theming
- Store theme under `contextSkeletonStudioTheme`
- Keep zero external dependencies

## Files Touched
- `docs/index.html`
- `docs/css/style.css`
- `docs/js/app.js`
- `docs/js/data.js`
- `docs/js/theme.js` (new)
- `docs/help.html` (new)
- `docs/feedback.html` (new)

## Risks
- Theme contrast can vary by display; verify with Mobile QA Scorecard
- Some browsers may restrict clipboard access; download remains fallback
