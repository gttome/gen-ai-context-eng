# QA Checklist — v1.3.0

- [ ] Version pill shows v1.3.0
- [ ] App opens on Step 1 with a fresh mission state
- [ ] First-run walkthrough appears on first open
- [ ] Walkthrough can be reopened from the top bar
- [ ] Step 4 shows one primary button: **Copy everything to send to ChatGPT**
- [ ] Step 5 clearly explains what to paste and what not to paste
- [ ] Step 6 stays locked until **Analyze pasted output** is clicked
- [ ] Step 6 shows sentence-level feedback cards after analysis
- [ ] Contract Activation Exception mission appears in Step 1
- [ ] Theme toggle still works and persists
- [ ] Help and Feedback pages open correctly
- [ ] No obvious console errors in a real browser run


## v1.4.1 checks
- Analyze one mission twice and confirm Attempt History shows two entries
- Confirm Step 6 shows a current-vs-previous comparison after the second analysis
- Confirm Session Summary updates attempt count and best score


## v1.4.1 checks
- Run one mission to Step 6, click Retry this mission, complete a second analysis, and confirm Current vs previous attempt is populated.
- From Step 6, click Start over completely and confirm the mission attempt history is cleared.


## v1.5.2 score-explanation clarity update
- Advancing between wizard steps now scrolls the viewport back to the top of the wizard so the learner sees the start of the next step instead of landing mid-screen.
