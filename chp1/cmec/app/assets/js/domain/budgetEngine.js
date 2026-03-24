export function calculateBudget(components, budget) {
  const totalTokens = components
    .filter((component) => component.included)
    .reduce((sum, component) => sum + component.tokenEstimate, 0);

  const ratio = budget ? totalTokens / budget : 0;
  return {
    totalTokens,
    budget,
    ratio,
    overBudget: totalTokens > budget
  };
}
