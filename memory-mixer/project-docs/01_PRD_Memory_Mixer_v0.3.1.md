# PRD — Memory Mixer (Iteration 2) — v0.3.1
**Request ID:** MM-ITER2-20260226  
**Date:** 2026-02-26

## 1) Product summary
Memory Mixer is a hands-on **memory lab** for multi-turn LLM workflows. Learners practice maintaining:
- **Rolling Summary** (continuity without history dumping)
- **Pinned Facts** (durable decisions/facts that must not drift)
- **Retrieval Memory** (supporting notes stored for later lookup)

Iteration 2 adds **retrieval organization**, **conflict reconciliation**, and **run portability**.

## 2) Target user
Knowledge workers learning context engineering who want practical, repeatable memory patterns for multi-turn work.

## 3) Goals (Iteration 2)
- Make Retrieval Memory usable at scale via **search + tags**
- Detect when Rolling Summary contradicts Pinned Facts (**Conflicts**) and provide an easy reconcile flow
- Allow runs to move across devices/browsers via **Export/Import Run JSON**
- Improve accessibility and keyboard flows for core actions and modals

## 4) Non-goals
- No server-side storage, authentication, or cloud sync
- No advanced NLP contradiction reasoning beyond simple key/value mismatch heuristics
- No scenario builder/editor UI in this iteration

## 5) Core user stories
1. As a learner, I can **tag** retrieval items and **filter/search** them quickly.
2. As a learner, I can see when my Rolling Summary **disagrees** with something I pinned and reconcile it.
3. As a learner, I can export a full run to JSON and import it later to continue on another device.

## 6) Acceptance criteria (Iteration 2)
- App starts **idle** (blank) until New Run or Resume
- Retrieval Memory supports:
  - search box
  - tag filter (All + discovered tags)
  - per-item tag editing
- Conflicts:
  - Conflicts count visible
  - Review modal lists conflicts (Pinned value vs Summary value)
  - Buttons apply pinned→summary and summary→pinned
- Run portability:
  - Export run downloads JSON
  - Import run loads JSON, validates shape, and restores run
- Mobile-first:
  - No horizontal scroll for main UI
  - Tap targets usable on phone
  - Modals usable on mobile viewport

## 7) Risks / mitigations
- Heuristic conflicts can miss nuanced contradictions → keep scope explicit; teach learner to review manually
- Importing malformed JSON → strict parsing + user-friendly error messages
