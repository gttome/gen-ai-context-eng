import { applyTheme, getSavedTheme, nextTheme, persistTheme } from "./themeController.js";

function getConfig() {
  return {
    themeKey: "app_theme",
    feedbackKey: document.body.dataset.feedbackKey || "sns_feedback_v15"
  };
}

function bindThemeButton(themeKey) {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const syncLabel = () => {
    const current = getSavedTheme(themeKey);
    button.textContent = `Theme · ${current === "system" ? "System" : current.charAt(0).toUpperCase() + current.slice(1)}`;
  };

  syncLabel();

  document.addEventListener("click", (event) => {
    const themeButton = event.target.closest("[data-theme-toggle]");
    if (!themeButton) return;
    const current = getSavedTheme(themeKey);
    const next = nextTheme(current);
    persistTheme(themeKey, next);
    syncLabel();
  });
}

function initHelpPage() {
  const { themeKey } = getConfig();
  applyTheme(getSavedTheme(themeKey));
  bindThemeButton(themeKey);
}

function initFeedbackPage() {
  const { themeKey, feedbackKey } = getConfig();
  applyTheme(getSavedTheme(themeKey));
  bindThemeButton(themeKey);

  const input = document.getElementById("feedbackInput");
  const status = document.getElementById("feedbackStatus");
  if (!input || !status) return;

  input.value = localStorage.getItem(feedbackKey) || "";
  status.textContent = input.value ? "Saved note restored from local storage." : "No saved note yet.";

  document.getElementById("saveFeedback")?.addEventListener("click", () => {
    localStorage.setItem(feedbackKey, input.value);
    status.textContent = "Feedback saved locally.";
  });

  document.getElementById("copyFeedback")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(input.value || "").then(() => {
      status.textContent = "Feedback copied to clipboard.";
    }).catch(() => {
      status.textContent = "Clipboard copy failed in this browser.";
    });
  });

  document.getElementById("clearFeedback")?.addEventListener("click", () => {
    input.value = "";
    localStorage.removeItem(feedbackKey);
    status.textContent = "Feedback cleared.";
  });
}

const page = document.body.dataset.page;
if (page === "help") initHelpPage();
if (page === "feedback") initFeedbackPage();
