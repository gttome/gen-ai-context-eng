import { APP_VERSION } from "./state/store.js";
import { applyTheme, detectEnvironment } from "./platform/runtime.js";

function loadTheme() {
  try {
    return localStorage.getItem("app_theme");
  } catch {
    return null;
  }
}

function persistTheme(choice) {
  try {
    localStorage.setItem("app_theme", choice);
  } catch (error) {
    console.warn("Unable to persist theme", error);
  }
}

function loadSavedFeedback() {
  try {
    return localStorage.getItem("rw_feedback_note");
  } catch {
    return null;
  }
}

function saveFeedback(note) {
  try {
    localStorage.setItem("rw_feedback_note", note);
  } catch (error) {
    console.warn("Unable to save feedback note", error);
  }
}

function bootstrapSupport() {
  const versionPill = document.querySelector("#version-pill");
  const environmentPill = document.querySelector("#environment-pill");
  if (versionPill) versionPill.textContent = `Version ${APP_VERSION}`;
  if (environmentPill) environmentPill.textContent = `Environment: ${detectEnvironment()}`;

  let themeChoice = loadTheme();
  applyTheme(themeChoice);

  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    themeChoice = (themeChoice || document.documentElement.dataset.theme || "light") === "dark" ? "light" : "dark";
    applyTheme(themeChoice);
    persistTheme(themeChoice);
  });

  const form = document.querySelector("#feedback-form");
  const output = document.querySelector("#feedback-output");
  const copyButton = document.querySelector("#copy-feedback");
  if (output) output.textContent = loadSavedFeedback() || "No feedback saved yet.";

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const note = [
      `Role: ${data.get("name") || "Not provided"}`,
      `Overall clarity: ${data.get("rating")}`,
      "",
      String(data.get("message") || "")
    ].join("\n");
    saveFeedback(note);
    if (output) output.textContent = note;
  });

  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output?.textContent || "");
    } catch (error) {
      console.warn("Unable to copy feedback", error);
    }
  });
}

bootstrapSupport();
