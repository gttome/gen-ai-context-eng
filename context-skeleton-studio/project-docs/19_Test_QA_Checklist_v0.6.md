# Test / QA Checklist — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## A) Preflight
- [ ] Run `docs/start-server.bat` (Local)
- [ ] Header badges:
  - [ ] Version = v0.6.0
  - [ ] Environment = Local

## B) Smoke Tests (Core)
- [ ] Workflow selector loads options and changes validation behavior
- [ ] Blocks render in correct order and accept edits
- [ ] Move buttons reorder blocks correctly
- [ ] Keyboard shortcuts:
  - [ ] `Alt+Shift+↑/↓` moves blocks and preserves focus
  - [ ] `Ctrl+Enter` validates
- [ ] Validation panel shows:
  - [ ] missing required blocks (errors)
  - [ ] ordering hints (warnings)
- [ ] Presets:
  - [ ] Load preset → blocks filled → preview updates
- [ ] Fixtures:
  - [ ] Load fixture → expected validation outcomes appear

## C) Theme + Navigation Stubs (New in v0.6.0)
- [ ] Theme toggle:
  - [ ] Switch Light → Dark (visual change is obvious)
  - [ ] Switch Dark → Light
  - [ ] Refresh page and confirm theme preference persisted
- [ ] Help link opens `help.html`
- [ ] Feedback link opens `feedback.html`
- [ ] Help/Feedback pages can navigate back to the main app

## D) Export / Import
- [ ] Copy assembled context (may require browser permission)
- [ ] Download `.txt` works
- [ ] Export `.json` snapshot works (downloads file)
- [ ] Import `.json` snapshot works (using:
  - [ ] exported snapshot from above
  - [ ] bundled samples in `docs/assets/fixtures/`)

## E) Persistence
- [ ] Save Draft → reload page → Load Draft restores blocks
- [ ] Clear Draft removes content and saved draft

## F) Mobile-First + Cross-Device Checks (Required)
Use:
- `project-docs/26_Mobile_UX_Responsive_Checklist_v0.6.md`
- `project-docs/27_Mobile_QA_Scorecard_v0.6.md` (release gate)

### Cross-device test matrix (minimum)
- [ ] Phone portrait viewport
- [ ] Phone landscape viewport
- [ ] Tablet viewport
- [ ] Desktop viewport
- [ ] Narrow desktop window (resized)

### Mobile quick-action bar
- [ ] On narrow screens, bottom bar is visible
- [ ] Tools button scrolls to the right-side panel
- [ ] Validate / Copy / Download buttons work

### Mobile theme + header links
- [ ] Header links do not overflow or cause horizontal scrolling
- [ ] Theme toggle remains tappable and visible

## G) GitHub Pages Verification (B-015 Gate)
After deployment:
- [ ] Environment badge = GitHub Pages
- [ ] Repeat sections B–F on the live URL
