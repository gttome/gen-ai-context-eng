# Testing

## Iteration / build
- Build ID: cemc-v1.1.8
- Application: Context Engineering Mission Control
- Test execution timestamp: 2026-03-16 05:55 UTC

## Environment tested
- Packaging root: local extracted project folder
- Logic/smoke execution: Node.js CLI
- Static inspection: Python + file inspection
- Intended runtime target: Windows local server and GitHub Pages
- Browser automation status in this environment: **Blocked** by administrator policy during attempted Chromium navigation to both `http://127.0.0.1:8000/index.html` and local `file:///` paths

## Test scope
This refinement pass covered:
- UI polish for narrower widths, stacked headers, and more stable package/compare layouts
- stronger end-of-mission coaching with Chapter 1 debrief starters
- richer compare causality traces that tie specific package changes to metric movement
- clearer, more visible Explore More entry point with a collapsed-state preview
- project-document source update renaming from `lifecycle_navigator_studio_*` to `cemc_*`
- preserved live-metrics dock behavior and deterministic metric movement
- shared shell rendering and required file completeness
- JavaScript syntax validity via module execution path

## Executed test cases

| ID | Test case | Expected result | Actual result | Status | Notes / evidence |
|---|---|---|---|---|---|
| T01 | Required application files exist | Root app files are present | `index.html`, `help.html`, `feedback.html`, `README.md`, `start-server.bat` present | Pass | See `tests/smoke/results.json` |
| T02 | Required project-documents files exist | Mandatory continuation docs are present | All required continuation docs found | Pass | See `tests/smoke/results.json` |
| T03 | Required Lifecycle Navigator Studio Markdown updates exist | All required source-update `.md` files are present | All 10 required source-update files found | Pass | See `tests/smoke/results.json` |
| T04 | Launcher coaching render | Launcher should still explain inspect → predict → repair | Explicit learner coaching still present | Pass | Deterministic render validation |
| T05 | Readiness improves for support scenario | Recommended repairs should improve readiness | Readiness improved from weak to repaired state | Pass | Deterministic smoke validation |
| T06 | Readiness improves for HR scenario | Recommended repairs should improve readiness | Readiness improved from weak to repaired state | Pass | Deterministic smoke validation |
| T07 | Readiness improves for incident scenario | Recommended repairs should improve readiness | Readiness improved from weak to repaired state | Pass | Deterministic smoke validation |
| T08 | Overload remains controlled after recommended repairs | Overload should drop or stay controlled for all scenarios | Overload dropped or stayed controlled across all three scenarios | Pass | Deterministic smoke validation |
| T09 | Weak-package step renders before prediction | Mission renderer should expose weak package before prediction | Weak package and coaching render before prediction for all scenarios | Pass | Deterministic render validation |
| T10 | Card-level coaching renders | Snapshot and repair cards should show why/risk/metric coaching | Coach-strip copy found in mission renderer for all scenarios | Pass | Deterministic render validation |
| T11 | Explore More drills render | Opening Explore More should reveal micro-drills | Drill cards and load buttons render for all scenarios | Pass | Deterministic render validation |
| T12 | Explore More CTA is obvious in collapsed state | Collapsed Explore More panel should advertise itself clearly | Primary CTA and preview guidance render for all scenarios | Pass | Deterministic render validation |
| T13 | Debrief coaching is stronger | Debrief area should provide Chapter 1 framing and sentence starters | Debrief coaching renders with guided starters in improved-state mission view | Pass | Deterministic render validation |
| T14 | Fixed metrics dock still renders | Active mission view should include fixed bottom metrics dock | Dock renderer still includes compressed titleline and metric row | Pass | Deterministic render validation |
| T15 | Compare workspace exposes copy/reveal controls | Compare workspace should still include action feedback and best-practice reveal | Controls and feedback render correctly | Pass | Deterministic render validation |
| T16 | Compare workspace explains causality | Compare workspace should explain what changed and why metrics moved | Causality summaries and change-trace cards render in improved-state compare view | Pass | Deterministic render validation |
| T17 | Shared shell rendering | Rendered shell should include Version, Environment, Help, Feedback | Shell render included shared pills and support links for all scenarios | Pass | Deterministic render smoke validation |
| T18 | Windows launcher content | Batch file should use relative-folder safety and open localhost:8000 | `cd /d "%~dp0"` and explicit `http://localhost:8000/` present | Pass | Static launcher inspection |
| T19 | Main HTML structure | Main page should load module entrypoint and ARIA live region | `assets/js/app.js` and `live-region` found | Pass | Static HTML inspection |
| T20 | Browser-driven runtime navigation smoke | Headless browser should open app and validate new UI interactions | Attempted with system Chromium, but navigation was blocked by administrator policy | Blocked | Limitation recorded explicitly; requires rerun in a less restricted environment |

## Smoke-test summary
- Passed: 19
- Partial Pass: 0
- Failed: 0
- Blocked: 1
- Not Run: 0

## Release-readiness statement
This refinement build is **acceptable for the next iteration** because:
- narrower-width layouts were tightened so the mission and compare surfaces stay more readable
- the debrief now coaches the learner to explain cause-and-effect instead of writing a vague recap
- the compare workspace now traces specific package changes to specific metric movement
- the collapsed Explore More state now advertises itself clearly enough to be discovered
- the source-update documents inside `project-documents/` now follow the requested `cemc_*` naming scheme
- deterministic scenario logic and metric movement remain stable across all three scenario families

The remaining gap is still **true browser-driven runtime validation** in an environment that permits navigation.

## Defects and issues discovered during testing
1. Browser-driven verification of scrolling, fixed positioning, and the new drill interactions is still blocked by environment policy.  
   - This remains a blocked validation path, not a hidden pass.
2. Compare causality is clearer now, but static deterministic validation cannot fully substitute for live user interaction review.  
   - Follow-up should happen in a browser-enabled environment.

## Follow-up tests needed
1. True browser-driven smoke pass:
   - confirm the bottom dock stays visible while scrolling long mission pages
   - confirm the dock does not cover compare buttons or the debrief area
   - confirm the drill-load action scrolls and highlights the package area correctly
2. Phone-class responsive pass to verify horizontal metric scrolling and touch ergonomics
3. Keyboard-only pass for focus order and reachability within the dock, coach strips, and drill cards
4. Manual contrast pass against WCAG targets for dock text, chips, drill cards, and compare summaries in both themes

## Evidence files
- `tests/smoke/results.json`
- `tests/smoke/results_v118.json`


## Incremental refinement note — v120
- Fixed light-theme contrast in the launcher resume panel so the text remains readable against the lighter success-callout surface.
- Validation path: static CSS/theme inspection and package diff review in this environment.
- Browser-rendered visual confirmation remains manually verifiable in a normal browser session.
