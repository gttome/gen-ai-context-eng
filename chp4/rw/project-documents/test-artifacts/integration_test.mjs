import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:8065";

async function fetchWithRetry(url, attempts = 12, waitMs = 500) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}
const pages = [
  "index.html",
  "help.html",
  "feedback.html",
  "assets/data/scenario-registry.json",
  "assets/data/glossary.json",
  "assets/data/scenario-packs/core-watchtower-pack.json",
  "assets/data/scenario-packs/optional-challenge-pack.json",
  "assets/css/styles.css",
  "assets/js/app.js",
  "assets/js/domain/launcherCatalog.js",
  "assets/js/ui/render.js"
];
for (const page of pages) {
  const response = await fetchWithRetry(`${base}/${page}`);
  assert.equal(response.status, 200, `${page} did not return 200`);
  const text = await response.text();
  assert.ok(text.length > 0, `${page} returned empty content`);
}
const indexHtml = await (await fetchWithRetry(`${base}/index.html`)).text();
assert.ok(indexHtml.includes("Choose a watchtower run"));
assert.ok(!indexHtml.includes("qa.html"));
assert.ok(!indexHtml.includes("verification-pill"));
assert.ok(!indexHtml.includes("Download debrief"));
assert.ok(!indexHtml.includes("Resume last run"));
assert.ok(indexHtml.includes("practice-next"));
assert.ok(indexHtml.includes("mission-jump"));
assert.ok(indexHtml.includes("launcher-results-count"));
assert.ok(indexHtml.includes("Recommended flow:"));
assert.ok(indexHtml.includes("Move in order when you are learning:"));
const storeJs = await fs.readFile("assets/js/state/store.js", "utf8");
assert.ok(storeJs.includes("v15.0.0"));
assert.ok(!storeJs.includes("rw_watchtower_state"));
console.log("integration_checks_passed");
