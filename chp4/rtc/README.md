# Reliability Triage Console (v0.6.6)

Reliability Triage Console is a static HTML5 learning application for Chapter 4 — **Reliability, Failure Handling, and Measurement**. This build strengthens the teaching layer and simplifies moment-to-moment use by adding guided versus professional modes, step-objective framing, teach-back feedback for weaker options, stronger evidence linking, scenario debriefs, touch-first cleanup, and a true clean-start reset.

## What is included
- Runnable static application (`index.html`, `help.html`, `feedback.html`)
- Mobile-first CSS and modular JavaScript under `assets/`
- Five-scenario content pack in `assets/data/scenarios.js`
- Preferred Windows local launcher (`start-server.bat`)
- Continuation-ready handoff and QA docs in `project-documents/`
- Render-smoke test script and artifacts under `tests/` and `project-documents/test-artifacts/`

## Run locally on Windows
1. Put the project in a normal local folder.
2. Double-click `start-server.bat`.
3. The launcher opens the app in the default browser.
4. If `py` is unavailable, the launcher automatically falls back to `python`.

## Deploy to GitHub Pages
1. Upload the full folder contents to a GitHub repository.
2. In repository settings, enable GitHub Pages from the repository root on the default branch.
3. Wait for Pages to publish, then open the generated URL.

## Current scope
- Five guided Chapter 4 scenarios: missing grounding, format drift, stale context, trust-boundary override, and mixed-signal board summary triage
- Guided mode and Professional mode
- Step headers that explain the objective, evidence focus, and what a strong choice looks like
- Teach-back feedback showing why weaker options lose
- Stronger evidence-link highlighting during each step
- Scenario debrief on the summary view
- Fixed bottom mission coach dock with live score deltas and trend visibility
- Popup coaching, playbook, and impact detail panels
- Manual copy/paste validation flow
- Compare-against-strongest-practice summary view
- Exportable triage record
- Theme persistence, session persistence, replay history, and clean-start reset

## Testing notes
- Structural render-smoke checks were executed for the upgraded teaching and touch-first flows.
- Small-phone tuning was validated at the layout/render level through responsive artifacts and CSS checks.
- A fuller headless Chromium click-path pass remains blocked in this container environment. See `project-documents/testing.md` for the exact status.

## Continuation
For the fastest continuation path in a new chat, read:
1. `README.md`
2. `project-documents/handoff.md`
3. `project-documents/testing.md`
4. `project-documents/handoff-startup-prompt.md`


Patch note: v0.6.6 raises the workspace action row above the coach dock with a sticky container so the regression-step controls remain clickable on shorter viewports.
