import { renderSummary } from "../panels/renderPanels.js";
import { renderBonusBranchButtons, renderBranchContextBanner } from "./renderScreenHelpers.js";

export function renderSummaryScreen(state, derivedState) {
  const mission = derivedState.baseMission || derivedState.mission;
  return `
    <section class="screen" aria-labelledby="summary-heading">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.2rem;">
            <h2 id="summary-heading">Run summary</h2>
            <p>The core mission is complete. Bonus exploration can deepen the same case logic without invalidating completion.</p>
          </div>
          <div class="inline-actions">
            <button data-back-comparison="true">Back</button>
            <button data-back-to-launch="true">Mission Director Map</button>
            ${renderBonusBranchButtons(mission)}
          </div>
        </div>
      </div>
      ${derivedState.activeBonusBranch ? renderBranchContextBanner(derivedState.mission, derivedState.activeBonusBranch, derivedState.branchPolicy) : ""}
      ${renderSummary(derivedState, state.session)}
    </section>
  `;
}
