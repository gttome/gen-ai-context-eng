import { renderCompare } from './renderCompare.js';
import { renderReadinessRing } from './renderCharts.js';
import { percent, signedDelta, tokenSummary } from '../utils/format.js';

export function renderMission(state) {
  const scenario = state.currentScenario;
  const current = state.derived.metrics.current;
  const baseline = state.derived.metrics.baseline;
  const budgetStatus = tokenSummary(current.tokens, current.budget);
  const includedComponents = scenario.components.filter((component) => component.included);
  const excludedComponents = scenario.components.filter((component) => !component.included);
  const recommendedMissing = excludedComponents.filter((component) => component.recommendedStrong);
  const baselineIncluded = state.baselineScenario.components.filter((component) => component.included);
  const missionChanges = compareChanges(state.baselineScenario.components, scenario.components);
  const leadingChanges = missionChanges.slice(0, 3);
  const exploreDrills = scenario.exploreMore?.drills || [];
  const activeDrill = exploreDrills.find((drill) => drill.id === state.activeExploreDrillId);

  return `
    <section class="panel two-col" aria-labelledby="brief-title">
      <article>
        <p class="eyebrow">Mission brief</p>
        <h2 id="brief-title">${scenario.family}</h2>
        <p class="lede">${scenario.learningObjective}</p>
        <div class="tag-row">
          ${scenario.conceptFocus.map((focus) => `<span class="tag">${focus}</span>`).join('')}
          <span class="tag">${state.derived.maturity}</span>
        </div>
      </article>
      <article class="summary-callout">
        <h3>Why this matters</h3>
        <p>${scenario.whyItMatters}</p>
      </article>
    </section>

    <section class="flow-strip panel" aria-label="Mission steps">
      <div class="flow-step is-active"><strong>1</strong><span>Inspect weak package</span></div>
      <div class="flow-step ${state.prediction ? 'is-active' : ''}"><strong>2</strong><span>Predict failure</span></div>
      <div class="flow-step ${state.derived.progress.corePercent >= 50 ? 'is-active' : ''}"><strong>3</strong><span>Repair package</span></div>
      <div class="flow-step ${state.showCompareView ? 'is-active' : ''}"><strong>4</strong><span>Compare outputs</span></div>
      <div class="flow-step ${state.debrief?.trim() ? 'is-active' : ''}"><strong>5</strong><span>Debrief lesson</span></div>
    </section>

    <section class="mission-layout">
      <article class="panel panel-stack mission-main-column" id="main-content">
        <section class="panel">
          <header>
            <div>
              <h2>1. Inspect the weak package first</h2>
              <p class="small-muted">Do not predict from memory. Study the actual weak package below, then name the likeliest failure.</p>
            </div>
            <span class="metric-tag">${baselineIncluded.length} of ${scenario.components.length} blocks included</span>
          </header>

          <div class="inspection-intro footer-note">
            <div>
              <p class="eyebrow">Before you answer</p>
              <h3>Study the visible package, then predict the failure.</h3>
              <p class="small-muted">This mission works best when you reason from evidence, not memory. First identify what the model can see, then identify the missing support it would need for a stronger answer.</p>
            </div>
            <div class="inspection-stats" aria-label="Weak package status">
              <div class="inspection-stat">
                <span class="inspection-stat-value">${baselineIncluded.length}</span>
                <span class="inspection-stat-label">included now</span>
              </div>
              <div class="inspection-stat">
                <span class="inspection-stat-value">${recommendedMissing.length}</span>
                <span class="inspection-stat-label">high-value gaps</span>
              </div>
              <div class="inspection-stat">
                <span class="inspection-stat-value">${scenario.components.length}</span>
                <span class="inspection-stat-label">total blocks</span>
              </div>
            </div>
          </div>

          <div class="inspection-grid footer-note">
            <article class="inspection-card inspection-card-success">
              <div class="inspection-card-header">
                <span class="inspection-kicker">Visible now</span>
                <strong>Included in the weak package</strong>
              </div>
              <div class="inspection-chip-list">
                ${baselineIncluded.map((component) => `<span class="inspection-chip">${component.label}</span>`).join('')}
              </div>
              <p class="small-muted">These blocks are what the model can currently rely on.</p>
            </article>
            <article class="inspection-card inspection-card-warning">
              <div class="inspection-card-header">
                <span class="inspection-kicker">Missing support</span>
                <strong>Important blocks still missing</strong>
              </div>
              <div class="inspection-chip-list">
                ${recommendedMissing.length
                  ? recommendedMissing.map((component) => `<span class="inspection-chip">${component.label}</span>`).join('')
                  : '<span class="inspection-chip">No recommended blocks are currently missing.</span>'}
              </div>
              <p class="small-muted">These are the likeliest improvements if the answer must become more trustworthy.</p>
            </article>
            <article class="inspection-card">
              <div class="inspection-card-header">
                <span class="inspection-kicker">Coach lens</span>
                <strong>What to inspect before predicting</strong>
              </div>
              <ol class="question-list compact-questions">
                <li>Which required facts or policy evidence are still absent?</li>
                <li>Is the response shape constrained enough to stay consistent?</li>
                <li>What noise might push the model toward a generic answer?</li>
              </ol>
            </article>
          </div>

          <div class="package-snapshot-grid footer-note">
            <article class="snapshot-card">
              <div class="snapshot-card-header">
                <div>
                  <span class="inspection-kicker">Current evidence</span>
                  <h3>What the model sees in the weak package</h3>
                </div>
                <span class="metric-tag">${baselineIncluded.length} included</span>
              </div>
              <div class="snapshot-list">
                ${baselineIncluded.map((component) => renderSnapshotItem(component, 'included')).join('')}
              </div>
            </article>
            <article class="snapshot-card snapshot-card-muted">
              <div class="snapshot-card-header">
                <div>
                  <span class="inspection-kicker">Potential repairs</span>
                  <h3>What is still missing from the package</h3>
                </div>
                <span class="metric-tag">${scenario.components.filter((component) => !component.includedWeak).length} hidden</span>
              </div>
              <div class="snapshot-list">
                ${scenario.components.filter((component) => !component.includedWeak).map((component) => renderSnapshotItem(component, 'missing')).join('')}
              </div>
            </article>
          </div>
        </section>

        <section class="panel">
          <header>
            <div>
              <h2>2. Predict the weak-state failure</h2>
              <p class="small-muted">${scenario.predictionPrompt}</p>
            </div>
            <span class="metric-tag">${state.prediction ? 'Answered' : 'Pending'}</span>
          </header>
          <div class="coach-grid footer-note prediction-hints-grid">
            <article class="hint-card">
              <strong>Hint: grounding</strong>
              <p class="small-muted">Would the model need to invent or guess facts because approved evidence is missing?</p>
            </article>
            <article class="hint-card">
              <strong>Hint: structure</strong>
              <p class="small-muted">Would the answer come back in an inconsistent shape because the output form is weak?</p>
            </article>
            <article class="hint-card">
              <strong>Hint: overload</strong>
              <p class="small-muted">Would irrelevant background make the answer generic or distracted?</p>
            </article>
          </div>
          <div class="prediction-list">
            ${scenario.predictionOptions.map((option, index) => `
              <label class="prediction-option" for="prediction-${index}">
                <span>
                  <input type="radio" name="prediction" id="prediction-${index}" value="${option.replaceAll('"', '&quot;')}" ${state.prediction === option ? 'checked' : ''} />
                  ${option}
                </span>
              </label>
            `).join('')}
          </div>
          <p class="small-muted">The prediction step matters because you must explain the weak package before you watch it improve.</p>
        </section>

        <section class="panel">
          <header>
            <div>
              <h2>3. Repair the package</h2>
              <p class="small-muted">Start from the visible weak package, then make a few meaningful changes instead of rebuilding everything from scratch.</p>
            </div>
            <span class="metric-tag">${budgetStatus}</span>
          </header>

          <div class="repair-list">
            ${scenario.recommendedActions.map((action) => `
              <button class="action-btn" type="button" data-action="apply-repair" data-repair-id="${action.id}">${action.label}</button>
            `).join('')}
          </div>

          <div class="package-columns footer-note">
            <section class="package-column" id="current-package-section">
              <div class="package-column-header">
                <h3>Current package now</h3>
                <p class="small-muted">These blocks are currently included and will appear in the copy-ready package.</p>
              </div>
              <div class="card-grid">
                ${includedComponents.map((component) => componentCard(component)).join('')}
              </div>
            </section>
            <section class="package-column">
              <div class="package-column-header">
                <h3>Available blocks not yet included</h3>
                <p class="small-muted">Use these when they clearly improve grounding, structure, continuity, or focus.</p>
              </div>
              <div class="card-grid">
                ${excludedComponents.map((component) => componentCard(component)).join('') || '<p class="small-muted">All blocks are currently included.</p>'}
              </div>
            </section>
          </div>
        </section>
      </article>

      <aside class="mission-right-rail panel-stack">
        <section class="panel sticky-rail-panel mission-progress-panel">
          <header>
            <div>
              <h2>Mission progress</h2>
              <p class="small-muted">The live metric dock stays pinned to the bottom so you can see cause-and-effect while you scroll.</p>
            </div>
            <span class="metric-tag">Always visible</span>
          </header>
          ${renderReadinessRing(current.readiness, state.derived.maturity)}
          <div class="progress-shell">
            <div class="kv-row"><dt>Core mission progress</dt><dd>${percent(state.derived.progress.corePercent)}</dd></div>
            <div class="progress-bar" aria-hidden="true"><span style="width:${state.derived.progress.corePercent}%;"></span></div>
            <div class="kv-row"><dt>Explore More progress</dt><dd>${percent(state.derived.progress.optionalPercent)}</dd></div>
            <div class="progress-bar" aria-hidden="true"><span style="width:${state.derived.progress.optionalPercent}%;"></span></div>
          </div>
          <div class="legend-list">
            ${state.derived.progress.completedSteps.map((step) => `<div class="legend-row"><span class="icon-dot"></span><span class="small-muted">${step}</span></div>`).join('') || '<p class="small-muted">No progress steps completed yet.</p>'}
          </div>
        </section>

        <section class="panel">
          <header>
            <div>
              <h2>Explore More</h2>
              <p class="small-muted">Optional deepening path. Core completion stands on its own, but this is the clearest next step when you want one more deliberate challenge.</p>
            </div>
            <button class="${state.showExploreMore ? 'ghost-btn' : 'primary-btn explore-open-btn'}" type="button" data-action="toggle-explore">${state.showExploreMore ? 'Hide Explore More' : 'Open Explore More drills'}</button>
          </header>
          ${state.showExploreMore ? `
            <div class="summary-callout">
              <strong>${scenario.exploreMore.title}</strong>
              <p>${scenario.exploreMore.summary}</p>
              <ul class="plain-list">
                ${scenario.exploreMore.notes.map((note) => `<li>${note}</li>`).join('')}
              </ul>
            </div>
            <div class="summary-callout warning-callout">
              <strong>Pattern assist</strong>
              <ul class="plain-list">
                ${state.derived.patternAssist.map((note) => `<li>${note}</li>`).join('')}
              </ul>
            </div>
            <div class="explore-drill-grid footer-note">
              ${exploreDrills.map((drill) => renderExploreDrillCard(drill, state.activeExploreDrillId)).join('')}
            </div>
            ${activeDrill ? `
              <div class="summary-callout success-callout footer-note">
                <strong>Active drill: ${activeDrill.title}</strong>
                <p>${activeDrill.summary}</p>
              </div>
            ` : ''}
            <button class="action-btn" type="button" data-action="harder-replay">${scenario.exploreMore.harderReplayLabel}</button>
          ` : `
            <div class="explore-preview-card">
              <div>
                <p class="eyebrow">Good next step after the core loop</p>
                <strong>${scenario.exploreMore.title}</strong>
                <p class="small-muted">${scenario.exploreMore.summary}</p>
              </div>
              <div class="explore-preview-chips">
                ${exploreDrills.slice(0, 3).map((drill) => `<span class="inspection-chip">${drill.title}</span>`).join('')}
              </div>
              <p class="small-muted">Open this area when you want a pattern-specific lens, an experiment drill, or a tighter replay challenge.</p>
            </div>
          `}
        </section>

        <section class="panel" id="mission-debrief-section">
          <header>
            <div>
              <h2>Mission debrief</h2>
              <p class="small-muted">Name what changed so the lesson sticks.</p>
            </div>
          </header>
          <div class="debrief-coach-grid footer-note">
            <article class="summary-callout">
              <strong>Write the cause-and-effect, not just the outcome</strong>
              <ul class="plain-list compact-list">
                <li>What weak-package gap mattered most?</li>
                <li>Which repair changed the answer quality the most?</li>
                <li>Which metric moved, and why did it move?</li>
              </ul>
            </article>
            <article class="summary-callout success-callout">
              <strong>Chapter 1 lens</strong>
              <p class="small-muted">Tie your debrief back to these Chapter 1 ideas: ${scenario.conceptFocus.join(' • ')}.</p>
              <p class="small-muted">A strong debrief should explain how context quality changed the likely model behavior.</p>
            </article>
          </div>
          ${leadingChanges.length ? `
            <div class="debrief-starter-list footer-note">
              <strong>Helpful sentence starters</strong>
              <ul class="plain-list compact-list">
                ${leadingChanges.map((change) => `<li>When I ${change.component.included ? 'added' : 'removed'} <strong>${change.component.label}</strong>, the package became ${change.component.included ? 'more grounded or better structured' : 'less noisy or less distracting'} because ...</li>`).join('')}
                <li>The readiness score moved because ...</li>
              </ul>
            </div>
          ` : ''}
          <label class="stack-field" for="debrief">
            <span>${scenario.debriefPrompt}</span>
            <textarea id="debrief" rows="7" placeholder="Capture the cause-and-effect in plain language.">${state.debrief || ''}</textarea>
          </label>
          ${state.derived.progress.corePercent >= 75 ? `
            <div class="summary-callout success-callout footer-note">
              <strong>Core Mission Complete</strong>
              <p>You have enough evidence to stop here, replay, or go deeper. Before moving on, make sure your debrief names the weak-state problem, the repair, and the metric movement you can defend.</p>
            </div>
          ` : `
            <div class="summary-callout footer-note">
              <strong>Keep going.</strong>
              <p>Inspect the weak package, complete the prediction, make meaningful repairs, and write the debrief to finish the core loop.</p>
            </div>
          `}
        </section>

        <section class="panel">
          <h2>Budget snapshot</h2>
          <dl class="kv-list">
            <div class="kv-row"><dt>Estimated tokens</dt><dd>${current.tokens}</dd></div>
            <div class="kv-row"><dt>Mission budget</dt><dd>${current.budget}</dd></div>
            <div class="kv-row"><dt>Status</dt><dd>${budgetStatus}</dd></div>
          </dl>
          <div class="summary-callout footer-note mission-save-note">
            <strong>Resume and reset clarity</strong>
            <p class="small-muted">This browser auto-saves your current package, prediction, compare state, paste-back, and debrief. Reset returns this mission to the prepared weak package. Back to launcher keeps the browser save so you can resume later or clear it from the launcher.</p>
          </div>
          <div class="footer-actions">
            <button class="ghost-btn" type="button" data-action="reset-mission">Restart weak package</button>
            <button class="primary-btn" type="button" data-action="back-to-launcher">Back to launcher</button>
          </div>
        </section>
      </aside>

      <section class="mission-metrics-dock" aria-label="Live mission metrics dock">
        <div class="metrics-dock-header">
          <p class="metrics-dock-titleline">
            <strong>Always-visible mission metrics</strong>
            <span>Each meaningful change should move a metric you can explain.</span>
          </p>
          <div class="metrics-dock-summary">
            <span class="metric-tag">Readiness ${Math.round(current.readiness)}%</span>
            <span class="metric-tag">${budgetStatus}</span>
          </div>
        </div>
        <div class="metrics-dock-scroll" role="group" aria-label="Current metrics and deltas">
          ${dockMetricCard('Signal Quality', current.signal, current.signal - baseline.signal, 'Specific and relevant?')}
          ${dockMetricCard('Grounding', current.grounding, current.grounding - baseline.grounding, 'Approved facts present?')}
          ${dockMetricCard('Structure', current.structure, current.structure - baseline.structure, 'Reusable answer shape?')}
          ${dockMetricCard('Continuity', current.continuity, current.continuity - baseline.continuity, 'Context carries forward?')}
          ${dockMetricCard('Overload Risk', current.overload, current.overload - baseline.overload, 'Noise still manageable?')}
          ${dockMetricCard('Mission Readiness', current.readiness, current.readiness - baseline.readiness, 'Ready for a stronger run?')}
        </div>
      </section>

    ${renderCompare(state)}
  `;
}

