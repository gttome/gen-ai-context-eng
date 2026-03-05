# 21_Deployment_Checklist_GitHubPages_v0.5.2.md
Date: 2026-02-25

## Goal
Deploy `/docs` to GitHub Pages and verify behavior matches local.

## Steps
- [ ] Commit contents to a GitHub repo
- [ ] Settings → Pages → Deploy from a branch → Folder: `/docs`
- [ ] Open the site URL and re-run Gate A items relevant to deployment:
  - Version pill shows `v0.5.2`
  - Environment pill shows `GitHub Pages`
  - Theme toggle persists
  - Help/Feedback pages work
  - Copy and downloads behave as expected on device

## Outcome
- [ ] Pass → B-015 complete
- [ ] Fail → capture bug notes and start debug iteration
