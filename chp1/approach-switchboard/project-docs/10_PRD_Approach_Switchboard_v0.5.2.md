# 10_PRD_Approach_Switchboard_v0.5.2.md
Date: 2026-02-25

## 1) Product summary
Approach Switchboard is a mobile-first, GitHub Pages–ready HTML5 learning app that helps knowledge workers decide whether they should use:
- Basic prompting
- Context engineering
- Retrieval (RAG)
- Fine-tuning (mentioned in the chapter; treated as advanced)

The decision logic is grounded in Chapter 1:
- “Signals that you need more than basic prompting”
- “Input-quality principle” (generic/wrong/inconsistent output)
- “Context window & tokens” (token budgeting: prune/summarize/retrieve/structure)

## 2) Target users
- Knowledge workers learning Context Engineering (Chapter 1)
- Facilitators/trainers demonstrating “which approach should I use?” decision-making

## 3) Problem
Learners over-index on “just write a better prompt,” even when the task actually needs grounding, memory/continuity, strict constraints, or token budgeting.

## 4) Goals
- Make Chapter 1 decision-making actionable and teachable
- Produce a concise recommendation + “what to do next” checklist
- Provide transparency (runner-up, scoreboard, decision trace) so learners can understand *why*

## 5) Non-goals
- Not a production-grade recommender system
- No backend, accounts, or telemetry
- No external retrieval/search integrations

## 6) MVP features (v0.5.2)
- Scenario selector
- Chapter-aligned signal toggles (including token overload + input-quality principle)
- **Mode selector** (Simple vs Advanced) to reduce overwhelm
- **Demo stories** (3 pre-filled examples)
- **“Why?” explanations** on each signal toggle
- **Guided tour** (first-run onboarding + manual Tour button)
- Recommendation card: approach + why + what-to-do-next
- Stress test (runner-up)
- Scoreboard (all approaches)
- Decision trace (top contributors to recommended score)
- Copy recommendation + Download .txt
- **Snapshots** (save up to 10 locally) + export/import history JSON
- Shared features: version/env pills, theme system, help/feedback stubs

## 7) Acceptance criteria
- Runs locally on Windows via `docs/start-server.bat`
- Works on GitHub Pages (relative paths only)
- Fully usable on phone portrait, phone landscape, tablet, desktop
- Keyboard navigation works; focus indicators visible; skip-link works
- Theme persists on refresh
- Recommendation updates immediately when toggles change
- Demo stories load and correctly set scenario + signals
- Simple/Advanced mode toggle hides/shows advanced tools without breaking state
- “Why?” opens an explanation modal without toggling the checkbox accidentally
- Guided tour runs on first use (unless suppressed) and can be launched via Tour button
- Snapshot save/load/export/import works without console errors

## 8) Constraints
- Static-only runtime (HTML/CSS/JS)
- No secrets in code
- Mobile-first UX is release-critical
- Zip-first + silent screen output workflow

## 9) Success signal (learning)
- Learner can explain why the app recommended a specific approach
- Learner can copy the checklist and apply it to a real prompt/context assembly


## 10) Iteration enhancements (v0.5.2)
- Compare snapshots: learners can compare two saved decisions (or current vs saved) to understand what signals drive recommendation changes.
- Improved learner clarity: tuned a small set of signal phrasing/weights.
