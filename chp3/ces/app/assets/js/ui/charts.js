export function metricBar(label, value) {
  return `
    <div class="metric-bar">
      <div class="score-row"><strong>${label}</strong><span>${value}</span></div>
      <div class="metric-track" aria-hidden="true">
        <div class="metric-fill" style="width:${value}%"></div>
      </div>
    </div>
  `;
}

export function metricGrid(metrics) {
  const ordered = [
    ["Structure clarity", metrics.structureClarity],
    ["Section balance", metrics.sectionBalance],
    ["Ordering quality", metrics.orderingQuality],
    ["Precedence explicitness", metrics.precedenceExplicitness],
    ["Output usability", metrics.outputUsability],
    ["Handling readiness", metrics.handlingReadiness],
    ["Operational readiness", metrics.operationalReadiness]
  ];
  return `
    <div class="metric-grid">
      ${ordered.map(([label, value]) => metricBar(label, value)).join("")}
    </div>
  `;
}
