import { APP_CONFIG, MISSIONS, COACH_MODES, SCENARIO_DRAMA } from "../../data/content.js";
import { EXTENSIONS } from "../../data/extensions.js";
import { applyMetricDeltas, computeOverallReadiness, laneOutcomeLabel, readinessLabel } from "../metrics/calc.js";

const DEFAULT_SEED = "disciplined";
const SEED_DEFINITIONS = {
  disciplined: { base: "disciplined", screen: "review", note: "Full disciplined reference path." },
  fragile: { base: "fragile", screen: "review", note: "Full fragile reference path." },
  mixed: { base: "mixed", screen: "review", note: "Alternating strong and weak path." },
  "pilot-ready": { base: "disciplined", screen: "review", note: "Scenario opened in a high-readiness review state." },
  "prototype-risk": { base: "fragile", screen: "review", note: "Scenario opened with high visible launch fragility." },
  "privacy-failure": { base: "disciplined", screen: "review", forceFragile: ["data_handling"], note: "Shows how one privacy lane can keep the workflow below pilot confidence." },
  "policy-fragile": { base: "disciplined", screen: "review", forceFragile: ["policy_refusal", "safety_moderation"], note: "Shows refusal and moderation drift even when the rest of the workflow looks strong." },
  "monitoring-gap": { base: "disciplined", screen: "review", forceFragile: ["monitoring_governance"], note: "Shows how weak thresholds and ownership hold back launch readiness." },
  "release-risk": { base: "disciplined", screen: "review", forceFragile: ["governed_releases"], note: "Shows why a useful workflow still needs staged rollout, rollback, and release records." },
  "fail-safe-missing": { base: "disciplined", screen: "review", forceFragile: ["fail_safe_behavior"], note: "Shows how weak escalation and fallback design keep the workflow brittle." },
  "workshop-demo": { base: "mixed", screen: "review", note: "Balanced demo state for workshops and facilitator walkthroughs." },
  "lane-demo": { base: null, screen: "lane", note: "Jump directly into one lane for instruction or QA." },
  "extension-demo": { base: "disciplined", screen: "explore", note: "Start from a strong core mission and open the optional branch." }
};

const METRIC_IMPACTS = {
  readiness: {
    positive: "Launch traction",
    negative: "Launch hesitation"
  },
  exposureRisk: {
    positive: "Privacy exposure",
    negative: "Safer data boundary"
  },
  trustSafety: {
    positive: "Stronger trust posture",
    negative: "Trust erosion"
  },
  governance: {
    positive: "Audit clarity",
    negative: "Governance gap"
  },
  maintainability: {
    positive: "Maintenance resilience",
    negative: "Maintenance debt"
  },
  rolloutConfidence: {
    positive: "Release confidence",
    negative: "Rollback fragility"
  }
};

const LANE_BADGES = {
  data_handling: "Privacy Guard",
  policy_refusal: "Boundary Framer",
  safety_moderation: "Safety Spotter",
  trust_security: "Trust Boundary Keeper",
  performance_routing: "Lean Routing Planner",
  governed_releases: "Release Steward",
  monitoring_governance: "Drift Watcher",
  fail_safe_behavior: "Fallback Designer"
};

const RANKS = [
  { min: 0, title: "Prototype Helper", guidance: "You can spot useful workflows, but enterprise controls still need structure." },
  { min: 48, title: "Pilot Reviewer", guidance: "You are identifying obvious risk, but fragile lanes still weaken trust under pressure." },
  { min: 62, title: "Readiness Analyst", guidance: "You are making stronger enterprise tradeoffs and can explain why they matter." },
  { min: 76, title: "Governance Operator", guidance: "Your workflow choices are increasingly launchable, reviewable, and maintainable." },
  { min: 90, title: "Enterprise Launch Lead", guidance: "You are choosing disciplined controls that hold up under enterprise review." }
];

function scoreOption(option) {
  return Object.values(option.deltas).reduce((acc, value) => acc + value, 0);
}

function getSortedOptions(lane) {
  return [...lane.options].sort((a, b) => scoreOption(b) - scoreOption(a));
}

function pickDominantMetrics(deltas = {}, limit = 3) {
  return Object.entries(deltas)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit)
    .map(([metricId, value]) => ({ metricId, value }));
}

function impactLabel(metricId, value) {
  const map = METRIC_IMPACTS[metricId];
  if (!map || value === 0) return null;
  const positive = metricId === "exposureRisk" ? value < 0 : value > 0;
  return positive ? map.negative || map.positive : map.negative;
}

