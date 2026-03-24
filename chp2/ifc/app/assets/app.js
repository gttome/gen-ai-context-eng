const APP = {
  version: 'v26',
  storageKey: 'lfc_state_v26',
  scenarios: [
    {
      id: 'hr-policy',
      title: 'HR Policy Q&A Incident',
      subtitle: 'Confident answers, inconsistent policy grounding',
      trigger: 'A VP forwards two contradictory assistant answers to the same overtime question.',
      goal: 'Stabilize an HR policy assistant so it answers within scope, cites approved sources, escalates edge cases, and survives policy changes.',
      stakes: 'Employees are receiving answers that sound correct but occasionally invent exceptions.',
      baseline: { quality: 38, risk: 68, readiness: 22, mastery: 4 },
      badge: 'Escalation Ready',
      drill: 'A remote-work policy update changes approval rules, but the assistant still cites the old version.',
      badOutput: 'You can always bank overtime into future PTO with manager approval.',
      goodOutput: 'Use the current policy excerpt, stay within scope, and escalate exceptions to HR.',
      phases: []
    },
    {
      id: 'ticket-summary',
      title: 'Support Ticket Summarizer Incident',
      subtitle: 'Fast summaries, missing urgency and action items',
      trigger: 'A sev-2 customer ticket is closed with the wrong handoff because the summary missed the escalation flag.',
      goal: 'Repair a support ticket summarizer so it preserves urgency, requested action, ownership, and escalation context.',
      stakes: 'Support managers like the speed, but summaries drop escalation status and bury the next action.',
      baseline: { quality: 41, risk: 63, readiness: 28, mastery: 6 },
      badge: 'Signal Preserver',
      drill: 'A new ticketing template adds a mandatory compliance field, but the summarizer ignores it.',
      badOutput: 'Customer reported multiple issues over several messages. Team is investigating.',
      goodOutput: 'Issue, urgency, requested action, owner, and escalation status are preserved in a compact handoff.',
      phases: []
    },
    {
      id: 'onboarding',
      title: 'Onboarding Assistant Incident',
      subtitle: 'Friendly guidance, unreliable handoff and policy coverage',
      trigger: 'A new hire follows the assistant’s laptop setup answer and misses a required security approval.',
      goal: 'Strengthen an onboarding assistant so it gives role-appropriate steps, uses approved references, and stays current.',
      stakes: 'New hires get helpful answers, but the assistant mixes office-specific steps and misses approvals.',
      baseline: { quality: 40, risk: 66, readiness: 24, mastery: 5 },
      badge: 'Handoff Safe',
      drill: 'A new office opens with a different equipment approval flow, but the assistant still uses the headquarters steps.',
      badOutput: 'Just pick up your laptop from IT and complete the general orientation checklist.',
      goodOutput: 'Use the approved location-specific checklist, sequence the steps correctly, and escalate exceptions.',
      phases: []
    }
  ]
};

const phaseTemplates = [
  {
    key:'discovery', name:'Discovery', artifact:'Discovery brief',
    purpose:'Define the business problem, users, constraints, success criteria, and escalation boundaries before prompt design.',
    symptom:'The current team brief is broad, mixes multiple jobs to be done, and never states how the assistant should escalate uncertain cases.',
    evidence:['Stakeholders want the assistant to be “helpful for everything.”','The primary audience is not written down clearly.','The team cannot explain what would count as a failed answer before testing.'],
    hypotheses:[
      ['The team skipped explicit scope, user type, and success criteria.', true, 'Discovery is weak when the problem statement is broad and nobody can define success or escalation.'],
      ['The main issue is subtle visual design.', false, 'Visual polish matters, but it is not the root cause of lifecycle failure.'],
      ['The team only needs more examples and can define scope later.', false, 'Examples cannot compensate for a missing problem definition.']
    ],
    interventions:[
      ['Rewrite the brief around audience, in-scope requests, out-of-scope requests, success criteria, and escalation triggers.', {quality:12,risk:-10,readiness:14,mastery:8}, 'The team now has a concrete discovery artifact. Later phases can be evaluated against explicit expectations.'],
      ['Keep the broad brief but add a note telling the model to be careful.', {quality:3,risk:-1,readiness:4,mastery:2}, 'Caution language helps slightly, but the task is still too broad.'],
      ['Merge every stakeholder wish into one ambitious objective.', {quality:-6,risk:8,readiness:-5,mastery:0}, 'The brief becomes even noisier and downstream phases inherit the confusion.']
    ]
  },
  {
    key:'selection', name:'Selection', artifact:'Context pack',
    purpose:'Choose the highest-signal context under a token budget and exclude distracting or stale material.',
    symptom:'The current context pack mixes high-value reference material with lower-trust notes, producing both omission and noise risk.',
    evidence:['Approved sources and unofficial notes appear in the same bundle.','The pack is crowded enough that core instructions get squeezed.','Reviewers cannot tell which source is authoritative when conflicts appear.'],
    hypotheses:[
      ['The pack has weak source discipline and no protected always-fit core.', true, 'Selection breaks when authoritative material competes with noise.'],
      ['The problem is mostly caused by card font size.', false, 'Readability matters, but it does not explain omission risk and source conflict.'],
      ['The safest move is to include every possibly relevant source.', false, 'Overloading context increases noise burden.']
    ],
    interventions:[
      ['Trim to approved high-signal sources, protect always-fit instructions, and label authority clearly.', {quality:11,risk:-9,readiness:10,mastery:7}, 'The pack becomes leaner and more trustworthy.'],
      ['Keep everything but move the best sources to the top.', {quality:2,risk:1,readiness:3,mastery:2}, 'Ordering helps a little, but stale and unofficial material still competes for attention.'],
      ['Add even more background so the model has full context.', {quality:-7,risk:9,readiness:-3,mastery:0}, 'The pack becomes bloated and critical instructions lose prominence.']
    ]
  },
  {
    key:'shaping', name:'Shaping', artifact:'Context skeleton',
    purpose:'Organize selected material into a clear context skeleton with role, task, constraints, sources, question, and output format.',
    symptom:'The prompt bundle is a loose paragraph dump. Important rules are present, but not in a stable structure the model can follow.',
    evidence:['Role, task, constraints, and sources are blended together.','Output expectations are inconsistent between similar requests.','Source labels are present in some runs but absent in others.'],
    hypotheses:[
      ['The shaped context lacks a repeatable skeleton and explicit rule placement.', true, 'Shaping is weak when instructions are present but not organized into a stable template.'],
      ['The team should skip structure and let the model infer the layout.', false, 'Ambiguity in shaping tends to produce inconsistent outputs.'],
      ['A longer paragraph with more natural prose will fix inconsistency.', false, 'More prose does not guarantee clearer roles, constraints, or output format.']
    ],
    interventions:[
      ['Adopt a stable context skeleton: role, task, constraints, authoritative context, user question, output format.', {quality:10,risk:-6,readiness:9,mastery:7}, 'Structure improves consistency and reduces ambiguity.'],
      ['Leave the prompt mostly as-is but bold a few important lines.', {quality:3,risk:0,readiness:2,mastery:2}, 'Highlighting helps humans scan, but the instruction structure is still inconsistent.'],
      ['Combine all instructions into one conversational paragraph.', {quality:-5,risk:5,readiness:-4,mastery:0}, 'Important boundaries become easier to blur and output variance increases.']
    ]
  },
  {
    key:'execution', name:'Execution', artifact:'Run log',
    purpose:'Run the system in a controlled way so you can observe real outputs rather than guessing how it behaves.',
    symptom:'The team has anecdotes about behavior but no clean run log that shows what the system actually did across representative cases.',
    evidence:['People remember dramatic failures, but routine outputs were never captured systematically.','No one can compare the current run against the previous one using the same input set.','The team debates behavior from memory instead of evidence.'],
    hypotheses:[
      ['Execution is weak because output capture is informal and uncontrolled.', true, 'Without a controlled run log, evaluation becomes guesswork.'],
      ['The key problem is branding and naming.', false, 'Branding does not replace controlled execution evidence.'],
      ['Execution can be skipped because demos looked fine.', false, 'Demo confidence is not the same as evidence across representative prompts.']
    ],
    interventions:[
      ['Run a fixed representative prompt set, capture outputs side by side, and label version differences.', {quality:9,risk:-5,readiness:8,mastery:6}, 'Execution becomes observable and comparable.'],
      ['Collect only the most dramatic failure screenshots.', {quality:1,risk:2,readiness:2,mastery:1}, 'You gain anecdotes, not a disciplined evidence base.'],
      ['Skip formal execution logging and trust impressions.', {quality:-6,risk:7,readiness:-6,mastery:0}, 'Weak execution evidence makes later decisions less reliable.']
    ]
  },
  {
    key:'evaluation', name:'Evaluation', artifact:'Evaluation suite',
    purpose:'Score outputs against explicit rubrics and test cases so you know what is strong, weak, or unsafe.',
    symptom:'Review comments describe outputs as “pretty good” or “not ideal,” but no common rubric catches the real failure modes.',
    evidence:['Reviewers disagree on whether the same output is acceptable.','Edge cases are discussed verbally but not embedded in the test set.','The strongest failure modes do not have explicit scoring criteria.'],
    hypotheses:[
      ['Evaluation is weak because scoring is subjective and edge cases are not formalized.', true, 'Evaluation must turn opinions into repeatable rubric-driven decisions.'],
      ['The fastest fix is to stop scoring and trust the most confident reviewer.', false, 'Confidence without a rubric cannot support disciplined iteration.'],
      ['If outputs look polished, a rubric is unnecessary.', false, 'Surface polish can hide grounding, omission, or escalation failures.']
    ],
    interventions:[
      ['Define a simple rubric, include edge cases, and score against the same evidence set every run.', {quality:12,risk:-11,readiness:11,mastery:9}, 'Evaluation becomes repeatable and explainable.'],
      ['Add one general quality score without defining criteria.', {quality:3,risk:1,readiness:3,mastery:2}, 'A single vague score still leaves disagreement about what mattered.'],
      ['Skip detailed scoring and move straight to release.', {quality:-8,risk:10,readiness:-7,mastery:0}, 'Without formal evaluation, known weaknesses enter production unchanged.']
    ]
  },
  {
    key:'iteration', name:'Iteration', artifact:'Iteration plan',
    purpose:'Use evaluation evidence to target one or two changes, rerun, and compare improvement without introducing regressions.',
    symptom:'The team wants to fix everything at once, which makes it hard to know which change helped and which created new problems.',
    evidence:['Several issues were observed, but they were never prioritized by severity.','Past fixes changed multiple variables at once.','No one can explain which adjustment caused the last improvement.'],
    hypotheses:[
      ['Iteration is weak because changes are not scoped to evidence-backed hypotheses.', true, 'Iteration works best when changes are small, intentional, and paired with comparison evidence.'],
      ['The best strategy is a full rewrite every time something looks off.', false, 'Full rewrites hide causal learning and make regression harder to trace.'],
      ['Iteration can be skipped once one good demo appears.', false, 'A single good run is not the same as stable evidence across the test set.']
    ],
    interventions:[
      ['Target one or two evidence-backed changes, rerun the same tests, and compare deltas before adding more edits.', {quality:10,risk:-7,readiness:9,mastery:8}, 'Iteration becomes disciplined and the team can see whether the repair worked.'],
      ['Make a broad rewrite across every phase.', {quality:1,risk:4,readiness:1,mastery:1}, 'Some issues may improve, but causal learning gets weaker.'],
      ['Stop iterating now to avoid overthinking.', {quality:-7,risk:8,readiness:-5,mastery:0}, 'Unresolved weaknesses remain in place before handoff.']
    ]
  },
  {
    key:'deployment', name:'Deployment', artifact:'Deployment readiness plan',
    purpose:'Operationalize the solution with ownership, monitoring, update awareness, and change handling so it stays healthy over time.',
    symptom:'The team is treating launch as the finish line. There is no clear owner for drift, source updates, or recurring health checks.',
    evidence:['No one owns review when source content changes.','There is no sampling cadence for quality checks after release.','The pilot plan ends at launch rather than monitoring.'],
    hypotheses:[
      ['Deployment readiness is weak because ownership and monitoring are undefined.', true, 'Deployment is not just launch; it includes update awareness and ongoing health checks.'],
      ['Once the current version looks good, future changes will take care of themselves.', false, 'Without ownership and monitoring, drift risks compound quietly.'],
      ['Monitoring can be deferred indefinitely because the site is static.', false, 'Static delivery does not eliminate content or behavior drift.']
    ],
    interventions:[
      ['Create a deployment plan with owner names, update triggers, monitoring cadence, and rollback rules.', {quality:9,risk:-12,readiness:13,mastery:9}, 'The system becomes handoff-ready and drift has a response path.'],
      ['Add a note saying the team should review things occasionally.', {quality:2,risk:-1,readiness:3,mastery:2}, 'The idea is right, but the plan is too vague to operationalize.'],
      ['Treat deployment as complete once the launch announcement is sent.', {quality:-9,risk:11,readiness:-8,mastery:0}, 'The system ships without ownership discipline, leaving drift hidden.']
    ]
  }
];

