import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { APP_VERSION, createInitialLauncherFilters, createInitialRunState, createInitialState } from "../../assets/js/state/store.js";
import { completeRunAction, resetCurrentRunAction, setCheckSelectionAction, startScenarioAction, toggleMonitoringAction } from "../../assets/js/state/actions.js";
import { validateScenarioCollection } from "../../assets/js/domain/scenarioValidation.js";
import { loadScenarioContent } from "../../assets/js/domain/scenarioLoader.js";
import { scoreScenario } from "../../assets/js/metrics/scoring.js";
import { buildComparisonPacket, getCoachingMessage } from "../../assets/js/domain/comparisonEngine.js";
import { buildCheckStudyGuide, buildScenarioCoaching } from "../../assets/js/domain/coachingGuide.js";
import { buildDebrief } from "../../assets/js/domain/debriefBuilder.js";
import { analyzeExternalOutput } from "../../assets/js/domain/externalAnalysis.js";
import { filterScenarios } from "../../assets/js/domain/launcherCatalog.js";

const dataRoot = path.resolve(process.cwd(), "assets/data");
const registry = JSON.parse(await fs.readFile(path.join(dataRoot, "scenario-registry.json"), "utf8"));
const glossary = JSON.parse(await fs.readFile(path.join(dataRoot, "glossary.json"), "utf8"));
const packPayloads = await Promise.all(registry.packs.map(async (pack) => JSON.parse(await fs.readFile(path.resolve(process.cwd(), pack.file), "utf8"))));
const validated = validateScenarioCollection({ registry, packPayloads, glossary });
assert.equal(APP_VERSION, "v15.0.0");
assert.equal(validated.registry.packs.length, 2);
assert.equal(validated.scenarios.length, 6);

