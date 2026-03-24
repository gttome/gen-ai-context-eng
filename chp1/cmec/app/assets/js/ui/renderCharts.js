import { percent } from '../utils/format.js';

export function renderDeltaBars(metrics) {
  const keys = ['signal', 'grounding', 'structure', 'continuity', 'overload', 'readiness'];
  return `
    <div class="chart-shell">
      <h3>Before vs current package</h3>
      ${keys.map((key) => {
        const baseline = metrics.baseline[key];
        const current = metrics.current[key];
        return `
          <div class="delta-row">
            <div class="delta-label-row">
              <strong>${labelMap[key]}</strong>
              <span class="small-muted">Weak ${Math.round(baseline)} → Current ${Math.round(current)}</span>
            </div>
            <div class="delta-track" aria-label="${labelMap[key]} weak ${Math.round(baseline)} current ${Math.round(current)}">
              <span class="delta-baseline" style="width:${baseline}%;"></span>
              <span class="delta-current" style="width:${current}%;"></span>
            </div>
          </div>
        `;
      }).join('')}
      <p class="chart-caption">The compare view stays primary: every major repair should move at least one bar in a way the learner can explain.</p>
    </div>
  `;
}

export function renderReadinessRing(readiness, maturity) {
  const normalized = Math.max(0, Math.min(100, Math.round(readiness)));
  const circumference = 2 * Math.PI * 50;
  const dash = circumference * (normalized / 100);
  return `
    <div class="chart-shell ring-wrap">
      <h3>Mission readiness</h3>
      <svg class="ring-chart" viewBox="0 0 120 120" role="img" aria-label="Mission readiness ${normalized} percent">
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="10"></circle>
        <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ringGradient)" stroke-width="10"
          stroke-linecap="round"
          stroke-dasharray="${dash} ${circumference - dash}"
          transform="rotate(-90 60 60)"></circle>
        <defs>
          <linearGradient id="ringGradient" x1="0" x2="1">
            <stop offset="0%" stop-color="var(--accent)"></stop>
            <stop offset="100%" stop-color="var(--accent-2)"></stop>
          </linearGradient>
        </defs>
        <text x="60" y="56" text-anchor="middle" class="ring-value">${normalized}%</text>
        <text x="60" y="72" text-anchor="middle" fill="var(--muted)" font-size="9">${maturity}</text>
      </svg>
      <p class="chart-caption">Mission readiness combines visible improvement, manageable overload, and the quality of the current package structure.</p>
    </div>
  `;
}

export function renderRadar(metrics) {
  const keys = ['signal', 'grounding', 'structure', 'continuity', 'readiness'];
  const centerX = 150;
  const centerY = 150;
  const radius = 105;

  const pointsFor = (metricSet) => keys.map((key, index) => {
    const angle = ((Math.PI * 2) / keys.length) * index - Math.PI / 2;
    const value = metricSet[key] / 100;
    const x = centerX + Math.cos(angle) * radius * value;
    const y = centerY + Math.sin(angle) * radius * value;
    return `${x},${y}`;
  }).join(' ');

  const grid = [0.25, 0.5, 0.75, 1].map((factor) => {
    const points = keys.map((_, index) => {
      const angle = ((Math.PI * 2) / keys.length) * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * factor;
      const y = centerY + Math.sin(angle) * radius * factor;
      return `${x},${y}`;
    }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,0.10)"></polygon>`;
  }).join('');

  const axisLabels = keys.map((key, index) => {
    const angle = ((Math.PI * 2) / keys.length) * index - Math.PI / 2;
    const x = centerX + Math.cos(angle) * (radius + 18);
    const y = centerY + Math.sin(angle) * (radius + 18);
    return `<text x="${x}" y="${y}" fill="var(--muted)" font-size="11" text-anchor="middle">${shortLabelMap[key]}</text>`;
  }).join('');

  return `
    <div class="chart-shell">
      <h3>Comparison profile</h3>
      <svg class="compare-radar" viewBox="0 0 300 300" role="img" aria-label="Radar compare chart">
        ${grid}
        ${axisLabels}
        <polygon points="${pointsFor(metrics.baseline)}" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.25)"></polygon>
        <polygon points="${pointsFor(metrics.current)}" fill="rgba(56,199,216,0.22)" stroke="var(--accent)"></polygon>
      </svg>
      <div class="legend-list">
        <div class="legend-row"><span class="legend-swatch" style="background:rgba(255,255,255,0.4);"></span><span class="small-muted">Weak package</span></div>
        <div class="legend-row"><span class="legend-swatch" style="background:var(--accent);"></span><span class="small-muted">Current package</span></div>
      </div>
    </div>
  `;
}

export function renderMixChart(scenario) {
  const included = scenario.components.filter((component) => component.included);
  const total = Math.max(1, included.reduce((sum, component) => sum + component.tokenEstimate, 0));
  const categories = [
    ['Role / task', ['role', 'task']],
    ['Grounding / dynamic', ['grounding', 'dynamic']],
    ['Structure / constraints', ['schema', 'constraint']],
    ['Memory', ['memory']],
    ['Noise', ['noise']]
  ];

  let offset = 0;
  const segments = categories.map(([label, types]) => {
    const amount = included
      .filter((component) => types.includes(component.type))
      .reduce((sum, component) => sum + component.tokenEstimate, 0);
    const width = (amount / total) * 100;
    const segment = `<rect x="${offset}" y="12" width="${width}" height="24" rx="8" fill="${colors[label]}"></rect>`;
    offset += width;
    return segment;
  }).join('');

  return `
    <div class="chart-shell">
      <h3>Included context mix</h3>
      <svg class="mix-chart" viewBox="0 0 100 48" role="img" aria-label="Included context mix by token estimate">
        ${segments}
      </svg>
      <div class="legend-list">
        ${categories.map(([label]) => `<div class="legend-row"><span class="legend-swatch" style="background:${colors[label]};"></span><span class="small-muted">${label}</span></div>`).join('')}
      </div>
      <p class="chart-caption">Selective context engineering means more of the mix should be signal and less should be generic noise.</p>
    </div>
  `;
}

const labelMap = {
  signal: 'Signal Quality',
  grounding: 'Grounding',
  structure: 'Structure',
  continuity: 'Continuity',
  overload: 'Overload Risk',
  readiness: 'Mission Readiness'
};

const shortLabelMap = {
  signal: 'Signal',
  grounding: 'Ground',
  structure: 'Struct',
  continuity: 'Memory',
  readiness: 'Ready'
};

const colors = {
  'Role / task': 'rgba(120,240,214,0.95)',
  'Grounding / dynamic': 'rgba(56,199,216,0.95)',
  'Structure / constraints': 'rgba(71,208,140,0.95)',
  'Memory': 'rgba(255,191,94,0.95)',
  'Noise': 'rgba(255,122,122,0.95)'
};