export function deriveImpactCapsules(deltas = {}, limit = 3) {
  const seen = new Set();
  return pickDominantMetrics(deltas, limit + 2)
    .map(({ metricId, value }) => impactLabel(metricId, value))
    .filter(Boolean)
    .filter(label => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .slice(0, limit);
}

function createStoredChoice(laneId, lane, option) {
  const score = scoreOption(option);
  return {
    laneId,
    laneTitle: lane.title,
    optionId: option.id,
    optionLabel: option.label,
    summary: option.summary,
    outcome: laneOutcomeLabel(option),
    score,
    deltas: option.deltas,
    coachLocal: option.coachLocal,
    coachSystem: option.coachSystem,
    consequence: option.consequence,
    impacts: deriveImpactCapsules(option.deltas)
  };
}

function createStoredExtensionChoice(step, option) {
  const score = scoreOption(option);
  return {
    stepId: step.id,
    stepTitle: step.title,
    optionId: option.id,
    optionLabel: option.label,
    summary: option.summary,
    outcome: laneOutcomeLabel(option),
    score,
    deltas: option.deltas,
    coaching: option.coaching,
    consequence: option.consequence,
    impacts: deriveImpactCapsules(option.deltas)
  };
}

export function getScenarioById(id) {
  return MISSIONS[id] || MISSIONS.hr;
}

export function getSeedDefinition(seedId) {
  return SEED_DEFINITIONS[seedId] || null;
}

export function listSeedDefinitions() {
  return Object.entries(SEED_DEFINITIONS).map(([id, value]) => ({ id, ...value }));
}

export function getActiveBranch(state) {
  return EXTENSIONS[state.scenarioId] || null;
}

export function getLaneData(scenarioId, laneId) {
  return getScenarioById(scenarioId).lanes[laneId];
}

export function getLaneStatus(state, laneId) {
  const choice = state.choices?.[laneId];
  if (!choice) return "pending";
  return choice.outcome === "Disciplined" ? "strong" : "fragile";
}

export function getCompletedLaneCount(state) {
  return APP_CONFIG.laneOrder.filter(laneId => Boolean(state.choices?.[laneId])).length;
}

export function isMissionComplete(state) {
  return getCompletedLaneCount(state) >= APP_CONFIG.completionTarget;
}

export function getNextPendingLane(state) {
  return APP_CONFIG.laneOrder.find(laneId => !state.choices?.[laneId]) || null;
}

export function getExtensionCompletedCount(state) {
  return Object.keys(state.extension?.choices || {}).length;
}

export function isBranchComplete(state) {
  const branch = getActiveBranch(state);
  if (!branch) return false;
  return getExtensionCompletedCount(state) >= branch.steps.length;
}

export function buildSeededChoices(scenarioId, style = DEFAULT_SEED) {
  const scenario = getScenarioById(scenarioId);
  const definition = SEED_DEFINITIONS[style] || { base: style };
  const baseMode = definition.base || style;
  const choices = {};
  APP_CONFIG.laneOrder.forEach((laneId, index) => {
    const lane = scenario.lanes[laneId];
    let mode = "disciplined";
    if (baseMode === "fragile") mode = "fragile";
    else if (baseMode === "mixed") mode = index % 2 === 0 ? "disciplined" : "fragile";
    else if (baseMode === "middle") mode = "middle";
    if (definition.forceFragile?.includes(laneId)) mode = "fragile";
    if (definition.forceStrong?.includes(laneId)) mode = "disciplined";
    const sorted = getSortedOptions(lane);
    const option = mode === "fragile" ? sorted[sorted.length - 1] : mode === "middle" ? sorted[Math.floor(sorted.length / 2)] : sorted[0];
    choices[laneId] = createStoredChoice(laneId, lane, option);
  });
  return choices;
}

export function chooseLaneOption(state, laneId, optionId) {
  const lane = getLaneData(state.scenarioId, laneId);
  const option = lane.options.find(item => item.id === optionId);
  if (!option) return state;
  return recomputeStateFromChoices({
    ...state,
    choices: { ...state.choices, [laneId]: createStoredChoice(laneId, lane, option) },
    extension: state.extension?.active ? recomputeExtensionState(state.extension, state.scenarioId) : state.extension,
    lastUpdated: new Date().toISOString()
  });
}

export function createEmptyExtension(baseMetrics = null) {
  const metrics = baseMetrics ? { ...baseMetrics } : null;
  const overall = metrics ? computeOverallReadiness(metrics) : 0;
  return {
    active: false,
    branchId: null,
    stepIndex: 0,
    choices: {},
    baseMetrics: metrics,
    metrics,
    overallReadiness: overall,
    readinessLabel: metrics ? readinessLabel(overall) : "Not started",
    timeline: [],
    completed: false,
    summary: null
  };
}

export function recomputeStateFromChoices(state) {
  const scenario = getScenarioById(state.scenarioId);
  let metrics = { ...scenario.initialMetrics };
  const timeline = [];
  APP_CONFIG.laneOrder.forEach((laneId) => {
    const choice = state.choices?.[laneId];
    if (!choice) return;
    metrics = applyMetricDeltas(metrics, choice.deltas);
    timeline.push({ laneId, title: choice.laneTitle, consequence: choice.consequence, outcome: choice.outcome, phase: "core" });
  });
  const overallReadiness = computeOverallReadiness(metrics);
  const strongestChoices = Object.values(state.choices || {})
    .filter(choice => choice.outcome === "Disciplined")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(choice => choice.laneTitle);
  const remainingWeaknesses = APP_CONFIG.laneOrder
    .filter(laneId => !state.choices?.[laneId] || state.choices[laneId].outcome === "Fragile")
    .slice(0, 4)
    .map(laneId => scenario.lanes[laneId].title);
  const nextPendingLaneId = getNextPendingLane({ ...state, choices: state.choices || {} });
  const extension = state.extension?.active
    ? recomputeExtensionState({ ...state.extension, baseMetrics: state.extension.baseMetrics || metrics }, state.scenarioId)
    : state.extension || createEmptyExtension(metrics);
  return {
    ...state,
    baseMetrics: { ...scenario.initialMetrics },
    metrics,
    timeline,
    overallReadiness,
    readinessLabel: readinessLabel(overallReadiness),
    strongestChoices,
    remainingWeaknesses,
    nextPendingLaneId,
    completed: isMissionComplete({ ...state, choices: state.choices || {} }),
    completionRecorded: state.completionRecorded ?? false,
    extension,
    lastUpdated: new Date().toISOString()
  };
}

export function startExtensionBranch(state) {
  const branch = getActiveBranch(state);
  if (!branch) return state;
  return {
    ...state,
    screen: "branch",
    extension: recomputeExtensionState({
      active: true,
      branchId: branch.id,
      stepIndex: 0,
      choices: {},
      baseMetrics: { ...state.metrics },
      metrics: { ...state.metrics },
      overallReadiness: state.overallReadiness,
      readinessLabel: state.readinessLabel,
      timeline: [],
      completed: false,
      summary: null
    }, state.scenarioId),
    lastUpdated: new Date().toISOString()
  };
}

export function chooseExtensionOption(state, stepId, optionId) {
  const branch = getActiveBranch(state);
  if (!branch || !state.extension?.active) return state;
  const step = branch.steps.find(item => item.id === stepId);
  if (!step) return state;
  const option = step.options.find(item => item.id === optionId);
  if (!option) return state;
  return {
    ...state,
    extension: recomputeExtensionState({
      ...state.extension,
      choices: { ...state.extension.choices, [stepId]: createStoredExtensionChoice(step, option) }
    }, state.scenarioId),
    lastUpdated: new Date().toISOString()
  };
}

export function moveToNextBranchStep(state) {
  const branch = getActiveBranch(state);
  if (!branch || !state.extension?.active) return state;
  const completed = getExtensionCompletedCount(state) >= branch.steps.length;
  const nextIndex = Math.min(state.extension.stepIndex + 1, branch.steps.length - 1);
  return {
    ...state,
    extension: {
      ...state.extension,
      stepIndex: completed ? state.extension.stepIndex : nextIndex,
      completed,
      summary: buildBranchSummary({ ...state, extension: state.extension })
    },
    lastUpdated: new Date().toISOString()
  };
}

export function finishExtensionBranch(state) {
  return {
    ...state,
    screen: "explore",
    extension: { ...state.extension, completed: true, summary: buildBranchSummary(state) },
    lastUpdated: new Date().toISOString()
  };
}

function recomputeExtensionState(extension, scenarioId) {
  const branch = EXTENSIONS[scenarioId];
  if (!extension?.active || !branch) return extension;
  let metrics = { ...(extension.baseMetrics || MISSIONS[scenarioId].initialMetrics) };
  const timeline = [];
  branch.steps.forEach((step, index) => {
    const choice = extension.choices?.[step.id];
    if (!choice) return;
    metrics = applyMetricDeltas(metrics, choice.deltas);
    timeline.push({
      laneId: step.id,
      title: `Explore More · ${step.title}`,
      consequence: choice.consequence,
      outcome: choice.outcome,
      phase: "extension",
      index
    });
  });
  const overallReadiness = computeOverallReadiness(metrics);
  const completed = Object.keys(extension.choices || {}).length >= branch.steps.length;
  return {
    ...extension,
    metrics,
    timeline,
    overallReadiness,
    readinessLabel: readinessLabel(overallReadiness),
    completed,
    summary: completed ? buildBranchSummary({ scenarioId, extension: { ...extension, metrics, timeline, overallReadiness, active: true } }) : extension.summary || null
  };
}

function buildReferenceChoices(scenarioId, mode = "disciplined") {
  const scenario = getScenarioById(scenarioId);
  const choices = {};
  APP_CONFIG.laneOrder.forEach((laneId) => {
    const lane = scenario.lanes[laneId];
    const sorted = getSortedOptions(lane);
    choices[laneId] = createStoredChoice(laneId, lane, mode === "disciplined" ? sorted[0] : sorted[sorted.length - 1]);
  });
  return choices;
}

export function buildMissionSummary(state) {
  const scenario = getScenarioById(state.scenarioId);
  const fragileSelections = Object.values(state.choices || {}).filter(choice => choice.outcome === "Fragile");
  const strongest = state.strongestChoices?.length ? state.strongestChoices : ["No strong choices recorded yet"];
  const weaknesses = state.remainingWeaknesses?.length ? state.remainingWeaknesses : ["No major weakness currently visible"];
  const nextBestImprovement = fragileSelections[0]
    ? `Tighten ${fragileSelections[0].laneTitle} next. That is the clearest way to reduce hidden launch debt in this scenario.`
    : `Open Explore More for ${scenario.optionalBranch.toLowerCase()} to test the workflow under stricter conditions.`;
  return {
    strongest,
    weaknesses,
    nextBestImprovement,
    compareHeadline: fragileSelections.length === 0 ? "Your path is close to the disciplined launch reference." : "Your path still carries visible fragility compared with the disciplined launch reference.",
    fragileCount: fragileSelections.length,
    disciplinedCount: Object.values(state.choices || {}).filter(choice => choice.outcome === "Disciplined").length
  };
}

export function buildBranchSummary(state) {
  const branch = getActiveBranch(state);
  const extension = state.extension;
  if (!branch || !extension?.active) return null;
  const strong = Object.values(extension.choices || {}).filter(choice => choice.outcome === "Disciplined").map(choice => choice.stepTitle);
  const weak = branch.steps.filter(step => !extension.choices?.[step.id] || extension.choices[step.id].outcome === "Fragile").map(step => step.title);
  return {
    strongestMoves: strong.slice(0, 3),
    remainingRisks: weak.slice(0, 3),
    headline: weak.length === 0 ? "Optional branch handled with a disciplined extension path." : "The optional branch still exposes enterprise fragility.",
    netReadinessChange: extension.baseMetrics ? computeOverallReadiness(extension.metrics) - computeOverallReadiness(extension.baseMetrics) : 0
  };
}

export function buildReferenceSnapshot(scenarioId, mode = "disciplined") {
  const choices = buildReferenceChoices(scenarioId, mode);
  return recomputeStateFromChoices({ scenarioId, choices, extension: createEmptyExtension(), completionRecorded: false });
}

export function buildMetricComparison(state) {
  const disciplined = buildReferenceSnapshot(state.scenarioId, "disciplined");
  const fragile = buildReferenceSnapshot(state.scenarioId, "fragile");
  return APP_CONFIG.metrics.map(metric => ({
    id: metric.id,
    label: metric.label,
    current: state.metrics[metric.id],
    disciplined: disciplined.metrics[metric.id],
    fragile: fragile.metrics[metric.id],
    gapToDisciplined: metric.id === "exposureRisk" ? disciplined.metrics[metric.id] - state.metrics[metric.id] : state.metrics[metric.id] - disciplined.metrics[metric.id],
    goodDirection: metric.goodDirection
  }));
}

export function buildLaneComparison(state) {
  const scenario = getScenarioById(state.scenarioId);
  return APP_CONFIG.laneOrder.map(laneId => {
    const lane = scenario.lanes[laneId];
    const choice = state.choices?.[laneId];
    return {
      laneId,
      title: lane.title,
      status: choice ? choice.outcome : "Pending",
      selection: choice ? choice.optionLabel : "Not selected",
      whyDifferent: !choice ? "No decision recorded yet, so the workflow still carries unresolved readiness debt here." : choice.coachSystem,
      consequence: choice ? choice.consequence : "This lane still has unresolved enterprise readiness debt.",
      score: choice ? choice.score : null,
      impacts: choice?.impacts || []
    };
  });
}

function buildMasterySignalsFromMetrics(metrics) {
  const signals = [];
  if (!metrics) return ["No mastery signals recorded yet"];
  if (metrics.exposureRisk <= 35) signals.push("Leaner Evidence Handling");
  if (metrics.trustSafety >= 80) signals.push("Strong Boundary Judgment");
  if (metrics.governance >= 80) signals.push("Clearer Governance Design");
  if (metrics.maintainability >= 80) signals.push("Stronger Maintenance Discipline");
  if (metrics.rolloutConfidence >= 80) signals.push("Pilot-Ready Release Discipline");
  if (metrics.readiness >= 85) signals.push("Coordinated Enterprise Judgment");
  return signals.length ? signals : ["Core readiness still needs tightening"];
}

export function buildMasterySignals(state) {
  return buildMasterySignalsFromMetrics(state.metrics);
}

export function buildProgression(state, history = []) {
  const rank = [...RANKS].reverse().find(item => state.overallReadiness >= item.min) || RANKS[0];
  const disciplinedChoices = APP_CONFIG.laneOrder.filter(laneId => state.choices?.[laneId]?.outcome === "Disciplined");
  const badges = disciplinedChoices.map(laneId => LANE_BADGES[laneId]).slice(0, 5);
  const scenarioRuns = history.filter(item => item.scenarioId === state.scenarioId);
  const latestThree = scenarioRuns.slice(0, 3);
  const improvementStreak = latestThree.length < 2
    ? disciplinedChoices.length
    : latestThree.reduce((count, run, index, arr) => {
        if (index === arr.length - 1) return count;
        return Number(run.overallReadiness) >= Number(arr[index + 1].overallReadiness) ? count + 1 : count;
      }, 1);
  return {
    rankTitle: rank.title,
    rankGuidance: rank.guidance,
    badges: badges.length ? badges : ["Complete more disciplined lanes to unlock mastery badges"],
    disciplinedCount: disciplinedChoices.length,
    fragileCount: APP_CONFIG.laneOrder.filter(laneId => state.choices?.[laneId]?.outcome === "Fragile").length,
    improvementStreak,
    scenarioRuns: scenarioRuns.length
  };
}

export function buildAuditTrace(state) {
  const laneRows = Object.values(state.choices || {});
  if (!laneRows.length) {
    return {
      strengths: ["No lane decisions recorded yet."],
      risks: ["Start the mission to reveal the first operational hotspot."],
      hotspots: []
    };
  }
  const scored = laneRows.map(choice => ({
    laneTitle: choice.laneTitle,
    optionLabel: choice.optionLabel,
    outcome: choice.outcome,
    score: choice.score,
    consequence: choice.consequence,
    strongestMetric: pickDominantMetrics(choice.deltas, 1)[0]
  }));
  const strengths = scored
    .filter(item => item.outcome === "Disciplined")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => `${item.laneTitle}: ${item.optionLabel}`);
  const risks = scored
    .filter(item => item.outcome === "Fragile")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(item => `${item.laneTitle}: ${item.consequence}`);
  const hotspots = scored
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 4)
    .map(item => ({
      laneTitle: item.laneTitle,
      outcome: item.outcome,
      optionLabel: item.optionLabel,
      strongestMetric: item.strongestMetric?.metricId || "readiness",
      strongestDelta: item.strongestMetric?.value ?? 0,
      consequence: item.consequence
    }));
  return {
    strengths: strengths.length ? strengths : ["No strong readiness moves recorded yet."],
    risks: risks.length ? risks : ["No major hidden debt remains visible in the current core path."],
    hotspots
  };
}

