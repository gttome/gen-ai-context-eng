# Architecture and File Map — RTC v0.6.3

## Architecture overview
RTC remains a static, content-driven, mobile-first front end aligned to the RTC technical blueprint.

- `assets/data/scenarios.js` holds the scenario schema and authored rationale content.
- `assets/js/state/` manages session state, replay history, mode state, and persistence.
- `assets/js/domain/` holds deterministic triage rules and record-building helpers.
- `assets/js/metrics/scoring.js` computes the instructional score model and risk cues.
- `assets/js/ui/render.js` turns state + scenario content into the evidence panel, guided/professional workspace, dock, modals, debrief, and export-facing summary UI.
- `assets/css/styles.css` carries the responsive visual system, touch-first tuning, and dock styling.

## Blueprint mapping
- **Content-driven architecture:** preserved directly through scenario-authored data.
- **Separation of concerns:** preserved directly through state/domain/metrics/ui boundaries.
- **Deterministic updates:** preserved through centralized state changes and scoring recalculation.
- **Compare/delta visibility:** implemented in the fixed bottom dock and inline impact bridges.
- **Persistence/resume:** implemented through local session and replay history storage.
- **Accessibility/mobile-first:** supported through responsive rules, touch-target sizing, modal close hooks, and simpler guided framing.

## Major files
- `index.html` — app entry
- `help.html` — support page
- `feedback.html` — feedback page
- `assets/css/styles.css` — visual system and breakpoints
- `assets/js/app.js` — action handling and event wiring
- `assets/js/ui/render.js` — HTML rendering logic
- `assets/js/state/store.js` — app store and mission reset helpers
- `assets/js/state/persistence.js` — localStorage persistence helpers
- `assets/js/metrics/scoring.js` — metrics engine
- `assets/data/scenarios.js` — scenario content pack
- `project-documents/` — continuation and QA materials


## v0.6.3 Input Stability Patch

The app now captures active textarea/input context before input-driven rerenders and restores focus, selection, window scroll, and workspace-pane scroll immediately after the rerender. This prevents long-form fields such as the custom regression check and reflection notes from snapping the viewport back to the top while the learner types.
