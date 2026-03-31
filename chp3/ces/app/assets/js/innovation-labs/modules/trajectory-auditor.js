import { escapeHtml } from '../shared/utils.js';

export function mount(root, context, helpers) {
  const failing = context.trajectory.filter((item) => item.status !== 'pass');
  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Context engineering feature</span><span class="hud-pill">Lifecycle audit</span></div>
        <h2>Trajectory Auditor</h2>
        <p>Audit the full context-engineering trajectory. The final answer matters, but so do the choices that led there: discovery, selection, shaping, execution, evaluation, iteration, and deployment readiness.</p>
      </div>
      <div class="trajectory-grid">
        ${context.trajectory.map((step) => `
          <article class="audit-row ${escapeHtml(step.status)}">
            <div class="stack-inline"><span class="section-chip">${escapeHtml(step.phase)}</span><span class="metric-badge">${escapeHtml(step.status)}</span></div>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.summary)}</p>
            <small>${escapeHtml(step.signal)}</small>
          </article>`).join('')}
      </div>
      <article class="lesson-card">
        <h3>Audit verdict</h3>
        <p>${failing.length ? `The biggest remaining audit pressure sits in ${escapeHtml(failing[0].phase)}.` : 'Every major lifecycle checkpoint is currently stable.'}</p>
        <p>This prevents the learner from blaming the final answer alone. Instead, it points to the phase where the weakness most likely entered the workflow.</p>
      </article>
    </section>`;
  helpers.announce('Trajectory auditor loaded.');
}
