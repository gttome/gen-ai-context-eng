# handoff.md

## Build
Lifecycle Failure Clinic v26

## What this iteration is
This iteration simplifies the Mission Deck aggressively. The learner now gets only **2 stages** and finishes on a **simple in-deck completion screen** instead of being pushed into heavier post-mission stages.

## App purpose
Teach the Context Engineering Lifecycle as a diagnosis-and-repair system with minimal UI overhead. The learner enters a failing AI workflow, identifies what likely broke in one lifecycle phase, applies one repair move, sees what changed, compares the result to the strongest answer, and finishes the mission with a clear stop-or-continue choice.

## Current scope
- 3 enterprise cases grounded in Chapter 2 themes
- full seven-phase lifecycle, but only one repaired mission is required for first-run completion
- 2 macro stages:
  - Case Setup
  - Mission Deck
- Mission Deck uses 6 screens per phase:
  - Phase setup
  - Diagnose
  - Repair
  - Outcome
  - Learn
  - Complete
- left rail remains a compact case snapshot, mission map, and artifact view
- right rail remains support for current guidance, live results, system pulse, and notebook
- strongest-answer review remains on the Learn screen
- phase consequence map remains on the Outcome screen
- completion happens inside the deck, not in a separate stage
- theme toggle, help page, feedback page, local autosave, static-site architecture preserved

## Interaction loop
1. In **Case Setup**, choose one incident.
2. Enter **Mission Deck** automatically.
3. For each phase, move through exactly six screens in order.
4. After the first repaired mission, finish on the **Complete** screen.
5. Stop there or continue only if the learner explicitly chooses another optional phase.

## File map
- `index.html` — simplified Mission Deck app shell
- `help.html`, `feedback.html` — support pages
- `assets/styles.css` — mission-deck layout and refreshed modern color styling
- `assets/app.js` — scenario content plus simplified Mission Deck state/render logic
- `README.md` — local run guidance and version summary
- `start-server.bat` — Windows launcher

## Persistence
Run state is stored in localStorage using `lfc_state_v26`. Theme is stored using `app_theme`.

## Architectural notes
- The app remains static-site friendly and framework-free.
- Scenario content is still data-driven inside `assets/app.js`.
- v26 removes the heavier post-mission stage model from the learner-facing flow.
- The product now emphasizes **one mission, one learning loop, one simple finish state**.

## Remaining work
- Perform a full visual browser pass on desktop, tablet, and mobile.
- Tune any spacing after a real learner walkthrough.
- Decide whether removed advanced tools should stay retired or return later in a lighter form.

## New-chat continuation instructions
A future chat can continue from this ZIP alone.
Start by reading:
1. `README.md`
2. `project-documents/handoff.md`
3. `project-documents/testing.md`

Then inspect:
- `assets/app.js`
- `assets/styles.css`
- `index.html`

Important continuation note:
Treat this package as the full source of truth unless newer source material is uploaded. Preserve the static-site architecture and continuation-ready handoff/testing docs.


## v26 update
- Removed Discussion mode from the top-bar UI and from the active application logic.
- Removed remaining discussion-prompt rendering from the Mission Deck code path.
- Reworked the dark theme for stronger contrast across cards, tinted panels, buttons, chips, and supporting surfaces.
