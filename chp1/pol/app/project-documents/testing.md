# Pattern Orchestrator Lab — Testing

## Build
- Build: v1.5.2
- Date: 2026-03-17
- Environment: container static validation + syntax validation
- Scope: attempt history, comparison views, session summary, preserved prior wizard gating

## Executed tests

| ID | Test | Expected | Actual | Status | Notes |
|---|---|---|---|---|---|
| T-01 | JS syntax validation | Updated JS files parse cleanly | `node --check` passed for `app.js`, `store.js`, and `render.js` | Pass | Container execution |
| T-02 | Package structure | App package still includes required wizard, docs, and static assets | Required files remained present after updates | Pass | Verified in working tree before zip |
| T-03 | Attempt recording logic | An analysis action stores a structured attempt in mission state | `app.js` now records attempt objects through `store.addAttempt()` | Pass | Static code path review |
| T-04 | Step 6 comparison availability | Second analyzed attempt should unlock current-vs-previous comparison | `render.js` computes comparison from mission `attempts` and shows fallback text when only one attempt exists | Pass | Static feature validation |
| T-05 | Session summary availability | Sidebar and Step 6 should show session attempt totals and best score | `store.getSessionSummary()` added and rendered into `#sessionSummaryRoot` and Step 6 | Pass | Static feature validation |
| T-06 | Wizard gating regression | Step 6 should still depend on explicit Analyze action | No change removed the existing `missionState.analyzed` gate | Pass | Regression review |
| T-07 | Fresh-start regression | App should still reset to Step 1 on startup | `init()` still calls `store.resetAll()` and sets `currentStep = 1` | Pass | Regression review |

## Smoke summary
The v1.4.1 package adds the requested attempt-history learning layer without removing the prior wizard simplification. Static validation and syntax checks passed.

## Release readiness
Acceptable for the next iteration and for manual browser testing.

## Known test limitation
Live Chromium navigation remains blocked by administrator policy in this container, so a true click-through browser regression pass still needs to be executed outside this environment.


## v1.4.1 retry-history fix
- Verified the Step 6 action split in code: `Retry this mission` now calls `resetMission(... preserveHistory: true ...)` and `Start over completely` calls `resetMission(... preserveHistory: false ...)`.
- Verified Step 6 copy explains the difference so the learner can retry safely without guessing.
- Limitation: live browser click-through remains blocked in this container, so the final visual/button-path confirmation should still be run in a normal browser outside this environment.


## v1.5.2 score-explanation clarity update
- Advancing between wizard steps now scrolls the viewport back to the top of the wizard so the learner sees the start of the next step instead of landing mid-screen.

| Wizard step-change scroll reset | Moving from one step to the next should place the viewport at the top of the wizard content. | Patched `setStep()` to re-render then scroll the viewport to the wizard shell with sticky-topbar offset. | Pass | Addresses the user-reported Step 4 mid-screen landing issue. |

| T-11 | Score explanation reveal | Clicking **Why this scored this way** should reveal per-metric triggers, matched phrases, and penalties without overloading the default Step 6 view | Static validation confirmed the toggle button and trace cards render from `scoreResults.trace` | Pass | In-container validation |
| T-12 | Walkthrough first-open behavior | Walkthrough should auto-open only on a true first open, then remain closed on later opens unless the user clicks the Walkthrough button | Storage key was stabilized to `pol_walkthrough_seen` so later version bumps do not force the walkthrough open again | Pass | Logic validation |
| T-13 | Session summary title duplication | Session summary title should appear only once inside Step 6 | `sessionSummaryMarkup(false)` now suppresses the nested title in Step 6 while keeping the sidebar title | Pass | Static UI validation |
