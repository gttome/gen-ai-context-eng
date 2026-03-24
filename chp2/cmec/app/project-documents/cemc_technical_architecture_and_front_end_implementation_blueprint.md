# Source Update — Technical Architecture and Front-End Implementation Blueprint

> Preserved filename; current meaning applies to CEMC.

## Architecture used directly
- static HTML/CSS/JS structure
- state/domain/metrics/UI separation
- semantic action flow
- centralized recalculation pipeline
- localStorage persistence
- educational chart renderers
- mobile-first layout

## Current mapping to code
- `assets/js/state/` → session actions, store, persistence
- `assets/js/domain/` → mission state shaping, budget logic, pattern assist, manual-run analysis
- `assets/js/metrics/` → metric calculation, progress, readiness/coaching
- `assets/js/ui/` → launcher, mission, compare, charts, shell
- `assets/data/` → scenario and glossary content

## Adaptations
- selector/router depth is lighter than the broader blueprint
- charts are HTML/SVG and deliberately small in number
- data is delivered through a runtime JS module with JSON mirrors

## Deferred blueprint items
- richer test hooks
- query-param scenario routing
- more advanced persistence migration strategy
