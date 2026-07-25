export function detectEnvironment(locationRef = window.location) {
  if (locationRef.protocol === "file:") return "File";
  if (["localhost", "127.0.0.1"].includes(locationRef.hostname)) return "Local";
  if (locationRef.hostname.includes("github.io")) return "GitHub Pages";
  return "Web";
}

export function resolveTheme(choice, prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches) {
  if (choice === "dark" || choice === "light") return choice;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(choice, { root = document.documentElement, buttonSelector = "#theme-toggle" } = {}) {
  const resolved = resolveTheme(choice);
  root.dataset.theme = resolved;
  const button = document.querySelector(buttonSelector);
  if (button) {
    const isDark = resolved === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.textContent = isDark ? "Use light theme" : "Use dark theme";
  }
  return resolved;
}

export function announceStatus(message, liveSelector = "#status-live") {
  const live = document.querySelector(liveSelector);
  if (!live) return;
  live.textContent = "";
  window.requestAnimationFrame(() => {
    live.textContent = message;
  });
}
