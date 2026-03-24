# Refactoring Handoff — v1.5.0

## Quick wins
- Move the repeated scenario coaching access logic into shared helpers.
- Normalize scenario explore option ids if future content grows beyond the current pattern.

## Deeper refactors
- Split render.js into scenario summary, diagnosis, comparison, and takeaway modules if more scenarios are added.
- Add schema validation for scenario coaching objects before runtime render.
