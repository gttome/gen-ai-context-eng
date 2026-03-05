# V10 Workflow Guide — Windows to GitHub Pages (Zip-First, Silent Screen Output)

**Mobile-first addendum adopted (from Bootstrap prompt v11.1).**

**Package Version:** v0.6.0  
**Date:** 2026-02-25  
**Selected MVP App:** Context Skeleton Studio  
**Source Input:** `Potential Applications.docx` (uploaded)

---

## 1) Document Intake + App Selection (Start Here)

### App candidates found in `Potential Applications.docx`
The uploaded document contains a Chapter 1 app set with nine GitHub Pages-ready concepts:
- Context Tetris
- Context Skeleton Studio
- Approach Switchboard
- RAG Snippet Surgeon
- Memory Mixer
- Dynamic Facts Firewall
- Failure Mode Clinic
- Iteration Lab: Design → Test → Evaluate → Adjust
- Enterprise Scenario Arcade

### Candidate comparison (MVP selection lens)

| App Candidate | Learning Value | Build Complexity | MVP Speed | Security Risk | GitHub Pages Compatibility | Notes |
|---|---|---:|---:|---:|---|---|
| Context Skeleton Studio | High | Low-Medium | Fast | Low | Excellent | Strong fit for a first static app, direct chapter utility, easy validation/export flow |
| Dynamic Facts Firewall | Medium-High | Low | Fast | Low | Excellent | Simple sorting game, but narrower concept coverage |
| Approach Switchboard | High | Low-Medium | Fast | Low | Excellent | Great decision logic app, but less reusable as a daily authoring tool |
| Failure Mode Clinic | High | Medium | Medium | Low | Excellent | Great pedagogy, but requires more authored scenarios/cases |
| Context Tetris | High | Medium-High | Medium | Low | Excellent | Engaging, but more game mechanics overhead for MVP |

### Recommended MVP app
**Choose: Context Skeleton Studio**

### Why this MVP first
1. **Highest practical reuse**: it doubles as a real prompt/context composer, not just a learning toy.
2. **Fastest path to a working release**: editable blocks + validation + export is straightforward in HTML/CSS/JS.
3. **Best foundation for future apps**: the same data model (blocks, validation, ordering) can be reused in Failure Mode Clinic, Enterprise Scenario Arcade, and Iteration Lab.
4. **Low risk for GitHub Pages**: no backend or secrets required.

### MVP scope (must-have)
- Editable context blocks (Role, Rules, Dynamic Facts, Grounding Knowledge, Memory, Output Format, User Request)
- Workflow selector (one-off, reliability, multi-turn, strict structure)
- Required-field validation by workflow
- Ordering validation (warn if request placed too early; role/rules buried)
- Export assembled context (copy + download `.txt`)
- Local save/load (localStorage)
- Simple in-app “What to fix” feedback panel

### Later features (nice-to-have)
- Context X-Ray overlay
- Reorder drag-and-drop
- Template presets for scenarios
- Scoring labels (grounded/relevant/consistent/structured/safe)
- Comparison mode (before/after context packages)
- Import/export JSON project snapshots

### Assumptions
- `start-server.bat` was **not uploaded**, so a Windows-friendly Python local server launcher is included.
- User wants a **no-build** workflow (plain HTML/CSS/JS).
- GitHub Pages publish folder will be `/docs` to keep project docs separate.

---

## 2) One-Page Workflow Summary

### Plain-language process
1. **Start with the uploaded app ideas document** and pick one MVP app (done in Section 1).
2. **Write a small PRD** so scope stays stable (what must ship vs later).
3. **Create a lightweight technical plan** (files, data model, UI flow, validation rules).
4. **Build a short backlog** and pull one small iteration at a time.
5. **Use one chat as a mini AI team** (product, builder, QA/security, release) while you stay the final decider.
6. **Generate complete files each round** and package everything in a zip (no partial diffs).
7. **Run locally on Windows** using `start-server.bat` in the same folder as `index.html`.
8. **Run checklists** (QA, security, GitHub Pages readiness).
9. **Create release notes + handoff doc** so you can continue later without losing context.
10. **Deploy to GitHub Pages** from `/docs` when ready.

