import { compareToStrongest, strongestPracticeSequence } from "./envelope.js";

function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
function formatLabel(key) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (m) => m.toUpperCase()); }

function positionalPenalty(current, expected) {
  const currentPosition = Object.fromEntries(current.map((id, index) => [id, index]));
  let score = 100;
  let comparisons = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const blockId = expected[index];
    if (!(blockId in currentPosition)) { score -= 10; comparisons += 1; continue; }
    const diff = Math.abs(currentPosition[blockId] - index);
    score -= diff * 6;
    comparisons += 1;
  }
  if (!comparisons) return 0;
  return clamp(score);
}

export function calculateMetrics(scenario, runState, config) {
  const blockMap = Object.fromEntries(scenario.blocks.map((block) => [block.id, block]));
  const requiredSections = ["ROLE", "RULES", "REFERENCE", "DYNAMIC FACTS", "TASK", "OUTPUT", "CHECKS"];
  const sectionCounts = Object.fromEntries(config.sectionOrder.map((section) => [section, (runState.sections[section] || []).length]));
  let structure = 100;
  let balance = 100;
  const warnings = [];
  const strengths = [];
  const risks = [];
  const nextBestActions = [];

  for (const section of requiredSections) {
    if (!sectionCounts[section]) {
      structure -= 12;
      balance -= 10;
      warnings.push(`${section} is still empty.`);
      nextBestActions.push(`Place at least one appropriate block into ${section} so the envelope remains reviewable.`);
    }
  }

  for (const section of config.sectionOrder) {
    const items = runState.sections[section] || [];
    if (items.length > 4) {
      balance -= (items.length - 4) * 8;
      warnings.push(`${section} is overloaded for a short-session envelope.`);
      nextBestActions.push(`Trim or redistribute blocks from ${section} so the short-run package stays legible.`);
    }
    for (const blockId of items) {
      const block = blockMap[blockId];
      if (!block) continue;
      if (!block.acceptableSections.includes(section)) {
        structure -= 10;
        warnings.push(`${block.label} is likely misplaced in ${section}.`);
        nextBestActions.push(`Move ${block.label} into a section that matches its purpose instead of leaving unlike material mixed together.`);
      }
      if (block.freshnessCue === "stale" && section === "DYNAMIC FACTS") {
        structure -= 6;
        warnings.push(`${block.label} looks stale and should not masquerade as a current fact.`);
        nextBestActions.push(`Remove stale material from DYNAMIC FACTS and keep run-specific facts visibly separate from older notes.`);
      }
    }
  }

  const currentSequence = config.sectionOrder.flatMap((section) => runState.sections[section] || []);
  const expectedSequence = strongestPracticeSequence(scenario, config.sectionOrder);
  const orderingQuality = positionalPenalty(currentSequence, expectedSequence);
  const comparison = compareToStrongest(scenario, runState, config);

  const precedenceExplicitness = clamp((runState.precedenceRule === scenario.strongestPractice.precedenceRule ? 100 : runState.precedenceRule?.includes("implicit") || runState.precedenceRule === "unstated" || runState.precedenceRule === "no-precedence-stated" ? 25 : 45) - (comparison.diffs.some((diff) => diff.section === "RULES" || diff.section === "CHECKS") ? 5 : 0));
  const outputUsability = clamp((runState.outputOption === scenario.strongestPractice.outputOption ? 100 : 60) + (sectionCounts.OUTPUT ? 0 : -35) + (sectionCounts.TASK ? 0 : -10));
  const handlingReadiness = clamp((runState.missingInfoHandling === scenario.strongestPractice.missingInfoHandling ? 100 : runState.missingInfoHandling?.includes("guess") || runState.missingInfoHandling === "infer-best-answer" || runState.missingInfoHandling === "best-guess" ? 30 : 65) + (sectionCounts.CHECKS ? 0 : -35));
  const operationalReadiness = clamp((sectionCounts.CHECKS ? 20 : 0) + (sectionCounts.OUTPUT ? 15 : 0) + (sectionCounts.REFERENCE ? 15 : 0) + (sectionCounts["DYNAMIC FACTS"] ? 15 : 0) + (sectionCounts.RULES ? 10 : 0) + (orderingQuality / 4) + (precedenceExplicitness / 5));
  const structureClarity = clamp((structure * 0.8) + (balance * 0.2));

  if (runState.precedenceRule !== scenario.strongestPractice.precedenceRule) {
    warnings.push("The current precedence choice leaves the package more exposed to silent guesswork.");
    risks.push("Conflict handling is weaker than the strongest-practice pattern.");
    nextBestActions.push("Make source precedence explicit so the model does not have to improvise when policy text and weaker notes conflict.");
  } else strengths.push("Precedence is explicit instead of leaving the model to guess.");

  if (runState.outputOption === scenario.strongestPractice.outputOption) strengths.push("The output contract is reviewable and easy to score.");
  else {
    warnings.push("The current output mode is less reviewable than the strongest-practice option.");
    risks.push("Reviewers may struggle to compare runs consistently.");
    nextBestActions.push("Switch to a more reviewable output contract so later evaluation stays consistent across runs.");
  }

  if (runState.missingInfoHandling === scenario.strongestPractice.missingInfoHandling) strengths.push("The missing-information branch is operationally safe.");
  else {
    warnings.push("Missing-information handling is weaker than the recommended pattern.");
    risks.push("The model may over-answer when the package is incomplete.");
    nextBestActions.push("Strengthen the missing-information rule so the package states uncertainty, asks, or escalates instead of guessing.");
  }

  if (orderingQuality >= 85) strengths.push("Block order is close to the strongest-practice structure.");
  else nextBestActions.push("Reorder the blocks so high-priority behavior and grounding appear before the task and final output request.");

  if (structureClarity < 70) risks.push("Mixed or missing sections are making the envelope harder to review.");
  if (!sectionCounts.CHECKS) risks.push("There is no explicit CHECKS block to protect repeated use.");

  const composite = clamp((structureClarity * config.weights.structureClarity) + (orderingQuality * config.weights.orderingQuality) + (precedenceExplicitness * config.weights.precedenceExplicitness) + (outputUsability * config.weights.outputUsability) + (handlingReadiness * config.weights.handlingReadiness) + (operationalReadiness * config.weights.operationalReadiness));
  let readiness = "Not ready";
  if (composite >= 86) readiness = "Handoff-ready";
  else if (composite >= 72) readiness = "Promising with targeted revision";
  else if (composite >= 55) readiness = "Needs structural revision";

  const narrativeSummary = [
    `This run scores ${composite} and currently looks ${readiness.toLowerCase()}.`,
    structureClarity >= 80 ? "The package is staying fairly legible because unlike things are mostly separated." : "The package is still losing legibility because unlike material is blending together or key sections remain empty.",
    orderingQuality >= 80 ? "Ordering is supporting the model's reading path rather than forcing it to search for the governing logic." : "Ordering is still making the model work too hard to discover which rules and evidence matter most.",
    precedenceExplicitness >= 80 ? "Conflict handling is visible enough for a reviewer to inspect." : "Conflict handling is not yet explicit enough, so the model would still be tempted to guess which source wins."
  ].join(" ");

  const dedupedActions = Array.from(new Set(nextBestActions)).slice(0, 5);
  return {
    composite,
    readiness,
    narrativeSummary,
    nextBestActions: dedupedActions.length ? dedupedActions : ["This run is structurally strong. Replay it with one intentional variation to study tradeoffs without losing legibility."],
    metrics: { structureClarity, sectionBalance: clamp(balance), orderingQuality, precedenceExplicitness, outputUsability, handlingReadiness, operationalReadiness },
    warnings: Array.from(new Set(warnings)).slice(0, 8),
    strengths: Array.from(new Set(strengths)).slice(0, 6),
    risks: Array.from(new Set(risks)).slice(0, 6),
    sectionCounts,
    comparison
  };
}

export function compareMetricMaps(currentMetrics = {}, priorMetrics = {}) {
  return Object.keys(currentMetrics).map((key) => ({ key, label: formatLabel(key), current: currentMetrics[key] || 0, prior: priorMetrics[key] || 0, delta: (currentMetrics[key] || 0) - (priorMetrics[key] || 0) }));
}
