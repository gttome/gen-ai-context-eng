# Pattern Orchestrator Lab — Technical Architecture Blueprint (v1.3.0 distilled)

## Current applied direction
- static HTML/CSS/JS delivery
- mission data in `assets/data/`
- package composition in `assets/js/domain/`
- scoring in `assets/js/metrics/`
- wizard + walkthrough rendering in `assets/js/ui/`
- event/state orchestration in `assets/js/core/`

## Current iteration notes
This iteration favored UX simplification over deeper structural expansion. The most important architectural change was the consolidation of the external-model handoff into one combined prompt builder while keeping the module boundaries intact.


## v1.4.0 blueprint application note
The blueprint preference for explicit state and deterministic post-action consequences is applied by storing each analysis run as an attempt object in mission state. Comparison and session-summary views are derived in the UI layer from those attempt objects rather than from ad hoc DOM state.
