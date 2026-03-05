# Backlog — Context Skeleton Studio

## Version
- **Current Version:** v0.6.0
- **Date:** 2026-02-25

## Prioritization Rules
- Prioritize items that improve core usability and release readiness
- Security and GitHub Pages compatibility outrank polish
- Mobile-first usability is release-critical
- One micro-iteration should include 1–3 items max

## Backlog Items

| ID | Title | Priority | Status | Type | Acceptance Check | Notes |
|---|---|---|---|---|---|---|
| B-001 | Build block editor UI and workflow selector | Done | Done | Feature | Blocks render and can be edited | Iteration 0 |
| B-002 | Add move up/down ordering controls | Done | Done | Feature | Block order updates in UI and export | Iteration 0 |
| B-003 | Add validation panel for required blocks + ordering | Done | Done | Feature | Validation messages show by workflow | Iteration 0 |
| B-004 | Add copy/export assembled context | Done | Done | Feature | Copy button + download `.txt` works | Iteration 0 |
| B-005 | Add save/load/clear draft (localStorage) | Done | Done | Feature | Draft restores after reload | Iteration 0 |
| B-006 | Improve in-app help text and examples | High | Done | UX | New users can complete first draft without docs | Iteration 1 |
| B-007 | Add “Context X-Ray” block labels in preview | Medium | Done | Feature | Preview/export headings clearly show block roles | Iteration 2 |
| B-008 | Add preset starter templates (Q&A / policy / incident) | High | Done | Feature | User can load starter text | Iteration 1 |
| B-009 | Add long-content warning and token-budget hints | Medium | Done | Feature | Warning appears above threshold | Iteration 1 |
| B-010 | Add keyboard-friendly navigation polish | Medium | Done | UX | Tab/shortcut flow and button labels improved | Iteration 2 |
| B-011 | Add lightweight test fixture page/data for manual regression | Low | Backlog | Tech | Regression testing easier | Optional |
| B-012 | Drag-and-drop ordering (replace move buttons) | Low | Backlog | UX | Optional enhancement | Defer until stable |
| B-013 | Scenario export/import JSON snapshots | Medium | Done | Feature | Save and restore reusable contexts | Iteration 2 |
| B-014 | Theming / visual polish pass | Medium | Done | UX | Modern palette and consistent styling | Iteration 5 |
| B-015 | Deploy + verify GitHub Pages live smoke test | High | Todo | Release | Pages URL passes smoke checklist + Mobile QA | User-run release gate |
| B-016 | Add regression fixture examples + one-click test load | Medium | Done | QA | Fixtures load and support repeatable smoke tests | Iteration 3 |
| B-017 | Add mobile quick-action bar (Validate/Copy/Download) | High | Done | UX | On phone, bottom bar works without scrolling | Iteration 4 |
| B-018 | Mobile-first touch + small-screen layout hardening | High | Done | UX | Tap targets, focus visibility, no layout overflow | Iteration 4 |
| B-019 | Add Mobile QA artifacts + gate integration | High | Done | QA | Scorecard exists and is required for release | Iteration 4 |
| B-020 | Add Light/Dark theme toggle with persistence | High | Done | Feature | Theme toggles and persists across reload | Iteration 5 |
| B-021 | Add Help + Feedback navigation stubs | Medium | Done | Feature | Help/Feedback links open placeholder pages | Iteration 5 |

## Suggested Next Iteration (post v0.6.0)
1. **B-015**: complete user-run GitHub Pages deploy + live verification (Local + Pages)
2. If live issues are found: run a deployment/debug micro-iteration to fix
3. Optional after B-015 passes:
   - B-011 additional regression fixtures
   - B-012 drag-and-drop ordering
