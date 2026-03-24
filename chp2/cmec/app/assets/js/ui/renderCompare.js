import { buildManualPrompt, getPreparedOutput } from '../domain/analysisEngine.js';
import { renderDeltaBars, renderMixChart, renderRadar } from './renderCharts.js';
import { tokenSummary } from '../utils/format.js';

export function renderCompare(state) {
  const scenario = state.currentScenario;
  const manualPrompt = buildManualPrompt(scenario);
  const preparedOutput = getPreparedOutput(scenario, state);
  const currentTokens = state.derived.metrics.current.tokens;
  const budget = state.derived.metrics.current.budget;
  const weakIncluded = state.baselineScenario.components.filter((component) => component.included);
  const currentIncluded = scenario.components.filter((component) => component.included);
  const changes = compareChanges(state.baselineScenario.components, scenario.components);
  const narratives = buildNarratives(changes);
  const causeTrace = buildCauseTrace(changes);
  const outputContrast = buildOutputContrast(scenario, state);

  return `
    <section class="panel-stack" id="compare-workspace" aria-labelledby="compare-title">
      <section class="panel">
        <header>
          <div>
            <h2 id="compare-title">Comparison workspace</h2>
            <p class="small-muted">Keep the weak package and the improved package mentally side by side so the lesson stays concrete.</p>
          </div>
          <button class="ghost-btn" type="button" data-action="toggle-compare">${state.showCompareView ? 'Collapse compare' : 'Open compare'}</button>
        </header>

        <div class="coach-grid footer-note compare-summary-grid">
          <article class="summary-callout coach-callout">
            <strong>Weak package started with</strong>
            <p class="small-muted">${weakIncluded.map((component) => component.label).join(' • ')}</p>
          </article>
          <article class="summary-callout success-callout coach-callout">
            <strong>Current package now includes</strong>
            <p class="small-muted">${currentIncluded.map((component) => component.label).join(' • ')}</p>
          </article>
        </div>

        <div class="cause-map-grid footer-note">
          <article class="summary-callout">
            <strong>What changed in the package</strong>
            <ul class="plain-list compact-list">
              ${changes.length ? changes.map((change) => `<li>${change.label}</li>`).join('') : '<li>No block changes yet. Apply a repair or load an explore drill to see causality.</li>'}
            </ul>
          </article>
          <article class="summary-callout success-callout">
            <strong>Why the metrics moved</strong>
            <ul class="plain-list compact-list">
              ${narratives.length ? narratives.map((note) => `<li>${note}</li>`).join('') : '<li>Make one meaningful change, then return here to explain which metric moved and why.</li>'}
            </ul>
          </article>
        </div>

        <div class="cause-trace-grid footer-note">
          ${causeTrace.length ? causeTrace.map((item) => `
            <article class="trace-card">
              <div class="trace-card-header">
                <strong>${item.title}</strong>
                <span class="metric-tag">${item.focus}</span>
              </div>
              <p class="small-muted">${item.why}</p>
              <p class="small-muted"><strong>Metric movement:</strong> ${item.metric}</p>
            </article>
          `).join('') : '<article class="trace-card"><strong>No visible package difference yet</strong><p class="small-muted">Apply one meaningful repair or load an Explore More drill, then come back here to inspect a clearer cause-and-effect trace.</p></article>'}
        </div>

        <div class="output-contrast-grid footer-note">
          <article class="compare-output-card">
            <span class="inspection-kicker">Weak package tendency</span>
            <h3>What the weak package often produces</h3>
            <div class="output-block">${outputContrast.weak}</div>
          </article>
          <article class="compare-output-card">
            <span class="inspection-kicker">Current package tendency</span>
            <h3>What the current package now supports</h3>
            <div class="output-block">${outputContrast.current}</div>
          </article>
        </div>

        ${state.showCompareView ? `
          <div class="compare-grid footer-note">
            <article>${renderDeltaBars(state.derived.metrics)}</article>
            <article>${renderRadar(state.derived.metrics)}</article>
          </div>
        ` : '<p class="small-muted">Compare view is collapsed. Reopen it to inspect weak-vs-current movement.</p>'}
      </section>

      <section class="panel chart-grid">
        <article>${renderMixChart(scenario)}</article>
        <article class="panel">
          <h3>Cause-and-effect notes</h3>
          <div class="summary-callout">
            <ul class="plain-list compact-list">
              ${state.derived.coaching.messages.map((message) => `<li>${message}</li>`).join('')}
            </ul>
          </div>
          <div class="legend-list">
            ${state.derived.coaching.compareNotes.map((note) => `<div class="legend-row"><span class="icon-dot"></span><span class="small-muted">${note}</span></div>`).join('')}
          </div>
        </article>
      </section>

      <section class="panel two-col">
        <article>
          <h3>Current package you can run</h3>
          <p class="small-muted">Copy the current package into an external LLM if you want to observe the package directly.</p>
          <div class="copy-block">${manualPrompt}</div>
          <div class="button-row footer-note">
            <button class="primary-btn" type="button" data-action="copy-manual-prompt">Copy current package</button>
            <button class="ghost-btn" type="button" data-action="reveal-strong">Reveal and load best-practice package</button>
          </div>
          <p class="inline-code-note">${tokenSummary(currentTokens, budget)} • ${currentTokens}/${budget} estimated tokens</p>
          <p class="small-muted action-feedback" id="copy-feedback">Copy sends the current package to your clipboard. Reveal loads the best-practice package into the current package area and metrics.</p>
        </article>
        <article>
          <h3>Observation support</h3>
          <ul class="plain-list">
            ${scenario.observeChecklist.map((item) => `<li>${item}</li>`).join('')}
          </ul>
          <label class="stack-field" for="paste-result">
            <span>Paste back [Observed LLM Output]</span>
            <textarea id="paste-result" rows="8" placeholder="Paste the model response here so you can compare it with the prepared example.">${state.pasteResult || ''}</textarea>
          </label>
          <p class="small-muted">Prepared example based on the current package:</p>
          <div class="output-block">${preparedOutput}</div>
        </article>
      </section>
    </section>
  `;
}

