export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sum(values = []) {
  return values.reduce((total, value) => total + value, 0);
}

export function unique(values = []) {
  return [...new Set(values)];
}

export function titleCase(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getEnvironmentLabel(config) {
  const { protocol, hostname } = window.location;
  if (protocol === "file:") return config.environmentNames.file;
  if (hostname === "localhost" || hostname === "127.0.0.1") return config.environmentNames.local;
  if (hostname.includes("github.io")) return config.environmentNames.github;
  return config.environmentNames.web;
}

export function compositeScore(scoreMap, metricsConfig) {
  const weights = metricsConfig.categories.reduce((acc, item) => ({ ...acc, [item.id]: item.weight }), {});
  const total = Object.entries(scoreMap).reduce((sumScore, [key, value]) => sumScore + ((weights[key] || 0) * value), 0);
  return Math.round(total / 100);
}

export function tierFromScore(score) {
  if (score >= 88) return "Reliable";
  if (score >= 74) return "Reviewable";
  if (score >= 60) return "Focused";
  return "Overloaded";
}
