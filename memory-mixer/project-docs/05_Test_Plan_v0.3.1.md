# Test Plan — v0.3.1
**Request ID:** MM-ITER2-20260226  
**Date:** 2026-02-26

## Smoke tests
1. Load app → idle screen (scores blank, no drift banner)
2. New Run → Turn 1 appears with notes
3. Capture: Roll up / Pin / Retrieve actions work
4. History: save snapshot, open History modal, restore snapshot, diff A/B

## Retrieval search + tags
1. Add 3 retrieval notes
2. Add tags to two items
3. Search returns correct subset
4. Tag filter switches list correctly

## Conflicts
1. Add pinned fact: `Target date: 6 weeks`
2. In rolling summary add line: `Target date: 8 weeks`
3. Conflicts count > 0
4. Review modal shows conflict
5. Replace summary resolves conflict OR Update pinned resolves conflict

## Export/Import run JSON
1. Export while running → file downloads
2. Reset → app idle, saved run cleared
3. Import JSON → run restored with snapshots/tags/conflicts intact

## Regression
- Resume button appears only when a saved run exists
- Reset behavior differs for idle vs running (as designed)
