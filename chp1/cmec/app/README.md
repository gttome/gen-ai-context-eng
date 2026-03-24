# Context Engineering Mission Control

Version: v1.1.8  
Build ID: cemc-v1.1.8

## What this package contains

This ZIP-first package delivers a runnable static HTML5 learning application for **Chapter 1 – Foundations of AI Context Engineering** plus a continuation-ready `project-documents/` handoff set.

The product is intentionally **learner-first**:
- prepared weak packages instead of blank-page authoring
- guided repair moves instead of builder-style document creation
- live metrics and compare views instead of hidden scoring
- optional external-LLM run support instead of direct runtime model calls

## Core experience

The current iteration implements:
- a mission launcher with 3 Chapter 1 scenario families
- a mission flow that starts by exposing the weak package before prediction
- guided repair buttons plus direct component include/exclude controls grouped into current vs available blocks
- live metrics for signal quality, grounding, structure, continuity, overload risk, and mission readiness
- compare-first delta bars, radar view, and clearer cause-and-effect summaries
- a copy-ready package for manual external LLM runs plus paste-back support
- a deeper Explore More path with scenario-specific micro-drills for wrong evidence, too much context, and relevant-but-poorly-structured context
- a more visible Explore More call-to-action with guided preview text so optional drills are easier to find
- shared shell features: version pill, environment pill, theme toggle, Help page, Feedback page

## Run locally on Windows

1. Extract the ZIP.
2. Open the project folder.
3. Double-click `start-server.bat`.
4. Open `http://localhost:8000/` if the browser does not open automatically.

## Deploy to GitHub Pages

Use a standard static-site workflow. Upload the contents of this package to a GitHub repository and publish from the root or `/docs` depending on your preferred Pages configuration. See `project-documents/setup-run-deploy.md` for the detailed steps.

## Read these first for continuation

If this project is uploaded into a new chat, read these files first:
1. `project-documents/handoff.md`
2. `project-documents/testing.md`
3. `project-documents/architecture-and-file-map.md`
4. `project-documents/handoff-startup-prompt.md`

## Project structure

- `index.html` – main mission-control app
- `help.html` – user help and walkthrough
- `feedback.html` – local feedback capture page
- `assets/css/` – shared styling, charts, theme tokens, accessibility rules
- `assets/js/` – modular JavaScript split across state, domain, metrics, UI, and utilities
- `assets/data/` – content-driven scenario, glossary, metrics, and coaching assets
- `project-documents/` – continuation, QA, architecture, and source-pack Markdown updates
- `tests/` – smoke validation script and manual checklist support
- `start-server.bat` – Windows local launcher

## Notes

- File mode is detectable in the UI, but the tested local workflow is the included launcher.
- The application does not call an LLM directly. External runs are manual by design.
- The `project-documents/` folder intentionally includes source-pack Markdown updates so a future chat can continue with only this app package.