### What the user does
- Choose priorities and approve scope
- Run the local server on Windows
- Click through tests and confirm expected behavior
- Push files to GitHub and enable Pages
- Decide what ships next

### What the AI does
- Drafts/updates the PRD, plan, backlog, checklists, and release docs
- Generates complete HTML/CSS/JS and docs
- Keeps file structure clean and versioned
- Runs a structured debug loop and documents fixes
- Always packages the updated artifacts into a zip

### How the uploaded doc kicks off the process
The uploaded `Potential Applications.docx` provides the app candidates, learning value, and implementation hints. That removes idea-generation friction and lets the process begin at **selection + execution**.

### Why Windows local dev + GitHub Pages fits well
- Windows: easy local testing with Python's built-in server via batch file
- GitHub Pages: static hosting only, perfect for HTML/CSS/JS educational apps
- No backend = simpler maintenance and no secret management on the client

### Intentionally excluded (to stay minimal)
- Full Scrum ceremonies (story points, velocity reports, multiple boards)
- CI/CD pipelines
- Backend services or databases
- Complex build tools
- Large agent roster or multi-chat orchestration

---

## 3) Keep / Add / Merge / Drop Decisions

| Item | Decision | Why | Merged into |
|---|---|---|---|
| PRD | Keep | Scope control is essential for non-engineer projects | — |
| Technical Plan | Keep | Prevents file drift and ad hoc coding | — |
| Backlog | Keep | Enables short, controlled iterations | — |
| Iteration Plan | Keep | Makes each build cycle concrete | — |
| QA Checklist | Keep | Prevents broken releases | — |
| Security Checklist | Keep | Lightweight but critical, especially for client-side apps | — |
| Deployment Checklist (GitHub Pages) | Keep | Pages-specific issues are common and easy to miss | — |
| Refactor / Tech Debt Log | Keep | Avoids accumulating hidden complexity | — |
| Release Notes | Keep | Tracks what changed and what to test | — |
| File Manifest | Keep | Crucial for handoff and complete-file generation discipline | — |
| Handoff Document | Keep | Enables new-chat continuation without context loss | — |
| User Action Guide | Add | User explicitly requires plain-language next steps every time | — |
| `start-server.bat` convention (colocate with `index.html`) | Add | Prevents path/server confusion on Windows | — |
| Agent roles: Product Owner + Architect | Merge | One person/one chat workflow needs fewer roles | Product Lead agent |
| Agent roles: Developer + UI | Merge | Same person (AI) can own front-end implementation for MVP | Builder agent |
| Agent roles: Testing + Security | Merge | Related review pass, keeps roster small | QA/Security agent |
| Separate “deployment notes” doc | Merge | Avoid extra docs | Deployment Checklist + README |
| Scrum ceremonies (daily standup, planning poker) | Drop | Too heavy for solo AI-assisted workflow | — |
| Full design system spec | Drop | Overhead not justified for MVP | — |
| Backend architecture | Drop | Not GitHub Pages compatible for this workflow | — |

---

## 4) Minimal Document Set

