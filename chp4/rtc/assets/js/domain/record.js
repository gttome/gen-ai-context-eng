import { getCheck, getCorrectId } from "./triage-rules.js";

function lookupLabel(collection = [], selectedId = "") {
  return (collection.find(item => item.id === selectedId) || {}).label || "Not selected";
}

function lookupCheckLabel(scenario, checkId, optionId) {
  const check = getCheck(scenario, checkId);
  return check ? lookupLabel(check.options, optionId) : "Not selected";
}

function successSignalSummary(metrics) {
  return metrics.risks.length ? metrics.risks.join("; ") : "No major risk cues active.";
}

export function buildTriageRecord(state, scenario, metrics) {
  const regression = state.customRegression.trim() || lookupLabel(scenario.regressionOptions, state.regressionChoice);
  const lines = [
    `# Reliability Triage Record`,
    ``,
    `Scenario: ${scenario.title}`,
    `Completed: ${state.completedAt || "In progress"}`,
    `Mission tier: ${metrics.tier}`,
    `Mission score: ${metrics.compositeScore}/100`,
    ``,
    `## Observed symptom`,
    scenario.observedSymptom,
    ``,
    `## Source of truth`,
    lookupCheckLabel(scenario, "source", state.answers.source),
    ``,
    `## Guided check answers`,
    `- Symptom: ${lookupCheckLabel(scenario, "symptom", state.answers.symptom)}`,
    `- Grounding: ${lookupCheckLabel(scenario, "grounding", state.answers.grounding)}`,
    `- Instruction: ${lookupCheckLabel(scenario, "instruction", state.answers.instruction)}`,
    `- History / nearby context: ${lookupCheckLabel(scenario, "history", state.answers.history)}`,
    ``,
    `## Diagnosis`,
    `- Primary failure mode: ${lookupLabel(scenario.failureModes, state.failureMode)}`,
    `- Likely root cause: ${lookupLabel(scenario.rootCauses, state.rootCause)}`,
    ``,
    `## Controlled mitigation`,
    lookupLabel(scenario.mitigations, state.mitigation),
    ``,
    `## Regression check`,
    regression,
    ``,
    `## Score breakdown`,
    ...metrics.categories.map(item => `- ${item.key}: ${item.score}`),
    ``,
    `## Highest active risks`,
    successSignalSummary(metrics),
    ``,
    `## Notes`,
    state.notes.trim() || "No personal notes captured.",
    ``
  ];
  return lines.join("\n");
}

export function buildBestPathSummary(scenario) {
  return {
    source: lookupCheckLabel(scenario, "source", getCorrectId(getCheck(scenario, "source")?.options || [])),
    symptom: lookupCheckLabel(scenario, "symptom", getCorrectId(getCheck(scenario, "symptom")?.options || [])),
    grounding: lookupCheckLabel(scenario, "grounding", getCorrectId(getCheck(scenario, "grounding")?.options || [])),
    instruction: lookupCheckLabel(scenario, "instruction", getCorrectId(getCheck(scenario, "instruction")?.options || [])),
    history: lookupCheckLabel(scenario, "history", getCorrectId(getCheck(scenario, "history")?.options || [])),
    failureMode: lookupLabel(scenario.failureModes, getCorrectId(scenario.failureModes)),
    rootCause: lookupLabel(scenario.rootCauses, getCorrectId(scenario.rootCauses)),
    mitigation: lookupLabel(scenario.mitigations, getCorrectId(scenario.mitigations)),
    regression: lookupLabel(scenario.regressionOptions, getCorrectId(scenario.regressionOptions))
  };
}
