# One-Page Workflow Summary — RAG Snippet Surgeon — v0.3.0
**Date:** 2026-02-26

## Iteration loop (single-builder, MobAI-assisted)
1. **Select request type:** BUILD / DEBUG / ITERATE / RELEASE / DEPLOY-READY / HANDOFF-ONLY / DOCS-ONLY  
2. **Plan:** update PRD + Backlog (iteration-sized tasks)  
3. **Build:** generate complete files (no partial diffs)  
4. **Test:** run Mobile QA Scorecard gates + smoke tests  
5. **Package:** zip-first, update file manifest + release notes  
6. **Record:** write `project-docs/28_MobAI_Agent_Report_v0.3.0.md` (current request only)  
7. **Handoff:** update handoff + restart prompt

## Definition of Done (DoD)
- Mobile-first baseline works on phone portrait
- Cross-device checks completed (phone landscape, tablet, desktop, narrow desktop)
- No critical console errors
- Shared features present (version/env pills, theme persistence, help/feedback stubs)
- Docs present (PRD, backlog, QA scorecard, testing/debug, security, manifest)
- MobAI Agent Report present
