# Mobile QA Scorecard (v0.4.0.1)

## Required gates (must pass)
- No horizontal scrolling in normal use (phone portrait)
- Tap targets ≥ 44px for primary controls
- Keyboard navigation + visible focus states
- Works in:
  - phone portrait + landscape
  - tablet
  - desktop
  - narrow desktop window

## Checks performed (implementation-level)
- Responsive layout uses flex/grid with wrapping
- No hover-only interactions
- Viewport meta tag present
- Local run via `start-server.bat` (relative paths)

## Notes
Re-run quick manual spot checks after any UI change (especially Workbench header, Score tab cards).