APP.scenarios.forEach(s => s.phases = phaseTemplates.map(p => ({...p, hypotheses: p.hypotheses.map((h,i)=>({title:h[0], correct:h[1], rationale:h[2], id:`${p.key}-h${i}`})), interventions: p.interventions.map((x,i)=>({title:x[0], impact:x[1], result:x[2], id:`${p.key}-i${i}`, summary:`Apply this move to the ${p.artifact.toLowerCase()} for ${s.title.toLowerCase()}.`})), phaseLesson: `${p.name} matters because it creates a concrete artifact the next phase can trust.`, artifactHint: `${p.artifact} • chapter deliverable`, skipDanger:`If ${p.name} stays weak, later lifecycle phases inherit hidden reliability debt.` })));
const DRIFT_CONFIG = {
  'hr-policy': {
    drillPrompt: 'A remote-work policy update changes approval rules, but the assistant still cites the old version. What is the safest enterprise response?',
    drillOptions: [
      { title:'Refresh the approved policy excerpt, rerun the evaluation set, and alert the HR owner.', summary:'Treat drift as a governed content change with evidence-backed verification.', baseScore:66, lesson:'This is the strongest response because deployment includes update triggers, ownership, and monitored revalidation.', feedback:'You contained the drift by updating the authoritative source, verifying behavior, and routing accountability to the owner.' },
      { title:'Add a quick warning banner and ask managers to correct mistakes manually.', summary:'Reduce harm temporarily, but leave the root source pack stale.', baseScore:42, lesson:'This is a partial response. It acknowledges risk, but it does not fully repair the system or verify the change path.', feedback:'You reduced immediate harm, but the assistant still carries stale context and inconsistent future behavior.' },
      { title:'Wait for another complaint so you can gather more evidence first.', summary:'Leave the outdated policy in production until the issue becomes louder.', baseScore:12, lesson:'This is weak deployment behavior. Drift should not wait for repeated user harm when the source-of-truth changed already.', feedback:'The system remains exposed because no source refresh, rerun, or owner handoff happened.' }
    ]
  },
  'ticket-summary': {
    drillPrompt: 'A new ticketing template adds a mandatory compliance field, but the summarizer ignores it. What should the team do first?',
    drillOptions: [
      { title:'Update the source template, add the compliance field to evaluation cases, rerun summaries, and assign an owner.', summary:'Treat the template change as a controlled drift event.', baseScore:66, lesson:'The best move is to update the context and evaluation assets together so the new required field is visible, tested, and monitored.', feedback:'You repaired the drift at the source and proved the fix against the evaluation suite.' },
      { title:'Tell agents to manually append compliance notes until the next release.', summary:'Use human workarounds while leaving the summarizer unchanged.', baseScore:40, lesson:'Manual patches can reduce harm, but they create process burden and do not strengthen the system itself.', feedback:'You created a temporary operational patch, but the model path still misses the compliance field.' },
      { title:'Keep the current summarizer because the field is only needed for a subset of tickets.', summary:'Assume the drift is acceptable and avoid touching the pipeline.', baseScore:10, lesson:'This underestimates drift. Optional-looking fields often become enterprise-critical once templates change.', feedback:'The summarizer continues to omit a now-required field, increasing handoff and compliance risk.' }
    ]
  },
  'onboarding': {
    drillPrompt: 'A new office opens with a different equipment approval flow, but the assistant still uses headquarters steps. What is the right response?',
    drillOptions: [
      { title:'Add location-aware source content, test the new office flow, and assign ownership for future location updates.', summary:'Operationalize the new branch as a governed deployment change.', baseScore:66, lesson:'This is the strongest response because it updates the authoritative reference path and builds a sustainable owner-based update loop.', feedback:'You handled drift as an operational readiness issue, not just a wording fix.' },
      { title:'Keep the current answer but append a note telling new hires to double-check with IT.', summary:'Add caution language without repairing the underlying office mismatch.', baseScore:38, lesson:'Warnings help, but they are not a substitute for location-specific source and evaluation coverage.', feedback:'You lowered some harm, but the assistant still serves the wrong workflow to the new office.' },
      { title:'Disable the onboarding assistant for everyone until the office playbook is complete.', summary:'Stop the whole system instead of isolating the location-specific drift.', baseScore:26, lesson:'This is safer than doing nothing, but it is a blunt response that throws away useful capability instead of targeting the changed branch.', feedback:'You avoided some immediate mistakes, but the response is expensive and not well scoped to the drift itself.' }
    ]
  }
};
APP.scenarios.forEach(s => Object.assign(s, DRIFT_CONFIG[s.id] || {}));




const STORAGE_VERSION = 'v26';
let pendingViewportReset = null;
let pendingDownwardFocusTarget = null;
const DECK_SCREENS = [
  { key:'setup', title:'Phase setup', summary:'Understand what this phase is for and what failure looks like.' },
  { key:'diagnose', title:'Diagnose', summary:'Choose the likeliest root cause.' },
  { key:'repair', title:'Repair', summary:'Choose and apply one repair move.' },
  { key:'outcome', title:'Outcome', summary:'Study what changed and how the artifact affects downstream trust.' },
  { key:'learn', title:'Learn', summary:'Compare with the strongest answer and lock in the lesson.' },
  { key:'complete', title:'Complete', summary:'Finish the mission, review the key lesson, and decide whether to stop or continue.' }
];
const STAGES = [
  { key:'setup', label:'Stage 1', title:'Case setup', summary:'Choose one incident and orient yourself before the clinic begins.' },
  { key:'clinic', label:'Stage 2', title:'Mission deck', summary:'Finish one complete mission. Additional phases are optional.' }
];

const state = loadState();
applyStartupScenario();

