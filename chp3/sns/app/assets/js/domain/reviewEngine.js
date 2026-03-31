export function getCoaching({ mission, packageState, metrics, riskCues, state }) {
  const messages = [];
  if (riskCues.missingEssential) {
    messages.push({
      severity: "danger",
      title: "Missing essential evidence",
      body: "At least one source-of-record or answer-shaping card is missing from the package."
    });
  }
  if (riskCues.staleIncluded) {
    messages.push({
      severity: "warn",
      title: "Freshness risk",
      body: "A stale or aging card is still inside the package. It may quietly override newer conditions."
    });
  }
  if (packageState.remainingBudget < 0) {
    messages.push({
      severity: "warn",
      title: "Budget pressure",
      body: "The package is over budget. Look for a background-heavy include that can be summarized or omitted."
    });
  }
  if (riskCues.branchConstraint) {
    messages.push({
      severity: "warn",
      title: "Bonus-drill constraint not met",
      body: packageState.policyStatus.violations[0]?.body || "The active bonus drill is asking for a different package shape than the current one."
    });
  }
  if (metrics.scores.signal >= 80 && metrics.scores.budget >= 70) {
    messages.push({
      severity: "good",
      title: "Lean package signal",
      body: "The package is staying relatively compact while protecting answer-shaping evidence."
    });
  }
  if (packageState.retrieveCards.length > 0) {
    messages.push({
      severity: "good",
      title: "Deferred follow-up is helping",
      body: "Retrieve Later is protecting the core package while keeping edge-case material reachable."
    });
  }
  if (!messages.length) {
    messages.push({
      severity: "note",
      title: "Keep refining the evidence mix",
      body: "Classify each card with the downstream package in mind, not just whether it seems useful."
    });
  }
  return messages.slice(0, 3);
}