function compareLaneRecords(latest, previous) {
  return APP_CONFIG.laneOrder.map(laneId => {
    const current = latest?.laneOutcomes?.[laneId] || null;
    const prior = previous?.laneOutcomes?.[laneId] || null;
    const currentOutcome = current?.outcome || "Not set";
    const priorOutcome = prior?.outcome || "Not set";
    let shift = "Unchanged";
    if (currentOutcome !== priorOutcome) {
      if (currentOutcome === "Disciplined" && priorOutcome !== "Disciplined") shift = "Improved";
      else if (currentOutcome === "Fragile" && priorOutcome !== "Fragile") shift = "Worsened";
      else shift = "Changed";
    }
    return {
      laneId,
      title: APP_CONFIG.laneNames[laneId],
      currentOutcome,
      priorOutcome,
      currentLabel: current?.optionLabel || "Not selected",
      priorLabel: prior?.optionLabel || "Not selected",
      shift
    };
  });
}

export function buildReplayAnalytics(history = [], scenarioId = null) {
  const filtered = scenarioId ? history.filter(item => item.scenarioId === scenarioId) : history;
  if (!filtered.length) {
    return {
      runCount: 0,
      bestReadiness: null,
      averageReadiness: null,
      latestReadiness: null,
      latestDelta: null,
      readinessTrend: "No recorded runs yet.",
      laneChanges: [],
      masterySignals: ["No mastery signals recorded yet."],
      improvementNarrative: "Run the mission once to unlock replay analytics."
    };
  }
  const ordered = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latest = ordered[0];
  const previous = ordered[1] || null;
  const best = filtered.reduce((acc, item) => Number(item.overallReadiness || 0) > Number(acc.overallReadiness || 0) ? item : acc, filtered[0]);
  const bestReadiness = Number(best.overallReadiness || 0);
  const averageReadiness = Math.round(filtered.reduce((acc, item) => acc + Number(item.overallReadiness || 0), 0) / filtered.length);
  const latestReadiness = Number(latest.overallReadiness || 0);
  const latestDelta = previous ? latestReadiness - Number(previous.overallReadiness || 0) : null;
  const readinessTrend = latestDelta === null ? "First recorded run." : latestDelta > 0 ? `Up ${latestDelta} vs previous run.` : latestDelta < 0 ? `Down ${Math.abs(latestDelta)} vs previous run.` : "Flat vs previous run.";
  const laneChanges = compareLaneRecords(latest, previous);
  const improvedCount = laneChanges.filter(item => item.shift === "Improved").length;
  const worsenedCount = laneChanges.filter(item => item.shift === "Worsened").length;
  const masterySignals = latest.masterySignals?.length ? latest.masterySignals : buildMasterySignalsFromMetrics(latest.metrics);
  const improvementNarrative = previous
    ? improvedCount > worsenedCount
      ? `Latest replay tightened ${improvedCount} lane(s) and weakened ${worsenedCount}. The system is moving in a more governed direction.`
      : improvedCount < worsenedCount
        ? `Latest replay weakened more lanes than it improved. Review the changed lane choices before treating this path as safer.`
        : `Latest replay changed lane behavior, but net improvement is still mixed. Compare the altered lanes before deciding it is stronger.`
    : "This is the first recorded run for this scenario.";
  return {
    runCount: filtered.length,
    bestReadiness,
    averageReadiness,
    latestReadiness,
    latestDelta,
    readinessTrend,
    latestLabel: latest.readinessLabel,
    bestLabel: best.readinessLabel,
    laneChanges,
    masterySignals,
    improvementNarrative,
    latestTimestampLabel: latest.timestampLabel,
    latestStrongestChoices: latest.strongestChoices || [],
    latestWeaknesses: latest.remainingWeaknesses || []
  };
}

