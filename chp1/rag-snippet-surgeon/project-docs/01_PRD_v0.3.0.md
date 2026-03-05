# PRD — RAG Snippet Surgeon — v0.3.0
**App Version:** v0.3.0  
**Date:** 2026-02-26  
**Owner:** Knowledge Worker Builder (with MobAI)

## Problem
Learners often “dump” entire documents into RAG context, wasting tokens and introducing noise. They need muscle memory for selecting **minimal, sufficient excerpts**, trimming aggressively, and detecting **insufficient evidence**.

## Target user
Knowledge workers learning Context Engineering (Chapter 1), especially retrieval-grounding behaviors.

## Goals
### Iteration 0 (baseline)
- Teach excerpt minimalism: pick **2–6** short excerpts
- Generate a copy-ready “Grounding Knowledge” block
- Provide insufficiency feedback (“what evidence is missing?”)

### Iteration 1 (delivered)
- Relevance filter + relevance badges
- Evidence Coverage panel
- Modal accessibility (Esc + focus trap)

### Iteration 2 (delivered in this package)
- **Session Export/Import (JSON)**
- **Auto-trim suggestion** inside Scalpel Mode
- **Evidence Budget meter** + stricter scoring penalty for budget creep

## Non-goals
- No external services, no server runtime
- No storage of secrets/tokens
- No “answer generation” beyond a stub; this is a retrieval discipline trainer

## Success criteria
- User can restore a session in < 10 seconds (import)
- Auto-trim produces a shorter excerpt that still maps to required evidence tags
- Budget meter accurately reflects when excerpt selection is “high/too high”
- Mobile QA scorecard required gates pass

## Constraints
- Must run as static site on GitHub Pages
- Mobile-first UI; touch baseline; keyboard accessible
