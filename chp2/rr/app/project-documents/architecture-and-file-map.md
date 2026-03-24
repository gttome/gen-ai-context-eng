# Architecture and File Map — v1.5.0

## Key additions in this iteration
- `assets/data/scenarios.json` / `scenarios.js`: expanded from 3 to 5 scenarios and now includes `coaching.failureGuidance`, `coaching.changeGuidance`, and `coaching.exploreGuidance` objects.
- `assets/js/ui/render.js`: diagnosis, change, takeaway, and explore sections now render scenario-specific teaching notes.
- `assets/js/metrics/metrics.js`: coach message now reads scenario coaching metadata so the sidebar guidance is less generic.
- `assets/js/app.js`: optional learning-check announcements are now label-driven rather than hard-coded to one scenario shape.
