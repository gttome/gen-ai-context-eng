const FEEDBACK_KEY = "ces_feedback_v6";

function getStorage() {
  try { return window.localStorage; } catch {
    const memory = {};
    return {
      getItem: (key) => Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null,
      setItem: (key, value) => { memory[key] = String(value); },
      removeItem: (key) => { delete memory[key]; },
      clear: () => { Object.keys(memory).forEach((key) => delete memory[key]); }
    };
  }
}

function applyTheme(storage) {
  const saved = storage.getItem("app_theme");
  const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='toggle-theme']");
    if (!button) return;
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.setItem("app_theme", next);
  });
}

function renderFeedbackHistory(storage) {
  const historyNode = document.getElementById("feedback-history");
  if (!historyNode) return;
  const history = JSON.parse(storage.getItem(FEEDBACK_KEY) || "[]");
  historyNode.innerHTML = history.length
    ? `<ul class="check-list">${history.map((item) => `<li><strong>${new Date(item.savedAt).toLocaleString()}</strong> — ${item.message}</li>`).join("")}</ul>`
    : `<p class="muted small">No local feedback saved in this browser yet.</p>`;
}

function initFeedback(storage) {
  const form = document.getElementById("feedback-form");
  const textarea = document.getElementById("feedback-text");
  const status = document.getElementById("feedback-status");
  if (!form || !textarea || !status) return;

  renderFeedbackHistory(storage);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!textarea.value.trim()) return;
    const history = JSON.parse(storage.getItem(FEEDBACK_KEY) || "[]");
    history.unshift({ message: textarea.value.trim(), savedAt: new Date().toISOString() });
    storage.setItem(FEEDBACK_KEY, JSON.stringify(history.slice(0, 10)));
    status.textContent = "Saved locally in this browser.";
    textarea.value = "";
    renderFeedbackHistory(storage);
  });
}

const storage = getStorage();
applyTheme(storage);
initFeedback(storage);
