# Mobile QA Scorecard (Strict Release Gate) — v0.3.1
**Request ID:** MM-ITER2-20260226  
**Date:** 2026-02-26

## Pass/Fail Gates (must pass)
1. **Phone portrait**: no horizontal scrolling; all primary actions reachable
2. **Phone landscape**: layout remains usable; modals readable and closable
3. **Tablet**: grid adapts; no overlap; tap targets remain comfortable
4. **Desktop**: keyboard navigation works; focus visible; no hover-only controls
5. **Accessibility**:
   - Skip link works
   - Buttons/inputs have labels
   - Modals are operable via keyboard + Escape closes
6. **GitHub Pages**:
   - Works as static site
   - Uses relative paths
7. **Run portability**:
   - Export Run JSON works
   - Import Run JSON restores run
8. **Conflicts flow**:
   - Conflicts count updates
   - Review modal lists conflicts and actions update state

## Notes
Failing any gate means the iteration is **not release-ready**.
