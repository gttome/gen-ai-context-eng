import { escapeHtml, scoreTone, sectionSurface } from "../shared/utils.js";

const misconceptions = {
  structureClarity: {
    name: "mixing unlike material",
    fix: "Ask the apprentice what job the card needs to do best, then move it where that job stays easiest to review."
  },
  orderingQuality: {
    name: "burying the task or checks too late",
    fix: "Teach the apprentice to make behavior visible before the task, and failure-handling visible at the end."
  },
  precedenceExplicitness: {
    name: "leaving conflict resolution implicit",
    fix: "Make the apprentice write what wins when a stale shortcut clashes with the source of record."
  },
  handlingReadiness: {
    name: "treating missing info as someone else’s problem",
    fix: "Train the apprentice to encode missing-information behavior as part of the package, not as a hidden assumption."
  }
};

export function mount(root, context, helpers) {
  const weakness = context.scenario.missionTags?.[0] || "structureClarity";
  const chosen = misconceptions[weakness] || misconceptions.structureClarity;
  const reference = context.scenario.blocks.filter((block) => block.type === "REFERENCE").slice(0, 2);
  const apprenticeSection = weakness === "orderingQuality" ? "TASK" : weakness === "precedenceExplicitness" ? "REFERENCE" : "RULES";
  const tone = scoreTone(context.metrics.composite);

  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline">
          <span class="hud-pill">Education feature</span>
          <span class="hud-pill">Optional lab</span>
          <span class="hud-pill">Isolated module</span>
        </div>
        <h2>Teachable Doppelgänger</h2>
        <p>Teach an AI apprentice how to shape the envelope, watch it make a plausible mistake, then repair the misconception. This lab turns coaching into a teach-by-explaining loop instead of a passive answer key.</p>
      </div>
      <div class="comparison-grid">
        <article class="lesson-card">
          <h3>1. Teach the apprentice</h3>
          <p>The apprentice is currently vulnerable to <strong>${escapeHtml(chosen.name)}</strong>.</p>
          <div class="input-row">
            <label>
              <span>Your coaching instruction</span>
              <textarea id="dd-instruction">When you place a card, say what job it is doing, then choose the section where that job stays easiest to review. Keep stable instructions separate from evidence and current-state facts.</textarea>
            </label>
          </div>
          <div class="button-row">
            <button class="action-button primary-button" data-dd-action="train">Train apprentice</button>
          </div>
        </article>
        <article class="lesson-card" id="dd-result-card">
          <h3>2. Observe the failure</h3>
          <p>The apprentice has not attempted the nearby case yet.</p>
        </article>
        <article class="lesson-card">
          <h3>3. Repair the misconception</h3>
          <p>Pick the best repair move after you see the apprentice fail.</p>
          <div class="mode-grid">
            <button class="choice-button" data-dd-fix="review">Tell it to review the card’s job before placing it.</button>
            <button class="choice-button" data-dd-fix="precedence">Tell it to repeat the precedence rule more loudly.</button>
            <button class="choice-button" data-dd-fix="guess">Tell it to trust the most recent text automatically.</button>
          </div>
          <div id="dd-feedback" class="feature-footer">No repair move chosen yet.</div>
        </article>
      </div>
      <div class="card-grid">
        <article class="lab-card" style="padding:1rem; background:${sectionSurface(apprenticeSection)}">
          <h3>Apprentice's tempting move</h3>
          <p>It wants to place a card into <strong>${escapeHtml(apprenticeSection)}</strong> because it looks superficially relevant there.</p>
          <ul>
            ${reference.map((item) => `<li>${escapeHtml(item.label)}</li>`).join("")}
          </ul>
        </article>
        <article class="lab-card" style="padding:1rem;">
          <h3>Why this matters</h3>
          <p>Your current envelope tone is <span class="status-dot ${tone}"></span> <strong>${escapeHtml(context.metrics.readiness)}</strong>. Teaching the apprentice helps the learner explain the shaping rule in plain language instead of clicking the answer that looks obvious.</p>
          <p>${escapeHtml(chosen.fix)}</p>
        </article>
      </div>
    </section>`;

  const resultNode = root.querySelector("#dd-result-card");
  const feedbackNode = root.querySelector("#dd-feedback");
  root.querySelector("[data-dd-action='train']")?.addEventListener("click", () => {
    const instruction = root.querySelector("#dd-instruction")?.value?.trim() || "";
    const evidence = reference[0]?.label || "source-of-record";
    resultNode.innerHTML = `<h3>2. Observe the failure</h3><p>The apprentice copied your instruction, but still placed <strong>${escapeHtml(evidence)}</strong> into <strong>${escapeHtml(apprenticeSection)}</strong> because it confused relevance with role.</p><p><strong>Why it failed:</strong> It heard the words, but it still has not internalized the distinction between a card's topic and the card's job inside the operating package.</p><p><strong>Your instruction summary:</strong> ${escapeHtml(instruction)}</p>`;
    helpers.announce("Apprentice run updated. Choose a repair move next.");
  });

  root.querySelectorAll("[data-dd-fix]").forEach((button) => button.addEventListener("click", () => {
    const choice = button.getAttribute("data-dd-fix");
    const correct = choice === "review";
    feedbackNode.innerHTML = correct
      ? `<strong>Correct repair.</strong> ${escapeHtml(chosen.fix)}`
      : `<strong>Weaker repair.</strong> The apprentice does not need louder wording. It needs the rule reframed around job, reviewability, and trust boundaries.`;
    helpers.announce(correct ? "Repair move accepted." : "Repair move flagged as weaker.");
  }));
}
