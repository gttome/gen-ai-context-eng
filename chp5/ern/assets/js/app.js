import { APP_CONFIG, MISSIONS } from "../data/content.js";
import { loadJson, saveJson, removeKey } from "./state/persistence.js";
import { createInitialState, startMission, goToScreen, openLane, moveToNextPending, applyQueryState } from "./state/store.js";
import { buildMasterySignals, buildMicroChallenge, chooseLaneOption, chooseExtensionOption, finishExtensionBranch, getActiveBranch, getExtensionCompletedCount, isBranchComplete, isMissionComplete, moveToNextBranchStep, recomputeStateFromChoices, startExtensionBranch } from "./domain/engine.js";
import { detectEnvironment, getQueryState, prefersReducedMotion } from "./utils/env.js";
import { renderApp } from "./ui/render.js";

const root = document.getElementById("app");
const body = document.body;
const stateKey = APP_CONFIG.storageKeys.missionState;
const historyKey = APP_CONFIG.storageKeys.history;
const themeKey = APP_CONFIG.storageKeys.theme;

let state = hydrateState();
let history = loadHistory();

function hydrateState() {
  const stored = loadJson(stateKey);
  const query = getQueryState();
  const queryStateRequested = Boolean(typeof window !== "undefined" && window.location && window.location.search);
  if (query.resume === "1" && stored) return normalizeState(recomputeStateFromChoices(stored));
  if (queryStateRequested) return normalizeState(applyQueryState(createInitialState()));
  if (!stored) return normalizeState(createInitialState());
  return normalizeState(recomputeStateFromChoices(stored));
}

function normalizeState(nextState) {
  return {
    ...nextState,
    challengeAnswers: nextState.challengeAnswers || {},
    coachAssist: nextState.coachAssist || {},
    coachMode: ({ mission: "learn", reviewer: "analyst", risk: "challenge" })[nextState.coachMode] || nextState.coachMode || "learn"
  };
}

function loadHistory() {
  return loadJson(historyKey, []) || [];
}

function saveState() {
  saveJson(stateKey, state);
}

function saveHistory() {
  saveJson(historyKey, history.slice(0, 20));
}

function buildHistoryRecord() {
  const scenario = MISSIONS[state.scenarioId] || MISSIONS.hr;
  const disciplinedCount = Object.values(state.choices || {}).filter(item => item.outcome === "Disciplined").length;
  const fragileCount = Object.values(state.choices || {}).filter(item => item.outcome === "Fragile").length;
  const laneOutcomes = Object.fromEntries(
    Object.entries(state.choices || {}).map(([laneId, choice]) => [laneId, {
      laneTitle: choice.laneTitle,
      optionId: choice.optionId,
      optionLabel: choice.optionLabel,
      outcome: choice.outcome,
      score: choice.score
    }])
  );
  return {
    scenarioId: state.scenarioId,
    scenarioTitle: scenario.title,
    readinessLabel: state.readinessLabel,
    overallReadiness: state.overallReadiness,
    disciplinedCount,
    fragileCount,
    metrics: { ...state.metrics },
    strongestChoices: [...state.strongestChoices],
    remainingWeaknesses: [...state.remainingWeaknesses],
    masterySignals: buildMasterySignals(state),
    laneOutcomes,
    timestamp: new Date().toISOString(),
    timestampLabel: new Date().toLocaleString(),
    buildId: APP_CONFIG.buildId,
    version: APP_CONFIG.version,
    coachMode: state.coachMode
  };
}

function pushHistoryRecord() {
  if (state.completionRecorded || !isMissionComplete(state)) return;
  history = [buildHistoryRecord(), ...history];
  state = { ...state, completionRecorded: true };
  saveHistory();
}

function applyTheme(theme) {
  body.dataset.theme = theme;
  saveJson(themeKey, theme);
}

function initTheme() {
  const savedTheme = loadJson(themeKey);
  if (savedTheme === "light" || savedTheme === "dark") body.dataset.theme = savedTheme;
  else {
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    body.dataset.theme = prefersDark ? "dark" : "light";
  }
  body.dataset.motion = prefersReducedMotion() ? "reduce" : "full";
}

function announce(message) {
  const region = document.getElementById("live-region");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => { region.textContent = message; }, 20);
}

function restoreFocus() {
  const target = root.querySelector("[data-autofocus]");
  if (target && typeof target.focus === "function") {
    window.requestAnimationFrame(() => target.focus());
  }
}

function render() {
  root.innerHTML = renderApp(state, history);
  restoreFocus();
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch (error) {
    window.scrollTo(0, 0);
  }
}

function resetMission() {
  const coachMode = state.coachMode;
  state = normalizeState({ ...createInitialState(), coachMode });
  removeKey(stateKey);
  render();
  announce("Mission reset. Choose a scenario to begin again.");
}

