# Architecture and File Map

## Overview
Regression Watchtower v15.0.0 remains a static HTML/CSS/JS learning app. The architecture is unchanged in its major module boundaries, but the learner-facing shell has been refined for small-screen readability and easier mission flow.

## Major files
- `index.html` main launcher/workspace/debrief shell
- `help.html` learner help surface
- `feedback.html` learner feedback surface
- `assets/css/styles.css` responsive layout, theme, components, and v15 mobile readability tuning
- `assets/js/app.js` bootstrapping, store subscription, global controls, route heading focus
- `assets/js/state/store.js` app version and in-memory state defaults
- `assets/js/state/actions.js` semantic learner actions
- `assets/js/domain/` comparison, coaching, debrief, validation, loading, catalog filtering, external analysis
- `assets/js/ui/launcherView.js` launcher filters and mission cards
- `assets/js/ui/workspaceView.js` packet, checks, signals, decision, coaching, external step
- `assets/js/ui/debriefView.js` outcome review and strongest-practice walkthrough

## Layout and flow notes
- The workspace now includes a clearer recommended-flow note.
- The mission jump bar becomes sticky on smaller screens so learners can move through long missions without losing orientation.
- On phones, the packet reading order is visually adjusted so the baseline appears before the candidate result.
- Scroll margins are increased for key sections so jump links land more cleanly.

## Data flow
1. `app.js` loads the registry, packs, and glossary through the scenario loader.
2. The store tracks launcher filters and the active run.
3. Render modules build the launcher, workspace, and debrief from store state plus scenario content.
4. Domain modules compute scoring, coaching cues, debrief content, and optional external-analysis results.

## Persistence
Only theme choice persists through `app_theme`. Learner run state stays in memory only.
