import { scoreScenario } from "../metrics/scoring.js";
import { q } from "./dom.js";
import { renderDebriefView } from "./debriefView.js";
import { renderLauncherView } from "./launcherView.js";
import { renderWorkspaceView } from "./workspaceView.js";

export function renderGlossary(glossary) {
  const container = q("#glossary-content");
  if (!container) return;
  container.innerHTML = glossary.map((item) => `
    <section class="glossary-term">
      <h3>${item.term}</h3>
      <p>${item.definition}</p>
    </section>
  `).join("");
}

export function renderApp(state, store, announce = () => {}) {
  const scenario = state.scenarios.find((item) => item.id === state.run.scenarioId) || null;
  const scoredState = scenario ? scoreScenario(scenario, state.run) : null;

  document.documentElement.dataset.theme = state.themeChoice || document.documentElement.dataset.theme || "light";

  const versionPill = q("#version-pill");
  const environmentPill = q("#environment-pill");
  const decisionPill = q("#decision-pill");
  if (versionPill) versionPill.textContent = `Version ${state.version}`;
  if (environmentPill) environmentPill.textContent = `Environment: ${state.runtime}`;
  if (decisionPill) decisionPill.textContent = `Decision: ${state.run.decision || "Not started"}`;

  q("#launcher-view")?.classList.toggle("screen-active", state.run.route === "launcher");
  q("#workspace-view")?.classList.toggle("screen-active", state.run.route === "workspace");
  q("#debrief-view")?.classList.toggle("screen-active", state.run.route === "debrief");

  renderLauncherView(state, store, announce);
  if (!scenario || !scoredState) return;
  renderWorkspaceView(state, scenario, scoredState, store, announce);
  renderDebriefView(state, scenario, scoredState);
}
