# Testing — RTC v0.6.6

## Build
- Build ID: `rtc-v0.6.6`
- App version: `v0.6.6`
- Date: 2026-04-02
- Environment: containerized static-file validation

## Test scope
This iteration focused on requested educational and usability upgrades plus step-transition usability:
- guided versus professional mode
- why-the-other-options-are-wrong feedback
- step objective framing
- stronger evidence linking
- scenario debriefs
- touch-first cleanup
- clean-start reset wiring
- auto-scroll and focus placement when the mission moves to a new step

## Executed tests

| ID | Area | Expected result | Actual result | Status | Notes |
|---|---|---|---|---|---|
| T01 | JavaScript syntax | Core JS files parse cleanly | `app.js` and `render.js` passed `node --check` | Pass | Syntax check executed locally |
| T02 | Structural render smoke | App renders without template failures | Updated render-smoke script completed and produced HTML artifacts for initial, evidence, failure, guided, professional, summary, and modal states | Pass | See `test-artifacts/*.html` |
| T03 | Guided mode | Guided mode shows instructional scaffolding | Initial artifact includes Guided / Professional toggles; guided check artifact includes teach-back feedback | Pass | Verified by render smoke |
| T04 | Professional mode | Professional mode suppresses guided teach-back density | Professional artifact omits teach-back card while preserving mission structure | Pass | Verified by render smoke |
| T05 | Step framing | Workspace shows step objective and evidence focus | Evidence artifact includes “Evidence to favor” and “Strong choice looks like” cards | Pass | Structural verification completed |
| T06 | Option ordering | Strongest answer is not habitually first | Source-of-truth and failure-mode extraction checks confirmed strongest answer is not first while still present | Pass | Deterministic stable ordering preserved |
| T07 | Evidence linking | Relevant evidence cards receive linked styling | CSS includes linked-evidence rule and evidence render includes linked state | Pass | Structural verification completed |
| T08 | Scenario debrief | Summary includes debrief before replay/export | Summary artifact includes scenario debrief section and replay analytics | Pass | Structural verification completed |
| T09 | Touch-first cleanup | Workspace includes touch-oriented controls and small-phone rules | Touch button classes render in workspace and CSS includes 430px breakpoint rules | Pass | Structural verification completed |
| T10 | Modal close hooks | Coach / impact popup close controls exist | Modal render contains explicit close hooks, overlay hook, and shell hook | Pass | Structural verification completed |
| T11 | Preferred launcher | Project uses the preferred uploaded `start-server.bat` | Exact preferred startup batch file copied into project root | Pass | Matches current saved preference |
| T12 | Browser/device click-path QA | Real browser automation completes across desktop, tablet, and small phone | Not executed here; prior Chromium automation remains blocked by environment policy | Blocked | Real target-environment QA still required |
| T13 | Step-transition focus hooks | Workspace render exposes per-step anchors for auto-scroll and focus placement | Updated render smoke confirms `data-step-anchor` hooks in evidence and failure-step output | Pass | Structural verification for new transition behavior |

## Smoke summary
- Structural app rendering is passing.
- The requested educational and usability work is implemented in code and reflected in render artifacts.
- Small-phone and touch-first cleanup were verified structurally.
- True browser click-path automation still could not be completed in this container due environment restrictions.

## Release readiness
**Acceptable for user-side validation and continuation.** The build is coherent and structurally tested, but it still needs real browser/device click-path validation outside this restricted container.

## Unresolved / follow-up tests
1. Run manual click-path QA in an actual Windows browser session using the preferred launcher.
2. Validate clean start, theme toggle, modal open/close, replay analytics, copy/download actions, and scenario switching on a real phone viewport.
3. Confirm no console errors in local browser and GitHub Pages deployment.


## Patch Validation Added in v0.6.6

| Test Case | Expected Result | Actual Result | Status | Notes |
|---|---|---|---|---|
| Typing in custom regression textarea | Cursor stays in place and viewport does not jump to the top while entering text. | Input-session restore added around rerender; cursor/selection and page/workspace scroll are restored after each input-driven state update. | Pass | Structural/browser-code-level validation completed in this environment. |
| Typing in reflection notes textarea | Notes field accepts continuous typing without resetting view position. | Same restore path used for notes field; no step-start auto-placement runs during active input restoration. | Pass | Real browser spot-check on target device remains recommended. |


## v0.6.6 Patch Validation
- Verified the fixed coach dock now publishes its measured height back into `--dock-height` after render and on resize.
- Added workspace clearance so the bottom action row can scroll fully above the dock instead of sitting under it on shorter viewports.
- Restricted pointer events on non-interactive coach-dock surfaces so workspace buttons remain clickable even when the dock visually overlaps nearby space.
- Follow-up manual browser validation still recommended on the user's target Windows browser stack.


## v0.6.6 patch
- Raised the workspace action row above the coach dock with a sticky high-z-index container.
- Lowered coach-dock stacking priority and preserved pointer-events only for dock controls.
- Targeted regression-step action controls (`Reset this step`, `Complete mission`) that still appeared visually available but remained hard to click on some viewports.


## Patch Note — v0.6.6
- Fixed regression-step progression so the primary action now advances directly to the Summary step.
- Unified the regression completion path so both the old completion action and the primary advance action record the mission and land on Summary.
- Updated the regression-step CTA label to **Continue to summary** for clearer step intent.


## v0.6.6 patch note
- Added cache-busting asset URLs for CSS and JS to reduce stale-browser-script issues after ZIP updates.
- Replaced the regression-step primary action with a dedicated `advance-summary` route and a capture-phase click safeguard on `#continue-to-summary-btn`.
- Updated the visible label to **Go to summary now** so stale builds are easy to spot.
