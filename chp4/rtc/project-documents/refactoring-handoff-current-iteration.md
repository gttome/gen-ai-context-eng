# Refactoring Handoff — Current Iteration (v0.6.3)

## Quick wins
- Break `render.js` into smaller UI modules if the next iteration adds more step-specific logic.
- Move step metadata into a separate config file if the guided/professional split deepens.
- Add a small helper module for teach-back generation to keep the renderer thinner.

## Deeper structural refactors
- Consider a lightweight component-oriented rendering pattern if more popup sheets or glossary chips are added.
- Consider explicit UI-state selectors for evidence-link highlighting if scenario logic gets more granular.

## Priority
- Medium. The current build is stable enough to continue, but the renderer is now the densest file in the project.
