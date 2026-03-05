# Release Notes — v0.5.0 (Iteration 4)

## Added
- Scenario Builder (local-only)
- Block-level line diffs (Compare)
- Export Bundle (.json)
- Trend guardrails when test sets change

## Changed
- Storage key bumped to `iter_lab_run_v0_5` with legacy migration from v0_4+
- Iterations now carry a `testSetHash` used for trend segmentation

## Fixed
- Reduced risk of “apples-to-oranges” trend interpretation by warning on test-set changes.
