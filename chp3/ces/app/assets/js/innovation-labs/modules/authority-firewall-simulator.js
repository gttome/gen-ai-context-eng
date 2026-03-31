import { escapeHtml } from '../shared/utils.js';

export function mount(root, context, helpers) {
  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Context engineering feature</span><span class="hud-pill">Trust-boundary drill</span></div>
        <h2>Authority Firewall Simulator</h2>
        <p>Run attack drills against the package. These are not security theatrics. They are context-engineering stress tests that show where stale snippets, borrowed text, or tool returns could quietly seize authority.</p>
      </div>
      <div class="audit-grid">
        ${context.firewallCases.map((item) => `
          <article class="audit-row ${item.blastRadius === 'Contained' ? 'pass' : item.blastRadius === 'Moderate' ? 'warn' : 'fail'}">
            <h3>${escapeHtml(item.title)}</h3>
            <p><strong>Threat:</strong> ${escapeHtml(item.threat)}</p>
            <p><strong>Blast radius:</strong> ${escapeHtml(item.blastRadius)}</p>
            <p><strong>Affected blocks:</strong> ${item.affectedBlocks.map(escapeHtml).join(', ') || 'none mapped'}</p>
            <p><strong>Recommended move:</strong> ${escapeHtml(item.recommendation)}</p>
          </article>`).join('')}
      </div>
      <article class="lesson-card">
        <h3>Operational takeaway</h3>
        <p>Strong packages do not just answer well. They stay stable when new text arrives, especially text that looks authoritative but should not override the visible operating rules.</p>
      </article>
    </section>`;
  helpers.announce('Authority firewall simulator loaded.');
}
