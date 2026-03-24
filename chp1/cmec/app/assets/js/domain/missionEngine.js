import { calculateScenarioMetrics } from '../metrics/metricEngine.js';
import { calculateProgress } from '../metrics/progressEngine.js';
import { deriveCoaching, maturityFromReadiness } from '../metrics/readinessRules.js';
import { getPatternAssist } from './patternAssist.js';

function cloneScenario(scenario) {
  return JSON.parse(JSON.stringify(scenario));
}

function applyHarderReplay(scenario) {
  const harder = cloneScenario(scenario);
  harder.budget = Math.max(160, scenario.budget - 25);
  const noiseComponent = harder.components.find((component) => component.type === 'noise');
  if (noiseComponent) {
    noiseComponent.included = true;
    noiseComponent.tokenEstimate += 12;
    noiseComponent.content = `${noiseComponent.content} Additional distracting note: an earlier stale update claimed the issue had already resolved.`;
  }
  return harder;
}

function withDerived(state, appData) {
  if (!state.currentScenario) {
    return {
      ...state,
      derived: {
        metrics: null,
        progress: { corePercent: 0, optionalPercent: 0, completedSteps: [] },
        coaching: { messages: [], compareNotes: [] },
        maturity: 'Drafted',
        patternAssist: []
      }
    };
  }

  const current = calculateScenarioMetrics(state.currentScenario);
  const baseline = calculateScenarioMetrics(state.baselineScenario);
  const metricSet = { current, baseline };
  const derived = {
    metrics: metricSet,
    progress: calculateProgress(state),
    coaching: deriveCoaching(appData, state.currentScenario, metricSet),
    maturity: maturityFromReadiness(current.readiness),
    patternAssist: getPatternAssist(state.currentScenario, state)
  };

  return { ...state, derived };
}

export function createInitialState(appData, theme) {
  return withDerived({
    theme,
    selectedScenarioId: null,
    baselineScenario: null,
    currentScenario: null,
    prediction: '',
    pasteResult: '',
    debrief: '',
    showExploreMore: false,
    showCompareView: true,
    harderMode: false,
    activeExploreDrillId: '',
    sessionTimestamp: null
  }, appData);
}

export function selectScenarioState(appData, scenarioId, options = {}) {
  const source = appData.scenarios.find((scenario) => scenario.id === scenarioId);
  const prepared = options.harder ? applyHarderReplay(source) : cloneScenario(source);
  const baseline = cloneScenario(prepared);
  baseline.components = baseline.components.map((component) => ({
    ...component,
    included: component.includedWeak
  }));
  prepared.components = prepared.components.map((component) => ({
    ...component,
    included: component.includedWeak
  }));

  return withDerived({
    theme: options.theme,
    selectedScenarioId: scenarioId,
    baselineScenario: baseline,
    currentScenario: prepared,
    prediction: '',
    pasteResult: '',
    debrief: '',
    showExploreMore: false,
    showCompareView: true,
    harderMode: Boolean(options.harder),
    activeExploreDrillId: '',
    sessionTimestamp: new Date().toISOString()
  }, appData);
}

export function applyActionToScenario(state, actionId) {
  const scenario = state.currentScenario;
  const repair = scenario.recommendedActions.find((item) => item.id === actionId);
  if (!repair) return state;

  const updatedScenario = {
    ...scenario,
    components: scenario.components.map((component) => (
      repair.changes[component.id] === undefined
        ? component
        : { ...component, included: repair.changes[component.id] }
    ))
  };
  return { ...state, currentScenario: updatedScenario, activeExploreDrillId: '', sessionTimestamp: new Date().toISOString() };
}

export function applyExploreDrill(state, drillId) {
  const scenario = state.currentScenario;
  const drill = scenario?.exploreMore?.drills?.find((item) => item.id === drillId);
  if (!drill) return state;

  const updatedScenario = {
    ...scenario,
    components: scenario.components.map((component) => (
      drill.changes[component.id] === undefined
        ? component
        : { ...component, included: drill.changes[component.id] }
    ))
  };

  return {
    ...state,
    currentScenario: updatedScenario,
    activeExploreDrillId: drillId,
    showExploreMore: true,
    sessionTimestamp: new Date().toISOString()
  };
}

export function applyComponentChange(state, componentId, included) {
  const updatedScenario = {
    ...state.currentScenario,
    components: state.currentScenario.components.map((component) => (
      component.id === componentId ? { ...component, included } : component
    ))
  };
  return { ...state, currentScenario: updatedScenario, activeExploreDrillId: '', sessionTimestamp: new Date().toISOString() };
}

export function revealStrongState(state) {
  const updatedScenario = {
    ...state.currentScenario,
    components: state.currentScenario.components.map((component) => ({
      ...component,
      included: component.recommendedStrong
    }))
  };
  return { ...state, currentScenario: updatedScenario, activeExploreDrillId: '', sessionTimestamp: new Date().toISOString() };
}

export function serializeState(state) {
  if (!state.currentScenario) return null;
  return {
    version: 2,
    theme: state.theme,
    selectedScenarioId: state.selectedScenarioId,
    baselineScenario: state.baselineScenario,
    currentScenario: state.currentScenario,
    prediction: state.prediction,
    pasteResult: state.pasteResult,
    debrief: state.debrief,
    showExploreMore: state.showExploreMore,
    showCompareView: state.showCompareView,
    harderMode: state.harderMode,
    activeExploreDrillId: state.activeExploreDrillId,
    sessionTimestamp: state.sessionTimestamp
  };
}

export function hydrateState(snapshot, appData) {
  if (!snapshot?.currentScenario) return null;
  return withDerived({
    activeExploreDrillId: '',
    ...snapshot
  }, appData);
}
