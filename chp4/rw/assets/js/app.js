import { APP_VERSION, createInitialState, createStore } from "./state/store.js";
import { replayScenarioAction, returnToLauncherAction, toggleThemeAction } from "./state/actions.js";
import { loadScenarioContent } from "./domain/scenarioLoader.js";
import { renderApp, renderGlossary } from "./ui/render.js";
import { announceStatus, applyTheme, detectEnvironment } from "./platform/runtime.js";

async function bootstrap() {
  const payload = await loadScenarioContent();

  const initialState = createInitialState();
  initialState.version = APP_VERSION;
  initialState.runtime = detectEnvironment();
  initialState.scenarios = payload.scenarios;
  initialState.glossary = payload.glossary;
  initialState.scenarioRegistry = payload.registry;

  const explicitTheme = localStorage.getItem("app_theme");
  if (explicitTheme) initialState.themeChoice = explicitTheme;
  applyTheme(initialState.themeChoice);

  const store = createStore(initialState);
  let previousRoute = initialState.run.route;
  renderGlossary(initialState.glossary);
  renderApp(store.getState(), store, announceStatus);

  store.subscribe((state) => {
    applyTheme(state.themeChoice);
    if (state.themeChoice) localStorage.setItem("app_theme", state.themeChoice);
    renderApp(state, store, announceStatus);
    if (state.run.route !== previousRoute) {
      focusRouteHeading(state.run.route);
      previousRoute = state.run.route;
    }
  });

  bindGlobalControls(store);
}

function focusRouteHeading(route) {
  const headingId = route === "workspace" ? "workspace-title" : route === "debrief" ? "debrief-title" : "launcher-title";
  const heading = document.getElementById(headingId);
  if (!heading) return;
  window.requestAnimationFrame(() => heading.focus());
}

function bindGlobalControls(store) {
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    store.setState(toggleThemeAction(document.documentElement.dataset.theme || "light"));
  });

  const glossaryDrawer = document.querySelector("#glossary-drawer");
  const glossaryToggle = document.querySelector("#glossary-toggle");
  const glossaryClose = document.querySelector("#glossary-close");
  glossaryToggle?.addEventListener("click", () => {
    const expanded = glossaryDrawer.classList.toggle("open");
    glossaryDrawer.setAttribute("aria-hidden", String(!expanded));
    glossaryToggle.setAttribute("aria-expanded", String(expanded));
  });
  glossaryClose?.addEventListener("click", () => {
    glossaryDrawer.classList.remove("open");
    glossaryDrawer.setAttribute("aria-hidden", "true");
    glossaryToggle.setAttribute("aria-expanded", "false");
  });

  window.addEventListener("rw:replay", (event) => {
    store.setState(replayScenarioAction(event.detail.scenarioId));
    announceStatus("Mission restarted.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("rw:returnToLauncher", () => {
    store.setState(returnToLauncherAction());
    announceStatus("Returned to the mission launcher.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Regression Watchtower", error);
  const main = document.querySelector("#main-content");
  if (main) main.innerHTML = `<section class="card"><h2>Unable to load the app</h2><p>${error.message}</p></section>`;
});
