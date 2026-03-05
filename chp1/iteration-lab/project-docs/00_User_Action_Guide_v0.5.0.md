# User Action Guide — Iteration Lab v0.5.0

## What you just received
Iteration 4 (v0.5.0) implementing P0 features:
- Scenario Builder (local-only)
- Block-level line diffs (Compare)
- Export Bundle (.json)
- Trend guardrails when test sets change

## Run locally on Windows
1. Unzip the package.
2. Open the `docs/` folder.
3. Double-click `start-server.bat`.
4. Open the localhost URL it prints (copy/paste into your browser).

## Use the app (fast loop)
1) **Design**
- Pick a Scenario (or create one with **New Scenario**).
- Edit your context blocks.
- (Optional) Edit the Test Set and keep it stable for clean trend lines.

2) **Test**
- For each test question:
  - Copy your full context package into your LLM
  - Paste the model output into the app

3) **Evaluate**
- Score each criterion (0–2).
- Review the score summary, regressions, and trend chart.
- Use **Copy/Download Iteration Report**.
- Use **Download Bundle (.json)** when you want one file to share/archive.

4) **Compare**
- Pick two iterations.
- Use **Diff** view to see line-by-line changes per block.

5) **Adjust**
- Declare the next change (change type + block).
- Create the next iteration.

## Common troubleshooting
- If you see old behavior after upgrading: hard refresh (**Ctrl+F5**).
- If you get a blank screen: open DevTools → Console and share the first error line + line number.

## GitHub Pages deploy
Publish the `docs/` folder as a GitHub Pages site (static).
- Use relative paths only (already done).
- Keep `.nojekyll` in `docs/` (already included).
