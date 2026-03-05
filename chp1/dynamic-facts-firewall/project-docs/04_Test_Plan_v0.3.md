# Test Plan (v0.3.0)

## Smoke tests
1. Load app locally (start-server.bat) → no console errors
2. Scenario select changes deck + resets placements
3. Tap-to-place: select card, tap bin → card moves
4. Check: score updates; incorrect cards highlight; mistakes list populated
5. Time Warp: change date → warning line updates
6. Export blocks: copy-to-clipboard works (or fallback)
7. Resume: hidden when no saved run; shows when a run exists; resumes correctly

## Iteration 2 tests
### Misconception callout
- Place a dynamic card into Role or Rules → callout appears
- Move it to Dynamic Facts → positive callout appears

### Challenge mode
- Enable Challenge mode (fresh run) → timer starts on first move
- Moves increment on each placement
- Check ends challenge and shows challenge summary

### Contradiction signals
- Place two cards with same exclusiveKey into Dynamic Facts
- Time Warp warning shows “Contradiction risk”

### Worksheet
- Open Worksheet button → new tab opens with scenario + date
- Print preview: table visible; header/actions hidden
- Toggle answer key → shows/hides content
