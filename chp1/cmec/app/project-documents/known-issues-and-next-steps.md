# Known Issues and Next Steps

## Current limitations
1. Browser-driven end-to-end smoke automation is still blocked by administrator policy in this environment, so runtime navigation evidence is weaker than ideal.
2. The fixed bottom metrics dock still needs a true runtime pass on phone-class screens to confirm horizontal scroll comfort, tap targets, safe-area behavior, and keyboard reachability.
3. Compare causality is meaningfully better now, but it is still rule-based rather than a richer explanation layer that maps every changed block to every metric shift with greater precision.
4. Persistence is lightweight and does not yet include versioned migration behavior beyond the serialized snapshot structure.
5. Explore More now has deeper drills, but the drill system is still compact rather than a full branching mission framework.

## Deferred items
- facilitator/workshop mode
- richer session-export or summary-export flows
- more advanced analytics hooks
- scenario query params / deterministic route hooks
- expanded accessibility announcements beyond the current baseline
- more scenario families after the current three are fully validated

## Recommended next iteration priorities
1. Run a true browser smoke pass where navigation is permitted, with special attention to the fixed bottom metrics dock and the new drill cards.
2. Perform a focused accessibility pass on keyboard flow, visible focus, contrast, and screen-reader announcements for coach strips, compare summaries, and drill actions.
3. Consider a compact/expanded compare mode if the compare workspace becomes too tall as more causal explanation is added.
4. Add a small non-production debug/test mode if future iterations need easier QA.
5. Harden persistence with explicit version migration if the saved-state shape changes further.

## Technical debt
- full rerender architecture is simple and maintainable at this scale, but more granular updates may help if scenario complexity grows
- support-page theming is lightweight and separate from the main store
- JSON mirrors exist, but runtime currently uses the JS data module directly for simplicity

## Content debt
- stronger scenario author notes could support future scenario creation
- more nuanced drill variants would improve replay value
- more detailed glossary/help cross-linking would deepen self-serve learning
