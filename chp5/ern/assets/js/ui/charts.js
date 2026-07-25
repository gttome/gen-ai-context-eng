export function dialStyle(value) {
  return `--dial-value:${value}`;
}

export function metricBarClass(metricId, value) {
  if (metricId === "exposureRisk") {
    if (value <= 35) return "is-good";
    if (value <= 60) return "is-mid";
    return "is-bad";
  }
  if (value >= 75) return "is-good";
  if (value >= 55) return "is-mid";
  return "is-bad";
}