| Doc Name | Purpose | When Created | Who Updates | Required Sections | Update Frequency | Done Criteria |
|---|---|---|---|---|---|---|
| PRD | Lock MVP scope and acceptance criteria | Iteration 0 | Shared | Goal, users, MVP scope, non-goals, acceptance criteria | When scope changes | MVP scope + acceptance criteria approved |
| Technical Plan | Define architecture and file structure | Iteration 0 | Shared | File tree, data model, UI flow, risks, build constraints | Each iteration if architecture changes | Matches actual files |
| Backlog | Prioritized work list | Iteration 0 | Shared | Items, priority, status, dependencies | Each iteration | Top items are clear and testable |
| Iteration Plan | Commit the next small slice | Each iteration | Shared | Goal, included backlog items, tests, risks | Every iteration | Items + tests + done criteria listed |
| Test / QA Checklist | Smoke + regression checks | Iteration 0 | AI drafts, user runs | Smoke tests, regressions, acceptance checks | Every iteration/release | All checks marked pass/fail with notes |
| Security Checklist | Prevent obvious client-side risks | Iteration 0 | Shared | No secrets, input validation, storage cautions, external API checks | Every iteration/release | No unresolved high-risk items |
| Deployment Checklist (GitHub Pages) | Ensure static hosting success | Iteration 0 | Shared | Paths, `index.html`, `.nojekyll`, README deploy steps, no backend | Before deploy/release | All pages-readiness checks pass |
| Refactor / Tech Debt Log | Track cleanup work | Iteration 0 | Shared | Debt item, impact, priority, trigger, fix plan | After each iteration | New debt captured; fixed debt closed |
| Release Notes | Summarize changes and known issues | First runnable build | AI drafts, user approves | Version, changes, fixes, test notes, known issues | Each release | Accurate + aligned to manifest |
| File Manifest | Inventory of package contents | Iteration 0 | AI | Paths, purpose, version notes | Every package | Matches zip contents |
| Handoff Document | Resume in new chat quickly | Iteration 0 | AI + user | Status, what works, bugs, next tasks, restart prompt | Every handoff/release | New chat can continue immediately |
| User Action Guide (mandatory) | Plain-language next steps | Iteration 0 | AI | Start, debug, next iteration, deploy, handoff paths | **Every response/package** | Specific steps for current scenario |

---

## 5) Agile Iteration Process + Agent Team

### End-to-end loop (lightweight Agile + one-chat agent team)
1. **Intake / discovery**: pull app options from uploaded doc and choose MVP.
2. **PRD draft**: define MVP scope, non-goals, and acceptance criteria.
3. **Backlog + prioritization**: break MVP into small tasks, order by value/risk.
4. **Iteration planning**: choose a tiny slice (1–3 backlog items) and define tests.
5. **Build**: AI generates complete impacted files (HTML/CSS/JS/docs).
6. **Quality + security checks**: run checklist pass and note results.
7. **Local Windows test**: user runs `start-server.bat` next to `index.html` and smoke tests.
8. **GitHub Pages readiness check**: verify static compatibility and deployment checklist.
9. **Review / demo**: user approves or requests fixes.
10. **Retrospective**: capture what slowed things down and update process/docs if needed.
11. **Handoff package**: zip updated files, manifest, release notes, handoff doc, user guide.

### Minimal agent roster (in one chat)

#### Agent 1 — Product Lead (merged Product Owner + Architect)
- **Responsibilities:** scope control, priorities, tradeoffs, acceptance criteria, architecture guardrails
- **Owns:** PRD, backlog priority, technical constraints, done definition
- **Must not do:** silently expand scope or add backend dependencies
- **Handoff points:** gives iteration target to Builder; receives QA findings; approves release packaging

#### Agent 2 — Builder (merged Developer + UI)
- **Responsibilities:** implement HTML/CSS/JS and update affected docs
- **Owns:** code files, UI behavior, localStorage persistence, relative paths
- **Must not do:** partial diffs only, hidden file changes, hardcoded local paths, client-side secrets
- **Handoff points:** passes complete package to QA/Security

#### Agent 3 — QA/Security (merged Testing + Security)
- **Responsibilities:** smoke tests, regression checks, checklist enforcement, risk scan
- **Owns:** QA checklist updates, security checklist updates, bug notes
- **Must not do:** approve releases without checklist evidence
- **Handoff points:** passes pass/fail + blockers to Product Lead and Builder

#### Agent 4 — Release Steward (lightweight release/documentation role)
- **Responsibilities:** zip packaging, release notes, manifest, handoff doc, user action guide
- **Owns:** package completeness and continuity artifacts
- **Must not do:** omit user guidance or print packaged file contents to screen
- **Handoff points:** delivers final package and restart prompt

### User’s role
- Final approver and priority setter
- Runs local Windows tests
- Chooses what ships
- Decides when to deploy to GitHub Pages

