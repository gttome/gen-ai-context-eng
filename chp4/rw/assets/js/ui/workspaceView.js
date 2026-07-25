import { buildComparisonPacket, getCoachingMessage } from "../domain/comparisonEngine.js";
import { buildCheckStudyGuide, buildScenarioCoaching } from "../domain/coachingGuide.js";
import { completeRunAction, notePacketCopiedAction, resetCurrentRunAction, setCheckSelectionAction, setDecisionAction, setPastebackOutputAction, toggleMonitoringAction } from "../state/actions.js";
import { q } from "./dom.js";
import { scoreBarClass, STATUS_SEQUENCE, STEP_LABELS, toTitleCase } from "./shared.js";

export function renderWorkspaceView(state, scenario, scoredState, store, announce = () => {}) {
  q("#mission-objective").textContent = scenario.objective;
  q("#incident-title").textContent = scenario.title;
  q("#incident-summary").textContent = scenario.incidentSummary;
  q("#proposed-change").textContent = scenario.proposedChange;
  q("#candidate-result").textContent = scenario.candidateResult || "This scenario asks you to compare the proposed change packet rather than a full candidate answer.";
  q("#baseline-result").textContent = scenario.baselineResult;

  renderProgressStepper(state, scenario, scoredState);
  renderChecks(state, scenario, store, announce);
  renderSignals(scenario, scoredState);
  renderDecisionPanel(state, scenario, scoredState, store, announce);
  renderSidebar(state, scenario, scoredState);
  renderExternalPanel(state, scenario, scoredState, store, announce);
}

function renderProgressStepper(state, scenario, scoredState) {
  const externalDone = !scenario.manualExternalComparison || (scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null);
  const steps = {
    orient: true,
    anchor: true,
    compare: scoredState.totalReviewed === scenario.standingChecks.length,
    judge: !!state.run.decision,
    steward: (state.run.monitoring?.length || 0) > 0 && externalDone
  };
  q("#progress-stepper").innerHTML = STEP_LABELS.map((step) => `
    <div class="step ${steps[step.id] ? "complete" : ""}">
      <strong>${step.label}</strong>
      <span>${steps[step.id] ? "Complete" : "Next up"}</span>
    </div>
  `).join("");
}

function renderChecks(state, scenario, store, announce) {
  const container = q("#checks-container");
  if (!container) return;
  const selections = state.run.checkSelections || {};
  q("#check-progress").textContent = `${Object.keys(selections).length} of ${scenario.standingChecks.length} reviewed`;

  container.innerHTML = scenario.standingChecks.map((check) => {
    const selection = selections[check.id];
    const reviewed = !!selection;
    const studyGuide = buildCheckStudyGuide(check, selection);
    const choiceButtons = STATUS_SEQUENCE.map((status) => {
      const classes = ["choice-button"];
      if (selection === status) classes.push("active");
      if (selection && status === selection && selection === check.expectedStatus) classes.push("correct-match");
      if (selection && status === selection && selection !== check.expectedStatus) classes.push("mismatch");
      return `<button class="${classes.join(" ")}" data-check-id="${check.id}" data-status="${status}" type="button" aria-pressed="${String(selection === status)}">${toTitleCase(status)}</button>`;
    }).join("");

    const isRiskyExpected = ["weakened", "tradeoff"].includes(check.expectedStatus);
    const riskExplainer = isRiskyExpected
      ? `<div class="risk-explainer"><strong>Why this is risky:</strong> ${check.riskWhy || check.candidateObservation}</div>`
      : "";

    const reviewBanner = reviewed
      ? `<p class="study-note ${selection === check.expectedStatus ? "study-note-match" : "study-note-miss"}"><strong>Study cue:</strong> ${studyGuide.studyNudge}</p>`
      : "";

    return `
      <article class="check-card ${reviewed ? "reviewed" : ""}">
        <div class="check-top">
          <div>
            <h3>${check.title}</h3>
            <p><strong>Protects:</strong> ${check.whatItProtects}</p>
          </div>
          <span class="check-risk risk-${String(check.riskLevel).toLowerCase()}">Risk ${check.riskLevel}</span>
        </div>
        <p><strong>Baseline anchor:</strong> ${check.baselineProtectedBehavior}</p>
        <p><strong>Candidate observation:</strong> ${check.candidateObservation}</p>
        ${riskExplainer}
        ${reviewBanner}
        <div class="choice-group" role="group" aria-label="Check interpretation choices">
          ${choiceButtons}
        </div>
        ${selection ? `<p><strong>Expected read:</strong> ${toTitleCase(check.expectedStatus)}.</p>` : ""}
        <details class="check-help">
          <summary>Interpretation help</summary>
          <div class="check-help-body">
            <p><strong>Question to ask:</strong> ${studyGuide.question}</p>
            <p><strong>Strongest-practice read:</strong> ${studyGuide.strongestRead}</p>
            <p><strong>Common mistake:</strong> ${studyGuide.commonMistake}</p>
          </div>
        </details>
      </article>
    `;
  }).join("");

  container.onclick = (event) => {
    const button = event.target.closest("[data-check-id][data-status]");
    if (!button) return;
    const checkId = button.dataset.checkId;
    const status = button.dataset.status;
    const check = scenario.standingChecks.find((item) => item.id === checkId);
    store.setState(setCheckSelectionAction(checkId, status));
    announce(`${check?.title || "Check"} marked as ${status}.`);
  };
}

