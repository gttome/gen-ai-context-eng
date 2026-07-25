import { APP_CONFIG, MISSIONS } from "../../data/content.js";
import { getQueryState } from "../utils/env.js";
import { buildSeededChoices, createEmptyExtension, getSeedDefinition, isMissionComplete, recomputeStateFromChoices, startExtensionBranch } from "../domain/engine.js";

export function createInitialState() {
  const defaultScenario = "hr";
  return recomputeStateFromChoices({
    appName: APP_CONFIG.appName,
    version: APP_CONFIG.version,
    buildId: APP_CONFIG.buildId,
    screen: "launch",
    scenarioId: defaultScenario,
    activeLaneId: null,
    choices: {},
    challengeAnswers: {},
    coachAssist: {},
    coachMode: "learn",
    timeline: [],
    baseMetrics: { ...MISSIONS[defaultScenario].initialMetrics },
    metrics: { ...MISSIONS[defaultScenario].initialMetrics },
    overallReadiness: 0,
    readinessLabel: "Prototype Only",
    strongestChoices: [],
    remainingWeaknesses: [],
    completed: false,
    completionRecorded: false,
    extension: createEmptyExtension(),
    nextPendingLaneId: null,
    lastUpdated: new Date().toISOString()
  });
}

export function startMission(state, scenarioId) {
  const scenario = MISSIONS[scenarioId] || MISSIONS.hr;
  return recomputeStateFromChoices({
    ...createInitialState(),
    coachMode: state?.coachMode || "mission",
    scenarioId: scenario.id,
    baseMetrics: { ...scenario.initialMetrics },
    metrics: { ...scenario.initialMetrics },
    screen: "guided",
    extension: createEmptyExtension({ ...scenario.initialMetrics })
  });
}

export function goToScreen(state, screen, activeLaneId = null) {
  return { ...state, screen, activeLaneId: activeLaneId ?? state.activeLaneId, lastUpdated: new Date().toISOString() };
}

export function openLane(state, laneId) {
  return { ...state, screen: "lane", activeLaneId: laneId, lastUpdated: new Date().toISOString() };
}

export function moveToNextPending(state) {
  const nextLane = APP_CONFIG.laneOrder.find(laneId => !state.choices[laneId]) || null;
  if (!nextLane) return goToScreen(state, "review");
  return openLane(state, nextLane);
}

export function applyQueryState(baseState) {
  const query = getQueryState();
  let state = { ...baseState };
  if (query.scenario && MISSIONS[query.scenario]) state = startMission(state, query.scenario);
  const seedId = query.seed || query.path;
  const seedDefinition = seedId ? getSeedDefinition(seedId) : null;
  const shouldBuildSeed = Boolean(seedDefinition && seedId !== "lane-demo");
  if (shouldBuildSeed) {
    state = recomputeStateFromChoices({
      ...state,
      choices: buildSeededChoices(state.scenarioId, seedId),
      screen: seedDefinition.screen || query.screen || "review",
      activeLaneId: query.lane || null,
      completionRecorded: false
    });
  }
  if (query.seed === "lane-demo" && query.lane) state = goToScreen(state, "lane", query.lane);
  if (query.seed === "extension-demo") {
    state = recomputeStateFromChoices({ ...state, choices: buildSeededChoices(state.scenarioId, "disciplined"), screen: "explore", completionRecorded: false });
    if (query.autoplay === "1" || query.branch === "play") state = startExtensionBranch(state);
  }
  if (query.lane && !seedDefinition && query.screen !== "review") {
    state.activeLaneId = query.lane;
    state.screen = query.screen || "lane";
  } else if (query.screen && query.screen !== "branch" && !seedDefinition) {
    state.screen = query.screen;
  }
  if (query.screen === "branch") {
    if (!isMissionComplete(state)) state = recomputeStateFromChoices({ ...state, choices: buildSeededChoices(state.scenarioId, seedId || "disciplined"), screen: "explore", completionRecorded: false });
    state = startExtensionBranch(state);
  }
  return state;
}