### How agents operate in one chat
The user gives one task (build/debug/feature/release). The AI internally uses the four-role lens in sequence:
1) Product Lead defines scope,
2) Builder changes files,
3) QA/Security checks,
4) Release Steward packages + updates docs.

### Tradeoff rule (speed vs quality vs security)
- **Security and GitHub Pages compatibility are hard constraints**
- Then preserve MVP scope
- Then optimize speed
- If a feature threatens schedule, move it to backlog (do not “sneak it in”)

### Simple cadence
- **Micro-iteration:** 30–90 minutes of work, 1–3 backlog items
- **Release rhythm:** every 2–4 micro-iterations or any time a stable user-visible milestone is reached

### Definition of Done (mandatory)
A task/iteration is done only when:
- All impacted files are fully regenerated/updated (no partial patch artifacts)
- PRD/plan/backlog/checklists/docs are updated as needed
- `docs/index.html` exists and works with relative paths
- `docs/start-server.bat` is in the **same folder** as `docs/index.html`
- No client-side secrets
- GitHub Pages checklist passes (or blockers are clearly documented)
- Zip package created
- User Action Guide updated for the current scenario
- Screen response contains summary only (no packaged file contents)

### Simple debug loop (required)
1. **Reproduce** (exact steps + expected vs actual)
2. **Isolate** (UI, data, validation rule, path, storage, deployment)
3. **Fix** (smallest change first)
4. **Retest** (smoke + regression)
5. **Document** (bug note, release notes, manifest, handoff, user action guide)

---

## 6) Development Guardrails (Simple Checklists)

### Security
- [ ] No API keys, tokens, or secrets in client-side code
- [ ] Input text handled safely (no `innerHTML` for untrusted content)
- [ ] External APIs (if any) use HTTPS only
- [ ] External APIs (if any) checked for CORS compatibility
- [ ] localStorage stores only non-sensitive data (learning content / drafts)
- [ ] No personal/confidential data required for the app to function
- [ ] Third-party libraries avoided unless clearly needed

### Modularity
- [ ] HTML structure separate from CSS and JS
- [ ] JS split by purpose (`data.js`, `app.js`)
- [ ] Small functions with clear names
- [ ] Shared selectors/helpers centralized
- [ ] File paths relative only

### Maintainability
- [ ] Consistent naming (`vX.Y.Z`, `iter-XX`, `YYYY-MM-DD`)
- [ ] Comments explain “why” for non-obvious logic
- [ ] Release notes updated for user-visible changes
- [ ] File manifest updated for added/removed files
- [ ] Handoff doc updated before major pauses

### Testing & Quality
- [ ] Smoke test: page loads with no console errors
- [ ] Core flow works (edit → validate → export)
- [ ] localStorage save/load works
- [ ] Validation messages match workflow rules
- [ ] Regression check after each fix
- [ ] Acceptance criteria checked against PRD

### Refactoring
- [ ] Refactor only after behavior is stable
- [ ] Capture current behavior in a checklist before refactor
- [ ] Change one area at a time
- [ ] Retest after each refactor step
- [ ] Log tech debt if refactor is deferred

### GitHub Pages Readiness
- [ ] Static-only architecture (HTML/CSS/JS)
- [ ] Relative paths only
- [ ] `docs/index.html` present
- [ ] `docs/start-server.bat` present and **colocated** with `index.html`
- [ ] No server-side runtime required
- [ ] No client-side secrets
- [ ] External APIs (if any) verified for HTTPS/CORS
- [ ] `README.md` includes deploy steps
- [ ] `.nojekyll` present in `/docs`

### Release Discipline
- [ ] No “chaos updates” outside backlog/iteration plan
- [ ] Release notes written before packaging
- [ ] Known issues listed explicitly
- [ ] Version number bumped consistently across docs
- [ ] Manifest reflects actual package

### User Guidance Delivery
- [ ] Package includes a User Action Guide
- [ ] Guide is updated for the current scenario (build/debug/iteration/deploy/handoff)
- [ ] Steps are plain-language and sequential
- [ ] Includes exactly what the user should click/run next

