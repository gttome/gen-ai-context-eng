import { APP_CONFIG, MISSIONS, GLOSSARY, COACH_MODES, SCENARIO_PACKS } from "../../data/content.js";
import { dialStyle, metricBarClass } from "./charts.js";
import { detectEnvironment } from "../utils/env.js";
import {
  buildAuditTrace,
  buildBranchSummary,
  buildChoiceDebrief,
  buildCoachNarrative,
  buildConsequenceSimulator,
  buildExecutiveDebrief,
  buildJourneyMap,
  buildLaneComparison,
  buildMasterySignals,
  buildMetricComparison,
  buildMicroChallenge,
  buildMissionDebrief,
  buildMissionSummary,
  buildProgression,
  buildReplayAnalytics,
  buildReplayTheater,
  buildReviewRoom,
  buildStakeholderMoment,
  deriveImpactCapsules,
  getActiveBranch,
  getCompletedLaneCount,
  getDisplaySnapshot,
  getExtensionCompletedCount,
  getLaneData,
  getLaneStatus,
  isBranchComplete
} from "../domain/engine.js";

const STAGES = [
  { id: "launch", label: "Launch" },
  { id: "guided", label: "Guided" },
  { id: "map", label: "Map" },
  { id: "lane", label: "Lane" },
  { id: "review", label: "Review" },
  { id: "report", label: "Report" },
  { id: "executive", label: "Exec" },
  { id: "explore", label: "Explore" },
  { id: "branch", label: "Branch" }
];

function metricHint(metric) {
  return metric.id === "exposureRisk" ? "Lower is better" : "Higher is better";
}

function deltaClass(metricId, value) {
  const positive = metricId === "exposureRisk" ? value < 0 : value > 0;
  if (value === 0) return "flat";
  return positive ? "good" : "bad";
}

function metricDeltaBadge(metricId, value) {
  const cls = deltaClass(metricId, value);
  const sign = value > 0 ? "+" : "";
  return `<span class="delta-badge ${cls}">${sign}${value}</span>`;
}

function masteryChips(items = []) {
  return `<div class="chip-row">${items.map(item => `<span class="mastery-chip">${item}</span>`).join("")}</div>`;
}

function impactChips(items = []) {
  if (!items.length) return "";
  return `<div class="chip-row impact-row">${items.map(item => `<span class="impact-chip">${item}</span>`).join("")}</div>`;
}

function renderMetrics(snapshot) {
  return APP_CONFIG.metrics.map(metric => `
    <article class="metric-card">
      <div class="metric-card__head"><span>${metric.label}</span><strong>${snapshot.metrics[metric.id]}</strong></div>
      <div class="metric-bar ${metricBarClass(metric.id, snapshot.metrics[metric.id])}" aria-hidden="true"><span style="width:${snapshot.metrics[metric.id]}%"></span></div>
      <div class="metric-card__hint">${metricHint(metric)}</div>
    </article>`).join("");
}

function renderTimeline(snapshot) {
  const timeline = snapshot.timeline?.length
    ? snapshot.timeline
    : [{ title: "No lane decisions yet", consequence: "Start the mission to see downstream consequences accumulate.", outcome: "Pending" }];
  return timeline.map(item => `
    <li class="timeline-item ${item.outcome.toLowerCase()}">
      <div class="timeline-item__title">${item.title}</div>
      <div class="timeline-item__text">${item.consequence}</div>
    </li>`).join("");
}

function renderHeader(state) {
  const env = detectEnvironment();
  const coachLabel = COACH_MODES[state.coachMode]?.label || "Mission Coach";
  return `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="shell-header">
      <div class="brand-lockup">
        <div class="brand-mark">ERN</div>
        <div>
          <h1>${APP_CONFIG.appName}</h1>
          <p>Move one promising AI workflow from prototype to governed enterprise readiness through visible tradeoffs, coaching, and replay-led improvement.</p>
        </div>
      </div>
      <div class="shell-actions">
        <span class="pill">Version <strong>${APP_CONFIG.version}</strong></span>
        <span class="pill">Environment <strong>${env}</strong></span>
        <span class="pill">Coach <strong>${coachLabel}</strong></span>
        <button class="icon-button" data-action="toggle-theme" aria-label="Toggle light and dark theme">Theme</button>
        <a class="icon-button" href="help.html">Help</a>
        <a class="icon-button" href="feedback.html">Feedback</a>
        <button class="icon-button" data-action="reset">Start over</button>
      </div>
    </header>`;
}

function renderStageRail(state) {
  return `<nav class="stage-rail" aria-label="Mission stage">${STAGES.map(stage => `<span class="stage-pill ${stage.id === state.screen ? "is-active" : ""}" ${stage.id === state.screen ? 'aria-current="step"' : ""}>${stage.label}</span>`).join("")}</nav>`;
}

