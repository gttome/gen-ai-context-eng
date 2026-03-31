export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "readonly");
  area.style.position = "absolute";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
  return Promise.resolve();
}

export function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function formatTitleCase(value = "") {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function scoreTone(score) {
  if (score >= 80) return "supported";
  if (score >= 55) return "weak";
  return "conflicted";
}

export function sectionSurface(section) {
  const map = {
    ROLE: "var(--surface-role)",
    RULES: "var(--surface-rules)",
    REFERENCE: "var(--surface-reference)",
    "DYNAMIC FACTS": "var(--surface-facts)",
    TASK: "var(--surface-task)",
    OUTPUT: "var(--surface-output)",
    CHECKS: "var(--surface-checks)"
  };
  return map[section] || "var(--bg-muted)";
}

export function choiceLabel(options = [], id = "") {
  return options.find((item) => item.id === id)?.label || id || "Not set";
}

export function metricRows(metrics = {}) {
  return Object.entries(metrics).map(([key, value]) => ({ key, value }));
}
