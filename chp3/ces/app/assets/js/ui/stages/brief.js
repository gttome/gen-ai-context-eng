import { escapeHtml, list } from "../components.js";
import { actionRow, calloutCard, stageIntro, twoColumnStage } from "../stage-frame.js";

export function renderBrief(state, scenario) {
  const predictions = [
    "Rules and evidence may get mixed together.",
    "A stale note may quietly outrank the current source.",
    "The output shape may be too vague to review.",
    "Missing-information handling may be left implicit."
  ];
  const selected = new Set(state.run.predictions || []);
  const left = calloutCard(
    "Mission brief",
    `<p>${escapeHtml(scenario.caseBrief)}</p><h3>What success looks like</h3>${list(scenario.successCriteria, 'check-list')}<p class="small muted"><strong>Lifecycle cue:</strong> ${escapeHtml(scenario.lifecycleCue)}</p>`,
    "cue"
  );
  const right = calloutCard(
    "Prediction",
    `<p class="muted small">Before you build, predict where the package could fail if it is shaped poorly.</p><div class="prediction-grid">${predictions.map((item) => `<label class="label-check"><input type="checkbox" data-role="prediction-toggle" value="${escapeHtml(item)}" ${selected.has(item) ? 'checked' : ''} /><span>${escapeHtml(item)}</span></label>`).join('')}</div><h3 style="margin-top:1rem">Scenario-specific build coaching</h3>${list(scenario.coach?.build || [], 'check-list')}${actionRow([`<button class="primary-btn" data-action="set-stage" data-stage="studio">Start build</button>`, `<button class="secondary-btn" data-action="set-stage" data-stage="launch">Back to launch</button>`])}`
  );
  return `<section class="stage-panel active" id="panel-brief">${stageIntro('Mission brief', 'Discovery and Selection are already assumed. Your job here is to predict where shaping could fail before you start placing cards.')}${twoColumnStage(left, right)}</section>`;
}
