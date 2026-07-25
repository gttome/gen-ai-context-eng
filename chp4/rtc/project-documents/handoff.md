# Handoff — RTC v0.6.6

## What this iteration added
This iteration focused on making the current app more educational and easier to use without changing the core Chapter 4 mission structure:
- **Guided mode vs Professional mode** so first-time learners get more scaffolding and repeat users can work faster
- **step framing headers** that state the objective, evidence focus, and what a strong choice looks like
- **teach-back feedback** that explains why the selected option works or is weak and why the other options lose
- **stronger evidence linking** so cards relevant to the current step are visually highlighted
- **scenario debriefs** on the summary view
- **touch-first cleanup** for action bars, option cards, and small-phone layout
- **clean-start reset** that clears local session state and replay history
- **step-transition placement** that scrolls the viewport and focuses the first actionable control when the mission moves to a new step

## App purpose
Reliability Triage Console is a Chapter 4 learning application that teaches knowledge workers to diagnose reliability failures before editing, choose the smallest credible mitigation, and preserve the lesson with a regression check.

## Current scope
- 5 scenarios total
- guided / professional learning modes
- fixed bottom coach dock
- popup coach / impact / playbook panels
- replay analytics and trend visibility
- copy/download triage record actions
- local session persistence, local replay history, and a clean-start reset

## Major assumptions
- The app remains fully static for Windows local use and GitHub Pages deployment.
- External-model validation remains a manual copy/paste loop.
- Browser click-path automation remains limited by the current container environment.

## Architecture summary tied to the blueprint
- **Content-driven structure** remains intact: scenarios in `assets/data/scenarios.js` still drive evidence cards, checks, failure modes, mitigations, regression paths, and scenario debrief content.
- **Separation of concerns** remains aligned to the blueprint:
  - presentation: `assets/js/ui/render.js`
  - state/persistence: `assets/js/state/`
  - domain logic: `assets/js/domain/`
  - scoring/metrics: `assets/js/metrics/scoring.js`
  - content: `assets/data/`
- **State and persistence** were adapted to carry `uiMode` and support a full reset path that clears stored session/history state.
- **Metrics and coaching** remain centralized in `computeMetrics()` and now feed stronger inline impact bridges plus the dock.
- **Accessibility and mobile-first intent** remain core, with additional touch-size and narrow-phone tuning.

## Blueprint application notes
### Followed directly
- static modular front-end structure
- content-driven scenario architecture
- centralized scoring and metrics logic
- clear state separation
- mobile-first responsive intent
- continuation-ready docs inside `project-documents/`

### Adapted in this iteration
- instructional scaffolding is now mode-based instead of only panel-based
- evidence linking is handled through UI state and card emphasis rather than a separate insight pane
- teach-back feedback uses scenario-authored rationales rather than a separate answer-key overlay

### Deferred
- true browser click-path evidence across real devices remains deferred to the target environment
- richer accessibility audits beyond structural checks remain deferred

## File / folder map
- `index.html` — main console shell
- `help.html` / `feedback.html` — support pages
- `assets/css/styles.css` — responsive visual system and touch-first rules
- `assets/js/app.js` — event wiring and state transitions, including clean-start reset
- `assets/js/ui/render.js` — rendering, dock, modals, guided/professional mode UI, teach-back feedback
- `assets/js/state/` — persistence, session/history store, full reset helper
- `assets/js/domain/` — triage rules and record building
- `assets/js/metrics/scoring.js` — scoring and live coaching inputs
- `assets/data/scenarios.js` — all 5 scenarios
- `project-documents/` — handoff, QA, distilled source docs, artifacts
- `tests/render-smoke.mjs` — structural validation script

## Data / content model summary
Each scenario retains the same stable Chapter 4 schema and now also powers:
- inline teach-back feedback using authored rationales
- scenario debrief content on the summary view
- evidence-link highlighting based on step context

## Interaction model summary
- Learner progresses through a 7-step mission spine.
- Guided mode shows more rationale and inline correction support.
- Professional mode removes some explanatory density while keeping the same scoring and mission structure.
- Fixed bottom dock remains visible and shows live score change, compact trend visibility, and next-step coaching.
- Summary view now closes with a scenario debrief before replay/export actions.

## Persistence behavior
- session state is stored locally
- replay history is stored locally
- theme continues to use `app_theme`
- clean start clears the saved session and replay history and returns the app to a fresh default launch state

## Testing summary
- syntax checks: passed
- render-smoke: passed
- responsive CSS tuning: passed structurally
- real browser automation: still blocked by environment policy

## Known issues
1. True browser click-path QA still needs to happen outside this restricted container.
2. Real copy/download behavior still needs user-side validation in a normal Windows browser session.
3. GitHub Pages deployment should still be smoke-tested after upload.

## Recommended next iteration priorities
1. Run full manual browser/device QA in the real target environment.
2. Tune any remaining phone-specific density issues discovered there.
3. Decide whether Guided mode should gain a lighter misconception library or confidence-calibration step.

## Continue in a new chat
A future assistant should begin by reading:
1. `README.md`
2. `project-documents/handoff.md`
3. `project-documents/testing.md`
4. `project-documents/architecture-and-file-map.md`

Then inspect the app files directly. Treat this ZIP as the source of truth unless the user uploads newer RTC planning material.


## v0.6.6 Patch Note
- Fixed regression-step action-row usability issue where the fixed coach dock could sit on top of `Reset this step` and `Complete mission` on some viewport heights.
- Added dynamic dock-height measurement so bottom clearance matches the real rendered dock, not a rough estimate.
- Limited coach-dock hit areas so non-interactive dock surfaces do not block clicks intended for workspace controls underneath.


Patch note: v0.6.6 hardens the regression-step action row by making it sticky above the coach dock and raising its stacking context after the prior clearance-only fix proved insufficient in a real viewport.


## v0.6.6 patch
- Regression-step progression is now normalized through a single completion path.
- The primary CTA on the Regression step is now **Continue to summary** and routes directly to Summary while preserving attempt recording.


## v0.6.6 patch note
This patch hardens the regression-to-summary transition in two ways: a dedicated `advance-summary` action path and a capture-phase button handler for the regression-step primary button. It also adds cache-busting query strings to asset URLs so browsers are less likely to keep serving an older script after replacing the app folder with a newer ZIP build.
