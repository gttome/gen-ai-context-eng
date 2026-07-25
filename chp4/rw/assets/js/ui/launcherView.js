import { filterScenarios } from "../domain/launcherCatalog.js";
import { resetLauncherFiltersAction, setLauncherFilterAction, startScenarioAction } from "../state/actions.js";
import { q } from "./dom.js";
import { DEFAULT_FILTERS } from "./shared.js";

export function renderLauncherView(state, store, announce = () => {}) {
  renderScenarioFilters(state, store);
  renderScenarioList(state, store, announce);
}

function renderScenarioFilters(state, store) {
  const host = q("#launcher-filter-controls");
  if (!host) return;

  const domains = [...new Set(state.scenarios.map((scenario) => scenario.domain))].sort();
  const difficulties = [...new Set(state.scenarios.map((scenario) => scenario.difficulty))];
  const packs = [...new Set(state.scenarios.map((scenario) => scenario.pack || "Core Watchtower Pack"))].sort();
  const filters = { ...DEFAULT_FILTERS, ...(state.launcherFilters || {}) };

  host.innerHTML = `
    <div class="filter-toolbar" aria-label="Mission filters">
      <label class="filter-field filter-search">
        <span>Search</span>
        <input id="filter-search" data-filter-key="search" type="search" value="${filters.search}" placeholder="Find by title, objective, domain, or pack">
      </label>
      <label class="filter-field">
        <span>Domain</span>
        <select id="filter-domain" data-filter-key="domain">
          <option value="all">All domains</option>
          ${domains.map((domain) => `<option value="${domain}" ${filters.domain === domain ? "selected" : ""}>${domain}</option>`).join("")}
        </select>
      </label>
      <label class="filter-field">
        <span>Difficulty</span>
        <select id="filter-difficulty" data-filter-key="difficulty">
          <option value="all">All levels</option>
          ${difficulties.map((difficulty) => `<option value="${difficulty}" ${filters.difficulty === difficulty ? "selected" : ""}>${difficulty}</option>`).join("")}
        </select>
      </label>
      <label class="filter-field">
        <span>Pack</span>
        <select id="filter-pack" data-filter-key="pack">
          <option value="all">All packs</option>
          ${packs.map((pack) => `<option value="${pack}" ${filters.pack === pack ? "selected" : ""}>${pack}</option>`).join("")}
        </select>
      </label>
      <label class="filter-field">
        <span>Mode</span>
        <select id="filter-mode" data-filter-key="mode">
          <option value="all">All modes</option>
          <option value="external" ${filters.mode === "external" ? "selected" : ""}>External comparison</option>
          <option value="internal" ${filters.mode === "internal" ? "selected" : ""}>Internal-only</option>
        </select>
      </label>
      <label class="filter-field">
        <span>Sort</span>
        <select id="filter-sort" data-filter-key="sort">
          <option value="recommended" ${filters.sort === "recommended" ? "selected" : ""}>Recommended order</option>
          <option value="difficulty" ${filters.sort === "difficulty" ? "selected" : ""}>Difficulty</option>
          <option value="title" ${filters.sort === "title" ? "selected" : ""}>Title</option>
        </select>
      </label>
      <div class="filter-actions">
        <button id="reset-filters" class="ghost-button" type="button">Reset filters</button>
      </div>
    </div>
  `;

  host.oninput = (event) => {
    const control = event.target.closest("[data-filter-key='search']");
    if (!control) return;
    store.setState(setLauncherFilterAction(control.dataset.filterKey, control.value));
  };

  host.onchange = (event) => {
    const control = event.target.closest("[data-filter-key]");
    if (!control) return;
    store.setState(setLauncherFilterAction(control.dataset.filterKey, control.value));
  };

  host.onclick = (event) => {
    const button = event.target.closest("#reset-filters");
    if (!button) return;
    store.setState(resetLauncherFiltersAction());
  };
}

function renderScenarioList(state, store, announce = () => {}) {
  const list = q("#scenario-list");
  if (!list) return;
  const rows = filterScenarios(state.scenarios, state.launcherFilters || DEFAULT_FILTERS);

  const countNode = q("#launcher-results-count");
  if (countNode) countNode.textContent = `${rows.length} mission${rows.length === 1 ? "" : "s"} currently match these filters.`;

  if (!rows.length) {
    list.innerHTML = `<article class="scenario-card"><h3>No missions match these filters</h3><p>Reset the launcher filters or broaden the search terms.</p></article>`;
    list.onclick = null;
    return;
  }

  list.innerHTML = rows.map(({ scenario }) => `
      <article class="scenario-card">
        <div class="scenario-meta">
          <span class="meta-tag">${scenario.domain}</span>
          <span class="meta-tag">${scenario.difficulty}</span>
          <span class="meta-tag">${scenario.manualExternalComparison ? "External comparison step" : "Internal-only comparison"}</span>
          <span class="meta-tag">${scenario.pack || "Core Watchtower Pack"}</span>
        </div>
        <h3>${scenario.title}</h3>
        <p>${scenario.objective}</p>
        <p><strong>Learning focus:</strong> ${scenario.learningFocus || "Protect the trusted baseline, judge the candidate change, and choose monitoring proportionate to the remaining risk."}</p>
        <div class="button-row">
          <button class="primary-button" data-action="start" data-scenario-id="${scenario.id}" type="button">Start mission</button>
        </div>
      </article>
    `).join("");

  list.onclick = (event) => {
    const button = event.target.closest("[data-action='start'][data-scenario-id]");
    if (!button) return;
    const scenarioId = button.dataset.scenarioId;
    const scenario = state.scenarios.find((item) => item.id === scenarioId);
    store.setState(startScenarioAction(scenarioId));
    announce(`${scenario?.title || "Mission"} started.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}
