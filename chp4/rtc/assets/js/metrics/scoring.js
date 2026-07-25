import { getCorrectId, getCorrectCheckOptionId, isCorrectSelection } from "../domain/triage-rules.js";

export function analyzePastedOutput(output, successSignals = []) {
  const lower = output.toLowerCase();
  const hits = successSignals.filter(signal => lower.includes(signal.toLowerCase()));
  return {
    hits,
    strong: hits.length >= 2,
    summary: hits.length >= 2 ? "The pasted answer shows stronger alignment with the intended control signals." : hits.length === 1 ? "The pasted answer improved a little, but one strong signal is not enough yet." : "The pasted answer still looks weak against the scenario’s intended validation signals."
  };
}

function customRegressionLooksSpecific(text = "") {
  const lower = text.toLowerCase();
  return ["cite", "section", "required field", "required heading", "current policy", "version", "date", "escalate", "schema", "contract"].some(term => lower.includes(term));
}

export function computeMetrics(state, scenario) {
  const requiredEvidenceReviewed = scenario.requiredEvidence.filter(id => state.reviewedEvidence.includes(id)).length;
  const reviewedShare = scenario.requiredEvidence.length ? requiredEvidenceReviewed / scenario.requiredEvidence.length : 0;

  const evidenceDiscipline = Math.round(35 * reviewedShare + 25 * (state.answers.source === getCorrectCheckOptionId(scenario, "source") ? 1 : 0) + 20 * (state.answers.symptom === getCorrectCheckOptionId(scenario, "symptom") ? 1 : 0) + 20 * (state.answers.grounding === getCorrectCheckOptionId(scenario, "grounding") ? 1 : 0));
  const failureModeFit = Math.round(40 * (state.failureMode === getCorrectId(scenario.failureModes) ? 1 : 0) + 35 * (state.rootCause === getCorrectId(scenario.rootCauses) ? 1 : 0) + 25 * (state.answers.history === getCorrectCheckOptionId(scenario, "history") ? 1 : 0));
  let mitigationRestraint = Math.round(70 * (state.mitigation === getCorrectId(scenario.mitigations) ? 1 : 0) + 15 * (state.answers.instruction === getCorrectCheckOptionId(scenario, "instruction") ? 1 : 0));

  let pastedAnalysis = null;
  if (state.pastedOutput.trim()) {
    pastedAnalysis = analyzePastedOutput(state.pastedOutput, scenario.externalValidation.successSignals);
    mitigationRestraint += pastedAnalysis.strong ? 15 : 5;
  }
  mitigationRestraint = Math.min(100, mitigationRestraint);

  const regressionThinking = Math.round(70 * (state.regressionChoice === getCorrectId(scenario.regressionOptions) ? 1 : 0) + 30 * ((state.customRegression.trim() && customRegressionLooksSpecific(state.customRegression)) ? 1 : 0));
  const requiredChecks = ["source", "symptom", "grounding", "instruction", "history"];
  const answeredCount = requiredChecks.filter(key => Boolean(state.answers[key])).length + (state.failureMode ? 1 : 0) + (state.rootCause ? 1 : 0) + (state.mitigation ? 1 : 0) + ((state.regressionChoice || state.customRegression.trim()) ? 1 : 0);
  const triageCompleteness = Math.round((answeredCount / 9) * 100);

  const compositeScore = Math.round(evidenceDiscipline * 0.25 + failureModeFit * 0.25 + mitigationRestraint * 0.20 + regressionThinking * 0.20 + triageCompleteness * 0.10);
  const tier = compositeScore >= 85 ? "Excellent Diagnostic Discipline" : compositeScore >= 65 ? "Strong Diagnostic Discipline" : "Emerging Diagnostic Discipline";
  const risks = [];
  if (state.answers.source && !isCorrectSelection(scenario, "source", state.answers.source)) risks.push("Governing source selected incorrectly");
  if (state.answers.grounding && !isCorrectSelection(scenario, "grounding", state.answers.grounding)) risks.push("Grounding diagnosis is still weak");
  if (state.mitigation && !isCorrectSelection(scenario, "mitigation", state.mitigation)) risks.push("Mitigation is broader than the smallest credible first move");
  if ((state.regressionChoice || state.customRegression.trim()) && !state.customRegression.trim() && !isCorrectSelection(scenario, "regression", state.regressionChoice)) risks.push("Regression guard is too vague");
  if (state.customRegression.trim() && !customRegressionLooksSpecific(state.customRegression)) risks.push("Custom regression wording needs more specificity");

  return {
    categories: [
      { key: "Evidence Discipline", score: evidenceDiscipline, meaning: "Did you inspect what should have governed the answer?" },
      { key: "Failure-Mode Fit", score: failureModeFit, meaning: "Did your diagnosis match the strongest visible pattern?" },
      { key: "Mitigation Restraint", score: mitigationRestraint, meaning: "Did you choose the smallest credible change?" },
      { key: "Regression Thinking", score: regressionThinking, meaning: "Did you preserve the lesson with a reusable guard?" },
      { key: "Triage Completeness", score: triageCompleteness, meaning: "Did you complete the full Chapter 4 mission spine?" }
    ],
    compositeScore,
    tier,
    risks,
    pastedAnalysis
  };
}

export function strongestImprovement(metrics) {
  const weakest = [...metrics.categories].sort((a, b) => a.score - b.score)[0];
  return weakest ? `${weakest.key}: ${weakest.meaning}` : "Continue practicing with a harder branch.";
}
