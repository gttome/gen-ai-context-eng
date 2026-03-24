# Refactoring Handoff — Current Iteration

## Quick wins
1. Move support-page theme handling into a tiny shared utility to reduce duplication.
2. Add a lightweight selector layer so UI renderers receive pre-shaped display objects instead of raw state.
3. Convert the current recommended-repair buttons into state-aware buttons that visually indicate completion or redundancy.
4. Add field-level save controls for paste-back and debrief to make persistence cues more explicit.

## Medium-depth refactors
1. Split scenario rendering into smaller panel renderers so future complexity does not accumulate in one mission renderer.
2. Introduce a stable chart-data adapter layer between metric objects and chart renderers.
3. Version local session payloads explicitly and add a migration guard.
4. Separate compare/debrief workflow state from the core mission workspace state.

## Deeper structural refactors
1. Add a small router/query-param layer for deterministic test entry points and scenario shortcuts.
2. Add debug overlays or exported state snapshots for QA use in non-production builds.
3. Expand the content schema to support richer scenario authoring without bloating view code.

## Benefit and risk summary

### Highest-benefit, lowest-risk
- selector/view-model layer
- shared support-page theme utility
- state-aware repair buttons

### Higher-benefit, moderate-risk
- chart-data adapter layer
- versioned persistence
- scenario panel decomposition

### Delay unless scope expands
- richer routing
- debug overlays
- authoring-oriented content schema expansion
