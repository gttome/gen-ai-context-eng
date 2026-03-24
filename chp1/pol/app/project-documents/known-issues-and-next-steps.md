# Known Issues and Next Steps — v1.5.2

## Known limitations
- Real browser click-through validation could not be completed in this container because Chromium navigation is blocked by administrator policy.
- Clipboard success for the Step 4 copy button still needs live confirmation outside this environment.
- The new score-explanation reveal still needs hands-on usability confirmation on desktop and mobile to ensure it feels helpful without adding clutter.

## Next steps
1. Run live desktop and mobile validation outside the container
2. Confirm the new **Why this scored this way** reveal is clear on real screens and refine wording if needed
3. Add optional retry-from-history loading so the learner can reopen a prior attempt into the editor
4. Add richer answer diff visualization beyond metric deltas and sentence coaching
5. Surface glossary help inline inside the wizard

## Current status summary
- attempt history, current-vs-previous comparison, current-vs-best comparison, what-changed panel, and session summary are implemented
- retry now preserves history, while **Start over completely** clears the mission and its attempt history
- advancing between steps scrolls back to the top of the wizard
- Step 6 now includes a toggleable score-explanation reveal that shows the exact rules, phrase matches, and penalties behind each metric
- walkthrough now auto-opens only the first time this app is opened in the browser unless the user explicitly reopens it
