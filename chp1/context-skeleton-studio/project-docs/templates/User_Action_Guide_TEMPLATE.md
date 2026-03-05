# User Action Guide / What-To-Do-Next (Template)

## Current Task Type
- Build / Debug / Iteration / Release / Deploy / Handoff

## If you are starting the project
1. Open the package folder.
2. Review `project-docs/15_PRD_v0.1.md` and `project-docs/18_Iteration_1_Plan_v0.1.md`.
3. Go to the `docs` folder and double-click `start-server.bat`.
4. In your browser, test the app at `http://localhost:8000`.
5. Record any issues and request the next iteration package.

## If you are debugging an error
1. Write the exact steps that cause the bug.
2. Capture expected vs actual behavior.
3. Re-run using `docs/start-server.bat`.
4. Share the error symptoms and request a debug package.
5. After receiving the package, retest and check `project-docs/19_Test_QA_Checklist_v0.1.md`.

## If you are moving to the next iteration/release
1. Review the backlog and choose the next 1–3 items.
2. Confirm the iteration goal.
3. Request the next iteration package.
4. Run local tests after it arrives.
5. Update release decision (ship / fix more).

## If you are preparing a GitHub Pages deployment
1. Confirm the deployment checklist is marked ready.
2. Push the package contents to your GitHub repo.
3. In repo settings, enable GitHub Pages from the `/docs` folder on your main branch.
4. Wait for the site URL to appear.
5. Open the live site and run the smoke tests.

## If you are creating a handoff package
1. Make sure release notes and file manifest are current.
2. Confirm the handoff document lists what works and next tasks.
3. Confirm this User Action Guide is updated for handoff.
4. Save the zip package with the latest version.
5. In a new chat, attach the zip and use the restart prompt from the handoff doc.
