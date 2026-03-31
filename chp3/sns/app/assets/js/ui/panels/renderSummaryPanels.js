import { escapeHtml, titleCase } from "../../utils/helpers.js";

export function renderSummary(derivedState, session) {
  const branchTeaching = derivedState.comparison?.teachingFocus || [];
  return `
    <div class="stack">
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.3rem;">
            <h3>Run summary</h3>
            <p>Core completion stays separate from optional bonus exploration.</p>
          </div>
          <span class="progress-chip">${derivedState.tier} · ${derivedState.composite}</span>
        </div>
        <div class="summary-list" style="margin-top:1rem;">
          ${Object.entries(derivedState.metrics.scores).map(([key, value]) => `
            <div class="metric-card">
              <div class="metric-label">${escapeHtml(titleCase(key))}</div>
              <div class="metric-value">${value}</div>
              <div class="metric-sub">${value >= 80 ? "Healthy" : value >= 65 ? "Watch closely" : "Needs attention"}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h3>Debrief</h3>
        <div class="debrief-list" style="margin-top:.8rem;">
          <div class="note-box">Quick prediction note: ${session.quickPrediction ? escapeHtml(session.quickPrediction) : "No note captured."}</div>
          <div class="success-box">Best next move: tighten any weak include that is consuming budget without changing the answer or required format.</div>
          ${session.bonusActive ? `<div class="success-box">Bonus branch completed: ${escapeHtml(session.bonusBranchLabel || "Additional drill")}</div>` : `<div class="note-box">Open Explore More to run a bonus drill without losing core completion.</div>`}
          ${branchTeaching.length ? `<div class="warning-box"><strong>Replay teaching takeaway</strong><ul>${branchTeaching.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
          ${derivedState.pastebackReview?.fixFirst?.length ? `<div class="note-box"><strong>Carry-forward fix list</strong><ul>${derivedState.pastebackReview.fixFirst.map(item => `<li>${escapeHtml(item.label)} — ${escapeHtml(item.action)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </div>
    </div>
  `;
}
