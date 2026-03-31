export function scoreDescriptor(score) {
  if (score >= 88) return "Strong";
  if (score >= 74) return "Solid";
  if (score >= 60) return "Watch";
  return "At risk";
}
