import { loadConfig, loadScenarioIndex, loadScenarioPack } from "../../domain/content.js";
import { calculateMetrics } from "../../domain/scoring.js";
import { analyzeObservedOutput } from "../../domain/review.js";
import { buildDetailedComparison } from "../../domain/comparison.js";
import { buildLearnerArtifactText } from "../../domain/artifact.js";
import { applyCounterfactualDefinition, compileScenarioCollection, createRunFromStrongest } from "../../domain/scenario-engine.js";
import { loadJson } from "../shared/utils.js";

const LABS_STATE_KEY = "ces_innovation_labs_state_v1";

function buildObservedOutput(scenario) {
  const rubric = scenario.reviewRubric || {};
  const headings = rubric.formatMarkers || ["Assessment", "Missing Information", "Next Step"];
  const required = rubric.requiredPhrases || ["policy", "missing", "next step"];
  return `${headings.map((heading) => `${heading}:`).join("\n")}\n${required.join(" ")}`;
}

function buildFallbackRun(scenario, config, mode = "demo-flawed") {
  if (mode === "demo-strongest") return createRunFromStrongest(scenario, config);
  const counter = scenario.counterfactuals?.[0];
  if (counter) return applyCounterfactualDefinition(scenario, counter, config);
  return createRunFromStrongest(scenario, config);
}

function normalizeCurrentRun(run, scenario, config) {
  if (!run || run.scenarioId !== scenario.id) return null;
  return {
    ...run,
    sections: run.sections || createRunFromStrongest(scenario, config).sections,
    precedenceRule: run.precedenceRule || scenario.options?.precedenceRules?.[0]?.id || scenario.strongestPractice?.precedenceRule || "",
    outputOption: run.outputOption || scenario.options?.outputOptions?.[0]?.id || scenario.strongestPractice?.outputOption || "",
    missingInfoHandling: run.missingInfoHandling || scenario.options?.handlingOptions?.[0]?.id || scenario.strongestPractice?.missingInfoHandling || "",
    observedOutput: run.observedOutput || buildObservedOutput(scenario),
    predictions: run.predictions || []
  };
}

function buildClaimLedger(scenario, run, metrics, reviewResult) {
  const refs = scenario.blocks.filter((block) => block.type === "REFERENCE").slice(0, 3);
  const facts = scenario.blocks.filter((block) => block.type === "DYNAMIC FACTS").slice(0, 1);
  const claims = [
    {
      id: "claim-separation",
      title: "The envelope separates stable instructions from changing run facts.",
      status: metrics.metrics.structureClarity >= 75 ? "supported" : "weak",
      reason: metrics.metrics.structureClarity >= 75 ? "Section separation is visibly legible." : "The current envelope still mixes jobs that should stay reviewable.",
      evidence: refs.slice(0, 1).map((item) => item.label),
      ruleSource: "Section structure",
      section: "ROLE → CHECKS"
    },
    {
      id: "claim-precedence",
      title: `Precedence rule: ${run.precedenceRule || "not stated"}`,
      status: metrics.metrics.precedenceExplicitness >= 75 ? "supported" : "weak",
      reason: metrics.metrics.precedenceExplicitness >= 75 ? "A reviewer can see what wins when sources conflict." : "Conflict handling still relies on the model guessing.",
      evidence: refs.slice(0, 2).map((item) => item.label),
      ruleSource: "RULES / CHECKS",
      section: "RULES"
    },
    {
      id: "claim-output",
      title: `Output contract: ${run.outputOption || "not selected"}`,
      status: metrics.metrics.outputUsability >= 72 ? "supported" : "weak",
      reason: metrics.metrics.outputUsability >= 72 ? "The response format is reviewable across runs." : "The output contract is still too loose for consistent review.",
      evidence: scenario.blocks.filter((block) => block.type === "OUTPUT").slice(0, 1).map((item) => item.label),
      ruleSource: "OUTPUT",
      section: "OUTPUT"
    },
    {
      id: "claim-missing",
      title: `Missing-information behavior: ${run.missingInfoHandling || "not selected"}`,
      status: metrics.metrics.handlingReadiness >= 70 ? "supported" : "conflicted",
      reason: metrics.metrics.handlingReadiness >= 70 ? "The package tells the model what to do when evidence is incomplete." : "Uncertainty handling is still easy to miss or override.",
      evidence: facts.map((item) => item.label),
      ruleSource: "CHECKS",
      section: "CHECKS"
    },
    {
      id: "claim-grounding",
      title: "The observed answer remains grounded in approved evidence.",
      status: reviewResult?.scores?.groundedness >= 70 ? "supported" : "conflicted",
      reason: reviewResult?.scores?.groundedness >= 70 ? "The observed answer reflects the package evidence." : "The answer drifted away from the supplied evidence or left too much unsaid.",
      evidence: refs.map((item) => item.label),
      ruleSource: "REFERENCE",
      section: "REFERENCE"
    }
  ];
  return claims;
}

