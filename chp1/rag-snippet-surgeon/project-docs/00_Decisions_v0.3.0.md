# Keep / Add / Merge / Drop Decisions — RAG Snippet Surgeon — v0.3.0
**Date:** 2026-02-26

## Keep
- No-build, static GitHub Pages-compatible architecture
- 2–6 excerpt discipline + noise meter concept
- Evidence Coverage panel (Iteration 1)
- Scalpel Mode (manual trimming)

## Add (Iteration 2)
- **Session Export/Import (JSON):** share/restore a selection + trims without rework
- **Auto-trim:** one-click suggestion that extracts the most relevant 1–2 sentences (based on question + required tags)
- **Evidence Budget meter:** explicit “Good/High/Too high” budget status + stricter scoring penalty for budget creep

## Merge
- Budget guidance is consolidated: token estimate + budget meter + score penalty now reinforce the same behavior.

## Drop / Defer
- Full run history timeline (defer to later—nice-to-have)
- External API integrations (defer—must remain static-site safe)
