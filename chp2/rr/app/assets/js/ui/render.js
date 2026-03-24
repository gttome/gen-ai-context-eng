import { getSelectedChange } from '../domain/scenario-engine.js';

function percent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function formatDelta(value) {
  if (value === null || Number.isNaN(value)) return '—';
  const rounded = value.toFixed(2);
  return value > 0 ? `+${rounded}` : rounded;
}

function metricState(value, type) {
  if (value === null || value === undefined) return 'warn';
  if (type === 'delta') {
    if (value > 0.35) return 'good';
    if (value > 0) return 'warn';
    return 'bad';
  }
  if (value >= 0.7) return 'good';
  if (value >= 0.4) return 'warn';
  return 'bad';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function scoreHint(criterionId) {
  const hints = {
    grounding: 'Ask: does the answer stay inside the approved source, or does it invent a rule?',
    completeness: 'Ask: does the answer cover the main rule, the important exception, and the next step?',
    boundary: 'Ask: does the answer respect approval, escalation, privacy, or policy limits?',
    clarity: 'Ask: would a busy coworker know what to do next after reading this?',
    facts: 'Ask: did the summary keep the facts that matter, without smoothing them away?',
    actions: 'Ask: would the next reviewer know the next action without reopening the full case?',
    action: 'Ask: would the reader know exactly what to do next after reading this message?',
    constraints: 'Ask: does the answer preserve who is affected, what is optional, and what boundaries still apply?',
    escalation: 'Ask: did the answer keep the urgency, risk, or SLA trigger visible?',
    brevity: 'Ask: is it concise enough for real queue use while still keeping critical details?',
    relevance: 'Ask: does this surface the decision, risk, or signal the audience actually needs?',
    tone: 'Ask: does it sound disciplined and credible for the intended workplace audience?',
    concision: 'Ask: is it short enough for the audience while still preserving critical substance?',
    accuracy: 'Ask: does the answer reflect the original source faithfully?',
    evidence: 'Ask: does it show which facts or signals support the recommendation?',
    caution: 'Ask: does it avoid overclaiming or sounding more certain than the evidence allows?',
    usefulness: 'Ask: would this actually help a decision-maker move forward responsibly?',
    owners: 'Ask: would the receiving team know who owns the next action?',
    dependencies: 'Ask: are blockers, pending inputs, or approvals still visible?',
    readiness: 'Ask: does the artifact make it clear whether the work is ready, partial, or blocked?'
  };
  return hints[criterionId] || 'Ask: does the answer clearly meet this criterion for this case?';
}


function scoreWord(score) {
  if (score === 0) return 'Weak';
  if (score === 1) return 'Partial';
  if (score === 2) return 'Strong';
  return 'Unscored';
}

function lifecycleLesson(topFailureLabel, deployReadiness) {
  if (deployReadiness === 'Deploy') {
    return 'Chapter 2 lesson: a deployment recommendation should come after explicit evidence, not after one impressive demo answer.';
  }
  if (deployReadiness === 'Iterate again') {
    return 'Chapter 2 lesson: evaluation gave you a usable signal, but the evidence still says one more disciplined iteration is safer than guessing.';
  }
  if (topFailureLabel) {
    return `Chapter 2 lesson: the dominant issue looks bigger than a surface tweak. ${topFailureLabel} may point back to earlier lifecycle work such as selection or shaping.`;
  }
  return 'Chapter 2 lesson: score first, diagnose the pattern, then decide whether the next move is another iteration or a revisit to earlier lifecycle work.';
}

export function renderHeroTags(container, scenario) {
  container.innerHTML = [
    ...scenario.phaseFocus.map((phase) => `<span class="chip">${escapeHtml(phase)} focus</span>`),
    `<span class="chip">${escapeHtml(scenario.estimatedMinutes)}</span>`,
    `<span class="chip">Prompt ${escapeHtml(scenario.promptVersion)}</span>`
  ].join('');
}

export function renderWalkthrough(container, scenario, state, stepState, hidden, onToggle) {
  if (hidden) {
    container.innerHTML = `
      <div class="panel-header">
        <div>
          <h2>First-run walkthrough</h2>
          <p class="muted">Reopen the plain-language guide whenever you want a calmer overview.</p>
        </div>
        <button class="button secondary walkthrough-toggle" type="button">Show walkthrough again</button>
      </div>
    `;
    container.querySelector('.walkthrough-toggle')?.addEventListener('click', () => onToggle(false));
    return;
  }

  const currentStepText = !state.started
    ? 'Right now, stay simple: choose one scenario, read what good looks like, then press Start Scoring.'
    : !stepState.scoringComplete
      ? 'Right now, score one row at a time. You are not writing anything new—you are only judging what is already on screen.'
      : !stepState.diagnosisComplete
        ? 'Right now, look for the single biggest weakness in each case. Do not try to tag every possible problem.'
        : !stepState.changeSelected
          ? 'Right now, choose one fix only. The point is to see whether one targeted change helps the same cases.'
          : 'Right now, read the before/after comparison and takeaway summary. That is the learning payoff of the lab.';

  container.innerHTML = `
    <div class="panel-header">
      <div>
        <h2>First-run walkthrough</h2>
        <p class="muted">This guide explains the lab in plain language before you get into the details.</p>
      </div>
      <button class="button secondary walkthrough-toggle" type="button">Hide walkthrough</button>
    </div>
    <div class="walkthrough-grid">
      <article class="summary-card walkthrough-card">
        <h3>1. What this lab teaches</h3>
        <p>This lab teaches one Chapter 2 habit: <strong>do not trust fluent output until you score it against clear criteria.</strong></p>
      </article>
      <article class="summary-card walkthrough-card">
        <h3>2. What you will do</h3>
        <p>You will review one scenario, score the baseline answers, tag the main failure, choose one fix, then compare the same cases before and after.</p>
      </article>
      <article class="summary-card walkthrough-card">
        <h3>3. How to keep it easy</h3>
        <p>You are not expected to be perfect. Use the 0-1-2 scale quickly and rely on the expected signals and coaching hints shown inside each case.</p>
      </article>
      <article class="summary-card walkthrough-card highlight">
        <h3>4. What to do right now</h3>
        <p>${escapeHtml(currentStepText)}</p>
      </article>
    </div>
    <div class="chapter-callout walkthrough-callout">
      <strong>Chapter 2 reminder:</strong> the reliable pattern is <strong>same test cases → explicit rubric → one targeted change → evidence-based decision</strong>.
    </div>
  `;
  container.querySelector('.walkthrough-toggle')?.addEventListener('click', () => onToggle(true));
}

export function renderScenarioCards(container, appData, state, onSelect) {
  container.innerHTML = appData.scenarios.map((scenario) => `
    <article class="scenario-card ${scenario.id === state.selectedScenarioId ? 'active' : ''}">
      <h3>${escapeHtml(scenario.title)}</h3>
      <p>${escapeHtml(scenario.goal)}</p>
      <div class="tag-row">
        <span class="chip">${escapeHtml(scenario.estimatedMinutes)}</span>
        ${scenario.phaseFocus.map((phase) => `<span class="chip">${escapeHtml(phase)}</span>`).join('')}
      </div>
      <div style="height: 12px"></div>
      <button class="button secondary scenario-select" data-scenario-id="${escapeHtml(scenario.id)}" type="button">Choose scenario</button>
    </article>
  `).join('');
  container.querySelectorAll('.scenario-select').forEach((button) => button.addEventListener('click', () => onSelect(button.dataset.scenarioId, button)));
}

export function renderScenarioSummary(container, scenario) {
  const rubricList = scenario.rubric.map((criterion) => `<span>${escapeHtml(criterion.label)}</span>`).join('');
  const caseList = scenario.testCases.map((testCase) => `
    <div class="kv-item">
      <strong>${escapeHtml(testCase.id)} • ${escapeHtml(testCase.question)}</strong>
      <span class="muted">Look for: ${escapeHtml(testCase.expectedSignals.join(' • '))}</span>
    </div>
  `).join('');
  container.innerHTML = `
    <div class="chapter-callout">
      <strong>Why this section matters:</strong> Chapter 2 says learners should review the rubric and representative cases <strong>before</strong> they trust a result. This section shows what “good” means for this run.
    </div>
    <div class="summary-grid">
      <article class="summary-card">
        <h3>Scenario brief</h3>
        <p>${escapeHtml(scenario.scenarioBrief)}</p>
        <div class="inline-list">${rubricList}</div>
      </article>
      <article class="summary-card">
        <h3>Plain-language scoring guide</h3>
        <div class="kv-list">
          <div class="kv-item"><strong>0 = weak</strong><span class="muted">The answer misses or breaks the criterion in a meaningful way.</span></div>
          <div class="kv-item"><strong>1 = partial</strong><span class="muted">Some useful signal is present, but the answer is still incomplete, risky, or uneven.</span></div>
          <div class="kv-item"><strong>2 = strong</strong><span class="muted">The answer clearly meets the criterion for this case.</span></div>
        </div>
      </article>
      <article class="summary-card">
        <h3>Representative test cases</h3>
        <div class="kv-list">${caseList}</div>
      </article>
      <article class="summary-card">
        <h3>How this run works</h3>
        <div class="kv-list">
          <div class="kv-item"><strong>Step 1</strong><span class="muted">Score the baseline answers using the rubric.</span></div>
          <div class="kv-item"><strong>Step 2</strong><span class="muted">Name the biggest failure pattern in each case.</span></div>
          <div class="kv-item"><strong>Step 3</strong><span class="muted">Pick one targeted fix instead of random tweaking.</span></div>
          <div class="kv-item"><strong>Step 4</strong><span class="muted">Compare the same cases and decide whether to deploy, iterate, or revisit earlier lifecycle work.</span></div>
        </div>
      </article>
      <article class="summary-card summary-card-wide">
        <h3>Chapter 2 alignment</h3>
        <ul>
          ${scenario.chapterLinks.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </article>
    </div>
  `;
}

export function renderStepTracker(container, stepState) {
  container.innerHTML = stepState.steps.map((step, index) => `
    <div class="step-item ${step.status === 'active' ? 'active' : ''} ${step.status === 'done' ? 'done' : ''}">
      <div class="step-index">${index + 1}</div>
      <div>
        <strong>${escapeHtml(step.label)}</strong>
        <div class="step-status">${escapeHtml(step.description)}</div>
      </div>
      <div class="step-status">${step.status === 'done' ? 'Done' : step.status === 'active' ? 'Now' : 'Next'}</div>
    </div>
  `).join('');
}

export function renderMetricGrid(container, metrics) {
  const cards = [
    { label: 'Pass Rate', value: percent(metrics.passRate), state: metricState(metrics.passRate, 'ratio'), helper: 'Cases meeting the current pass rule.' },
    { label: 'Criterion Coverage', value: percent(metrics.criterionCoverage), state: metricState(metrics.criterionCoverage, 'ratio'), helper: 'How much of the rubric is fully scored.' },
    { label: 'Failure Concentration', value: percent(metrics.failureConcentration), state: metricState(1 - metrics.failureConcentration, 'ratio') === 'good' ? 'bad' : (metrics.failureConcentration >= 0.67 ? 'bad' : metrics.failureConcentration >= 0.34 ? 'warn' : 'good'), helper: 'How concentrated the dominant failure cluster is.' },
    { label: 'Improvement Delta', value: formatDelta(metrics.improvementDelta), state: metricState(metrics.improvementDelta ?? -1, 'delta'), helper: 'Average score shift after the selected change.' },
    { label: 'Regression Stability', value: metrics.regressionStability === null ? '—' : percent(metrics.regressionStability), state: metricState(metrics.regressionStability ?? 0, 'ratio'), helper: 'How consistently the change avoided regression.' },
    { label: 'Deploy Readiness', value: metrics.deployReadiness, state: metrics.deployReadinessState, helper: 'Recommendation state grounded in quality and stability.' }
  ];
  container.innerHTML = cards.map((card) => `
    <article class="metric-card">
      <div class="muted">${escapeHtml(card.label)}</div>
      <strong>${escapeHtml(card.value)}</strong>
      <small class="metric-state ${escapeHtml(card.state)}">${escapeHtml(card.helper)}</small>
    </article>
  `).join('');
}

export function renderCases(container, scenario, scores, scoringLocked, onScore) {
  container.innerHTML = scenario.testCases.map((testCase) => {
    const scoredCount = scenario.rubric.filter((criterion) => scores[testCase.id][criterion.id] !== null).length;
    const complete = scoredCount === scenario.rubric.length;
    return `
      <article class="case-card">
        <div class="case-header">
          <div>
            <h3>${escapeHtml(testCase.id)} • ${escapeHtml(testCase.question)}</h3>
            <p class="muted">Look for: ${escapeHtml(testCase.expectedSignals.join(' • '))}</p>
          </div>
          <div class="case-progress-badge ${complete ? 'done' : 'active'}">${scoredCount}/${scenario.rubric.length} scored</div>
        </div>
        <div class="chapter-callout compact">
          <strong>Fast coaching:</strong> score what is visible in the answer. Do not imagine missing evidence into existence.
        </div>
        <div class="output-box">
          <strong>Baseline output</strong>
          <p>${escapeHtml(testCase.baselineOutput)}</p>
        </div>
        <div class="case-helper-box">
          <strong>How to judge this case</strong>
          <ul>
            ${testCase.expectedSignals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join('')}
          </ul>
        </div>
        <div class="criteria-grid">
          ${scenario.rubric.map((criterion) => `
            <div class="criterion-row">
              <div>
                <strong>${escapeHtml(criterion.label)}</strong>
                <div class="muted">${escapeHtml(criterion.description)}</div>
                <div class="criterion-coach">${escapeHtml(scoreHint(criterion.id))}</div>
              </div>
              <div class="score-buttons" role="group" aria-label="Score ${escapeHtml(criterion.label)} for ${escapeHtml(testCase.id)}">
                ${[0,1,2].map((value) => `
                  <button class="score-button ${scores[testCase.id][criterion.id] === value ? 'active' : ''}" ${scoringLocked ? 'disabled' : ''} data-case-id="${escapeHtml(testCase.id)}" data-criterion-id="${escapeHtml(criterion.id)}" data-score="${value}" type="button">${value}</button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.score-button').forEach((button) => {
    button.addEventListener('click', () => onScore(button.dataset.caseId, button.dataset.criterionId, Number(button.dataset.score), button));
  });
}


export function renderBestPracticeReview(container, scenario, metrics) {
  const review = metrics.bestPractice;
  if (!review || !review.totalComparisons) {
    container.innerHTML = '<div class="status-banner">Submit scoring to unlock the best-practice review.</div>';
    return;
  }

  const summaryCards = [
    { label: 'Exact matches', value: `${review.exactMatches}/${review.totalComparisons}`, helper: 'How often your scores matched the best-practice review.' },
    { label: 'Calibration rate', value: percent(review.exactMatchRate), helper: 'Higher means your scoring is already close to a strong evaluator.' },
    { label: 'Largest gap', value: review.largestGap ? `${review.largestGap} point${review.largestGap === 1 ? '' : 's'}` : '0', helper: 'The biggest score difference to notice first.' }
  ];

  if (!review.mismatchCount) {
    container.innerHTML = `
      <div class="chapter-callout compact">
        <strong>Why this review matters:</strong> you scored first. Now the lab shows the strongest evaluator view so you can calibrate your judgment without guessing.
      </div>
      <div class="delta-card-row">
        ${summaryCards.map((card) => `
          <article class="delta-card good">
            <div class="muted">${escapeHtml(card.label)}</div>
            <div class="delta-value">${escapeHtml(card.value)}</div>
            <div class="muted">${escapeHtml(card.helper)}</div>
          </article>
        `).join('')}
      </div>
      <div style="height:16px"></div>
      <article class="summary-card">
        <h3>Best-practice review</h3>
        <p>Your baseline scoring already matches the best-practice review on every criterion for this run. Move on to the failure tags and keep the same disciplined logic.</p>
      </article>
    `;
    return;
  }

  container.innerHTML = `
    <div class="chapter-callout compact">
      <strong>Why this review matters:</strong> you score first, then compare your judgment with a best-practice review. Focus on the biggest gaps only. This is calibration, not extra grading.
    </div>
    <div class="delta-card-row">
      ${summaryCards.map((card) => `
        <article class="delta-card ${review.mismatchCount ? 'warn' : 'good'}">
          <div class="muted">${escapeHtml(card.label)}</div>
          <div class="delta-value">${escapeHtml(card.value)}</div>
          <div class="muted">${escapeHtml(card.helper)}</div>
        </article>
      `).join('')}
    </div>
    <div style="height:16px"></div>
    <article class="summary-card">
      <h3>Where the strongest evaluator would score differently</h3>
      <p class="muted">Start with these gaps. They are the fastest way to understand what the rubric is really asking you to notice.</p>
      <div class="best-practice-list">
        ${review.focusEntries.map((entry) => `
          <div class="best-practice-item">
            <div class="best-practice-header">
              <strong>${escapeHtml(entry.caseId)} • ${escapeHtml(entry.criterionLabel)}</strong>
              <span class="recommendation-chip ${entry.direction === 'high' ? 'warn' : 'good'}">Your score ${entry.userScore} • Best-practice ${entry.bestScore}</span>
            </div>
            <div class="muted best-practice-question">${escapeHtml(entry.question)}</div>
            <p>${escapeHtml(entry.reason)}</p>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

export function renderHeatmap(container, scenario, metrics) {
  const baselineByCase = Object.fromEntries(metrics.baseline.map((entry) => [entry.caseId, entry.criteria]));
  container.innerHTML = `
    <div class="chapter-callout compact">
      <strong>Chapter 2 reminder:</strong> this pattern view matters because one strong answer can hide a repeatable weakness. The heatmap helps you see the repeated problem, not just the loudest case.
    </div>
    <div class="heatmap">
      <div class="heatmap-row header">
        <div>Case</div>
        ${scenario.rubric.map((criterion) => `<div>${escapeHtml(criterion.label)}</div>`).join('')}
      </div>
      ${scenario.testCases.map((testCase) => `
        <div class="heatmap-row">
          <div class="muted">${escapeHtml(testCase.id)}</div>
          ${scenario.rubric.map((criterion) => {
            const value = baselineByCase[testCase.id][criterion.id];
            if (value === null) return '<div class="heat-cell empty">—</div>';
            return `<div class="heat-cell score-${value}">${value}</div>`;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

export function renderHeatmapLegend(container) {
  container.innerHTML = '<span>0 = weak</span><span>1 = partial</span><span>2 = strong</span>';
}


export function renderDiagnosis(container, appData, scenario, selectedFailures, disabled, onSelect) {
  const failureGuidance = scenario.coaching?.failureGuidance || {};
  container.innerHTML = `
    <div class="chapter-callout compact">
      <strong>How to think here:</strong> choose the <strong>single biggest reason</strong> each answer is weak. Chapter 2 warns against vague iteration, so this step forces you to name the dominant pattern before you change anything.
    </div>
    ${scenario.testCases.map((testCase) => {
      const selectedFailureId = selectedFailures[testCase.id];
      const guidance = selectedFailureId ? failureGuidance[selectedFailureId] : null;
      const failureLabel = selectedFailureId ? (appData.failureTypes.find((failure) => failure.id === selectedFailureId)?.label || selectedFailureId) : null;
      return `
      <article class="summary-card">
        <h3>${escapeHtml(testCase.id)} main failure</h3>
        <p class="muted">Pick one tag only. Choose the biggest reason this output is weak or risky.</p>
        <div class="failure-chip-row">
          ${appData.failureTypes.map((failure) => `
            <button class="failure-chip ${selectedFailures[testCase.id] === failure.id ? 'active' : ''}" ${disabled ? 'disabled' : ''} data-case-id="${escapeHtml(testCase.id)}" data-failure-id="${escapeHtml(failure.id)}" type="button">${escapeHtml(failure.label)}</button>
          `).join('')}
        </div>
        ${guidance ? `
          <div class="note-box choice-coach">
            <strong>${escapeHtml(failureLabel)} in this scenario</strong>
            <ul>
              <li><strong>Why this tag fits:</strong> ${escapeHtml(guidance.why)}</li>
              <li><strong>What to notice next:</strong> ${escapeHtml(guidance.notice)} This case especially needs: ${escapeHtml(testCase.expectedSignals.join(' • '))}.</li>
              <li><strong>Likely upstream phase to revisit:</strong> ${escapeHtml(guidance.upstreamPhase)} — ${escapeHtml(guidance.phaseWhy)}</li>
            </ul>
          </div>
        ` : ''}
      </article>
    `;}).join('')}
  `;
  container.querySelectorAll('.failure-chip').forEach((button) => button.addEventListener('click', () => onSelect(button.dataset.caseId, button.dataset.failureId, button)));
}


export function renderChangeOptions(container, scenario, selectedChangeId, enabled, onSelect) {
  const changeGuidance = scenario.coaching?.changeGuidance || {};
  container.innerHTML = `
    <div class="chapter-callout compact">
      <strong>Why only one fix?</strong> Chapter 2 teaches disciplined iteration. If you stack many changes at once, you lose the ability to tell which one actually helped.
    </div>
    ${scenario.changeOptions.map((change) => {
      const guidance = changeGuidance[change.id];
      return `
      <article class="change-card ${selectedChangeId === change.id ? 'active' : ''}">
        <h3>${escapeHtml(change.label)}</h3>
        <p>${escapeHtml(change.summary)}</p>
        <p class="muted"><strong>Best when:</strong> ${escapeHtml(change.rationale)}</p>
        <div class="inline-list">
          ${Object.entries(change.deltaByCriterion).map(([criterionId, delta]) => `<span>${escapeHtml(criterionId)} ${delta > 0 ? '+' : ''}${delta}</span>`).join('')}
        </div>
        ${selectedChangeId === change.id && guidance ? `
          <div class="note-box choice-coach">
            <strong>${escapeHtml(guidance.title)}</strong>
            <ul>
              <li><strong>Why this fix fits:</strong> ${escapeHtml(guidance.why)}</li>
              <li><strong>What to notice in the comparison:</strong> ${escapeHtml(guidance.notice)}</li>
              <li><strong>Lifecycle link:</strong> ${escapeHtml(guidance.phaseLink)}</li>
            </ul>
          </div>
        ` : ''}
        <div style="height: 12px"></div>
        <button class="button secondary change-select" ${enabled ? '' : 'disabled'} data-change-id="${escapeHtml(change.id)}" type="button">Use this fix</button>
      </article>
    `;}).join('')}
  `;
  container.querySelectorAll('.change-select').forEach((button) => button.addEventListener('click', () => onSelect(button.dataset.changeId, button)));
}

export function renderComparison(container, scenario, metrics, state) {
  const selectedChange = getSelectedChange(scenario, state);
  if (!selectedChange) {
    container.innerHTML = '<div class="status-banner">Choose one targeted fix to unlock the before/after comparison.</div>';
    return;
  }
  const baselineByCase = Object.fromEntries(metrics.baseline.map((entry) => [entry.caseId, entry]));
  const revisedByCase = Object.fromEntries(metrics.revised.map((entry) => [entry.caseId, entry]));
  const deltaCards = [
    { label: 'Improvement delta', value: formatDelta(metrics.improvementDelta), state: metricState(metrics.improvementDelta ?? -1, 'delta'), helper: 'Average score shift from the selected change.' },
    { label: 'Regression stability', value: metrics.regressionStability === null ? '—' : percent(metrics.regressionStability), state: metricState(metrics.regressionStability ?? 0, 'ratio'), helper: 'Higher means the change avoided backsliding.' },
    { label: 'Recommendation state', value: metrics.deployReadiness, state: metrics.deployReadinessState, helper: 'Grounded in scores, stability, and thresholds.' }
  ];

  container.innerHTML = `
    <div class="chapter-callout compact">
      <strong>Why this comparison matters:</strong> Chapter 2 says you should rerun the <strong>same cases</strong> after a targeted change. That is how you tell improvement apart from guesswork.
    </div>
    <div class="status-banner ${escapeHtml(metrics.deployReadinessState)}"><strong>Selected fix:</strong> ${escapeHtml(selectedChange.label)} — ${escapeHtml(selectedChange.summary)}</div>
    <div style="height:14px"></div>
    <div class="delta-card-row">
      ${deltaCards.map((card) => `
        <article class="delta-card ${escapeHtml(card.state)}">
          <div class="muted">${escapeHtml(card.label)}</div>
          <div class="delta-value">${escapeHtml(card.value)}</div>
          <div class="muted">${escapeHtml(card.helper)}</div>
        </article>
      `).join('')}
    </div>
    <div style="height:16px"></div>
    <article class="summary-card">
      <h3>Criterion comparison</h3>
      <div class="bar-list">
        ${metrics.criterionAverages.map((criterion) => `
          <div class="bar-row">
            <strong>${escapeHtml(criterion.label)}</strong>
            <div class="bar-track" aria-label="${escapeHtml(criterion.label)} comparison">
              <span class="bar-fill baseline" style="width:${(criterion.baseline / 2) * 100}%"></span>
              ${criterion.revised !== null ? `<span class="bar-fill revised" style="width:${(criterion.revised / 2) * 100}%"></span>` : ''}
            </div>
            <span class="muted">${criterion.baseline.toFixed(2)} → ${criterion.revised !== null ? criterion.revised.toFixed(2) : '—'}</span>
          </div>
        `).join('')}
      </div>
    </article>
    <div style="height:16px"></div>
    <div class="case-grid">
      ${scenario.testCases.map((testCase) => `
        <article class="case-card">
          <h3>${escapeHtml(testCase.id)} same-case comparison</h3>
          <div class="compare-split">
            <div class="output-box">
              <strong>Before</strong>
              <p>${escapeHtml(testCase.baselineOutput)}</p>
              <div class="muted">Average score: ${baselineByCase[testCase.id].average === null ? '—' : baselineByCase[testCase.id].average.toFixed(2)}</div>
            </div>
            <div class="output-box revised">
              <strong>After</strong>
              <p>${escapeHtml(selectedChange.revisedOutputs[testCase.id])}</p>
              <div class="muted">Average score: ${revisedByCase[testCase.id].average === null ? '—' : revisedByCase[testCase.id].average.toFixed(2)}</div>
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderDecision(container, scenario, metrics) {
  const stateClass = metrics.deployReadinessState;
  const topTwo = metrics.criterionAverages
    .map((criterion) => ({ ...criterion, delta: criterion.revised === null ? 0 : criterion.revised - criterion.baseline }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2);

  const readinessText = metrics.deployReadiness === 'Deploy'
    ? 'The evidence is strong enough to move forward, but the decision should still be documented with the same-case comparison and threshold used.'
    : metrics.deployReadiness === 'Iterate again'
      ? 'The change helped, but the evidence still suggests another disciplined iteration before rollout.'
      : 'The weakness may be upstream. Revisit selection or shaping assumptions instead of stacking more small tweaks.';

  container.innerHTML = `
    <article class="summary-card">
      <h3>Recommendation: <span class="recommendation-chip ${escapeHtml(stateClass)}">${escapeHtml(metrics.deployReadiness)}</span></h3>
      <p>${escapeHtml(readinessText)}</p>
      <div class="recommendation-row">
        <span class="recommendation-chip ${escapeHtml(metrics.deployReadinessState)}">Pass rate ${percent(metrics.passRate)}</span>
        <span class="recommendation-chip ${escapeHtml(metricState(metrics.failureConcentration, 'ratio'))}">Failure concentration ${percent(metrics.failureConcentration)}</span>
        <span class="recommendation-chip ${escapeHtml(metricState(metrics.regressionStability ?? 0, 'ratio'))}">Stability ${metrics.regressionStability === null ? '—' : percent(metrics.regressionStability)}</span>
      </div>
      <div style="height:12px"></div>
      <div class="note-box">
        <strong>Top improvement opportunities</strong>
        <ul>
          ${topTwo.map((item) => `<li>${escapeHtml(item.label)} ${item.delta < 0 ? 'still lags' : 'needs monitoring'} — delta ${formatDelta(item.delta)}</li>`).join('')}
        </ul>
      </div>
    </article>
  `;
}


export function renderTakeawaySummary(container, appData, scenario, metrics, state) {
  const selectedChange = getSelectedChange(scenario, state);
  if (!selectedChange) {
    container.innerHTML = '<div class="status-banner">Finish the core path to unlock the takeaway summary.</div>';
    return;
  }
  const topFailure = appData.failureTypes.find((item) => item.id === metrics.topFailureId);
  const strongestGain = metrics.criterionAverages
    .map((criterion) => ({ ...criterion, delta: criterion.revised === null ? 0 : criterion.revised - criterion.baseline }))
    .sort((a, b) => b.delta - a.delta)[0];
  const failureGuidance = metrics.topFailureId ? scenario.coaching?.failureGuidance?.[metrics.topFailureId] : null;
  const changeGuidance = scenario.coaching?.changeGuidance?.[selectedChange.id] || null;

  container.innerHTML = `
    <article class="summary-card takeaway-card">
      <h3>Session takeaway</h3>
      <p class="muted">Use this as the short debrief for what this run taught you.</p>
      <div class="kv-list">
        <div class="kv-item"><strong>Main failure pattern</strong><span class="muted">${escapeHtml(topFailure?.label || 'No dominant pattern yet')}</span></div>
        <div class="kv-item"><strong>Fix you tested</strong><span class="muted">${escapeHtml(selectedChange.label)}</span></div>
        <div class="kv-item"><strong>Most improved area</strong><span class="muted">${escapeHtml(strongestGain?.label || 'No change shown yet')} ${strongestGain ? formatDelta(strongestGain.delta) : ''}</span></div>
        <div class="kv-item"><strong>Responsible next move</strong><span class="muted">${escapeHtml(metrics.deployReadiness)}</span></div>
      </div>
      ${failureGuidance || changeGuidance ? `
        <div class="note-box choice-coach">
          <strong>Scenario-specific teaching point</strong>
          <ul>
            ${failureGuidance ? `<li><strong>Why the failure mattered:</strong> ${escapeHtml(failureGuidance.why)}</li>` : ''}
            ${changeGuidance ? `<li><strong>Why the selected fix was a good test:</strong> ${escapeHtml(changeGuidance.why)}</li>` : ''}
            ${failureGuidance ? `<li><strong>Likely upstream phase to revisit if this pattern returns:</strong> ${escapeHtml(failureGuidance.upstreamPhase)} — ${escapeHtml(failureGuidance.phaseWhy)}</li>` : ''}
          </ul>
        </div>
      ` : ''}
      <div class="chapter-callout compact takeaway-callout">
        <strong>What Chapter 2 wants you to remember:</strong> ${escapeHtml(lifecycleLesson(topFailure?.label, metrics.deployReadiness))}
      </div>
    </article>
  `;
}

export function renderExploreMore(container, scenario, state, onToggle, metrics, appData) {
  const active = new Set(state.exploreSelections || []);
  const base = scenario.exploreMore;
  const currentChange = getSelectedChange(scenario, state);
  const topFailure = appData.failureTypes.find((item) => item.id === metrics.topFailureId);
  const guidanceByOption = scenario.coaching?.exploreGuidance || {};

  const strongestGain = currentChange
    ? Object.entries(currentChange.deltaByCriterion || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]
    : null;
  const biggestRisk = currentChange
    ? Object.entries(currentChange.deltaByCriterion || {}).sort((a, b) => (a[1] || 0) - (b[1] || 0))[0]
    : null;
  const criterionLabel = (criterionId) => scenario.rubric.find((item) => item.id === criterionId)?.label || criterionId;

  const detailHtml = base.options.filter((option) => active.has(option.id)).map((option) => {
    const guidance = guidanceByOption[option.id] || null;
    let body = `<p>${escapeHtml(guidance?.body || option.description)}</p>`;
    if (option.id === 'why' || option.id === 'tradeoff') {
      body += `
        <div class="kv-list">
          <div class="kv-item"><strong>Selected fix</strong><span class="muted">${escapeHtml(currentChange?.label || 'Choose a fix first')}</span></div>
          <div class="kv-item"><strong>Strongest intended gain</strong><span class="muted">${strongestGain ? `${escapeHtml(criterionLabel(strongestGain[0]))} ${formatDelta(strongestGain[1])}` : 'No selected fix yet.'}</span></div>
          <div class="kv-item"><strong>Possible tradeoff</strong><span class="muted">${biggestRisk && biggestRisk[1] < 0 ? `${escapeHtml(criterionLabel(biggestRisk[0]))} ${formatDelta(biggestRisk[1])}` : 'No major tradeoff signaled by this fix.'}</span></div>
        </div>
      `;
    } else if (option.id === 'skip') {
      body += `
        <div class="kv-list">
          <div class="kv-item"><strong>Biggest hidden risk</strong><span class="muted">${escapeHtml(topFailure?.label || 'Weakness pattern still forming')}</span></div>
          <div class="kv-item"><strong>Why Chapter 2 warns about this</strong><span class="muted">Skipping evaluation makes iteration random and hides whether the issue belongs to execution, shaping, or selection.</span></div>
        </div>
      `;
    } else if (option.id === 'strict') {
      body += `
        <div class="kv-list">
          <div class="kv-item"><strong>Current recommendation</strong><span class="muted">${escapeHtml(metrics.deployReadiness)}</span></div>
          <div class="kv-item"><strong>Strict rule</strong><span class="muted">No criterion below 1 and a stronger average score before deployment is recommended.</span></div>
        </div>
      `;
    }
    return `
      <article class="summary-card explore-detail-card">
        <h3>${escapeHtml(guidance?.title || option.label)}</h3>
        ${body}
      </article>
    `;
  }).join('');

  container.innerHTML = `
    <article class="summary-card">
      <h3>${escapeHtml(base.title)}</h3>
      <p>These are optional learning checks. The core lesson is already complete above. Turn on a check only if you want a clearer explanation or a harder standard.</p>
      <div class="option-grid">
        ${base.options.map((option) => `
          <button class="option-card ${active.has(option.id) ? 'active' : ''}" type="button" data-option-id="${escapeHtml(option.id)}" aria-pressed="${active.has(option.id) ? 'true' : 'false'}">
            <h3>${escapeHtml(option.label)}</h3>
            <p class="muted">${escapeHtml(option.description)}</p>
            <div class="option-state">${active.has(option.id) ? 'On now' : 'Off now'}</div>
          </button>
        `).join('')}
      </div>
    </article>
    ${detailHtml || '<div class="status-banner">Optional checks are off. Turn one on only if you want extra explanation after finishing the main lesson.</div>'}
  `;
  container.querySelectorAll('.option-card').forEach((button) => button.addEventListener('click', () => onToggle(button.dataset.optionId, button)));
}
