# PRD — Iteration Lab (Application 8) — v0.5.0

## Problem
Knowledge workers iterating prompts often change multiple things at once, lack a stable test set, and lose track of what improved or regressed.

## Target user
A non-software-engineer building reliable prompts and context packages using an LLM, developing locally on Windows and deploying to GitHub Pages.

## Goals
- Teach and enforce a **Design → Test → Evaluate → Compare → Adjust** loop.
- Encourage **one-block discipline** (change one thing per iteration).
- Provide reliable tracking: per-test deltas, regressions, and trend visibility.
- Remain **static-site compatible** for GitHub Pages (no server runtime).
- Keep everything **mobile-first** and usable across phones/tablets/desktop.

## v0.5.0 additions (P0)
- **Scenario Builder (local-only):** create your own scenarios (baseline blocks + test set) without editing code files.
- **Block-level line diffs:** per-block line-by-line diff view in Compare for faster debugging of changes.
- **Export Bundle (.json):** a single downloadable artifact containing run JSON + iteration report + logs + templates + user scenarios.
- **Trend guardrails:** trend chart breaks segments and warns when test sets change (prevents apples-to-oranges trend reading).

## Non-goals
- No server-side storage, accounts, or collaboration.
- No automatic model calls from the browser by default.
- Not a full evaluation harness; it’s a lightweight discipline + tracking tool.

## Data & privacy
- All data stays local to the browser (localStorage).
- No secrets/tokens stored in client code.

## Definition of Done (Iteration 4)
- Scenario Builder creates scenarios and they appear in Scenario select.
- Compare tab shows line-diff output for changed blocks.
- Bundle export downloads a JSON file with required sections.
- Trend chart warns and breaks when test set changes.
- Mobile QA Scorecard passes required gates.