function renderSnapshotItem(component, mode) {
  const statusClass = mode === 'included'
    ? 'is-included'
    : component.recommendedStrong
      ? 'is-missing-recommended'
      : 'is-missing-optional';

  return `
    <div class="snapshot-item ${statusClass}">
      <div class="snapshot-item-header">
        <div class="snapshot-item-heading">
          <span class="token-badge">${component.tokenEstimate} tokens</span>
          <strong>${component.label}</strong>
        </div>
      </div>
      <p class="snapshot-item-copy small-muted">${component.content}</p>
      ${renderCoachStrip(component, mode)}
    </div>
  `;
}

function componentCard(component) {
  return `
    <article class="component-card ${component.included ? 'included' : 'excluded'} ${component.recommendedStrong ? 'recommended' : ''} ${component.type}">
      <header>
        <div>
          <h3>${component.label}</h3>
          <div class="component-meta">
            <span class="tag">${component.type}</span>
            <span class="tag">${component.tokenEstimate} tokens</span>
            <span class="tag">${component.priority} priority</span>
          </div>
        </div>
        <button
          type="button"
          class="toggle-btn"
          data-action="toggle-component"
          data-component-id="${component.id}"
          data-next-included="${component.included ? 'false' : 'true'}"
          aria-pressed="${component.included ? 'true' : 'false'}">
          ${component.included ? 'Included' : 'Excluded'}
        </button>
      </header>
      <div class="content-block">${component.content}</div>
      ${renderCoachStrip(component, component.included ? 'included' : 'missing')}
      <p class="small-muted">${component.recommendedStrong ? 'Recommended for the stronger package.' : 'Use only if it clearly adds value.'}</p>
    </article>
  `;
}

