## Version

Current package: v26

# Lifecycle Failure Clinic v26

Lifecycle Failure Clinic is a Chapter 2 learning app built around one simple rule: **one repaired mission gives the learner the full educational experience**.

## What is new in v26
- **Discussion mode has been removed from the UI and application logic**
- the top bar no longer includes a Discussion mode button
- help text and continuation docs were updated to reflect that removal
- the **dark theme was reworked for readability** with higher-contrast cards, text, buttons, chips, and decorative surfaces
- the visual system keeps the modern color accents while making the dark theme much easier to read

## What the learner does
- choose one enterprise incident in **Case Setup**
- work through one lifecycle mission in **Mission Deck**
- move through six focused screens:
  - Phase setup
  - Diagnose
  - Repair
  - Outcome
  - Learn
  - Complete
- stop after one mission or continue to another optional phase

## Included cases
- HR Policy Q&A Incident
- Support Ticket Summarizer Incident
- Onboarding Assistant Incident

## Run locally on Windows
1. Extract the ZIP.
2. Double-click `start-server.bat`.
3. Open `http://localhost:8000/` if the browser does not open automatically.

## Main files
- `index.html` — simplified Mission Deck app shell
- `help.html` — usage guidance
- `feedback.html` — feedback prompts
- `assets/styles.css` — Mission Deck layout and modernized styling
- `assets/app.js` — scenario data and simplified Mission Deck state/render logic
- `project-documents/` — continuation-ready handoff and testing docs