function renderCoachSelector(state) {
  return `
    <section class="sidebar-panel">
      <div class="sidebar-panel__head"><h2>Guided path</h2><span class="badge">Lightweight by default</span></div>
      <p class="sidebar-note">The path changes how much coaching you see. It does not add extra required work.</p><div class="coach-selector">${Object.values(COACH_MODES).map(mode => `
        <button class="coach-toggle ${state.coachMode === mode.id ? "is-active" : ""}" data-action="set-coach" data-mode="${mode.id}" data-label="${mode.label}">${mode.label}</button>`).join("")}</div>
    </section>`;
}

function renderMissionSummaryPanel(state) {
  const scenario = MISSIONS[state.scenarioId];
  const branch = getActiveBranch(state);
  return `
    <details class="mission-recap">
      <summary>Mission recap</summary>
      <div class="mission-recap__body">
        <p><strong>Scenario:</strong> ${scenario.title}</p>
        <p><strong>Prototype state:</strong> ${scenario.prototypeState}</p>
        <p><strong>Core tension:</strong> ${scenario.coreTension}</p>
        <p><strong>Key fragile branch:</strong> ${scenario.fragileBranch}</p>
        <p><strong>Optional branch:</strong> ${branch?.title || scenario.optionalBranch}</p>
      </div>
    </details>`;
}

function renderAuditHighlights(state) {
  const audit = buildAuditTrace(state);
  return `
    <section class="sidebar-panel">
      <div class="sidebar-panel__head"><h2>Audit highlights</h2><span class="badge">${audit.hotspots.length} hotspot${audit.hotspots.length === 1 ? "" : "s"}</span></div>
      <div class="audit-grid">
        <article class="summary-card compact"><h3>Strongest moves</h3><ul>${audit.strengths.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card compact"><h3>Visible risks</h3><ul>${audit.risks.map(item => `<li>${item}</li>`).join("")}</ul></article>
      </div>
    </section>`;
}

function renderProgressPanel(state, history) {
  const progression = buildProgression(state, history);
  return `
    <section class="sidebar-panel progression-panel">
      <div class="sidebar-panel__head"><h2>Engagement track</h2><span class="badge">${progression.rankTitle}</span></div>
      <div class="summary-card compact">
        <h3>Current rank</h3>
        <p>${progression.rankGuidance}</p>
      </div>
      <div class="analytics-grid">
        <article class="summary-card compact"><h3>Disciplined lanes</h3><p>${progression.disciplinedCount}</p></article>
        <article class="summary-card compact"><h3>Fragile lanes</h3><p>${progression.fragileCount}</p></article>
        <article class="summary-card compact"><h3>Improvement streak</h3><p>${progression.improvementStreak}</p></article>
        <article class="summary-card compact"><h3>Runs</h3><p>${progression.scenarioRuns}</p></article>
      </div>
      ${masteryChips(progression.badges)}
    </section>`;
}

function renderSidebar(state, history) {
  const snapshot = getDisplaySnapshot(state);
  const analytics = buildReplayAnalytics(history, state.scenarioId);
  const masterySignals = analytics.runCount ? analytics.masterySignals : buildMasterySignals(state);
  return `
    <aside class="sidebar">
      <section class="sidebar-panel">
        <div class="sidebar-panel__head"><h2>Metrics rail</h2><span class="badge">${snapshot.readinessLabel}</span></div>
        <div class="readiness-dial" style="${dialStyle(snapshot.overallReadiness)}" aria-label="Overall readiness ${snapshot.overallReadiness} out of 100">
          <div class="readiness-dial__inner"><span class="readiness-dial__value">${snapshot.overallReadiness}</span><span class="readiness-dial__label">Overall readiness</span></div>
        </div>
        <div class="metric-grid">${renderMetrics(snapshot)}</div>
        <div class="analytics-note">${masteryChips(masterySignals)}</div>
      </section>
      ${renderCoachSelector(state)}
      ${renderProgressPanel(state, history)}
      ${renderAuditHighlights(state)}
      <section class="sidebar-panel">
        <div class="sidebar-panel__head"><h2>Consequence timeline</h2><span class="badge">${snapshot.badge}</span></div>
        <ol class="timeline">${renderTimeline(snapshot)}</ol>
      </section>
      <section class="sidebar-panel analytics-panel">
        <div class="sidebar-panel__head"><h2>Replay analytics</h2><span class="badge">${analytics.runCount} run${analytics.runCount === 1 ? "" : "s"}</span></div>
        <div class="analytics-grid">
          <article class="summary-card compact"><h3>Best</h3><p>${analytics.bestReadiness ?? "—"}</p></article>
          <article class="summary-card compact"><h3>Average</h3><p>${analytics.averageReadiness ?? "—"}</p></article>
          <article class="summary-card compact"><h3>Latest</h3><p>${analytics.latestReadiness ?? "—"}</p></article>
          <article class="summary-card compact"><h3>Trend</h3><p>${analytics.readinessTrend}</p></article>
        </div>
        <p class="analytics-narrative">${analytics.improvementNarrative}</p>
      </section>
      ${renderMissionSummaryPanel(state)}
    </aside>`;
}