function freshState(){
  return {
    selectedScenarioId:null,
    activePhaseIndex:0,
    activeStage:'setup',
    activeDeckScreen:0,
    phases:{},
    completed:false,
    lastAction:null,
    replaySlots:{ A:null, B:null },
    driftByScenario:{},
  };
}
function loadState(){
  try {
    const loaded = JSON.parse(localStorage.getItem(`lfc_state_${STORAGE_VERSION}`) || '{}');
    const merged = Object.assign(freshState(), loaded || {});
    if(!merged.replaySlots) merged.replaySlots = { A:null, B:null };
    if(!merged.driftByScenario) merged.driftByScenario = {};
    if(typeof merged.activeDeckScreen !== 'number') merged.activeDeckScreen = 0;
    return merged;
  } catch(e){ return freshState(); }
}
function saveState(){ localStorage.setItem(`lfc_state_${STORAGE_VERSION}`, JSON.stringify(state)); }
function selectedScenario(){ return APP.scenarios.find(s => s.id === state.selectedScenarioId); }
function ensureRecord(key){ if(!state.phases[key]) state.phases[key] = { hypothesisIndex:null, interventionIndex:null, resolved:false, deltas:null, bestShown:false }; return state.phases[key]; }
function ensureDriftState(sid){ if(!state.driftByScenario[sid]) state.driftByScenario[sid] = { optionIndex:null, resolved:false, score:null, followupIndex:null, finalResolved:false, finalScore:null }; return state.driftByScenario[sid]; }
function activePhase(){ const s=selectedScenario(); return s ? s.phases[state.activePhaseIndex] : null; }
function phaseByKey(s, key){ return s ? s.phases.find(p=>p.key===key) : null; }
function applyStartupScenario(){
  const first = APP.scenarios[0];
  if(state.selectedScenarioId && !APP.scenarios.some(s=>s.id===state.selectedScenarioId)) state.selectedScenarioId = first?.id || null;
  if(!state.activeStage) state.activeStage = state.selectedScenarioId ? 'clinic' : 'setup';
}
function envLabel(){ if(location.protocol==='file:') return 'File'; if(location.hostname.includes('github.io')) return 'GitHub Pages'; if(['localhost','127.0.0.1'].includes(location.hostname)) return 'Local'; return 'Web'; }
function metrics(){
  const s = selectedScenario();
  if(!s) return {quality:0,risk:0,readiness:0,mastery:0,resolved:0};
  const m={...s.baseline,resolved:0};
  s.phases.forEach(p=>{
    const r=state.phases[p.key];
    if(r && r.resolved && r.deltas){
      m.resolved+=1;
      m.quality+=r.deltas.quality;
      m.risk+=r.deltas.risk;
      m.readiness+=r.deltas.readiness;
      m.mastery+=r.deltas.mastery;
    }
  });
  ['quality','risk','readiness','mastery'].forEach(k=>m[k]=Math.max(0,Math.min(100,m[k])));
  return m;
}
function resolvedPhaseCount(){ return metrics().resolved; }
function reviewUnlocked(){ return resolvedPhaseCount() >= 1; }
function fullRunComplete(){ return !!state.completed; }
function nextUnresolvedPhaseIndex(s){ if(!s) return -1; return s.phases.findIndex(phase => !(state.phases[phase.key] && state.phases[phase.key].resolved)); }
function continueLifecycleMission(){ const s = selectedScenario(); if(!s) return; const nextIndex = nextUnresolvedPhaseIndex(s); if(nextIndex === -1){ state.activeStage = 'review'; queueViewportReset(); saveState(); render(); return; } state.activePhaseIndex = nextIndex; state.activeStage = 'clinic'; state.activeDeckScreen = 0; queueViewportReset(); saveState(); render(); }
function masteryLabel(v){ if(v>=85) return 'Ready to Handoff'; if(v>=68) return 'Stable'; if(v>=48) return 'Tested'; if(v>=28) return 'Structured'; return 'Draft'; }
function compositeScore(m){ return Math.max(0, Math.min(100, Math.round((m.quality + (100 - m.risk) + m.readiness + m.mastery) / 4))); }
function benchmarkForScenario(s){
  if(!s) return null;
  const phaseEntries = s.phases.map(phase => {
    const bestH = bestHypothesisIndex(phase);
    const bestI = bestInterventionIndex(phase);
    const deltas = computeDelta(phase, { hypothesisIndex: bestH, interventionIndex: bestI });
    return { phase, bestH, bestI, deltas };
  });
  const score = { ...s.baseline };
  phaseEntries.forEach(entry => {
    score.quality += entry.deltas.quality;
    score.risk += entry.deltas.risk;
    score.readiness += entry.deltas.readiness;
    score.mastery += entry.deltas.mastery;
  });
  ['quality','risk','readiness','mastery'].forEach(k => score[k] = Math.max(0, Math.min(100, score[k])));
  return { metrics: score, composite: compositeScore(score), phaseEntries };
}
function benchmarkGapNarrative(currentScore, benchmarkScore, gap){
  if(gap <= 4) return 'You finished almost on top of the benchmark path. This is already a strong enterprise-ready recovery run.';
  if(gap <= 12) return 'You delivered a solid recovery, but the benchmark still shows a few cleaner lifecycle choices with less residual drag.';
  if(gap <= 24) return 'Your run repaired the system, but the benchmark path shows meaningful room to improve reliability and handoff readiness.';
  return 'The case improved, but the benchmark reveals a much stronger end-to-end recovery path. Use the phase cards below to study the missing moves.';
}
function computeAccuracyDelta(phase, record){
  if(record.hypothesisIndex === null) return {quality:0,risk:0,readiness:0,mastery:0};
  return phase.hypotheses[record.hypothesisIndex].correct
    ? {quality:3,risk:-3,readiness:2,mastery:4}
    : {quality:-2,risk:2,readiness:-1,mastery:0};
}
function computeDelta(phase, record){
  if(record.interventionIndex === null) return null;
  const impact = phase.interventions[record.interventionIndex].impact;
  const accuracy = computeAccuracyDelta(phase, record);
  return {
    quality: impact.quality + accuracy.quality,
    risk: impact.risk + accuracy.risk,
    readiness: impact.readiness + accuracy.readiness,
    mastery: impact.mastery + accuracy.mastery
  };
}
function bestHypothesisIndex(phase){ const idx = phase.hypotheses.findIndex(h => h.correct); return idx === -1 ? 0 : idx; }
function interventionUtility(intervention){ return intervention.impact.quality + intervention.impact.readiness + intervention.impact.mastery - intervention.impact.risk; }
function bestInterventionIndex(phase){ let best = 0, bestScore = -Infinity; phase.interventions.forEach((intervention, idx) => { const score = interventionUtility(intervention); if(score > bestScore){ bestScore = score; best = idx; } }); return best; }
function compareGapText(ideal, actual){
  if(!ideal || !actual) return 'Run the repair to compare your outcome against the strongest chapter-aligned answer.';
  const parts = [];
  if(ideal.quality > actual.quality) parts.push(`${ideal.quality - actual.quality} more quality`);
  if(ideal.readiness > actual.readiness) parts.push(`${ideal.readiness - actual.readiness} more readiness`);
  if(ideal.mastery > actual.mastery) parts.push(`${ideal.mastery - actual.mastery} more mastery`);
  if(ideal.risk < actual.risk) parts.push(`${actual.risk - ideal.risk} less risk`);
  return parts.length ? `The strongest answer would have delivered ${parts.join(', ')}.` : 'Your chosen answer already matches the strongest outcome envelope for this phase.';
}
function bestReviewForPhase(phase, record){
  const bestH = bestHypothesisIndex(phase);
  const bestI = bestInterventionIndex(phase);
  const ideal = computeDelta(phase, { hypothesisIndex: bestH, interventionIndex: bestI });
  const diagnosisAligned = record.hypothesisIndex === bestH;
  const repairAligned = record.interventionIndex === bestI;
  let verdict = 'You moved the case, but not with the strongest chapter-aligned answer.';
  if(diagnosisAligned && repairAligned) verdict = 'You matched the strongest chapter-aligned answer for this phase.';
  else if(diagnosisAligned || repairAligned) verdict = 'You partially aligned with the strongest answer. Review the remaining gap below.';
  return {
    bestHypothesisIndex: bestH,
    bestInterventionIndex: bestI,
    ideal,
    diagnosisAligned,
    repairAligned,
    verdict,
    gapText: compareGapText(ideal, record.deltas),
    bestHypothesis: phase.hypotheses[bestH],
    bestIntervention: phase.interventions[bestI]
  };
}
function applyRepairToRecord(s, phase, record){
  record.deltas = computeDelta(phase, record);
  record.resolved = true;
  record.bestShown = true;
  state.lastAction = { scenarioId: s.id, phaseKey: phase.key };
  state.completed = s.phases.every(x=>state.phases[x.key] && state.phases[x.key].resolved);
  if(state.completed) state.activeStage = 'review';
}
function currentImpact(s){
  if(!s) return null;
  const p = activePhase();
  const r = ensureRecord(p.key);
  const preview = computeDelta(p, r);
  if(r.resolved && r.deltas){
    return { phase:p, record:r, deltas:r.deltas, mode:'applied', status:'Applied', title:`${p.name} repair applied`, summary:p.interventions[r.interventionIndex].result, detail:p.hypotheses[r.hypothesisIndex].rationale };
  }
  if(preview){
    const hypothesisReady = r.hypothesisIndex !== null;
    return { phase:p, record:r, deltas:preview, mode:'preview', status:hypothesisReady ? 'Preview' : 'Partial preview', title:`${p.name} live preview`, summary:hypothesisReady ? `If you apply this repair, ${p.interventions[r.interventionIndex].result}` : `Repair selected: ${p.interventions[r.interventionIndex].title}. Pick a diagnosis to add the confidence effect.`, detail:hypothesisReady ? p.hypotheses[r.hypothesisIndex].rationale : 'Select a root cause to preview the full lifecycle effect.' };
  }
  return { phase:p, record:r, deltas:null, mode:'waiting', status:'Waiting', title:`${p.name} waiting for a repair`, summary:'Select a diagnosis and a repair move to preview the delta before you apply it.', detail:'The right-side live results panel stays visible while you move through the deck.' };
}
function formatDeltaLabel(key){ return key.charAt(0).toUpperCase() + key.slice(1); }
function deltaMarkup(deltas){
  if(!deltas) return '<p class="muted">No delta yet.</p>';
  return `<div class="delta-list">${Object.entries(deltas).map(([key,val]) => `<div class="delta-pill ${val>=0?'pos':'neg'}">${formatDeltaLabel(key)}: ${val>=0?'+':''}${val}</div>`).join('')}</div>`;
}
function compactImpact(deltas){ if(!deltas) return '—'; return `Q${deltas.quality>=0?'+':''}${deltas.quality} · R${deltas.risk>=0?'+':''}${deltas.risk}`; }
function driftScore(option, runScore){ return Math.max(0, Math.min(100, Math.round(option.baseScore + ((runScore - 50) * 0.2)))); }
function nextPhaseForScenario(s, phase){ if(!s || !phase) return null; const idx = s.phases.findIndex(x => x.key === phase.key); return idx >= 0 && idx < s.phases.length - 1 ? s.phases[idx+1] : null; }
function consequenceBand(score){ if(score >= 85) return 'Stable chain'; if(score >= 60) return 'Recovering chain'; return 'Fragile chain'; }
function buildDriftBranches(s, option){
  if(option.baseScore >= 60){
    return {
      title:'Governed containment branch',
      summary:`The first response was strong. Leadership now asks whether to constrain the affected workflow while revalidation runs for ${s.title}.`,
      followups:[
        { title:'Temporarily narrow the affected workflow, rerun the evidence set, and log the owner handoff.', summary:'Contain the blast radius while proving the fix.', scoreDelta:8, narrative:'You preserved trust by containing the changed path and proving the repair before broad release.', lesson:'Strong deployment behavior combines containment, evaluation, and owner accountability.' },
        { title:'Push the content update immediately and assume the old evaluation still covers the change.', summary:'Move fast, but skip explicit revalidation of the changed branch.', scoreDelta:-10, narrative:'The update landed quickly, but the unverified branch can still fail quietly in production.', lesson:'Fast fixes without fresh evaluation often create hidden drift debt.' }
      ]
    };
  }
  if(option.baseScore >= 35){
    return {
      title:'Workaround branch',
      summary:`The first response reduced immediate harm, but the team now has to decide whether to operationalize or normalize the workaround in ${s.title}.`,
      followups:[
        { title:'Convert the workaround into a governed repair: update the source, add evaluation coverage, and assign an owner.', summary:'Turn the patch into a lifecycle repair.', scoreDelta:9, narrative:'You turned a temporary patch into a stable lifecycle fix.', lesson:'A workaround only becomes reliable when discovery, selection, evaluation, and deployment are updated together.' },
        { title:'Keep the workaround for a week and let the team remember the exception manually.', summary:'Delay the deeper repair and absorb the process overhead.', scoreDelta:-9, narrative:'The system keeps running, but human memory becomes the real control layer.', lesson:'Temporary patches calcify quickly when no owner closes the loop.' }
      ]
    };
  }
  return {
    title:'Escalation branch',
    summary:`The first response left the system exposed. The next move determines whether the team contains the failure or lets the drift spread across ${s.title}.`,
    followups:[
      { title:'Roll back the affected path, create an owner-led repair plan, and reopen evaluation before restoring service.', summary:'Take the operational hit and regain control.', scoreDelta:12, narrative:'You accepted short-term disruption to stop the drift from spreading unchecked.', lesson:'When the first response is weak, decisive containment and ownership are better than optimistic waiting.' },
      { title:'Leave the system live and wait for another complaint before acting.', summary:'Avoid disruption and hope the impact stays small.', scoreDelta:-12, narrative:'The drift remains live, and every new interaction increases trust debt.', lesson:'Deployment drift gets more expensive the longer it remains invisible in production.' }
    ]
  };
}
function branchVerdict(score){ if(score >= 85) return 'Branch stabilized'; if(score >= 60) return 'Branch partially contained'; return 'Branch remains unstable'; }
function saveReplay(slot){
  const s = selectedScenario();
  if(!s || !reviewUnlocked()) return;
  state.replaySlots[slot] = {
    savedAt: new Date().toISOString(),
    caseId: s.id,
    caseTitle: s.title,
    metrics: metrics(),
    phases: s.phases.map(p => {
      const r = state.phases[p.key] || {};
      return { key: p.key, name: p.name, hypothesisIndex: r.hypothesisIndex, interventionIndex: r.interventionIndex, resolved: !!r.resolved };
    })
  };
  saveState(); render();
}
function clearReplay(slot){ state.replaySlots[slot] = null; saveState(); render(); }
function slotPerformance(snapshot){
  if(!snapshot) return null;
  const scenario = APP.scenarios.find(s => s.id === snapshot.caseId);
  if(!scenario) return null;
  let diagnosisAligned = 0, repairAligned = 0;
  snapshot.phases.forEach(entry => {
    const phase = phaseByKey(scenario, entry.key);
    if(!phase) return;
    if(entry.hypothesisIndex === bestHypothesisIndex(phase)) diagnosisAligned += 1;
    if(entry.interventionIndex === bestInterventionIndex(phase)) repairAligned += 1;
  });
  return { diagnosisAligned, repairAligned, total: scenario.phases.length };
}
function escapeHtml(v){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function stageUnlocked(stage, scenario){
  if(stage === 'setup') return true;
  if(stage === 'clinic') return !!scenario;
  if(stage === 'review') return !!scenario && reviewUnlocked();
  if(stage === 'advanced') return !!scenario && reviewUnlocked();
  return false;
}
function stageStatus(stage, scenario){
  if(stage === 'setup') return scenario ? 'Complete' : 'Start here';
  if(stage === 'clinic') return !scenario ? 'Locked' : fullRunComplete() ? 'Complete' : reviewUnlocked() ? 'Optional next missions' : 'Active';
  if(stage === 'review') return !stageUnlocked('review', scenario) ? 'Locked' : state.activeStage === 'review' ? 'Active' : 'Ready';
  if(stage === 'advanced') return !stageUnlocked('advanced', scenario) ? 'Locked' : state.activeStage === 'advanced' ? 'Active' : 'Ready';
  return 'Ready';
}
function queueViewportReset(kind='active-stage-top'){ pendingViewportReset = kind; }
function queueDownwardFocus(targetId){ pendingDownwardFocusTarget = targetId; }
function setStage(stage){
  const scenario = selectedScenario();
  if(!stageUnlocked(stage, scenario)) return;
  state.activeStage = stage;
  queueViewportReset();
  saveState();
  render();
}
function selectScenario(id){
  state.selectedScenarioId = id;
  state.activePhaseIndex = 0;
  state.activeStage = 'clinic';
  state.activeDeckScreen = 0;
  state.phases = {};
  state.completed = false;
  state.lastAction = null;
  state.driftByScenario[id] = state.driftByScenario[id] || { optionIndex:null, resolved:false, score:null, followupIndex:null, finalResolved:false, finalScore:null };
  queueViewportReset();
  saveState();
  render();
}
function activeDeckMeta(s, p, r){
  const step = DECK_SCREENS[state.activeDeckScreen] || DECK_SCREENS[0];
  const hasDiagnosis = r && r.hypothesisIndex !== null;
  const hasRepair = r && r.interventionIndex !== null;
  const resolved = !!(r && r.resolved);
  return { step, hasDiagnosis, hasRepair, resolved };
}
function stepState(index, r){
  let maxUnlocked = 0;
  if(r.hypothesisIndex !== null) maxUnlocked = 1;
  if(r.interventionIndex !== null) maxUnlocked = 2;
  if(r.resolved) maxUnlocked = 5;
  if(index < state.activeDeckScreen) return 'done';
  if(index === state.activeDeckScreen) return 'current';
  return index <= maxUnlocked ? '' : 'locked';
}
function pickChoice(kind, index){
  const p = activePhase();
  if(!p) return;
  const r = ensureRecord(p.key);
  if(kind === 'hypothesis'){
    r.hypothesisIndex = index;
    if(!r.resolved) state.activeDeckScreen = 1;
    queueViewportReset();
  }
  if(kind === 'intervention'){
    r.interventionIndex = index;
    if(!r.resolved) state.activeDeckScreen = 2;
    queueDownwardFocus('deckNext');
  }
  saveState();
  render();
}
function goToScreen(index){
  const p = activePhase();
  if(!p) return;
  const r = ensureRecord(p.key);
  const maxAllowed = r.resolved ? 5 : (r.hypothesisIndex !== null ? (r.interventionIndex !== null ? 2 : 1) : 0);
  state.activeDeckScreen = Math.max(0, Math.min(index, maxAllowed));
  queueViewportReset();
  saveState();
  render();
}
function advanceDeck(){
  const s = selectedScenario();
  const p = activePhase();
  if(!s || !p) return;
  const r = ensureRecord(p.key);
  if(state.activeDeckScreen === 0){ state.activeDeckScreen = 1; }
  else if(state.activeDeckScreen === 1){ if(r.hypothesisIndex === null) return; state.activeDeckScreen = 2; }
  else if(state.activeDeckScreen === 2){ if(r.hypothesisIndex === null || r.interventionIndex === null) return; applyRepairToRecord(s, p, r); state.activeStage = 'clinic'; state.activeDeckScreen = 3; }
  else if(state.activeDeckScreen === 3){ if(!r.resolved) return; state.activeDeckScreen = 4; }
  else if(state.activeDeckScreen === 4){ if(!r.resolved) return; state.activeDeckScreen = 5; }
  else if(state.activeDeckScreen === 5){ if(state.activePhaseIndex < s.phases.length - 1){ state.activePhaseIndex += 1; state.activeDeckScreen = 0; state.activeStage = 'clinic'; } else { state.activeStage = 'setup'; state.activeDeckScreen = 0; } }
  queueViewportReset();
  saveState();
  render();
}
function retreatDeck(){
  if(state.activeStage !== 'clinic') return;
  state.activeDeckScreen = Math.max(0, state.activeDeckScreen - 1);
  queueViewportReset();
  saveState();
  render();
}
function openPhase(index){
  const s = selectedScenario();
  if(!s) return;
  if(index < 0 || index >= s.phases.length) return;
  const targetPhase = s.phases[index];
  const targetRecord = ensureRecord(targetPhase.key);
  const reachable = index <= state.activePhaseIndex || targetRecord.resolved;
  if(!reachable && index !== state.activePhaseIndex) return;
  state.activePhaseIndex = index;
  state.activeStage = 'clinic';
  state.activeDeckScreen = targetRecord.resolved ? 5 : targetRecord.interventionIndex !== null ? 2 : targetRecord.hypothesisIndex !== null ? 1 : 0;
  queueViewportReset();
  saveState();
  render();
}
function metricBar(label, value, klass=''){
  return `<div class="metric-row"><div class="metric-label"><span>${label}</span><span>${value}</span></div><div class="metric-bar"><div class="metric-fill ${klass}" style="width:${Math.max(0, Math.min(100, value))}%"></div></div></div>`;
}
function renderStageTabs(scenario){
  const active = state.activeStage;
  document.getElementById('stageSummaryChip').textContent = STAGES.find(x => x.key === active)?.label || 'Stage';
  document.getElementById('stageTabs').innerHTML = STAGES.map(stage => {
    const unlocked = stageUnlocked(stage.key, scenario);
    const status = stageStatus(stage.key, scenario);
    const klass = [ 'stage-tab', stage.key === active ? 'active' : '', status === 'Complete' ? 'complete' : '', !unlocked ? 'locked' : '' ].join(' ').trim();
    return `<button class="${klass}" data-stage="${stage.key}" ${unlocked ? '' : 'disabled'}>
      <span class="stage-meta">
        <span class="label">${stage.label}</span>
        <span class="stage-name">${stage.title}</span>
      </span>
      <span class="stage-state">${status}</span>
    </button>`;
  }).join('');
}
function renderSetupStage(scenario){
  const root = document.getElementById('setupStage');
  root.classList.toggle('hidden', state.activeStage !== 'setup');
  root.innerHTML = `
    <div class="setup-hero">
      <p class="label">Mission Deck</p>
      <h2>Lifecycle Failure Clinic</h2>
      <p class="screen-lead">Lifecycle Failure Clinic teaches learners how quality and reliability are built phase by phase across an AI delivery lifecycle. Each mission presents one realistic incident and then walks the learner through diagnosing the failure, selecting a targeted repair, seeing the downstream outcome, and comparing that decision to the strongest chapter-aligned answer. The result is a complete educational loop after a single mission: the learner understands what went wrong, why the repair matters, how weakness propagates into later phases, and what better practice looks like in context.</p>
    </div>
    <div class="section-head" style="margin-top:1rem"><div><p class="label">Choose a case</p><h3>Start one mission</h3></div>${scenario ? `<button class="ghost" data-stage="clinic">Resume current mission</button>` : ''}</div>
    <div class="scenario-grid">${APP.scenarios.map(s => `
      <article class="scenario-card">
        <span class="chip soft">${escapeHtml(s.badge)}</span>
        <div>
          <h3>${escapeHtml(s.title)}</h3>
          <p class="muted">${escapeHtml(s.subtitle)}</p>
        </div>
        <div class="support-grid">
          <div class="support-card"><p class="small-label">Trigger</p><p>${escapeHtml(s.trigger)}</p></div>
          <div class="support-card"><p class="small-label">Goal</p><p>${escapeHtml(s.goal)}</p></div>
        </div>
        <p><strong>Stakes:</strong> ${escapeHtml(s.stakes)}</p>
        <div class="option-actions"><button class="primary" data-select-scenario="${s.id}">${scenario && scenario.id === s.id ? 'Restart this mission' : 'Start this mission'}</button></div>
      </article>`).join('')}</div>`;
}
function renderMissionMap(scenario){
  document.getElementById('phaseMapChip').textContent = scenario ? `${metrics().resolved}/7` : '0/7';
  document.getElementById('missionMap').innerHTML = !scenario ? '<p class="muted">Choose a case to unlock the seven-phase mission map.</p>' : `<div class="phase-map-list">${scenario.phases.map((phase, index) => {
    const record = ensureRecord(phase.key);
    const status = record.resolved ? 'Complete' : index === state.activePhaseIndex ? 'Current phase' : index < state.activePhaseIndex ? 'Visited' : 'Upcoming';
    const klass = ['phase-link', index === state.activePhaseIndex ? 'active' : '', record.resolved ? 'complete' : '', index > state.activePhaseIndex && !record.resolved ? 'locked' : ''].join(' ').trim();
    const disabled = index > state.activePhaseIndex && !record.resolved ? 'disabled' : '';
    return `<button class="${klass}" data-phase-index="${index}" ${disabled}><span class="small-label">Phase ${index+1}</span><strong>${escapeHtml(phase.name)}</strong><span class="muted">${status}</span></button>`;
  }).join('')}</div>`;
}
function renderCaseSnapshot(scenario){
  document.getElementById('caseSnapshot').innerHTML = !scenario ? '<p class="muted">Choose a case to see the incident, goal, and stakes.</p>' : `
    <p class="small-label">${escapeHtml(scenario.subtitle)}</p>
    <h3 style="margin:.15rem 0 .45rem">${escapeHtml(scenario.title)}</h3>
    <p><strong>Trigger:</strong> ${escapeHtml(scenario.trigger)}</p>
    <p><strong>Goal:</strong> ${escapeHtml(scenario.goal)}</p>
    <p><strong>Stakes:</strong> ${escapeHtml(scenario.stakes)}</p>`;
}
function renderArtifactSnapshot(phase, record){
  document.getElementById('artifactSnapshot').innerHTML = !phase ? '<p class="muted">The current phase artifact will appear here.</p>' : `
    <h3 style="margin:.1rem 0 .35rem">${escapeHtml(phase.artifact)}</h3>
    <p class="muted">${escapeHtml(phase.purpose)}</p>
    <p><strong>Status:</strong> ${record?.resolved ? 'Repaired' : 'Still in progress'}</p>
    <p><strong>Downstream risk:</strong> ${escapeHtml(phase.skipDanger)}</p>`;
}
function renderSupportSurface(scenario, phase, record){
  const root = document.getElementById('supportSurface');
  if(!scenario || !phase){ root.innerHTML = '<p class="muted">Support guidance changes with the current mission screen.</p>'; return; }
  const screen = DECK_SCREENS[state.activeDeckScreen];
  const helpers = {
    setup: { title:'Read for orientation', body:`Learn what ${phase.name} is supposed to produce before making any choices.`, note:`Artifact: ${phase.artifact}` },
    diagnose: { title:'Choose one root cause', body:'Read every option. Pick the one that best explains the failure pattern, not the prettiest wording.', note: record.hypothesisIndex !== null ? phase.hypotheses[record.hypothesisIndex].rationale : 'No diagnosis selected yet.' },
    repair: { title:'Choose one repair move', body:'Do not overthink the UI. Pick one move that best repairs the actual lifecycle failure.', note: record.interventionIndex !== null ? phase.interventions[record.interventionIndex].summary : 'No repair selected yet.' },
    outcome: { title:'Read the consequence', body:'Focus on what changed downstream. This is where the lifecycle chain reaction becomes visible.', note: record.deltas ? compactImpact(record.deltas) : 'Apply the repair first.' },
    learn: { title:'Study the strongest answer', body:'Use the strongest answer screen to understand what a cleaner lifecycle move would have looked like.', note: record.resolved ? 'Continue only after you can explain the gap.' : 'Run the repair first.' },
    complete: { title:'Mission complete', body:'You now have the full educational loop. Most learners can stop here or continue only if they want extra practice.', note: record.resolved ? 'Choose another case or continue to the next optional phase.' : 'Finish the repair first.' }
  };
  const helper = helpers[screen.key];
  root.innerHTML = `<div class="support-card"><h4>${escapeHtml(helper.title)}</h4><p>${escapeHtml(helper.body)}</p><p class="muted">${escapeHtml(helper.note)}</p></div>`;
}
function renderLiveResults(scenario){
  const impact = scenario ? currentImpact(scenario) : null;
  document.getElementById('liveModeChip').textContent = impact ? impact.status : 'Waiting';
  document.getElementById('liveResultsBox').innerHTML = !impact ? '<p class="muted">Select a case to begin.</p>' : `
    <div class="support-card">
      <h4>${escapeHtml(impact.title)}</h4>
      <p>${escapeHtml(impact.summary)}</p>
      <p class="muted">${escapeHtml(impact.detail)}</p>
      ${deltaMarkup(impact.deltas)}
    </div>`;
}
function renderSystemPulse(scenario){
  const root = document.getElementById('systemPulseBox');
  if(!scenario){ root.innerHTML = '<p class="muted">System pulse becomes visible after a case is selected.</p>'; return; }
  root.innerHTML = `<div class="pulse-list">${scenario.phases.map((phase, index) => {
    const record = ensureRecord(phase.key);
    const status = record.resolved ? 'Repaired' : index === state.activePhaseIndex ? 'Working now' : 'Not repaired yet';
    const klass = ['pulse-item', record.resolved ? 'complete' : '', index === state.activePhaseIndex ? 'current' : '', index > state.activePhaseIndex && !record.resolved ? 'upcoming' : ''].join(' ').trim();
    return `<div class="${klass}"><strong>${escapeHtml(phase.name)}</strong><span class="muted">${status}</span><span class="muted">${escapeHtml(phase.skipDanger)}</span></div>`;
  }).join('')}</div>`;
}
function renderNotebook(scenario){
  const root = document.getElementById('notebookBox');
  if(!scenario){ root.innerHTML = '<p class="muted">The notebook will summarize the current lesson and your latest move.</p>'; return; }
  const phase = activePhase();
  const record = ensureRecord(phase.key);
  const lines = [
    `<p><strong>${escapeHtml(phase.name)} lesson</strong></p>`,
    `<p>${escapeHtml(phase.phaseLesson)}</p>`
  ];
  if(record.hypothesisIndex !== null) lines.push(`<p><strong>Chosen diagnosis:</strong> ${escapeHtml(phase.hypotheses[record.hypothesisIndex].title)}</p>`);
  if(record.interventionIndex !== null) lines.push(`<p><strong>Chosen repair:</strong> ${escapeHtml(phase.interventions[record.interventionIndex].title)}</p>`);
  if(record.resolved) lines.push(`<p><strong>Result:</strong> ${escapeHtml(phase.interventions[record.interventionIndex].result)}</p>`);
  root.innerHTML = `<div class="note-card">${lines.join('')}</div>`;
}
function renderSetupScreen(phase){
  return `
    <div class="screen-header"><p class="label">Screen 1</p><h3>Understand the phase before making decisions</h3><p class="screen-lead">Read what ${escapeHtml(phase.name)} is supposed to do, what failure looks like, and what a better outcome would feel like.</p></div>
    <div class="stats-grid">
      <div class="phase-card"><p class="small-label">Phase purpose</p><p>${escapeHtml(phase.purpose)}</p></div>
      <div class="phase-card"><p class="small-label">Current failure</p><p>${escapeHtml(phase.symptom)}</p></div>
    </div>
    <div class="compare-grid">
      <div class="compare-card"><p class="small-label">Observed output</p><p>${escapeHtml(selectedScenario().badOutput)}</p></div>
      <div class="compare-card"><p class="small-label">Target behavior</p><p>${escapeHtml(selectedScenario().goodOutput)}</p></div>
    </div>
    <div class="phase-card"><p class="small-label">Evidence</p><ul class="info-list">${phase.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
    <div class="selected-explainer"><p class="small-label">Why this phase matters</p><p>${escapeHtml(phase.phaseLesson)}</p><p class="muted">${escapeHtml(phase.skipDanger)}</p></div>`;
}
function renderDiagnoseScreen(phase, record){
  return `
    <div class="screen-header"><p class="label">Screen 2</p><h3>Pick the likeliest root cause</h3><p class="screen-lead">Choose the diagnosis that best explains the lifecycle failure. The best answer is the one that identifies the process failure, not the cosmetic symptom.</p></div>
    <div class="choice-grid one-up">${phase.hypotheses.map((item, index) => `
      <button class="choice-card ${record.hypothesisIndex === index ? 'selected' : ''}" data-choice-kind="hypothesis" data-choice-index="${index}">
        <span class="choice-tag">Diagnosis option ${index + 1}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="muted">${record.hypothesisIndex === index ? escapeHtml(item.rationale) : 'Select to see why this diagnosis would explain the failure.'}</span>
      </button>`).join('')}</div>
    ${record.hypothesisIndex !== null ? `<div class="selected-explainer"><p class="small-label">Selected diagnosis</p><p><strong>${escapeHtml(phase.hypotheses[record.hypothesisIndex].title)}</strong></p><p>${escapeHtml(phase.hypotheses[record.hypothesisIndex].rationale)}</p></div>` : ''}`;
}
function renderRepairScreen(phase, record){
  return `
    <div class="screen-header"><p class="label">Screen 3</p><h3>Choose one repair move and apply it</h3><p class="screen-lead">Now choose the single repair that best fixes the failure you diagnosed. The app will apply it and move you to the outcome screen.</p></div>
    <div class="coach-strip"><p class="small-label">Chosen diagnosis</p><p>${record.hypothesisIndex !== null ? escapeHtml(phase.hypotheses[record.hypothesisIndex].title) : 'Pick a diagnosis first.'}</p></div>
    <div class="choice-grid one-up">${phase.interventions.map((item, index) => `
      <button class="option-card ${record.interventionIndex === index ? 'selected' : ''}" data-choice-kind="intervention" data-choice-index="${index}">
        <span class="choice-tag">Repair option ${index + 1}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="muted">${escapeHtml(item.summary)}</span>
      </button>`).join('')}</div>`;
}
function renderOutcomeScreen(scenario, phase, record){
  const next = nextPhaseForScenario(scenario, phase);
  const downstreamLabel = next ? next.name : 'Deployment monitoring';
  return `
    <div class="screen-header"><p class="label">Screen 4</p><h3>See what changed</h3><p class="screen-lead">This outcome screen shows the immediate result of the repair and the downstream phase consequence map.</p></div>
    <div class="outcome-banner"><div><h4>${escapeHtml(phase.interventions[record.interventionIndex].result)}</h4><p>${escapeHtml(phase.hypotheses[record.hypothesisIndex].rationale)}</p></div><span class="chip ok">Repair applied</span></div>
    <div class="phase-result-grid">
      <div class="phase-result"><p class="small-label">Artifact state</p><h4>${escapeHtml(phase.artifact)}</h4><p>${escapeHtml(phase.phaseLesson)}</p><p class="muted">${escapeHtml(phase.interventions[record.interventionIndex].summary)}</p></div>
      <div class="phase-result"><p class="small-label">Live delta</p>${deltaMarkup(record.deltas)}</div>
    </div>
    <div class="consequence-grid">
      <div class="map-card positive"><p class="small-label">Repair leverage</p><h4>${escapeHtml(phase.interventions[record.interventionIndex].title)}</h4><p>${escapeHtml(phase.interventions[record.interventionIndex].result)}</p></div>
      <div class="map-card negative"><p class="small-label">If left weak</p><h4>Hidden reliability debt</h4><p>${escapeHtml(phase.skipDanger)}</p></div>
      <div class="map-card neutral"><p class="small-label">Downstream blast radius</p><h4>${escapeHtml(downstreamLabel)}</h4><p>${next ? `${escapeHtml(next.name)} inherits the quality of this ${escapeHtml(phase.artifact.toLowerCase())}.` : 'Launch quality now depends on monitoring and ownership discipline.'}</p></div>
      <div class="map-card"><p class="small-label">Band</p><h4>${consequenceBand(compositeScore(metrics()))}</h4><p>Use this screen to explain how one lifecycle repair changes the trust chain.</p></div>
    </div>`;
}
function renderLearnScreen(scenario, phase, record){
  const best = bestReviewForPhase(phase, record);
  const next = nextPhaseForScenario(scenario, phase);
  return `
    <div class="screen-header"><p class="label">Screen 5</p><h3>Study the strongest answer</h3><p class="screen-lead">Use this screen to compare your run with the strongest chapter-aligned move before continuing.</p></div>
    <div class="strongest-review"><p class="small-label">Verdict</p><h4>${escapeHtml(best.verdict)}</h4><p>${escapeHtml(best.gapText)}</p></div>
    <div class="strongest-grid">
      <div class="compare-card"><p class="small-label">Strongest diagnosis</p><p>${escapeHtml(best.bestHypothesis.title)}</p></div>
      <div class="compare-card"><p class="small-label">Strongest repair move</p><p>${escapeHtml(best.bestIntervention.title)}</p></div>
      <div class="compare-card"><p class="small-label">Ideal delta</p>${deltaMarkup(best.ideal)}</div>
      <div class="compare-card"><p class="small-label">Compare to your run</p><p>${escapeHtml(best.gapText)}</p></div>
    </div>
    <div class="selected-explainer"><p class="small-label">Chapter takeaway</p><p>${escapeHtml(phase.phaseLesson)}</p><p class="muted">${next ? `Next phase: ${next.name}.` : 'You are ready for full-run review.'}</p></div>`;
}

function renderCompleteScreen(scenario, phase, record){
  const m = metrics();
  const next = nextPhaseForScenario(scenario, phase);
  const firstMission = resolvedPhaseCount() === 1;
  const headline = firstMission ? 'Mission complete — you can stop here' : `Phase ${state.activePhaseIndex + 1} complete`;
  const copy = firstMission
    ? 'You completed one full mission and got the full educational loop: diagnose, repair, outcome, and strongest-answer comparison. Most learners can stop here.'
    : 'You completed another optional phase. Use the summary below, then decide whether to continue deeper into the lifecycle.';
  return `
    <div class="screen-header"><p class="label">Screen 6</p><h3>${escapeHtml(headline)}</h3><p class="screen-lead">${escapeHtml(copy)}</p></div>
    <div class="outcome-banner mission-complete-banner"><div><h4>${escapeHtml(phase.name)} repaired</h4><p>${escapeHtml(phase.interventions[record.interventionIndex].result)}</p></div><span class="chip ok">Complete</span></div>
    <div class="stats-grid completion-grid">
      <div class="stat-card completion-card brand-a"><p class="small-label">What you fixed</p><h4>${escapeHtml(phase.artifact)}</h4><p>${escapeHtml(phase.phaseLesson)}</p></div>
      <div class="stat-card completion-card brand-b"><p class="small-label">Current performance</p><div class="metric-stack">${metricBar('Quality', m.quality, 'success')}${metricBar('Risk', 100 - m.risk, 'warn')}${metricBar('Readiness', m.readiness, 'success')}${metricBar('Mastery', m.mastery, '')}</div></div>
      <div class="stat-card completion-card brand-c"><p class="small-label">Why it matters</p><p>${escapeHtml(phase.skipDanger)}</p></div>
      <div class="stat-card completion-card brand-d"><p class="small-label">Optional next mission</p><p>${next ? `Continue to ${escapeHtml(next.name)} if you want more practice.` : 'You repaired the final lifecycle phase for this case.'}</p></div>
    </div>
    <div class="selected-explainer mission-complete-actions">
      <p class="small-label">Choose what to do next</p>
      <div class="option-actions">
        ${next ? `<button class="primary" id="continueLifecycleMission">Continue to Phase ${state.activePhaseIndex + 2}</button>` : ''}
        <button class="ghost" data-stage="setup">Choose another case</button>
        <button class="ghost" data-select-scenario="${escapeHtml(scenario.id)}">Restart this case</button>
      </div>
    </div>`;
}

function renderClinicStage(scenario){
  const root = document.getElementById('clinicStage');
  const visible = state.activeStage === 'clinic' && !!scenario;
  root.classList.toggle('hidden', !visible);
  if(!visible){ root.innerHTML = ''; return; }
  const phase = activePhase();
  const record = ensureRecord(phase.key);
  const screen = DECK_SCREENS[state.activeDeckScreen];
  const resolvedCount = metrics().resolved;
  const screenCards = [
    renderSetupScreen(phase),
    renderDiagnoseScreen(phase, record),
    renderRepairScreen(phase, record),
    record.resolved ? renderOutcomeScreen(scenario, phase, record) : `<div class="screen-header"><p class="label">Screen 4</p><h3>Outcome</h3><p class="screen-lead">Apply the repair first to unlock the outcome screen.</p></div>`,
    record.resolved ? renderLearnScreen(scenario, phase, record) : `<div class="screen-header"><p class="label">Screen 5</p><h3>Learn</h3><p class="screen-lead">Apply the repair first to unlock the strongest-answer review.</p></div>`,
    record.resolved ? renderCompleteScreen(scenario, phase, record) : `<div class="screen-header"><p class="label">Screen 6</p><h3>Complete</h3><p class="screen-lead">Finish the repair first to unlock the completion screen.</p></div>`
  ];
  const actionLabel = state.activeDeckScreen === 0 ? 'Start diagnosis' : state.activeDeckScreen === 1 ? 'Continue to repair' : state.activeDeckScreen === 2 ? 'Apply repair' : state.activeDeckScreen === 3 ? 'Continue to strongest answer' : state.activeDeckScreen === 4 ? 'Finish mission' : (state.activePhaseIndex < scenario.phases.length - 1 ? `Start Phase ${state.activePhaseIndex + 2}` : 'Choose another case');
  const actionDisabled = (state.activeDeckScreen === 1 && record.hypothesisIndex === null) || (state.activeDeckScreen === 2 && (record.hypothesisIndex === null || record.interventionIndex === null));
  root.innerHTML = `
    <div class="mission-deck">
      <div class="deck-hero">
        <div class="deck-kicker">
          <div>
            <p class="label">Phase ${state.activePhaseIndex + 1} of ${scenario.phases.length}</p>
            <h2 class="deck-title">${escapeHtml(phase.name)} · ${escapeHtml(phase.artifact)}</h2>
            <p class="deck-subtitle">${escapeHtml(screen.summary)}</p>
          </div>
          <div class="screen-actions">
            <span class="chip soft">${escapeHtml(screen.title)}</span>
            <span class="chip">${resolvedCount}/7 repaired</span>
          </div>
        </div>
        <div class="screen-stepper">${DECK_SCREENS.map((item, index) => {
          const stateName = stepState(index, record);
          const stepLabel = stateName === 'done' ? 'Complete' : stateName === 'current' ? 'Now' : 'Locked';
          return `<div class="screen-pill ${stateName}"><span class="small-label">Screen ${index + 1}</span><span class="screen-name">${escapeHtml(item.title)}</span><span class="muted">${stepLabel}</span></div>`;
        }).join('')}</div>
      </div>
      <article class="deck-screen">${screenCards[state.activeDeckScreen]}</article>
      <div class="deck-footer">
        <div class="deck-footer-left">
          <button class="ghost" id="deckBack" ${state.activeDeckScreen === 0 ? 'disabled' : ''}>Back</button>
          ${record.resolved && state.activeDeckScreen < 4 ? '<button class="ghost" data-go-screen="4">Jump to strongest answer</button>' : ''}
        </div>
        <div class="deck-footer-right">
          <button class="primary" id="deckNext" ${actionDisabled ? 'disabled' : ''}>${escapeHtml(actionLabel)}</button>
        </div>
      </div>
    </div>`;
}

function renderReviewStage(scenario){
  const root = document.getElementById('reviewStage');
  const visible = state.activeStage === 'review' && !!scenario && reviewUnlocked();
  root.classList.toggle('hidden', !visible);
  if(!visible){ root.innerHTML = ''; return; }
  const m = metrics();
  const score = compositeScore(m);
  const benchmark = benchmarkForScenario(scenario);
  const gap = Math.max(0, benchmark.composite - score);
  const fullRun = fullRunComplete();
  const resolvedCount = resolvedPhaseCount();
  const resolvedPhases = scenario.phases.filter(phase => { const record = state.phases[phase.key]; return record && record.resolved; });
  const nextIndex = nextUnresolvedPhaseIndex(scenario);
  const introTitle = fullRun ? 'Your full-run recovery' : (resolvedCount === 1 ? 'First mission complete' : `Checkpoint after ${resolvedCount} missions`);
  const introCopy = fullRun ? 'Review your result, compare it with the benchmark path, and then move into advanced practice.' : (resolvedCount === 1 ? 'You have completed one full mission and unlocked the full educational experience. Most learners can stop here, review what happened, and move into advanced practice. Continuing deeper into the lifecycle is optional.' : 'You have already received the full educational experience. Additional repaired phases deepen repetition and pattern recognition, but they are optional.' );
  const primaryAction = fullRun ? '<button class="primary" data-stage="advanced">Open advanced practice</button>' : `<button class="primary" data-stage="advanced">Open advanced practice</button><button class="ghost" id="continueLifecycleMission">Continue to Phase ${nextIndex + 1}</button>`;
  const reviewCards = (fullRun ? scenario.phases : resolvedPhases).map(phase => {
      const record = ensureRecord(phase.key);
      const best = bestReviewForPhase(phase, record);
      return `<article class="phase-card"><p class="small-label">${escapeHtml(phase.name)}</p><h4>${escapeHtml(phase.artifact)}</h4><p><strong>Your diagnosis:</strong> ${escapeHtml(phase.hypotheses[record.hypothesisIndex].title)}</p><p><strong>Your repair:</strong> ${escapeHtml(phase.interventions[record.interventionIndex].title)}</p><p class="muted">${escapeHtml(best.gapText)}</p></article>`;
    }).join('');
  const previewNotice = fullRun ? '' : `<div class="selected-explainer" style="margin-top:1rem"><p class="small-label">Lifecycle preview</p><p>You repaired ${resolvedCount} of ${scenario.phases.length} phases. The benchmark below shows the strongest full seven-phase path as a preview, but you do not need to finish all seven phases to get value from this app.</p></div>`;
  root.innerHTML = `
    <div class="section-head"><div><p class="label">Run review</p><h2>${introTitle}</h2><p class="screen-lead">${introCopy}</p></div><div class="screen-actions"><span class="score-badge">Composite ${score}</span><span class="chip ${gap <= 12 ? 'ok' : 'warn'}">Benchmark ${benchmark.composite}</span></div></div>
    <div class="review-grid">
      <section class="phase-card">
        <p class="small-label">Current result</p>
        <div class="metric-stack">
          ${metricBar('Quality', m.quality, 'success')}
          ${metricBar('Risk', 100 - m.risk, 'warn')}
          ${metricBar('Readiness', m.readiness, 'success')}
          ${metricBar('Mastery', m.mastery, '')}
        </div>
        <p style="margin-top:1rem"><strong>Readiness label:</strong> ${masteryLabel(m.mastery)}</p>
        <p class="muted">${benchmarkGapNarrative(score, benchmark.composite, gap)}</p>
        <div class="option-actions">${primaryAction}<button class="ghost" data-save-slot="A">Save to Replay A</button><button class="ghost" data-save-slot="B">Save to Replay B</button></div>
      </section>
      <section class="phase-card">
        <p class="small-label">Benchmark path</p>
        <div class="metric-stack">
          ${metricBar('Quality', benchmark.metrics.quality, 'success')}
          ${metricBar('Risk', 100 - benchmark.metrics.risk, 'warn')}
          ${metricBar('Readiness', benchmark.metrics.readiness, 'success')}
          ${metricBar('Mastery', benchmark.metrics.mastery, '')}
        </div>
        <p style="margin-top:1rem"><strong>Gap:</strong> ${gap} points</p>
      </section>
    </div>
    ${previewNotice}
    <div class="scenario-grid" style="margin-top:1rem">${reviewCards}</div>`;
}
function renderAdvancedStage(scenario){
  const root = document.getElementById('advancedStage');
  const visible = state.activeStage === 'advanced' && !!scenario && reviewUnlocked();
  root.classList.toggle('hidden', !visible);
  if(!visible){ root.innerHTML = ''; return; }
  const m = metrics();
  const runScore = compositeScore(m);
  const drift = ensureDriftState(scenario.id);
  const selectedOption = drift.optionIndex !== null ? scenario.driftOptions?.[drift.optionIndex] : null;
  const branch = selectedOption ? buildDriftBranches(scenario, selectedOption) : null;
  const selectedFollowup = branch && drift.followupIndex !== null ? branch.followups[drift.followupIndex] : null;
  root.innerHTML = `
    <div class="section-head"><div><p class="label">Advanced practice</p><h2>Drift and Replay Lab</h2><p class="screen-lead">These tools keep the same content but move it into a dedicated advanced-practice stage after the first completed mission. Additional lifecycle phases remain optional.</p></div><div class="screen-actions"><button class="ghost" data-stage="review">Back to run review</button></div></div>
    <div class="advanced-grid">
      <section class="drift-card">
        <p class="small-label">Drift lab</p>
        <h4>${escapeHtml(scenario.drillPrompt)}</h4>
        <div class="choice-grid one-up">${(scenario.driftOptions || []).map((option, index) => `
          <button class="option-card ${drift.optionIndex === index ? 'selected' : ''}" data-drift-index="${index}">
            <span class="choice-tag">Response ${index + 1}</span>
            <strong>${escapeHtml(option.title)}</strong>
            <span class="muted">${escapeHtml(option.summary)}</span>
          </button>`).join('')}</div>
        <div class="option-actions" style="margin-top:1rem"><button class="primary" id="runDrift" ${selectedOption ? '' : 'disabled'}>Evaluate drift response</button><button class="ghost" id="resetDrift">Reset drift</button></div>
        ${drift.resolved && selectedOption ? `<div class="drift-result"><p class="small-label">Drift result</p><h4>${escapeHtml(selectedOption.feedback)}</h4><p><strong>Score:</strong> ${drift.score}</p><p>${escapeHtml(selectedOption.lesson)}</p></div>` : ''}
        ${branch && drift.resolved ? `<div class="drift-card" style="margin-top:1rem"><p class="small-label">Branching drift outcome</p><h4>${escapeHtml(branch.title)}</h4><p>${escapeHtml(branch.summary)}</p><div class="choice-grid one-up">${branch.followups.map((followup, index) => `
            <button class="option-card ${drift.followupIndex === index ? 'selected' : ''}" data-followup-index="${index}">
              <span class="choice-tag">Branch ${index + 1}</span>
              <strong>${escapeHtml(followup.title)}</strong>
              <span class="muted">${escapeHtml(followup.summary)}</span>
            </button>`).join('')}</div><div class="option-actions" style="margin-top:1rem"><button class="primary" id="resolveDriftBranch" ${selectedFollowup ? '' : 'disabled'}>Resolve branch</button></div>${drift.finalResolved && selectedFollowup ? `<div class="drift-result"><h4>${escapeHtml(branchVerdict(drift.finalScore))}</h4><p>${escapeHtml(selectedFollowup.narrative)}</p><p><strong>Final score:</strong> ${drift.finalScore}</p><p class="muted">${escapeHtml(selectedFollowup.lesson)}</p></div>` : ''}</div>` : ''}
      </section>
      <section class="drift-card">
        <p class="small-label">Replay Lab</p>
        <div class="replay-grid">${['A','B'].map(slot => {
          const snapshot = state.replaySlots[slot];
          const perf = slotPerformance(snapshot);
          return snapshot ? `<article class="replay-slot"><h4>Run ${slot}</h4><p><strong>Case:</strong> ${escapeHtml(snapshot.caseTitle)}</p><p><strong>Saved:</strong> ${new Date(snapshot.savedAt).toLocaleString()}</p><p><strong>Composite:</strong> ${compositeScore(snapshot.metrics)}</p><p class="muted">Best diagnosis matches: ${perf.diagnosisAligned}/${perf.total}<br>Best repair matches: ${perf.repairAligned}/${perf.total}</p><div class="option-actions"><button class="ghost" data-clear-slot="${slot}">Clear slot</button></div></article>` : `<article class="replay-slot empty"><h4>Run ${slot}</h4><p class="muted">Empty slot</p><div class="option-actions"><button class="ghost" data-save-slot="${slot}">Save current run</button></div></article>`;
        }).join('')}</div>
      </section>
    </div>`;
}
function runDriftResponse(){
  const s = selectedScenario();
  if(!s || !reviewUnlocked()) return;
  const drift = ensureDriftState(s.id);
  if(drift.optionIndex === null) return;
  drift.resolved = true;
  drift.score = driftScore(s.driftOptions[drift.optionIndex], compositeScore(metrics()));
  drift.followupIndex = null;
  drift.finalResolved = false;
  drift.finalScore = null;
  saveState(); render();
}
function resolveDriftBranch(){
  const s = selectedScenario();
  if(!s || !reviewUnlocked()) return;
  const drift = ensureDriftState(s.id);
  if(drift.optionIndex === null) return;
  const option = s.driftOptions[drift.optionIndex];
  const branch = buildDriftBranches(s, option);
  if(drift.followupIndex === null || !branch.followups[drift.followupIndex]) return;
  const followup = branch.followups[drift.followupIndex];
  drift.finalResolved = true;
  drift.finalScore = Math.max(0, Math.min(100, drift.score + followup.scoreDelta));
  saveState(); render();
}
function activeStageElement(){
  if(state.activeStage === 'clinic') return document.getElementById('clinicStage');
  return document.getElementById('setupStage');
}
function resetViewportForStage(){
  if(!pendingViewportReset) return;
  const target = activeStageElement();
  pendingViewportReset = null;
  if(!target) return;
  requestAnimationFrame(() => {
    const rect = target.getBoundingClientRect();
    const top = window.scrollY + rect.top - 10;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  });
}
function focusDownwardTarget(){
  if(!pendingDownwardFocusTarget) return;
  const targetId = pendingDownwardFocusTarget;
  pendingDownwardFocusTarget = null;
  requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if(!target) return;
    const rect = target.getBoundingClientRect();
    const visibleTop = 20;
    const visibleBottom = window.innerHeight - 24;
    if(rect.top >= visibleTop && rect.bottom <= visibleBottom) return;
    const desiredViewportTop = Math.max(120, Math.floor(window.innerHeight * 0.68));
    const desiredTop = window.scrollY + rect.top - desiredViewportTop;
    if(desiredTop > window.scrollY){
      window.scrollTo({ top: desiredTop, behavior: 'smooth' });
    }
  });
}

