# Context Skeleton Studio — V10 Workflow Package (v0.6.0)

This package contains:

- **`/docs`** → the GitHub Pages-published static site (HTML/CSS/JS)
- **`/project-docs`** → PRD, technical plan, backlog, iteration plan, QA/security/deploy checklists, release notes, manifest, handoff, templates

## 1) Run Locally on Windows (Recommended First)
1. Unzip this package.
2. Open the **`docs`** folder.
3. Double-click **`start-server.bat`** (it is intentionally in the same folder as `index.html`).
4. Your browser should open to `http://localhost:8000`.
5. Confirm the header shows **v0.6.0** and the environment badge shows **Local**.
6. Run the checks in `project-docs/19_Test_QA_Checklist_v0.6.md`.

### New in v0.6.0
- Theme toggle in the header: **Theme: Light/Dark** (persists after refresh)
- **Help** and **Feedback** links (placeholder pages)

### Quick smoke testing
- On phone/tablet widths, use the bottom **quick-action bar** (Tools / Validate / Copy / Download) to avoid scrolling.

### Mobile-first release gate
- Complete `project-docs/27_Mobile_QA_Scorecard_v0.6.md` (no Blocker fails) before calling the release "ready".

- Use **Regression Fixtures** (right panel) to load one-click test scenarios.
- Use the **sample snapshot files** links (right panel) to test Import `.json`.

### If `start-server.bat` does not work
- Make sure Python is installed on Windows.
- In Command Prompt, run `python --version`.
- If needed, install Python and rerun the batch file.

## 2) Deploy to GitHub Pages
1. Create a GitHub repository (or use an existing one).
2. Upload the package contents to the repo (keep the folder structure).
3. In GitHub, open **Settings → Pages**.
4. Set:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or your default branch)
   - **Folder:** `/docs`
5. Save and wait for the Pages URL.
6. Open the live URL and confirm the environment badge shows **GitHub Pages**.
7. Run the same smoke tests again (use the QA checklist).

## 3) Folder Rules (Do Not Break)
- `docs/index.html` must exist
- `docs/start-server.bat` must stay in the **same folder** as `index.html`
- Keep paths relative (no local Windows absolute paths)
- No secrets/API keys in client-side files

## 4) Next Step
Open **`project-docs/14_User_Action_Guide_v0.6.md`** and follow the section for your current task (local test/debug/iteration/deploy/handoff).

## 5) Handoff to a New Chat
Use the restart prompt in **`project-docs/25_Handoff_Document_v0.6.md`** and attach the latest package zip.
