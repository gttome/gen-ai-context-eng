import { escapeHtml, copyText } from '../shared/utils.js';

export function mount(root, context, helpers) {
  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Context engineering feature</span><span class="hud-pill">Audit-ready export</span></div>
        <h2>Prompt Card + Claim Ledger</h2>
        <p>Export two linked artifacts: a human-readable prompt card and a claim ledger that maps the important claims back to evidence, rule source, and section responsibility.</p>
      </div>
      <div class="button-row">
        <button class="action-button primary-button" data-pcl-action="copy-card">Copy prompt card</button>
        <button class="action-button" data-pcl-action="copy-ledger">Copy claim ledger</button>
      </div>
      <div class="comparison-grid">
        <article class="prompt-card">${escapeHtml(context.promptCard)}</article>
        <div class="ledger-table">
          <table>
            <thead><tr><th>Claim</th><th>Status</th><th>Evidence</th><th>Rule source</th><th>Section</th></tr></thead>
            <tbody>
              ${context.claimLedger.map((claim) => `
                <tr>
                  <td>${escapeHtml(claim.title)}<br /><small>${escapeHtml(claim.reason)}</small></td>
                  <td>${escapeHtml(claim.status)}</td>
                  <td>${claim.evidence.map(escapeHtml).join('<br />') || '—'}</td>
                  <td>${escapeHtml(claim.ruleSource)}</td>
                  <td>${escapeHtml(claim.section)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;

  root.querySelector('[data-pcl-action="copy-card"]')?.addEventListener('click', async () => {
    await copyText(context.promptCard);
    helpers.announce('Prompt card copied.');
  });
  root.querySelector('[data-pcl-action="copy-ledger"]')?.addEventListener('click', async () => {
    const ledger = context.claimLedger.map((claim) => `${claim.title} | ${claim.status} | ${claim.evidence.join(', ')} | ${claim.ruleSource} | ${claim.section}`).join('\n');
    await copyText(ledger);
    helpers.announce('Claim ledger copied.');
  });
}