function render(){
  const scenario = selectedScenario();
  const phase = activePhase();
  const record = phase ? ensureRecord(phase.key) : null;
  document.body.classList.toggle('dark', localStorage.getItem('app_theme') === 'dark');
  document.getElementById('versionPill').textContent = APP.version = 'v26';
  document.getElementById('environmentPill').textContent = envLabel();
  renderStageTabs(scenario);
  renderCaseSnapshot(scenario);
  renderMissionMap(scenario);
  renderArtifactSnapshot(phase, record);
  renderSupportSurface(scenario, phase, record || {});
  renderLiveResults(scenario);
  renderSystemPulse(scenario);
  renderNotebook(scenario);
  renderSetupStage(scenario);
  renderClinicStage(scenario);
  const reviewRoot = document.getElementById('reviewStage'); if(reviewRoot) { reviewRoot.classList.add('hidden'); reviewRoot.innerHTML=''; }
  const advancedRoot = document.getElementById('advancedStage'); if(advancedRoot) { advancedRoot.classList.add('hidden'); advancedRoot.innerHTML=''; }
  resetViewportForStage();
  focusDownwardTarget();
}

function bind(){
  document.addEventListener('click', (e) => {
    const stageBtn = e.target.closest('[data-stage]');
    if(stageBtn){ setStage(stageBtn.dataset.stage); return; }
    const scenarioBtn = e.target.closest('[data-select-scenario]');
    if(scenarioBtn){ selectScenario(scenarioBtn.dataset.selectScenario); return; }
    const phaseBtn = e.target.closest('[data-phase-index]');
    if(phaseBtn){ openPhase(Number(phaseBtn.dataset.phaseIndex)); return; }
    const choiceBtn = e.target.closest('[data-choice-kind]');
    if(choiceBtn){ pickChoice(choiceBtn.dataset.choiceKind, Number(choiceBtn.dataset.choiceIndex)); return; }
    const screenBtn = e.target.closest('[data-go-screen]');
    if(screenBtn){ goToScreen(Number(screenBtn.dataset.goScreen)); return; }
    const saveBtn = e.target.closest('[data-save-slot]');
    if(saveBtn){ saveReplay(saveBtn.dataset.saveSlot); return; }
    const clearBtn = e.target.closest('[data-clear-slot]');
    if(clearBtn){ clearReplay(clearBtn.dataset.clearSlot); return; }
    const driftBtn = e.target.closest('[data-drift-index]');
    if(driftBtn){ const s=selectedScenario(); if(!s || !reviewUnlocked()) return; const drift=ensureDriftState(s.id); drift.optionIndex=Number(driftBtn.dataset.driftIndex); drift.resolved=false; drift.score=null; drift.followupIndex=null; drift.finalResolved=false; drift.finalScore=null; saveState(); render(); return; }
    const followBtn = e.target.closest('[data-followup-index]');
    if(followBtn){ const s=selectedScenario(); if(!s || !reviewUnlocked()) return; const drift=ensureDriftState(s.id); drift.followupIndex=Number(followBtn.dataset.followupIndex); drift.finalResolved=false; drift.finalScore=null; saveState(); render(); return; }
    if(e.target.id === 'deckNext'){ advanceDeck(); return; }
    if(e.target.id === 'deckBack'){ retreatDeck(); return; }
    if(e.target.id === 'continueLifecycleMission'){ continueLifecycleMission(); return; }
    if(e.target.id === 'runDrift'){ runDriftResponse(); return; }
    if(e.target.id === 'resetDrift'){ const s=selectedScenario(); if(!s) return; state.driftByScenario[s.id] = { optionIndex:null, resolved:false, score:null, followupIndex:null, finalResolved:false, finalScore:null }; saveState(); render(); return; }
    if(e.target.id === 'resolveDriftBranch'){ resolveDriftBranch(); return; }
    if(e.target.id === 'themeToggle'){ document.body.classList.toggle('dark'); localStorage.setItem('app_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); return; }
    if(e.target.id === 'resetRun'){ localStorage.removeItem(`lfc_state_${STORAGE_VERSION}`); Object.assign(state, freshState()); saveState(); render(); return; }
  });
}

bind();
render();
