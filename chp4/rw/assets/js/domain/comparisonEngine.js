export function buildComparisonPacket(scenario) {
  const checkLines = scenario.standingChecks
    .map((check, index) => `${index + 1}. ${check.title} — baseline protected behavior: ${check.baselineProtectedBehavior}`)
    .join("\n");

  return [
    `Scenario: ${scenario.title}`,
    `Objective: ${scenario.objective}`,
    "",
    "Incident summary:",
    scenario.incidentSummary,
    "",
    "Baseline result:",
    scenario.baselineResult,
    "",
    "Candidate result under review:",
    scenario.candidateResult || scenario.proposedChange,
    "",
    "Standing checks:",
    checkLines,
    "",
    "Task: produce an alternative candidate output that aims to improve the change while preserving the baseline-protected checks."
  ].join("\n");
}

export function summarizeCheckOutcome(check, learnerSelection) {
  const expected = check.expectedStatus;
  const learner = learnerSelection || "unreviewed";
  const matched = learner === expected;
  return {
    id: check.id,
    title: check.title,
    expected,
    learner,
    matched,
    message: matched
      ? `You recognized that this check ${expected}.`
      : `This check is best read as ${expected}, not ${learner}.`
  };
}

export function getCoachingMessage(scenario, scoredState) {
  if (!scenario) return "Choose a mission to begin.";
  const { totalReviewed, correctReviewed, decision, correctDecision, monitoringCount, externalAnalysis } = scoredState;
  const riskChecks = scenario.standingChecks.filter((check) => ["weakened", "tradeoff"].includes(check.expectedStatus));
  if (totalReviewed === 0) {
    return `Start with the standing checks. In this mission, begin with ${riskChecks.slice(0, 2).map((check) => check.title).join(" and ")} before you reward readability or speed.`;
  }
  if (totalReviewed < scenario.standingChecks.length) {
    return "Keep reading the preserved checks. The strongest release decision is usually clearer after you inspect what the baseline protected and where the candidate made that protection harder to see.";
  }
  if (scenario.manualExternalComparison && externalAnalysis?.score === null) {
    return "You can judge the authored candidate now, but a pasted external comparison will make the release decision more testable against the same standing checks.";
  }
  if (scenario.manualExternalComparison && externalAnalysis?.score !== null && externalAnalysis.score < 70) {
    return `The external result is still risky. ${externalAnalysis.summary}`;
  }
  if (!decision) {
    return "You have enough evidence to choose a release path. Let the risky checks drive the decision more than the candidate's polish or momentum.";
  }
  if (decision !== correctDecision) {
    return `Your current choice is ${decision}, but the evidence supports ${correctDecision}. Revisit the checks that weakened or turned into trade-offs before you finalize.`;
  }
  if (monitoringCount === 0) {
    return "Good judgment still needs stewardship. Choose at least one follow-up watch item before finalizing the run.";
  }
  if (correctReviewed < scenario.standingChecks.length) {
    return "Your final choice is reasonable, but at least one check interpretation still needs tightening. Use the interpretation help and then compare your read with the debrief.";
  }
  return "This run is in strong shape. Finalize the debrief and compare your path against the strongest-practice explanation so the pattern becomes reusable.";
}
