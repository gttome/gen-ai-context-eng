// Shared features: Version + Environment pills, Theme toggle (persisted), and safe helpers.
// Source: Shared Features Integration Guide v1 (adapted for this app).
(() => {
  "use strict";

  const APP_VERSION = "v0.3.0";
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

    const prefersDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  function safeBindThemeButton() {
    const btn = document.getElementById("btnTheme");
    if (!btn) return;
    btn.addEventListener("click", toggleTheme);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getPreferredTheme());
    setStatusPills();
    safeBindThemeButton();
  });

  // Expose a tiny API for other scripts (optional)
  window.__RagSnippetSurgeonCommon = {
    applyTheme,
    getPreferredTheme,
    detectEnvironment,
    APP_VERSION
  };
})();
