export function deriveBadges({ packageState, metrics, comparison, composite }) {
  const badges = [];
  if (packageState.remainingBudget >= 0) badges.push("Within Budget");
  if (!metrics.riskCues?.missingEssential && metrics.scores.authority >= 80) badges.push("Strong Authority Judgment");
  if (packageState.retrieveCards.length >= 1) badges.push("Deferred with Discipline");
  if (comparison.alignmentPercent >= 78) badges.push("First Clean Run");
  if (composite >= 84) badges.push("Reviewable Package");
  return badges.slice(0, 4);
}
