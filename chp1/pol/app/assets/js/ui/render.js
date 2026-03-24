
(function () {
  const utils = window.POLUtils;
  const store = window.POLStore;
  const composer = window.POLPackageComposer;
  const scoring = window.POLScoring;
  const config = window.POLConfig;
  const missionData = window.POLMissionData;

  const steps = [
    { key: 'mission', label: 'Choose mission' },
    { key: 'diagnose', label: 'Diagnose' },
    { key: 'build', label: 'Build package' },
    { key: 'run', label: 'Send to ChatGPT' },
    { key: 'paste', label: 'Paste answer' },
    { key: 'review', label: 'Review coaching' }
  ];

  const walkthroughSlides = [
    { title: 'What this lab does', body: 'Pattern Orchestrator Lab teaches one skill: choosing the right context mechanism before you ask an LLM to answer.', bullets: ['Grounding = source evidence', 'Memory = carryover context', 'Dynamic facts = current date, status, or account state'] },
    { title: 'How the wizard works', body: 'You move through six steps in order. The app shows only the current task so you do not have to guess what comes next.', bullets: ['Choose a mission', 'Diagnose the missing mechanism', 'Build the smallest useful package'] },
    { title: 'How ChatGPT fits in', body: 'On Step 4 you click one button: Copy everything to send to ChatGPT. Paste that into ChatGPT, run it, then copy only ChatGPT’s answer back into Step 5.', bullets: ['The app does not call a live model', 'The copy button includes the instructions and mission package together', 'Paste only the model answer back into the lab'] },
    { title: 'What Step 6 tells you', body: 'Step 6 now shows attempt history, compares the current run to previous runs, and gives a next best move so you know exactly what to change next.', bullets: ['Metric scores', 'Sentence-level coaching', 'Attempt history and session summary'] }
  ];

  function getUI() { return window.POLWizardState || { currentStep: 1, walkthroughOpen: false, walkthroughIndex: 0, whyScoredOpen: false }; }
  function selectedCountSummary(missionState) { return { evidence: missionState.groundingEnabled ? missionState.selectedEvidence.length : 0, memory: missionState.memoryEnabled ? missionState.selectedMemory.length : 0, facts: missionState.dynamicEnabled ? missionState.selectedFacts.length : 0 }; }
  function inferStep(missionState) {
    const counts = selectedCountSummary(missionState);
    if (missionState.analyzed) return 6;
    if (missionState.pastedOutput) return 5;
    if (missionState.copied) return 4;
    if (missionState.groundingEnabled || missionState.memoryEnabled || missionState.dynamicEnabled || counts.evidence + counts.memory + counts.facts > 0) return 3;
    if (missionState.prediction) return 2;
    return 1;
  }
  function canAdvance(step, missionState) {
    const counts = selectedCountSummary(missionState);
    if (step === 1) return true;
    if (step === 2) return Boolean(missionState.prediction);
    if (step === 3) return (missionState.groundingEnabled || missionState.memoryEnabled || missionState.dynamicEnabled) && counts.evidence + counts.memory + counts.facts > 0;
    if (step === 4) return Boolean(missionState.copied);
    if (step === 5) return Boolean(missionState.analyzed);
    if (step === 6) return Boolean(missionState.analyzed);
    return false;
  }

  function attemptHistory(missionState) {
    return Array.isArray(missionState.attempts) ? missionState.attempts.slice() : [];
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return 'Now';
    }
  }

  function compareAttempts(current, other) {
    if (!current || !other) return null;
    const metricDeltas = config.metricOrder.map(metric => ({ metric, delta: current.metrics[metric] - other.metrics[metric] }));
    const improved = metricDeltas.filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta);
    const declined = metricDeltas.filter(item => item.delta < 0).sort((a, b) => a.delta - b.delta);
    return {
      overallDelta: current.overall - other.overall,
      metricDeltas,
      improved,
      declined,
      packageChanged: current.packageSummary !== other.packageSummary,
      predictionChanged: current.prediction !== other.prediction,
      wordDelta: current.wordCount - other.wordCount
    };
  }

  function deltaText(delta) {
    if (delta > 0) return `+${delta}`;
    if (delta < 0) return `${delta}`;
    return '0';
  }

  function overallChip(delta) {
    if (delta > 0) return `Improved ${deltaText(delta)} overall`;
    if (delta < 0) return `Dropped ${deltaText(delta)} overall`;
    return 'No overall change';
  }

  function summaryBadge(text) {
    return `<span class="history-badge">${utils.escapeHtml(text)}</span>`;
  }

  function comparisonCard(title, compare, other, emptyText) {
    if (!compare || !other) return `<div class="review-card"><div class="section-kicker">${utils.escapeHtml(title)}</div><p>${utils.escapeHtml(emptyText)}</p></div>`;
    const strongestUp = compare.improved.length ? `${compare.improved[0].metric} ${deltaText(compare.improved[0].delta)}` : 'No metric improved';
    const strongestDown = compare.declined.length ? `${compare.declined[0].metric} ${deltaText(compare.declined[0].delta)}` : 'No metric dropped';
    return `<div class="review-card"><div class="section-kicker">${utils.escapeHtml(title)}</div><div class="compare-kicker">${utils.escapeHtml(overallChip(compare.overallDelta))}</div><div class="muted small">Reference attempt: ${utils.escapeHtml(other.id)} · ${utils.escapeHtml(formatDate(other.createdAt))}</div><ul class="list" style="margin-top:10px;"><li><strong>Best change:</strong> ${utils.escapeHtml(strongestUp)}</li><li><strong>Biggest slip:</strong> ${utils.escapeHtml(strongestDown)}</li><li><strong>Word count change:</strong> ${utils.escapeHtml(deltaText(compare.wordDelta))}</li><li><strong>Package:</strong> ${compare.packageChanged ? 'Changed' : 'Stayed the same'}</li></ul></div>`;
  }

  function whatChangedMarkup(current, previous) {
    const compare = compareAttempts(current, previous);
    if (!current) return '<div class="review-card"><div class="section-kicker">What changed?</div><p>Run one analysis first.</p></div>';
    if (!previous) return `<div class="review-card"><div class="section-kicker">What changed?</div><p>This is the first attempt for this mission, so there is nothing to compare yet.</p></div>`;
    const notes = [];
    if (compare.packageChanged) notes.push(`Package changed from “${previous.packageSummary}” to “${current.packageSummary}”.`);
    else notes.push('The package stayed the same, so score movement mostly came from answer quality rather than package composition.');
    if (compare.predictionChanged) notes.push(`Mechanism diagnosis changed from ${previous.prediction} to ${current.prediction}.`);
    if (compare.wordDelta > 0) notes.push(`The answer became longer by ${compare.wordDelta} words.`);
    if (compare.wordDelta < 0) notes.push(`The answer became shorter by ${Math.abs(compare.wordDelta)} words.`);
    const improvedMetrics = compare.improved.slice(0, 2).map(item => `${item.metric} ${deltaText(item.delta)}`);
    if (improvedMetrics.length) notes.push(`Most improved: ${improvedMetrics.join(' and ')}.`);
    const declinedMetrics = compare.declined.slice(0, 2).map(item => `${item.metric} ${deltaText(item.delta)}`);
    if (declinedMetrics.length) notes.push(`What slipped: ${declinedMetrics.join(' and ')}.`);
    return `<div class="review-card"><div class="section-kicker">What changed?</div><ul class="list">${notes.map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul></div>`;
  }

  function attemptHistoryMarkup(attempts) {
    if (!attempts.length) return '<div class="notice info">Attempt history starts after the first analysis run.</div>';
    return `<div class="attempt-history">${attempts.slice().reverse().map((attempt, idx, arr) => {
      const displayNumber = attempts.length - idx;
      const best = attempts.reduce((bestAttempt, item) => !bestAttempt || item.overall > bestAttempt.overall ? item : bestAttempt, null);
      const isBest = best && best.id === attempt.id;
      return `<div class="attempt-row"><div><div class="attempt-title">Attempt ${displayNumber} · ${utils.escapeHtml(formatDate(attempt.createdAt))}</div><div class="muted small">${utils.escapeHtml(attempt.packageSummary)} · ${utils.escapeHtml(attempt.bandLabel)}</div></div><div class="attempt-meta">${summaryBadge(`${attempt.overall}/100`)}${isBest ? summaryBadge('Best') : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function sessionSummaryMarkup(includeTitle = true) {
    const summary = store.getSessionSummary();
    const best = summary.bestAttempt;
    return `<div>${includeTitle ? '<div class="section-kicker">Session summary</div>' : ''}<div class="summary-list"><div class="summary-line"><span>Attempts this session</span><strong>${summary.totalAttempts}</strong></div><div class="summary-line"><span>Missions touched</span><strong>${summary.missionsTouched}</strong></div><div class="summary-line"><span>Average score</span><strong>${summary.averageOverall || 0}</strong></div><div class="summary-line"><span>Common weakest metric</span><strong>${utils.escapeHtml(summary.commonWeakestMetric)}</strong></div>${best ? `<div class="summary-line"><span>Best attempt</span><strong>${utils.escapeHtml(best.missionTitle)} · ${best.overall}</strong></div>` : ''}<div class="summary-line"><span>Recommended next mission</span><strong>${utils.escapeHtml(summary.nextMissionTitle || missionData.missions[0].title)}</strong></div></div></div>`;
  }

  function coachModel(mission, missionState, step) {
    const counts = selectedCountSummary(missionState);
    const completed = store.getState().completedMissionIds.length;
    const attempts = attemptHistory(missionState).length;
    const dominant = scoring.dominantLabel(mission);
    const models = {
      1: { title: 'Step 1 — Choose a mission', text: 'Pick one scenario. Start with Support Downgrade if this is your first run.', checks: [{ done: true, text: 'A mission is already selected for you.' }, { done: mission.id === 'support-downgrade', text: 'Best first mission: Support Downgrade.' }, { done: true, text: 'Use the Walkthrough button any time you want the app to explain itself again.' }] },
      2: { title: 'Step 2 — Diagnose the weak state', text: 'Choose the missing mechanism before you build anything. This trains judgment first.', checks: [{ done: Boolean(missionState.prediction), text: missionState.prediction ? `You chose: ${missionState.prediction}.` : 'Select one mechanism.' }, { done: true, text: `This mission most strongly surfaces: ${dominant}.` }] },
      3: { title: 'Step 3 — Build the package', text: 'Turn on only the mechanism blocks that help and choose the smallest useful set of supporting items.', checks: [{ done: missionState.groundingEnabled || missionState.memoryEnabled || missionState.dynamicEnabled, text: 'Enable at least one mechanism block.' }, { done: counts.evidence + counts.memory + counts.facts > 0, text: 'Select at least one evidence item, memory item, or fact.' }, { done: true, text: `Current package summary: ${composer.selectedSummary(mission, missionState)}.` }] },
      4: { title: 'Step 4 — Send it to ChatGPT', text: 'Click one button, paste the copied block into ChatGPT, run it, then copy only ChatGPT’s answer.', checks: [{ done: Boolean(missionState.copied), text: missionState.copied ? 'Copied. Paste it into ChatGPT now.' : 'Click Copy everything to send to ChatGPT.' }, { done: true, text: 'After ChatGPT answers, come back here for Step 5.' }] },
      5: { title: 'Step 5 — Paste ChatGPT’s answer', text: 'Paste only the answer from ChatGPT into the box. Then click Analyze pasted output.', checks: [{ done: Boolean(missionState.pastedOutput), text: missionState.pastedOutput ? 'Answer pasted or sample loaded.' : 'Paste the answer or load the sample.' }, { done: Boolean(missionState.analyzed), text: missionState.analyzed ? 'Analysis complete.' : 'Click Analyze pasted output to unlock Step 6.' }] },
      6: { title: 'Step 6 — Review the coaching', text: 'Use the score, attempt history, and comparisons to decide what one thing to change on the next run.', checks: [{ done: Boolean(missionState.analyzed), text: 'Score and coaching are visible.' }, { done: attempts > 0, text: `${attempts} attempt(s) recorded for this mission.` }, { done: completed > 0, text: `${completed} of ${missionData.missions.length} missions completed.` }] }
    };
    return models[step];
  }

  function progressMarkup(step, missionState) {
    return steps.map((item, idx) => {
      const num = idx + 1;
      const done = num < step || (num === 6 && missionState.analyzed);
      return `<button class="wizard-step ${num === step ? 'active' : ''} ${done ? 'done' : ''}" data-go-step="${num}" ${num > step && !canAdvance(num - 1, missionState) ? 'disabled' : ''}><div class="step-num">Step ${num}</div><strong>${item.label}</strong></button>`;
    }).join('');
  }

  function missionCards(currentMission) {
    return missionData.missions.map(mission => `<button class="mission-card ${mission.id === currentMission.id ? 'active' : ''}" data-mission-select="${mission.id}"><div class="section-kicker">${utils.escapeHtml(mission.family)}</div><h4>${utils.escapeHtml(mission.title)}</h4><p>${utils.escapeHtml(mission.goal)}</p><div class="meta-row" style="margin-top:12px;"><span class="chip">${utils.escapeHtml(mission.signal)}</span><span class="chip">${utils.escapeHtml(mission.time)}</span></div></button>`).join('');
  }

  function diagnoseCards(missionState) {
    const options = [['grounding', '📚', 'Grounding', 'The answer mainly needs policy, document, or source evidence.'], ['memory', '🧠', 'Memory', 'The answer mainly needs prior decisions or conversation carryover.'], ['dynamic', '⏱️', 'Dynamic facts', 'The answer mainly needs current date, status, or account values.'], ['mixed', '🧩', 'Mixed', 'Two mechanism gaps matter at the same time.']];
    return options.map(([value, icon, title, desc]) => `<button class="choice-card ${missionState.prediction === value ? 'active' : ''}" data-prediction="${value}"><div class="choice-icon">${icon}</div><h4>${title}</h4><p>${desc}</p></button>`).join('');
  }

  function itemMarkup(item, group, selected) {
    return `<label class="item-check"><input type="checkbox" data-item-toggle="${group}" value="${item.id}" ${selected ? 'checked' : ''}><div><strong>${utils.escapeHtml(item.label)}</strong><div class="muted">${utils.escapeHtml(item.text)}</div><span class="tokens">${item.tokens} tokens</span></div></label>`;
  }

  function buildStepMarkup(mission, missionState) {
    const counts = selectedCountSummary(missionState);
    const pkg = composer.buildContextPackage(mission, missionState);
    const recommended = mission.recommendedState;
    const recommendedLabel = [recommended.groundingEnabled ? 'Grounding' : '', recommended.memoryEnabled ? 'Memory' : '', recommended.dynamicEnabled ? 'Dynamic facts' : ''].filter(Boolean).join(' + ');
    return `<div class="panel-header"><div><div class="section-kicker">Step 3</div><h3>Build the package</h3><p>Use the smallest set of context items that actually solve the weak-state failure.</p></div></div>
      <div class="notice info"><strong>Coaching:</strong> This mission most strongly surfaces <strong>${utils.escapeHtml(scoring.dominantLabel(mission))}</strong>. Do not add extra context unless it clearly helps.</div>
      <div class="option-grid" style="margin-top:14px;"><button class="option-card ${missionState.groundingEnabled ? 'active' : ''}" data-toggle-pattern="grounding"><div class="section-kicker">Mechanism</div><h4>Grounding / RAG</h4><p>Turn this on when the model needs source evidence it cannot safely invent.</p></button><button class="option-card ${missionState.memoryEnabled ? 'active' : ''}" data-toggle-pattern="memory"><div class="section-kicker">Mechanism</div><h4>Memory</h4><p>Turn this on when prior facts or decisions need to carry forward.</p></button><button class="option-card ${missionState.dynamicEnabled ? 'active' : ''}" data-toggle-pattern="dynamic"><div class="section-kicker">Mechanism</div><h4>Dynamic facts</h4><p>Turn this on when the answer depends on current or runtime-specific facts.</p></button></div>
      <div class="review-grid" style="margin-top:16px;"><div class="review-card"><div class="section-kicker">Grounding items</div><div class="item-grid" style="margin-top:10px;">${missionState.groundingEnabled ? mission.evidence.map(item => itemMarkup(item, 'evidence', missionState.selectedEvidence.includes(item.id))).join('') : '<div class="muted">Grounding is off.</div>'}</div></div><div class="review-card"><div class="section-kicker">Memory items</div><div class="button-row" style="margin-bottom:10px;">${mission.memoryModes.map(mode => `<button class="chip ${missionState.memoryMode === mode ? 'active' : ''}" data-memory-mode="${mode}">${utils.escapeHtml(mode)}</button>`).join('')}</div><div class="item-grid">${missionState.memoryEnabled ? mission.memory.map(item => itemMarkup(item, 'memory', missionState.selectedMemory.includes(item.id))).join('') : '<div class="muted">Memory is off.</div>'}</div></div></div>
      <div class="review-grid" style="margin-top:16px;"><div class="review-card"><div class="section-kicker">Dynamic facts</div><div class="item-grid" style="margin-top:10px;">${missionState.dynamicEnabled ? mission.dynamicFacts.map(item => itemMarkup(item, 'facts', missionState.selectedFacts.includes(item.id))).join('') : '<div class="muted">Dynamic facts are off.</div>'}</div></div><div class="review-card"><div class="section-kicker">Package summary</div><div class="readout">${utils.escapeHtml(composer.selectedSummary(mission, missionState))}</div><div class="summary-list" style="margin-top:12px;"><div class="summary-line"><span>Recommended emphasis</span><strong>${utils.escapeHtml(recommendedLabel)}</strong></div><div class="summary-line"><span>Selected items</span><strong>${counts.evidence + counts.memory + counts.facts}</strong></div><div class="summary-line"><span>Token use</span><strong>${pkg.tokenUsage.total} / ${(missionState.bonusMode && mission.challenge) ? mission.challenge.tokenBudget : mission.tokenBudget}</strong></div></div></div></div>`;
  }

  function runStepMarkup(mission, missionState) {
    const prompt = composer.buildExternalPrompt(mission, missionState);
    return `<div class="panel-header"><div><div class="section-kicker">Step 4</div><h3>Copy everything to send to ChatGPT</h3><p>This step is now one action. Click the button below, paste the copied block into ChatGPT, run it, then bring back only ChatGPT’s answer.</p></div></div>
      <div class="button-row"><button class="btn btn-primary" data-copy-all>Copy everything to send to ChatGPT</button><span class="muted">${missionState.copied ? 'Copied. Next: paste into ChatGPT, run it, copy only ChatGPT’s answer, then move to Step 5.' : 'Click the button once. Then paste it into ChatGPT, run it, and bring back only ChatGPT’s answer.'}</span></div>
      <div class="review-grid" style="margin-top:16px;"><div class="review-card"><div class="section-kicker">Do this now</div><ol class="list"><li>Click <strong>Copy everything to send to ChatGPT</strong>.</li><li>Paste it into ChatGPT.</li><li>Run it.</li><li>Copy only ChatGPT’s answer.</li><li>Return to Step 5.</li></ol></div><div class="review-card"><div class="section-kicker">What will be copied</div><div class="readout">One combined block: mission instructions + selected context package + output request.</div></div></div>
      <div class="package-box" style="margin-top:16px;">${utils.escapeHtml(prompt.text)}</div>
      <div class="output-card" style="margin-top:16px;"><h4>Weak-state baseline output</h4><p>${utils.escapeHtml(mission.baselineOutput)}</p></div>`;
  }

  function pasteStepMarkup(mission, missionState) {
    const hasText = Boolean((missionState.pastedOutput || '').trim());
    const statusNotice = hasText ? '<div class="notice warning" style="margin-top:14px;"><strong>Important:</strong> every time you change the pasted text, the old analysis is cleared. Click <strong>Analyze pasted output</strong> again to refresh Step 6.</div>' : '<div class="notice info" style="margin-top:14px;"><strong>Coaching:</strong> imperfect pasted text is fine. The point is to compare consequence signals, not to enforce perfect formatting.</div>';
    return `<div class="panel-header"><div><div class="section-kicker">Step 5</div><h3>Paste ChatGPT’s answer</h3><p>Paste only the answer from ChatGPT or your other external model. Then click Analyze pasted output.</p></div></div>
      <div class="review-grid" style="margin-bottom:14px;"><div class="review-card"><div class="section-kicker">Do this now</div><ol class="list"><li>Return from ChatGPT.</li><li>Paste only ChatGPT’s answer into the box.</li><li>Click <strong>Analyze pasted output</strong>.</li></ol></div><div class="review-card"><div class="section-kicker">What not to paste</div><ul class="list"><li>Do not paste the original prompt block again.</li><li>Do not paste your own notes unless you want them scored as part of the answer.</li></ul></div></div>
      <div class="button-row"><button class="btn btn-primary" data-analyze-output ${hasText ? '' : 'disabled'}>Analyze pasted output</button><button class="btn" data-load-sample>Load sample output</button><button class="btn btn-ghost" data-clear-output>Clear output</button></div>
      <textarea id="pasteOutput" aria-label="Paste the model output here" placeholder="Paste only ChatGPT’s answer here...">${utils.escapeHtml(missionState.pastedOutput || '')}</textarea>${statusNotice}`;
  }

  function sentenceFeedbackMarkup(items) {
    if (!items || !items.length) return '<div class="notice info">Sentence-level coaching will appear after you analyze a real pasted answer.</div>';
    return items.map(item => `<div class="sentence-card ${item.tone}"><div class="sentence-text">${utils.escapeHtml(item.sentence)}</div><div class="sentence-note">${utils.escapeHtml(item.note)}</div></div>`).join('');
  }

  function whyScoredMarkup(results, visible) {
    if (!results || !results.trace) return '';
    const metrics = config.metricOrder.map(name => {
      const detail = results.trace[name];
      if (!detail) return '';
      return `<div class="review-card"><div class="section-kicker">${utils.escapeHtml(name)} · ${detail.score}</div><ul class="list">${(detail.triggers || []).map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul></div>`;
    }).join('');
    if (!visible) return '';
    return `<div class="review-card why-scored-panel" style="margin-top:16px;">
      <div class="section-kicker">Why this scored this way</div>
      <div class="review-card" style="margin-top:12px;">
        <div class="section-kicker">How the scoring works</div>
        <p class="muted">Sentence-level review in Step 6 is heuristic, not AI judgment. The app uses transparent rules so you can see why a score moved up or down.</p>
        <div class="section-kicker" style="margin-top:12px;">Important limitation</div>
        <p class="muted">This scoring is approximate and explainable, not deeply semantic. It does not truly understand the answer like a human reviewer or an LLM judge. Instead, it checks whether your package choices and pasted answer show the kinds of signals the mission expects.</p>
        <ul class="list">
          <li>Strong answers that use unexpected wording can sometimes score lower than they deserve.</li>
          <li>Weak answers that happen to hit expected phrases can sometimes score higher than they deserve.</li>
        </ul>
        <div class="section-kicker" style="margin-top:12px;">In plain English</div>
        <ul class="list">
          <li>Did you choose the right mechanism for the mission?</li>
          <li>Did you include the right kind of context?</li>
          <li>Does the pasted answer visibly use that context?</li>
          <li>Does the answer mention the facts, rules, and continuity signals the mission expects?</li>
          <li>Did you stay within a reasonable context budget?</li>
        </ul>
      </div>
      <p class="muted" style="margin-top:12px;">These notes show the exact rules, phrase matches, and penalties the app used for each metric.</p>
      <div class="review-grid" style="margin-top:12px;">${metrics}</div>
    </div>`;
  }

  function reviewStepMarkup(mission, missionState) {
    if (!missionState.analyzed || !missionState.scoreResults) return `<div class="notice info"><strong>No analysis yet.</strong> Complete Step 5 first.</div>`;
    const results = missionState.scoreResults;
    const attempts = attemptHistory(missionState);
    const currentAttempt = attempts[attempts.length - 1] || null;
    const previousAttempt = attempts.length > 1 ? attempts[attempts.length - 2] : null;
    const bestAttempt = attempts.reduce((best, item) => !best || item.overall > best.overall ? item : best, null);
    const vsPrevious = compareAttempts(currentAttempt, previousAttempt);
    const vsBest = bestAttempt && currentAttempt && bestAttempt.id !== currentAttempt.id ? compareAttempts(currentAttempt, bestAttempt) : null;
    return `<div class="panel-header"><div><div class="section-kicker">Step 6</div><div class="title-row"><h3>Review the coaching</h3><button class="btn btn-secondary btn-inline" data-toggle-why-scored>${getUI().whyScoredOpen ? 'Hide why this scored this way' : 'Why this scored this way'}</button></div><p>Read the score, compare this run to earlier runs, and use the next-best-move guidance.</p></div><div class="chip">${utils.escapeHtml(results.band.label)} · ${results.overall}/100</div></div>
      ${whyScoredMarkup(results, getUI().whyScoredOpen)}
      <div class="notice success"><strong>Next best move:</strong> ${utils.escapeHtml(results.nextBestMove)}</div>
      <div class="metric-list" style="margin-top:16px;">${config.metricOrder.map(name => `<div class="metric-row"><strong>${name}</strong><div><div class="metric-bar"><div class="metric-fill" style="width:${results.metrics[name]}%;"></div></div><div class="metric-note">${utils.escapeHtml(config.metricDescriptions[name])}</div></div><span>${results.metrics[name]}</span></div>`).join('')}</div>
      <div class="review-grid" style="margin-top:16px;"><div class="review-card"><div class="section-kicker">Delta highlights</div><ul class="list">${results.deltaHighlights.map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul></div><div class="review-card"><div class="section-kicker">Coaching</div><ul class="list">${results.coaching.map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul></div></div>
      <div class="review-grid" style="margin-top:16px;">${comparisonCard('Current vs previous attempt', vsPrevious, previousAttempt, 'Analyze this mission twice to unlock a comparison.')}${comparisonCard('Current vs best attempt', vsBest, bestAttempt && bestAttempt.id !== currentAttempt.id ? bestAttempt : null, 'This is currently your best attempt for this mission.')}</div>
      <div class="review-grid" style="margin-top:16px;">${whatChangedMarkup(currentAttempt, previousAttempt)}<div class="review-card"><div class="section-kicker">Attempt history</div>${attemptHistoryMarkup(attempts)}</div></div>
      <div class="review-card" style="margin-top:16px;"><div class="section-kicker">Sentence-level feedback</div><div class="sentence-grid" style="margin-top:12px;">${sentenceFeedbackMarkup(results.sentenceFeedback)}</div></div>
      <div class="review-card" style="margin-top:16px;"><div class="section-kicker">Session summary</div>${sessionSummaryMarkup(false)}</div>
      <div class="review-grid" style="margin-top:16px;"><div class="output-card"><h4>Weak-state baseline</h4><p>${utils.escapeHtml(mission.baselineOutput)}</p></div><div class="output-card"><h4>Your analyzed output</h4><p>${utils.escapeHtml(missionState.pastedOutput)}</p></div></div>
      <div class="button-row" style="margin-top:16px;"><button class="btn" data-reset-mission>Retry this mission</button><button class="btn btn-ghost" data-start-over>Start over completely</button><button class="btn btn-secondary" data-next-mission>Open next mission</button></div>
      <div class="muted small" style="margin-top:10px;">Retry this mission keeps your prior attempt history so your next analysis can compare Attempt 2 against Attempt 1. Start over completely clears this mission and its attempt history.</div>`;
  }

  function currentContent(step, mission, missionState) {
    if (step === 1) return `<div class="panel-header"><div><div class="section-kicker">Step 1</div><h3>Choose a mission</h3><p>Pick one scenario. The wizard will guide you through the rest.</p></div></div><div class="mission-grid">${missionCards(mission)}</div><div class="notice info" style="margin-top:16px;"><strong>Selected mission:</strong> ${utils.escapeHtml(mission.title)} — ${utils.escapeHtml(mission.goal)}</div>`;
    if (step === 2) return `<div class="panel-header"><div><div class="section-kicker">Step 2</div><h3>Diagnose the missing mechanism</h3><p>Decide what kind of context the weak-state answer is missing before you start adding content.</p></div></div><div class="review-grid"><div class="review-card"><div class="section-kicker">Mission brief</div><h4>${utils.escapeHtml(mission.title)}</h4><p>${utils.escapeHtml(mission.scenarioBrief)}</p><div class="notice info"><strong>Quality signal to watch:</strong> ${utils.escapeHtml(mission.qualityWatch)}</div></div><div class="review-card"><div class="section-kicker">Weak-state clues</div><ul class="list">${mission.weakState.map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul></div></div><div class="choice-grid" style="margin-top:16px;">${diagnoseCards(missionState)}</div>`;
    if (step === 3) return buildStepMarkup(mission, missionState);
    if (step === 4) return runStepMarkup(mission, missionState);
    if (step === 5) return pasteStepMarkup(mission, missionState);
    return reviewStepMarkup(mission, missionState);
  }

  function walkthroughMarkup(ui) {
    if (!ui.walkthroughOpen) return '';
    const slide = walkthroughSlides[ui.walkthroughIndex] || walkthroughSlides[0];
    const finalSlide = ui.walkthroughIndex === walkthroughSlides.length - 1;
    return `<div class="walkthrough-overlay" role="dialog" aria-modal="true" aria-labelledby="walkthroughTitle"><div class="walkthrough-card"><div class="section-kicker">First-run walkthrough</div><h3 id="walkthroughTitle">${utils.escapeHtml(slide.title)}</h3><p>${utils.escapeHtml(slide.body)}</p><ul class="list">${slide.bullets.map(item => `<li>${utils.escapeHtml(item)}</li>`).join('')}</ul><div class="walkthrough-progress">${walkthroughSlides.map((_, idx) => `<span class="walk-dot ${idx === ui.walkthroughIndex ? 'active' : ''}"></span>`).join('')}</div><div class="wizard-nav"><button class="btn" data-walkthrough-close>Skip</button><div class="button-row" style="margin-left:auto;"><button class="btn" data-walkthrough-back ${ui.walkthroughIndex === 0 ? 'disabled' : ''}>Back</button><button class="btn btn-primary" data-walkthrough-next>${finalSlide ? 'Start the lab' : 'Next'}</button></div></div></div></div>`;
  }

  function renderAll() {
    const ui = getUI();
    const mission = store.getCurrentMission();
    const missionState = store.getMissionState(mission.id);
    const sessionSummary = store.getSessionSummary();
    if (ui.currentStep > 1 && !canAdvance(ui.currentStep - 1, missionState) && ui.currentStep !== inferStep(missionState)) ui.currentStep = Math.min(ui.currentStep, inferStep(missionState));
    const step = ui.currentStep;
    const coach = coachModel(mission, missionState, step);
    document.getElementById('wizardProgress').innerHTML = progressMarkup(step, missionState);
    document.getElementById('wizardContent').innerHTML = currentContent(step, mission, missionState);
    document.getElementById('coachTitle').textContent = coach.title;
    document.getElementById('coachText').textContent = coach.text;
    document.getElementById('coachChecklist').innerHTML = coach.checks.map(item => `<div class="check-item ${item.done ? 'done' : ''}"><span class="dot">${item.done ? '✓' : '•'}</span><div>${utils.escapeHtml(item.text)}</div></div>`).join('');
    document.getElementById('missionProgressText').textContent = `${store.getState().completedMissionIds.length} of ${missionData.missions.length} missions completed`;
    document.getElementById('sidebarMissionName').textContent = mission.title;
    document.getElementById('sidebarMissionSignal').textContent = mission.signal;
    document.getElementById('sessionSummaryRoot').innerHTML = sessionSummaryMarkup();
    document.getElementById('walkthroughRoot').innerHTML = walkthroughMarkup(ui);
    const backBtn = document.querySelector('[data-wizard-back]');
    const nextBtn = document.querySelector('[data-wizard-next]');
    backBtn.disabled = step === 1;
    nextBtn.disabled = step === 6 ? false : !canAdvance(step, missionState);
    nextBtn.textContent = step === 6 ? 'Stay on review' : `Go to Step ${Math.min(6, step + 1)}`;
  }

  window.POLRender = { renderAll, inferStep, canAdvance };
})();
