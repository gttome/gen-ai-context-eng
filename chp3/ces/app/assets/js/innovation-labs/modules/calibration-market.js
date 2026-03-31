import { escapeHtml, clamp } from "../shared/utils.js";

const markets = [
  ["structureClarity", "Section separation will hold up under review."],
  ["precedenceExplicitness", "The package will resolve conflict without model guesswork."],
  ["outputUsability", "A second reviewer will find the output contract easy to scan."],
  ["handlingReadiness", "The package makes uncertainty handling obvious."]
];

export function mount(root, context, helpers) {
  root.innerHTML = `
    <section class="workspace-panel">
      <div class="feature-summary">
        <div class="stack-inline"><span class="hud-pill">Education feature</span><span class="hud-pill">Metacognitive calibration</span></div>
        <h2>Calibration Market</h2>
        <p>Place confidence bets before the review lands. This lab scores not just performance, but how accurately the learner predicted where the envelope would be strong or weak.</p>
      </div>
      <div class="overview-grid">
        ${markets.map(([key, prompt]) => `
          <article class="calibration-row" data-cal-row="${key}">
            <h3>${escapeHtml(prompt)}</h3>
            <div class="range-pair"><input type="range" min="0" max="100" step="5" value="50" data-cal-input="${key}" /><output data-cal-output="${key}">50</output></div>
            <small>Actual score later compares against ${escapeHtml(key)}.</small>
          </article>`).join("")}
      </div>
      <div class="button-row"><button class="action-button primary-button" data-cal-action="score">Score my calibration</button></div>
      <div id="cal-result" class="feature-summary"><p>Place your bets first.</p></div>
    </section>`;

  root.querySelectorAll("[data-cal-input]").forEach((input) => input.addEventListener("input", () => {
    const key = input.getAttribute("data-cal-input");
    const output = root.querySelector(`[data-cal-output='${key}']`);
    if (output) output.textContent = input.value;
  }));

  root.querySelector("[data-cal-action='score']")?.addEventListener("click", () => {
    const rows = markets.map(([key, prompt]) => {
      const guess = Number(root.querySelector(`[data-cal-input='${key}']`)?.value || 0);
      const actual = context.metrics.metrics[key] || 0;
      const delta = Math.abs(guess - actual);
      const label = delta <= 10 ? "well calibrated" : delta <= 25 ? "slightly off" : "miscalibrated";
      return { key, prompt, guess, actual, delta, label };
    });
    const calibrationScore = clamp(100 - Math.round(rows.reduce((sum, row) => sum + row.delta, 0) / rows.length), 0, 100);
    const biggestBlindSpot = [...rows].sort((a, b) => b.delta - a.delta)[0];
    root.querySelector("#cal-result").innerHTML = `
      <div class="spark-grid">
        <div class="spark"><span>Calibration score</span><strong>${calibrationScore}</strong><small>100 = perfectly calibrated</small></div>
        <div class="spark"><span>Biggest blind spot</span><strong>${escapeHtml(biggestBlindSpot.key)}</strong><small>${biggestBlindSpot.delta} point gap</small></div>
      </div>
      <div class="ledger-table"><table><thead><tr><th>Market</th><th>Your bet</th><th>Actual</th><th>Interpretation</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.prompt)}</td><td>${row.guess}</td><td>${row.actual}</td><td>${escapeHtml(row.label)}</td></tr>`).join("")}</tbody></table></div>
      <p><strong>Coaching:</strong> Use this to improve metacognition. The point is not to sound confident. The point is to know where the package is actually fragile before you run it.</p>`;
    helpers.announce(`Calibration score ${calibrationScore}`);
  });
}
