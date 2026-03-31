import { escapeHtml } from "../../utils/helpers.js";
import { renderPackagePreview, renderPastebackReview, renderAnswerXRay } from "../panels/renderPanels.js";
import { renderBranchContextBanner } from "./renderScreenHelpers.js";

export function renderExportScreen(state, derivedState) {
  const hasPaste = Boolean(state.session.pastedOutput);
  return `
    <section class="screen" aria-labelledby="export-heading">
      <div class="panel">
        <div class="stepper">
          <div class="step is-complete">Package built</div>
          <div class="step ${state.session.copiedAt ? "is-complete" : "is-active"}">Copy into external LLM</div>
          <div class="step ${hasPaste ? "is-complete" : state.session.copiedAt ? "is-active" : ""}">Paste answer back here</div>
          <div class="step ${hasPaste ? "is-active" : ""}">Review impact</div>
        </div>
      </div>

      <div class="workflow-grid">
        <article class="panel workflow-step-card">
          <span class="pill">Step 1</span>
          <h3>Copy the package</h3>
          <p>Use the exact package below so the external model receives the same evidence and rules you curated here.</p>
        </article>
        <article class="panel workflow-step-card">
          <span class="pill">Step 2</span>
          <h3>Run it in another LLM</h3>
          <p>Paste the package into your external model of choice and capture the full answer it returns.</p>
        </article>
        <article class="panel workflow-step-card">
          <span class="pill">Step 3</span>
          <h3>Paste the answer back</h3>
          <p>Paste the observed answer into the review box below. That is the paste-back step.</p>
        </article>
      </div>

      <div class="panel-grid">
        <div class="stack">
          <section class="panel">
            <div class="screen-actions">
              <div class="stack" style="gap:.2rem;">
                <h2 id="export-heading">Copy-ready package</h2>
                <p>Export keeps the distinction between direct evidence, summaries, and deferred material visible.</p>
              </div>
              <button class="primary-button" data-copy-export="true">Copy package for external LLM</button>
            </div>
            ${derivedState.activeBonusBranch ? renderBranchContextBanner(derivedState.mission, derivedState.activeBonusBranch, derivedState.branchPolicy) : ""}
            <div class="copy-box" style="margin-top:1rem;">
              <pre>${escapeHtml(derivedState.exportPayload)}</pre>
            </div>
          </section>

          <section class="panel">
            <div class="stack" style="gap:.8rem;">
              <div class="screen-actions">
                <div class="stack" style="gap:.2rem;">
                  <h3>Paste the external answer back here</h3>
                  <p>Paste the result from the external LLM here, then inspect the rubric breakdown before moving on.</p>
                </div>
                <div class="inline-actions">
                  <button data-open-answer-xray="true" ${hasPaste ? "" : "disabled"}>Open Answer X-Ray</button>
                  <button data-open-review-insights="true" ${hasPaste ? "" : "disabled"}>Open detailed review</button>
                </div>
              </div>
              <div class="note-box">
                <strong>Quick reminder</strong>
                <p>This textarea is the paste-back step. It lives on the Export screen rather than in a separate mode.</p>
              </div>
              <div class="review-impact-bar">
                <div class="stack" style="gap:.2rem;">
                  <strong>Next step access</strong>
                  <p>After you paste the external answer, review the impact from here without scrolling to the bottom.</p>
                </div>
                <div class="inline-actions">
                  <button data-open-answer-xray="true" ${hasPaste ? "" : "disabled"}>Answer X-Ray</button>
                  <button data-open-review-insights="true" ${hasPaste ? "" : "disabled"}>Detailed review</button>
                  <button class="primary-button" data-open-comparison="true">${hasPaste ? "Review impact" : "Review impact without paste-back"}</button>
                </div>
              </div>
              <textarea data-pasteback-output="true" placeholder="Paste the observed output here...">${escapeHtml(state.session.pastedOutput || "")}</textarea>
              ${renderAnswerXRay(derivedState.pastebackReview, state.session.pastedOutput)}
              ${renderPastebackReview(derivedState.pastebackReview)}
              <div class="screen-actions">
                <button data-back-workspace="true">Back to workspace</button>
                <div class="inline-actions">
                  <button data-back-to-launch="true">Mission Director Map</button>
                  <button class="primary-button" data-open-comparison="true">${hasPaste ? "Review impact" : "Review impact without paste-back"}</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside class="sticky-side">
          ${renderPackagePreview(derivedState.mission, derivedState)}
        </aside>
      </div>
    </section>
  `;
}
