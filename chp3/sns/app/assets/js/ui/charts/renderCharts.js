import { getBudgetChartData, getAuthorityChartData, getFreshnessChartData } from "../../metrics/visualizationAdapters.js";
import { escapeHtml } from "../../utils/helpers.js";

function segment(width, offset, fill) {
  return `<rect x="${offset}" y="18" width="${width}" height="18" rx="9" fill="${fill}"></rect>`;
}

export function renderBudgetChart(packageState) {
  const data = getBudgetChartData(packageState);
  const total = Math.max(data.total, 1);
  const usedWidth = Math.max(4, (data.used / total) * 100);
  const remainingWidth = Math.max(0, (data.remaining / total) * 100);
  const overflowWidth = Math.max(0, (data.overflow / total) * 100);
  return `
    <div class="chart" aria-label="Budget chart">
      <svg viewBox="0 0 100 54" role="img" aria-hidden="true">
        <rect x="0" y="18" width="100" height="18" rx="9" fill="rgba(255,255,255,.08)"></rect>
        ${segment(Math.min(usedWidth, 100), 0, "rgba(90, 208, 140, .8)")}
        ${remainingWidth ? segment(Math.min(remainingWidth, 100 - Math.min(usedWidth, 100)), Math.min(usedWidth, 100), "rgba(84, 194, 255, .58)") : ""}
        ${overflowWidth ? segment(Math.min(overflowWidth, 100), Math.max(0, 100 - Math.min(overflowWidth, 100)), "rgba(255, 126, 137, .88)") : ""}
      </svg>
      <div class="chart-caption">Used ${data.used} / ${data.total} tokens${data.overflow ? ` · overflow ${data.overflow}` : data.remaining ? ` · remaining ${data.remaining}` : ""}</div>
    </div>
  `;
}

export function renderAuthorityChart(packageState) {
  const data = getAuthorityChartData(packageState);
  const total = Math.max(1, data.High + data.Medium + data.Low);
  const blocks = [
    { key: "High", fill: "rgba(90, 208, 140, .82)" },
    { key: "Medium", fill: "rgba(84, 194, 255, .72)" },
    { key: "Low", fill: "rgba(255, 202, 100, .86)" }
  ];
  let offset = 0;
  const rects = blocks.map(block => {
    const width = ((data[block.key] || 0) / total) * 100;
    const rect = width ? `<rect x="${offset}" y="16" width="${width}" height="18" rx="8" fill="${block.fill}"></rect>` : "";
    offset += width;
    return rect;
  }).join("");
  return `
    <div class="chart" aria-label="Authority stack">
      <svg viewBox="0 0 100 50" role="img" aria-hidden="true">
        <rect x="0" y="16" width="100" height="18" rx="8" fill="rgba(255,255,255,.08)"></rect>
        ${rects}
      </svg>
      <div class="chart-caption">Included source mix · High ${data.High || 0} · Medium ${data.Medium || 0} · Low ${data.Low || 0}</div>
    </div>
  `;
}

export function renderFreshnessChart(packageState) {
  const data = getFreshnessChartData(packageState);
  const total = Math.max(1, data.Current + data.Aging + data.Stale);
  const blocks = [
    { key: "Current", fill: "rgba(90, 208, 140, .82)" },
    { key: "Aging", fill: "rgba(255, 202, 100, .86)" },
    { key: "Stale", fill: "rgba(255, 126, 137, .86)" }
  ];
  let offset = 0;
  const rects = blocks.map(block => {
    const width = ((data[block.key] || 0) / total) * 100;
    const rect = width ? `<rect x="${offset}" y="16" width="${width}" height="18" rx="8" fill="${block.fill}"></rect>` : "";
    offset += width;
    return rect;
  }).join("");
  return `
    <div class="chart" aria-label="Freshness strip">
      <svg viewBox="0 0 100 50" role="img" aria-hidden="true">
        <rect x="0" y="16" width="100" height="18" rx="8" fill="rgba(255,255,255,.08)"></rect>
        ${rects}
      </svg>
      <div class="chart-caption">Current ${data.Current || 0} · Aging ${data.Aging || 0} · Stale ${data.Stale || 0}</div>
    </div>
  `;
}