function metricPriority(metricId) {
  return APP_CONFIG.metrics.find(metric => metric.id === metricId)?.label || metricId;
}

export function buildMicroChallenge(scenarioId, laneId) {
  const lane = getLaneData(scenarioId, laneId);
  const sorted = getSortedOptions(lane);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const topRisk = pickDominantMetrics(worst.deltas, 1)[0];
  const reviewLens = topRisk?.metricId === "exposureRisk"
    ? "create avoidable privacy or exposure debt"
    : topRisk?.metricId === "governance"
      ? "look weakest in an enterprise review board"
      : topRisk?.metricId === "rolloutConfidence"
        ? "make launch and rollback harder to defend"
        : "leave the workflow looking good in demo but fragile in operations";
  return {
    laneId,
    question: `Which path is most likely to ${reviewLens}?`,
    answers: [
      { id: best.id, label: best.label, correct: false },
      { id: worst.id, label: worst.label, correct: true }
    ],
    correctOptionId: worst.id,
    explanation: `The fragile path in this lane is "${worst.label}" because it weakens ${metricPriority(topRisk?.metricId || "readiness")} in a visible enterprise way.`
  };
}

export function buildCoachNarrative(state, laneId) {
  const lane = getLaneData(state.scenarioId, laneId);
  const mode = COACH_MODES[state.coachMode] || COACH_MODES.mission;
  const challenge = buildMicroChallenge(state.scenarioId, laneId);
  const strongOption = getSortedOptions(lane)[0];
  const weakOption = getSortedOptions(lane).slice(-1)[0];
  const focusMetric = pickDominantMetrics(strongOption.deltas, 1)[0]?.metricId || "readiness";
  return {
    mode,
    beforeChoice: {
      notice: `${mode.noticeLead} ${lane.whyItMatters}`,
      strongSignal: `${mode.signalLead} The safer path usually strengthens ${metricPriority(focusMetric)} without hiding downstream work.`,
      watchOut: `${mode.watchLead} ${weakOption.label} is the path most likely to create hidden debt here.`,
      reviewerQuestion: `${mode.questionLead} What would a reviewer question first if this lane were audited tomorrow?`,
      assistHint: `${mode.assistLead} Start by comparing "${strongOption.label}" against "${weakOption.label}" and ask which one keeps the workflow explainable after launch.`
    },
    challenge
  };
}

