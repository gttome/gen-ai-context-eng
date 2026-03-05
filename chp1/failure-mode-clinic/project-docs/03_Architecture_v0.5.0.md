# Architecture — Failure Mode Clinic v0.5.0

## Runtime
- Static site: `docs/index.html` + `docs/css/style.css` + `docs/js/app.js`
- GitHub Pages compatible (no server-side dependencies)

## Data
### Built-in packs (read-only)
- `docs/data/builtin_packs.json`

### Local storage keys
- State: `fmc.state.v1`
- User packs: `fmc.packs.v1`
- Settings (theme): `fmc.settings.v1`
- Attempt history: `fmc.history.v1`

## App structure (app.js)
- Shared features: env/version pills, theme toggle, help modal
- Views: Clinic, Library, Builder, About
- Utilities: parsing context blocks, line diff, heuristic fix templates
- Iteration 4: verification modal + history modal (local-only)
