import { escapeHtml } from "../../utils/helpers.js";
import { renderMissionCards, renderLanes, renderMetricsPanel, renderPackagePreview } from "../panels/renderPanels.js";
import { renderBranchChecklist, renderBranchContextBanner } from "./renderScreenHelpers.js";

export function renderWorkspaceScreen(state, derivedState, filteredCards) {
  const mission = derivedState.mission;
  return `
    <section class="screen" aria-labelledby="workspace-heading">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.2rem;">
            <h2 id="workspace-heading">Selection workspace</h2>
            <p>Experiment first. Every major decision should create a visible consequence in the package, metrics, or review state.</p>
          </div>
          <div class="inline-actions">
            <button data-back-to-launch="true">Mission Director Map</button>
            <button data-reset-mission="true">Reset mission</button>
            <button class="primary-button" data-build-export="true" ${derivedState.readiness.reviewReady ? "" : "disabled"}>Build package → export workflow</button>
          </div>
        </div>
        ${derivedState.activeBonusBranch ? `${renderBranchContextBanner(mission, derivedState.activeBonusBranch, derivedState.branchPolicy)}${renderBranchChecklist(mission) ? `<div class="note-box" style="margin-top:.75rem;"><strong>Replay checklist</strong>${renderBranchChecklist(mission)}</div>` : ""}` : ""}
        ${!derivedState.readiness.policyReady ? `<div class="warning-box" style="margin-top:.9rem;"><strong>Replay constraints still need work</strong><p>${escapeHtml(derivedState.packageState.policyStatus.violations[0]?.body || "Adjust the package to satisfy the active replay rules before exporting.")}</p></div>` : ""}
        <div class="note-box" style="margin-top:.9rem;"><strong>Where paste-back happens</strong><p>After you build the package, the next screen walks you through copy → run externally → paste back → review.</p></div>
        <div class="filter-row" style="margin-top:.9rem;">
          <input type="search" placeholder="Search cards" value="${escapeHtml(state.session.filters.search || "")}" data-filter-search="true" />
          <select data-filter-authority="true">
            ${["all","High","Medium","Low"].map(value => `<option value="${value}" ${state.session.filters.authority === value ? "selected" : ""}>Authority · ${value}</option>`).join("")}
          </select>
          <select data-filter-freshness="true">
            ${["all","Current","Aging","Stale"].map(value => `<option value="${value}" ${state.session.filters.freshness === value ? "selected" : ""}>Freshness · ${value}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="panel-grid">
        <div class="stack">
          <section class="panel">
            <div class="screen-actions">
              <div class="stack" style="gap:.2rem;">
                <h3>Candidate source cards</h3>
                <p>Cards teach tradeoffs. If a card does not materially help the task, it should not survive by default.</p>
              </div>
              <span class="pill">${filteredCards.length} visible</span>
            </div>
            <div style="margin-top:1rem;">
              ${renderMissionCards(filteredCards, state.session.classifications)}
            </div>
          </section>

          <section class="panel">
            <h3>Curation lanes</h3>
            <p class="small">On phones, the easiest flow is to tap a card action and watch the lane lists update below.</p>
            <div style="margin-top:1rem;">
              ${renderLanes(mission, derivedState.packageState)}
            </div>
          </section>
        </div>

        <aside class="sticky-side">
          ${renderMetricsPanel(derivedState, state.metricsConfig)}
          ${renderPackagePreview(mission, derivedState)}
        </aside>
      </div>
    </section>
  `;
}
