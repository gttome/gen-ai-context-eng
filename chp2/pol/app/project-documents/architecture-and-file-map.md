# Architecture and File Map — v1.3.0

## Main structure
- `index.html` — application shell and walkthrough mount point
- `help.html` — simplified operating guide
- `feedback.html` — feedback capture page
- `assets/css/styles.css` — theme system, wizard styling, walkthrough overlay, sentence feedback cards
- `assets/data/config.js` — storage keys, metric labels, readiness bands
- `assets/data/missions.js` — four missions including the new mixed mission
- `assets/js/domain/package-composer.js` — builds the combined external prompt block used by Step 4
- `assets/js/core/app.js` — event handling, walkthrough state, analysis trigger, reset behavior
- `assets/js/ui/render.js` — wizard rendering, Step 4/5 instructional markup, Step 6 sentence feedback rendering
- `assets/js/metrics/scoring.js` — local scoring plus sentence-level feedback generation

## Blueprint mapping
- content-driven architecture: mission and config data remain in `assets/data/`
- explicit state/store behavior: mission state remains centralized in `store.js`; walkthrough state lives in `POLWizardState`
- centralized metric calculation: scoring remains fully inside `assets/js/metrics/scoring.js`
- compare/delta visibility: maintained via delta highlights in Step 6
- accessibility/responsiveness: walkthrough uses dialog semantics; existing responsive CSS remains in place

## Important implementation note
Step 4 now uses one combined prompt block instead of exposing internal package vs paste-back distinctions. This is an intentional UX simplification, not an accidental loss of flexibility.


## v1.4.1 architecture note
Attempt history is stored in each mission state (`attempts`, `lastAttemptId`, `bestAttemptId`). `app.js` records a structured attempt snapshot after each analysis. `render.js` now computes comparison views and session summary views from the stored attempt snapshots instead of relying on a single `scoreResults` object.


## v1.4.1 retry-state note
`assets/js/core/store.js` now supports two reset modes for mission state: a soft reset that preserves `attempts`, `bestAttemptId`, and `lastAttemptId`, and a hard reset that clears the mission completely. `assets/js/core/app.js` wires Retry this mission to the soft reset path and Start over completely to the hard reset path.


## v1.5.2 score-explanation clarity update
- Advancing between wizard steps now scrolls the viewport back to the top of the wizard so the learner sees the start of the next step instead of landing mid-screen.
