const STATUS_SEQUENCE = ["improved", "held", "tradeoff", "weakened"];

function isRiskStatus(value) {
  return ["tradeoff", "weakened"].includes(value);
}

function classifyDelta(expected, learner) {
  if (!learner || learner === "unreviewed") return "Not reviewed";
  if (learner === expected) return "Aligned";
  if (isRiskStatus(expected) && !isRiskStatus(learner)) return "Risk understated";
  if (!isRiskStatus(expected) && isRiskStatus(learner)) return "Risk overstated";
  return "Different classification";
}

export function buildDebrief({ scenario, scoredState, learnerSelections }) {
  const correctDecision = scenario.strongestPracticeDecision.decision;
  const matchedDecision = scoredState.decision === correctDecision;
  const leadingSentence = matchedDecision
    ? `You chose ${scoredState.decision}, which matches the strongest-practice release path for this scenario.`
    : `You chose ${scoredState.decision || "no final decision"}, while the strongest-practice path is ${correctDecision}.`;

  const nextBestCue = scoredState.nextBestImprovementCue || "Tighten the weakest score dimension and rerun the same standing checks.";
  const externalSentence = scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null
    ? `External comparison fit: ${scoredState.externalAnalysis.label} (${scoredState.externalAnalysis.score}). ${scoredState.externalAnalysis.summary}`
    : "";

  const matrix = scenario.standingChecks.map((check) => {
    const learner = learnerSelections[check.id] || "unreviewed";
    return {
      title: check.title,
      expected: check.expectedStatus,
      learner,
      matched: learner === check.expectedStatus,
      deltaLabel: classifyDelta(check.expectedStatus, learner),
      note: check.candidateObservation,
      riskWhy: check.riskWhy || "",
      stripStatuses: STATUS_SEQUENCE
    };
  });

  const matchedCount = matrix.filter((row) => row.matched).length;
  const riskyExpectedCount = matrix.filter((row) => isRiskStatus(row.expected)).length;
  const riskyCaughtCount = matrix.filter((row) => isRiskStatus(row.expected) && isRiskStatus(row.learner)).length;

  const highRiskMisses = matrix
    .filter((row) => !row.matched)
    .filter((row) => {
      const source = scenario.standingChecks.find((check) => check.title === row.title);
      return String(source?.riskLevel || "").toLowerCase() === "high";
    })
    .map((row) => row.title);

  const practiceNext = [];
  if (!matchedDecision) practiceNext.push(`Rebuild the release judgment from the risky checks before you reward polish or momentum.`);
  if (highRiskMisses.length) practiceNext.push(`Tighten these high-risk reads first: ${highRiskMisses.join(", ")}.`);
  if (riskyCaughtCount < riskyExpectedCount) practiceNext.push(`Practice spotting trade-offs and weakenings earlier so the release boundary becomes clearer sooner.`);
  if (scoredState.externalAnalysis && scoredState.externalAnalysis.score !== null && scoredState.externalAnalysis.score < 70) {
    practiceNext.push(`Repair the external comparison output so it keeps the required anchors and removes discouraged language.`);
  }
  if (!practiceNext.length) practiceNext.push(`Study the walkthrough and try a replay only if you can explain why each risky check stayed aligned.`);

  return {
    summary: `${leadingSentence} ${scenario.strongestPracticeDecision.why} ${externalSentence}`.trim(),
    nextBestCue,
    deltaSummary: {
      matchedCount,
      missedCount: matrix.length - matchedCount,
      riskyExpectedCount,
      riskyCaughtCount,
      decisionAligned: matchedDecision
    },
    matrix,
    highRiskMisses,
    practiceNext
  };
}
