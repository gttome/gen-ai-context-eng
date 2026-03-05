# Security Checklist — Failure Mode Clinic v0.5.0

## Static-only constraints
- No server-side code required at runtime
- No secrets/tokens in client-side code

## Local storage
- User cases/packs and history are stored in browser localStorage only
- Export is user-initiated download

## Import handling
- Pack import expects JSON object with `packs:[...]`
- Do not execute imported content; treat as data only

## Data minimization
- History truncates long texts to reduce storage bloat
