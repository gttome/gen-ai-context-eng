# RAG Snippet Surgeon (Iteration 2)

A mobile-first HTML5 mini-game for practicing **RAG excerpt selection**: pick **2–6 short excerpts** that are sufficient to ground an answer, without “dumping” entire documents.

## Quick Start (Windows)

1. **Unzip** this package to a folder on your PC.
2. Double-click **`start-server.bat`** (it must be in the same folder as `index.html`).
3. Your browser should open to: `http://localhost:8000/`
4. If it doesn’t open automatically, manually open the URL above.

## How to Use (MVP)

1. Choose a question card.
2. Select 2–6 excerpts.
3. Click **Simulate grounded answer**.
4. Copy the **Grounding Knowledge** block into your context skeleton.

Iteration 1 features:
- Use **Relevance filter** (All / Relevant / Distractors) to see how noise sneaks in.
- After **Simulate**, review **Evidence Coverage** to see which excerpt covers each required tag.

Optional:
- Turn on **Scalpel Mode** to trim excerpts down to the 1–2 sentences that matter.

## GitHub Pages Deploy (Static)

This app is static (HTML/CSS/JS only). Recommended simple setup:

1. Create a GitHub repo (or use an existing one).
2. Copy these files into the repo **root** (same folder as `index.html`).
3. Commit and push to `main`.
4. In GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save, then open the Pages URL.

Environment pill should read **GitHub Pages** when deployed.

## Docs

All iteration docs live in: `project-docs/`

Start here:
- `project-docs/00_User_Action_Guide_v0.2.1.md`
- `project-docs/01_PRD_v0.2.1.md`
- `project-docs/02_Backlog_v0.2.1.md`

## Version

- App version: **v0.2.1**
- Date: **2026-02-26**


## New in Iteration 2 (v0.3.0)
- Session Export/Import (JSON)
- Auto-trim in Scalpel Mode
- Evidence Budget meter + stricter scoring penalty
