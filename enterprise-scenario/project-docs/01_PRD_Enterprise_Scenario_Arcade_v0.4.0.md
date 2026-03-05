# PRD — Enterprise Scenario Arcade (v0.4.0.1)

## Purpose
A **mobile-first**, static HTML5 practice app for teaching **Context Engineering** with enterprise-style scenarios. Users assemble a context package (Role/Rules/Facts/Excerpts/Memory/Format/Request), draft a response, and receive scoring/audit feedback.

## Target users
- Knowledge workers learning context engineering patterns
- Trainers/facilitators running short practice loops

## Core loop
Pick station → pick scenario → assemble blocks → draft response → score → review audit → export

## Iteration 2 scope (delivered)
1. **Multiple scenarios per station** (scenario dropdown + Random)
2. **Granular audit + Evidence Map**
   - tags: E1/E2…, Facts/Memory, Assumption, Unsupported
   - excerpt usage + key-fact preservation signals
3. **Save/Load named runs**
   - local saved attempts with restore

## Non-goals
- No LLM calls, no server-side components
- No authentication or multi-user storage

## Data/storage
- Scenarios: `docs/data/scenarios.json`
- Local state: `localStorage` (session + run history + saved runs)

## Definition of done (release gate)
- Mobile QA scorecard passes required gates
- Works on GitHub Pages (static, relative paths)
- No secrets in client code


## Scenario catalog (v0.4.0)
- Total: 19 scenarios
- Support: 6
- HR: 6
- Ops: 7