const originalFetch = global.fetch;
global.fetch = async (resource) => {
  const normalized = String(resource).replace(/^\.\//, "");
  const file = path.resolve(process.cwd(), normalized);
  try {
    const raw = await fs.readFile(file, "utf8");
    return { ok: true, status: 200, async json(){return JSON.parse(raw);}, async text(){return raw;} };
  } catch {
    return { ok: false, status: 404, async json(){ throw new Error(`Missing test fixture: ${file}`); }, async text(){ return ""; } };
  }
};
const loadedViaLoader = await loadScenarioContent();
assert.equal(loadedViaLoader.scenarios.length, 6);
global.fetch = originalFetch;

const byId = Object.fromEntries(validated.scenarios.map((scenario) => [scenario.id, scenario]));
const hrScenario = byId["hr-policy-citations"];
const supportScenario = byId["support-triage-summary"];
const complianceScenario = byId["compliance-refusal-boundary"];
const vendorScenario = byId["vendor-risk-softening"];
const safetyScenario = byId["field-safety-escalation-shortcut"];

const initial = createInitialState();
assert.equal(initial.run.route, "launcher");
let state = { launcherFilters: createInitialLauncherFilters(), run: createInitialRunState() };
state = startScenarioAction(supportScenario.id)(structuredClone(state));
state = setCheckSelectionAction("preserve-core-issue", "held")(structuredClone(state));
state = toggleMonitoringAction(supportScenario.monitoringFollowUps[0], true)(structuredClone(state));
state = resetCurrentRunAction()(structuredClone(state));
assert.equal(Object.keys(state.run.checkSelections).length, 0);

const strongRun = { checkSelections: { "preserve-core-issue": "held", "keep-evidence": "held", "retain-escalation": "held", "improve-scanability": "improved" }, decision: "Release", monitoring: [supportScenario.monitoringFollowUps[0], supportScenario.monitoringFollowUps[1]], pastebackOutput: "" };
const strongScore = scoreScenario(supportScenario, strongRun);
assert.equal(strongScore.correctDecision, "Release");

const riskyRun = { checkSelections: { "cite-source": "improved", "preserve-exception-language": "held", "maintain-escalation": "held", "improve-readability": "improved" }, decision: "Release", monitoring: [], pastebackOutput: "" };
const riskyScore = scoreScenario(hrScenario, riskyRun);
assert.equal(riskyScore.correctDecision, "Iterate");

const externalAnalysis = analyzeExternalOutput(complianceScenario, "Do not paste customer data into unapproved external AI tools. Use the approved secure workspace and escalate unusual cases to Security Operations.");
assert.ok(externalAnalysis.score >= 80);
const vendorExternalAnalysis = analyzeExternalOutput(vendorScenario, "Conditional renewal only after the unresolved control is cleared, the missing audit artifact is attached, and the risk committee approves any exception. Document the follow-up owner before release.");
assert.ok(vendorExternalAnalysis.score >= 80);

const safetyScore = scoreScenario(safetyScenario, { checkSelections: { "preserve-stop-work": "weakened", "keep-isolate-step": "tradeoff", "preserve-supervisor-escalation": "weakened", "improve-mobile-clarity": "improved" }, decision: "Hold", monitoring: [safetyScenario.monitoringFollowUps[0]], pastebackOutput: "" });
assert.equal(safetyScore.correctDecision, "Hold");
assert.ok(buildComparisonPacket(vendorScenario).includes(vendorScenario.title));
assert.ok(getCoachingMessage(hrScenario, { totalReviewed: 4, correctReviewed: 1, decision: "Release", correctDecision: "Iterate", monitoringCount: 0, externalAnalysis: { score: 78, label: "Usable", summary: "Anchors preserved." } }).includes("Iterate"));

const debrief = buildDebrief({ scenario: supportScenario, scoredState: strongScore, learnerSelections: strongRun.checkSelections });
assert.equal(debrief.matrix.length, 4);
assert.ok(Array.isArray(debrief.practiceNext));
const coachingPanel = buildScenarioCoaching(safetyScenario, safetyScore, { checkSelections: { "preserve-stop-work": "weakened" }, decision: null, monitoring: [] });
assert.ok(coachingPanel.bullets.length >= 1);
const studyGuide = buildCheckStudyGuide(safetyScenario.standingChecks[0], "held");
assert.ok(studyGuide.strongestRead.includes("Strongest practice"));
assert.equal(filterScenarios(validated.scenarios, { pack: "Optional Challenge Pack", sort: "title" }).length, 2);
assert.equal(filterScenarios(validated.scenarios, { difficulty: "Foundational", sort: "recommended" }).every((row) => row.scenario.difficulty === "Foundational"), true);

const completionState = completeRunAction({ finalizedAt: "2026-04-03T12:00:00.000Z" })({ launcherFilters: createInitialLauncherFilters(), run: { ...createInitialRunState(), scenarioId: supportScenario.id, decision: "Release", monitoring: [supportScenario.monitoringFollowUps[0]] } });
assert.equal(completionState.run.route, "debrief");
assert.equal(completionState.run.completed, true);

for (const file of [
  "index.html",
  "help.html",
  "feedback.html",
  "assets/js/app.js",
  "assets/js/domain/launcherCatalog.js",
  "assets/js/ui/render.js"
]) {
  const raw = await fs.readFile(path.resolve(process.cwd(), file), "utf8");
  assert.ok(raw.length > 0);
}

const indexHtml = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf8");
assert.ok(!indexHtml.includes("qa.html"));
assert.ok(!indexHtml.includes("Download debrief"));
assert.ok(!indexHtml.includes("Resume last run"));
assert.ok(!indexHtml.includes("Clear saved progress"));
assert.ok(!indexHtml.includes("Replay analytics"));
assert.ok(!indexHtml.includes("Replay and history"));
const workspaceViewJs = await fs.readFile(path.resolve(process.cwd(), "assets/js/ui/workspaceView.js"), "utf8");
assert.ok(workspaceViewJs.includes("Interpretation help"));
const appJs = await fs.readFile(path.resolve(process.cwd(), "assets/js/app.js"), "utf8");
assert.ok(appJs.includes("focusRouteHeading"));
assert.ok(indexHtml.includes("practice-next"));
assert.ok(indexHtml.includes("mission-jump"));
assert.ok(indexHtml.includes("launcher-results-count"));

console.log("module_tests_passed");
console.log(JSON.stringify({
  version: APP_VERSION,
  scenarioCount: validated.scenarios.length,
  strongAverage: strongScore.average,
  riskyAverage: riskyScore.average,
  safetyAverage: safetyScore.average,
  vendorExternalFit: vendorExternalAnalysis.score
}, null, 2));