### Screen Output Discipline
- [ ] Do **not** paste packaged file contents to screen
- [ ] Do **not** print `.md` docs if they are in the zip
- [ ] Screen output = status, instructions, artifact list, decisions needed
- [ ] Zip/package is the source of detailed content

---

## 7) Windows + GitHub Pages Project Structure (Zip-Ready)

### Project structure (recommended)
Use `/docs` as the GitHub Pages published site folder and `/project-docs` for process/documentation files.

```text
V10_VibeCoding_Process_Package_ContextSkeletonStudio_v0_1/
├─ README.md
├─ project-docs/
│  ├─ 00_V10_Workflow_Guide.md
│  ├─ 14_User_Action_Guide.md
│  ├─ 15_PRD_v0.1.md
│  ├─ 16_Technical_Plan_v0.1.md
│  ├─ 17_Backlog_v0.1.md
│  ├─ 18_Iteration_1_Plan_v0.1.md
│  ├─ 19_Test_QA_Checklist_v0.1.md
│  ├─ 20_Security_Checklist_v0.1.md
│  ├─ 21_Deployment_Checklist_GitHubPages_v0.1.md
│  ├─ 22_Refactor_Log_v0.1.md
│  ├─ 23_Release_Notes_v0.1.md
│  ├─ 24_File_Manifest_v0.1.md
│  ├─ 25_Handoff_Document_v0.1.md
│  └─ templates/
│     ├─ PRD_TEMPLATE.md
│     ├─ Technical_Plan_TEMPLATE.md
│     ├─ Backlog_TEMPLATE.md
│     ├─ Iteration_Plan_TEMPLATE.md
│     ├─ Test_QA_Checklist_TEMPLATE.md
│     ├─ Security_Checklist_TEMPLATE.md
│     ├─ Refactor_Log_TEMPLATE.md
│     ├─ Release_Notes_TEMPLATE.md
│     ├─ File_Manifest_TEMPLATE.md
│     ├─ Handoff_Document_TEMPLATE.md
│     ├─ Deployment_Checklist_GitHubPages_TEMPLATE.md
│     └─ User_Action_Guide_TEMPLATE.md
└─ docs/                      ← GitHub Pages published site folder
   ├─ index.html
   ├─ start-server.bat        ← MUST be in same folder as index.html
   ├─ .nojekyll
   ├─ css/
   │  └─ style.css
   ├─ js/
   │  ├─ data.js
   │  └─ app.js
   └─ assets/
```

### What each folder/file is for
- `project-docs/`: planning, process, QA, release, handoff, and reusable templates
- `docs/`: static site files that actually run on GitHub Pages
- `README.md`: local run + deploy instructions for the whole package/repo
- `.nojekyll`: prevents Jekyll processing issues for static assets
- `start-server.bat`: Windows local server launcher, **colocated with `index.html`**

### Naming conventions
- **Version:** `vMAJOR.MINOR.PATCH` (ex: `v0.1.0`)
- **Iterations:** `Iteration_1`, `Iteration_2`, or `iter-01`, `iter-02`
- **Dates:** `YYYY-MM-DD` in docs and release notes
- **Docs:** prefix with numeric order for easy navigation

### Local server approach (`start-server.bat`)
- Uses Python built-in server from the `docs/` folder
- Opens `http://localhost:8000`
- Ensures relative paths work exactly like a hosted static site

### GitHub Pages publish location
- **Publish `/docs`** from the main branch  
Why: keeps project/process documentation separate from the live site while using a standard Pages-compatible folder.

### Placement confirmation
✅ `start-server.bat` is **colocated with** `docs/index.html` (same folder, mandatory).

---

## 8) Handoff System (Critical)

### 1. Handoff Document template (included as `project-docs/templates/Handoff_Document_TEMPLATE.md`)
The template is designed so a new chat can continue immediately, with:
- project summary
- current version
- what works
- what changed
- known bugs/risks
- next tasks
- file manifest
- test summary
- agent status summary
- GitHub Pages deployment status
- exact restart prompt
- user preferences
- link/reference to the current User Action Guide

