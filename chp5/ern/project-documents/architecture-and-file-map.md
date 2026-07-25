# Architecture and file map

## Static structure
- `index.html` — main app shell
- `help.html` — learner help
- `feedback.html` — feedback page
- `assets/css/styles.css` — shared styling and premium iteration styles
- `assets/data/content.js` — scenarios, glossary, coach paths, scenario packs
- `assets/js/state/` — state creation, navigation, persistence
- `assets/js/domain/engine.js` — scoring, comparisons, debrief logic, replay logic, review-room logic
- `assets/js/ui/render.js` — screen rendering including launch, lane, review, report, executive, explore, branch
- `project-documents/` — handoff, distilled source docs, and test artifacts

## Iteration 13 additions
- scenario packs split into core and premium
- executive screen added to UI switch/render path
- new domain helpers for executive debrief, consequence simulation, review room, replay theater, and mastery journey
- CSS additions for premium scenario cards, review-room grid, and journey chips
