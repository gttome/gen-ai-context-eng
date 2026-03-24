# Architecture and File Map

## Blueprint mapping summary

This build uses the **CEMC technical blueprint inside the uploaded ZIP** as the closest app-specific implementation guide and the uploaded **Lifecycle Navigator Studio blueprint** as a reusable architectural pattern source.

### Recommendations followed directly
- static-site architecture
- content/data separation
- module boundaries for state, domain, metrics, UI, and utilities
- semantic action-driven updates
- deterministic recalculation of consequence/metrics after meaningful actions
- compare-first teaching surfaces
- local persistence with localStorage
- mobile-first responsive layout
- reduced-motion-aware styling baseline

### Recommendations adapted
- narrower screen model than the full planning ambition
- smaller chart set than the broader blueprint catalog
- simplified state store instead of a more elaborate selector/router layer
- scenario content delivered through one runtime JS data module plus JSON mirrors
- rule-based coaching strips, debrief starters, and compare causality instead of a heavier explanation engine
- scenario-specific Explore More drills implemented as targeted change sets rather than a larger branching mission framework
- source-update document names normalized to the app-specific `cemc_*` pattern for future continuity

### Recommendations deferred
- richer debug/test hooks
- scenario query routes
- migration/version handling beyond lightweight snapshot storage
- more advanced telemetry and fixture coverage

## File map

### Entry and shell
- `index.html`  
  Loads the main app shell and module entrypoint.
- `help.html`  
  Plain-language walkthrough and troubleshooting page.
- `feedback.html`  
  Local note-capture page for iteration feedback.
- `README.md`  
  High-level run/deploy and continuation summary.
- `start-server.bat`  
  Windows local static-server launcher.

### Styling
- `assets/css/base.css`  
  foundation variables, typography, base elements
- `assets/css/layout.css`  
  layout grids, responsive structure, and reserved space for the fixed metrics dock
- `assets/css/components.css`  
  cards, buttons, pills, weak-package snapshots, coach strips, explore-drill cards, compare-output cards, hero contrast overrides
- `assets/css/charts.css`  
  delta bars, radar, ring, and mix-chart styling
- `assets/css/themes.css`  
  light-theme token overrides and refined light-surface support for new coaching/drill elements
- `assets/css/accessibility.css`  
  focus-visible treatment and reduced-motion handling

### Data
- `assets/data/app-data.js`  
  authoritative runtime content for the current build
- `assets/data/scenarios.json`  
  scenario mirror for continuation/refactoring, now including Explore More drill definitions
- `assets/data/glossary.json`
- `assets/data/metrics.json`
- `assets/data/coaching.json`

### State
- `assets/js/state/actions.js`  
  semantic action names and creators, including explore-drill loading
- `assets/js/state/store.js`  
  central store and dispatch/update flow
- `assets/js/state/persistence.js`  
  theme/session load-save helpers

### Domain logic
- `assets/js/domain/missionEngine.js`  
  scenario selection, state shaping, repair application, explore-drill application, stronger-state reveal, serialization/hydration
- `assets/js/domain/budgetEngine.js`  
  token-budget calculations
- `assets/js/domain/analysisEngine.js`  
  copy-ready package assembly and prepared-output selection
- `assets/js/domain/patternAssist.js`  
  pattern-lens coaching notes

### Metrics
- `assets/js/metrics/metricEngine.js`  
  deterministic metric calculations
- `assets/js/metrics/progressEngine.js`  
  core/optional progress calculations, now including active explore-drill progress
- `assets/js/metrics/readinessRules.js`  
  readiness maturity and coaching-note generation

### UI renderers
- `assets/js/ui/renderShell.js`  
  top shell and support links
- `assets/js/ui/renderLauncher.js`  
  launcher, resume-detail explanation, and mission selection
- `assets/js/ui/renderMission.js`  
  weak-package inspection, repair workspace, coach strips, Explore More drill cards, stronger collapsed Explore More CTA, mission debrief coaching, budget/resume clarity, bottom metrics dock
- `assets/js/ui/renderCompare.js`  
  compare workspace, causality summaries, change-trace cards, output tendency cards, copy/reveal controls
- `assets/js/ui/renderCharts.js`  
  chart render helpers

## State and flow summary
- launcher selects a scenario
- mission engine creates:
  - a weak baseline snapshot
  - a mutable current scenario snapshot
- repairs, manual include/exclude toggles, and explore-drill loads all mutate the current scenario through the same deterministic store path
- metrics recalculate after each meaningful change
- compare surfaces read from baseline vs current
- persistence serializes the current mission state into localStorage after render

## New coaching/compare model in this iteration
- each block can now render a three-part coach strip:
  - Why it matters
  - Risk to watch
  - Metric movement
- compare workspace now derives a narrative causality layer from block diffs between weak and current packages
- Explore More drills apply targeted block-change sets so learners can experience failure patterns beyond the core repair path

## Shared shell behavior
- Version, Environment, and Theme pills remain visible in the shell header
- Help and Feedback remain available from the shell
- live metrics remain fixed to the bottom during active missions
- launcher resume card now exposes saved-state meaning more explicitly