export function buildChoiceDebrief(choice) {
  if (!choice) {
    return {
      protected: "No protection signal yet",
      exposed: "No enterprise risk surfaced yet",
      stabilized: "No system effect visible yet",
      govern: "Choose a path to reveal the operational tradeoff."
    };
  }
  const strong = pickDominantMetrics(choice.deltas, 2).filter(item => item.value !== 0);
  const protectedMetric = strong[0]?.metricId || "readiness";
  const secondMetric = strong[1]?.metricId || protectedMetric;
  const positive = choice.outcome === "Disciplined";
  const protectedText = positive
    ? `You protected ${metricPriority(protectedMetric).toLowerCase()} by choosing a more disciplined path.`
    : `You protected short-term convenience, but not enterprise resilience.`;
  const exposedText = positive
    ? `You still expose some risk if other lanes remain fragile.`
    : `You exposed ${metricPriority(protectedMetric).toLowerCase()} to avoidable pressure in this lane.`;
  const stabilizedText = positive
    ? `You stabilized ${metricPriority(secondMetric).toLowerCase()} and made later review easier.`
    : `You stabilized speed or surface helpfulness, but not long-term control.`;
  const governText = positive
    ? `Still need to govern how this lane coordinates with release, monitoring, and fail-safe behavior.`
    : `Still need to govern the downstream burden created by this weaker choice.`;
  return {
    protected: protectedText,
    exposed: exposedText,
    stabilized: stabilizedText,
    govern: governText
  };
}