### 2. Handoff Zip Standard (must include every time)
**Required contents**
1. Updated site files (`/docs`)
2. Updated project docs (`/project-docs`)
3. File Manifest
4. Release Notes (if user-visible changes or bug fixes happened)
5. Handoff Document
6. User Action Guide (updated to the current task)
7. `README.md` (updated if run/deploy steps changed)
8. `.nojekyll` in `/docs`
9. `start-server.bat` in `/docs` with `index.html`

### Exact restart prompt (standard)
Use this in a new chat and attach the latest package zip:

> You are continuing my Windows-to-GitHub-Pages HTML5 app workflow using the attached handoff package. Follow the V10 process in `project-docs/00_V10_Workflow_Guide.md`. Use the handoff doc, manifest, release notes, and user action guide to resume exactly where we left off. Generate complete files only, update all impacted docs, package everything in a zip, keep `start-server.bat` in the same folder as `index.html`, and do not print packaged file contents to the screen.

---

## 9) Prompt Pack (Reusable, Copy/Paste Ready)

> All prompt templates below enforce: complete files, all impacted docs updated, Windows + GitHub Pages compatibility, `start-server.bat` colocated with `index.html`, ZIP-FIRST, and Silent Screen Output.

### Prompt 1 — Bootstrap from `Potential Applications.docx` and create starter docs
```md
## Context
I am a non-software-engineer building a small HTML5 app on Windows and deploying to GitHub Pages.
Use the uploaded `Potential Applications.docx` as the source of app ideas.

## Task
1) Extract app candidates and recommend one MVP.
2) Create a lightweight process package with:
- PRD
- Technical Plan
- Backlog
- Iteration Plan
- QA Checklist
- Security Checklist
- Deployment Checklist (GitHub Pages)
- Refactor Log
- Release Notes
- File Manifest
- Handoff Document
- User Action Guide
3) Create a GitHub Pages-ready `/docs` site folder with `index.html` and `start-server.bat` in the same folder.

## Output
- Generate complete files only (no partial diffs)
- Package everything in a zip
- Screen output: summary + next steps + artifact list only

## Constraints
- Static site only (HTML/CSS/JS)
- Relative paths only
- No secrets in client code
- Include `.nojekyll`
- Include README with Windows local run + GitHub Pages deploy steps
- Do not print packaged file contents to screen
```

### Prompt 2 — Refine PRD / Technical Plan / Backlog
```md
## Context
Use the attached latest project package and continue the existing versioned workflow.

## Task
Refine the PRD, Technical Plan, and Backlog to improve clarity and scope control for the next iteration.
Update any related docs that are impacted (Iteration Plan, QA Checklist, User Action Guide, Manifest, Handoff).

## Output
- Complete updated files (not diffs)
- New zip package
- Screen output: what changed, decisions needed, what to do next

## Constraints
- Preserve MVP boundaries unless explicitly moving an item to backlog
- Keep Windows + GitHub Pages compatibility
- Keep `start-server.bat` in same folder as `index.html`
- Do not print packaged docs/code to screen
```

### Prompt 3 — Run one iteration with agent roles
```md
## Context
Continue the attached project package. Use a minimal one-chat agent team:
Product Lead, Builder, QA/Security, Release Steward.

## Task
Run one micro-iteration:
1) Pick 1–3 backlog items
2) Update Iteration Plan
3) Build the feature(s)
4) Run QA/Security checks
5) Update release notes, manifest, handoff, and user action guide
6) Package the result in a zip

## Output
- Complete files only
- Zip package
- Screen summary only (no file contents)

## Constraints
- Static-only GitHub Pages architecture
- Relative paths only
- `start-server.bat` colocated with `index.html`
- Update all impacted docs together
- Do not print packaged file contents
```

### Prompt 4 — Debug an error (reproduce, isolate, fix, retest, update docs)
```md
## Context
Continue from the attached package. I am debugging a problem in a Windows + GitHub Pages compatible HTML5 app.

## Task
Use this debug loop:
1) Reproduce
2) Isolate
3) Fix
4) Retest
5) Document
Update code and all impacted docs (QA checklist, release notes, manifest, handoff, user action guide, and any plan docs).

## Output
- Complete updated files only
- Zip package
- Screen output: root cause, fix summary, retest result, next steps

## Constraints
- Smallest safe fix first
- No backend dependencies
- No client-side secrets
- Keep `start-server.bat` with `index.html`
- Do not print packaged files to screen
```

