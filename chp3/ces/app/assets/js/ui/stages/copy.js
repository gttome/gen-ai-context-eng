import { buildPreviewText } from "../../domain/envelope.js";
import { buildReadinessChecklist } from "../coaching.js";
import { escapeHtml, list } from "../components.js";
import { actionRow, calloutCard, stageIntro, twoColumnStage } from "../stage-frame.js";

export function renderCopy(state, scenario, metrics, config) {
  const preview = buildPreviewText(scenario, state.run, config);
  const readiness = buildReadinessChecklist(scenario, state.run, metrics, config);
  const left = calloutCard(
    "Copy & run externally",
    `<p class="muted">This is a deliberate lab step, not a detour. Copy the envelope, run it in your external model, then return with the observed output.</p><h3>What to watch in the external run</h3>${list(scenario.outputReminder, "check-list")}<h3>Scenario-specific copy coaching</h3>${list(scenario.coach?.copy || [], "check-list")}<h3>Quick readiness check</h3><ul class="check-list">${readiness.map((item) => `<li>${item.passed ? "✅" : "⬜"} ${escapeHtml(item.label)}</li>`).join("")}</ul><p class="small muted">Copy fallback is built in for browsers that restrict <code>navigator.clipboard</code>. After the external run, come back here and choose <strong>I ran it — go to Review</strong>.</p>${actionRow([`<button class="primary-btn prominent-next" data-action="copy-preview">Copy envelope</button>`, `<button class="secondary-btn" data-action="set-stage" data-stage="review">I ran it — go to Review</button>`, `<button class="ghost-btn" data-action="set-stage" data-stage="studio">Back to studio</button>`])}`,
    "cue"
  );
  const right = calloutCard("Copy-ready preview", `<pre class="preview-box">${escapeHtml(preview)}</pre>`);
  return `<section class="stage-panel active" id="panel-copy">${stageIntro("Copy & run externally", "The studio stays static by design. Treat the external run as a first-class learning step, then return with the observed result.")}${twoColumnStage(left, right)}</section>`;
}
