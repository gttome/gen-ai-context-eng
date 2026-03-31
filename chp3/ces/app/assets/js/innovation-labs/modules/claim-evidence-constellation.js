import { escapeHtml, scoreTone } from '../shared/utils.js';

function buildNodes(context) {
  const claims = context.claimLedger;
  const evidence = context.scenario.blocks.filter((block) => block.type === 'REFERENCE' || block.type === 'DYNAMIC FACTS').slice(0, 5);
  return { claims, evidence };
}

export function mount(root, context, helpers) {
  const { claims, evidence } = buildNodes(context);
  const width = 920;
  const height = 420;
  const claimY = 110;
  const evidenceY = 290;
  const claimNodes = claims.map((claim, index) => ({ ...claim, x: 120 + index * ((width - 240) / Math.max(1, claims.length - 1)), y: claimY }));
  const evidenceNodes = evidence.map((item, index) => ({ ...item, x: 160 + index * ((width - 320) / Math.max(1, evidence.length - 1)), y: evidenceY }));
  const lines = claimNodes.flatMap((claim, claimIndex) => {
    const targets = evidenceNodes.slice(Math.max(0, claimIndex - 1), Math.min(evidenceNodes.length, claimIndex + 2));
    return targets.map((target) => ({
      claim,
      target,
      tension: claim.status === 'conflicted' ? 'conflicted' : claim.status === 'weak' ? 'weak' : 'supported'
    }));
  });

  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Visual feature</span><span class="hud-pill">Provenance map</span><span class="hud-pill">Optional module</span></div>
        <h2>Claim-Evidence Constellation</h2>
        <p>Every important claim becomes a star. Evidence and dynamic facts orbit beneath it. Tension lines show support, weakness, or conflict so the learner can inspect groundedness visually instead of guessing.</p>
      </div>
      <div class="constellation">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Claim evidence constellation">
          ${lines.map((line) => `<line x1="${line.claim.x}" y1="${line.claim.y}" x2="${line.target.x}" y2="${line.target.y}" stroke="${line.tension === 'supported' ? 'var(--success)' : line.tension === 'weak' ? 'var(--warm)' : 'var(--danger)'}" stroke-width="2" stroke-dasharray="${line.tension === 'conflicted' ? '8 6' : '0'}" opacity="0.75"></line>`).join('')}
          ${claimNodes.map((node) => `<g tabindex="0" data-constellation-claim="${escapeHtml(node.id)}"><circle cx="${node.x}" cy="${node.y}" r="22" fill="${node.status === 'supported' ? 'var(--success)' : node.status === 'weak' ? 'var(--warm)' : 'var(--danger)'}"></circle><text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="white" font-size="11">C${claimNodes.indexOf(node) + 1}</text></g>`).join('')}
          ${evidenceNodes.map((node) => `<g><circle cx="${node.x}" cy="${node.y}" r="16" fill="var(--accent)"></circle><text x="${node.x}" y="${node.y + 4}" text-anchor="middle" fill="white" font-size="10">E${evidenceNodes.indexOf(node) + 1}</text></g>`).join('')}
        </svg>
      </div>
      <div class="legend">
        <span class="supported">supported connection</span>
        <span class="weak">weak connection</span>
        <span class="conflicted">conflicted connection</span>
        <span class="evidence">evidence / dynamic fact node</span>
      </div>
      <div class="comparison-grid">
        <article class="lesson-card" id="constellation-detail">
          <h3>Inspect a claim</h3>
          <p>Select a claim node to see why it is supported, weak, or conflicted.</p>
        </article>
        <article class="lesson-card">
          <h3>Why this matters</h3>
          <p>Your current package tone is <span class="status-dot ${scoreTone(context.metrics.composite)}"></span> <strong>${escapeHtml(context.metrics.readiness)}</strong>. This view helps a learner see exactly which claims are easy to defend and which still drift under ambiguity.</p>
        </article>
      </div>
    </section>`;

  const detail = root.querySelector('#constellation-detail');
  root.querySelectorAll('[data-constellation-claim]').forEach((node) => node.addEventListener('click', () => {
    const claim = claims.find((item) => item.id === node.getAttribute('data-constellation-claim'));
    if (!claim) return;
    detail.innerHTML = `<h3>${escapeHtml(claim.title)}</h3><p><strong>Status:</strong> ${escapeHtml(claim.status)}</p><p>${escapeHtml(claim.reason)}</p><p><strong>Evidence path:</strong> ${claim.evidence.map(escapeHtml).join(', ') || 'No evidence mapped yet.'}</p><p><strong>Rule source:</strong> ${escapeHtml(claim.ruleSource)}</p>`;
    helpers.announce(`Inspecting ${claim.title}`);
  }));
}
