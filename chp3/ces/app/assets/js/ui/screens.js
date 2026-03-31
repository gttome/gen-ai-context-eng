import { escapeHtml } from "./components.js";
import { STAGES, stageLabel, selectedScenario, renderLeftRail, renderRightRail, renderNextCoachStrip } from "./shared.js";
import { renderLaunch } from "./stages/launch.js";
import { renderBrief } from "./stages/brief.js";
import { renderStudio } from "./stages/studio.js";
import { renderCopy } from "./stages/copy.js";
import { renderReview } from "./stages/review.js";
import { renderSummary } from "./stages/summary.js";
import { renderExplore } from "./stages/explore.js";

function renderStageRail(scenario, activeStage) {
  return `<nav class="stage-rail" aria-label="Run stages">${STAGES.map((stage) => `<button class="stage-chip ${stage === activeStage ? "active" : ""}" data-action="set-stage" data-stage="${stage}" ${!scenario && stage !== "launch" ? "disabled" : ""}>${stageLabel(stage)}</button>`).join("")}</nav>`;
}

export function renderApp(state, derived) {
  const scenario = selectedScenario(state);
  const activeStage = state.run.currentStage || "launch";
  const stepIndex = STAGES.indexOf(activeStage);
  const progress = stepIndex <= 0 ? 8 : Math.round(((stepIndex + 1) / (STAGES.length - 1)) * 100);
  const stageHtml = !scenario && activeStage !== "launch"
    ? renderLaunch(state, derived)
    : ({
        launch: renderLaunch(state, derived),
        brief: scenario ? renderBrief(state, scenario) : renderLaunch(state, derived),
        studio: scenario ? renderStudio(state, scenario, derived.metrics, state.config) : renderLaunch(state, derived),
        copy: scenario ? renderCopy(state, scenario, derived.metrics, state.config) : renderLaunch(state, derived),
        review: scenario ? renderReview(state, scenario, derived.metrics, derived.reviewResult, state.config, derived) : renderLaunch(state, derived),
        summary: scenario ? renderSummary(state, scenario, derived.metrics, derived) : renderLaunch(state, derived),
        explore: scenario ? renderExplore(state, scenario, derived) : renderLaunch(state, derived)
      })[activeStage] || renderLaunch(state, derived);

  return `<div class="app-shell"><header class="app-header"><div class="brand-stack"><img class="brand-mark" src="./assets/media/ces-badge.svg" alt="Context Envelope Studio badge" /><div class="brand-copy"><h1>Context Envelope Studio</h1><p>Shape selected material into a reviewable operating package. Practice section separation, order, precedence, and handoff-ready CHECKS in a short Chapter 3 studio run.</p></div></div><div class="header-actions"><span class="pill"><strong>Version</strong> ${escapeHtml(state.config.version)}</span><span class="pill"><strong>Environment</strong> ${escapeHtml(state.environment)}</span><button class="theme-toggle" data-action="toggle-theme">Toggle theme</button><a class="link-pill" href="./help.html">Help</a><a class="link-pill" href="./feedback.html">Feedback</a><a class="link-pill" href="./authoring.html">Authoring</a><a class="link-pill" href="./innovation-labs.html">Innovation Labs</a><button class="header-button" data-action="clear-all">Clear current run</button></div></header>${renderStageRail(scenario, activeStage)}<section class="progress-wrap" aria-label="Run progress"><div class="progress-labels"><span>Progress through the core run</span><span>${progress}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></section>${renderNextCoachStrip(derived.nextGuidance)}<main class="layout-grid">${renderLeftRail(state, scenario, derived)}<section class="panel center-panel">${stageHtml}</section>${renderRightRail(state, scenario, derived.metrics, derived.reviewResult, state.config, derived)}</main><p class="footer-note">Shared shell features included: version pill, environment pill, theme persistence, Help, Feedback, Authoring, resume-safe local persistence, copy fallback, printable learner artifact, reset/replay controls, and optional Innovation Labs plug-ins.</p></div>`;
}
