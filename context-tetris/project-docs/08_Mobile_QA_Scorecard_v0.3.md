# Mobile QA Scorecard — v0.3.1
**Release Gate:** PASS/FAIL

## Required gates (PASS required)
- Viewport meta present ✅
- No horizontal scroll on phone portrait ✅
- Tap targets usable (buttons not cramped) ✅
- Works in phone landscape ✅
- Keyboard focus visible ✅
- Tutorial overlay usable on touch ✅
- No blocking errors in console (baseline) ✅
- Cache-busting prevents stale JS between versions ✅

## Smoke test steps
1. Open app on phone-width viewport
2. Complete tutorial steps (Next/Back/Skip/Esc)
3. Select 2 different tasks; ensure queue re-sorts by need
4. Pack blocks; score; confirm PASS/FAIL + breakdown renders
5. Save run; replay from history
