# PRD — Context Skeleton Studio

## Document Control
- **Project:** Context Skeleton Studio
- **Version:** v0.6.0
- **Date:** 2026-02-25
- **Owner:** User (final approver) + AI (drafting)

## Product Summary
Context Skeleton Studio is a static HTML5 app that helps a learner build a structured “context package” using editable blocks, validate completeness/order, and export the result for copy/paste use.

## Problem It Solves
Users understand context engineering concepts, but they need a **repeatable tool** to compose good context without forgetting required parts, burying constraints, or overloading the prompt with low-value text.

## Target User
- Non-software-engineer learning or practicing context engineering
- Solo builder iterating on prompt/context packages
- Anyone who wants a GitHub Pages-hosted teaching/demo tool

## Current Release Focus (v0.6.0 / Iteration 5)
**Theming + lightweight navigation stubs**
- Add **Dark Theme** + **Light Theme** toggle
- Apply a **modern color system** to both themes (consistent surfaces, borders, accents)
- Add **Help** and **Feedback** buttons that link to placeholder HTML pages

## MVP Goal
Ship a working static app that supports:
1. block editing
2. workflow-specific validation
3. ordering feedback
4. copy/export of assembled context
5. local save/load drafts
6. preset starters (Q&A / policy / incident)
7. in-app examples/help text
8. length/token-budget hints
9. Context X-Ray labels in preview/export
10. keyboard-friendly block movement + validate shortcut
11. JSON snapshot export/import for reusable scenarios
12. regression fixtures for repeatable smoke tests
13. environment badge to confirm Local vs GitHub Pages
14. mobile quick-action bar for Validate/Copy/Download
15. **theme toggle + modern color design**
16. **Help + Feedback links (stub pages for now)**

## In Scope (Current)
- Workflow selector: One-off / Reliability / Multi-turn / Strict structure
- Editable blocks with examples/hints
- Validation panel with missing/ordering warnings
- Order controls (move up/down)
- Keyboard shortcuts:
  - `Alt+Shift+↑/↓` to move blocks
  - `Ctrl+Enter` to validate
- Preset starter templates (Q&A / policy / incident)
- Length & estimated token hint (live)
- Context X-Ray labels toggle (preview/export readability)
- Export assembled context (copy + `.txt` download)
- Export/import `.json` scenario snapshots
- Save/load draft to localStorage
- Clear draft with confirmation
- Regression fixtures (one-click loads for smoke tests and demos)
- Sample snapshot files bundled in the package for import testing
- Environment badge (Local / GitHub Pages / File / Web)
- Mobile quick-action bar (Tools / Validate / Copy / Download on small screens)
- Mobile-first UX constraints (tap targets, no hover-only actions, focus visibility)
- **Theme toggle (Light/Dark) persisted in browser storage**
- **Modern theme palette (surfaces, borders, accents, focus ring) for both themes**
- **Help button** linking to `docs/help.html` (placeholder)
- **Feedback button** linking to `docs/feedback.html` (placeholder)

## Out of Scope (Still Deferred)
- Drag-and-drop block reordering
- Advanced scoring/rubrics
- Cloud sync or backend storage
- External APIs
- Rich text formatting
- Authentication
- PWA / Service Worker / Offline-first behavior (not required)

## User Stories
1. **As a learner**, I want to fill the standard context blocks so I can practice a consistent structure.
2. **As a user**, I want starter presets so I can build a useful draft quickly.
3. **As a user**, I want the app to warn me when I forgot a required block or my prompt is getting too long.
4. **As a user**, I want to export the final context package so I can paste it into another AI chat.
5. **As a user**, I want my draft saved locally so I can come back later.
6. **As a user**, I want JSON snapshots so I can reuse/share scenario setups between sessions.
7. **As a user**, I want one-click fixtures so I can repeat the same smoke tests locally and on GitHub Pages.
8. **As a mobile user**, I want to Validate/Copy/Download without scrolling through long panels.
9. **As a user**, I want a dark theme for comfort and readability in low-light settings.
10. **As a user**, I want Help/Feedback links so I can learn the app and send improvement ideas.

## Acceptance Criteria (v0.6.0)
### Core functional
- [ ] App loads locally via `docs/start-server.bat` on Windows (Python installed)
- [x] `index.html` loads with relative assets only
- [x] Header shows app version and environment badge
- [x] User can enter content into all core blocks
- [x] User can change block order using controls
- [x] `Alt+Shift+↑/↓` moves the focused block and keeps focus
- [x] `Ctrl+Enter` triggers validation
- [x] Validation identifies missing required blocks by selected workflow
- [x] User can load a preset and edit it
- [x] User can load a regression fixture and immediately see expected validation outcomes
- [x] User can export/import JSON snapshots
- [x] Sample snapshot files included in the package import successfully
- [x] No secrets/API keys exist in client-side files
- [ ] Manual local Windows smoke tests completed (user run)
- [ ] GitHub Pages live verification completed (user run)

### Theming + navigation stubs
- [x] Theme toggle exists and switches between Light and Dark
- [x] Theme choice persists in the browser (localStorage)
- [x] Modern palette is applied consistently across header, panels, inputs, and action bar
- [x] Help button navigates to `help.html` (placeholder)
- [x] Feedback button navigates to `feedback.html` (placeholder)
- [x] Help/Feedback pages can navigate back to the main app

### Mobile-first + cross-device gates
- [x] Viewport meta tag present and does **not** disable zoom
- [x] No core action requires hover (hover is enhancement only)
- [x] Visible focus indicator exists for keyboard navigation
- [x] Tap targets baseline: buttons/selects are usable on phone
- [x] On small screens, bottom action bar appears and can:
  - Validate
  - Copy
  - Download
  - Jump to Tools panel
- [ ] No horizontal scroll in standard UI on phone portrait (user verify)
- [ ] Cross-device matrix checks completed (phone portrait/landscape/tablet/desktop) (user verify)
- [ ] Mobile QA Scorecard has **no Blocker fails** (`project-docs/27_Mobile_QA_Scorecard_v0.6.md`)

## Constraints
- Windows local development
- GitHub Pages static hosting (`/docs`)
- `start-server.bat` must remain in the same folder as `index.html`
- ZIP-FIRST packaging for each response
- Silent screen output (packaged files not pasted into chat)
- Mobile-first UX must remain usable on phones, tablets, laptops, desktops

## Risks / Assumptions
### Risks
- Clipboard behavior may vary by browser
- Users may not have Python installed
- Imported JSON may be malformed (validated in-app)
- Length estimate is heuristic (~chars/4), not exact tokens
- Mobile browsers may behave differently with fixed bottom UI (varies by OS/browser)
- Dark theme contrast issues may appear on some displays (verify with Mobile QA Scorecard)

### Assumptions
- Python is available on Windows (or user will install it)
- GitHub Pages publish folder will be `/docs`
- localStorage is acceptable for non-sensitive draft data and theme preference
- Mobile QA is primarily user-run (manual cross-device checks)

## Version Notes
- **v0.6.0** = Dark theme + modern palette + Help/Feedback placeholder pages
- **v0.5.0** = Mobile-first hardening + Mobile QA artifacts + quick-action bar
- **v0.4.0** = Verification improvements (env badge + regression fixtures + bundled sample snapshots)
- **v0.3.0** = Iteration 2 clarity/usability release (Context X-Ray + keyboard polish + JSON snapshots)
- **v0.2.0** = Iteration 1 usability release (presets + examples + length/token hints)
- **v0.1.0** = Iteration 0 bootstrap package and starter app shell
