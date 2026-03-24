import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

const loadModule = async (relativePath) => {
  const fileUrl = pathToFileURL(path.join(root, relativePath)).href;
  return import(fileUrl);
};

const { appData } = await loadModule('assets/data/app-data.js');
const missionEngine = await loadModule('assets/js/domain/missionEngine.js');
const { renderShell } = await loadModule('assets/js/ui/renderShell.js');
const { renderLauncher } = await loadModule('assets/js/ui/renderLauncher.js');
const { renderMission } = await loadModule('assets/js/ui/renderMission.js');

const results = [];

function check(name, passed, details) {
  results.push({ name, status: passed ? 'PASS' : 'FAIL', details });
}

check('Scenario count', appData.scenarios.length === 3, `Found ${appData.scenarios.length} scenarios.`);
check('Metrics count', appData.metrics.length >= 6, `Found ${appData.metrics.length} metric definitions.`);

const launcherHtml = renderLauncher({ currentScenario: null }, appData, null);
check(
  'Launcher explains inspect-predict-repair flow',
  launcherHtml.includes('Inspect the weak package') && launcherHtml.includes('Predict the likely failure') && launcherHtml.includes('Repair and compare'),
  'Launcher contains explicit three-step learner coaching.'
);

check(
  'Launcher includes contrast-safe hero pills',
  launcherHtml.includes('hero-status-pill'),
  'Launcher uses dedicated hero pill classes for contrast-sensitive styling.'
);

for (const scenario of appData.scenarios) {
  const baselineState = missionEngine.selectScenarioState(appData, scenario.id, { theme: 'dark' });
  const baselineMetrics = baselineState.derived.metrics.current;
  let improvedState = baselineState;
  for (const repair of baselineState.currentScenario.recommendedActions) {
    improvedState = missionEngine.applyActionToScenario(improvedState, repair.id);
  }
  improvedState = missionEngine.hydrateState(missionEngine.serializeState(improvedState), appData);
  const improved = improvedState.derived.metrics.current;

  check(
    `Readiness improves for ${scenario.id}`,
    improved.readiness > baselineMetrics.readiness,
    `Weak ${Math.round(baselineMetrics.readiness)} -> Repaired ${Math.round(improved.readiness)}.`
  );

  check(
    `Overload drops or stays controlled for ${scenario.id}`,
    improved.overload <= baselineMetrics.overload,
    `Weak ${Math.round(baselineMetrics.overload)} -> Repaired ${Math.round(improved.overload)}.`
  );

  const shell = renderShell(improvedState, appData, { version: 'v1.1.8', environment: 'Local' }, null);
  check(
    `Rendered shell contains Help and Feedback for ${scenario.id}`,
    shell.includes('help.html') && shell.includes('feedback.html') && shell.includes('Version') && shell.includes('Environment'),
    'Shell contains shared app-shell links and pills.'
  );

  const missionHtml = renderMission(baselineState);
  check(
    `Mission view exposes weak package before prediction for ${scenario.id}`,
    missionHtml.includes('Inspect the weak package first') && missionHtml.includes('What the model sees in the weak package') && missionHtml.includes('Predict the weak-state failure'),
    'Mission renderer exposes weak package snapshot and coaching before prediction.'
  );

  check(
    `Mission view adds card-level coaching for ${scenario.id}`,
    missionHtml.includes('Why it matters') && missionHtml.includes('Risk to watch') && missionHtml.includes('Metric movement'),
    'Mission renderer adds coach strips to weak-package and repair cards.'
  );

  check(
    `Mission view strengthens debrief coaching for ${scenario.id}`,
    renderMission(improvedState).includes('Helpful sentence starters') && renderMission(improvedState).includes('Chapter 1 lens'),
    'Mission debrief adds guided starters and chapter-aligned framing.'
  );

  const exploreOpenState = missionEngine.hydrateState(missionEngine.serializeState({ ...baselineState, showExploreMore: true }), appData);
  const exploreHtml = renderMission(exploreOpenState);
  check(
    `Mission view deepens Explore More for ${scenario.id}`,
    exploreHtml.includes('Micro-drill') && exploreHtml.includes('Load drill'),
    'Mission renderer includes optional experiment drills.'
  );

  check(
    `Mission view makes Explore More CTA visible for ${scenario.id}`,
    missionHtml.includes('Open Explore More drills') && missionHtml.includes('Good next step after the core loop'),
    'Collapsed Explore More state includes a stronger call-to-action and preview guidance.'
  );

  check(
    `Mission view uses a fixed live metrics dock for ${scenario.id}`,
    missionHtml.includes('mission-metrics-dock') && missionHtml.includes('Always-visible mission metrics') && missionHtml.includes('Each meaningful change should move a metric you can explain.'),
    'Mission renderer includes the compressed fixed bottom metrics dock instead of a scroll-bound metrics panel.'
  );

  check(
    `Mission view exposes copy feedback for ${scenario.id}`,
    missionHtml.includes('copy-feedback') && missionHtml.includes('Reveal and load best-practice package'),
    'Compare workspace includes inline action feedback and the stronger reveal label.'
  );

  check(
    `Compare workspace explains causality for ${scenario.id}`,
    missionHtml.includes('renderCompare') || renderMission(improvedState).includes('Why the metrics moved'),
    'Compare workspace explains what changed and why the metrics moved.'
  );
}

const requiredFiles = [
  'index.html',
  'help.html',
  'feedback.html',
  'README.md',
  'start-server.bat',
  'project-documents/handoff.md',
  'project-documents/handoff-startup-prompt.md',
  'project-documents/testing.md',
  'project-documents/architecture-and-file-map.md',
  'project-documents/setup-run-deploy.md',
  'project-documents/qa-checklist.md',
  'project-documents/known-issues-and-next-steps.md',
  'project-documents/refactoring-handoff-current-iteration.md',
  'project-documents/mobai-agent-report.md',
  'project-documents/reference-reuse-notes.md'
];

for (const relativePath of requiredFiles) {
  check(`Required file exists: ${relativePath}`, fs.existsSync(path.join(root, relativePath)), relativePath);
}

const requiredSourceDocs = [
  'project-documents/cemc_product_definition_and_vision.md',
  'project-documents/cemc_prd.md',
  'project-documents/cemc_chapter_coverage_and_learning_map.md',
  'project-documents/cemc_core_scenario_and_content_pack.md',
  'project-documents/cemc_interaction_and_screen_specification.md',
  'project-documents/cemc_live_metrics_scoring_and_professional_gamification_specification.md',
  'project-documents/cemc_visual_design_and_component_guide.md',
  'project-documents/cemc_development_backlog.md',
  'project-documents/cemc_build_qa_and_acceptance_checklist.md',
  'project-documents/cemc_technical_architecture_and_front_end_implementation_blueprint.md'
];

for (const relativePath of requiredSourceDocs) {
  check(`Required source update exists: ${relativePath}`, fs.existsSync(path.join(root, relativePath)), relativePath);
}

const launcherScript = fs.readFileSync(path.join(root, 'start-server.bat'), 'utf8');
check('Launcher uses local folder', launcherScript.includes('cd /d "%~dp0"'), 'start-server.bat includes relative-folder safety.');
check('Launcher opens localhost:8000', launcherScript.includes('http://localhost:8000/'), 'start-server.bat opens the local URL.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check('Main HTML loads module app.js', html.includes('assets/js/app.js'), 'index.html references the module entrypoint.');
check('Main HTML contains live region', html.includes('live-region'), 'index.html contains ARIA live region.');

console.log(JSON.stringify(results, null, 2));