function compareChanges(baselineComponents, currentComponents) {
  const baselineMap = new Map(baselineComponents.map((component) => [component.id, component]));
  return currentComponents
    .filter((component) => baselineMap.get(component.id)?.included !== component.included)
    .map((component) => ({
      component,
      previous: baselineMap.get(component.id)
    }));
}

function renderExploreDrillCard(drill, activeDrillId) {
  return `
    <article class="drill-card ${activeDrillId === drill.id ? 'is-active' : ''}">
      <div class="drill-card-header">
        <div>
          <span class="inspection-kicker">Micro-drill</span>
          <h3>${drill.title}</h3>
        </div>
        <span class="metric-tag">${activeDrillId === drill.id ? 'Loaded' : 'Ready'}</span>
      </div>
      <p class="small-muted">${drill.summary}</p>
      <ul class="plain-list compact-list">
        ${drill.watch.map((item) => `<li>${item}</li>`).join('')}
      </ul>
      <button class="ghost-btn" type="button" data-action="apply-explore-drill" data-drill-id="${drill.id}">Load drill</button>
    </article>
  `;
}

function renderCoachStrip(component, mode) {
  const coach = componentCoach(component, mode);
  return `
    <div class="component-coach-strip">
      <div class="component-coach-item">
        <span class="component-coach-label">Why it matters</span>
        <span>${coach.why}</span>
      </div>
      <div class="component-coach-item">
        <span class="component-coach-label">Risk to watch</span>
        <span>${coach.risk}</span>
      </div>
      <div class="component-coach-item">
        <span class="component-coach-label">Metric movement</span>
        <span>${coach.metric}</span>
      </div>
    </div>
  `;
}

