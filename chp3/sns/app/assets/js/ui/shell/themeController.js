export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    return;
  }
  root.setAttribute("data-theme", theme);
}

export function getSavedTheme(storageKey) {
  return localStorage.getItem(storageKey) || "system";
}

export function nextTheme(theme) {
  return theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
}

export function persistTheme(storageKey, theme) {
  localStorage.setItem(storageKey, theme);
  applyTheme(theme);
}
