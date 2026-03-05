# Security Checklist — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## Client-Side Security (Static App)
- [x] No secrets, tokens, or API keys in any client-side files
- [x] No external network calls required for core functionality
- [x] All paths are relative (GitHub Pages-safe)
- [x] LocalStorage usage is limited to:
  - drafts (`contextSkeletonStudioDraft_v1`) — non-sensitive text only
  - theme preference (`contextSkeletonStudioTheme`) — non-sensitive
- [x] File import is user-selected `.json` only (no automatic remote fetch)
- [x] Snapshot JSON is validated before being applied to the UI
- [x] Help/Feedback pages are static placeholders (no forms, no data collection)
- [x] No external JS/CDN dependencies are used
- [ ] User confirms there is no sensitive content stored in drafts when sharing screenshots/exported files

## Dependency / Supply-Chain Policy
- [x] Zero external runtime dependencies
- [x] No unpinned CDN scripts

## Abuse-Resistance Notes
- Import uses JSON parsing with schema checks; malformed files are rejected
- Clipboard copy is permission-gated by browser
