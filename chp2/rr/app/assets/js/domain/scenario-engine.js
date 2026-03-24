const CORE_STEPS = [
  { id: 'scenario', label: 'Scenario', description: 'Choose a bounded workplace case.' },
  { id: 'score', label: 'Score', description: 'Evaluate every case with the rubric.' },
  { id: 'diagnose', label: 'Diagnose', description: 'Tag the dominant failure pattern.' },
  { id: 'change', label: 'Change', description: 'Select one targeted improvement.' },
  { id: 'compare', label: 'Compare', description: 'Review the same cases before and after.' },
  { id: 'decide', label: 'Decide', description: 'Choose the responsible next move.' }
];

export function getCoreSteps() {
  return CORE_STEPS;
}

export function createInitialState(appData) {
  return {
    appVersion: appData.app.version,
    selectedScenarioId: appData.scenarios[0]?.id || null,
    started: false,
    scoringLocked: false,
    selectedChangeId: null,
    exploreSelections: [],
    scores: {},
    failureSelections: {},
    notes: {},
    completedSteps: [],
    lastUpdated: new Date().toISOString()
  };
}

export function getScenario(appData, state) {
  return appData.scenarios.find((scenario) => scenario.id === state.selectedScenarioId) || appData.scenarios[0];
}

export function buildEmptyScenarioState(scenario) {
  const scores = {};
  const failureSelections = {};
  scenario.testCases.forEach((testCase) => {
    scores[testCase.id] = {};
    scenario.rubric.forEach((criterion) => {
      scores[testCase.id][criterion.id] = null;
    });
    failureSelections[testCase.id] = null;
  });
  return { scores, failureSelections };
}

export function ensureScenarioState(appData, state) {
  const scenario = getScenario(appData, state);
  const hasScores = state.scores?.[scenario.id];
  const hasFailures = state.failureSelections?.[scenario.id];
  if (hasScores && hasFailures) return state;
  const blank = buildEmptyScenarioState(scenario);
  return {
    ...state,
    scores: { ...(state.scores || {}), [scenario.id]: blank.scores },
    failureSelections: { ...(state.failureSelections || {}), [scenario.id]: blank.failureSelections }
  };
}

export function getScenarioScores(state, scenario) {
  return state.scores?.[scenario.id] || buildEmptyScenarioState(scenario).scores;
}

export function getScenarioFailures(state, scenario) {
  return state.failureSelections?.[scenario.id] || buildEmptyScenarioState(scenario).failureSelections;
}

export function setScenario(state, appData, scenarioId) {
  const scenario = appData.scenarios.find((item) => item.id === scenarioId) || appData.scenarios[0];
  const blank = buildEmptyScenarioState(scenario);
  return {
    ...state,
    selectedScenarioId: scenario.id,
    started: false,
    scoringLocked: false,
    selectedChangeId: null,
    exploreSelections: [],
    scores: { ...(state.scores || {}), [scenario.id]: state.scores?.[scenario.id] || blank.scores },
    failureSelections: { ...(state.failureSelections || {}), [scenario.id]: state.failureSelections?.[scenario.id] || blank.failureSelections },
    completedSteps: ['scenario'],
    lastUpdated: new Date().toISOString()
  };
}

export function startScenario(state) {
  return {
    ...state,
    started: true,
    completedSteps: Array.from(new Set([...(state.completedSteps || []), 'scenario'])),
    lastUpdated: new Date().toISOString()
  };
}

export function updateScore(state, scenario, caseId, criterionId, value) {
  const next = structuredClone(state);
  next.scores ??= {};
  next.scores[scenario.id] ??= buildEmptyScenarioState(scenario).scores;
  next.scores[scenario.id][caseId][criterionId] = value;
  next.lastUpdated = new Date().toISOString();
  return next;
}

export function updateFailure(state, scenario, caseId, failureId) {
  const next = structuredClone(state);
  next.failureSelections ??= {};
  next.failureSelections[scenario.id] ??= buildEmptyScenarioState(scenario).failureSelections;
  next.failureSelections[scenario.id][caseId] = failureId;
  next.lastUpdated = new Date().toISOString();
  return next;
}

export function lockScoring(state) {
  return {
    ...state,
    scoringLocked: true,
    completedSteps: Array.from(new Set([...(state.completedSteps || []), 'scenario', 'score'])),
    lastUpdated: new Date().toISOString()
  };
}

export function selectChange(state, changeId) {
  return {
    ...state,
    selectedChangeId: changeId,
    completedSteps: Array.from(new Set([...(state.completedSteps || []), 'change'])),
    lastUpdated: new Date().toISOString()
  };
}

export function toggleExploreSelection(state, optionId) {
  const set = new Set(state.exploreSelections || []);
  if (set.has(optionId)) set.delete(optionId); else set.add(optionId);
  return {
    ...state,
    exploreSelections: Array.from(set),
    lastUpdated: new Date().toISOString()
  };
}

export function getStepState(state, scenario) {
  const scores = getScenarioScores(state, scenario);
  const failures = getScenarioFailures(state, scenario);
  const totalCells = scenario.testCases.length * scenario.rubric.length;
  const scoredCells = Object.values(scores).flatMap((criteria) => Object.values(criteria)).filter((value) => value !== null).length;
  const scoringComplete = totalCells > 0 && scoredCells === totalCells;
  const scoringLocked = Boolean(state.scoringLocked);
  const failureCount = Object.values(failures).filter(Boolean).length;
  const diagnosisComplete = failureCount === scenario.testCases.length;
  const changeSelected = Boolean(state.selectedChangeId);

  const steps = CORE_STEPS.map((step) => ({ ...step, status: 'todo' }));
  steps[0].status = state.started ? 'done' : 'active';
  steps[1].status = !state.started ? 'todo' : (scoringLocked ? 'done' : 'active');
  steps[2].status = !scoringLocked ? 'todo' : (diagnosisComplete ? 'done' : 'active');
  steps[3].status = !diagnosisComplete ? 'todo' : (changeSelected ? 'done' : 'active');
  steps[4].status = !changeSelected ? 'todo' : 'active';
  steps[5].status = !changeSelected ? 'todo' : 'active';

  const coreProgress = [state.started, scoringLocked, diagnosisComplete, changeSelected, changeSelected, changeSelected].filter(Boolean).length / CORE_STEPS.length;

  return {
    totalCells,
    scoredCells,
    scoringComplete,
    scoringLocked,
    diagnosisComplete,
    changeSelected,
    steps,
    coreProgress
  };
}

export function getSelectedChange(scenario, state) {
  return scenario.changeOptions.find((change) => change.id === state.selectedChangeId) || null;
}
