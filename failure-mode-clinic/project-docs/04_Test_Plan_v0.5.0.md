# Test Plan — Failure Mode Clinic v0.5.0

## Smoke (must pass)
1. Startup: loads without console errors; pill shows v0.5.0
2. Theme toggle: header + bottom nav both switch themes
3. Library: search + load case into Clinic
4. Diagnose: Score updates attempts + avg score
5. Generate fix: fixed blocks populate + diff renders
6. Verify fix: open Verify modal, paste output, check rubric, save
7. History: open History modal, view attempt details, export attempt/history
8. Reset: clears user packs + stats + history

## Cross-device
- Phone portrait + landscape
- Tablet
- Desktop + narrow window
- Keyboard navigation and focus states

## GitHub Pages
- Publish `/docs`
- Confirm assets are relative and load correctly
- Confirm caching workaround: querystring versioning works
