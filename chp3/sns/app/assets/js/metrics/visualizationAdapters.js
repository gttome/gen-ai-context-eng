export function getBudgetChartData(packageState) {
  return {
    used: Math.max(packageState.usedBudget, 0),
    remaining: Math.max(packageState.remainingBudget, 0),
    overflow: Math.max(Math.abs(Math.min(packageState.remainingBudget, 0)), 0),
    total: packageState.budgetLimit
  };
}

export function getAuthorityChartData(packageState) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  packageState.includeCards.forEach(card => counts[card.authority] += 1);
  return counts;
}

export function getFreshnessChartData(packageState) {
  const counts = { Current: 0, Aging: 0, Stale: 0 };
  packageState.includeCards.concat(packageState.summaryCards).forEach(card => {
    counts[card.recency] = (counts[card.recency] || 0) + 1;
  });
  return counts;
}