function buildTrajectory(scenario, run, metrics, comparison, reviewResult) {
  const placedCount = Object.values(run.sections || {}).reduce((sum, items) => sum + items.length, 0);
  return [
    {
      phase: "Discovery",
      title: "Mission frame established",
      summary: `Scenario: ${scenario.title}`,
      signal: scenario.learningObjective || scenario.chapterConcept,
      status: "pass"
    },
    {
      phase: "Selection",
      title: "Selected material loaded",
      summary: `${scenario.blocks.length} authored content blocks available for shaping.`,
      signal: `${scenario.blocks.filter((block) => block.type === "REFERENCE").length} evidence blocks in play`,
      status: "pass"
    },
    {
      phase: "Shaping",
      title: "Envelope assembled",
      summary: `${placedCount} block placements; composite score ${metrics.composite}.`,
      signal: comparison.summary || metrics.narrativeSummary,
      status: metrics.composite >= 75 ? "pass" : "warn"
    },
    {
      phase: "Execution",
      title: "Operational choices declared",
      summary: `Precedence: ${run.precedenceRule || "not set"}; missing-info behavior: ${run.missingInfoHandling || "not set"}.`,
      signal: metrics.nextBestActions?.[0] || "Strengthen run protocol before the external step.",
      status: run.precedenceRule && run.missingInfoHandling ? "pass" : "warn"
    },
    {
      phase: "Evaluation",
      title: "Observed output inspected",
      summary: reviewResult?.summary || "No observed output was analyzed yet.",
      signal: `${reviewResult?.scores?.groundedness || 0}% groundedness / ${reviewResult?.scores?.formatFit || 0}% format fit`,
      status: (reviewResult?.scores?.groundedness || 0) >= 70 ? "pass" : "warn"
    },
    {
      phase: "Iteration",
      title: "Next-best revision identified",
      summary: metrics.nextBestActions?.[0] || "No targeted revision surfaced yet.",
      signal: metrics.warnings?.[0] || "Current package is stable enough for the next rep.",
      status: metrics.warnings?.length ? "warn" : "pass"
    },
    {
      phase: "Deployment",
      title: "Handoff readiness snapshot",
      summary: metrics.metrics.operationalReadiness >= 70 ? "Another reviewer could understand this package quickly." : "The package still relies on the original designer to interpret it.",
      signal: scenario.strongestPractice?.rationale?.CHECKS || "Make operational handling explicit.",
      status: metrics.metrics.operationalReadiness >= 70 ? "pass" : "fail"
    }
  ];
}

function buildFirewallCases(scenario, run, metrics) {
  const refs = scenario.blocks.filter((block) => block.type === "REFERENCE");
  return [
    {
      id: "stale-policy",
      title: "Stale policy snippet injected",
      threat: "An older shortcut note enters the REFERENCE stack and competes with the source of record.",
      blastRadius: metrics.metrics.precedenceExplicitness >= 75 ? "Contained" : "High",
      recommendation: "Keep the current source of record named explicitly and state what wins when the shortcut conflicts.",
      affectedBlocks: refs.slice(0, 2).map((item) => item.label)
    },
    {
      id: "prompt-injection",
      title: "Borrowed text tries to act like instructions",
      threat: "Copied user or vendor text contains hidden instructions that could jump trust boundaries.",
      blastRadius: metrics.metrics.structureClarity >= 75 ? "Moderate" : "High",
      recommendation: "Label borrowed text as evidence or input, not authority, and keep rules isolated.",
      affectedBlocks: scenario.blocks.filter((block) => block.trustLevel !== "trusted").slice(0, 2).map((item) => item.label)
    },
    {
      id: "tool-return",
      title: "Tool or retrieval result overrides current-state facts",
      threat: "A fetched snippet looks fresh but bypasses the visible DYNAMIC FACTS block.",
      blastRadius: metrics.metrics.handlingReadiness >= 70 ? "Contained" : "Moderate",
      recommendation: "Promote changing facts into a dedicated current-state block and route conflicts through CHECKS.",
      affectedBlocks: scenario.blocks.filter((block) => block.type === "DYNAMIC FACTS" || block.type === "CHECKS").slice(0, 2).map((item) => item.label)
    }
  ];
}

