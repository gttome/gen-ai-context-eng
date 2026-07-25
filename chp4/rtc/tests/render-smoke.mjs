import fs from 'node:fs';
import path from 'node:path';
global.window = { location: { hostname: 'localhost', protocol: 'http:' } };
const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const artifactDir = path.join(rootDir, 'project-documents', 'test-artifacts');
fs.mkdirSync(artifactDir, { recursive: true });
const { renderApp } = await import(path.join(rootDir, 'assets/js/ui/render.js'));
const { scenarioPack } = await import(path.join(rootDir, 'assets/data/scenarios.js'));
const { createInitialState } = await import(path.join(rootDir, 'assets/js/state/store.js'));

function runCase(name, state) {
  const root = { innerHTML: '' };
  renderApp(root, state, scenarioPack, {});
  fs.writeFileSync(path.join(artifactDir, `${name}.html`), root.innerHTML);
  return root.innerHTML;
}

function extractOptionLabels(html) {
  const firstGrid = html.match(/<div class="option-grid[^\"]*">([\s\S]*?)<\/div>/);
  const source = firstGrid ? firstGrid[1] : html;
  return [...source.matchAll(/<button class="option-card[^\"]*"[^>]*><strong>(.*?)<\/strong>/g)].map(match => match[1]);
}

function scenarioHtmlForStep(step, overrides = {}) {
  const base = createInitialState();
  const state = { ...base, ...overrides, activeStep: step };
  return runCase(`step-${step}-${(overrides.scenarioId || base.scenarioId)}`.replace(/[^a-z0-9-]/gi, '_'), state);
}

const initial = runCase('initial', createInitialState());
const evidenceHtml = scenarioHtmlForStep('evidence');
const failureHtml = scenarioHtmlForStep('failure');
const guidedFeedbackHtml = scenarioHtmlForStep('checks', {
  answers: {
    source: 'source_policy',
    symptom: 'symptom_format'
  }
});
const professionalHtml = scenarioHtmlForStep('checks', {
  uiMode: 'professional',
  answers: {
    source: 'source_policy',
    symptom: 'symptom_format'
  }
});
const summary = runCase('summary', {
  ...createInitialState(),
  history: [
    { scenarioId: 'policy-missing-grounding', scenarioTitle: 'Policy Answer with Missing Grounding', compositeScore: 88, tier: 'Excellent Diagnostic Discipline', playedAt: 'Test 1' },
    { scenarioId: 'policy-missing-grounding', scenarioTitle: 'Policy Answer with Missing Grounding', compositeScore: 72, tier: 'Strong Diagnostic Discipline', playedAt: 'Test 0' }
  ],
  activeStep: 'summary',
  completedAt: 'Test complete',
  answers: { source: 'source_policy', symptom: 'symptom_unsupported', grounding: 'grounding_missing', instruction: 'instruction_confident', history: 'history_secondary' },
  failureMode: 'hallucination_missing_evidence',
  rootCause: 'root_missing_policy',
  mitigation: 'mitigation_small',
  regressionChoice: 'regression_specific'
});
const sourceLabels = extractOptionLabels(evidenceHtml);
const failureLabels = extractOptionLabels(failureHtml);
const correctSourceLabel = scenarioPack.cases[0].checks.find(item => item.id === 'source').options.find(item => item.isCorrect).label;
const correctFailureLabel = scenarioPack.cases[0].failureModes.find(item => item.isCorrect).label;
const css = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'styles.css'), 'utf8');

const checks = [
  { id: 'R01', description: 'Initial render includes clean start and learning mode toggles', passed: initial.includes('Clean start') && initial.includes('Guided mode') && initial.includes('Professional mode') },
  { id: 'R02', description: 'Initial render includes fixed bottom coach dock', passed: initial.includes('coach-dock') && initial.includes('Live scores') },
  { id: 'R03', description: 'Guided render includes teach-back feedback explaining weaker options', passed: guidedFeedbackHtml.includes('Why the other options were weaker') },
  { id: 'R04', description: 'Professional mode suppresses guided teach-back card', passed: !professionalHtml.includes('Why the other options were weaker') },
  { id: 'R05', description: 'Summary render includes scenario debrief and replay analytics', passed: summary.includes('Scenario debrief') && summary.includes('Replay analytics') },
  { id: 'R06', description: 'Summary render includes export actions', passed: summary.includes('Copy triage record') && summary.includes('Download triage record') },
  { id: 'R07', description: 'Evidence step includes step framing and live impact bridge', passed: evidenceHtml.includes('Evidence to favor') && evidenceHtml.includes('Live impact') },
  { id: 'R08', description: 'Source-of-truth options are mixed so the strongest answer is not first', passed: sourceLabels.length >= 3 && sourceLabels[0] !== correctSourceLabel && sourceLabels.includes(correctSourceLabel) },
  { id: 'R09', description: 'Failure-mode options are mixed so the strongest answer is not first', passed: failureLabels.length >= 3 && failureLabels[0] !== correctFailureLabel && failureLabels.includes(correctFailureLabel) },
  { id: 'R10', description: 'CSS includes teach-back, linked evidence, and small-phone tuning', passed: css.includes('.teachback-card') && css.includes('.evidence-card.is-linked') && css.includes('@media (max-width: 430px)') },
  { id: 'R11', description: 'Coach and impact modals retain close hooks', passed: runCase('modal', { ...createInitialState(), activeModal: 'coach' }).includes('data-modal-close') && runCase('impact-modal', { ...createInitialState(), activeModal: 'impact' }).includes('data-modal-overlay') },
  { id: 'R12', description: 'Touch-first action buttons are present in the workspace', passed: evidenceHtml.includes('touch-btn') && evidenceHtml.includes('Continue') },
  { id: 'R13', description: 'Workspace steps expose transition anchors for auto-scroll and focus placement', passed: evidenceHtml.includes('data-step-anchor="evidence"') && failureHtml.includes('data-step-anchor="failure"') }
];

fs.writeFileSync(path.join(artifactDir, 'render-smoke-results.json'), JSON.stringify(checks, null, 2));
const failed = checks.filter(item => !item.passed);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(checks, null, 2));
