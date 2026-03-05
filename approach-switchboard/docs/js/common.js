/* Common shared features
   - Version + Environment pills
   - Theme toggle + persistence
   - Lightweight and GitHub Pages–safe
*/

const APP_VERSION = "v0.5.2";
const THEME_KEY = "app_theme";

function detectEnvironment() {
  const { protocol, hostname } = window.location;
  if (protocol === "file:") return "File";
  if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";
  if (hostname.endsWith("github.io")) return "GitHub Pages";
  return "Web";
}

function setStatusPills() {
  const v = document.getElementById("pillVersion");
  const e = document.getElementById("pillEnv");
  if (v) v.textContent = APP_VERSION;
  if (e) e.textContent = detectEnvironment();
}

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
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
  setStatusPills();
  applyTheme(getPreferredTheme());

  const btn = document.getElementById("btnTheme");
  if (btn) btn.addEventListener("click", toggleTheme);
});
