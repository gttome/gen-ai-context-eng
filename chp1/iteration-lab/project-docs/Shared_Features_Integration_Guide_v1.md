# Shared Features Integration Guide (for Chapter Apps)
**Applies to:** any HTML5 “chapter app” hosted on GitHub Pages (static) and runnable locally on Windows.  
**Features covered:**  
1) **Version + Environment pills**  
2) **Themes + modern color system** (Light/Dark)  
3) **Help + Feedback buttons** (stub pages for now)

---

## 0) What you’ll add (high level)
- A small **header status area** with two “pills”:
  - **Version** (e.g., `v0.6.0`)
  - **Environment** (Local / GitHub Pages / File / Web)
- A **theme toggle** that switches Light/Dark, persists in browser storage, and uses a **CSS variable color system**.
- Two header actions:
  - **Help** → `help.html` (placeholder)
  - **Feedback** → `feedback.html` (placeholder)

This guide is intentionally **copy/paste friendly** and designed for **non-software engineers**.

---

## 1) File additions
Add these files (names can be adjusted, but keep links consistent):

```
/docs
  index.html
  help.html
  feedback.html
  /css
    style.css
  /js
    app.js
```

If your app does not use `/docs` as the deploy folder, adapt paths accordingly.

---

## 2) Version + Environment pills

### 2.1 HTML: add pills to your header
Place this near the top of `index.html` (inside your header area):

```html
<div class="status-bar" aria-label="App status">
  <span class="pill" id="pillVersion" aria-label="App version">v—</span>
  <span class="pill pill-env" id="pillEnv" aria-label="Runtime environment">Env—</span>
</div>
```

### 2.2 JS: set Version + Environment text
In `app.js` (or your main JS), define a version string and environment detection:

```js
const APP_VERSION = "v0.6.0"; // Update each release

function detectEnvironment() {
  const { protocol, hostname } = window.location;

  if (protocol === "file:") return "File";
  if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";

  // Common GitHub Pages pattern: <user>.github.io
  if (hostname.endsWith("github.io")) return "GitHub Pages";

  return "Web";
}

function setStatusPills() {
  const v = document.getElementById("pillVersion");
  const e = document.getElementById("pillEnv");

  if (v) v.textContent = APP_VERSION;
  if (e) e.textContent = detectEnvironment();
}
```

Call it once on page load:

```js
document.addEventListener("DOMContentLoaded", () => {
  setStatusPills();
});
```

### 2.3 CSS: pill styling
Add to `style.css`:

```css
.status-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.pill-env { background: color-mix(in srgb, var(--surface) 80%, var(--primary) 20%); }
```

> If you prefer maximum compatibility, remove `color-mix(...)` and keep `background: var(--surface);`.

---

## 3) Themes + modern color system (Light/Dark)

### 3.1 Goal
- Use **CSS variables** as a single source of truth for color.
- Toggle theme via an attribute: `data-theme="dark"` on `<html>` (or `<body>`).
- Persist the theme selection in `localStorage`.
- Use `prefers-color-scheme` only as a **default** (if the user hasn’t chosen).

### 3.2 HTML: theme toggle button
Add a button in your header:

```html
<button class="btn" id="btnTheme" type="button" aria-label="Toggle theme">
  Theme
</button>
```

Optional: show current theme label:

```html
<span class="sr-only" id="themeStatus" aria-live="polite"></span>
```

### 3.3 CSS: define the color system (Light + Dark)
Add these variables at the top of `style.css`:

```css
:root {
  /* Core surfaces */
  --bg: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #f1f3f7;

  /* Typography */
  --text: #0f172a;
  --muted: #475569;

  /* Brand / accent */
  --primary: #2563eb;
  --primary-contrast: #ffffff;

  /* UI */
  --border: #d6dbe6;
  --shadow: 0 10px 25px rgba(2, 6, 23, 0.08);
  --focus: 0 0 0 3px rgba(37, 99, 235, 0.35);
}

html[data-theme="dark"] {
  --bg: #0b1220;
  --surface: #0f172a;
  --surface-2: #111c33;

  --text: #e5e7eb;
  --muted: #a7b0c0;

  --primary: #60a5fa;
  --primary-contrast: #0b1220;

  --border: #23314f;
  --shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
  --focus: 0 0 0 3px rgba(96, 165, 250, 0.35);
}
```

