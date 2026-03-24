const fs = require('fs');
const src = fs.readFileSync('assets/app.js','utf8');
const html = fs.readFileSync('index.html','utf8');

const results = [];
function test(name, fn){
  try { fn(); results.push({name, ok:true}); }
  catch (err) { results.push({name, ok:false, error: err.message}); }
}
function assert(cond, msg){ if(!cond) throw new Error(msg); }

const checks = [
  ['version updated to v17', /version:\s*'v17'/.test(src)],
  ['storage key updated to v17', /storageKey:\s*'lfc_state_v17'/.test(src)],
  ['diagnosis panel anchor exists', /id="phaseDiagnosisPanel"/.test(html)],
  ['repair panel anchor exists', /id="phaseRepairPanel"/.test(html)],
  ['clinic scroll target maps diagnosis list to diagnosis panel', /if\(el\.id === 'hypothesisList'\) return document\.getElementById\('phaseDiagnosisPanel'\)/.test(src)],
  ['clinic scroll target maps repair controls to repair panel', /if\(el\.id === 'interventionList' \|\| el\.id === 'runRepair'\) return document\.getElementById\('phaseRepairPanel'\)/.test(src)],
  ['diagnosis selection scrolls to repair panel', /if\(kind==='hypothesis'\) return scrollToId\('phaseRepairPanel', \{ extraOffset: 12 \}\);/.test(src)],
  ['header advance uses diagnosis panel first', /if\(r\.hypothesisIndex === null\) return scrollToId\('phaseDiagnosisPanel'\);/.test(src)],
  ['header advance uses repair panel second', /if\(r\.interventionIndex === null\) return scrollToId\('phaseRepairPanel', \{ extraOffset: 12 \}\);/.test(src)],
  ['right rail guidance is step aware', /const supportMode = !record \|\| record\.hypothesisIndex === null/.test(src)]
];

for (const [name, pass] of checks) {
  test(name, ()=> assert(pass, `missing pattern: ${name}`));
}

const summary = { version:'v17', passed: results.every(r => r.ok), results };
fs.writeFileSync('tests/smoke/lfc-v17-scroll-check-results.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if(!summary.passed) process.exit(1);
