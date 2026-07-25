import { STORAGE_KEYS } from "../config.js";

function setDocumentTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme === "light");
}

export function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeOnLoad() {
  setDocumentTheme(getPreferredTheme());
}

export function toggleTheme() {
  const current = getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEYS.theme, next);
  setDocumentTheme(next);
  return next;
}
