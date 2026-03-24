import { initShellMeta } from './platform/shell.js';
import { createStore } from './state/store.js';
import {
  createInitialState,
  ensureScenarioState,
  getScenario,
  getScenarioFailures,
  getScenarioScores,
  getStepState,
  lockScoring,
  selectChange,
  setScenario,
  startScenario,
  toggleExploreSelection,
  updateFailure,
  updateScore
} from './domain/scenario-engine.js';
import { buildCoachMessage, computeMetrics } from './metrics/metrics.js';
import {
  renderCases,
  renderChangeOptions,
  renderComparison,
  renderDecision,
  renderBestPracticeReview,
  renderDiagnosis,
  renderExploreMore,
  renderHeatmap,
  renderHeatmapLegend,
  renderHeroTags,
  renderMetricGrid,
  renderScenarioCards,
  renderScenarioSummary,
  renderStepTracker,
  renderTakeawaySummary,
  renderWalkthrough
} from './ui/render.js';

import { appData } from '../data/scenarios.js';

const WALKTHROUGH_KEY = 'rr_lab_walkthrough_hidden';

const refs = {
  heroTags: document.getElementById('hero-tags'),
  walkthroughPanel: document.getElementById('walkthrough-panel'),
  scenarioGrid: document.getElementById('scenario-grid'),
  scenarioSummary: document.getElementById('scenario-summary'),
  stepTracker: document.getElementById('step-tracker'),
  metricGrid: document.getElementById('metric-grid'),
  caseGrid: document.getElementById('case-grid'),
  reviewArea: document.getElementById('review-area'),
  heatmap: document.getElementById('heatmap'),
  heatmapLegend: document.getElementById('heatmap-legend'),
  diagnosisGrid: document.getElementById('diagnosis-grid'),
  changeGrid: document.getElementById('change-grid'),
  comparisonArea: document.getElementById('comparison-area'),
  decisionArea: document.getElementById('decision-area'),
  takeawayArea: document.getElementById('takeaway-area'),
  exploreArea: document.getElementById('explore-area'),
  coachBox: document.getElementById('coach-box'),
  startSessionButton: document.getElementById('start-session-button'),
  completeScoringButton: document.getElementById('complete-scoring-button'),
  restartButton: document.getElementById('restart-button'),
  coreProgressFill: document.getElementById('core-progress-fill'),
  scoringPanel: document.getElementById('scoring-panel'),
  reviewPanel: document.getElementById('review-panel'),
  scenarioPanel: document.getElementById('scenario-panel'),
  scenarioSummaryPanel: document.getElementById('scenario-summary-panel'),
  heatmapPanel: document.getElementById('heatmap-panel'),
  diagnosisPanel: document.getElementById('diagnosis-panel'),
  changePanel: document.getElementById('change-panel'),
  comparisonPanel: document.getElementById('comparison-panel'),
  decisionPanel: document.getElementById('decision-panel'),
  takeawayPanel: document.getElementById('takeaway-panel'),
  explorePanel: document.getElementById('explore-panel'),
  currentTaskSubtitle: document.getElementById('current-task-subtitle'),
  currentTaskMessage: document.getElementById('current-task-message'),
  currentTaskChecklist: document.getElementById('current-task-checklist'),
  currentTaskButton: document.getElementById('current-task-button'),
  appStatus: document.getElementById('app-status'),
  summaryStatus: document.getElementById('summary-status'),
  scoringStatus: document.getElementById('scoring-status'),
  diagnosisStatus: document.getElementById('diagnosis-status'),
  changeStatus: document.getElementById('change-status')
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function readWalkthroughHidden() {
  try { return window.localStorage.getItem(WALKTHROUGH_KEY) === 'true'; } catch { return false; }
}
function writeWalkthroughHidden(value) {
  try { window.localStorage.setItem(WALKTHROUGH_KEY, String(value)); } catch {}
}

function announce(message, tone = '') {
  if (!refs.appStatus) return;
  refs.appStatus.textContent = message;
  refs.appStatus.className = `status-banner ${tone}`.trim();
}

function pulseButton(button) {
  if (!button) return;
  button.classList.remove('is-pressed');
  void button.offsetWidth;
  button.classList.add('is-pressed');
  window.setTimeout(() => button.classList.remove('is-pressed'), 240);
}

function scrollToPanel(panelId, focusTarget) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const target = focusTarget || panel.querySelector('button:not([disabled]), [href], input, textarea, select');
  if (target) window.setTimeout(() => target.focus({ preventScroll: true }), 220);
}

