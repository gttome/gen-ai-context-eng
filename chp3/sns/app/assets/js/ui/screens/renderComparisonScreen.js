import { escapeHtml } from "../../utils/helpers.js";
import { renderComparison, renderReviewCarryForwardSummary } from "../panels/renderPanels.js";
import { renderBranchContextBanner } from "./renderScreenHelpers.js";

export function renderComparisonScreen(state, derivedState) {
  return `
    <section class="screen" aria-labelledby="comparison-heading">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.2rem;">
            <h2 id="comparison-heading">Comparison and debrief</h2>
            <p>Use the strongest-practice package to see why smaller, better-judged context packages outperform bloated ones.</p>
          </div>
          <div class="inline-actions">
            <button data-back-export="true">Back</button>
            <button data-back-to-launch="true">Mission Director Map</button>
            <button data-open-answer-xray="true" ${state.session.pastedOutput ? "" : "disabled"}>Answer X-Ray</button>
            <button data-open-review-insights="true" ${state.session.pastedOutput ? "" : "disabled"}>Inspect rubric review</button>
            <button class="primary-button" data-open-summary="true">Open summary</button>
          </div>
        </div>
      </div>
      ${derivedState.activeBonusBranch ? renderBranchContextBanner(derivedState.mission, derivedState.activeBonusBranch, derivedState.branchPolicy) : ""}
      ${state.session.pastedOutput ? renderReviewCarryForwardSummary(derivedState.pastebackReview) : ""}
      ${renderComparison(derivedState)}
      <div class="panel">
        <h3>Observed output note</h3>
        ${state.session.pastedOutput ? `<div class="note-box"><p>${escapeHtml(state.session.pastedOutput.slice(0, 550))}${state.session.pastedOutput.length > 550 ? "…" : ""}</p></div>` : `<div class="note-box">No paste-back text recorded. The debrief still explains likely package-level consequences.</div>`}
      </div>
    </section>
  `;
}
