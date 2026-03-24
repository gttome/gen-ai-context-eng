import { calculateBudget } from '../domain/budgetEngine.js';
import { clamp } from '../utils/format.js';

function countIncluded(components, type) {
  return components.filter((component) => component.included && component.type === type).length;
}

function componentWeight(component) {
  switch (component.priority) {
    case 'high': return 18;
    case 'medium': return 10;
    default: return 6;
  }
}

function signalQuality(components) {
  const included = components.filter((component) => component.included);
  const positive = included
    .filter((component) => component.type !== 'noise')
    .reduce((sum, component) => sum + componentWeight(component), 0);
  const noisePenalty = included
    .filter((component) => component.type === 'noise')
    .reduce((sum, component) => sum + component.tokenEstimate * 0.2, 0);

  return clamp((positive - noisePenalty) * 1.35, 5, 100);
}

function groundingScore(components) {
  const grounding = countIncluded(components, 'grounding');
  const dynamic = countIncluded(components, 'dynamic');
  return clamp((grounding * 42) + (dynamic * 24), 0, 100);
}

function structureScore(components) {
  const schema = countIncluded(components, 'schema');
  const constraint = countIncluded(components, 'constraint');
  const role = countIncluded(components, 'role');
  return clamp((schema * 44) + (constraint * 28) + (role * 12), 0, 100);
}

function continuityScore(components) {
  const memory = countIncluded(components, 'memory');
  const dynamic = countIncluded(components, 'dynamic');
  return clamp((memory * 65) + (dynamic * 10), 0, 100);
}

function overloadRisk(components, budget) {
  const budgetState = calculateBudget(components, budget);
  const noiseTokens = components
    .filter((component) => component.included && component.type === 'noise')
    .reduce((sum, component) => sum + component.tokenEstimate, 0);

  return clamp((budgetState.ratio * 68) + (noiseTokens * 0.35), 0, 100);
}

function readiness(components, budget) {
  const signal = signalQuality(components);
  const grounding = groundingScore(components);
  const structure = structureScore(components);
  const continuity = continuityScore(components);
  const overload = overloadRisk(components, budget);
  return clamp((signal * 0.27) + (grounding * 0.22) + (structure * 0.22) + (continuity * 0.12) + ((100 - overload) * 0.17), 0, 100);
}

export function calculateScenarioMetrics(scenario) {
  const budgetState = calculateBudget(scenario.components, scenario.budget);
  const result = {
    signal: signalQuality(scenario.components),
    grounding: groundingScore(scenario.components),
    structure: structureScore(scenario.components),
    continuity: continuityScore(scenario.components),
    overload: overloadRisk(scenario.components, scenario.budget),
    readiness: readiness(scenario.components, scenario.budget),
    tokens: budgetState.totalTokens,
    budget: budgetState.budget
  };
  return result;
}
