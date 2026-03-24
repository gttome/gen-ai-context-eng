# Pattern Orchestrator Lab — v1.5.2

Pattern Orchestrator Lab is a static HTML5 learning application aligned to **Chapter 1 — Foundations of AI Context Engineering**.

## What changed in this version
This build makes the experience more obvious to use.

The main flow is now:
1. Choose a mission
2. Diagnose the missing mechanism
3. Build the context package
4. Click **Copy everything to send to ChatGPT**
5. Paste only ChatGPT’s answer back
6. Review coaching and decide the next move

## Included features
- Four missions, including a new mixed-mechanism mission
- Wizard-based navigation with Back / Next behavior
- First-run walkthrough overlay shown only the first time this app is opened on the device/browser; after that use the Walkthrough button
- One-button ChatGPT handoff in Step 4
- Clearer Step 5 instructions
- Local scoring with coaching, next-best-move guidance, and sentence-level feedback
- Help and Feedback pages
- Full `project-documents/` handoff package
- `start-server.bat` for local Windows use

## Local run
1. Extract the ZIP.
2. Double-click `start-server.bat`.
3. Open `http://localhost:8000/` if the browser does not open automatically.

## Best first run
1. Start with **Support Downgrade**.
2. Follow the wizard one step at a time.
3. On Step 5, use **Load sample output** once if you want to learn the scoring flow before using an external LLM.
4. Retry the mission and run your own external LLM pass.

## Notes
- No backend is required.
- No live LLM APIs are called from the app.
- Theme and feedback are stored in local browser storage.
- Mission progress still resets on every new app load so the experience always starts fresh at Step 1.
- This version attempted browser automation validation, but Chromium page navigation is blocked by administrator policy in this container. The limitation is documented in `project-documents/testing.md`.


## What is new in v1.5.2
- Retry this mission now keeps attempt history so the next analyzed run can compare against prior attempts
- Start over completely clears the current mission and its attempt history
- attempt history is recorded every time you analyze a pasted answer
- Step 6 compares the current attempt to the previous and best attempt automatically
- the sidebar shows a live session summary so progress is visible across the run

- Step 6 now includes a **Why this scored this way** button that reveals the exact phrase matches, rules, and penalties behind each metric.
