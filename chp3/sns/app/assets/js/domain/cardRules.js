export const CARD_ACTIONS = [
  { id: "include", label: "Include", helper: "Put direct evidence into the package." },
  { id: "summarize", label: "Summarize", helper: "Keep the value, shrink the footprint." },
  { id: "retrieveLater", label: "Retrieve Later", helper: "Hold for conditional follow-up." },
  { id: "omit", label: "Omit", helper: "Keep it out of the core package." }
];

export function actionLabel(action) {
  return CARD_ACTIONS.find(item => item.id === action)?.label || "Unclassified";
}

export function actionClass(action) {
  return `card-action-${action}`;
}
