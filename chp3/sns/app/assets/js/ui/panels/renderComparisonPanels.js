import { escapeHtml } from "../../utils/helpers.js";
import { actionLabel } from "../../domain/cardRules.js";

export function renderComparison(derivedState) {
  const { comparison } = derivedState;
  return `
    <div class="stack">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.3rem;">
            <h3>Strongest-practice comparison</h3>
            <p>The stronger package is not magical. It is simply more selective and more reviewable.</p>
          </div>
          <span class="progress-chip">Alignment ${comparison.alignmentPercent}%</span>
        </div>

        <div class="compare-grid" style="margin-top:1rem;">
          <div class="panel" style="padding:.9rem;">
            <h3>Your package</h3>
            <ul>
              ${comparison.rows.map(row => `<li>${escapeHtml(row.title)} — ${escapeHtml(actionLabel(row.learnerAction))}</li>`).join("")}
            </ul>
          </div>
          <div class="panel" style="padding:.9rem;">
            <h3>Strongest-practice package</h3>
            <ul>
              ${comparison.rows.map(row => `<li>${escapeHtml(row.title)} — ${escapeHtml(actionLabel(row.strongestAction))}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="stack" style="margin-top:1rem;">
          ${comparison.commentary.map(item => `<div class="note-box">${escapeHtml(item)}</div>`).join("")}
          ${comparison.teachingFocus?.length ? `<div class="warning-box"><strong>Replay teaching focus</strong><ul>${comparison.teachingFocus.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </div>

      <div class="panel">
        <div class="screen-actions">
          <h3>Why the stronger choice is stronger</h3>
          <span class="pill">${comparison.differences.length} difference${comparison.differences.length === 1 ? "" : "s"}</span>
        </div>
        <div class="stack" style="margin-top:.8rem;">
          ${comparison.differences.length ? comparison.differences.map(row => `
            <article class="compare-detail-card">
              <div class="compare-detail-top">
                <div class="stack" style="gap:.25rem;">
                  <strong>${escapeHtml(row.title)}</strong>
                  <div class="meta-row">
                    <span class="pill">${escapeHtml(row.cardMeta.sourceType)}</span>
                    <span class="pill">${escapeHtml(row.cardMeta.recency)}</span>
                    <span class="pill">${escapeHtml(row.cardMeta.authority)} authority</span>
                    ${row.cardMeta.essential ? `<span class="pill">Essential</span>` : ""}${row.cardMeta.branchFlag ? `<span class="pill">${escapeHtml(row.cardMeta.branchFlag)}</span>` : ""}
                  </div>
                </div>
              </div>
              <div class="compare-detail-grid">
                <div class="warning-box">
                  <strong>Your action</strong>
                  <p>${escapeHtml(actionLabel(row.learnerAction))}</p>
                  <p>${escapeHtml(row.learnerRisk)}</p>
                </div>
                <div class="success-box">
                  <strong>Stronger action</strong>
                  <p>${escapeHtml(actionLabel(row.strongestAction))}</p>
                  <p>${escapeHtml(row.strongerReason)}</p>
                </div>
              </div>
            </article>
          `).join("") : `<div class="success-box">Your current selections match the strongest-practice package on every card.</div>`}
        </div>
      </div>
    </div>
  `;
}
