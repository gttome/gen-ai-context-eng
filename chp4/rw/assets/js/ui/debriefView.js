import { buildDebrief } from "../domain/debriefBuilder.js";
import { q } from "./dom.js";
import { badgeClass, renderStatusesStrip, toTitleCase } from "./shared.js";

export function renderDebriefView(state, scenario, scoredState) {
  if (!state.run.completed) return;
  const debrief = buildDebrief({
    scenario,
    scoredState,
    learnerSelections: state.run.checkSelections
  });
  q("#debrief-summary").textContent = `${debrief.summary} ${debrief.nextBestCue}`.trim();

  q("#debrief-delta-summary").innerHTML = `
    <article class="delta-summary-card">
      <span class="analytics-label">Aligned checks</span>
      <strong>${debrief.deltaSummary.matchedCount}/${scenario.standingChecks.length}</strong>
      <small>Standing checks where your read matched the authored expectation.</small>
    </article>
    <article class="delta-summary-card">
      <span class="analytics-label">Missed checks</span>
      <strong>${debrief.deltaSummary.missedCount}</strong>
      <small>Checks that would benefit from another deliberate pass.</small>
    </article>
    <article class="delta-summary-card">
      <span class="analytics-label">Risk checks caught</span>
      <strong>${debrief.deltaSummary.riskyCaughtCount}/${debrief.deltaSummary.riskyExpectedCount}</strong>
      <small>How many expected trade-offs or weakenings you flagged as risky.</small>
    </article>
  `;

  q("#debrief-matrix").innerHTML = debrief.matrix.map((row) => `
    <div class="matrix-row ${row.matched ? "matrix-row-match" : "matrix-row-miss"}">
      <div class="matrix-topline">
        <span class="matrix-status ${badgeClass(row.expected)}">Expected: ${toTitleCase(row.expected)}</span>
        <span class="matrix-status ${row.matched ? "status-held" : "status-tradeoff"}">${row.deltaLabel}</span>
      </div>
      <strong>${row.title}</strong>
      <p><strong>Your read:</strong> ${toTitleCase(row.learner)}.</p>
      ${renderStatusesStrip(row.expected, row.learner)}
      <p>${row.note}</p>
      ${row.riskWhy ? `<p class="risk-inline"><strong>Why this matters:</strong> ${row.riskWhy}</p>` : ""}
    </div>
  `).join("");

  const narrative = scenario.decisionNarrative || {
    chooseWhy: scenario.strongestPracticeDecision.why,
    anchors: scenario.standingChecks.filter((check) => ["weakened", "tradeoff"].includes(check.expectedStatus)).map((check) => `${check.title} was expected to show ${check.expectedStatus}.`),
    alternativePaths: [],
    monitoringWhy: "Keep monitoring proportional to the remaining uncertainty after the release judgment."
  };

  q("#decision-comparison").innerHTML = `
    <div class="decision-box">
      <div class="decision-grid">
        <section>
          <p><strong>Your decision:</strong> ${state.run.decision || "None selected"}</p>
          <p><strong>Strongest-practice decision:</strong> ${scoredState.correctDecision}</p>
          <p><strong>Mastery label:</strong> ${scoredState.masteryLabel}</p>
          <p><strong>Average score:</strong> ${scoredState.average}</p>
          ${(scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null) ? `<p><strong>External fit:</strong> ${scoredState.externalAnalysis.score} (${scoredState.externalAnalysis.label})</p>` : ""}
        </section>
        <section>
          <p class="decision-callout"><strong>Why strongest practice chose ${scoredState.correctDecision}:</strong> ${narrative.chooseWhy}</p>
          <div class="decision-subsection">
            <strong>Evidence anchors</strong>
            <ul class="compact-list">${(narrative.anchors || []).map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          ${(narrative.alternativePaths || []).length ? `
            <div class="decision-subsection">
              <strong>Why the other paths were weaker</strong>
              <ul class="compact-list">${narrative.alternativePaths.map((item) => `<li><strong>${item.decision}:</strong> ${item.why}</li>`).join("")}</ul>
            </div>
          ` : ""}
          <p><strong>Monitoring rationale:</strong> ${narrative.monitoringWhy}</p>
        </section>
      </div>
    </div>
  `;

  q("#selected-monitoring").innerHTML = (state.run.monitoring.length ? state.run.monitoring : scenario.monitoringFollowUps.slice(0, 2))
    .map((item) => `<li>${item}</li>`).join("");

  const walkthroughSteps = (scenario.strongestPracticeWalkthrough || []).length
    ? scenario.strongestPracticeWalkthrough
    : [
        { title: "Re-anchor on the baseline", summary: "Restate what the baseline was protecting before reacting to the candidate change." },
        { title: "Judge the risky checks first", summary: "Resolve any weakened or trade-off checks before deciding whether the change can ship." },
        { title: "Close with stewardship", summary: "Choose monitoring that matches the remaining uncertainty rather than treating the decision as final forever." }
      ];

  q("#walkthrough-list").innerHTML = walkthroughSteps.map((step, index) => `
    <article class="walkthrough-step">
      <div class="walkthrough-count">${index + 1}</div>
      <div>
        <strong>${step.title}</strong>
        <p>${step.summary}</p>
      </div>
    </article>
  `).join("");

  const practiceNext = q("#practice-next");
  if (practiceNext) {
    practiceNext.innerHTML = `
      ${debrief.highRiskMisses.length ? `<p class="attention-note"><strong>High-risk checks to revisit:</strong> ${debrief.highRiskMisses.join(", ")}.</p>` : ""}
      <ul class="compact-list">${debrief.practiceNext.map((item) => `<li>${item}</li>`).join("")}</ul>
    `;
  }

  q("#bonus-title").textContent = scenario.bonus.title;
  q("#bonus-summary").textContent = scenario.bonus.summary;

  q("#replay-run").onclick = () => {
    location.hash = "";
    window.dispatchEvent(new CustomEvent("rw:replay", { detail: { scenarioId: scenario.id } }));
  };
  q("#back-to-launcher").onclick = () => {
    window.dispatchEvent(new CustomEvent("rw:returnToLauncher"));
  };
}
