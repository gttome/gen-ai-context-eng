export function detectEnvironment() {
  const host = window.location.hostname || "";
  const protocol = window.location.protocol;
  if (protocol === "file:") return "Environment: File";
  if (host === "localhost" || host === "127.0.0.1") return "Environment: Local";
  if (host.includes("github.io")) return "Environment: GitHub Pages";
  return "Environment: Web";
}
