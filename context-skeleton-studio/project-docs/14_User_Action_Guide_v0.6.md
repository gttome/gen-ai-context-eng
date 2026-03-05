# User Action Guide — Context Skeleton Studio

## Package Info
- **Version:** v0.6.0
- **Date:** 2026-02-25
- **What changed in this release:** Dark theme + modern palette + Help/Feedback placeholder pages
- **MobAI Agent Report:** `project-docs/28_MobAI_Agent_Report_v0.6.md`

---

## A) Run Locally (Windows)
1. Unzip the package.
2. Open `docs/`.
3. Double-click `start-server.bat`.
4. Your browser should open: `http://localhost:8000`
5. Confirm:
   - Header version badge = **v0.6.0**
   - Environment badge = **Local**
6. New in v0.6.0:
   - Use **Theme: Light/Dark** toggle in the header.
   - Use **Help** and **Feedback** links (placeholder pages).
7. Run:
   - `project-docs/19_Test_QA_Checklist_v0.6.md`
   - `project-docs/27_Mobile_QA_Scorecard_v0.6.md` (fill results)

### Mobile quick actions (phone/tablet)
- On small screens, a bottom action bar appears: **Tools / Validate / Copy / Download**
- Use **Tools** to jump to the right-side panel without scrolling

---

## B) Use the App (Core Flow)
1. Pick a **Workflow** (top right).
2. Optionally load a **Preset** or **Regression Fixture**.
3. Edit blocks in plain language.
4. Click **Validate** and fix missing/ordering warnings.
5. Export:
   - **Copy** to clipboard, or
   - **Download .txt**, or
   - **Export .json Snapshot** (reusable scenario)

---

## C) Debug / Fix an Issue
1. Reproduce the issue locally using `start-server.bat`.
2. If possible, reproduce using a **Regression Fixture** (right panel) to make it repeatable.
3. Note:
   - browser + OS
   - Local vs GitHub Pages environment badge
   - steps to reproduce
4. Run `project-docs/19_Test_QA_Checklist_v0.6.md` to isolate whether it is:
   - a block/validation bug
   - a snapshot import/export bug
   - a mobile/responsive issue
   - a theme/link/navigation issue
5. If it’s a mobile issue, fill the failing items in:
   - `project-docs/27_Mobile_QA_Scorecard_v0.6.md`

---

## D) Deploy to GitHub Pages (Release Gate B-015)
1. Push the repo so that the **published site** is `docs/`.
2. In GitHub → **Settings → Pages**:
   - Source: Deploy from a branch
   - Branch: `main` (or default) / Folder: `/docs`
3. Open the Pages URL.
4. Confirm:
   - Header version badge = **v0.6.0**
   - Environment badge = **GitHub Pages**
5. Re-run:
   - `project-docs/19_Test_QA_Checklist_v0.6.md`
   - `project-docs/27_Mobile_QA_Scorecard_v0.6.md`

**Definition of Done for deploy verification**
- No blocker failures in Mobile QA Scorecard
- Smoke tests pass locally and on GitHub Pages
- Theme toggle works on the live URL and persists after refresh
- Any non-blocker issues are documented in:
  - `project-docs/17_Backlog_v0.6.md`
  - `project-docs/23_Release_Notes_v0.6.md`
  - `project-docs/25_Handoff_Document_v0.6.md`

---

## E) Prepare a Handoff Package
Before handing off to a new chat, update:
- `project-docs/23_Release_Notes_v0.6.md`
- `project-docs/24_File_Manifest_v0.6.md`
- `project-docs/25_Handoff_Document_v0.6.md`
- `project-docs/27_Mobile_QA_Scorecard_v0.6.md` (current score + blockers)
- `project-docs/28_MobAI_Agent_Report_v0.6.md`
