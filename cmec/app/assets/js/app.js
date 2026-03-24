import { appData } from '../data/app-data.js';
import { APP_CONFIG } from './config.js';
import { announce } from './utils/accessibility.js';
import { qs, on } from './utils/dom.js';
import { createStore } from './state/store.js';
import { applyComponentChange, applyExploreDrill, applyRecommendedAction, changeTheme, clearSession, completePrediction, resetMission, resumeSaved, revealStrongState, selectScenario, toggleCompareView, toggleExploreMore, updateDebrief, updatePasteResult } from './state/actions.js';
import { clearSession as clearPersistedSession, loadSession, loadTheme, saveSession, saveTheme } from './state/persistence.js';
import { renderShell } from './ui/renderShell.js';
import { serializeState } from './domain/missionEngine.js';

const theme = loadTheme() || APP_CONFIG.defaultTheme;
document.documentElement.dataset.theme = theme;

const store = createStore(appData, theme);
const appRoot = qs('#app');

function render() {
  const state = store.getState();
  document.documentElement.dataset.theme = state.theme;
  const resumeSnapshot = loadSession();
  appRoot.classList.toggle('has-mission', Boolean(state.currentScenario));
  appRoot.innerHTML = renderShell(state, appData, APP_CONFIG, resumeSnapshot);
  persistIfNeeded();
}

function persistIfNeeded() {
  const snapshot = serializeState(store.getState());
  if (snapshot?.currentScenario) {
    saveSession(snapshot);
  }
}

function setActionFeedback(message, type = 'info') {
  const feedback = document.querySelector('#copy-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = type;
}

function flashButtonLabel(button, temporaryLabel, timeout = 1800) {
  if (!button) return;
  const original = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = temporaryLabel;
  window.setTimeout(() => {
    button.textContent = button.dataset.originalLabel || original;
  }, timeout);
}

async function copyTextWithFallback(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_error) {
    // fall back below
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', 'true');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  helper.style.pointerEvents = 'none';
  document.body.appendChild(helper);
  helper.focus();
  helper.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (_error) {
    copied = false;
  }
  document.body.removeChild(helper);
  return copied;
}

function highlightAndScroll(selector, feedbackMessage) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.classList.add('section-flash');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => target.classList.remove('section-flash'), 1800);
  if (feedbackMessage) setActionFeedback(feedbackMessage, 'success');
}

function handleThemeToggle() {
  const next = store.getState().theme === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  store.dispatch(changeTheme(next));
  announce(`Theme changed to ${next}.`);
}

on(document, 'click', '[data-action="toggle-theme"]', () => handleThemeToggle());

on(document, 'click', '[data-action="launch-scenario"]', (_event, button) => {
  store.dispatch(selectScenario(button.dataset.scenarioId));
  announce('Mission launched.');
});

on(document, 'click', '[data-action="launch-harder"]', (_event, button) => {
  store.dispatch(selectScenario(button.dataset.scenarioId, { harder: true }));
  announce('Harder replay launched.');
});

on(document, 'click', '[data-action="apply-repair"]', (_event, button) => {
  store.dispatch(applyRecommendedAction(button.dataset.repairId));
  announce('Recommended repair applied.');
});

on(document, 'click', '[data-action="apply-explore-drill"]', (_event, button) => {
  store.dispatch(applyExploreDrill(button.dataset.drillId));
  announce('Explore drill loaded.');
  requestAnimationFrame(() => highlightAndScroll('#current-package-section', 'Explore drill loaded into the current package. Compare the block changes and the metric movement below.'));
});

on(document, 'click', '[data-action="toggle-component"]', (_event, button) => {
  const included = button.dataset.nextIncluded === 'true';
  store.dispatch(applyComponentChange(button.dataset.componentId, included));
  announce(`Component ${included ? 'included' : 'excluded'}.`);
});

on(document, 'change', 'input[name="prediction"]', (_event, input) => {
  store.dispatch(completePrediction(input.value));
  announce('Prediction captured.');
});

on(document, 'change', '#paste-result', (event) => {
  store.dispatch(updatePasteResult(event.target.value));
  announce('Observed output saved.');
});

on(document, 'change', '#debrief', (event) => {
  store.dispatch(updateDebrief(event.target.value));
  announce('Debrief saved.');
});

on(document, 'click', '[data-action="toggle-explore"]', () => {
  store.dispatch(toggleExploreMore());
});

on(document, 'click', '[data-action="toggle-compare"]', () => {
  store.dispatch(toggleCompareView());
});

on(document, 'click', '[data-action="harder-replay"]', () => {
  store.dispatch(resetMission(true));
  announce('Mission reset into harder replay mode.');
});

on(document, 'click', '[data-action="reset-mission"]', () => {
  store.dispatch(resetMission(store.getState().harderMode));
  announce('Mission reset to the prepared weak package.');
});

on(document, 'click', '[data-action="back-to-launcher"]', () => {
  store.dispatch(clearSession());
  announce('Returned to launcher. Your saved mission is still available to resume from this browser.');
});

on(document, 'click', '[data-action="resume-saved"]', () => {
  const snapshot = loadSession();
  if (snapshot) {
    store.dispatch(resumeSaved(snapshot));
    announce('Saved mission resumed.');
  }
});

on(document, 'click', '[data-action="clear-session"]', () => {
  clearPersistedSession();
  location.reload();
});

on(document, 'click', '[data-action="reveal-strong"]', (event, button) => {
  store.dispatch(revealStrongState());
  announce('Best-practice package loaded into the current package.');
  flashButtonLabel(button, 'Loaded');
  requestAnimationFrame(() => highlightAndScroll('#current-package-section', 'Best-practice package loaded. Review the updated Current package now section and the refreshed metrics.'));
});

on(document, 'click', '[data-action="copy-manual-prompt"]', async (_event, button) => {
  const block = document.querySelector('.copy-block');
  if (!block) return;
  const textToCopy = block.textContent.trim();
  const copied = await copyTextWithFallback(textToCopy);
  if (copied) {
    announce('Copy-ready package copied.');
    flashButtonLabel(button, 'Copied');
    setActionFeedback('Current package copied to the clipboard. Paste it into your external LLM or notes.', 'success');
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(block);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  block.focus?.();
  announce('Clipboard access was blocked. The current package text is selected for manual copy.');
  flashButtonLabel(button, 'Select text now');
  setActionFeedback('Clipboard access was blocked here, so the package text was selected for manual copy. Use Ctrl+C or Command+C.', 'warning');
});

store.subscribe(render);
render();
