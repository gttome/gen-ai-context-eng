# Mobile QA Scorecard — Context Skeleton Studio (Strict Release Gate)

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## Rules
- **Result values:** Pass / Fail / N/A
- **Any Blocker Fail = release not ready**
- Major fails may be deferred only if explicitly documented in:
  - `project-docs/17_Backlog_v0.6.md`
  - `project-docs/23_Release_Notes_v0.6.md`
  - `project-docs/25_Handoff_Document_v0.6.md`

## Current Score (fill after testing)
- **Score:** ___ / 100
- **Blockers:** ___
- **Majors:** ___
- **Minors:** ___

> Tip: If you don’t want to score numerically, treat “Score” as a pass ratio: (Pass checks) / (Total checks excluding N/A) × 100.

---

## Scorecard Table

| Category | Check | Result | Notes | Severity | Fix Owner |
|---|---|---|---|---|---|
| Reflow & Layout | No horizontal scroll on phone portrait |  |  | Blocker |  |
| Reflow & Layout | Content reflows cleanly on narrow screens |  |  | Major |  |
| Reflow & Layout | Usable on phone landscape |  |  | Major |  |
| Reflow & Layout | Usable on resized desktop window |  |  | Major |  |
| Reflow & Layout | Header controls wrap cleanly (no overflow) |  |  | Major |  |
| Touch Usability | Primary controls are tap-friendly (size + spacing) |  |  | Blocker |  |
| Touch Usability | No accidental tap overlap |  |  | Major |  |
| Touch Usability | Core tasks possible without precision taps |  |  | Blocker |  |
| Keyboard & Focus | All controls reachable by keyboard |  |  | Blocker |  |
| Keyboard & Focus | Visible focus indicator present |  |  | Blocker |  |
| Keyboard & Focus | Focus order is logical |  |  | Major |  |
| Keyboard & Focus | No keyboard trap |  |  | Blocker |  |
| Hover Independence | No core action requires hover |  |  | Blocker |  |
| Hover Independence | Hover enhancements degrade gracefully on touch |  |  | Minor |  |
| Readability | Text readable on phone portrait |  |  | Blocker |  |
| Readability | Light theme contrast acceptable |  |  | Major |  |
| Readability | Dark theme contrast acceptable |  |  | Major |  |
| Readability | Zoom is not disabled |  |  | Blocker |  |
| Accessibility | Labels/accessible names for controls |  |  | Major |  |
| Reduced Motion | Respects reduced motion preference (if applicable) | N/A | Animations are minimal | Minor |  |
| Viewport Robustness | Viewport meta present and correct |  |  | Blocker |  |
| Viewport Robustness | Usable when mobile keyboard opens (textareas) |  |  | Major |  |
| Viewport Robustness | Orientation change does not break state/UI |  |  | Major |  |
| Performance | Initial load acceptable on phone viewport |  |  | Major |  |
| Performance | Interactions responsive on phone viewport |  |  | Major |  |
| Cross-device | Phone portrait pass |  |  | Blocker |  |
| Cross-device | Phone landscape pass |  |  | Major |  |
| Cross-device | Tablet pass |  |  | Major |  |
| Cross-device | Desktop/laptop pass |  |  | Major |  |

---

## Notes / Evidence
- Tested devices/viewports:
  - Phone portrait:
  - Phone landscape:
  - Tablet:
  - Desktop:
- Browsers tested:
- Issues logged to backlog IDs:
