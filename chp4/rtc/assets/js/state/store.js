import { scenarioPack } from "../../data/scenarios.js";
import { loadSession, saveSession, loadHistory, saveHistory, clearAllState } from "./persistence.js";

export const CORE_STEPS = [
  { id: "launch", label: "Launch" },
  { id: "evidence", label: "Evidence" },
  { id: "checks", label: "Checks" },
  { id: "failure", label: "Failure mode" },
  { id: "mitigation", label: "Mitigation" },
  { id: "regression", label: "Regression" },
  { id: "summary", label: "Summary" }
];

function missionDefaults() {
  return {
    activeStep: "launch",
    reviewedEvidence: [],
    answers: {},
    failureMode: "",
    rootCause: "",
    mitigation: "",
    pastedOutput: "",
    regressionChoice: "",
    customRegression: "",
    notes: "",
    exploreOpen: false,
    completedAt: "",
    activeModal: "",
    uiMode: "guided"
  };
}

export function createInitialState() {
  return {
    scenarioId: scenarioPack.cases[0].id,
    insightPaneHeight: 300,
    history: loadHistory(),
    ...missionDefaults()
  };
}

const restoredState = loadSession() || {};
let state = { ...createInitialState(), ...restoredState };
const subscribers = new Set();

export function getState() {
  return state;
}

export function setState(partial) {
  state = { ...state, ...partial };
  saveSession(state);
  subscribers.forEach(callback => callback(state));
}

export function updateAnswer(key, value) {
  setState({ answers: { ...state.answers, [key]: value } });
}

export function switchScenario(scenarioId) {
  setState({ scenarioId, ...missionDefaults(), uiMode: state.uiMode || "guided" });
}

export function resetCurrentStep(stepId) {
  if (stepId === "evidence") {
    const nextAnswers = { ...state.answers };
    delete nextAnswers.source;
    setState({ reviewedEvidence: [], answers: nextAnswers });
    return;
  }
  if (stepId === "checks") {
    const nextAnswers = { ...state.answers };
    ["symptom", "grounding", "instruction", "history"].forEach(key => delete nextAnswers[key]);
    setState({ answers: nextAnswers });
    return;
  }
  if (stepId === "failure") {
    setState({ failureMode: "", rootCause: "" });
    return;
  }
  if (stepId === "mitigation") {
    setState({ mitigation: "", pastedOutput: "" });
    return;
  }
  if (stepId === "regression") {
    setState({ regressionChoice: "", customRegression: "", notes: "" });
  }
}

export function recordMissionAttempt(summarySnapshot) {
  const entry = {
    playedAt: summarySnapshot.completedAt || new Date().toLocaleString(),
    scenarioId: summarySnapshot.scenarioId,
    scenarioTitle: summarySnapshot.scenarioTitle,
    compositeScore: summarySnapshot.compositeScore,
    tier: summarySnapshot.tier,
    mitigation: summarySnapshot.mitigation,
    categories: summarySnapshot.categories || []
  };
  const existing = state.history || [];
  const isDuplicate = existing[0]
    && existing[0].scenarioId === entry.scenarioId
    && existing[0].compositeScore === entry.compositeScore
    && existing[0].tier === entry.tier
    && existing[0].mitigation === entry.mitigation
    && existing[0].playedAt === entry.playedAt;
  const history = isDuplicate ? existing : [entry, ...existing].slice(0, 20);
  saveHistory(history);
  state = { ...state, history };
  saveSession(state);
  subscribers.forEach(callback => callback(state));
}

export function replayMission() {
  state = {
    ...createInitialState(),
    scenarioId: state.scenarioId,
    insightPaneHeight: state.insightPaneHeight,
    history: state.history || [],
    uiMode: state.uiMode || "guided"
  };
  saveSession(state);
  subscribers.forEach(callback => callback(state));
}

export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}


export function hardResetApp() {
  clearAllState();
  state = createInitialState();
  subscribers.forEach(callback => callback(state));
}
