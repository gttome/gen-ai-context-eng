(function () {
  "use strict";

  const STORAGE_KEY = "contextSkeletonStudioTheme";

  function safeMatchMedia(query) {
    try {
      return !!(window.matchMedia && window.matchMedia(query).matches);
    } catch (e) {
      return false;
    }
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return "";
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function normalizeTheme(value) {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();
    if (v === "dark" || v === "light") return v;
    return "";
  }

  function getPreferredTheme() {
    const stored = normalizeTheme(safeGet(STORAGE_KEY));
    if (stored) return stored;
    return safeMatchMedia("(prefers-color-scheme: dark)") ? "dark" : "light";
  }

  function applyTheme(theme) {
    const t = normalizeTheme(theme) || "light";
    document.documentElement.setAttribute("data-theme", t);

    // Helps native form controls render in the right scheme.
    try {
      document.documentElement.style.colorScheme = t;
    } catch (e) {
      // ignore
    }

    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      const isDark = t === "dark";
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      btn.textContent = "Theme: " + (isDark ? "Dark" : "Light");
      btn.title = "Switch to " + (isDark ? "Light" : "Dark") + " theme";
    }

    try {
      window.dispatchEvent(new CustomEvent("css-theme-changed", { detail: { theme: t } }));
    } catch (e) {
      // ignore
    }
  }

  function toggleTheme() {
    const current = normalizeTheme(document.documentElement.getAttribute("data-theme")) || getPreferredTheme();
    const next = current === "dark" ? "light" : "dark";
    safeSet(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Apply immediately to reduce flash.
  applyTheme(getPreferredTheme());

  // Bind button if present.
  document.addEventListener("click", function (evt) {
    const target = evt.target;
    if (!target) return;
    if (target.id === "themeToggleBtn") {
      evt.preventDefault();
      toggleTheme();
    }
  });

  // Expose minimal API for debugging.
  window.CSS_THEME = {
    get: getPreferredTheme,
    apply: applyTheme,
    toggle: toggleTheme,
    storageKey: STORAGE_KEY
  };
})();
