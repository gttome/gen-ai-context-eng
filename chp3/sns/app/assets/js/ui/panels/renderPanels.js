import { escapeHtml } from "../../utils/helpers.js";
import { CARD_ACTIONS, actionLabel, actionClass } from "../../domain/cardRules.js";
import { renderBudgetChart, renderAuthorityChart, renderFreshnessChart } from "../charts/renderCharts.js";
import { scoreDescriptor } from "../../metrics/scoringEngine.js";

export { renderPastebackReview, renderReviewInsightsModal, renderAnswerXRay, renderAnswerXRayModal, renderReviewCarryForwardSummary } from "./renderReviewPanels.js";
export { renderComparison } from "./renderComparisonPanels.js";
export { renderSummary } from "./renderSummaryPanels.js";

function severityClass(severity = "note") {
  if (severity === "danger" || severity === "warn") return "warning-box";
  if (severity === "good") return "success-box";
  return "note-box";
}

export function renderMissionCards(cards, classifications) {
  return `
    <div class="card-pool">
      ${cards.map(card => {
        const current = classifications[card.id]?.action || "";
        return `
          <article class="card" draggable="true" data-card-id="${card.id}" aria-label="${escapeHtml(card.title)}">
            <div class="card-header">
              <div class="stack" style="gap:.35rem;">
                <strong>${escapeHtml(card.title)}</strong>
                <div class="meta-row">
                  <span class="pill">${escapeHtml(card.sourceType)}</span>
                  <span class="pill">${escapeHtml(card.recency)}</span>
                  <span class="pill">${escapeHtml(card.authority)} authority</span>
                  <span class="pill">${card.tokenCost} tokens</span>
                  ${card.branchFlag ? `<span class="pill">${escapeHtml(card.branchFlag)}</span>` : ""}
                </div>
              </div>
              <button class="link-button" data-open-detail="${card.id}" aria-haspopup="dialog">Details</button>
            </div>
            <p>${escapeHtml(card.excerpt)}</p>
            ${card.branchNote ? `<div class="note-box compact-note"><strong>Replay note</strong><p>${escapeHtml(card.branchNote)}</p></div>` : ""}
            <div class="card-actions" role="group" aria-label="Choose action for ${escapeHtml(card.title)}">
              ${CARD_ACTIONS.map(action => `
                <button class="${actionClass(action.id)} ${current === action.id ? "active" : ""}" data-card-action="${action.id}" data-card-id="${card.id}">
                  ${escapeHtml(action.label)}
                </button>
              `).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

export function renderLanes(mission, packageState) {
  const laneDefs = [
    ["include", "Include", packageState.includeCards, "Direct evidence entering the package now."],
    ["summarize", "Summarize", packageState.summaryCards, "Useful value kept in compact form."],
    ["retrieveLater", "Retrieve Later", packageState.retrieveCards, "Deferred until follow-up is required."],
    ["omit", "Omit", packageState.omitCards, "Kept out because the package gets stronger without it."]
  ];

  return `
    <div class="lane-grid">
      ${laneDefs.map(([id, label, items, helper]) => `
        <section class="lane" data-lane="${id}">
          <div class="lane-header">
            <div class="stack" style="gap:.2rem;">
              <strong>${label}</strong>
              <small>${helper}</small>
            </div>
            <span class="pill">${items.length}</span>
          </div>
          <div class="lane-dropzone" data-drop-lane="${id}">
            ${items.length ? items.map(item => `
              <div class="lane-chip">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.sourceType)} · ${item.tokenCost} tokens</small>
              </div>
            `).join("") : `<div class="empty-state">Tap a card action or drag on desktop to place items here.</div>`}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

export function renderMetricsPanel(derivedState, metricsConfig) {
  const { metrics, composite, tier, badges, packageState } = derivedState;
  const categories = metricsConfig.categories;
  return `
    <section class="stack">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.3rem;">
            <h3>Live metrics</h3>
            <p>Every meaningful card move should create a visible consequence.</p>
          </div>
          <div class="inline-actions">
            <span class="progress-chip">${tier} · ${composite}</span>
            <button data-open-glossary="true">Glossary</button>
          </div>
        </div>
        <div class="metric-grid" style="margin-top:.9rem;">
          ${categories.map(category => `
            <article class="metric-card">
              <div class="metric-top">
                <div class="metric-label">${escapeHtml(category.label)}</div>
                <button class="icon-button" data-open-metric="${category.id}" aria-label="Explain ${escapeHtml(category.label)}">?</button>
              </div>
              <div class="metric-value">${metrics.scores[category.id]}</div>
              <div class="metric-sub">${scoreDescriptor(metrics.scores[category.id])} · ${escapeHtml(category.good)}</div>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h3>Package charts</h3>
        <div class="stack" style="margin-top:.9rem;">
          ${renderBudgetChart(packageState)}
          ${renderAuthorityChart(packageState)}
          ${renderFreshnessChart(packageState)}
        </div>
      </div>

      <div class="panel">
        <h3>Risk cues</h3>
        <div class="stack" style="margin-top:.8rem;">
          <div class="${metrics.riskCues.missingEssential ? "warning-box" : "success-box"}">
            Missing essential evidence · ${metrics.riskCues.missingEssential ? "Present" : "Controlled"}
          </div>
          <div class="${metrics.riskCues.staleIncluded ? "warning-box" : "success-box"}">
            Stale-source risk · ${metrics.riskCues.staleIncluded ? "Present" : "Controlled"}
          </div>
          <div class="${metrics.riskCues.duplicatePressure ? "warning-box" : "success-box"}">
            Duplicate pressure · ${metrics.riskCues.duplicatePressure ? "Present" : "Controlled"}
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>Mastery signals</h3>
        <div class="inline-actions" style="margin-top:.7rem;">
          ${badges.length ? badges.map(badge => `<span class="pill">${escapeHtml(badge)}</span>`).join("") : `<span class="pill">Keep classifying to unlock signals</span>`}
        </div>
      </div>
    </section>
  `;
}

export function renderPackagePreview(mission, derivedState) {
  const { packageState, coaching, readiness } = derivedState;
  return `
    <section class="stack">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.2rem;">
            <h3>Curated package preview</h3>
            <p>The package should stay selective and reviewable.</p>
          </div>
          <span class="pill">${packageState.usedBudget} / ${packageState.budgetLimit} tokens</span>
        </div>

        <div class="preview-block" style="margin-top:1rem;">
          <div>
            <strong>Direct evidence</strong>
            ${packageState.includeCards.length ? `<ul>${packageState.includeCards.map(card => `<li>${escapeHtml(card.title)}</li>`).join("")}</ul>` : `<div class="empty-state">No direct evidence selected yet.</div>`}
          </div>
          <div>
            <strong>Summaries</strong>
            ${packageState.summaryCards.length ? `<ul>${packageState.summaryCards.map(card => `<li>${escapeHtml(card.summaryText)}</li>`).join("")}</ul>` : `<div class="empty-state">No summary blocks selected yet.</div>`}
          </div>
          <div>
            <strong>Retrieve later</strong>
            ${packageState.retrieveCards.length ? `<ul>${packageState.retrieveCards.map(card => `<li>${escapeHtml(card.title)}</li>`).join("")}</ul>` : `<div class="empty-state">No retrieve-later items selected yet.</div>`}
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>Coaching</h3>
        <div class="stack" style="margin-top:.9rem;">
          ${coaching.map(item => `
            <div class="${severityClass(item.severity)}">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.body)}</p>
            </div>
          `).join("")}
          ${packageState.policyStatus?.violations?.map(item => `
            <div class="warning-box">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.body)}</p>
            </div>
          `).join("") || ""}
        </div>
      </div>

      <div class="panel">
        <h3>Review readiness</h3>
        <div class="stack" style="margin-top:.8rem;">
          <div class="${readiness.essentialReady ? "success-box" : "warning-box"}">
            Essential evidence classified · ${readiness.essentialReady ? "Ready" : "Still missing"}
          </div>
          <div class="${readiness.policyReady ? "success-box" : "warning-box"}">
            Bonus-drill constraints · ${readiness.policyReady ? "Ready" : "Adjust package first"}
          </div>
          <div class="${readiness.reviewReady ? "success-box" : "note-box"}">
            Classified cards · ${readiness.classifiedCount} / ${readiness.totalCount}
          </div>
          ${packageState.policyStatus?.activeRules?.length ? `<div class="note-box"><strong>Active replay rules</strong><ul>${packageState.policyStatus.activeRules.map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </div>
    </section>
  `;
}

export function renderModalCard(card, chosenAction) {
  return `
    <div class="modal-top">
      <div class="stack" style="gap:.3rem;">
        <h3>${escapeHtml(card.title)}</h3>
        <div class="detail-meta">
          <span class="pill">${escapeHtml(card.sourceType)}</span>
          <span class="pill">${escapeHtml(card.recency)}</span>
          <span class="pill">${escapeHtml(card.authority)} authority</span>
          <span class="pill">${card.tokenCost} tokens</span>
          <span class="pill">${escapeHtml(actionLabel(chosenAction || "unclassified"))}</span>
        </div>
      </div>
      <button data-close-modal="true">Close</button>
    </div>
    <div class="stack">
      <div class="note-box"><strong>Excerpt</strong><p>${escapeHtml(card.excerpt)}</p></div>
      <div class="success-box"><strong>Why this card exists</strong><p>${escapeHtml(card.summaryText)}</p></div>
      <div class="note-box"><strong>Teaches</strong><p>${escapeHtml(card.teaches || "Selection judgment")}</p></div>
    </div>
  `;
}

export function renderGlossaryModal(glossary) {
  return `
    <div class="modal-top">
      <div class="stack" style="gap:.3rem;">
        <h3>Selection glossary</h3>
        <p>Use this to keep Chapter 3 vocabulary visible while you work.</p>
      </div>
      <button data-close-modal="true">Close</button>
    </div>
    <div class="stack glossary-list">
      ${glossary.map(item => `
        <div class="note-box">
          <strong>${escapeHtml(item.term)}</strong>
          <p>${escapeHtml(item.short)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderMetricModal(metric, score) {
  if (!metric) return "";
  return `
    <div class="modal-top">
      <div class="stack" style="gap:.3rem;">
        <h3>${escapeHtml(metric.label)}</h3>
        <div class="detail-meta">
          <span class="pill">Current score ${score}</span>
          <span class="pill">Weight ${metric.weight}</span>
        </div>
      </div>
      <button data-close-modal="true">Close</button>
    </div>
    <div class="stack">
      <div class="success-box">
        <strong>What healthy looks like</strong>
        <p>${escapeHtml(metric.good)}</p>
      </div>
      <div class="warning-box">
        <strong>What weakens it</strong>
        <p>${escapeHtml(metric.bad)}</p>
      </div>
      <div class="note-box">
        <strong>How to improve it</strong>
        <p>${metric.id === "signal" ? "Trim anything that does not materially change the answer." : metric.id === "authority" ? "Let source-of-record material lead over secondary commentary." : metric.id === "freshness" ? "Prefer current evidence and demote aging or stale material." : metric.id === "budget" ? "Spend capacity on answer-shaping evidence before background." : "Make each choice easy to defend in a review or handoff."}</p>
      </div>
    </div>
  `;
}
