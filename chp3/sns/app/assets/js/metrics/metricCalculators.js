import { clamp, unique } from "../utils/helpers.js";

export function calculateMetrics(mission, packageState, metricsConfig) {
  const items = packageState.items;
  let signal = 100;
  let authority = 100;
  let freshness = 100;
  let budget = 100;
  let explainability = 100;

  const includedIds = packageState.includeCards.map(item => item.id);
  const includedDuplicateGroups = packageState.includeCards.map(item => item.duplicateGroup).filter(Boolean);
  const duplicateCount = includedDuplicateGroups.length - unique(includedDuplicateGroups).length;

  items.forEach(item => {
    const chosen = item.chosenAction;
    const ideal = item.idealAction;
    const isWrong = chosen !== "unclassified" && chosen !== ideal;

    if (item.essential && chosen !== "include") {
      signal -= 16;
      explainability -= 10;
    }

    if (ideal === "omit" && chosen === "include") {
      signal -= 10;
      budget -= 8;
    }
    if (ideal === "summarize" && chosen === "include") {
      signal -= 6;
      budget -= 8;
    }
    if (ideal === "retrieveLater" && chosen === "include") {
      signal -= 8;
      budget -= 10;
    }
    if (ideal === "include" && chosen === "summarize") {
      signal -= 8;
    }
    if (ideal === "include" && chosen === "omit") {
      signal -= 14;
      explainability -= 10;
    }
    if (ideal === "retrieveLater" && chosen === "omit") {
      explainability -= 4;
    }
    if (ideal === "summarize" && chosen === "omit") {
      explainability -= 5;
    }

    if (item.authority === "High" && item.essential && chosen !== "include") {
      authority -= 14;
    }
    if (item.authority === "Low" && chosen === "include") {
      authority -= 10;
    }
    if (item.authority === "Medium" && chosen === "include" && ideal !== "include") {
      authority -= 6;
    }

    if (item.recency === "Stale" && (chosen === "include" || chosen === "summarize")) {
      freshness -= 18;
    }
    if (item.recency === "Aging" && chosen === "include" && ideal !== "include") {
      freshness -= 9;
    }
    if (item.recency === "Current" && item.essential && chosen !== "include") {
      freshness -= 8;
    }

    if (chosen === "unclassified") {
      explainability -= 7;
      signal -= 4;
    }
  });

  if (duplicateCount > 0) {
    signal -= duplicateCount * 6;
    budget -= duplicateCount * 4;
  }

  if (packageState.policyStatus?.violations?.length) {
    signal -= packageState.policyStatus.violations.length * 5;
    explainability -= packageState.policyStatus.violations.length * 8;
  }

  if (packageState.remainingBudget < 0) {
    budget -= Math.abs(packageState.remainingBudget) * 0.9;
  } else {
    const spendRatio = packageState.usedBudget / packageState.budgetLimit;
    if (spendRatio < 0.35) budget -= 12;
    if (spendRatio > 0.9 && packageState.remainingBudget >= 0) budget -= 8;
  }

  const correctChoices = items.filter(item => item.chosenAction === item.idealAction).length;
  explainability -= Math.max(0, (items.length - correctChoices)) * 3;

  return {
    scores: {
      signal: clamp(Math.round(signal), 20, 100),
      authority: clamp(Math.round(authority), 20, 100),
      freshness: clamp(Math.round(freshness), 20, 100),
      budget: clamp(Math.round(budget), 20, 100),
      explainability: clamp(Math.round(explainability), 20, 100)
    }
  };
}

export function calculateRiskCues(mission, packageState) {
  const missingEssential = mission.cards
    .filter(card => card.essential)
    .some(card => packageState.includeCards.every(item => item.id !== card.id));

  const staleIncluded = packageState.items.some(item =>
    (item.recency === "Stale" || item.recency === "Aging") &&
    (item.chosenAction === "include" || item.chosenAction === "summarize") &&
    item.idealAction !== item.chosenAction
  );

  const groups = packageState.includeCards.map(card => card.duplicateGroup).filter(Boolean);
  const duplicatePressure = groups.length !== unique(groups).length;

  return {
    missingEssential,
    staleIncluded,
    duplicatePressure,
    branchConstraint: Boolean(packageState.policyStatus?.violations?.length)
  };
}
