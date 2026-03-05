# Dynamic Facts Firewall — PRD (v0.3.0)

## 1) Summary
Dynamic Facts Firewall is a mobile-first, GitHub Pages–compatible HTML5 mini-app that trains learners to keep **changing values** (dates/status/metrics) in a dedicated **Dynamic Facts** block—so prompts don’t rot over time.

## 2) Problem
Learners commonly hide time-varying facts inside **Role** or **Rules**, producing prompts that silently become incorrect when reality changes. This app makes that failure mode visible via:
- sorting practice
- Time Warp Replay (as-of date changes)
- contradiction + staleness signals

## 3) Target users
- Prompting learners practicing structured prompt blocks
- Trainers running short exercises (5–15 min)
- Self-study learners using a phone/tablet

## 4) Core workflow (Iteration 2 baseline)
1. Pick a scenario deck
2. Sort statement cards into bins: Role, Rules, Dynamic Facts, Grounding, Memory
3. Check → get score + mistake rationale
4. Change the Time Warp date → see staleness/contradiction signals
5. Optional: run **Challenge Mode** (timer + moves)
6. Optional: take the **Misconception Mini-Quiz**
7. Optional: open **Worksheet** and print for classroom use
8. Export paste-ready prompt blocks

## 5) Key features
### Sorting trainer
- Tap-to-select + tap-to-place on mobile (touch-first)
- Drag/drop enhancement for desktop
- Auto-place teaching action for mistakes
- Card inspector (why + hints)

### Time Warp Replay
- Date delta (Δ days)
- Stale-after signals (per dynamic card capture date)
- Validity windows (validFrom/validTo)
- Contradiction detection (multiple “current” values for an exclusive key)

### Iteration 2 additions
- Misconception callouts (dynamic facts placed into stable blocks)
- Mini-quiz (scenario-specific)
- Challenge mode (timer + moves)
- Printable worksheet page

### Local-only persistence
- Resume last run (explicit; app starts fresh by default)
- Run log + best scores (localStorage)
- Custom decks via Deck Builder (localStorage)

## 6) Non-goals
- No external API calls or secrets
- No server-side runtime; GitHub Pages static hosting only
- No user PII storage

## 7) UX requirements (mobile-first)
- Phone portrait first; no horizontal scrolling
- Tap targets ≥ 44px; keyboard focus visible
- Works in portrait + landscape, tablet, desktop
- Reduced motion respected (where applicable)

## 8) Definition of Done (release gates)
- Mobile QA Scorecard: required gates pass
- No console errors in normal flow
- GitHub Pages deploy test passes (relative paths, .nojekyll present)
