export const STEP_LABELS = [
  { id: "orient", label: "Orient" },
  { id: "anchor", label: "Anchor" },
  { id: "compare", label: "Compare" },
  { id: "judge", label: "Judge" },
  { id: "steward", label: "Steward" }
];

export const DEFAULT_FILTERS = {
  search: "",
  domain: "all",
  difficulty: "all",
  pack: "all",
  mode: "all",
  sort: "recommended"
};

export const STATUS_SEQUENCE = ["improved", "held", "tradeoff", "weakened"];

export function badgeClass(status) {
  if (status === "improved") return "status-improved";
  if (status === "held") return "status-held";
  if (status === "tradeoff") return "status-tradeoff";
  return "status-weakened";
}

export function toTitleCase(value) {
  if (!value) return "Unreviewed";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function scoreBarClass(score) {
  if (score >= 85) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export function renderStatusesStrip(expected, learner) {
  return `
    <div class="delta-strip" aria-hidden="true">
      ${STATUS_SEQUENCE.map((status) => `
        <span class="delta-node ${badgeClass(status)} ${expected === status ? "expected" : ""} ${learner === status ? "learner" : ""}">${status.slice(0, 1).toUpperCase()}</span>
      `).join("")}
    </div>
  `;
}
