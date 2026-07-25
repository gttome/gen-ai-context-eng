# Handoff

## Overview
This package is Regression Watchtower v15.0.0. It builds on the v12 learner-first baseline and focuses on small-screen readability and mission-flow polish for knowledge workers.

## What changed in this iteration
- increased mobile typography and vertical spacing for easier reading on phones
- made the mission jump bar sticky on small screens so section navigation stays available during long missions
- added clearer recommended-flow guidance in the workspace
- reordered packet reading on phones so the baseline appears before the candidate result
- kept the core learning loop as launcher → workspace → debrief
- did not reintroduce verification workspace, replay analytics, persistence, or export tooling

## App purpose and user value
The app teaches learners how to protect a trusted baseline before accepting a candidate change. Users practice reviewing standing checks, interpreting what improved or weakened, choosing a release judgment, and naming a proportionate monitoring follow-up.

## Current scope included
- six authored scenarios across the core pack and optional challenge pack
- baseline vs candidate comparison
- standing-check review and scoring
- optional manual external-model comparison step for applicable scenarios
- debrief with strongest-practice walkthrough
- help and feedback pages

## Major assumptions
- The originally named base-description DOCX is still missing from the upload set, so app-specific grounding continues to come from the uploaded Regression Watchtower documentation package and refined blueprint.
- Theme persistence remains acceptable because it supports usability rather than build workflow.

## Architecture summary
The app is a static HTML/CSS/JS package. Scenario content is loaded from JSON packs. State is centralized in a lightweight store and kept in-memory for the active session. Domain logic stays split across comparison, scoring, debrief, external-analysis, scenario-validation, loader, and launcher-filtering concerns. The v15 pass stays intentionally light on logic changes and concentrates on layout, reading order, section navigation, and small-screen comfort.

## File / folder map
- `index.html` main learning surface with learner-first mission flow guidance
- `help.html` learner guidance
- `feedback.html` learner note surface
- `assets/css/styles.css` styling including v15 small-screen readability tuning
- `assets/js/app.js` bootstrap, shell wiring, and route focus management
- `assets/js/state/` state model and semantic actions
- `assets/js/domain/` comparison, coaching, debrief, loader, validation, external-analysis, launcher filtering
- `assets/js/metrics/` scoring logic
- `assets/js/ui/` rendering modules and helpers
- `assets/data/` registry, packs, glossary
- `project-documents/` continuation and QA docs

## Current data / content model
Scenario content is defined in the registry plus two pack files. Each scenario includes incident context, baseline result, candidate result, standing checks, scoring expectations, monitoring options, and debrief-support content. Standing checks are normalized with instructional defaults for interpretation prompts, strongest-practice reads, and common mistakes.

## Interaction model
1. User chooses a mission in the launcher.
2. User reviews incident, proposed change, baseline, and candidate result.
3. User uses interpretation help when a check feels ambiguous.
4. User optionally runs an external comparison step if the scenario includes it.
5. User reviews current signals.
6. User chooses Release, Hold, or Iterate and selects monitoring follow-up.
7. User completes the mission and studies the debrief.

## Persistence behavior
Only theme choice persists via `app_theme`. Run state does not persist across refresh or browser exit.

## Testing summary
This build passed module tests, local HTTP integration checks, syntax checks, and required-file checks. See `project-documents/testing.md`.

## Known issues
- No trustworthy browser-automation proof is included from this container environment.
- Real browser checks on Windows and GitHub Pages are still the best next release-hardening step.

## Recommended next iteration priorities
- Run real-browser UX/accessibility checks on Windows and GitHub Pages.
- Add new advanced scenarios only after the learner shell is browser-validated.
- Continue tuning the small-screen experience based on real learner use.

## Continue in a new chat
1. Upload only this ZIP.
2. Ask the next assistant to inspect `README.md`, `project-documents/handoff.md`, and `project-documents/testing.md` first.
3. Treat this ZIP as the source of truth unless new material is uploaded.
