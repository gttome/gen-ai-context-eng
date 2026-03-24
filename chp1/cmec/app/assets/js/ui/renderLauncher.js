export function renderLauncher(state, appData, resumeSnapshot = null) {
  const recommended = appData.scenarios[0];
  const resumeScenario = resumeSnapshot?.selectedScenarioId
    ? appData.scenarios.find((scenario) => scenario.id === resumeSnapshot.selectedScenarioId)
    : null;
  const resumeDate = resumeSnapshot?.sessionTimestamp
    ? new Date(resumeSnapshot.sessionTimestamp).toLocaleString()
    : 'Recently saved';

  return `
    <section class="hero-card hero-card-launcher" aria-labelledby="launcher-title">
      <div class="hero-copy">
        <p class="eyebrow">Chapter 1 interactive mission</p>
        <h1 id="launcher-title">${appData.app.name}</h1>
        <p class="lede">${appData.app.tagline}</p>
        <div class="status-pill-row hero-pill-row">
          <span class="status-pill hero-status-pill"><strong>Learning model</strong> Inspect → predict → repair → compare</span>
          <span class="status-pill hero-status-pill"><strong>Design intent</strong> Learner-first, not a builder workspace</span>
          <span class="status-pill hero-status-pill"><strong>Optional path</strong> External LLM run and paste-back</span>
        </div>
      </div>
      <div class="hero-coach-grid" aria-label="Mission flow coaching">
        <article class="coach-card">
          <strong>1. Inspect the weak package</strong>
          <p>See exactly what the model gets, what is missing, and why the package is fragile before you answer anything.</p>
        </article>
        <article class="coach-card">
          <strong>2. Predict the likely failure</strong>
          <p>Use the coaching hints to name the failure mode you expect from the weak package.</p>
        </article>
        <article class="coach-card">
          <strong>3. Repair and compare</strong>
          <p>Apply a few meaningful changes and watch the package, metrics, and prepared output improve together.</p>
        </article>
      </div>
      ${resumeSnapshot ? `
        <div class="summary-callout success-callout hero-resume-card">
          <strong>Resume available${resumeScenario ? `: ${resumeScenario.family}` : ''}.</strong>
          <p class="small-muted">Last saved: ${resumeDate}. Resume restores the current package choices, your prediction, pasted output, debrief text, compare state, and any loaded explore drill.</p>
          <div class="resume-detail-grid footer-note">
            <div class="resume-detail-card">
              <strong>Resume restores</strong>
              <ul class="plain-list compact-list">
                <li>Current included vs excluded blocks</li>
                <li>Prediction, paste-back, and debrief notes</li>
                <li>Compare visibility and Explore More state</li>
              </ul>
            </div>
            <div class="resume-detail-card">
              <strong>Clear removes</strong>
              <ul class="plain-list compact-list">
                <li>The saved browser snapshot for this app</li>
                <li>Your current mission progress in this browser</li>
                <li>The launcher resume card until a new save exists</li>
              </ul>
            </div>
          </div>
          <div class="button-row">
            <button class="primary-btn" type="button" data-action="resume-saved">Resume saved mission</button>
            <button class="ghost-btn" type="button" data-action="clear-session">Clear saved mission</button>
          </div>
        </div>
      ` : ''}
    </section>

    <section class="panel">
      <header>
        <div>
          <h2>Mission launcher</h2>
          <p class="muted-note">Start with a prepared weak package, study why it will fail, then improve it with visible cause-and-effect.</p>
        </div>
        <div class="summary-callout inline-launch-note">
          <strong>Recommended first run</strong>
          <p class="small-muted">${recommended.family} makes grounding, policy evidence, and output structure easy to see.</p>
        </div>
      </header>
      <div class="launcher-grid">
        ${appData.scenarios.map((scenario) => `
          <article class="scenario-card" aria-labelledby="scenario-${scenario.id}">
            <header>
              <div>
                <h3 id="scenario-${scenario.id}" class="family-title">${scenario.family}</h3>
                <p class="small-muted">${scenario.learningObjective}</p>
              </div>
              <span class="metric-tag">${scenario.difficulty}</span>
            </header>
            <div class="tag-row">
              ${scenario.conceptFocus.map((focus) => `<span class="tag">${focus}</span>`).join('')}
            </div>
            <dl class="kv-list">
              <div class="kv-row"><dt>Budget</dt><dd>${scenario.budget} tokens</dd></div>
              <div class="kv-row"><dt>Pattern lens</dt><dd>${scenario.exploreMore.title}</dd></div>
              <div class="kv-row"><dt>Prepared output</dt><dd>Weak + strong examples included</dd></div>
            </dl>
            <p class="small-muted">${scenario.whyItMatters}</p>
            <div class="button-row">
              <button class="primary-btn" type="button" data-action="launch-scenario" data-scenario-id="${scenario.id}">Start mission</button>
              <button class="ghost-btn" type="button" data-action="launch-harder" data-scenario-id="${scenario.id}">Harder replay</button>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="panel two-col">
      <article>
        <h2>What you are practicing</h2>
        <ul class="plain-list">
          <li>Why input quality and structure influence output quality.</li>
          <li>How grounding, memory, and dynamic facts change reliability.</li>
          <li>Why token budgeting and selective context reduce overload.</li>
          <li>How to iterate with visible cause-and-effect instead of guesswork.</li>
        </ul>
      </article>
      <article>
        <h2>What to look for in the weak package</h2>
        <div class="glossary-list">
          <div class="glossary-term">
            <strong>Missing facts</strong>
            <p class="small-muted">Will the model have to guess because policy, evidence, or current-state facts are absent?</p>
          </div>
          <div class="glossary-term">
            <strong>Missing structure</strong>
            <p class="small-muted">Does the package tell the model how to shape the answer, or will the output drift?</p>
          </div>
          <div class="glossary-term">
            <strong>Noise</strong>
            <p class="small-muted">Is irrelevant background taking up the budget and making the package less focused?</p>
          </div>
        </div>
      </article>
    </section>
  `;
}
