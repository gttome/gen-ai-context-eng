import { escapeHtml } from "../../utils/helpers.js";
import { renderBranchChecklist } from "./renderScreenHelpers.js";

export function renderBriefScreen(state, derivedState) {
  const mission = derivedState.mission;
  return `
    <section class="screen" aria-labelledby="brief-heading">
      <div class="hero-grid">
        <article class="glass-card hero">
          <div class="stack" style="gap:.8rem;">
            <span class="pill">${escapeHtml(mission.estimatedMinutes)} core mission</span>
            <h2 id="brief-heading">${escapeHtml(mission.title)}</h2>
            <p>${escapeHtml(mission.taskBrief)}</p>
            <div class="stack">
              <strong>Success criteria</strong>
              <ul>${mission.successCriteria.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </article>
        <article class="glass-card hero">
          <div class="stack" style="gap:.8rem;">
            <strong>Discovery-style boundary conditions</strong>
            <ul>
              <li><strong>Audience:</strong> ${escapeHtml(mission.taskAudience)}</li>
              <li><strong>Why it matters:</strong> ${escapeHtml(mission.whyMatters)}</li>
              <li><strong>Budget envelope:</strong> ${state.session.budgetLimit} tokens</li>
            </ul>
            <div class="note-box">
              <strong>Dynamic facts</strong>
              <ul>${mission.dynamicFacts.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            ${derivedState.activeBonusBranch ? `<div class="warning-box"><strong>${escapeHtml(derivedState.activeBonusBranch.title)}</strong><p>${escapeHtml(derivedState.activeBonusBranch.description)}</p>${renderBranchChecklist(mission)}</div>` : ""}
          </div>
        </article>
      </div>

      <div class="panel">
        <div class="stack" style="gap:.8rem;">
          <h3>Quick prediction</h3>
          <p>Use this to surface first-instinct selection bias before you touch the cards.</p>
          <label for="quickPrediction" class="sr-only">Quick prediction</label>
          <textarea id="quickPrediction" data-prediction-input="true" placeholder="${escapeHtml(mission.quickPredictionPrompt)}">${escapeHtml(state.session.quickPrediction || "")}</textarea>
          <div class="screen-actions">
            <button data-back-to-launch="true">Mission Director Map</button>
            <button class="primary-button" data-go-workspace="true">Continue to workspace</button>
          </div>
        </div>
      </div>
    </section>
  `;
}
