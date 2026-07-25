export function detectEnvironment() {
  const runtimeWindow = typeof window !== "undefined" ? window : { location: {} };
  const location = runtimeWindow.location || {};
  const protocol = location.protocol || "";
  const hostname = location.hostname || "";
  if (protocol === "file:") return "File";
  if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";
  if (hostname && hostname.endsWith("github.io")) return "GitHub Pages";
  return "Web";
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function formatMetricLabel(metricId) {
  return metricId.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
}

export function getQueryState() {
  if (typeof window === 'undefined') {
    return { screen:null, scenario:null, lane:null, resume:null, path:null, seed:null, autoplay:null, branch:null };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    screen: params.get("screen"),
    scenario: params.get("scenario"),
    lane: params.get("lane"),
    resume: params.get("resume"),
    path: params.get("path"),
    seed: params.get("seed"),
    autoplay: params.get("autoplay"),
    branch: params.get("branch")
  };
}