function workshopSeedCard(title, seed, scenario, note) {
  return `<a class="seed-card" href="index.html?scenario=${scenario}&seed=${seed}"><strong>${title}</strong><span>${note}</span></a>`;
}

function renderScenarioCard(scenario) {
  return `
    <article class="scenario-card ${(scenario.advanced || scenario.tag?.includes("Advanced scenario") || scenario.tag?.includes("Premium pack")) ? "premium" : ""}">
      <div class="scenario-card__tag">${scenario.tag}</div>
      <h3>${scenario.title}</h3>
      <p>${scenario.prototypeState}</p>
      <ul class="mini-list">
        <li><strong>Core tension:</strong> ${scenario.coreTension}</li>
        <li><strong>Fragile branch:</strong> ${scenario.fragileBranch}</li>
        <li><strong>Explore more:</strong> ${scenario.optionalBranch}</li>
      </ul>
      <button class="primary-button" data-action="start-mission" data-scenario="${scenario.id}">Start ${scenario.title}</button>
    </article>`;
}

function renderLaunch() {
  const corePack = SCENARIO_PACKS.find(pack => pack.id === "core");
  const premiumPack = SCENARIO_PACKS.find(pack => pack.id === "premium");
  const coreCards = corePack.scenarioIds.map(id => renderScenarioCard(MISSIONS[id])).join("");
  const premiumCards = premiumPack.scenarioIds.map(id => renderScenarioCard(MISSIONS[id])).join("");
  return `
    <section class="content-panel stage-panel launch-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Scenario launch board</div>
      <h2>Choose your mission</h2>
      <p>Keep the core run fast. Extra support opens later only when it helps you learn.</p>
      <div class="section-head"><h2>${corePack.label}</h2><p>${corePack.description}</p></div>
      <div class="scenario-grid">${coreCards}</div>
    </section>
    <section class="content-panel">
      <div class="section-head"><h2>How this helps you learn</h2><p>You get clear guidance, visible tradeoffs, and short debriefs while the main mission stays quick.</p></div>
      <div class="compare-grid">
        <article class="compare-card disciplined"><h3>What you get</h3><p>Clear guidance, visible tradeoffs, and short debriefs that help you learn from each choice.</p></article>
        <article class="compare-card fragile"><h3>What stays optional</h3><p>Extra support never turns the mission into a longer required task.</p></article>
      </div>
    </section>
    <section class="content-panel">
      <div class="section-head"><h2>${premiumPack.label}</h2><p>${premiumPack.description}</p></div>
      <details class="mission-recap">
        <summary>Show advanced scenarios</summary>
        <div class="mission-recap__body"><div class="scenario-grid">${premiumCards}</div></div>
      </details>
    </section>`;
}

