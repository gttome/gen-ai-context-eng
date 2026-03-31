# Signal-to-Noise Studio — v2.4.0

A static HTML5 learning application for practicing **Selection discipline** in context engineering. Learners sort evidence cards into include / summarize / retrieve later / omit, build a compact context package, test it with an external LLM, and inspect the result through rubric review, comparison, and Answer X-Ray.

## Run locally
- Double-click `start-server.bat`, or
- From the project folder run `python -m http.server 8000`
- Open `http://localhost:8000/`

## Persistence keys
- Theme: `app_theme`
- Session persistence: `sns_session_v15`
- Local feedback persistence: `sns_feedback_v15`

## v2.4.0 highlights
- Mission Director Map is more prominent during active runs.
- Resume Current Run now restores the last active mission stage instead of returning to launch.
- Launch-state Mission Director cards show the correct in-progress stage.
- Existing Answer X-Ray, review-impact bar, compact comparison review, and bonus-branch context remain in place.

## Main flow
1. Launch / Mission Director Map
2. Brief
3. Workspace
4. Export + paste-back
5. Comparison
6. Summary
7. Optional bonus-branch replay

## Notes
- Browser automation files are included, but Chromium execution may still be blocked in restricted environments.
- The app is fully static and uses local storage only.
