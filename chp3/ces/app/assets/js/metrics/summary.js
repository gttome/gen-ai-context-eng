export function scoreBand(score) {
  if (score >= 86) return "Handoff-ready";
  if (score >= 72) return "Promising";
  if (score >= 55) return "Needs structural revision";
  return "Not ready";
}

export function deltaLabel(current, previous) {
  if (previous == null) return "Baseline";
  const delta = current - previous;
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}
