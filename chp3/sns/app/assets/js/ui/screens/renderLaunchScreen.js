import { escapeHtml } from "../../utils/helpers.js";

function formatDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function renderMissionDirectorMap(state) {
  const records = state.missionDirector || {};
  const activeMissionId = state.session?.missionId;
  const activeStageLabel = state.session.stage === "launch"
    ? (state.session.resumeStage || "brief")
    : (state.session.stage || "brief");
  return `
    <section class="panel director-spotlight" aria-labelledby="director-heading">
      <div class="screen-actions">
        <div class="stack" style="gap:.2rem;">
          <span class="pill">Mission hub</span>
          <h3 id="director-heading">Mission Director Map</h3>
          <p>Choose a new mission fast, jump back into your active run, and track which replay branches and strongest scores you have already earned.</p>
        </div>
        <div class="inline-actions">
          <span class="progress-chip">${Object.values(records).filter(item => item.coreCompleted).length} core missions completed</span>
          ${state.session?.missionId ? `<button class="primary-button" data-resume-session="true">Resume current run</button>` : ""}
          ${(state.session?.missionId || Object.keys(records).length) ? `<button class="ghost-button restart-fresh-button" data-restart-fresh="true">Restart fresh</button>` : ""}
        </div>
      </div>
      <div class="director-grid" style="margin-top:1rem;">
        ${state.missions.map(mission => {
          const record = records[mission.id] || {};
          const branchCount = Object.keys(record.branchesCompleted || {}).length;
          const isActive = activeMissionId === mission.id;
          const statusLabel = isActive
            ? `In progress · ${activeStageLabel}`
            : record.coreCompleted
              ? "Core mission completed"
              : (record.attempts ? "Practiced" : "Not started");
          return `
            <article class="director-card ${isActive ? "is-active" : ""}">
              <div class="screen-actions">
                <div class="stack" style="gap:.25rem;">
                  <strong>${escapeHtml(mission.title)}</strong>
                  <div class="inline-actions">
                    <span class="pill">${escapeHtml(statusLabel)}</span>
                    <span class="pill">${escapeHtml(mission.estimatedMinutes)}</span>
                  </div>
                </div>
                <span class="progress-chip">${Math.round(record.bestComposite || 0)} best package</span>
              </div>
              <p>${escapeHtml(mission.summary)}</p>
              <div class="director-stats">
                <div><small>Attempts</small><strong>${record.attempts || 0}</strong></div>
                <div><small>Best review</small><strong>${record.bestReviewScore ? Math.round(record.bestReviewScore) : "—"}</strong></div>
                <div><small>Bonus branches</small><strong>${branchCount}</strong></div>
                <div><small>Last practiced</small><strong>${escapeHtml(formatDate(record.lastPlayedAt || record.lastCompletedAt))}</strong></div>
              </div>
              <div class="inline-actions">
                ${isActive ? `<button class="ghost-button" data-resume-session="true">Resume current run</button>` : ""}
                <button class="primary-button" data-start-mission="${mission.id}">${isActive ? "Restart mission" : (record.attempts ? "Start fresh run" : "Start mission")}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderLaunchScreen(state) {
  const missionCards = state.missions.map(mission => `
    <article class="glass-card hero">
      <div class="stack" style="gap:.7rem;">
        <div class="inline-actions">
          <span class="pill">${escapeHtml(mission.difficulty)}</span>
          <span class="pill">${escapeHtml(mission.estimatedMinutes)}</span>
        </div>
        <h2>${escapeHtml(mission.title)}</h2>
        <p>${escapeHtml(mission.summary)}</p>
        <div class="screen-actions">
          <button class="primary-button" data-start-mission="${mission.id}">Start mission</button>
          <span class="small">${escapeHtml(mission.learnerGoal)}</span>
        </div>
      </div>
    </article>
  `).join("");

  return `
    <section class="screen" aria-labelledby="launch-heading">
      <div class="hero-grid">
        <article class="glass-card hero">
          <div class="stack" style="gap:.8rem;">
            <span class="pill">Chapter 3 · Selection first</span>
            <h2 id="launch-heading">Choose what belongs before you write the prompt</h2>
            <p>This application teaches Selection as a disciplined phase inside the broader Discovery → Selection → Shaping → Execution → Evaluation → Iteration → Deployment lifecycle.</p>
            <ul>
              <li>Prepared cards teach authority, freshness, budget fit, and reviewability.</li>
              <li>The package preview, metrics, and comparison view show why smaller can be stronger.</li>
              <li>The manual external-LLM loop remains part of the product flow rather than a broken handoff.</li>
            </ul>
          </div>
        </article>
        <article class="glass-card hero">
          <div class="stack" style="gap:.8rem;">
            <h3>Core mission rhythm</h3>
            <div class="stepper">
              <div class="step is-active">Brief</div>
              <div class="step">Select</div>
              <div class="step">Export</div>
              <div class="step">Compare</div>
              <div class="step">Summary</div>
            </div>
            ${state.needsResumeNotice ? `<div class="warning-box"><strong>Saved session found.</strong><p>You can resume the last mission from where you left off, clear only the saved run, or restart the studio fresh like a first-time open.</p><div class="inline-actions"><button data-resume-session="true">Resume saved session</button><button data-clear-session="true">Clear saved run</button><button class="ghost-button restart-fresh-button" data-restart-fresh="true">Restart fresh</button></div></div>` : `<div class="note-box">No saved session is active right now. Pick any validation pack to begin.</div>`}
          </div>
        </article>
      </div>
      ${renderMissionDirectorMap(state)}
      <div class="panel">
        <div class="screen-actions">
          <div class="stack" style="gap:.2rem;">
            <h3>Validation packs</h3>
            <p>These packs are intentionally provisional. They exist to validate the shell, metrics, and learning loop while keeping Chapter 3 intact.</p>
          </div>
        </div>
        <div class="stack" style="margin-top:1rem;">
          ${missionCards}
        </div>
      </div>
    </section>
  `;
}