export function buildStakeholderMoment(state, laneId) {
  const drama = SCENARIO_DRAMA[state.scenarioId] || SCENARIO_DRAMA.hr;
  const choice = state.choices?.[laneId] || null;
  const lane = getLaneData(state.scenarioId, laneId);
  const stakeholderKey = laneId === "data_handling"
    ? "compliance"
    : laneId === "policy_refusal" || laneId === "safety_moderation"
      ? "ops"
      : laneId === "trust_security"
        ? "security"
        : laneId === "governed_releases" || laneId === "monitoring_governance"
          ? "reviewer"
          : "sponsor";
  const stakeholder = drama[stakeholderKey];
  const tone = choice?.outcome === "Disciplined" ? "supportive" : choice ? "warning" : "anticipation";
  const message = !choice
    ? stakeholder.pending.replace("{lane}", lane.title)
    : choice.outcome === "Disciplined"
      ? stakeholder.positive.replace("{lane}", lane.title)
      : stakeholder.negative.replace("{lane}", lane.title);
  return {
    tone,
    title: stakeholder.title,
    message
  };
}

export function buildMissionDebrief(state, history = []) {
  const summary = buildMissionSummary(state);
  const analytics = buildReplayAnalytics(history, state.scenarioId);
  const fragileChoices = Object.values(state.choices || {}).filter(choice => choice.outcome === "Fragile");
  const progression = buildProgression(state, history);
  const weakestMetric = buildMetricComparison(state)
    .map(row => ({ ...row, gapMagnitude: row.goodDirection === "down" ? row.current - row.disciplined : row.disciplined - row.current }))
    .sort((a, b) => b.gapMagnitude - a.gapMagnitude)[0];
  return {
    whatYouDidWell: summary.strongest,
    reviewerWorry: fragileChoices.length
      ? fragileChoices.slice(0, 3).map(choice => `${choice.laneTitle}: ${choice.consequence}`)
      : [`The current path is close to pilot-ready, but reviewers will still examine ${weakestMetric?.label || "remaining gaps"} before broader rollout.`],
    fixBeforePilot: summary.nextBestImprovement,
    fixBeforeBroadRollout: weakestMetric
      ? `Before broad rollout, tighten ${weakestMetric.label.toLowerCase()} so the workflow remains dependable after more users, more variance, and more release pressure.`
      : "Before broad rollout, deepen monitoring, release discipline, and fail-safe review under a stricter scenario branch.",
    bestReplayPath: analytics.runCount < 2
      ? "Replay once with a stricter reviewer mindset and see which lane becomes your first visible blocker."
      : `Best replay path: protect your current rank (${progression.rankTitle}) while tightening ${weakestMetric?.label || "the largest remaining gap"}.`
  };
}

