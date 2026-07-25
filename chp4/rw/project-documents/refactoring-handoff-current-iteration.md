# Refactoring Handoff — Current Iteration

## Quick wins
- Consolidate repeated launcher metadata formatting into a small presenter helper.
- Trim any remaining CSS that only supported removed verification/history surfaces.

## Medium refactors
- Separate scenario-card rendering from filter-toolbar rendering for easier UX iteration.
- Introduce a tiny view-model layer for debrief sections if scenario complexity grows.

## Why v9 matters structurally
This iteration intentionally removed subsystems that were no longer aligned to the product goal. The result is simpler state, fewer dependencies, fewer page surfaces, and cleaner continuation for educational work.