function compareChanges(baselineComponents, currentComponents) {
  const baselineMap = new Map(baselineComponents.map((component) => [component.id, component]));
  return currentComponents
    .filter((component) => baselineMap.get(component.id)?.included !== component.included)
    .map((component) => {
      const previous = baselineMap.get(component.id);
      const verb = component.included ? 'Added' : 'Removed';
      return {
        id: component.id,
        type: component.type,
        label: `${verb} ${component.label}`,
        component,
        previous
      };
    });
}

function buildCauseTrace(changes) {
  return changes.slice(0, 4).map((change) => {
    if (change.component.included) {
      return {
        title: `Added ${change.component.label}`,
        focus: focusLabel(change.type, true),
        why: changeReason(change.type, true),
        metric: focusMetric(change.type, true)
      };
    }
    return {
      title: `Removed ${change.component.label}`,
      focus: focusLabel(change.type, false),
      why: changeReason(change.type, false),
      metric: focusMetric(change.type, false)
    };
  });
}

function focusLabel(type, included) {
  if (included && ['grounding', 'dynamic'].includes(type)) return 'Grounding';
  if (included && ['schema', 'constraint', 'role'].includes(type)) return 'Structure';
  if (included && type === 'memory') return 'Continuity';
  if (type === 'noise') return included ? 'Overload risk' : 'Signal quality';
  return included ? 'Readiness' : 'Focus';
}

function focusMetric(type, included) {
  if (included && ['grounding', 'dynamic'].includes(type)) return 'Grounding should rise because the model has more approved evidence to rely on.';
  if (included && ['schema', 'constraint', 'role'].includes(type)) return 'Structure should rise because the answer shape is more controlled and reusable.';
  if (included && type === 'memory') return 'Continuity should rise because prior decisions or constraints can carry forward.';
  if (type === 'noise' && included) return 'Overload Risk may rise because extra context can crowd the package even when it sounds related.';
  if (type === 'noise' && !included) return 'Overload Risk should fall and Signal Quality often improves when noisy context is removed.';
  return included ? 'Mission Readiness should improve if the block adds useful signal without wasting budget.' : 'Mission Readiness may improve when low-value context is removed.';
}

function changeReason(type, included) {
  if (included && ['grounding', 'dynamic'].includes(type)) return 'This change gives the model concrete facts or policy support instead of forcing it to guess.';
  if (included && ['schema', 'constraint', 'role'].includes(type)) return 'This change tells the model how to organize the answer instead of hoping it chooses the right format.';
  if (included && type === 'memory') return 'This change preserves prior state that still matters so the answer stays consistent across turns.';
  if (type === 'noise' && included) return 'This change adds more material, but it may compete with higher-value evidence and make the package feel crowded.';
  if (type === 'noise' && !included) return 'Removing this block protects budget and helps the model stay focused on relevant evidence.';
  return included ? 'This change adds useful support that should make the package more reliable.' : 'Removing this block reduces distraction or unnecessary load.';
}

function buildNarratives(changes) {
  const notes = [];
  const hasGrounding = changes.some((change) => change.component.included && ['grounding', 'dynamic'].includes(change.type));
  const hasStructure = changes.some((change) => change.component.included && ['schema', 'constraint', 'role'].includes(change.type));
  const removedNoise = changes.some((change) => !change.component.included && change.type === 'noise');
  const addedNoise = changes.some((change) => change.component.included && change.type === 'noise');
  const hasMemory = changes.some((change) => change.component.included && change.type === 'memory');

  if (hasGrounding) notes.push('Added facts or policy evidence should raise Grounding because the model now has approved material to rely on.');
  if (hasStructure) notes.push('Added structure or constraints should raise Structure because the answer shape is no longer implicit.');
  if (removedNoise) notes.push('Removing noise should lower Overload Risk and often make Signal Quality cleaner by protecting token budget and focus.');
  if (addedNoise) notes.push('Adding noisy context may crowd the package even if some useful blocks are also present, so watch Overload Risk carefully.');
  if (hasMemory) notes.push('Adding memory should raise Continuity because the model can now carry forward the prior operational facts that still matter.');

  if (!notes.length) {
    notes.push('No block differences are visible yet, so the weak package and current package still behave almost the same.');
  }

  return notes;
}

function buildOutputContrast(scenario, state) {
  const currentReadiness = state.derived.metrics.current.readiness;
  return {
    weak: scenario.preparedOutputs.weak,
    current: currentReadiness >= 75 ? scenario.preparedOutputs.strong : getPreparedOutput(scenario, state)
  };
}