function renderGuidedExample(state) {
  const scenario = MISSIONS[state.scenarioId];
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Guided example</div>
      <h2>${scenario.guidedExample.title}</h2>
      <p>${scenario.guidedExample.prompt}</p>
      <div class="compare-grid">
        <article class="compare-card disciplined"><h3>Stronger move</h3><p>${scenario.guidedExample.strongMove}</p></article>
        <article class="compare-card fragile"><h3>What you are avoiding</h3><p>${scenario.fragileBranch}</p></article>
      </div>
      <div class="delta-row">${Object.entries(scenario.guidedExample.delta).map(([metricId, value]) => metricDeltaBadge(metricId, value)).join("")}</div>
      <div class="coach-grid two-up">
        <article class="coach-card"><h3>Coach cue</h3><p>${scenario.guidedExample.coaching}</p></article>
        <article class="coach-card"><h3>Engagement cue</h3><p>As you move through the next lanes, notice how one disciplined move can still be undermined if a later lane stays fragile.</p></article>
      </div>
      <div class="action-row"><button class="primary-button" data-action="enter-map">Enter readiness map</button></div>
    </section>`;
}

function renderMap(state, history) {
  const scenario = MISSIONS[state.scenarioId];
  const progression = buildProgression(state, history);
  const laneCards = APP_CONFIG.laneOrder.map((laneId, index) => {
    const lane = scenario.lanes[laneId];
    const status = getLaneStatus(state, laneId);
    const choice = state.choices[laneId];
    const chips = choice?.impacts?.length ? impactChips(choice.impacts) : "";
    return `
      <button class="lane-card ${status}" data-action="open-lane" data-lane="${laneId}" aria-label="Open ${lane.title}">
        <span class="lane-card__index">Lane ${index + 1}</span>
        <span class="lane-card__title">${lane.title}</span>
        <span class="lane-card__meta">${APP_CONFIG.laneNames[laneId]}</span>
        <span class="lane-card__status">${status === "pending" ? "Pending" : choice.outcome}</span>
        ${chips}
      </button>`;
  }).join("");
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Operational readiness map</div>
      <h2>${scenario.title}</h2>
      <p>${scenario.advanceOrganizer}</p>
      <div class="status-banner emphasis-banner"><strong>${getCompletedLaneCount(state)} of ${APP_CONFIG.completionTarget} lanes completed.</strong><span>You are currently performing as a <strong>${progression.rankTitle}</strong>. Keep choices coordinated, not isolated.</span></div>
      <div class="compare-grid">
        <article class="summary-card compact"><h3>Target state</h3><p>Move the workflow from useful prototype to a path that can be reviewed, launched, monitored, and safely backed off.</p></article>
        <article class="summary-card compact"><h3>Facilitator cue</h3><p>Ask which single weak lane would most clearly block enterprise trust even if the rest of the workflow looked strong.</p></article>
      </div>
      <div class="lane-grid">${laneCards}</div>
      <div class="action-row">
        <button class="secondary-button" data-action="next-lane">Go to next pending lane</button>
        <button class="primary-button" data-action="review" ${getCompletedLaneCount(state) < APP_CONFIG.completionTarget ? "disabled" : ""}>Open readiness review</button>
      </div>
    </section>`;
}

function renderChallengeResult(state, laneId) {
  const challenge = buildMicroChallenge(state.scenarioId, laneId);
  const result = state.challengeAnswers?.[laneId];
  if (!result) return "";
  return `<div class="summary-card compact challenge-result ${result.correct ? "correct" : "incorrect"}"><h3>${result.correct ? "Challenge result: hidden risk spotted" : "Challenge result: hidden risk revealed"}</h3><p>${challenge.explanation}</p></div>`;
}

