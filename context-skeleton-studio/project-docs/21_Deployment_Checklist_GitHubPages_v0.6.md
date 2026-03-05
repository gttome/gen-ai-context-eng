# Deployment Checklist — GitHub Pages — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## A) Pre-Deploy (Local)
- [ ] Local run works via `docs/start-server.bat`
- [ ] Smoke tests passed (`project-docs/19_Test_QA_Checklist_v0.6.md`)
- [ ] Mobile QA Scorecard completed with **no Blocker fails** (`project-docs/27_Mobile_QA_Scorecard_v0.6.md`)
- [ ] No secrets present (`project-docs/20_Security_Checklist_v0.6.md`)
- [ ] `/docs` contains:
  - [ ] `index.html`
  - [ ] `start-server.bat` (same folder as `index.html`)
  - [ ] `help.html` and `feedback.html` (placeholders)
  - [ ] relative `css/`, `js/`, `assets/`
  - [ ] `.nojekyll` (present)

## B) GitHub Pages Settings
- [ ] Repo → Settings → Pages
- [ ] Source: Deploy from a branch
- [ ] Branch: `main` (or default)
- [ ] Folder: `/docs`
- [ ] Save

## C) Post-Deploy Verification (Live)
- [ ] Open the Pages URL
- [ ] Header badges:
  - [ ] Version = v0.6.0
  - [ ] Environment = GitHub Pages
- [ ] Theme toggle works on the live URL and persists after refresh
- [ ] Help/Feedback links work on the live URL
- [ ] Repeat smoke tests + mobile checks on live URL:
  - [ ] `project-docs/19_Test_QA_Checklist_v0.6.md`
  - [ ] `project-docs/27_Mobile_QA_Scorecard_v0.6.md`

## D) If Failures Are Found
- Log issues in `project-docs/17_Backlog_v0.6.md`
- Update `project-docs/23_Release_Notes_v0.6.md` with known issues
- Create a small fix iteration and re-run this checklist
