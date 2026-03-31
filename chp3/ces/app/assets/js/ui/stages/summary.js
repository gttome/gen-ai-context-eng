import { escapeHtml, inlineBadges, list } from "../components.js";
import { renderMetricDelta } from "../shared.js";
import { actionRow, stageIntro, twoColumnStage } from "../stage-frame.js";

function missionWrap(derived) {
  const next = derived.missionDirector?.nextMission;
  if (!next) return "";
  return `<div class="summary-card cue-card"><p class="coach-eyebrow">Mission Director</p><h3>${escapeHtml(next.title)}</h3><p class="small muted">${escapeHtml(next.instruction)}</p><div class="card-actions">${next.scenarioId ? `<button class="primary-btn" data-action="start-scenario" data-scenario="${escapeHtml(next.scenarioId)}">${escapeHtml(next.cta || "Start recommended mission")}</button>` : ""}</div></div>`;
}

export function renderSummary(state, scenario, metrics, derived) {
  const left = `<div class="summary-card"><h2>Run summary</h2><p class="muted">Core run complete. The app translates your shaping decisions into a reviewable artifact, diagnostic metrics, and a next-best revision cue.</p>${inlineBadges([`Composite ${metrics.composite}`, metrics.readiness, state.run.coreCompleted ? "Core complete" : "Core incomplete"])}<p class="small muted">${escapeHtml(metrics.narrativeSummary)}</p><h3>Strengths</h3>${list(metrics.strengths, "strength-list")}<h3>Risks</h3>${list(metrics.risks, "risk-list")}</div>${missionWrap(derived)}`;
  const right = `<div class="summary-card"><h3>What to change next</h3>${list(metrics.nextBestActions, "warning-list")}<h3>Attempt delta</h3>${renderMetricDelta(derived)}${actionRow([`<button class="primary-btn" data-action="open-explore">Optional: Explore more</button>`, `<button class="secondary-btn" data-action="copy-artifact">Copy learner artifact</button>`, `<button class="secondary-btn" data-action="print-artifact">Print learner artifact</button>`, `<button class="secondary-btn" data-action="replay-same-pack">Replay this pack</button>`, `<button class="danger-btn" data-action="reset-run">Restart fresh</button>`])}</div>`;
  return `<section class="stage-panel active" id="panel-summary">${stageIntro("Run summary", "Use this summary as a coaching artifact. The strongest value is not the score by itself, but the revision path it exposes.")}${twoColumnStage(left, right)}</section>`;
}