function setPanelVisibility(stepState, state) {
  refs.scoringPanel.style.display = state.started ? 'block' : 'none';
  refs.reviewPanel.style.display = state.scoringLocked ? 'block' : 'none';
  refs.heatmapPanel.style.display = state.scoringLocked ? 'block' : 'none';
  refs.diagnosisPanel.style.display = state.scoringLocked ? 'block' : 'none';
  refs.changePanel.style.display = stepState.diagnosisComplete ? 'block' : 'none';
  refs.comparisonPanel.style.display = stepState.changeSelected ? 'block' : 'none';
  refs.decisionPanel.style.display = stepState.changeSelected ? 'block' : 'none';
  refs.takeawayPanel.style.display = stepState.changeSelected ? 'block' : 'none';
  refs.explorePanel.style.display = stepState.changeSelected ? 'block' : 'none';
}

function setCurrentPanel(stepState, state) {
  [refs.scenarioPanel, refs.scenarioSummaryPanel, refs.scoringPanel, refs.reviewPanel, refs.heatmapPanel, refs.diagnosisPanel, refs.changePanel, refs.comparisonPanel, refs.decisionPanel, refs.takeawayPanel, refs.explorePanel]
    .forEach((panel) => panel?.classList.remove('current-panel'));
  let activePanel = refs.scenarioPanel;
  const completed = new Set(state.completedSteps || []);
  if (completed.has('scenario') && !state.started) activePanel = refs.scenarioSummaryPanel;
  if (state.started && !stepState.scoringLocked) activePanel = refs.scoringPanel;
  if (stepState.scoringLocked && !stepState.diagnosisComplete) activePanel = refs.reviewPanel;
  if (stepState.diagnosisComplete && !stepState.changeSelected) activePanel = refs.changePanel;
  if (stepState.changeSelected) activePanel = refs.comparisonPanel;
  activePanel?.classList.add('current-panel');
}

function focusFirstIncompleteScore(state, scenario) {
  const scores = getScenarioScores(state, scenario);
  for (const testCase of scenario.testCases) {
    for (const criterion of scenario.rubric) {
      if (scores[testCase.id][criterion.id] === null) {
        const target = refs.caseGrid.querySelector(`.score-button[data-case-id="${testCase.id}"][data-criterion-id="${criterion.id}"][data-score="1"]`) || refs.caseGrid.querySelector(`.score-button[data-case-id="${testCase.id}"][data-criterion-id="${criterion.id}"]`);
        scrollToPanel('scoring-panel', target);
        return true;
      }
    }
  }
  scrollToPanel('scoring-panel');
  return false;
}

function focusNextOpenDiagnosis(state, scenario) {
  const failures = getScenarioFailures(state, scenario);
  for (const testCase of scenario.testCases) {
    if (!failures[testCase.id]) {
      const target = refs.diagnosisGrid.querySelector(`.failure-chip[data-case-id="${testCase.id}"]`);
      scrollToPanel('diagnosis-panel', target);
      return true;
    }
  }
  scrollToPanel('diagnosis-panel');
  return false;
}

function focusChangeChoice() {
  const target = refs.changeGrid.querySelector('.change-select:not([disabled])');
  scrollToPanel('change-panel', target);
}