function handleAction(action, dataset) {
  switch (action) {
    case "start-mission":
      state = normalizeState(startMission(state, dataset.scenario));
      saveState();
      render();
      announce("Scenario started. Guided example loaded.");
      break;
    case "enter-map":
      state = normalizeState(goToScreen(state, "map"));
      saveState();
      render();
      announce("Operational readiness map opened.");
      break;
    case "open-lane":
      state = normalizeState(openLane(state, dataset.lane));
      saveState();
      render();
      announce(`${APP_CONFIG.laneNames[dataset.lane] || "Lane"} opened.`);
      break;
    case "choose-option":
      state = normalizeState(chooseLaneOption(state, dataset.lane, dataset.option));
      state = { ...state, screen: "lane", activeLaneId: dataset.lane };
      saveState();
      render();
      announce("Lane decision recorded. Coaching, consequence, and readiness signals updated.");
      break;
    case "answer-challenge": {
      const challenge = buildMicroChallenge(state.scenarioId, dataset.lane);
      const isCorrect = String(dataset.answer) === String(challenge.correctOptionId);
      state = {
        ...state,
        challengeAnswers: {
          ...state.challengeAnswers,
          [dataset.lane]: {
            answerId: dataset.answer,
            correct: isCorrect,
            answeredAt: new Date().toISOString()
          }
        },
        coachAssist: {
          ...state.coachAssist,
          [dataset.lane]: !isCorrect
        },
        lastUpdated: new Date().toISOString()
      };
      saveState();
      render();
      announce(isCorrect ? "Micro-challenge answered. You spotted the hidden risk." : "Micro-challenge answered. Coach hint expanded.");
      break;
    }
    case "ask-coach":
      state = {
        ...state,
        coachAssist: { ...state.coachAssist, [dataset.lane]: true },
        lastUpdated: new Date().toISOString()
      };
      saveState();
      render();
      announce("Coach hint opened for this lane.");
      break;
    case "set-coach":
      state = { ...state, coachMode: dataset.mode || "mission", lastUpdated: new Date().toISOString() };
      saveState();
      render();
      announce(`Coach mode changed to ${dataset.label || dataset.mode}.`);
      break;
    case "next-lane":
      state = normalizeState(moveToNextPending(state));
      if (state.screen === "review") pushHistoryRecord();
      saveState();
      render();
      announce(state.screen === "review" ? "All lanes complete. Readiness review opened." : "Moved to next pending lane.");
      break;
    case "review":
      state = normalizeState(goToScreen(state, "review"));
      if (isMissionComplete(state)) pushHistoryRecord();
      saveState();
      render();
      announce("Readiness review opened.");
      break;
    case "report":
      state = normalizeState(goToScreen(state, "report"));
      saveState();
      render();
      announce("Mission report opened.");
      break;
    case "executive":
      state = normalizeState(goToScreen(state, "executive"));
      saveState();
      render();
      announce("Executive debrief opened.");
      break;
    case "explore":
      state = normalizeState(goToScreen(state, "explore"));
      saveState();
      render();
      announce("Optional exploration opened.");
      break;
    case "start-branch":
      state = normalizeState(startExtensionBranch(state));
      saveState();
      render();
      announce(`Optional branch started${getActiveBranch(state)?.title ? `: ${getActiveBranch(state).title}` : "."}`);
      break;
    case "choose-branch-option":
      state = normalizeState(chooseExtensionOption(state, dataset.step, dataset.option));
      saveState();
      render();
      announce("Optional branch decision recorded.");
      break;
    case "next-branch-step":
      state = normalizeState(moveToNextBranchStep(state));
      saveState();
      render();
      announce(isBranchComplete(state) ? "Optional branch complete." : "Moved to next optional branch step.");
      break;
    case "finish-branch":
      state = normalizeState(finishExtensionBranch(state));
      saveState();
      render();
      announce("Returned to Explore More with completed branch results.");
      break;
    case "replay":
      state = normalizeState(startMission(state, state.scenarioId));
      saveState();
      render();
      announce("Scenario replay started.");
      break;
    case "back-to-map":
      state = normalizeState(goToScreen(state, "map"));
      saveState();
      render();
      announce("Returned to the readiness map.");
      break;
    case "toggle-theme":
      applyTheme(body.dataset.theme === "dark" ? "light" : "dark");
      render();
      announce(`Theme changed to ${body.dataset.theme} mode.`);
      break;
    case "reset":
      resetMission();
      break;
    default:
      break;
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  handleAction(target.dataset.action, target.dataset);
});

window.addEventListener("beforeunload", saveState);
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") saveState();
});

initTheme();
render();
console.info(`${APP_CONFIG.appName} loaded in ${detectEnvironment()} mode.`);
console.info(`Extension branch ${getActiveBranch(state)?.title || "not available"}; completed steps: ${getExtensionCompletedCount(state)}`);
