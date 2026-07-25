import { analyzeExternalOutput } from "../domain/externalAnalysis.js";

const dimensionLabels = {
  baselineDiscipline: "Baseline Discipline",
  standingCheckInterpretation: "Standing-Check Interpretation",
  regressionAwareness: "Regression Awareness",
  releaseJudgmentQuality: "Release Judgment Quality",
  monitoringFollowThrough: "Monitoring Follow-Through",
  externalOutputFit: "External Output Fit"
};

export function scoreScenario(scenario, runState) {
  const totalChecks = scenario?.standingChecks?.length || 0;
  const selections = runState.checkSelections || {};
  const reviewedEntries = scenario ? scenario.standingChecks.filter((check) => selections[check.id]) : [];
  const correctEntries = scenario ? scenario.standingChecks.filter((check) => selections[check.id] === check.expectedStatus) : [];
  const weakenedOrTradeoffCount = scenario
    ? scenario.standingChecks.filter((check) => ["weakened", "tradeoff"].includes(check.expectedStatus)).length
    : 0;
  const learnerFlaggedRisky = scenario
    ? scenario.standingChecks.filter((check) => ["weakened", "tradeoff"].includes(selections[check.id])).length
    : 0;

  const baselineDiscipline = totalChecks === 0 ? 0 : Math.round((reviewedEntries.length / totalChecks) * 100);
  const standingCheckInterpretation = totalChecks === 0 ? 0 : Math.round((correctEntries.length / totalChecks) * 100);
  const regressionAwareness = weakenedOrTradeoffCount === 0
    ? 100
    : Math.round((Math.min(learnerFlaggedRisky, weakenedOrTradeoffCount) / weakenedOrTradeoffCount) * 100);
  const correctDecision = scenario?.strongestPracticeDecision?.decision || null;
  const releaseJudgmentQuality = runState.decision ? (runState.decision === correctDecision ? 100 : 45) : 0;
  const monitoringFollowThrough = Math.min((runState.monitoring?.length || 0) * 35, 100);

  const dimensions = {
    baselineDiscipline,
    standingCheckInterpretation,
    regressionAwareness,
    releaseJudgmentQuality,
    monitoringFollowThrough
  };

  const externalAnalysis = analyzeExternalOutput(scenario, runState.pastebackOutput);
  if (externalAnalysis && externalAnalysis.score !== null) {
    dimensions.externalOutputFit = externalAnalysis.score;
  }

  const dimensionValues = Object.values(dimensions);
  const average = Math.round(dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length);
  const masteryLabel = average >= 90
    ? "Excellent Watchtower Judgment"
    : average >= 75
      ? "Strong Check Interpretation"
      : average >= 60
        ? "Emerging Release Discipline"
        : "Needs another comparison pass";

  const weakestDimensionKey = Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0]?.[0] || "baselineDiscipline";

  const cueMap = {
    baselineDiscipline: "Spend more time anchoring on the baseline before judging the change.",
    standingCheckInterpretation: "Revisit the standing checks and match each one to what the candidate actually preserved or weakened.",
    regressionAwareness: "Look for hidden weakening, not just visible improvement.",
    releaseJudgmentQuality: "Match the final decision to the full comparison evidence rather than tone or momentum.",
    monitoringFollowThrough: "Choose proportionate monitoring items so the decision leads to stewardship.",
    externalOutputFit: "The pasted external result still needs to preserve the required anchors and avoid the discouraged regression language."
  };

  return {
    dimensions,
    dimensionRows: Object.entries(dimensions).map(([key, value]) => ({
      key,
      label: dimensionLabels[key],
      score: value
    })),
    average,
    masteryLabel,
    totalReviewed: reviewedEntries.length,
    correctReviewed: correctEntries.length,
    totalChecks,
    correctDecision,
    decision: runState.decision,
    monitoringCount: runState.monitoring?.length || 0,
    nextBestImprovementCue: cueMap[weakestDimensionKey],
    externalAnalysis
  };
}