function renderSignals(scenario, scoredState) {
  const grid = q("#signals-grid");
  if (!grid) return;
  const signalEntries = [...Object.entries(scenario.signals)];
  if (scenario.manualExternalComparison && scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null) {
    signalEntries.push(["externalFit", {
      label: scoredState.externalAnalysis.label,
      score: scoredState.externalAnalysis.score,
      summary: scoredState.externalAnalysis.summary
    }]);
  }

  grid.innerHTML = signalEntries.map(([key, signal]) => {
    const isRiskSignal = key === "regressionRisk";
    const trackClass = isRiskSignal
      ? (signal.score >= 70 ? "danger" : signal.score <= 35 ? "success" : "warning")
      : (signal.score >= 80 ? "success" : signal.score <= 45 ? "danger" : "warning");
    return `
      <article class="signal-card">
        <div class="signal-head">
          <span>${key.replace(/([A-Z])/g, " $1").replace(/^./, (m) => m.toUpperCase())}</span>
          <span>${signal.label}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar ${trackClass}" style="width:${signal.score}%"></div>
        </div>
        <p>${signal.summary}</p>
      </article>
    `;
  }).join("");
}

function renderDecisionPanel(state, scenario, scoredState, store, announce) {
  const ladder = q("#release-ladder");
  if (ladder) {
    ladder.querySelectorAll(".ladder-button").forEach((button) => {
      const isActive = state.run.decision === button.dataset.decision;
      button.classList.toggle("active", isActive);
      button.classList.toggle("correct", state.run.completed && button.dataset.decision === scoredState.correctDecision);
      button.setAttribute("aria-pressed", String(isActive));
    });

    ladder.onclick = (event) => {
      const button = event.target.closest(".ladder-button[data-decision]");
      if (!button) return;
      store.setState(setDecisionAction(button.dataset.decision));
      announce(`Decision set to ${button.dataset.decision}.`);
      q("#finish-run")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
  }

  q("#decision-hint").textContent = state.run.decision
    ? `Selected: ${state.run.decision}`
    : "Review the checks before locking a decision";

  const monitoringContainer = q("#monitoring-options");
  if (monitoringContainer) {
    monitoringContainer.innerHTML = scenario.monitoringFollowUps.map((item, index) => `
      <label class="monitoring-option">
        <input type="checkbox" data-monitoring-index="${index}" ${state.run.monitoring.includes(item) ? "checked" : ""}>
        <span>${item}</span>
      </label>
    `).join("");

    monitoringContainer.onchange = (event) => {
      const checkbox = event.target.closest("input[type='checkbox'][data-monitoring-index]");
      if (!checkbox) return;
      const item = scenario.monitoringFollowUps[Number(checkbox.dataset.monitoringIndex)];
      store.setState(toggleMonitoringAction(item, checkbox.checked));
      announce(`Monitoring item ${checkbox.checked ? "selected" : "cleared"}.`);
    };
  }

  const finishButton = q("#finish-run");
  const canFinish = scoredState.totalReviewed === scenario.standingChecks.length && !!state.run.decision && (state.run.monitoring?.length || 0) > 0;
  if (finishButton) {
    finishButton.disabled = !canFinish;
    finishButton.title = canFinish ? "Complete this mission and open the debrief" : "Review all checks, choose a decision, and select at least one monitoring item first.";
    finishButton.onclick = () => {
      if (!canFinish) return;
      store.setState(completeRunAction({ scenario, scored: scoredState }));
      announce("Mission completed. Debrief opened.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  const resetButton = q("#reset-run");
  if (resetButton) {
    resetButton.onclick = () => {
      store.setState(resetCurrentRunAction());
      announce("Current mission reset.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
}

function renderSidebar(state, scenario, scoredState) {
  q("#coach-text").textContent = getCoachingMessage(scenario, scoredState);

  const coaching = buildScenarioCoaching(scenario, scoredState, state.run);
  const focusList = q("#coach-focus-list");
  if (focusList) {
    focusList.innerHTML = [`<li><strong>${coaching.headline}</strong></li>`, ...coaching.bullets.map((item) => `<li>${item}</li>`)].join("");
  }

  const externalSnippet = (scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null)
    ? ` External fit: ${scoredState.externalAnalysis.score} (${scoredState.externalAnalysis.label}).`
    : "";
  q("#debrief-preview").textContent = `${scenario.strongestPracticeDecision.why} Next best cue: ${scoredState.nextBestImprovementCue}.${externalSnippet}`.trim();

  const scorecard = q("#scorecard");
  if (!scorecard) return;
  scorecard.innerHTML = scoredState.dimensionRows.map((row) => {
    const barClass = scoreBarClass(row.score);
    return `
      <div class="score-row">
        <div class="score-row-top">
          <strong>${row.label}</strong>
          <span>${row.score}</span>
        </div>
        <div class="progress-track"><div class="progress-bar ${barClass}" style="width:${row.score}%"></div></div>
      </div>
    `;
  }).join("") + `
    <div class="score-row score-summary">
      <div class="score-row-top">
        <strong>Mastery label</strong>
        <span>${scoredState.masteryLabel}</span>
      </div>
      <small>${scoredState.nextBestImprovementCue}</small>
    </div>
  `;
}

function renderExternalPanel(state, scenario, scoredState, store, announce) {
  const panel = q("#external-panel");
  if (!panel) return;
  panel.classList.toggle("hidden", !scenario.manualExternalComparison);
  if (!scenario.manualExternalComparison) return;

  const packet = buildComparisonPacket(scenario);
  q("#comparison-packet").value = packet;
  const pasteback = q("#pasteback-output");
  pasteback.value = state.run.pastebackOutput || "";
  pasteback.oninput = () => {
    store.setState(setPastebackOutputAction(pasteback.value));
  };

  q("#copy-packet").onclick = async () => {
    try {
      await navigator.clipboard.writeText(packet);
      announce("Comparison packet copied.");
    } catch (error) {
      console.warn("Clipboard write failed", error);
      announce("Clipboard copy failed in this browser context.");
    }
    store.setState(notePacketCopiedAction());
  };

  const analysis = scoredState.externalAnalysis;
  const analysisContainer = q("#external-analysis");
  if (!analysisContainer) return;
  const scoreMarkup = analysis?.score !== null
    ? `<div class="external-score"><span class="pill subtle-pill">External fit ${analysis.score}</span><span>${analysis.label}</span></div>`
    : `<div class="external-score"><span class="pill subtle-pill">External fit pending</span><span>${analysis?.label || "Not scored yet"}</span></div>`;

  const strengths = (analysis?.strengths || []).map((item) => `<li>${item}</li>`).join("");
  const risks = (analysis?.risks || []).map((item) => `<li>${item}</li>`).join("");
  const detailStats = analysis?.score !== null ? `
    <div class="external-score">
      <span class="pill subtle-pill">Required anchors ${analysis.requiredHits}/${analysis.requiredTotal}</span>
      <span class="pill subtle-pill">Discouraged hits ${analysis.discouragedHits}</span>
      <span class="pill subtle-pill">Sentences ${analysis.sentences}</span>
    </div>
  ` : "";

  analysisContainer.innerHTML = `
    <div class="analysis-card">
      ${scoreMarkup}
      ${detailStats}
      <p>${analysis?.summary || "Paste an external-model result to score it against the authored watchtower heuristics."}</p>
      ${strengths ? `<div><strong>What held up</strong><ul class="compact-list">${strengths}</ul></div>` : ""}
      ${risks ? `<div><strong>What still looks risky</strong><ul class="compact-list">${risks}</ul></div>` : ""}
    </div>
  `;
}
