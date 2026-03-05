# 13_Iteration_Plan_v0.5.2.md
Date: 2026-02-25

## Iteration 3 goals (v0.5.2)
- Implement “Compare two snapshots” view (diff signals + score deltas)
- Tune weights/phrasing for learner clarity (Chapter 1 native wording)
- Standardize local run script using the uploaded `start-server.bat`

## Completed in this package
- Compare snapshots UI (Current state vs any saved snapshot, or snapshot vs snapshot)
- Score delta table (Left / Right / Δ) across all approaches
- Signal diff list (Left ON/OFF vs Right ON/OFF)
- Weight/phrasing tuning for common “generic/wrong/too-large context” signals
- Start-server standardized to uploaded script

## Next iteration (optional)
- Iterate weights based on real learner feedback (small, testable changes)
- Improve compare view with “why the recommendation flipped” summary line

## Release gates
- Mobile QA Scorecard: no Blockers
- GitHub Pages deployment smoke test (B-015)


## Iteration 5 (next candidate)
- Close B-015: GitHub Pages live verification (clipboard/download behavior on mobile)
- Add “Recommended prompt skeleton” output button (paste-ready)
