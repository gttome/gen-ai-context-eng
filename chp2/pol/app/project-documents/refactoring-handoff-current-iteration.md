# Refactoring Handoff — Current Iteration

## Quick wins
- move wizard step definitions into a shared constant file if more guided modes are added
- centralize repeated coaching text patterns for easier tuning
- add a small DOM helper layer if the UI grows again

## Deeper refactors
- support per-mission UI step memory so learners can leave and return mid-step
- separate review rendering into a dedicated module if sentence-level annotation is added
- create a mission-authoring schema validator for future content expansion

## Priority view
- High: review-step modularization if richer coaching is implemented
- Medium: extracted wizard schema
- Low: glossary reintegration into the main flow
