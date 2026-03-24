import { renderLauncher } from './renderLauncher.js';
import { renderMission } from './renderMission.js';

export function renderShell(state, appData, config, resumeSnapshot = null) {
  const mainContent = state.currentScenario
    ? renderMission(state)
    : renderLauncher(state, appData, resumeSnapshot);

  return `
    <header class="shell-header">
      <div>
        <p class="eyebrow">Flagship Chapter 1 application</p>
        <h1>${appData.app.name}</h1>
        <p class="lede">Short scenario missions that make context engineering visible through compare-first feedback, live metrics, and guided repairs.</p>
      </div>
      <div class="header-actions">
        <div class="status-pill-row">
          <span class="status-pill"><strong>Version</strong> ${config.version}</span>
          <span class="status-pill"><strong>Environment</strong> ${config.environment}</span>
          <span class="status-pill"><strong>Theme</strong> ${state.theme}</span>
        </div>
        <button class="ghost-btn" type="button" data-action="toggle-theme" aria-pressed="${state.theme === 'dark' ? 'true' : 'false'}">Toggle theme</button>
        <a class="ghost-btn" href="help.html">Help</a>
        <a class="ghost-btn" href="feedback.html">Feedback</a>
      </div>
    </header>

    <main class="shell-grid ${state.currentScenario ? 'shell-grid-mission' : ''}">
      ${config.environment === 'File' ? `
        <section class="summary-callout warning-callout">
          <strong>File mode detected.</strong>
          <p>Run <code>start-server.bat</code> for the most reliable local experience. File mode is useful for inspection, but local server mode is the tested path.</p>
        </section>
      ` : ''}
      ${mainContent}
    </main>
  `;
}
