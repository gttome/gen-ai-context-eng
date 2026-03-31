import { buildLabContext } from './data/context-builder.js';
import { LABS, findLab, categories } from './registry.js';
import { escapeHtml, saveJson, loadJson, copyText } from './shared/utils.js';

const STATE_KEY = 'ces_innovation_labs_host_v1';

function defaultState() {
  return {
    activeLabId: LABS[0]?.id || '',
    activeCategory: 'All',
    scenarioId: '',
    sourceMode: 'auto'
  };
}

function option(value, label, selected = false) {
  return `<option value="${escapeHtml(value)}" ${selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function renderShell(context, state) {
  const categoryButtons = ['All', ...categories()].map((category) => `
    <button class="choice-button ${category === state.activeCategory ? 'active' : ''}" data-labs-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join('');

  const visibleLabs = LABS.filter((lab) => state.activeCategory === 'All' || lab.category === state.activeCategory);
  const labTiles = visibleLabs.map((lab) => `
    <button class="feature-tile ${lab.id === state.activeLabId ? 'active' : ''}" data-lab-id="${escapeHtml(lab.id)}">
      <strong>${escapeHtml(lab.title)}</strong>
      <small>${escapeHtml(lab.category)} · ${escapeHtml(lab.innovation)}</small>
      <span>${escapeHtml(lab.summary)}</span>
    </button>
  `).join('');

  const activeLab = findLab(state.activeLabId);
  return `
    <div class="labs-shell">
      <header class="labs-header">
        <div class="header-top">
          <div class="brand-line">
            <img src="./assets/media/ces-badge.svg" alt="Context Envelope Studio badge" />
            <div>
              <h1>Context Envelope Studio — Innovation Labs</h1>
              <p>Optional, modular feature labs. Each lab is isolated from the core studio and can evolve independently without destabilizing the main application.</p>
            </div>
          </div>
          <div class="header-actions">
            <a class="header-button" href="./index.html">Back to studio</a>
            <button class="header-button" data-labs-action="copy-summary">Copy active lab summary</button>
            <button class="header-button" data-labs-action="reset">Reset lab filters</button>
          </div>
        </div>
        <div class="control-row">
          <label>
            <span>Scenario</span>
            <select id="labs-scenario-select">${context.scenarioIndex.scenarios.map((item) => option(item.id, item.title, item.id === context.scenario.id)).join('')}</select>
          </label>
          <label>
            <span>Source mode</span>
            <select id="labs-source-select">
              ${option('auto', 'Auto', context.sourceMode === 'auto')}
              ${option('current-run', 'Use current run when available', context.sourceMode === 'current-run')}
              ${option('demo-flawed', 'Use demo flawed run', context.sourceMode === 'demo-flawed')}
              ${option('demo-strongest', 'Use strongest-practice run', context.sourceMode === 'demo-strongest')}
            </select>
          </label>
          <div class="feature-filters">${categoryButtons}</div>
        </div>
      </header>
      <div class="labs-layout">
        <aside class="labs-sidebar">
          <section class="labs-panel sidebar-section">
            <h2>Innovation modules</h2>
            <div class="feature-grid">${labTiles}</div>
          </section>
          <section class="labs-panel sidebar-section">
            <h2>Current lab source</h2>
            <div class="summary-grid">
              <div class="spark"><span>Scenario</span><strong>${escapeHtml(context.scenario.title)}</strong><small>${escapeHtml(context.scenario.chapterConcept || '')}</small></div>
              <div class="spark"><span>Composite</span><strong>${escapeHtml(String(context.metrics.composite))}</strong><small>${escapeHtml(context.metrics.readiness)}</small></div>
              <div class="spark"><span>Claims</span><strong>${escapeHtml(String(context.claimLedger.length))}</strong><small>auditable claim nodes</small></div>
              <div class="spark"><span>Trajectory steps</span><strong>${escapeHtml(String(context.trajectory.length))}</strong><small>lifecycle checkpoints</small></div>
            </div>
            <p class="footer-note">Active lab: <strong>${escapeHtml(activeLab.title)}</strong>. Labs are optional and live on this separate page so the core run remains clean and stable.</p>
          </section>
        </aside>
        <section class="labs-workspace">
          <div id="lab-workspace"></div>
        </section>
      </div>
    </div>`;
}

function helperSet(root, state, rerender) {
  return {
    announce(message) {
      const live = document.getElementById('labs-live-region');
      if (live) live.textContent = message;
    },
    saveState(next) {
      const merged = { ...state, ...next };
      saveJson(STATE_KEY, merged);
      rerender(merged);
    },
    copy(text, message = 'Copied.') {
      return copyText(text).then(() => {
        this.announce(message);
      });
    },
    renderCallout(title, body) {
      return `<article class="lesson-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
    }
  };
}

async function bootstrap() {
  const root = document.getElementById('innovation-labs-app');
  if (!root) return;

  async function rerender(overrides = {}) {
    const stored = { ...defaultState(), ...loadJson(STATE_KEY, {}) };
    const state = { ...stored, ...overrides };
    const context = await buildLabContext({ scenarioId: state.scenarioId, sourceMode: state.sourceMode });
    if (!state.scenarioId) state.scenarioId = context.scenario.id;
    saveJson(STATE_KEY, state);
    root.innerHTML = renderShell(context, state);

    const activeLab = findLab(state.activeLabId);
    const workspace = root.querySelector('#lab-workspace');
    if (workspace && activeLab?.mount) {
      const helpers = helperSet(root, state, rerender);
      activeLab.mount(workspace, context, helpers);
    }

    root.querySelectorAll('[data-lab-id]').forEach((button) => button.addEventListener('click', () => rerender({ activeLabId: button.getAttribute('data-lab-id') })));
    root.querySelectorAll('[data-labs-filter]').forEach((button) => button.addEventListener('click', () => rerender({ activeCategory: button.getAttribute('data-labs-filter') })));
    root.querySelector('#labs-scenario-select')?.addEventListener('change', (event) => rerender({ scenarioId: event.target.value }));
    root.querySelector('#labs-source-select')?.addEventListener('change', (event) => rerender({ sourceMode: event.target.value }));
    root.querySelector('[data-labs-action="reset"]')?.addEventListener('click', () => {
      saveJson(STATE_KEY, defaultState());
      rerender(defaultState());
    });
    root.querySelector('[data-labs-action="copy-summary"]')?.addEventListener('click', async () => {
      const summary = `${activeLab.title}\n${activeLab.summary}\nScenario: ${context.scenario.title}\nComposite: ${context.metrics.composite}`;
      await copyText(summary);
      const live = document.getElementById('labs-live-region');
      if (live) live.textContent = 'Active lab summary copied.';
    });
  }

  rerender();
}

bootstrap().catch((error) => {
  const root = document.getElementById('innovation-labs-app');
  if (root) root.innerHTML = `<div class="labs-shell"><section class="labs-panel"><h1>Innovation Labs failed to load</h1><p>${escapeHtml(error.message)}</p></section></div>`;
  console.error(error);
});
