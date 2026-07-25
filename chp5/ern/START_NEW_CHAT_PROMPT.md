Use this ZIP as the **only required baseline** for the current Enterprise Readiness Navigator project.

Treat the package as the continuation-ready handoff for the latest learner-focused build of the app.

Before making changes, inspect at minimum:
1. `README.md`
2. `START_HERE.md`
3. `START_NEW_CHAT_PROMPT.md`
4. `project-documents/handoff.md`
5. `project-documents/testing.md`
6. `project-documents/known-issues-and-next-steps.md`
7. `project-documents/architecture-and-file-map.md`
8. `project-documents/setup-run-deploy.md`
9. the current app files in `assets/`, `index.html`, `help.html`, and `feedback.html`

Project rules to preserve:
- This is a **static HTML/CSS/JavaScript** app.
- No backend, no accounts, no live LLM dependency, and no server-side storage.
- Keep the core mission short, clear, and learner-centered.
- Do not add extra required steps unless explicitly asked.
- Keep user-facing language focused on the learner, not on internal product/version commentary.
- Preserve `start-server.bat` behavior unless a compatibility issue forces a narrowly documented change.
- Keep `project-documents/` as the authoritative documentation folder.
- Update `testing.md`, `handoff.md`, and the relevant project docs whenever the build changes.
- Deliver changes as a full updated ZIP package, not as on-screen code dumps.

Current app experience to preserve:
- short scenario-based readiness missions
- optional advanced scenarios
- coaching paths with different support levels
- stakeholder reactions
- replay story and progress guidance
- decision-ready summary and executive debrief without making the mission feel like work

When continuing the project:
- ground decisions in the files already inside this ZIP
- keep the experience streamlined and educational
- validate the updated build with the strongest feasible checks in the environment
- record what was tested, what passed, and what remains limited by the environment
