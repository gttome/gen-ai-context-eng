import { CORE_STEPS } from "../state/store.js";

export function getScenario(pack, scenarioId) {
  return pack.cases.find(item => item.id === scenarioId) || pack.cases[0];
}

export function isEvidenceReviewed(state, evidenceId) {
  return state.reviewedEvidence.includes(evidenceId);
}

export function toggleEvidenceReview(state, evidenceId) {
  return state.reviewedEvidence.includes(evidenceId)
    ? state.reviewedEvidence.filter(id => id !== evidenceId)
    : [...state.reviewedEvidence, evidenceId];
}

export function canAdvance(state) {
  switch (state.activeStep) {
    case "launch": return true;
    case "evidence": return Boolean(state.answers.source);
    case "checks": return ["symptom", "grounding", "instruction", "history"].every(id => state.answers[id]);
    case "failure": return Boolean(state.failureMode && state.rootCause);
    case "mitigation": return Boolean(state.mitigation);
    case "regression": return Boolean(state.regressionChoice || state.customRegression.trim());
    case "summary": return true;
    default: return false;
  }
}

export function nextStepId(stepId) {
  const index = CORE_STEPS.findIndex(item => item.id === stepId);
  return CORE_STEPS[Math.min(index + 1, CORE_STEPS.length - 1)].id;
}

export function previousStepId(stepId) {
  const index = CORE_STEPS.findIndex(item => item.id === stepId);
  return CORE_STEPS[Math.max(index - 1, 0)].id;
}

export function getCorrectId(collection = []) {
  return (collection.find(item => item.isCorrect) || {}).id || "";
}

export function getCheck(scenario, checkId) {
  return scenario.checks.find(item => item.id === checkId);
}

export function getCorrectCheckOptionId(scenario, checkId) {
  const check = getCheck(scenario, checkId);
  return check ? getCorrectId(check.options) : "";
}

export function isCorrectSelection(scenario, category, selectedId) {
  if (!selectedId) return false;
  if (["symptom", "source", "grounding", "instruction", "history"].includes(category)) {
    return getCorrectCheckOptionId(scenario, category) === selectedId;
  }
  if (category === "failureMode") return getCorrectId(scenario.failureModes) === selectedId;
  if (category === "rootCause") return getCorrectId(scenario.rootCauses) === selectedId;
  if (category === "mitigation") return getCorrectId(scenario.mitigations) === selectedId;
  if (category === "regression") return getCorrectId(scenario.regressionOptions) === selectedId;
  return false;
}

export function buildPathCues(state, scenario) {
  const cues = [];
  const cueMap = [
    { label: "Observable symptom", category: "symptom", value: state.answers.symptom },
    { label: "Source-of-truth anchor", category: "source", value: state.answers.source },
    { label: "Grounding diagnosis", category: "grounding", value: state.answers.grounding },
    { label: "Instruction risk", category: "instruction", value: state.answers.instruction },
    { label: "History / nearby context", category: "history", value: state.answers.history },
    { label: "Primary failure mode", category: "failureMode", value: state.failureMode },
    { label: "Mitigation discipline", category: "mitigation", value: state.mitigation },
    { label: "Regression protection", category: "regression", value: state.regressionChoice || state.customRegression.trim() }
  ];

  cueMap.forEach(item => {
    if (!item.value) return;
    cues.push({
      label: item.label,
      status: item.category === "regression" && state.customRegression.trim() ? "strong" : (isCorrectSelection(scenario, item.category, item.value) ? "strong" : "weak")
    });
  });
  if (!cues.length) cues.push({ label: "No diagnostic cues confirmed yet", status: "neutral" });
  return cues;
}

export function stepStatus(stepId, state) {
  const completeByStep = {
    launch: state.activeStep !== "launch",
    evidence: Boolean(state.answers.source),
    checks: ["symptom", "grounding", "instruction", "history"].every(id => state.answers[id]),
    failure: Boolean(state.failureMode && state.rootCause),
    mitigation: Boolean(state.mitigation),
    regression: Boolean(state.regressionChoice || state.customRegression.trim()),
    summary: Boolean(state.completedAt)
  };
  if (state.activeStep === stepId) return "active";
  if (completeByStep[stepId]) return "complete";
  return "todo";
}

export function markCompletedNow() {
  return new Date().toLocaleString();
}
