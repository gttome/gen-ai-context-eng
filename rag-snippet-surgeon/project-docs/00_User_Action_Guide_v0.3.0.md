# User Action Guide — RAG Snippet Surgeon — v0.3.0
**Request type:** ITERATE (Iteration 2 feature delivery)  
**Date:** 2026-02-26

## Run locally (Windows)
1. Unzip the package.
2. Double-click `start-server.bat` (must be beside `index.html`).
3. Open `http://localhost:8000/`.

## Verify Iteration 2 features
1. Pick a question.
2. Select 2–6 excerpts and watch:
   - **Evidence Budget** meter updates
   - Noise meter updates
3. Enable **Scalpel Mode**, open **Scalpel**, then click **Auto-trim**, save.
4. Click **Export** (downloads a JSON session file).
5. Click **Import** and load the same JSON (state should restore).
6. Run **Simulate** and confirm:
   - Evidence Coverage renders
   - Score/why includes budget penalty if high

## If something fails
- Capture:
  - exact console error
  - steps to reproduce
  - browser + device mode (phone/desktop)
- Ask for: “DEBUG Iteration vv0.3.0: [error + repro]”
