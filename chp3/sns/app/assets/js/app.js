import { createStore, createInitialState, reducer } from "./state/store.js";
import { ACTIONS } from "./state/actions.js";
import { loadSession, saveSession, clearSession } from "./state/persistence.js";
import { readStageFromHash, setStageHash } from "./router.js";
import { getEnvironmentLabel } from "./utils/helpers.js";
import { selectDerivedState, selectFilteredCards } from "./state/selectors.js";
import { renderHeader } from "./ui/shell/renderShell.js";
import { renderLaunchScreen, renderBriefScreen, renderWorkspaceScreen, renderExportScreen, renderComparisonScreen, renderSummaryScreen, renderModal } from "./ui/screens/renderScreen.js";
import { announce } from "./ui/a11y/liveRegion.js";
import { applyTheme, getSavedTheme } from "./ui/shell/themeController.js";
import { bindAppInteractions } from "./ui/events/appEventBindings.js";

const store = createStore(createInitialState(), reducer);
const uiState = { modal: null };

function openModal(type, value = null) {
  uiState.modal = { type, value };
  render();
}

function closeModal() {
  uiState.modal = null;
  render();
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function loadMissions() {
  const index = await loadJson("./assets/data/missions/index.json");
  const loaded = [];
  for (const item of index) loaded.push(await loadJson(`./assets/data/missions/${item.id}.json`));
  return loaded;
}

function serializableState(state) {
  return {
    appVersion: state.appVersion,
    appName: state.appName,
    theme: state.theme,
    needsResumeNotice: Boolean(state.session?.missionId),
    missionDirector: state.missionDirector || {},
    session: { ...state.session, lastSavedAt: new Date().toISOString() }
  };
}

function missionStageOrder() {
  return ["launch", "brief", "workspace", "export", "comparison", "summary"];
}

function renderStage(state, derivedState, filteredCards) {
  switch (state.session.stage) {
    case "brief": return renderBriefScreen(state, derivedState);
    case "workspace": return renderWorkspaceScreen(state, derivedState, filteredCards);
    case "export": return renderExportScreen(state, derivedState);
    case "comparison": return renderComparisonScreen(state, derivedState);
    case "summary": return renderSummaryScreen(state, derivedState);
    default: return renderLaunchScreen(state);
  }
}

function render() {
  const state = store.getState();
  state.__ui = uiState;
  const derivedState = selectDerivedState(state);
  const filteredCards = selectFilteredCards(state);
  const root = document.getElementById("app-root");
  const modalRoot = document.getElementById("modal-content");

  document.body.dataset.stage = state.session.stage || "launch";
  document.getElementById("app-header").innerHTML = renderHeader(state, derivedState);
  root.innerHTML = renderStage(state, derivedState, filteredCards);

  const modalMarkup = renderModal(state, derivedState);
  const modalNode = document.getElementById("modal");
  if (modalMarkup) {
    modalNode.setAttribute("open", "true");
    modalRoot.innerHTML = modalMarkup;
  } else {
    modalNode.removeAttribute("open");
    modalRoot.innerHTML = "";
  }
  setStageHash(state.session.stage || "launch");
}

function syncStageFromHash() {
  const stage = readStageFromHash();
  const state = store.getState();
  if (!stage || !missionStageOrder().includes(stage)) return;
  if (!state.session.missionId && stage !== "launch") return;
  if (stage !== state.session.stage) store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage } });
}

function persistState() {
  const state = store.getState();
  if (!state.config) return;
  saveSession(state.config.storageKeys.session, serializableState(state));
}

export async function initApp() {
  const [config, glossary, metricsConfig, coachingConfig, missions] = await Promise.all([
    loadJson("./assets/data/config.json"),
    loadJson("./assets/data/glossary.json"),
    loadJson("./assets/data/metrics.json"),
    loadJson("./assets/data/coaching.json"),
    loadMissions()
  ]);

  const savedTheme = getSavedTheme(config.storageKeys.theme);
  applyTheme(savedTheme);
  const restored = loadSession(config.storageKeys.session, config.version);

  store.dispatch({
    type: ACTIONS.INIT_DATA,
    payload: { config, glossary, metricsConfig, coachingConfig, missions, environmentLabel: getEnvironmentLabel(config), theme: restored?.theme || savedTheme }
  });

  if (restored?.session?.missionId || restored?.missionDirector) {
    store.dispatch({
      type: ACTIONS.RESTORE_SESSION,
      payload: {
        theme: restored?.theme || savedTheme,
        needsResumeNotice: Boolean(restored?.session?.missionId),
        session: restored?.session || undefined,
        missionDirector: restored?.missionDirector || {}
      }
    });
  }

  render();
  bindAppInteractions({ store, uiState, announce, clearSession, openModal, closeModal });
  window.addEventListener("hashchange", syncStageFromHash);
  store.subscribe(() => {
    persistState();
    render();
  });
}
