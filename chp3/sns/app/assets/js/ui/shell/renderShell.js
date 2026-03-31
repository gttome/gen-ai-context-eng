import { escapeHtml } from "../../utils/helpers.js";

export function renderHeader(state, derivedState) {
  const mission = derivedState.mission;
  const classifiedText = mission ? `${derivedState.readiness.classifiedCount} / ${derivedState.readiness.totalCount} cards classified` : "No mission started";
  const budgetText = mission ? `${derivedState.packageState.usedBudget} / ${derivedState.packageState.budgetLimit} tokens` : "Budget not active";
  const stageLabels = {
    launch: "Launch",
    brief: "Brief",
    workspace: "Workspace",
    export: "Export + paste-back",
    comparison: "Comparison",
    summary: "Summary"
  };
  const stepText = stageLabels[state.session.stage] || "Launch";
  const canReturnToDirector = state.session?.missionId && state.session.stage !== "launch";
  const canRestartFresh = Boolean(state.session?.missionId || Object.keys(state.missionDirector || {}).length);
  return `
    <header class="app-header">
      <a class="skip-link" href="#app-main">Skip to main content</a>
      <div class="app-header-inner">
        <div class="header-top">
          <div class="header-brand">
            <div class="inline-actions">
              <span class="pill">${escapeHtml(state.appName || "Signal-to-Noise Studio")}</span>
              <span class="pill">Version ${escapeHtml(state.config?.version || "v1")}</span>
              <span class="pill">Environment ${escapeHtml(state.environmentLabel || "")}</span>
            </div>
            <div>
              <h1>Selection discipline you can see</h1>
              <p>Smaller, better-judged context packages outperform bloated ones when the consequences are visible.</p>
            </div>
          </div>
          <div class="header-actions">
            ${canReturnToDirector ? `<button class="primary-button director-nav-button" data-back-to-launch="true">Mission Director Map · Start a new mission</button>` : ""}
            ${canRestartFresh ? `<button class="ghost-button restart-fresh-button" data-restart-fresh="true">Restart fresh</button>` : ""}
            <button class="theme-toggle" data-theme-toggle="true">Theme · ${escapeHtml(state.theme === "system" ? "System" : state.theme)}</button>
            <a class="link-button" href="./help.html">Help</a>
            <a class="link-button" href="./feedback.html">Feedback</a>
          </div>
        </div>
        <div class="summary-strip" role="status" aria-label="Mission summary">
          <div class="strip-item"><small>Mission</small><strong>${escapeHtml(mission?.title || "Choose a validation pack")}</strong></div>
          <div class="strip-item"><small>Budget</small><strong>${escapeHtml(budgetText)}</strong></div>
          <div class="strip-item"><small>Progress</small><strong>${escapeHtml(classifiedText)}</strong></div>
          <div class="strip-item"><small>Current step</small><strong>${escapeHtml(stepText)}</strong></div>
        </div>
      </div>
    </header>
  `;
}
