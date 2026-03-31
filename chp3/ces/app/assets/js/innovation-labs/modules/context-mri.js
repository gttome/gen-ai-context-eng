import { escapeHtml, formatPercent, sectionSurface } from '../shared/utils.js';

function sectionRisk(section, items, strongest) {
  const actual = items.length;
  const target = (strongest.sections?.[section] || []).length;
  const mismatch = Math.abs(actual - target) * 18;
  return Math.min(100, mismatch + (actual === 0 ? 28 : 0));
}

export function mount(root, context, helpers) {
  const sections = context.config.sectionOrder.map((section) => ({
    section,
    items: context.run.sections?.[section] || [],
    risk: sectionRisk(section, context.run.sections?.[section] || [], context.scenario.strongestPractice),
    target: (context.scenario.strongestPractice.sections?.[section] || []).length,
    actual: (context.run.sections?.[section] || []).length
  }));
  const trustValue = Math.min(100, Math.round((context.metrics.metrics.structureClarity + context.metrics.metrics.precedenceExplicitness) / 2));
  const ambiguityValue = Math.max(0, 100 - context.metrics.metrics.handlingReadiness);
  const noiseValue = Math.max(0, 100 - context.metrics.metrics.sectionBalance);

  root.innerHTML = `
    <section class="workspace-panel mri-shell">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Visual feature</span><span class="hud-pill">Structural scan</span></div>
        <h2>Context MRI</h2>
        <p>Scan the envelope like a radiologist scans a chart. The MRI view reveals trust pressure, ambiguity pressure, and noise pressure from whole-package down to section level.</p>
      </div>
      <article class="data-panel">
        <h3>Whole-envelope scan</h3>
        <div class="mri-bar"><span class="trust" style="width:${trustValue}%"></span></div>
        <p><strong>Trust integrity:</strong> ${formatPercent(trustValue)}</p>
        <div class="mri-bar"><span class="ambiguity" style="width:${ambiguityValue}%"></span></div>
        <p><strong>Ambiguity pressure:</strong> ${formatPercent(ambiguityValue)}</p>
        <div class="mri-bar"><span class="noise" style="width:${noiseValue}%"></span></div>
        <p><strong>Noise pressure:</strong> ${formatPercent(noiseValue)}</p>
      </article>
      <div class="authority-grid">
        ${sections.map((row) => `
          <article class="authority-card" style="background:${sectionSurface(row.section)}">
            <div class="stack-inline"><span class="section-chip">${escapeHtml(row.section)}</span><span class="metric-badge">risk ${row.risk}</span></div>
            <p>Actual cards: <strong>${row.actual}</strong> · strongest-practice cards: <strong>${row.target}</strong></p>
            <div class="mri-bar"><span class="noise" style="width:${row.risk}%"></span></div>
            <p>${row.risk >= 60 ? 'This section deserves immediate review.' : row.risk >= 35 ? 'This section is plausible but weaker than strongest practice.' : 'This section is structurally close to strongest practice.'}</p>
          </article>`).join('')}
      </div>
      <div class="feature-footer">Use Context MRI to spot structural disease before you blame the model. Large risk bands usually mean the package itself is still hard to inspect.</div>
    </section>`;
  helpers.announce('Context MRI loaded.');
}
