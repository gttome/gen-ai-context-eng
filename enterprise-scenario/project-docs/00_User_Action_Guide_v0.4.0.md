# Enterprise Scenario Arcade — User Action Guide (v0.4.0)

## Quick start (Windows)
1. Unzip the package.
2. Run: `docs\start-server.bat`
3. Open: `http://localhost:8000/`

## How to use the app
### 1) Pick a station
- Choose **Customer Support**, **HR Policy**, or **Operations** from the home screen.

### 2) Pick a scenario (new in Iteration 2)
- Use the **Scenario** dropdown in the Workbench header.
- Use **Random** to switch to a different scenario in the same station (resets the blocks).

### 3) Assemble your context blocks
Fill or edit:
- **System / Role**
- **Rules / Constraints**
- **Dynamic Facts**
- **Grounding Knowledge (Excerpts)**
- **Memory** (confirmed facts + open questions)
- **Output Format**
- **User Request**

### 4) Generate a draft (optional)
Click **Generate Response** to create a template response you can refine.

### 5) Score + review
- Click **Score** to run checks.
- Review **Findings**, **Coach Alerts**, and the **Evidence Map** (excerpt usage + dropped key facts).
- Toggle **Audit Mode** to tag each line as **E1/E2/...**, **Facts/Memory**, **Assumption**, or **Unsupported**.

### 6) Use X-Ray (quality gate)
Open the **X-Ray** tab to detect:
- missing blocks
- placeholder text
- duplicate/conflicting lines
- format drift

### 7) Exports
- **Copy Context Package** or **Download Context .txt**
- **Download Response .txt**
- **Download Run Report** (context + response + score + audit tags)

### 8) Run History vs Saved Runs
- **Run History**: auto-records the last attempts (local)
- **Saved Runs (Iteration 2)**: name an attempt and **Load** it later (local)

## Reset
- Use **Reset** (top bar) to clear the saved session and return to station selection.


## Scenario counts (v0.4.0)
- Support: 6
- HR: 6
- Ops: 7
