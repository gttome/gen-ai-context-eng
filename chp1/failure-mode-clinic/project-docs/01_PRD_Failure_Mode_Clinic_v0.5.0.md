# PRD — Failure Mode Clinic (v0.5.0)

## 1) Problem
Knowledge workers see bad LLM output (generic, hallucinated, unstructured, constraint-violating) and don’t know **which context fix** to apply—or whether the fix actually worked.

## 2) Goal
A mobile-first “clinic” that trains users to:
1) recognize the failure symptom  
2) identify likely cause (missing/weak context block)  
3) apply a practical fix (tighten/add context blocks)  
4) **verify the fix** using a simple rubric and before/after comparison

## 3) Target users
- Non-software-engineer knowledge workers practicing prompt/context engineering
- Trainers building “failure mode” practice cases

## 4) Core user flows
### A) Clinic: Diagnose → Fix → Verify
- Load a case
- Diagnose (Symptom/Cause/Fix) + score with teaching feedback
- Generate a fixed context (heuristic templates) + diff
- Paste the improved output and verify via rubric
- Save verification to local attempt history

### B) Library: Packs + search + import/export
- Built-in pack(s) are read-only
- User packs stored locally (My Pack + created packs)
- Import/export packs as JSON

### C) Builder: Wizard + manual editor
- Wizard for guided case authoring
- Manual editor for power users

### D) Drill mode
- Fast triage rounds with instant feedback

### E) Attempt history (Iteration 4)
- View attempts
- Export a single attempt or full history JSON

## 5) Non-goals (for now)
- No server-side runtime
- No model calls / API keys
- No multi-user sync

## 6) Success metrics (local)
- Verified passes (count)
- Attempts and average diagnosis score

## 7) Constraints
- Windows local dev, GitHub Pages runtime (static HTML/CSS/JS only)
- Mobile-first UX, progressive enhancement for desktop
- No secrets stored client-side