function buildPromptCard(context) {
  const { scenario, run, metrics, reviewResult, claimLedger } = context;
  return `# Prompt Card — ${scenario.title}

## Purpose
${scenario.learningObjective || scenario.chapterConcept}

## Intended use
A short Chapter 3 shaping lab that teaches section separation, ordering, precedence, and reviewable CHECKS.

## Envelope decisions
- Precedence rule: ${run.precedenceRule || "Not set"}
- Output contract: ${run.outputOption || "Not set"}
- Missing-information handling: ${run.missingInfoHandling || "Not set"}
- Composite score: ${metrics.composite}
- Readiness: ${metrics.readiness}

## Guardrails
- Keep stable instructions separate from evidence and current-state facts.
- Treat retrieved or copied material as evidence, not as authority.
- Use CHECKS to state what happens when evidence is missing or conflicting.

## Evaluation snapshot
- Groundedness: ${reviewResult?.scores?.groundedness || 0}
- Format fit: ${reviewResult?.scores?.formatFit || 0}
- Constraint fit: ${reviewResult?.scores?.constraintFit || 0}

## Claim ledger summary
${claimLedger.map((claim) => `- ${claim.title} — ${claim.status.toUpperCase()} — ${claim.reason}`).join("\n")}
`;
}

export async function buildLabContext({ scenarioId = "", sourceMode = "auto" } = {}) {
  const config = await loadConfig();
  const scenarioIndex = await loadScenarioIndex();
  const rawScenarios = {};
  for (const item of scenarioIndex.scenarios) rawScenarios[item.id] = await loadScenarioPack(item.id);
  const scenarios = compileScenarioCollection(rawScenarios, config);
  const savedState = loadJson(LABS_STATE_KEY, { sourceMode: "auto", scenarioId: scenarioIndex.scenarios[0]?.id || "" });
  const currentRun = loadJson(config.storageKeys.runState, null);
  const history = loadJson(config.storageKeys.history, []);

  const resolvedScenarioId = scenarioId || savedState.scenarioId || currentRun?.scenarioId || scenarioIndex.scenarios[0]?.id;
  const scenario = scenarios[resolvedScenarioId] || scenarios[scenarioIndex.scenarios[0]?.id];
  const mode = sourceMode === "auto"
    ? (currentRun?.scenarioId === scenario.id ? "current-run" : "demo-flawed")
    : sourceMode;
  const run = mode === "current-run"
    ? (normalizeCurrentRun(currentRun, scenario, config) || buildFallbackRun(scenario, config, "demo-flawed"))
    : buildFallbackRun(scenario, config, mode);
  if (!run.observedOutput) run.observedOutput = buildObservedOutput(scenario);
  if (!run.scenarioId) run.scenarioId = scenario.id;
  const strongestRun = createRunFromStrongest(scenario, config);
  const metrics = calculateMetrics(scenario, run, config);
  const strongestMetrics = calculateMetrics(scenario, strongestRun, config);
  const reviewResult = analyzeObservedOutput(scenario, run, metrics, run.observedOutput);
  const comparison = buildDetailedComparison(scenario, run, config);
  const artifactText = buildLearnerArtifactText(scenario, run, metrics, reviewResult, config, null);
  const claimLedger = buildClaimLedger(scenario, run, metrics, reviewResult);
  const trajectory = buildTrajectory(scenario, run, metrics, comparison, reviewResult);
  const firewallCases = buildFirewallCases(scenario, run, metrics);
  const promptCard = buildPromptCard({ scenario, run, metrics, reviewResult, claimLedger });

  loadJson; // keep tree-shaking honest for static module import use

  return {
    config,
    scenarioIndex,
    scenarios,
    scenario,
    run,
    strongestRun,
    metrics,
    strongestMetrics,
    reviewResult,
    comparison,
    artifactText,
    claimLedger,
    trajectory,
    firewallCases,
    promptCard,
    history,
    labsStateKey: LABS_STATE_KEY,
    sourceMode: mode,
    savedState,
    optionLabels: {
      precedence: scenario.options?.precedenceRules || [],
      output: scenario.options?.outputOptions || [],
      handling: scenario.options?.handlingOptions || []
    }
  };
}