function buildCurrentTask(state, scenario, stepState) {
  const failures = getScenarioFailures(state, scenario);
  const failureCount = Object.values(failures).filter(Boolean).length;
  const completed = new Set(state.completedSteps || []);
  const checklist = [
    { label: 'Pick one scenario', done: completed.has('scenario') },
    { label: 'Score and submit the baseline outputs', done: stepState.scoringLocked },
    { label: 'Use the best-practice review, then name the main failure and choose one fix', done: stepState.diagnosisComplete && stepState.changeSelected },
    { label: 'Read the comparison, recommendation, and takeaway', done: stepState.changeSelected }
  ];
  if (!completed.has('scenario')) return { subtitle:'Step 1 of 4 — Pick a scenario', message:'Choose any scenario card. The app will then guide you through one short evidence-based learning loop.', buttonLabel:'Go to scenario choices', action:'scenario', checklist };
  if (!state.started) return { subtitle:'Step 1 of 4 — Review what good looks like', message:'Read the brief, the scoring guide, and the representative test cases. Then press Start scoring now at the bottom of that section.', buttonLabel:'Go to the Start scoring button', action:'start', checklist };
  if (!stepState.scoringComplete) return { subtitle:`Step 2 of 4 — Score the baseline outputs (${stepState.scoredCells}/${stepState.totalCells})`, message:'Use 0 for weak, 1 for partial, and 2 for strong. Score what is visible. The case cards tell you what signals to look for.', buttonLabel:'Take me to the next open score', action:'score', checklist };
  if (!stepState.scoringLocked) return { subtitle:'Step 2 of 4 — Submit your scoring', message:'Press Finish scoring and continue. The app will then reveal the best-practice review and explain the biggest scoring gaps in plain language.', buttonLabel:'Take me to Finish scoring', action:'submit', checklist };
  if (!stepState.diagnosisComplete) return { subtitle:`Step 3 of 4 — Learn from the best-practice review (${failureCount}/${scenario.testCases.length} cases tagged)`, message:'Start with the biggest scoring gaps. Then pick the single main failure per case so your next fix stays disciplined.', buttonLabel:'Go to best-practice review', action:'review', checklist };
  if (!stepState.changeSelected) return { subtitle:'Step 3 of 4 — Choose one targeted fix', message:'Choose the one fix that best matches the pattern you found. One change keeps the lesson clear and easier to trust.', buttonLabel:'Go to change choices', action:'change', checklist };
  return { subtitle:'Step 4 of 4 — Review the result and takeaway', message:'Use the comparison, recommendation, and takeaway summary to decide what Chapter 2 says the next responsible move should be.', buttonLabel:'Go to results', action:'results', checklist };
}

function renderCurrentTask(state, scenario, stepState) {
  const model = buildCurrentTask(state, scenario, stepState);
  refs.currentTaskSubtitle.textContent = model.subtitle;
  refs.currentTaskMessage.textContent = model.message;
  refs.currentTaskButton.textContent = model.buttonLabel;
  refs.currentTaskButton.dataset.action = model.action;
  refs.currentTaskChecklist.innerHTML = model.checklist.map((item, index) => `\n    <div class="task-item ${item.done ? 'done' : ''}">\n      <div class="task-badge">${item.done ? '✓' : index + 1}</div>\n      <div>${escapeHtml(item.label)}</div>\n    </div>\n  `).join('');
}

function updateMiniStatuses(state, scenario, stepState) {
  const failures = getScenarioFailures(state, scenario);
  const failureCount = Object.values(failures).filter(Boolean).length;
  const selectedChange = scenario.changeOptions.find((change) => change.id === state.selectedChangeId);
  refs.summaryStatus.textContent = state.started
    ? `Scoring has started for ${scenario.title}. Use the scoring panel below and lean on the case coaching hints.`
    : `Selected scenario: ${scenario.title}. Read this section first. The Start scoring button is waiting at the bottom of this section.`;
  refs.scoringStatus.textContent = !stepState.scoringComplete
    ? `${stepState.scoredCells} of ${stepState.totalCells} scores complete. The case cards show what to look for.`
    : stepState.scoringLocked
      ? `Baseline scoring submitted. Use the best-practice review below to calibrate before tagging failures.`
      : `All ${stepState.totalCells} scores are complete. Press Finish scoring and continue to see the best-practice review.`;
  refs.diagnosisStatus.textContent = !stepState.scoringLocked ? 'Submit scoring to unlock failure tagging.' : `${failureCount} of ${scenario.testCases.length} cases tagged.`;
  refs.changeStatus.textContent = !stepState.diagnosisComplete ? 'Tag the main failure in every case first.' : selectedChange ? `Selected fix: ${selectedChange.label}. Scroll down to review the comparison and takeaway.` : 'Choose one change that best matches the dominant failure pattern.';
}

