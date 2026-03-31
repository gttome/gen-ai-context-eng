import { escapeHtml, choiceLabel } from "../shared/utils.js";

export function mount(root, context, helpers) {
  const counterfactuals = context.scenario.counterfactuals || [];
  const variant = counterfactuals[0];
  const strongest = context.strongestRun;
  const current = context.run;
  const strongestPrecedence = choiceLabel(context.optionLabels.precedence, strongest.precedenceRule);
  const currentPrecedence = choiceLabel(context.optionLabels.precedence, current.precedenceRule);

  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Education feature</span><span class="hud-pill">Counterfactual learning</span></div>
        <h2>Productive Failure Time Machine</h2>
        <p>Step into three futures before you see a strongest-practice answer. Compare what your current envelope, a plausible weaker package, and the strongest structure would likely cause.</p>
      </div>
      <div class="tool-panel">
        <label>
          <span>Future lens</span>
          <input id="pf-slider" type="range" min="0" max="2" step="1" value="0" />
        </label>
        <div class="button-row">
          <button class="choice-button" data-pf-jump="0">Your current future</button>
          <button class="choice-button" data-pf-jump="1">Plausible weaker future</button>
          <button class="choice-button" data-pf-jump="2">Strongest-practice future</button>
        </div>
      </div>
      <div id="pf-stage"></div>
      <article class="lesson-card" style="margin-top:1rem;">
        <h3>Explain the divergence</h3>
        <p>Why does the stronger package behave differently?</p>
        <div class="mode-grid">
          <button class="choice-button" data-pf-answer="job">Because it makes section jobs easier to inspect and compare.</button>
          <button class="choice-button" data-pf-answer="length">Because it is longer and sounds more advanced.</button>
          <button class="choice-button" data-pf-answer="mystery">Because strong prompts are mostly a matter of instinct.</button>
        </div>
        <div id="pf-feedback" class="feature-footer">Choose an explanation.</div>
      </article>
    </section>`;

  const futures = [
    {
      title: "Your current future",
      summary: context.metrics.narrativeSummary,
      bullets: [
        `Readiness: ${context.metrics.readiness}`,
        `Precedence currently selected: ${currentPrecedence}`,
        context.metrics.nextBestActions?.[0] || "Tighten the package before testing."
      ]
    },
    {
      title: variant?.title || "Plausible weaker future",
      summary: variant?.lesson || "A tempting placement still weakens the package even when it looks superficially relevant.",
      bullets: [
        variant?.whyPlausible || "The move sounds reasonable until you inspect the package's reviewability.",
        "Likely outcome: more guessing under ambiguity.",
        `Loss driver: ${variant?.focus || "section separation"}`
      ]
    },
    {
      title: "Strongest-practice future",
      summary: "The strongest package is not magical. It is simply easier to review, easier to govern, and easier for the model to follow.",
      bullets: [
        `Precedence declared: ${strongestPrecedence}`,
        context.scenario.strongestPractice?.rationale?.REFERENCE || "Evidence stays visible as evidence.",
        context.scenario.strongestPractice?.rationale?.CHECKS || "Conditional behavior stays visible at the end of the package."
      ]
    }
  ];

  const stageNode = root.querySelector("#pf-stage");
  const feedbackNode = root.querySelector("#pf-feedback");
  const renderFuture = (index) => {
    const future = futures[index];
    stageNode.innerHTML = `<div class="comparison-grid"><article class="mode-card"><h3>${escapeHtml(future.title)}</h3><p>${escapeHtml(future.summary)}</p><ul>${future.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul></article></div>`;
    helpers.announce(`${future.title} loaded.`);
  };
  renderFuture(0);

  root.querySelector("#pf-slider")?.addEventListener("input", (event) => renderFuture(Number(event.target.value)));
  root.querySelectorAll("[data-pf-jump]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.getAttribute("data-pf-jump"));
    const slider = root.querySelector("#pf-slider");
    if (slider) slider.value = String(index);
    renderFuture(index);
  }));
  root.querySelectorAll("[data-pf-answer]").forEach((button) => button.addEventListener("click", () => {
    const choice = button.getAttribute("data-pf-answer");
    const correct = choice === "job";
    feedbackNode.innerHTML = correct
      ? `<strong>Correct.</strong> Productive failure works when the learner explains how structure changes the operating package, not when they merely memorize the answer.`
      : `<strong>Weaker explanation.</strong> The strongest package wins because it separates jobs, evidence, and failure handling more legibly—not because it sounds fancy.`;
  }));
}