### Prompt 5 — Add a feature + test + refactor + release
```md
## Context
Continue the attached project package and preserve the existing workflow docs and versioning.

## Task
Add one approved feature from the backlog, test it, perform any safe refactor needed, and prepare a release package.
Update PRD/Technical Plan if the feature changes scope or architecture.

## Output
- Complete files (code + docs) in a zip
- Screen summary only: changes, tests, release status, what to do next

## Constraints
- One feature at a time
- Run regression checks
- Keep GitHub Pages compatibility
- `start-server.bat` must remain in the same folder as `index.html`
- Do not print packaged file contents
```

### Prompt 6 — Prepare GitHub Pages deployment package + verification checklist
```md
## Context
Use the attached package. I need a deployment-ready GitHub Pages static site release.

## Task
Verify and prepare deployment:
- Check static-only architecture
- Confirm relative paths
- Confirm `/docs/index.html`
- Confirm `/docs/start-server.bat` colocated with `index.html`
- Confirm `.nojekyll`
- Confirm README deploy steps
- Update Deployment Checklist, Release Notes, Manifest, Handoff, User Action Guide

## Output
- Deployment-ready zip package
- Screen summary: readiness status, blockers (if any), deploy steps

## Constraints
- No secrets in client-side files
- External APIs must be HTTPS+CORS safe
- Do not print packaged docs/code to screen
```

### Prompt 7 — Create handoff zip + restart prompt
```md
## Context
Use the attached latest package and prepare a clean handoff for a new chat.

## Task
Create a handoff package that includes:
- Updated Handoff Document
- File Manifest
- Release Notes
- User Action Guide (handoff scenario)
- Current code/docs
- Exact restart prompt

## Output
- Handoff zip package
- Screen summary: current version, what works, next tasks, restart prompt location

## Constraints
- Complete files only
- Keep `start-server.bat` in same folder as `index.html`
- Do not print packaged file contents to screen
```

---

## 10) Starter Templates (Markdown)

Starter templates are included in **`project-docs/templates/`** for:
- PRD
- Technical Plan
- Backlog
- Iteration Plan
- Test Checklist
- Security Checklist
- Refactor Log
- Release Notes
- File Manifest
- Handoff Document
- Deployment Checklist (GitHub Pages)
- User Action Guide (mandatory)

### User Action Guide template requirements (implemented)
The included template contains plain-language sections for:
- Starting the project
- Debugging an error
- Moving to the next iteration/release
- Preparing a GitHub Pages deployment
- Creating a handoff package

---

## 11) Iteration 0 Bootstrap Package (Concrete)

### Iteration 0 output included in this package
This package includes a **working starter implementation** of **Context Skeleton Studio** plus the full process documentation set.

#### Included Iteration 0 docs (drafts)
- PRD draft (`15_PRD_v0.1.md`)
- Technical Plan draft (`16_Technical_Plan_v0.1.md`)
- Initial Backlog (`17_Backlog_v0.1.md`)
- Iteration 1 Plan (`18_Iteration_1_Plan_v0.1.md`)
- Test Checklist (`19_Test_QA_Checklist_v0.1.md`)
- Security Checklist (`20_Security_Checklist_v0.1.md`)
- Deployment Checklist (`21_Deployment_Checklist_GitHubPages_v0.1.md`)
- File Manifest (`24_File_Manifest_v0.1.md`)
- Release Notes placeholder (`23_Release_Notes_v0.1.md`)
- Handoff starter (`25_Handoff_Document_v0.1.md`)
- User Action Guide (`14_User_Action_Guide.md`)

#### GitHub Pages-ready folder layout (included)
- `/docs/index.html`
- `/docs/start-server.bat` (same folder as `index.html`)
- `/docs/css/style.css`
- `/docs/js/data.js`
- `/docs/js/app.js`
- `/docs/.nojekyll`