export function getDisplaySnapshot(state) {
  if (state.screen === "branch" && state.extension?.active) {
    return {
      metrics: state.extension.metrics,
      overallReadiness: state.extension.overallReadiness,
      readinessLabel: state.extension.readinessLabel,
      timeline: [...(state.timeline || []), ...(state.extension.timeline || [])],
      badge: `Branch ${getExtensionCompletedCount(state)}/${getActiveBranch(state)?.steps.length || 0}`
    };
  }
  return {
    metrics: state.metrics,
    overallReadiness: state.overallReadiness,
    readinessLabel: state.readinessLabel,
    timeline: state.timeline,
    badge: `${getCompletedLaneCount(state)}/${APP_CONFIG.completionTarget} lanes`
  };
}


export function buildConsequenceSimulator(state, laneId = null) {
  const choices = laneId ? [state.choices?.[laneId]].filter(Boolean) : Object.values(state.choices || {});
  if (!choices.length) return { headline: "Operational effects appear after your first meaningful choice.", items: ["Launch friction is still hypothetical until a lane choice reveals tradeoffs.", "Review burden is still hidden because no control path has been selected yet.", "Replay gets more useful once the app has at least one concrete consequence to compare."] };
  const aggregate = { readiness: 0, exposureRisk: 0, trustSafety: 0, governance: 0, maintainability: 0, rolloutConfidence: 0 };
  choices.forEach(choice => Object.entries(choice.deltas || {}).forEach(([metricId, value]) => aggregate[metricId] = (aggregate[metricId] || 0) + value));
  const items = [];
  if (aggregate.exposureRisk <= -4) items.push("Audit burden drops because the workflow is carrying less avoidable exposure.");
  if (aggregate.exposureRisk >= 4) items.push("Privacy review pressure rises because the workflow is now carrying more detail than it can easily justify.");
  if (aggregate.rolloutConfidence >= 5) items.push("Pilot approval becomes easier because rollback and launch posture are easier to defend.");
  if (aggregate.rolloutConfidence <= -5) items.push("Pilot timing slips because release reviewers now see more rollback and launch fragility.");
  if (aggregate.trustSafety >= 5) items.push("User trust improves because the workflow is clearer about safe boundaries and next steps.");
  if (aggregate.trustSafety <= -5) items.push("Manual recovery work rises because the workflow feels helpful but less safe under pressure.");
  if (aggregate.maintainability >= 5) items.push("Ongoing maintenance gets lighter because the path is easier to explain, test, and revise.");
  if (aggregate.maintainability <= -5) items.push("Operational debt grows because the path is harder to test, explain, and maintain over time.");
  if (aggregate.governance >= 5) items.push("Cross-functional review becomes faster because the control story is clearer.");
  if (aggregate.governance <= -5) items.push("Review-room friction rises because ownership, thresholds, or release evidence still look soft.");
  if (!items.length) items.push("This choice changes the workflow, but the consequence is still mixed rather than clearly stronger or weaker.");
  return { headline: laneId ? "Consequence simulator" : "Simulated operational effects", items: items.slice(0, 3) };
}
export function buildReviewRoom(state) {
  const choices = state.choices || {};
  const roles = [
    { role: "Business Owner", tone: state.overallReadiness >= 78 ? "supportive" : "warning", verdict: state.overallReadiness >= 78 ? "Pilot looks plausible" : "Value is visible, but launch still needs tightening", message: state.overallReadiness >= 78 ? "The workflow now looks easier to sponsor because its controls are more explainable alongside usefulness." : "The workflow still shows value, but the control story is not yet strong enough to rely on repeated enterprise use." },
    { role: "Compliance", tone: state.metrics.exposureRisk <= 38 && choices.data_handling?.outcome !== "Fragile" ? "supportive" : "warning", verdict: state.metrics.exposureRisk <= 38 ? "Exposure posture improving" : "Exposure posture still too broad", message: state.metrics.exposureRisk <= 38 ? "Need-to-know filtering and clearer refusal boundaries make this easier to defend in review." : "Data handling or refusal design still leaves too much room for overexposure or weak boundary behavior." },
    { role: "Security", tone: choices.trust_security?.outcome === "Disciplined" ? "supportive" : "warning", verdict: choices.trust_security?.outcome === "Disciplined" ? "Trust boundary looks stronger" : "Trust boundary still fragile", message: choices.trust_security?.outcome === "Disciplined" ? "Trusted rules and untrusted content are easier to separate, which reduces manipulation risk." : "The workflow still makes it too easy for untrusted material or broad access assumptions to distort behavior." },
    { role: "Operations", tone: state.metrics.rolloutConfidence >= 72 && choices.fail_safe_behavior?.outcome === "Disciplined" ? "supportive" : "warning", verdict: state.metrics.rolloutConfidence >= 72 ? "Operating path is clearer" : "Operating path still creates avoidable recovery work", message: state.metrics.rolloutConfidence >= 72 ? "Fallbacks, monitoring, and release discipline are starting to look manageable in day-to-day operations." : "Release, monitoring, or fallback design still creates ambiguity about what happens when the workflow drifts or stalls." },
    { role: "Domain Expert", tone: choices.policy_refusal?.outcome === "Disciplined" && choices.safety_moderation?.outcome === "Disciplined" ? "supportive" : "warning", verdict: choices.policy_refusal?.outcome === "Disciplined" ? "Response behavior is clearer" : "Response behavior still risks overreach", message: choices.policy_refusal?.outcome === "Disciplined" ? "The workflow is better at separating normal guidance from disallowed or high-consequence requests." : "The workflow still sounds more confident than its approval boundary actually allows." }
  ];
  return { roles, blocker: roles.find(role => role.tone === "warning") || roles[0] };
}
export function buildExecutiveDebrief(state, history = []) {
  const summary = buildMissionSummary(state);
  const reviewRoom = buildReviewRoom(state);
  const progression = buildProgression(state, history);
  const consequences = buildConsequenceSimulator(state);
  const fragile = Object.values(state.choices || {}).filter(choice => choice.outcome === "Fragile");
  const recommendation = state.overallReadiness >= 84 ? "Ready for pilot with monitored launch discipline" : state.overallReadiness >= 68 ? "Useful, but tighten controls before pilot" : "Prototype value is visible, but enterprise controls still need work";
  const beforePilot = fragile.length ? fragile.slice(0, 3).map(choice => `${choice.laneTitle}: ${choice.consequence}`) : [summary.nextBestImprovement];
  const beforeBroadRollout = [state.metrics.rolloutConfidence >= 75 ? "Keep staged rollout and rollback ownership visible as usage expands." : "Strengthen release evidence, staged rollout, and rollback ownership before broader launch.", state.metrics.governance >= 75 ? "Monitoring and review ownership look usable, but still retest them under higher volume." : "Monitoring thresholds and review ownership still need clearer triggers before broad release.", state.metrics.exposureRisk <= 38 ? "Data exposure is improving, but continue tightening packets as scenarios evolve." : "Data packets and logging still need stricter need-to-know discipline before scale."];
  return { recommendation, topRisks: beforePilot, blockerRole: reviewRoom.blocker.role, blockerReason: reviewRoom.blocker.message, beforePilot, beforeBroadRollout, rankTitle: progression.rankTitle, launchSignal: consequences.items[0] || "Launch confidence is still mixed.", reviewRoom };
}
export function buildReplayTheater(state, history = []) {
  const analytics = buildReplayAnalytics(history, state.scenarioId);
  const audit = buildAuditTrace(state);
  const firstChoice = (state.timeline || [])[0];
  const lastChoice = (state.timeline || []).slice(-1)[0];
  return { headline: analytics.runCount > 1 ? "Replay story · What changed across runs" : "Replay story · The story of this run", beats: [firstChoice ? `You opened with ${firstChoice.title}, which immediately set the tone for how the workflow would be judged later.` : "Your first lane decision becomes the first visible control signal for the workflow.", audit.strengths[0] ? `Your strongest moment: ${audit.strengths[0]}.` : "No standout strength is visible yet.", audit.risks[0] ? `Most costly visible debt: ${audit.risks[0]}.` : "No major hidden debt remains visible in the current path.", analytics.runCount > 1 ? `Compared with your previous run, the latest replay trend is: ${analytics.readinessTrend}` : "A second run will reveal whether your judgment is tightening or only shifting lanes.", lastChoice ? `The mission closes on ${lastChoice.title}, which is why the final launch story feels ${state.readinessLabel.toLowerCase()}.` : `The current launch story feels ${state.readinessLabel.toLowerCase()}.` ] };
}
export function buildJourneyMap(state, history = []) {
  const allScenarioIds = Object.keys(MISSIONS);
  const completedScenarios = new Set(history.map(item => item.scenarioId));
  const currentScenarioCompleted = isMissionComplete(state) ? new Set([...completedScenarios, state.scenarioId]) : completedScenarios;
  const remaining = allScenarioIds.filter(id => !currentScenarioCompleted.has(id));
  const weakestMetric = buildMetricComparison(state).map(row => ({ ...row, gapMagnitude: row.goodDirection === "down" ? row.current - row.disciplined : row.disciplined - row.current })).sort((a, b) => b.gapMagnitude - a.gapMagnitude)[0];
  const recommendedNextScenario = remaining[0] || allScenarioIds[0];
  return { completedCount: currentScenarioCompleted.size, totalCount: allScenarioIds.length, recommendedNextScenario, recommendedReason: weakestMetric ? `Your next best mission is ${MISSIONS[recommendedNextScenario]?.title || recommendedNextScenario} because your current largest gap is ${weakestMetric.label.toLowerCase()}.` : `Your next best mission is ${MISSIONS[recommendedNextScenario]?.title || recommendedNextScenario} to widen your Chapter 5 judgment across another scenario family.`, phases: [{ label: "Core foundation", status: currentScenarioCompleted.size >= 1 ? "done" : "current" }, { label: "Cross-functional judgment", status: currentScenarioCompleted.size >= 3 ? "done" : currentScenarioCompleted.size >= 1 ? "current" : "next" }, { label: "Advanced scenarios", status: currentScenarioCompleted.size >= 5 ? "done" : currentScenarioCompleted.size >= 3 ? "current" : "next" }] };
}
