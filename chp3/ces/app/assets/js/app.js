import { loadConfig, loadGlossary, loadScenarioIndex, loadScenarioPack, validateScenarioCollection } from "./domain/content.js";
import { createStore } from "./state/store.js";
import { reducerFactory, createDefaultRun } from "./state/actions.js";
import { loadJson, saveJson } from "./state/persistence.js";
import { renderApp } from "./ui/screens.js";
import { initAccessibility } from "./ui/accessibility.js";
import { selectAppViewModel } from "./state/selectors.js";
import { registerChangeHandlers } from "./ui/events/change-handlers.js";
import { registerClickHandlers } from "./ui/events/click-handlers.js";
import { registerDragHandlers } from "./ui/events/drag-handlers.js";

function detectEnvironment() {
  if (window.location.protocol === "file:") return "File";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "Local";
  if (host.includes("github.io")) return "GitHub Pages";
  return "Web";
}

function preferredTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

async function bootstrap() {
  const config = await loadConfig();
  const reducer = reducerFactory(config);
  const initialState = {
    ready: false,
    config,
    scenarioIndex: { scenarios: [] },
    scenarios: {},
    glossary: [],
    validation: {},
    theme: loadJson(config.storageKeys.theme, null) || preferredTheme(),
    environment: detectEnvironment(),
    run: loadJson(config.storageKeys.runState, createDefaultRun(config.sectionOrder)),
    history: loadJson(config.storageKeys.history, [])
  };

  const store = createStore(initialState, reducer);
  const [glossary, scenarioIndex] = await Promise.all([loadGlossary(), loadScenarioIndex()]);
  const scenarios = {};
  for (const item of scenarioIndex.scenarios) scenarios[item.id] = await loadScenarioPack(item.id);
  const validation = validateScenarioCollection(scenarios, config);

  store.dispatch({
    type: "BOOTSTRAP_READY",
    payload: { config, glossary, scenarioIndex, scenarios, validation, environment: detectEnvironment() }
  });
  store.dispatch({ type: "LOAD_HISTORY", payload: loadJson(config.storageKeys.history, []) });

  const savedRun = loadJson(config.storageKeys.runState, null);
  if (savedRun?.scenarioId) store.dispatch({ type: "RESUME_RUN", payload: savedRun });

  document.documentElement.dataset.theme = store.getState().theme;
  initAccessibility();
  const root = document.getElementById("app");
  if (!root) return;

  function persist(state) {
    saveJson(config.storageKeys.theme, state.theme);
    saveJson(config.storageKeys.runState, state.run);
    saveJson(config.storageKeys.history, state.history || []);
  }

  function render() {
    root.innerHTML = renderApp(store.getState(), selectAppViewModel(store.getState()));
  }

  store.subscribe((state) => {
    persist(state);
    document.documentElement.dataset.theme = state.theme;
    render();
  });

  registerChangeHandlers({ store });
  registerClickHandlers({ store, getDerived: selectAppViewModel, config });
  registerDragHandlers({ store });
  render();
}

bootstrap().catch((error) => {
  const root = document.getElementById("app");
  if (root) root.innerHTML = `<div class="app-shell"><div class="panel"><h1>Context Envelope Studio failed to load</h1><p>${error.message}</p></div></div>`;
  console.error(error);
});
