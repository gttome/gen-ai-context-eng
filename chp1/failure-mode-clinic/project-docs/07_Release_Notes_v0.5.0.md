# Release Notes — Failure Mode Clinic v0.5.0

## v0.5.0 — Iteration 4 (2026-02-27)
### Added
- **Fix verification loop**: paste improved output + rubric checklist + save result
- **Attempt history**: view attempts, export attempt or full history JSON
- **Stats refinement**: verified passes tracked separately from diagnosis scoring

### Updated
- Reset clears attempt history in addition to state/packs

### Known limitations
- Verification rubric is checklist-based (no model evaluation)
- Large contexts can still make diffs slower on low-end devices
