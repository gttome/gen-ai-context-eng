# Technical Plan — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## Architecture Overview
A static HTML5 application hosted as a GitHub Pages compatible site.

**Runtime constraints:**
- No server-side code at runtime
- All features must work as static assets under `/docs`

## Modules
### `/docs/index.html`
- Main app UI: editor blocks + tools panel + mobile action bar
- Header includes: version badge, environment badge, workflow picker, theme toggle, Help/Feedback links

### `/docs/help.html` and `/docs/feedback.html`
- Placeholder pages for navigation stubs
- Use same CSS and same theme preference behavior

### `/docs/css/style.css`
- Uses CSS variables for a modern palette
- Supports Light/Dark themes via `html[data-theme="light|dark"]`
- Includes mobile-first constraints (tap targets, action bar, reflow)

### `/docs/js/theme.js`
- Theme selection and persistence
- Applies theme immediately on load to reduce flash
- Persists theme in `localStorage` (`contextSkeletonStudioTheme`)
- Dispatches a `css-theme-changed` event for optional status messaging

### `/docs/js/data.js`
- Static configuration data: block templates, workflows, presets, fixtures

### `/docs/js/app.js`
- State management for blocks
- Validation rules by workflow
- Export (copy/download) + snapshot import/export
- Mobile quick-action bar bindings
- Receives `css-theme-changed` events and posts a short status message

## Data Storage
- Drafts stored in `localStorage` under `contextSkeletonStudioDraft_v1`
- Theme stored in `localStorage` under `contextSkeletonStudioTheme`
- No sensitive data supported or expected

## Dependency Policy
- Zero external runtime dependencies
- No CDN scripts
- No build step required (Mode A: No-build)

## Security Notes
- No secrets or tokens stored client-side
- No external network calls
- File import is limited to JSON snapshots and is validated before applying

## Cross-Device Design Strategy
- Phone portrait is baseline
- Responsive pattern:
  - Phone: single-column layout + bottom action bar
  - Desktop: split view with persistent tools panel
- Avoid hover-only UI
- Maintain visible focus indicators and keyboard reachability

## Testing Strategy
Use simplified QA gates (tracked in `project-docs/19_Test_QA_Checklist_v0.6.md`):
- Gate A: Smoke (always)
- Gate B: Mobile Release Gate (if UI changes)
- Gate C: Deploy Gate (GitHub Pages verification)

## Files Added/Modified (v0.6.0)
**Added**
- `docs/js/theme.js`
- `docs/help.html`
- `docs/feedback.html`

**Modified**
- `docs/index.html`
- `docs/css/style.css`
- `docs/js/app.js`
- `docs/js/data.js` (version string)

## Deployment
- GitHub Pages publish folder: `/docs`
- Local Windows run: `docs/start-server.bat`