function renderLane(state) {
  const lane = getLaneData(state.scenarioId, state.activeLaneId);
  const choice = state.choices[state.activeLaneId];
  const coach = buildCoachNarrative(state, state.activeLaneId);
  const challenge = buildMicroChallenge(state.scenarioId, state.activeLaneId);
  const challengeResult = state.challengeAnswers?.[state.activeLaneId];
  const stakeholder = buildStakeholderMoment(state, state.activeLaneId);
  const debrief = buildChoiceDebrief(choice);
  const options = lane.options.map(option => {
    const isSelected = choice && choice.optionId === option.id;
    const impacts = deriveImpactCapsules(option.deltas);
    return `
      <article class="option-card ${isSelected ? "selected" : ""}">
        <div class="option-card__head"><h3>${option.label}</h3><span class="badge">${isSelected ? choice.outcome : "Option"}</span></div>
        <p>${option.summary}</p>
        ${impactChips(impacts)}
        <div class="delta-row">${Object.entries(option.deltas).map(([metricId, value]) => metricDeltaBadge(metricId, value)).join("")}</div>
        <button class="${isSelected ? "secondary-button" : "primary-button"}" data-action="choose-option" data-lane="${state.activeLaneId}" data-option="${option.id}">${isSelected ? "Selected" : "Choose this path"}</button>
      </article>`;
  }).join("");
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">${APP_CONFIG.laneNames[state.activeLaneId]}</div>
      <h2>${lane.title}</h2>
      <p>${lane.issue}</p>
      <div class="coach-grid two-up">
        <article class="coach-card"><h3>${coach.mode.label} · What to notice</h3><p>${coach.beforeChoice.notice}</p><p><strong>${coach.beforeChoice.strongSignal}</strong></p></article>
        <article class="coach-card"><h3>Watch out</h3><p>${coach.beforeChoice.watchOut}</p><p><strong>${coach.beforeChoice.reviewerQuestion}</strong></p></article>
      </div>
      <div class="tension-card ${stakeholder.tone}"><h3>${stakeholder.title}</h3><p>${stakeholder.message}</p></div>
      <div class="challenge-card">
        <div class="challenge-card__head"><h3>Micro-challenge</h3><span class="badge">Spot the hidden risk</span></div>
        <p>${challenge.question}</p>
        <div class="challenge-actions">${challenge.answers.map(answer => `
          <button class="${challengeResult?.answerId === answer.id ? "secondary-button" : "ghost-button"}" data-action="answer-challenge" data-lane="${state.activeLaneId}" data-answer="${answer.id}">${answer.label}</button>`).join("")}</div>
        ${renderChallengeResult(state, state.activeLaneId)}
      </div>
      <div class="split-panel">
        <div>
          <h3>Why this matters</h3>
          <p>${lane.whyItMatters}</p>
          <div class="artifact-tray">${lane.evidence.map(item => `<div class="artifact-card">${item}</div>`).join("")}</div>
        </div>
        <div class="compare-stack">
          <article class="compare-card disciplined"><h3>Holds up in operations</h3><p>${lane.disciplinedPath}</p></article>
          <article class="compare-card fragile"><h3>Looks fine in demo, fragile in operations</h3><p>${lane.fragilePath}</p></article>
        </div>
      </div>
      <div class="assist-row">
        <button class="secondary-button" data-action="ask-coach" data-lane="${state.activeLaneId}">I’m not sure</button>
        ${state.coachAssist?.[state.activeLaneId] ? `<div class="assist-hint">${coach.beforeChoice.assistHint}</div>` : ""}
      </div>
      <div class="option-grid">${options}</div>
      ${choice ? `
        <section class="summary-card compact"><h3>${buildConsequenceSimulator(state, state.activeLaneId).headline}</h3><ul>${buildConsequenceSimulator(state, state.activeLaneId).items.map(item => `<li>${item}</li>`).join("")}</ul></section>
        <div class="debrief-grid">
          <article class="summary-card compact"><h3>You protected</h3><p>${debrief.protected}</p></article>
          <article class="summary-card compact"><h3>You exposed</h3><p>${debrief.exposed}</p></article>
          <article class="summary-card compact"><h3>You stabilized</h3><p>${debrief.stabilized}</p></article>
          <article class="summary-card compact"><h3>You still need to govern</h3><p>${debrief.govern}</p></article>
        </div>
        <div class="coach-grid two-up">
          <article class="coach-card"><h3>Local coaching</h3><p>${choice.coachLocal}</p></article>
          <article class="coach-card"><h3>Systemic coaching</h3><p>${choice.coachSystem}</p></article>
        </div>
        <div class="summary-card compact"><h3>Operational consequence now visible</h3><p>${choice.consequence}</p>${impactChips(choice.impacts || [])}</div>` : ""}
      <div class="action-row">
        <button class="secondary-button" data-action="back-to-map">Back to map</button>
        ${choice ? `<button class="primary-button" data-action="next-lane">${getCompletedLaneCount(state) >= APP_CONFIG.completionTarget ? "Open readiness review" : "Continue to next lane"}</button>` : ""}
      </div>
    </section>`;
}

function renderMetricComparisonRows(rows) {
  return rows.map(row => `
    <tr>
      <td>${row.label}</td>
      <td>${row.current}</td>
      <td>${row.disciplined}</td>
      <td>${row.fragile}</td>
      <td>${row.goodDirection === "down" ? (row.current <= row.disciplined ? "At or better than disciplined reference" : "Still carries more risk than disciplined reference") : (row.current >= row.disciplined ? "At or better than disciplined reference" : "Still below disciplined reference")}</td>
    </tr>`).join("");
}

function renderAuditHotspots(state) {
  const audit = buildAuditTrace(state);
  if (!audit.hotspots.length) return `<p>No audit hotspots visible yet.</p>`;
  return `<div class="hotspot-grid">${audit.hotspots.map(item => `
    <article class="summary-card compact hotspot-card ${item.outcome.toLowerCase()}">
      <h3>${item.laneTitle}</h3>
      <p><strong>${item.optionLabel}</strong></p>
      <p>${item.consequence}</p>
    </article>`).join("")}</div>`;
}

function renderReview(state) {
  const summary = buildMissionSummary(state);
  const scenario = MISSIONS[state.scenarioId];
  const comparison = buildMetricComparison(state);
  const laneComparison = buildLaneComparison(state);
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Readiness review board</div>
      <h2>${state.readinessLabel}</h2>
      <p>${summary.compareHeadline}</p>
      <div class="compare-grid">
        <article class="compare-card disciplined"><h3>Disciplined launch reference</h3><p>The strongest reference path narrows context, protects boundaries, validates risky outputs, stages releases, and keeps fallback behavior visible.</p></article>
        <article class="compare-card fragile"><h3>Fragile launch reference</h3><p>${scenario.fragileBranch}. In Chapter 5 terms, this creates hidden debt even when the prototype still looks helpful.</p></article>
      </div>
      <div class="review-grid">
        <article class="summary-card"><h3>Strongest choices</h3><ul>${summary.strongest.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card"><h3>Remaining weaknesses</h3><ul>${summary.weaknesses.map(item => `<li>${item}</li>`).join("")}</ul></article>
      </div>
      <article class="summary-card table-card">
        <h3>Why this differs from the reference path</h3>
        <table class="comparison-table"><thead><tr><th>Metric</th><th>You</th><th>Disciplined</th><th>Fragile</th><th>Interpretation</th></tr></thead><tbody>${renderMetricComparisonRows(comparison)}</tbody></table>
      </article>
      <article class="summary-card"><h3>Lane-by-lane interpretation</h3><ul class="lane-summary-list">${laneComparison.map(item => `<li><strong>${item.title}:</strong> ${item.status} — ${item.selection}. ${item.whyDifferent} ${impactChips(item.impacts)}</li>`).join("")}</ul></article>
      <section class="summary-card"><h3>Audit hotspots</h3><p>These are the decisions with the clearest downstream consequences in the current path.</p>${renderAuditHotspots(state)}</section>
      <div class="coach-card"><h3>Next-best improvement</h3><p>${summary.nextBestImprovement}</p></div>
      <div class="action-row"><button class="secondary-button" data-action="back-to-map">Return to map</button><button class="secondary-button" data-action="executive">Open executive debrief</button><button class="primary-button" data-action="report">Open mission report</button></div>
    </section>`;
}