Then make your app use variables:

```css
body { background: var(--bg); color: var(--text); }
.card { background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow); }
.muted { color: var(--muted); }

.btn {
  background: var(--primary);
  color: var(--primary-contrast);
  border: 1px solid color-mix(in srgb, var(--primary) 85%, #000 15%);
  padding: 10px 12px;
  border-radius: 12px;
}
.btn:focus-visible { outline: none; box-shadow: var(--focus); }
```

> If `color-mix(...)` is an issue for your compatibility target, replace the `border` line with `border: 1px solid var(--border);`.

### 3.4 JS: apply and persist the theme
Add to `app.js`:

```js
const THEME_KEY = "app_theme"; // localStorage key

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;

  // Default based on OS preference only if user hasn't chosen
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  const status = document.getElementById("themeStatus");
  if (status) status.textContent = `Theme set to ${theme}`;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getPreferredTheme());

  const btn = document.getElementById("btnTheme");
  if (btn) btn.addEventListener("click", toggleTheme);
});
```

### 3.5 Mobile friendliness checklist (for themes)
- Ensure contrast is readable on phone outdoors (light) and at night (dark).
- Keep text sizes legible (minimum ~16px body).
- Don’t rely on hover-only affordances.

---

## 4) Help + Feedback buttons (stub pages)

### 4.1 HTML: add header buttons
Add to your header area in `index.html`:

```html
<a class="btn btn-secondary" href="help.html" role="button">Help</a>
<a class="btn btn-secondary" href="feedback.html" role="button">Feedback</a>
```

Add secondary button styling:

```css
.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:focus-visible { outline: none; box-shadow: var(--focus); }
```

### 4.2 Create `help.html` and `feedback.html`
Each should:
- include the same CSS
- apply the same theme system (via the same JS or an inline snippet)
- provide a “Back to App” link

Minimal example (help.html):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Help</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <main class="card" style="margin:16px; padding:16px;">
    <h1>Help</h1>
    <p class="muted">Placeholder page. Content will be added later.</p>
    <p><a class="btn btn-secondary" href="index.html">Back to App</a></p>
  </main>

  <script>
    // Minimal theme sync (copy the THEME_KEY logic if you want full parity)
    (function() {
      const key = "app_theme";
      const saved = localStorage.getItem(key);
      if (saved) document.documentElement.setAttribute("data-theme", saved);
      else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      }
    })();
  </script>
</body>
</html>
```

Repeat the same for `feedback.html`.

---

## 5) Quick verification checklist (copy into your QA doc)
- **Version pill** shows correct version string
- **Environment pill**:
  - shows **Local** on `localhost` server
  - shows **GitHub Pages** on deployed site
  - shows **File** if opened directly from disk
- **Theme toggle** switches light/dark and persists after refresh
- **Help** and **Feedback** pages open and “Back to App” works
- No console errors in Local and GitHub Pages

---

## 6) Common pitfalls
- Forgetting the viewport meta tag in `index.html` (mobile layout breaks).
- Using absolute Windows paths in links/scripts (GitHub Pages breaks).
- Not persisting theme selection (users hate resetting).
- Missing focus-visible styling (keyboard navigation feels broken).
- Adding huge libraries for simple UI (mobile performance suffers).

---

## 7) Minimal integration plan (non-engineer friendly)
1. Copy the **HTML pills** and **buttons** into your header.
2. Copy the **CSS variables** and update your existing styles to use them.
3. Copy the **theme JS** and **status pills JS** into `app.js`.
4. Add `help.html` and `feedback.html` placeholders.
5. Run locally via `start-server.bat`.
6. Deploy `/docs` to GitHub Pages and confirm pills + theme work.

---

## Appendix: Optional upgrades (safe)
- Replace “Theme” button text with an icon + label (keep aria-label).
- Add a small “Theme: Dark/Light” text next to the button.
- Add a “Report Issue” mailto link on Feedback page (still static safe).