#### `README.md` outline included
- Local Windows run steps
- GitHub Pages deploy steps
- Troubleshooting notes

#### `start-server.bat` plan implemented
- Runs from the same folder as `index.html`
- Starts a local Python server
- Opens browser to localhost
- Keeps relative paths valid

---

## 12) Response Packaging Rule (Always-On)

### A) In the Zip/Package (Required)
Every future response package must include:
1. Updated artifacts (all impacted docs/files)
2. Updated User Action Guide (for the exact task)
3. Required code/config/assets (if applicable)
4. `README.md` updates (if run/deploy changed)
5. `start-server.bat` in the same folder as `index.html`
6. `.nojekyll` (if applicable)
7. Handoff + manifest + release notes (when applicable)

### B) On Screen (Chat Response) — Minimal Only
Do **not** print file contents from the zip/package (including markdown docs and code files).

Show only:
1. What Changed Summary (short)
2. What To Do Next (short checklist)
3. Status (local Windows run status, GitHub Pages readiness/deploy status, blockers)
4. Artifacts Updated (file names/paths only)
5. Decisions Needed (if any)

### Non-negotiable output contract
- **Zip/package is the primary output**
- **Screen output is operational only**
- **No packaged file contents on screen unless explicitly requested**

---

## 13) Anti-Patterns to Avoid

| Anti-Pattern | Why It Hurts | Fix |
|---|---|---|
| Keeping decisions only in chat | Context gets lost between sessions | Update PRD/backlog/handoff every iteration |
| Skipping PRD/backlog | Scope creep and random coding | Use PRD + prioritized backlog before building |
| No tests | Bugs survive into releases | Run smoke + regression checklist each iteration |
| No security checks | Easy client-side mistakes (secrets, unsafe rendering) | Use Security Checklist every release |
| File structure drift | Harder handoff and broken imports | Maintain Technical Plan + File Manifest |
| `start-server.bat` not next to `index.html` | Local path/server confusion on Windows | Keep both in `/docs` always |
| Partial file updates only | Hidden breakage and incomplete docs | Generate full impacted files every time |
| Printing packaged files to screen | Token waste and screen clutter | Zip-first; screen summaries only |
| Printing `.md` docs already in zip | Duplicate content | List docs/paths only on screen |
| No versioning/release notes | Hard to track regressions | Increment versions and maintain release notes |
| Building backend-dependent features | Not GitHub Pages compatible | Keep core app static-only |
| Hardcoded Windows local paths | Breaks on GitHub Pages | Use relative paths only |
| Client-side secrets/API keys | Security risk | Use no secrets in static app |
| No user instructions | User gets stuck on next action | Always include User Action Guide |
| Too many agent roles | Process overhead | Use 4-role minimal roster |
| Too much documentation | Slows delivery | Stick to the minimal doc set in Section 4 |

---

## End of V10 Workflow Guide


---

## V11.1 Mobile-First Addendum (Adopted for This Project)

This project now treats **mobile-first usability** as release-critical:
- Design for **phone portrait first**, then progressively enhance for tablets/laptops/desktops.
- Touch is the baseline interaction model.
- No core action may require hover.
- Maintain keyboard navigation and visible focus.
- Do not disable zoom.
- Avoid horizontal scrolling in standard UI.

### Cross-Device Test Matrix (Minimum)
Each release must be checked on:
- phone portrait
- phone landscape
- tablet
- desktop/laptop
- narrow desktop window (resized)

### Strict Release Gate: Mobile QA Scorecard
Any UI-affecting change must update and pass:
- `project-docs/27_Mobile_QA_Scorecard_v0.6.md`

Rules:
- **Any Blocker fail = release not ready**
- Major issues may be deferred only if explicitly documented in:
  - backlog
  - release notes
  - handoff

### Where the mobile artifacts live
- Mobile UX checklist: `project-docs/26_Mobile_UX_Responsive_Checklist_v0.6.md`
- Mobile QA scorecard: `project-docs/27_Mobile_QA_Scorecard_v0.6.md`
