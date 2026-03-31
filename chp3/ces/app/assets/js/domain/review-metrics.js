export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function averageScores(values = []) {
  if (!values.length) return 0;
  return clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function scoreBand(score) {
  if (score >= 85) return "strong";
  if (score >= 70) return "usable";
  if (score >= 55) return "mixed";
  return "weak";
}

export function scoreSummary(score) {
  const band = scoreBand(score);
  return ({
    strong: "Strong observed run",
    usable: "Usable but still coachable",
    mixed: "Mixed result",
    weak: "Weak run with visible structural fallout"
  })[band];
}