function boot(appData) {
  initShellMeta({ version: appData.app.version });
  let walkthroughHidden = readWalkthroughHidden();
  let state = ensureScenarioState(appData, createInitialState(appData));
  const store = createStore(state, appData.app.stateKey);

  function setWalkthroughHidden(value) { walkthroughHidden = value; writeWalkthroughHidden(value); rerender(store.getState()); }
  function resetForCurrentScenario() {
    const scenario = getScenario(appData, store.getState());
    const refreshed = setScenario(createInitialState(appData), appData, scenario.id);
    store.reset(refreshed);
    announce(`Run restarted for ${scenario.title}.`, 'warn');
    scrollToPanel('scenario-panel');
  }
  function runCurrentAction() {
    const currentState = ensureScenarioState(appData, store.getState());
    const scenario = getScenario(appData, currentState);
    const stepState = getStepState(currentState, scenario);
    const action = refs.currentTaskButton.dataset.action;
    if (action === 'scenario') return scrollToPanel('scenario-panel');
    if (action === 'start') return scrollToPanel('scenario-summary-panel', refs.startSessionButton);
    if (action === 'score') return focusFirstIncompleteScore(currentState, scenario);
    if (action === 'submit') return scrollToPanel('scoring-panel', refs.completeScoringButton);
    if (action === 'review') return scrollToPanel('review-panel');
    if (action === 'diagnose') return focusNextOpenDiagnosis(currentState, scenario);
    if (action === 'change') return focusChangeChoice();
    if (action === 'results') return scrollToPanel('comparison-panel');
    if (!currentState.started) return scrollToPanel('scenario-summary-panel', refs.startSessionButton);
    if (!stepState.scoringComplete) return focusFirstIncompleteScore(currentState, scenario);
    if (!stepState.scoringLocked) return scrollToPanel('scoring-panel', refs.completeScoringButton);
    if (!stepState.diagnosisComplete) return scrollToPanel('review-panel');
    if (!stepState.changeSelected) return focusChangeChoice();
    return scrollToPanel('comparison-panel');
  }

  function rerender(rawState) {
    state = ensureScenarioState(appData, rawState);
    const scenario = getScenario(appData, state);
    const scores = getScenarioScores(state, scenario);
    const failures = getScenarioFailures(state, scenario);
    const stepState = getStepState(state, scenario);
    const metrics = computeMetrics(appData, state, scenario);
    renderHeroTags(refs.heroTags, scenario);
    renderWalkthrough(refs.walkthroughPanel, scenario, state, stepState, walkthroughHidden, setWalkthroughHidden);
    renderScenarioCards(refs.scenarioGrid, appData, state, (scenarioId, button) => {
      pulseButton(button);
      const nextState = setScenario(store.getState(), appData, scenarioId);
      store.reset(nextState);
      const nextScenario = getScenario(appData, nextState);
      announce(`Scenario selected: ${nextScenario.title}. Read what good looks like, then begin scoring.`, 'good');
      window.setTimeout(() => scrollToPanel('scenario-summary-panel', refs.startSessionButton), 40);
    });
    renderScenarioSummary(refs.scenarioSummary, scenario);
    renderStepTracker(refs.stepTracker, stepState);
    renderMetricGrid(refs.metricGrid, metrics);
    renderCases(refs.caseGrid, scenario, scores, state.scoringLocked, (caseId, criterionId, value, button) => {
      pulseButton(button);
      store.reset(updateScore(store.getState(), scenario, caseId, criterionId, value));
      const nextScores = getScenarioScores(ensureScenarioState(appData, store.getState()), scenario);
      const caseComplete = scenario.rubric.every((criterion) => nextScores[caseId][criterion.id] !== null);
      announce(caseComplete ? `${caseId} is fully scored.` : `Recorded score ${value} for ${caseId}.`, 'good');
    });
    renderBestPracticeReview(refs.reviewArea, scenario, metrics);
    renderHeatmap(refs.heatmap, scenario, metrics);
    renderHeatmapLegend(refs.heatmapLegend);
    renderDiagnosis(refs.diagnosisGrid, appData, scenario, failures, !stepState.scoringLocked, (caseId, failureId, button) => {
      pulseButton(button);
      store.reset(updateFailure(store.getState(), scenario, caseId, failureId));
      const label = appData.failureTypes.find((item) => item.id === failureId)?.label || 'Failure tagged';
      announce(`${caseId} tagged as ${label}.`, 'good');
    });
    renderChangeOptions(refs.changeGrid, scenario, state.selectedChangeId, stepState.diagnosisComplete, (changeId, button) => {
      pulseButton(button);
      store.reset(selectChange(store.getState(), changeId));
      const selected = scenario.changeOptions.find((change) => change.id === changeId);
      announce(`Selected fix: ${selected?.label || 'change'}. Review the before/after evidence and takeaway below.`, 'good');
      window.setTimeout(() => scrollToPanel('comparison-panel'), 40);
    });
    renderComparison(refs.comparisonArea, scenario, metrics, state);
    renderDecision(refs.decisionArea, scenario, metrics);
    renderTakeawaySummary(refs.takeawayArea, appData, scenario, metrics, state);
    renderExploreMore(refs.exploreArea, scenario, state, (optionId, button) => {
      pulseButton(button);
      store.reset(toggleExploreSelection(store.getState(), optionId));
      const selected = (store.getState().exploreSelections || []).includes(optionId);
      const optionLabel = scenario.exploreMore?.options?.find((option) => option.id === optionId)?.label || 'Optional learning check';
      announce(selected ? `${optionLabel} is now open.` : `${optionLabel} is now closed.`);
    }, metrics, appData);
    refs.coachBox.textContent = buildCoachMessage(appData, scenario, metrics, state);
    const scenarioConfirmed = (state.completedSteps || []).includes('scenario');
    refs.startSessionButton.disabled = !scenarioConfirmed;
    refs.completeScoringButton.disabled = !stepState.scoringComplete || state.scoringLocked;
    refs.coreProgressFill.style.width = `${Math.round(stepState.coreProgress * 100)}%`;
    updateMiniStatuses(state, scenario, stepState);
    renderCurrentTask(state, scenario, stepState);
    setPanelVisibility(stepState, state);
    setCurrentPanel(stepState, state);
  }

  store.subscribe(rerender);
  rerender(ensureScenarioState(appData, store.getState()));
  refs.currentTaskButton.addEventListener('click', () => { pulseButton(refs.currentTaskButton); runCurrentAction(); });
  refs.startSessionButton.addEventListener('click', (event) => {
    pulseButton(event.currentTarget); store.reset(startScenario(store.getState()));
    announce('Scoring started. Work through the open score buttons row by row.', 'good');
    window.setTimeout(() => { const scenario = getScenario(appData, ensureScenarioState(appData, store.getState())); focusFirstIncompleteScore(store.getState(), scenario); }, 40);
  });
  refs.completeScoringButton.addEventListener('click', (event) => {
    pulseButton(event.currentTarget); store.reset(lockScoring(store.getState()));
    announce('Baseline scoring locked. Review the best-practice score explanations first, then tag the main failure for each case.', 'good');
    window.setTimeout(() => scrollToPanel('review-panel'), 40);
  });
  refs.restartButton.addEventListener('click', (event) => { pulseButton(event.currentTarget); resetForCurrentScenario(); });
}

try { boot(appData); }
catch (error) {
  console.error(error);
  const coachBox = document.getElementById('coach-box');
  if (coachBox) coachBox.textContent = 'The app could not load its scenario data. Check the file structure and refresh.';
}
