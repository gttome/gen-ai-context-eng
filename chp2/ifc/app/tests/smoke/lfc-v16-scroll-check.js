const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync('assets/app.js','utf8');
const match = src.match(/function scrollElement\(el, offset = 0, options = \{\}\)\{([\s\S]*?)\n\}/);
if(!match) throw new Error('scrollElement function not found');
const fnSource = `function scrollElement(el, offset = 0, options = {}) {${match[1]}\n}`;

let lastScroll = null;
const context = {
  window: {
    scrollY: 1500,
    scrollTo: args => { lastScroll = args; }
  }
};
vm.createContext(context);
vm.runInContext(`${fnSource}; this.scrollElement = scrollElement;`, context);

function fakeEl(top, hidden = false) {
  return {
    classList: { contains: cls => hidden && cls === 'hidden' },
    getBoundingClientRect: () => ({ top })
  };
}

const results = [];
function test(name, fn){
  try { fn(); results.push({name, ok:true}); }
  catch (err) { results.push({name, ok:false, error: err.message}); }
}
function assert(cond, msg){ if(!cond) throw new Error(msg); }

test('down-only ignores upward target', ()=>{
  lastScroll = null;
  const moved = context.scrollElement(fakeEl(-120), 260, { direction:'down-only', floorPadding:24 });
  assert(moved === false, 'expected false');
  assert(lastScroll === null, 'expected no scroll call');
});

test('down-only allows lower target', ()=>{
  lastScroll = null;
  const moved = context.scrollElement(fakeEl(900), 260, { direction:'down-only', floorPadding:24 });
  assert(moved === true, 'expected true');
  assert(lastScroll && lastScroll.top === 2140, `unexpected top ${lastScroll && lastScroll.top}`);
});

test('hidden target is ignored', ()=>{
  lastScroll = null;
  const moved = context.scrollElement(fakeEl(900, true), 260, { direction:'down-only', floorPadding:24 });
  assert(moved === false, 'expected hidden false');
  assert(lastScroll === null, 'expected no scroll call');
});

const stringChecks = [
  ['next-phase preserves clinic floor', /const previousY = window\.scrollY;[\s\S]*?preserveClinicFloor\(previousY\);[\s\S]*?scrollToPhaseTop\(\);/],
  ['runRepair flows to result panel', /function runRepair\([\s\S]*?scrollToId\('resultPanel'\);/],
  ['diagnosis selection flows to repair list', /if\(kind==='hypothesis'\) return scrollToId\('interventionList'\);/],
  ['scroll helper enforces down-only guard', /if\(targetTop <= visibleFloor\) return false;/],
  ['left and right step guide panels exist', /function renderGuides\(s\)/]
];
for (const [name, regex] of stringChecks) {
  test(name, ()=> assert(regex.test(src), `missing pattern: ${name}`));
}

const summary = { version: 'v16', passed: results.every(r => r.ok), results };
fs.writeFileSync('tests/smoke/lfc-v16-scroll-check-results.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if(!summary.passed) process.exit(1);
