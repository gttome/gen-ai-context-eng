# File Manifest — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## App Files

| Path | Purpose | Required | Notes |
|---|---|---:|---|
| `README.md` | Top-level local run + GitHub Pages deployment instructions | Yes | References B-015 gate |
| `docs/index.html` | Main app UI shell | Yes | Adds theme toggle + Help/Feedback links |
| `docs/help.html` | Help placeholder page | Yes | Stub page; links back to app |
| `docs/feedback.html` | Feedback placeholder page | Yes | Stub page; links back to app |
| `docs/start-server.bat` | Windows local launcher (Python http server) | Yes | Must remain next to `index.html` |
| `docs/css/style.css` | Styles | Yes | Modern palette + Light/Dark themes + mobile action bar |
| `docs/js/theme.js` | Theme persistence + toggle behavior | Yes | Stores theme in localStorage |
| `docs/js/data.js` | Workflows, templates, presets, fixtures | Yes | Version bumped to v0.6.0 |
| `docs/js/app.js` | App logic | Yes | Receives theme-change event for status |
| `docs/assets/fixtures/sample_snapshot_reliability.json` | Sample snapshot for import testing | Optional | Bundled for regression |
| `docs/assets/fixtures/sample_snapshot_multiturn.json` | Sample snapshot for import testing | Optional | Bundled for regression |
| `docs/.nojekyll` | GitHub Pages compatibility | Optional | Kept intentionally |

## Project Docs

| Path | Purpose | Required | Notes |
|---|---|---:|---|
| `project-docs/00_V10_Workflow_Guide.md` | Workflow process guide | Yes | Governing workflow |
| `project-docs/01_Bootstrap_Prompt_MobileFirst_v11.1.docx` | Reference prompt for mobile-first workflow | Optional | Source reference (read-only) |
| `project-docs/00_Latest_MobAI_Agent_Report.md` | Pointer to most recent MobAI report | Yes | One-line pointer |
| `project-docs/14_User_Action_Guide_v0.6.md` | What-to-do-next instructions | Yes | Updated for theme + pages |
| `project-docs/15_PRD_v0.6.md` | Product requirements | Yes | Theme + Help/Feedback in scope |
| `project-docs/16_Technical_Plan_v0.6.md` | Architecture + rules | Yes | Adds theme module |
| `project-docs/17_Backlog_v0.6.md` | Work items tracking | Yes | Adds B-020/B-021 done |
| `project-docs/18_Iteration_5_Plan_v0.6.md` | Iteration plan/execution | Yes | Iteration 5 scope |
| `project-docs/19_Test_QA_Checklist_v0.6.md` | Smoke/regression/acceptance | Yes | Adds theme/link checks |
| `project-docs/20_Security_Checklist_v0.6.md` | Client-side security checks | Yes | Notes theme storage |
| `project-docs/21_Deployment_Checklist_GitHubPages_v0.6.md` | Deploy readiness and live verification | Yes | Includes theme checks |
| `project-docs/22_Refactor_Log_v0.6.md` | Tech debt tracking | Optional | Updates refactor items |
| `project-docs/23_Release_Notes_v0.6.md` | Release summary | Yes | v0.6.0 summary |
| `project-docs/24_File_Manifest_v0.6.md` | This manifest | Yes | Updated list |
| `project-docs/25_Handoff_Document_v0.6.md` | Continuation/handoff status and restart prompt | Yes | Updated for v0.6.0 |
| `project-docs/26_Mobile_UX_Responsive_Checklist_v0.6.md` | Mobile-first UX checklist | Yes | Updated for theme/link wrap |
| `project-docs/27_Mobile_QA_Scorecard_v0.6.md` | Strict mobile release gate scorecard | Yes | Updated for theme contrast |
| `project-docs/28_MobAI_Agent_Report_v0.6.md` | MobAI agent activity report for this request | Yes | Operational audit |
