# 11_Technical_Plan_v0.5.2.md
Date: 2026-02-25

## 1) Architecture (static, GitHub Pages–safe)
- `/docs/index.html` — UI shell
- `/docs/css/style.css` — shared color system + components
- `/docs/js/common.js` — shared features (version/env pills + theme persistence)
- `/docs/js/app.js` — Approach Switchboard logic (signals → scoring → recommendation + snapshots)
- `/docs/help.html`, `/docs/feedback.html` — stub pages

## 2) Data model (client-side)
- `SCENARIOS` (base weights)
- `SIGNALS` (toggle items aligned to Chapter 1 + weights)
- `APPROACHES` (title + next-step checklists)

## 3) State
- localStorage keys:
  - `app_theme`
  - `approach_switchboard_state_v1` (scenario + toggles)
  - `approach_switchboard_history_v1` (snapshot history, max 10)
  - `asw_tour_done_v1` (guided tour completed)
  - `asw_tour_suppress_v1` (don’t show tour again)

## 4) Snapshot format (export/import)
Each snapshot stores:
- id, createdAt
- scenario + toggles
- best approach + runner-up + confidence
- totals + scoreboard (for transparency)
- summaryText (export text)

## 5) Key design decisions
- Mobile-first, progressive enhancement: single-column on phones, two-column on larger screens
- No libraries (vanilla JS) to reduce risk and simplify deployment
- Transparent heuristics: scoreboard + decision trace

## 6) Risks and mitigations
- Heuristic tuning: learners can see trace/scoreboard; we can adjust weights in Iteration 3 if needed
- CSS `color-mix()` support: fallback available if older browsers show issues


## 7) Compare snapshots (new in v0.5.2)
- UI section in Recommendation panel to compare:
  - Current state vs snapshot
  - Snapshot vs snapshot
- Outputs:
  - Score delta table (Left / Right / Δ) for all approaches
  - Signal diff list (Left ON/OFF vs Right ON/OFF)
- Implementation:
  - `populateCompareSelects(history, state)` keeps dropdowns in sync with history changes
  - `renderCompareResults(leftSnap, rightSnap)` renders deltas and diffs


## 8) Onboarding UX (new in v0.5.2)
- **Mode**: `state.mode` stored in `approach_switchboard_state_v1` and applied to `<html data-mode>`
  - Simple hides `.advanced-only` blocks
  - Advanced hides `.simple-only` blocks
- **Demo stories**: `DEMOS` map in `app.js` applies scenario + toggles in one click
- **Why tooltips**: each signal has a “Why?” button that opens a modal (`infoOverlay`)
- **Guided tour**: first-run onboarding via `tourOverlay`, gated by localStorage keys
