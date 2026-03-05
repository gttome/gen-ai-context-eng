# Security Checklist — RAG Snippet Surgeon — v0.3.0
**Date:** 2026-02-26

## Static-site safety
- No secrets in client-side code
- No external API calls required
- Uses relative paths only

## Import/Export safety
- Import reads local JSON only (FileReader)
- JSON is validated and filtered to known IDs
- Rendered HTML uses escaping in coverage panel (no injection)

## Notes
- If future iterations add external APIs, revisit CORS + secret handling.
