function routeTime(params) {
  const raw = params.get("t");
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null;
}

export function readRoute(locationLike = window.location) {
  const params = new URLSearchParams(locationLike.search);
  const review = params.get("review");
  const lab = params.get("lab");
  const chapterId = params.get("chapter");
  const videoId = params.get("video");
  if (lab === "home") return { name: "lab", scenarioId: null };
  if (lab) return { name: "lab", scenarioId: lab };
  if (review === "quick") return { name: "review", mode: "quick", chapterId: null };
  if (review === "chapter" && chapterId) return { name: "review", mode: "chapter", chapterId };
  if (!chapterId && !videoId) return { name: "home" };
  if (chapterId && !videoId) return { name: "chapter", chapterId };
  if (chapterId && videoId) return { name: "video", chapterId, videoId, timeSeconds: routeTime(params) };
  return { name: "invalid" };
}

export function routeUrl(route) {
  const url = new URL("./", window.location.href);
  url.search = "";
  url.hash = "";
  if (route.name === "chapter") url.searchParams.set("chapter", route.chapterId);
  if (route.name === "video") {
    url.searchParams.set("chapter", route.chapterId);
    url.searchParams.set("video", route.videoId);
    if (Number.isFinite(route.timeSeconds) && route.timeSeconds >= 0) url.searchParams.set("t", String(Math.round(route.timeSeconds * 10) / 10));
  }
  if (route.name === "lab") {
    url.searchParams.set("lab", route.scenarioId || "home");
  }
  if (route.name === "review") {
    url.searchParams.set("review", route.mode === "chapter" ? "chapter" : "quick");
    if (route.mode === "chapter" && route.chapterId) url.searchParams.set("chapter", route.chapterId);
  }
  return `${url.pathname}${url.search}`;
}

export function navigate(route, { replace = false } = {}) {
  const method = replace ? "replaceState" : "pushState";
  window.history[method](route, "", routeUrl(route));
  window.dispatchEvent(new CustomEvent("app:navigate", { detail: route }));
}
