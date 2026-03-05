# PRD — Context Tetris — v0.3.5
**Date:** 2026-02-27

## Problem
Knowledge workers can write “good prompts” but still get unreliable outputs because the **overall context package** is poorly assembled, ordered, or overloaded.

## Goal
Teach a repeatable habit: **pack the right context blocks into a finite window**, in the right order, without overload.

## Target user
Non-software-engineer / knowledge worker learning Context Engineering fundamentals (Chapter 1).

## Core loop
Pick task → pack blocks → budget tokens → score → apply quick fixes → iterate → compare runs.

## Definition of Done (release)
- Runs locally on Windows via `start-server.bat`
- Runs as static site on GitHub Pages
- Mobile-first UX passes Mobile QA gates
- Scoring shows pass/fail + breakdown
- Tutorial overlay works (auto-first-run + reopen button)
- Package includes manifest + handoff + MobAI Agent Report

## Non-goals (for now)
- Real-time multiplayer / auth
- Server-side persistence
- Physics gameplay (falling tetrominoes)


## Start state + reset behavior (v0.3.5)
- App starts **empty** (no default task selected).
- Add **Reset App** control to return to a fresh start (no task selected, pack cleared, results cleared).
- Keep run history separate (cleared only via Clear History).
