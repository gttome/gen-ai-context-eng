import { sum, unique } from "../utils/helpers.js";

function evaluatePolicy(items, branchPolicy = null) {
  if (!branchPolicy) {
    return {
      includeCount: items.filter(item => item.chosenAction === "include").length,
      riskyIncludeCount: 0,
      leadIncludeCount: 0,
      violations: []
    };
  }

  const includeCards = items.filter(item => item.chosenAction === "include");
  const riskyIncludeIds = new Set(branchPolicy.riskyIncludeIds || []);
  const leadIncludeIds = new Set(branchPolicy.leadIncludeIds || []);
  const riskyIncludeCount = includeCards.filter(item => riskyIncludeIds.has(item.id)).length;
  const leadIncludeCount = includeCards.filter(item => leadIncludeIds.has(item.id)).length;
  const violations = [];

  if (branchPolicy.includeCap && includeCards.length > branchPolicy.includeCap) {
    violations.push({
      id: "include-cap",
      title: "Too many direct-include cards",
      body: `This replay allows ${branchPolicy.includeCap} direct-include cards, but the current package has ${includeCards.length}.`
    });
  }

  if (typeof branchPolicy.maxRiskyIncludes === "number" && riskyIncludeCount > branchPolicy.maxRiskyIncludes) {
    violations.push({
      id: "risky-includes",
      title: "Weaker background is leading too much",
      body: `This replay allows ${branchPolicy.maxRiskyIncludes} risky direct-include card${branchPolicy.maxRiskyIncludes === 1 ? "" : "s"}, but the current package has ${riskyIncludeCount}.`
    });
  }

  if (leadIncludeIds.size && leadIncludeCount < leadIncludeIds.size) {
    violations.push({
      id: "lead-evidence",
      title: "Lead evidence is not fully protected",
      body: `This replay expects ${leadIncludeIds.size} lead-evidence card${leadIncludeIds.size === 1 ? "" : "s"} to remain fully included, but only ${leadIncludeCount} currently are.`
    });
  }

  return {
    includeCount: includeCards.length,
    riskyIncludeCount,
    leadIncludeCount,
    violations,
    activeRules: unique([
      branchPolicy.includeCap ? `Include cap: ${branchPolicy.includeCap}` : null,
      typeof branchPolicy.maxRiskyIncludes === "number" ? `Risky include limit: ${branchPolicy.maxRiskyIncludes}` : null,
      ...(branchPolicy.exportRules || [])
    ].filter(Boolean))
  };
}

export function buildPackage(mission, classifications, budgetLimit, branchPolicy = null) {
  const items = mission.cards.map(card => {
    const action = classifications[card.id]?.action || "unclassified";
    const effectiveCost = action === "include" ? card.tokenCost
      : action === "summarize" ? Math.round(card.tokenCost * 0.45)
      : 0;
    return {
      ...card,
      chosenAction: action,
      effectiveCost
    };
  });

  const includeCards = items.filter(item => item.chosenAction === "include");
  const summaryCards = items.filter(item => item.chosenAction === "summarize");
  const retrieveCards = items.filter(item => item.chosenAction === "retrieveLater");
  const omitCards = items.filter(item => item.chosenAction === "omit");
  const unclassifiedCards = items.filter(item => item.chosenAction === "unclassified");

  const usedBudget = sum(items.map(item => item.effectiveCost));
  const remainingBudget = budgetLimit - usedBudget;
  const policyStatus = evaluatePolicy(items, branchPolicy);

  return {
    budgetLimit,
    usedBudget,
    remainingBudget,
    items,
    includeCards,
    summaryCards,
    retrieveCards,
    omitCards,
    unclassifiedCards,
    branchPolicy,
    policyStatus
  };
}

function branchRules(branch, branchPolicy = null) {
  if (!branch) return [];
  if (branch.id === "strict-budget") {
    return [
      `- Bonus drill active: ${branch.title}.`,
      `- Prove the tighter budget changed your package choices and answer length.`,
      `- Prefer summary or retrieve-later unless a card is answer-shaping evidence.`,
      ...(branchPolicy?.includeCap ? [`- Keep no more than ${branchPolicy.includeCap} direct-include evidence blocks.`] : [])
    ];
  }
  if (branch.id === "authority-freshness") {
    return [
      `- Bonus drill active: ${branch.title}.`,
      `- Let current, higher-authority evidence lead over comfortable but aging summaries.`,
      `- Do not let stale or secondary commentary outrank the source of record.`,
      `- Make it obvious which source-of-record evidence is leading the answer.`
    ];
  }
  return [
    `- Bonus drill active: ${branch.title}.`,
    `- ${branch.coachNote || branch.description}`
  ];
}

export function buildExportPayload(mission, packageState, activeBonusBranch = null, branchPolicy = null) {
  const includeBlocks = packageState.includeCards
    .map(card => `- ${card.title} (${card.sourceType}, ${card.recency}, ${card.authority})\n  ${card.excerpt}`)
    .join("\n");
  const summaryBlocks = packageState.summaryCards
    .map(card => `- ${card.title}\n  ${card.summaryText}`)
    .join("\n");
  const retrieveBlocks = packageState.retrieveCards
    .map(card => `- ${card.title}: keep outside the core package unless follow-up requires it.`)
    .join("\n");

  return [
    `ROLE`,
    `You are a careful assistant completing the mission "${mission.title}".`,
    ``,
    `RULES`,
    `- Use the provided evidence only.`,
    `- Prefer current, authoritative sources.`,
    `- State uncertainty instead of guessing.`,
    `- Keep the answer reviewable and concise.`,
    ...branchRules(activeBonusBranch, branchPolicy),
    ...(branchPolicy?.exportRules?.length ? branchPolicy.exportRules.map(rule => `- ${rule}`) : []),
    ``,
    `REFERENCE`,
    includeBlocks || `- No direct-include evidence selected yet.`,
    ``,
    `SUMMARIES`,
    summaryBlocks || `- No summary blocks selected yet.`,
    ``,
    `DYNAMIC FACTS`,
    ...mission.dynamicFacts.map(item => `- ${item}`),
    ``,
    `TASK`,
    mission.taskBrief,
    ``,
    `CAVEATS TO PRESERVE`,
    ...(mission.requiredCaveats?.length ? mission.requiredCaveats.map(item => `- ${item.label}`) : [`- No additional caveats configured.`]),
    ``,
    `OUTPUT`,
    ...mission.outputContract.map(item => `- ${item}`),
    ``,
    `RETRIEVE LATER`,
    retrieveBlocks || `- No retrieve-later items selected.`,
    ``,
    `CHECKS`,
    `- If evidence is missing or conflicting, say so clearly.`,
    `- Do not rely on stale or secondary notes over the source of record.`,
    `- Keep sections explicit enough that the answer can be pasted back into Signal-to-Noise Studio for review.`,
    `- Preserve any required caveats instead of smoothing them over.`,
    `- When the answer is pasted back into Signal-to-Noise Studio, the review will inspect structure, evidence carry-through, source traceability, supported claims, required caveats, and drift.`
  ].join("\n");
}
