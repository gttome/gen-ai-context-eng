# Pattern Orchestrator Lab — Interaction and Screen Specification (v1.3.0 distilled)

## Current interaction model
The application is a six-step guided wizard:
1. Choose mission
2. Diagnose
3. Build package
4. Send to ChatGPT
5. Paste answer
6. Review coaching

## Key UX rules in the current build
- Step 4 uses one primary button: **Copy everything to send to ChatGPT**
- Step 5 explicitly tells the user to paste only ChatGPT’s answer
- Step 6 remains locked until the user clicks **Analyze pasted output**
- A first-run walkthrough explains the workflow on first open and can be reopened later
- Sentence-level feedback appears in Step 6 after analysis


## v1.4.0 interaction update
Step 6 now has four post-analysis learning regions: score/coaching, comparison cards, what-changed + attempt history, and session summary. The user no longer has to remember prior runs mentally.
