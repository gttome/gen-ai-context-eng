export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function percent(value) {
  return `${Math.round(value)}%`;
}

export function signedDelta(value) {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}`;
  return `${rounded}`;
}

export function titleCase(value = '') {
  return value.replace(/(^|\s)\w/g, (char) => char.toUpperCase());
}

export function tokenSummary(total, budget) {
  const ratio = total / budget;
  if (ratio > 1) return 'Over budget';
  if (ratio > 0.82) return 'Tight budget';
  return 'Within budget';
}
