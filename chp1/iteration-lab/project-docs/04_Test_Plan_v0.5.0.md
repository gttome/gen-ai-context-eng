# Test Plan — v0.5.0

## Smoke tests
1. Launch (Windows): `docs/start-server.bat` starts server; app loads.
2. Start New: clears saved run without crashing.
3. Scenario Builder:
   - Create scenario with baseline blocks + 3 questions.
   - Scenario appears under “My Scenarios”.
   - Selecting it creates a fresh run with baseline blocks and test set.
4. Delete Scenario:
   - Delete only enabled for user scenario.
   - After delete, app falls back to first built-in scenario.
5. Compare Diff:
   - Create iteration 2 with a small line change in one block.
   - Compare I1 vs I2 shows before/after AND line diff.
6. Export Bundle:
   - Downloads JSON.
   - Contains: meta, run, report_md, iterationLog_md, userScenarios, testTemplates, eventLog.
7. Trend guardrails:
   - Score two iterations (trend line drawn).
   - Change test set and apply.
   - Score again; trend note warns + line segments break; square marker appears on changed segment.

## Regression checks
- Test Templates still save/load.
- Report copy/download still works.
- No console errors on normal flow.
