import { escapeHtml, scoreTone } from '../shared/utils.js';

function replayCards(context) {
  const firstHistory = (context.history || []).filter((item) => item.scenarioId === context.scenario.id).slice(-3).reverse();
  const comparisonSummary = context.comparison.summary || context.metrics.narrativeSummary;
  const base = [
    {
      title: 'Scenario loaded',
      narrative: `The learner entered ${context.scenario.title} with the goal: ${context.scenario.learningObjective || context.scenario.chapterConcept}.`,
      signal: context.scenario.caseBrief
    },
    {
      title: 'Structural tension surfaced',
      narrative: comparisonSummary,
      signal: context.metrics.warnings?.[0] || 'No major warning yet.'
    },
    {
      title: 'Current readiness snapshot',
      narrative: `Composite ${context.metrics.composite} / ${context.metrics.readiness}`,
      signal: context.metrics.nextBestActions?.[0] || 'Tighten the package further.'
    }
  ];
  return firstHistory.map((item, index) => ({
    title: `Prior attempt ${index + 1}`,
    narrative: `${item.score} composite · ${item.readiness}`,
    signal: Object.entries(item.metrics || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'metric snapshot'
  })).concat(base);
}

export function mount(root, context, helpers) {
  const frames = replayCards(context);
  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Visual feature</span><span class="hud-pill">Narrative replay</span></div>
        <h2>Session Hologram Replay</h2>
        <p>Replay the run as a story of understanding: where tension entered, what changed, and why the package looks stronger or weaker now.</p>
      </div>
      <div class="timeline">
        ${frames.map((frame) => `
          <article class="timeline-node">
            <h3>${escapeHtml(frame.title)}</h3>
            <p>${escapeHtml(frame.narrative)}</p>
            <small>${escapeHtml(frame.signal)}</small>
          </article>`).join('')}
      </div>
      <article class="lesson-card">
        <h3>What the hologram says</h3>
        <p>Your session currently reads as <span class="status-dot ${scoreTone(context.metrics.composite)}"></span> <strong>${escapeHtml(context.metrics.readiness)}</strong>. The goal is not just to reach a better artifact. The goal is to understand the sequence of moves that created the improvement.</p>
      </article>
    </section>`;
  helpers.announce('Session hologram replay loaded.');
}
