const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

function makeClassList(){
  const set = new Set();
  return {
    add: (...names) => names.forEach(n => set.add(n)),
    remove: (...names) => names.forEach(n => set.delete(n)),
    toggle: (name, force) => {
      if(force === true){ set.add(name); return true; }
      if(force === false){ set.delete(name); return false; }
      if(set.has(name)){ set.delete(name); return false; }
      set.add(name); return true;
    },
    contains: name => set.has(name),
    toString: () => [...set].join(' ')
  };
}
function makeElement(id=''){
  return {
    id,
    innerHTML: '',
    textContent: '',
    className: '',
    dataset: {},
    disabled: false,
    style: { setProperty(name, value){ this[name] = value; } },
    classList: makeClassList(),
    children: [],
    attributes: {},
    listeners: {},
    appendChild(child){ this.children.push(child); return child; },
    addEventListener(type, fn){ this.listeners[type] = fn; },
    setAttribute(name, value){ this.attributes[name] = value; },
    querySelector(){ return null; },
    closest(){ return null; },
    scrollIntoView(){ this.scrolled = (this.scrolled || 0) + 1; }
  };
}
const elements = Object.fromEntries(ids.map(id => [id, makeElement(id)]));
const body = makeElement('body');
const document = {
  body,
  getElementById(id){ if(!elements[id]) elements[id] = makeElement(id); return elements[id]; },
  createElement(tag){ return makeElement(tag); },
  querySelector(sel){ if(sel === '.impact-ribbon') return elements.impactRibbon; return null; }
};
const localStore = new Map();
const localStorage = {
  getItem:key => localStore.has(key) ? localStore.get(key) : null,
  setItem:(key,val) => localStore.set(key, String(val)),
  removeItem:key => localStore.delete(key)
};
const context = {
  console,
  document,
  localStorage,
  location: { search:'', protocol:'http:', hostname:'localhost' },
  alert: msg => { context.__alerts.push(msg); },
  URLSearchParams,
  Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp,
  setTimeout, clearTimeout,
  __alerts: []
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(appJs + `\n;globalThis.__exports = { APP, state, selectedScenario, ensureRecord, ensureDriftState, bestHypothesisIndex, bestInterventionIndex, applyRepairToRecord, render, benchmarkForScenario, runDriftResponse, resolveDriftBranch, handlePhasePrimaryAction };`, context);

const { APP, state, selectedScenario, ensureRecord, ensureDriftState, bestHypothesisIndex, bestInterventionIndex, applyRepairToRecord, render, benchmarkForScenario, runDriftResponse, resolveDriftBranch, handlePhasePrimaryAction } = context.__exports;

state.selectedScenarioId = APP.scenarios[0].id;
state.activeStage = 'setup';
state.activePhaseIndex = 0;
state.phases = {};
state.completed = false;
render();
const setupSnapshot = {
  stageTitle: elements.stageTitle.textContent,
  welcomeVisible: !elements.welcomePanel.classList.contains('hidden'),
  workspaceHidden: elements.workspace.classList.contains('hidden'),
  rightRailHidden: elements.rightRail.classList.contains('hidden')
};

state.activeStage = 'clinic';
render();
const clinicSnapshot = {
  stageTitle: elements.stageTitle.textContent,
  workspaceVisible: !elements.workspace.classList.contains('hidden'),
  rightRailVisible: !elements.rightRail.classList.contains('hidden'),
  leftRailVisible: !elements.leftRail.classList.contains('hidden'),
  phaseTitle: elements.phaseName.textContent,
  nextButtonDisabled: elements.nextPhase.disabled
};

const firstPhase = selectedScenario().phases[0];
const firstRecord = ensureRecord(firstPhase.key);
firstRecord.hypothesisIndex = bestHypothesisIndex(firstPhase);
firstRecord.interventionIndex = bestInterventionIndex(firstPhase);
applyRepairToRecord(selectedScenario(), firstPhase, firstRecord);
render();
const nextButtonEnabledAfterRepair = !elements.nextPhase.disabled;
handlePhasePrimaryAction('next-phase');
render();
const phaseTransition = {
  activePhaseIndex: state.activePhaseIndex,
  phaseName: elements.phaseName.textContent,
  phaseNavigatorScrolled: !!elements.phaseNavigator.scrolled,
  repairLockedBeforeDiagnosis: /choose a root cause first/i.test(elements.repairStepHint.textContent),
  repairGateTextVisible: /unlock repair options/i.test(elements.repairStepHint.textContent),
  nextButtonDisabledBeforeRepair: clinicSnapshot.nextButtonDisabled,
  nextButtonEnabledAfterRepair
};

for(let i=state.activePhaseIndex; i<selectedScenario().phases.length; i++){
  state.activePhaseIndex = i;
  const phase = selectedScenario().phases[i];
  const rec = ensureRecord(phase.key);
  rec.hypothesisIndex = bestHypothesisIndex(phase);
  rec.interventionIndex = bestInterventionIndex(phase);
  applyRepairToRecord(selectedScenario(), phase, rec);
}
render();
const benchmark = benchmarkForScenario(selectedScenario());
const reviewSnapshot = {
  activeStage: state.activeStage,
  stageTitle: elements.stageTitle.textContent,
  summaryVisible: !elements.summaryPanel.classList.contains('hidden'),
  benchmarkVisible: !elements.benchmarkPanel.classList.contains('hidden'),
  driftHidden: elements.driftLab.classList.contains('hidden')
};

state.facilitatorMode = true;
state.activeStage = 'advanced';
render();
const drift = ensureDriftState(selectedScenario().id);
drift.optionIndex = 0;
runDriftResponse();
drift.followupIndex = 0;
resolveDriftBranch();
render();
const advancedSnapshot = {
  stageTitle: elements.stageTitle.textContent,
  driftVisible: !elements.driftLab.classList.contains('hidden'),
  facilitatorVisible: !elements.facilitatorLab.classList.contains('hidden'),
  replayVisible: !elements.replayLab.classList.contains('hidden'),
  driftFinalResolved: drift.finalResolved,
  driftFinalScore: drift.finalScore,
  driftFinalTitle: elements.driftFinalTitle.textContent
};

const results = {
  versionText: elements.versionPill.textContent,
  discussionToggleText: elements.toggleFacilitatorMode.textContent,
  setupSnapshot,
  clinicSnapshot,
  phaseTransition,
  reviewSnapshot,
  advancedSnapshot,
  benchmarkComposite: benchmark.composite,
  facilitatorKickoff: elements.facilitatorKickoff.textContent,
  alerts: context.__alerts
};
fs.writeFileSync(path.join(root, 'tests', 'smoke', 'lfc-v10-harness-results.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
