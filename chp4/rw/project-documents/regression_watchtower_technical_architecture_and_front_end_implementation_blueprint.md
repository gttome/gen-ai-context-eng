# Regression Watchtower Technical Architecture and Front-End Implementation Blueprint

## Current interpretation
Regression Watchtower remains a static HTML/CSS/JS application with a content-driven architecture. Scenario packs, standing checks, glossary data, scoring signals, and strongest-practice guidance live in structured JSON and normalized domain logic rather than being hard-coded directly into the UI.

## Module responsibilities
- `state/` owns the semantic application state and actions.
- `domain/` owns comparison logic, scenario validation/loading, external-output analysis, debrief synthesis, and learner coaching guidance.
- `metrics/` owns centralized scoring and derived learning signals.
- `ui/` owns launcher, workspace, debrief, and shared rendering helpers.
- `platform/` owns runtime detection, theme application, and live-status announcements.

## Current blueprint notes
- Comparison-first behavior remains the architectural anchor.
- Active-run state is intentionally in-memory only; persistence is limited to theme choice.
- The current architecture includes a coaching guide layer plus shell-level focus management and section-jump navigation so the browser experience is easier to use without adding developer-only surfaces.
- Verification tooling, replay analytics, and export subsystems remain intentionally excluded from the learner build.
