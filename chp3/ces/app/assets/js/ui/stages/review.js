import { escapeHtml, list } from "../components.js";
import { metricGrid } from "../charts.js";
import { renderMetricDelta } from "../shared.js";
import { actionRow, calloutCard, stageIntro } from "../stage-frame.js";

function reviewScoreBars(reviewResult) {
  return `<div class="metric-grid">${[["Task fit", reviewResult.scores.taskFit], ["Evidence use", reviewResult.scores.evidenceUse], ["Uncertainty handling", reviewResult.scores.uncertaintyHandling], ["Format fit", reviewResult.scores.formatFit]].map(([label, value]) => `<div class="metric-bar"><div class="score-row"><strong>${label}</strong><span>${value}</span></div><div class="metric-track"><div class="metric-fill" style="width:${value}%"></div></div></div>`).join("")}</div>`;
}

function sectionComparisonCards(derived) {
  return derived.strongestComparison.sections.map((section) => `<div class="comparison-card"><h3>${escapeHtml(section.section)}</h3><p class="small muted"><strong>Status:</strong> ${escapeHtml(section.status)}</p><p class="small muted"><strong>Why strongest practice is stronger:</strong> ${escapeHtml(section.rationale)}</p><p class="small muted"><strong>Expected:</strong> ${section.expectedLabels.length ? escapeHtml(section.expectedLabels.join(" → ")) : "None"}</p><p class="small muted"><strong>Current:</strong> ${section.currentLabels.length ? escapeHtml(section.currentLabels.join(" → ")) : "None"}</p>${section.missingLabels.length ? `<p class="small muted"><strong>Missing:</strong> ${escapeHtml(section.missingLabels.join(", "))}</p>` : ""}${section.extraLabels.length ? `<p class="small muted"><strong>Extra here:</strong> ${escapeHtml(section.extraLabels.join(", "))}</p>` : ""}${section.orderDrift.length ? `<p class="small muted"><strong>Order drift:</strong> ${escapeHtml(section.orderDrift.join(", "))}</p>` : ""}<p class="small muted"><strong>Better next move:</strong> ${escapeHtml(section.improvement)}</p></div>`).join("");
}

function decisionComparison(derived) {
  return `<div class="comparison-card"><h3>Decision drift vs strongest practice</h3>${derived.strongestComparison.decisions.map((item) => `<div class="decision-row"><p class="small muted"><strong>${escapeHtml(item.label)}</strong> ${item.aligned ? "✅" : "⬜"}</p><p class="small muted">Current: ${escapeHtml(item.current)}</p><p class="small muted">Expected: ${escapeHtml(item.expected)}</p><p class="small muted">${escapeHtml(item.why)}</p></div>`).join("")}<h4>Current vs prior attempt</h4>${renderMetricDelta(derived)}</div>`;
}

function counterfactualStudio(derived) {
  const cards = derived.counterfactualStudio?.cards || [];
  if (!cards.length) return "";
  return `<div class="callout cue"><p class="coach-eyebrow">Counterfactual Studio</p><h3>See how plausible-but-weaker shaping decisions change the run</h3><p class="muted small">${escapeHtml(derived.counterfactualStudio.takeaway || "Use counterfactual comparison to make shaping consequences visible.")}</p><div class="comparison-grid counterfactual-grid">${cards.map((card) => `<div class="comparison-card counter-card ${escapeHtml(card.tone)}"><h4>${escapeHtml(card.title)}</h4><p><strong>${card.score}</strong> — ${escapeHtml(card.readiness)}</p><p class="small muted">${escapeHtml(card.summary)}</p>${list(card.bullets, "check-list")}</div>`).join("")}</div></div>`;
}

export function renderReview(state, scenario, metrics, reviewResult, config, derived) {
  const inputCard = calloutCard("Return & review", `<p class="muted">Paste the observed model output below. The app connects visible response patterns back to the structure you built.</p><label><span class="small muted">Observed LLM output</span><textarea id="observed-output" placeholder="Paste the external-model response here...">${escapeHtml(state.run.observedOutput || "")}</textarea></label>${actionRow([`<button class="primary-btn" data-action="save-output-review">Analyze output</button>`, `<button class="secondary-btn" data-action="complete-core">Finish core run</button>`, `<button class="ghost-btn" data-action="set-stage" data-stage="copy">Back to copy step</button>`])}`);
  const structuralCard = `<div class="review-card"><h3>Structural review</h3><p><strong>Composite score:</strong> ${metrics.composite}</p><p><strong>Readiness:</strong> ${escapeHtml(metrics.readiness)}</p><p class="muted small">${escapeHtml(metrics.narrativeSummary)}</p>${metricGrid(metrics.metrics)}</div>`;
  const outputCard = `<div class="review-card"><h3>Observed output review</h3><p><strong>Status:</strong> ${escapeHtml(reviewResult.summary)}</p>${reviewScoreBars(reviewResult)}<p class="small muted"><strong>Next move:</strong> ${escapeHtml(reviewResult.nextMove || "Rerun with one structural change.")}</p></div>`;
  const diagnosticCard = `<div class="comparison-card"><h3>Diagnostic notes</h3>${list(reviewResult.notes, "check-list")}<h4>Scenario-specific review prompts</h4>${list(scenario.coach?.review || [], "check-list")}</div>`;
  return `<section class="stage-panel active" id="panel-review">${stageIntro("Return & review", "Go beyond counts. This review explains why a plausible structure is still weaker than the strongest-practice version and where the next leverage point sits.")}${inputCard}<div class="two-col">${structuralCard}${outputCard}</div>${counterfactualStudio(derived)}<div class="comparison-grid">${diagnosticCard}${decisionComparison(derived)}${sectionComparisonCards(derived)}</div>${actionRow([`<button class="secondary-btn" data-action="set-stage" data-stage="summary">Go to summary</button>`])}</section>`;
}