function renderLaneChangeRows(rows = []) {
  if (!rows.length) return `<tr><td colspan="4">No replay comparison available yet.</td></tr>`;
  return rows.map(item => `<tr><td>${item.title}</td><td>${item.currentOutcome}</td><td>${item.priorOutcome}</td><td><span class="shift-tag ${item.shift.toLowerCase()}">${item.shift}</span></td></tr>`).join("");
}

function renderReport(state, history) {
  const summary = buildMissionSummary(state);
  const scenario = MISSIONS[state.scenarioId];
  const analytics = buildReplayAnalytics(history, state.scenarioId);
  const progression = buildProgression(state, history);
  const debrief = buildMissionDebrief(state, history);
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Mission report</div>
      <h2>${scenario.title}</h2>
      <p>You have completed the core mission. This debrief is designed to feel like a mentor review, not just a score summary.</p>
      <div class="report-grid">
        <article class="summary-card"><h3>What you did well</h3><ul>${debrief.whatYouDidWell.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card"><h3>What would worry an enterprise reviewer</h3><ul>${debrief.reviewerWorry.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card"><h3>Fix before pilot</h3><p>${debrief.fixBeforePilot}</p></article>
        <article class="summary-card"><h3>Fix before broad rollout</h3><p>${debrief.fixBeforeBroadRollout}</p></article>
      </div>
      <div class="coach-grid two-up">
        <article class="coach-card"><h3>Best next replay path</h3><p>${debrief.bestReplayPath}</p></article>
        <article class="coach-card"><h3>Your current rank</h3><p><strong>${progression.rankTitle}</strong> — ${progression.rankGuidance}</p></article>
      </div>
      <section class="summary-card"><h3>Lane mastery badges</h3><p>These reward disciplined reasoning and give replay a purpose.</p>${masteryChips(progression.badges)}</section>
      <article class="summary-card table-card"><h3>Replay lane changes</h3><table class="comparison-table"><thead><tr><th>Lane</th><th>Latest</th><th>Previous</th><th>Shift</th></tr></thead><tbody>${renderLaneChangeRows(analytics.laneChanges)}</tbody></table></article>
      <article class="summary-card"><h3>Replay analytics</h3><p>${analytics.runCount ? `${analytics.runCount} recorded run(s). Best readiness: ${analytics.bestReadiness}. Average readiness: ${analytics.averageReadiness}. ${analytics.readinessTrend}` : "No previous runs recorded yet."}</p><p>${analytics.improvementNarrative}</p></article>
      <article class="summary-card"><h3>Replay story</h3><p>${buildReplayTheater(state, history).headline}</p><ol class="mini-list ordered">${buildReplayTheater(state, history).beats.map(item => `<li>${item}</li>`).join("")}</ol></article>
      <article class="summary-card"><h3>Your progress</h3><p>${buildJourneyMap(state, history).recommendedReason}</p><div class="journey-row">${buildJourneyMap(state, history).phases.map(phase => `<span class="journey-chip ${phase.status}">${phase.label}</span>`).join("")}</div></article>
      <article class="summary-card"><h3>Strongest choices</h3><ul>${summary.strongest.map(item => `<li>${item}</li>`).join("")}</ul></article>
      <div class="action-row"><button class="secondary-button" data-action="executive">Open decision-ready summary</button><button class="secondary-button" data-action="explore">Open Explore More</button><button class="primary-button" data-action="replay">Replay scenario</button></div>
    </section>`;
}

function renderExecutive(state, history) {
  const executive = buildExecutiveDebrief(state, history);
  const reviewRoom = buildReviewRoom(state);
  const consequences = buildConsequenceSimulator(state);
  const journey = buildJourneyMap(state, history);
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Decision-ready summary</div>
      <h2>${executive.recommendation}</h2>
      <p>This view turns your run into a short decision-ready summary so you can see how your choices would be explained to other stakeholders.</p>
      <div class="report-grid">
        <article class="summary-card"><h3>Top 3 operational risks</h3><ul>${executive.topRisks.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card"><h3>Likely blocker</h3><p><strong>${executive.blockerRole}</strong></p><p>${executive.blockerReason}</p></article>
        <article class="summary-card"><h3>Fix before pilot</h3><ul>${executive.beforePilot.map(item => `<li>${item}</li>`).join("")}</ul></article>
        <article class="summary-card"><h3>Fix before broad rollout</h3><ul>${executive.beforeBroadRollout.map(item => `<li>${item}</li>`).join("")}</ul></article>
      </div>
      <section class="summary-card"><h3>Stakeholder reactions</h3><p>These reactions show how other enterprise reviewers would respond to your choices.</p><div class="review-room-grid">${reviewRoom.roles.map(role => `<article class="coach-card ${role.tone}"><h3>${role.role}</h3><p><strong>${role.verdict}</strong></p><p>${role.message}</p></article>`).join("")}</div></section>
      <section class="summary-card"><h3>${consequences.headline}</h3><ul>${consequences.items.map(item => `<li>${item}</li>`).join("")}</ul></section>
      <section class="summary-card"><h3>Your next learning focus</h3><p>${journey.recommendedReason}</p><div class="journey-row">${journey.phases.map(phase => `<span class="journey-chip ${phase.status}">${phase.label}</span>`).join("")}</div></section>
      <div class="action-row"><button class="secondary-button" data-action="report">Back to mission report</button><button class="secondary-button" data-action="explore">Open Explore More</button><button class="primary-button" data-action="replay">Replay scenario</button></div>
    </section>`;
}

function renderSeedExamples(state) {
  return `<div class="seed-grid">${workshopSeedCard("Pilot-ready", "pilot-ready", state.scenarioId, "Open a strong review state.")}${workshopSeedCard("Prototype-risk", "prototype-risk", state.scenarioId, "Open a visibly weak review state.")}${workshopSeedCard("Privacy failure", "privacy-failure", state.scenarioId, "Force a privacy-focused fragile lane.")}${workshopSeedCard("Policy fragile", "policy-fragile", state.scenarioId, "Force policy and moderation drift.")}${workshopSeedCard("Monitoring gap", "monitoring-gap", state.scenarioId, "Force weak monitoring ownership.")}${workshopSeedCard("Fail-safe missing", "fail-safe-missing", state.scenarioId, "Force weak escalation and fallback design.")}</div>`;
}

function renderExplore(state, history) {
  const scenario = MISSIONS[state.scenarioId];
  const branch = getActiveBranch(state);
  const branchSummary = state.extension?.completed ? buildBranchSummary(state) : null;
  const analytics = buildReplayAnalytics(history, state.scenarioId);
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Optional exploration</div>
      <h2>Explore More: ${branch?.title || scenario.optionalBranch}</h2>
      <p>The core mission is already complete. This extension deepens the Chapter 5 lesson without making the base path longer.</p>
      <div class="compare-grid">
        <article class="compare-card disciplined"><h3>Harder branch to try next</h3><p>${branch?.intro || scenario.optionalBranch}</p></article>
        <article class="compare-card neutral"><h3>Replay benefit</h3><p>Replays show whether you improved readiness while also lowering hidden exposure or increasing rollout discipline. ${analytics.readinessTrend}</p></article>
      </div>
      <div class="summary-card"><h3>Optional branch mission</h3><p>${branch?.summary}</p><p>This version keeps optional depth compact enough for workshops while making the stricter branch fully playable and coachable.</p><button class="primary-button" data-action="start-branch">Play optional branch</button></div>
      ${branchSummary ? `<div class="coach-card"><h3>Last completed branch result</h3><p>${branchSummary.headline} Net readiness change: ${branchSummary.netReadinessChange >= 0 ? "+" : ""}${branchSummary.netReadinessChange}.</p></div>` : ""}
      <div class="summary-card"><h3>Facilitator / QA presets</h3><p>Use these seeds to jump into meaningful review states without rebuilding the mission by hand.</p>${renderSeedExamples(state)}</div>
      <div class="action-row"><button class="secondary-button" data-action="report">Back to mission report</button><button class="primary-button" data-action="replay">Replay scenario</button></div>
    </section>`;
}

function renderBranch(state) {
  const branch = getActiveBranch(state);
  const step = branch.steps[state.extension.stepIndex];
  const selected = step ? state.extension.choices[step.id] : null;
  const completed = isBranchComplete(state);
  const summary = buildBranchSummary(state);
  if (completed) {
    return `
      <section class="content-panel stage-panel" data-autofocus tabindex="-1">
        <div class="eyebrow">Optional branch complete</div>
        <h2>${branch.title}</h2>
        <p>${summary?.headline || "Optional branch completed."}</p>
        <div class="review-grid">
          <article class="summary-card"><h3>Strongest branch moves</h3><ul>${(summary?.strongestMoves || ["No strong branch moves recorded."]).map(item => `<li>${item}</li>`).join("")}</ul></article>
          <article class="summary-card"><h3>Remaining branch risks</h3><ul>${(summary?.remainingRisks || ["No branch risks remain visible."]).map(item => `<li>${item}</li>`).join("")}</ul></article>
        </div>
        <div class="coach-card"><h3>Net branch effect</h3><p>Net readiness change: ${summary?.netReadinessChange >= 0 ? "+" : ""}${summary?.netReadinessChange || 0}. This branch shows whether your core path still holds up once enterprise constraints tighten.</p></div>
        <div class="action-row"><button class="secondary-button" data-action="finish-branch">Return to Explore More</button><button class="primary-button" data-action="replay">Replay core scenario</button></div>
      </section>`;
  }
  const impacts = selected?.impacts?.length ? impactChips(selected.impacts) : "";
  const options = step.options.map(option => {
    const isSelected = selected && selected.optionId === option.id;
    return `
      <article class="option-card ${isSelected ? "selected" : ""}">
        <div class="option-card__head"><h3>${option.label}</h3><span class="badge">${isSelected ? selected.outcome : "Option"}</span></div>
        <p>${option.summary}</p>
        ${impactChips(deriveImpactCapsules(option.deltas))}
        <div class="delta-row">${Object.entries(option.deltas).map(([metricId, value]) => metricDeltaBadge(metricId, value)).join("")}</div>
        <button class="${isSelected ? "secondary-button" : "primary-button"}" data-action="choose-branch-option" data-step="${step.id}" data-option="${option.id}">${isSelected ? "Selected" : "Choose this branch path"}</button>
      </article>`;
  }).join("");
  return `
    <section class="content-panel stage-panel" data-autofocus tabindex="-1">
      <div class="eyebrow">Optional branch step ${getExtensionCompletedCount(state) + 1} of ${branch.steps.length}</div>
      <h2>${step.title}</h2>
      <p>${step.issue}</p>
      <div class="progress-strip"><span style="width:${(getExtensionCompletedCount(state) / branch.steps.length) * 100}%"></span></div>
      <div class="split-panel">
        <div>
          <h3>Why this matters</h3>
          <p>${step.whyItMatters}</p>
          <div class="artifact-tray">${step.evidence.map(item => `<div class="artifact-card">${item}</div>`).join("")}</div>
        </div>
        <div class="compare-card neutral"><h3>Branch purpose</h3><p>${branch.intro}</p></div>
      </div>
      <div class="option-grid">${options}</div>
      ${selected ? `<div class="coach-card"><h3>Branch coaching</h3><p>${selected.coaching}</p>${impacts}</div>` : ""}
      <div class="action-row">
        <button class="secondary-button" data-action="explore">Back to Explore More</button>
        ${selected ? `<button class="primary-button" data-action="next-branch-step">${getExtensionCompletedCount(state) + 1 >= branch.steps.length ? "Finish branch" : "Continue to next branch step"}</button>` : ""}
      </div>
    </section>`;
}

export function renderApp(state, history = []) {
  const mainContent = state.screen === "launch"
    ? renderLaunch(state)
    : state.screen === "guided"
      ? renderGuidedExample(state)
      : state.screen === "map"
        ? renderMap(state, history)
        : state.screen === "lane"
          ? renderLane(state)
          : state.screen === "review"
            ? renderReview(state)
            : state.screen === "report"
              ? renderReport(state, history)
              : state.screen === "executive"
                ? renderExecutive(state, history)
                : state.screen === "branch"
                ? renderBranch(state)
                : renderExplore(state, history);
  return `${renderHeader(state)}${renderStageRail(state)}<div class="live-region" aria-live="polite" aria-atomic="true" id="live-region"></div><div class="shell-layout"><main class="main-panel" id="main-content">${mainContent}</main>${renderSidebar(state, history)}</div>`;
}