function componentCoach(component, mode) {
  const missing = mode === 'missing';
  const coachMap = {
    task: {
      why: 'Clarifies the job so the answer stays specific to the request.',
      riskMissing: 'Without a clear task, the model may solve the wrong problem or answer too broadly.',
      riskIncluded: 'A task frame helps, but it cannot replace real facts or structure.',
      metric: 'Usually moves Signal Quality and Mission Readiness.'
    },
    role: {
      why: 'Sets tone and response discipline so the answer stays usable.',
      riskMissing: 'Without role guidance, the answer may drift in tone or overstate certainty.',
      riskIncluded: 'Tone control helps presentation, but it does not ground the answer in evidence.',
      metric: 'Usually moves Structure and Signal Quality.'
    },
    grounding: {
      why: 'Anchors the answer in approved facts instead of guesswork.',
      riskMissing: 'If this stays out, the model is more likely to speculate or hedge.',
      riskIncluded: 'Grounding only works when the excerpt is relevant and actually tied to the case.',
      metric: 'Usually moves Grounding and Mission Readiness.'
    },
    dynamic: {
      why: 'Adds the current case facts so the answer matches the live situation.',
      riskMissing: 'Without fresh case data, the response may sound generic or stale.',
      riskIncluded: 'Dynamic facts help only when they are current and directly relevant.',
      metric: 'Usually moves Grounding and Continuity.'
    },
    schema: {
      why: 'Shapes the answer so it comes back in a reusable format.',
      riskMissing: 'If this is absent, the answer may contain the right facts but arrive in an inconsistent blob.',
      riskIncluded: 'Structure helps reuse, but it still needs the right evidence inside it.',
      metric: 'Usually moves Structure and Mission Readiness.'
    },
    constraint: {
      why: 'Limits unsupported behavior so the answer stays inside the evidence.',
      riskMissing: 'Without this guardrail, the model may improvise beyond what the package supports.',
      riskIncluded: 'Constraints are strongest when paired with clear facts and a usable format.',
      metric: 'Usually moves Structure and Mission Readiness.'
    },
    memory: {
      why: 'Carries forward the prior facts that still matter now.',
      riskMissing: 'Without memory, the model may drop key earlier observations and restart from scratch.',
      riskIncluded: 'Memory helps only when it is short, relevant, and free of stale noise.',
      metric: 'Usually moves Continuity and Mission Readiness.'
    },
    noise: {
      why: 'This block mostly adds background volume rather than decision-quality evidence.',
      riskMissing: 'Leaving noise out is usually good because it protects budget and focus.',
      riskIncluded: 'When this stays in, it can distract the model and make the answer more generic.',
      metric: 'Removing it should lower Overload Risk and often improve Signal Quality.'
    }
  };

  const entry = coachMap[component.type] || coachMap.task;
  return {
    why: entry.why,
    risk: missing ? entry.riskMissing : entry.riskIncluded,
    metric: entry.metric
  };
}

function dockMetricCard(label, value, delta, question) {
  const roundedDelta = Math.round(delta);
  const positive = roundedDelta >= 0;
  const deltaClass = positive ? 'text-success' : 'text-danger';
  return `
    <article class="dock-metric-card">
      <div class="dock-metric-topline">
        <strong>${label}</strong>
        <span class="dock-metric-delta ${deltaClass}">${signedDelta(delta)}</span>
      </div>
      <p class="dock-metric-summaryline">
        <span class="dock-metric-value">${Math.round(value)}%</span>
        <span class="dock-metric-question">${question}</span>
        <span class="dock-metric-baseline">Weak ${Math.round(value - delta)}%</span>
      </p>
    </article>
  `;
}
