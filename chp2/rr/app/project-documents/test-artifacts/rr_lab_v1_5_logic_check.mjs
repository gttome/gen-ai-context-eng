
import { appData } from '../../assets/data/scenarios.js';
import { createInitialState, ensureScenarioState, setScenario, startScenario, updateScore, lockScoring, updateFailure, selectChange } from '../../assets/js/domain/scenario-engine.js';
import { computeMetrics, buildCoachMessage } from '../../assets/js/metrics/metrics.js';
import { renderDiagnosis, renderChangeOptions, renderTakeawaySummary, renderExploreMore } from '../../assets/js/ui/render.js';

function makeContainer() {
  return { innerHTML: '', querySelectorAll() { return []; } };
}

function runScenario(id, scoreValue, failures, changeId, exploreIds=[]) {
  let state = ensureScenarioState(appData, createInitialState(appData));
  state = setScenario(state, appData, id);
  const scenario = appData.scenarios.find((s) => s.id === id);
  state = startScenario(state);
  for (const testCase of scenario.testCases) {
    for (const criterion of scenario.rubric) {
      state = updateScore(state, scenario, testCase.id, criterion.id, scoreValue);
    }
  }
  state = lockScoring(state);
  for (const [caseId, failureId] of Object.entries(failures)) {
    state = updateFailure(state, scenario, caseId, failureId);
  }
  state = selectChange(state, changeId);
  state.exploreSelections = exploreIds;
  const metrics = computeMetrics(appData, state, scenario);
  const diagnosis = makeContainer();
  renderDiagnosis(diagnosis, appData, scenario, state.failureSelections[scenario.id], false, () => {});
  const changes = makeContainer();
  renderChangeOptions(changes, scenario, changeId, true, () => {});
  const takeaway = makeContainer();
  renderTakeawaySummary(takeaway, appData, scenario, metrics, state);
  const explore = makeContainer();
  renderExploreMore(explore, scenario, state, () => {}, metrics, appData);
  return {
    title: scenario.title,
    coach: buildCoachMessage(appData, scenario, metrics, state),
    diagnosisHasCoach: diagnosis.innerHTML.includes('Likely upstream phase to revisit'),
    changeHasCoach: changes.innerHTML.includes('Lifecycle link:'),
    takeawayHasTeachingPoint: takeaway.innerHTML.includes('Scenario-specific teaching point'),
    exploreHasScenarioDetail: explore.innerHTML.includes('Use this check') || explore.innerHTML.includes('Why the stricter rule') || explore.innerHTML.includes('Why skipping evaluation'),
    deployReadiness: metrics.deployReadiness
  };
}

const results = {
  scenarioCount: appData.scenarios.length,
  rollout: runScenario('change-rollout-notice', 1, { 'RN-1':'actionability', 'RN-2':'actionability', 'RN-3':'constraints' }, 'rollout-c1', ['why']),
  handoff: runScenario('cross-team-handoff-summary', 1, { 'HT-1':'actionability', 'HT-2':'omission', 'HT-3':'actionability' }, 'handoff-c1', ['strict']),
  policy: runScenario('policy-answer-reliability', 1, { 'PA-1':'grounding', 'PA-2':'constraints', 'PA-3':'omission' }, 'policy-c1', ['skip'])
};
console.log(JSON.stringify(results, null, 2));
