import { clamp } from "../utils/env.js";

export function computeOverallReadiness(metrics) {
  const positives =
    metrics.readiness +
    metrics.trustSafety +
    metrics.governance +
    metrics.maintainability +
    metrics.rolloutConfidence;
  const exposurePenalty = 100 - metrics.exposureRisk;
  return Math.round((positives + exposurePenalty) / 6);
}

export function readinessLabel(score) {
  if (score >= 76) return "Ready to Pilot";
  if (score >= 62) return "Conditional Readiness";
  if (score >= 48) return "Needs Tightening";
  return "Prototype Only";
}

export function laneOutcomeLabel(option) {
  const sum = Object.values(option.deltas).reduce((acc, value) => acc + value, 0);
  return sum >= 0 ? "Disciplined" : "Fragile";
}

export function applyMetricDeltas(metrics, deltas) {
  const next = { ...metrics };
  Object.entries(deltas).forEach(([key, value]) => {
    next[key] = clamp((next[key] ?? 0) + value);
  });
  return next;
}

export function metricDeltaSummary(deltas) {
  return Object.entries(deltas).map(([key, value]) => ({
    id: key,
    value,
    direction: value === 0 ? "flat" : value > 0 ? "up" : "down"
  }));
}