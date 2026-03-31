import { escapeHtml } from "../../utils/helpers.js";

function severityClass(severity = "note") {
  if (severity === "danger" || severity === "warn") return "warning-box";
  if (severity === "good") return "success-box";
  return "note-box";
}

function normalizeSentence(text = "") {
  return String(text).toLowerCase().replace(/\s+/g, " ").replace(/[“”]/g, '"').trim();
}

function splitXRaySentences(text = "") {
  return String(text).split(/(?<=[.!?])\s+|\n+/).map(item => item.trim()).filter(Boolean);
}

function sentenceMatches(sentence = "", matchText = "") {
  if (!sentence || !matchText) return false;
  const a = normalizeSentence(sentence);
  const b = normalizeSentence(matchText);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function xrayPriority(tags = []) {
  if (tags.includes("contradicted")) return "contradicted";
  if (tags.includes("hard-to-trace")) return "hard-to-trace";
  if (tags.includes("watch")) return "watch";
  if (tags.includes("supported")) return "supported";
  return "neutral";
}

function buildAnswerXRayModel(review, pastedOutput = "") {
  const sentences = splitXRaySentences(pastedOutput);
  const rows = sentences.map((sentence, index) => ({ index, sentence, tags: [], notes: [] }));
  const mark = (matchText, tag, note) => {
    if (!matchText) return;
    rows.forEach(row => {
      if (!sentenceMatches(row.sentence, matchText)) return;
      if (!row.tags.includes(tag)) row.tags.push(tag);
      if (note && !row.notes.includes(note)) row.notes.push(note);
    });
  };

  (review?.claimMatrix || []).forEach(item => {
    if (item.evidenceText) {
      mark(item.evidenceText, item.status === "supported" ? "supported" : "watch", `${item.type} · ${item.label}`);
      if (item.mixedSignal) mark(item.evidenceText, "watch", "Mixed signal support");
    }
    if (item.issueText) mark(item.issueText, "contradicted", `${item.type} · ${item.label}`);
  });
  (review?.supportTraces || []).filter(item => item.hit).forEach(item => mark(item.matchText, "supported", `Selected evidence · ${item.label}`));
  (review?.dynamicFactTraces || []).filter(item => item.hit).forEach(item => mark(item.matchText, "supported", `Dynamic fact · ${item.label}`));
  (review?.unsupportedSentences || []).forEach(sentence => mark(sentence, "hard-to-trace", "Hard to trace back to the selected package"));

  const annotated = rows.map(row => ({ ...row, primary: xrayPriority(row.tags) }));
  const counts = {
    contradicted: annotated.filter(item => item.primary === "contradicted").length,
    hardToTrace: annotated.filter(item => item.primary === "hard-to-trace").length,
    watch: annotated.filter(item => item.primary === "watch").length,
    supported: annotated.filter(item => item.primary === "supported").length,
    neutral: annotated.filter(item => item.primary === "neutral").length
  };
  return { rows: annotated, counts };
}

function xrayChip(label, cssClass = "") {
  return `<span class="pill ${cssClass}">${escapeHtml(label)}</span>`;
}

function renderAnswerXRayBody(review, pastedOutput = "") {
  if (!pastedOutput?.trim()) {
    return `<div class="note-box"><strong>Paste an answer first</strong><p>Answer X-Ray lights up after you paste external LLM output into the Export screen.</p></div>`;
  }
  const xray = buildAnswerXRayModel(review, pastedOutput);
  return `
    <div class="xray-legend">
      ${xrayChip(`${xray.counts.supported} supported`, "is-supported")}
      ${xrayChip(`${xray.counts.watch} watch`, "is-watch")}
      ${xrayChip(`${xray.counts.contradicted} contradicted`, "is-issue")}
      ${xrayChip(`${xray.counts.hardToTrace} hard to trace`, "is-issue")}
      ${xrayChip(`${xray.counts.neutral} neutral`)}
    </div>
    <div class="xray-reading">
      ${xray.rows.map(item => `
        <article class="xray-sentence is-${item.primary}">
          <div class="screen-actions">
            <span class="progress-chip">Sentence ${item.index + 1}</span>
            <div class="inline-actions">
              ${(item.tags.length ? item.tags : ["neutral"]).map(tag => xrayChip(tag.replace(/-/g, " "))).join("")}
            </div>
          </div>
          <p>${escapeHtml(item.sentence)}</p>
          ${item.notes.length ? `<div class="inline-actions">${item.notes.slice(0, 4).map(note => xrayChip(note)).join("")}</div>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

export function renderAnswerXRay(review, pastedOutput = "") {
  return `
    <div class="panel xray-panel">
      <div class="screen-actions">
        <div class="stack" style="gap:.2rem;">
          <h3>Answer X-Ray</h3>
          <p>Read the pasted answer as evidence. Supported, shaky, and contradicted regions are separated so the learner can see where the handoff holds and where it drifts.</p>
        </div>
      </div>
      ${renderAnswerXRayBody(review, pastedOutput)}
    </div>
  `;
}

export function renderAnswerXRayModal(review, pastedOutput = "", mission = { title: "Mission" }) {
  return `
    <div class="modal-top">
      <div class="stack" style="gap:.3rem;">
        <h3>Answer X-Ray</h3>
        <p>${escapeHtml(mission.title)} · Inspect the pasted answer sentence by sentence.</p>
      </div>
      <button data-close-modal="true">Close</button>
    </div>
    ${renderAnswerXRayBody(review, pastedOutput)}
  `;
}

function matrixStatusLabel(status = "unsupported") {
  return status === "weakly-supported" ? "Weakly supported" : status === "supported" ? "Supported" : status === "contradicted" ? "Contradicted" : "Unsupported";
}

function matrixSeverityLabel(severity = "low") {
  return severity === "high" ? "High priority" : severity === "medium" ? "Medium priority" : "Low priority";
}

function matrixCardClass(item) {
  if (item.status === "supported" && item.severity === "low") return "success-box";
  if (item.status === "weakly-supported") return "note-box";
  return "warning-box";
}

function renderFactMatrix(review) {
  if (!review.factResults?.length) return "";
  return `
    <div class="panel">
      <div class="screen-actions">
        <h3>Numeric, timing, and direction fidelity</h3>
        <span class="pill">${review.factCoverageScore}% aligned</span>
      </div>
      <div class="stack" style="margin-top:.8rem;">
        ${review.factResults.map(item => `
          <div class="${item.status === "aligned" ? "success-box" : item.status === "contradicted" ? "warning-box" : "note-box"}">
            <strong>${escapeHtml(item.label)}</strong>
            <p>${item.status === "aligned"
              ? `Aligned${item.supportModeLabel ? ` · ${escapeHtml(item.supportModeLabel)}` : ""}${item.matchedSentence ? ` · ${escapeHtml(item.matchedSentence)}` : "."}`
              : item.status === "contradicted"
                ? `${escapeHtml(item.conflictFamily || "Fact drift")} detected${item.contradictionSentence ? ` · ${escapeHtml(item.contradictionSentence)}` : "."}`
                : "Not clearly carried through yet."}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderAssertionMatrix(review) {
  if (!review.assertionResults?.length) return "";
  return `
    <div class="panel">
      <div class="screen-actions">
        <h3>Claim alignment</h3>
        <span class="pill">${review.assertionCoverageScore}% aligned</span>
      </div>
      <div class="stack" style="margin-top:.8rem;">
        ${review.assertionResults.map(item => `
          <div class="${item.status === "aligned" ? "success-box" : item.status === "contradicted" ? "warning-box" : "note-box"}">
            <strong>${escapeHtml(item.label)}</strong>
            <p>${item.status === "aligned"
              ? `Aligned${item.supportModeLabel ? ` · ${escapeHtml(item.supportModeLabel)}` : ""}${item.matchedSentence ? ` · ${escapeHtml(item.matchedSentence)}` : "."}`
              : item.status === "contradicted"
                ? `Contradicted${item.contradictionSentence ? ` · ${escapeHtml(item.contradictionSentence)}` : "."}`
                : "Not clearly carried through yet."}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCaveatMatrix(review) {
  if (!review.caveatResults?.length) return "";
  return `
    <div class="panel">
      <div class="screen-actions">
        <h3>Required caveats</h3>
        <span class="pill">${review.caveatCoverageScore}% aligned</span>
      </div>
      <div class="stack" style="margin-top:.8rem;">
        ${review.caveatResults.map(item => `
          <div class="${item.status === "aligned" ? "success-box" : item.status === "contradicted" ? "warning-box" : "note-box"}">
            <strong>${escapeHtml(item.label)}</strong>
            <p>${item.status === "aligned"
              ? `Aligned${item.supportModeLabel ? ` · ${escapeHtml(item.supportModeLabel)}` : ""}${item.matchedSentence ? ` · ${escapeHtml(item.matchedSentence)}` : "."}`
              : item.status === "contradicted"
                ? `Conflicted${item.contradictionSentence ? ` · ${escapeHtml(item.contradictionSentence)}` : "."}`
                : "The answer still needs to state this caveat explicitly."}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRubricBreakdown(review) {
  return `
    <div class="review-breakdown">
      ${review.rubric.map(item => `
        <article class="rubric-card ${item.score >= Math.round(item.max * 0.75) ? "is-healthy" : item.score >= Math.round(item.max * 0.45) ? "is-watch" : "is-weak"}">
          <div class="screen-actions">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="pill">${item.score}/${item.max}</span>
          </div>
          <p>${escapeHtml(item.body)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderClaimEvidenceMatrix(review) {
  if (!review.claimMatrix?.length) return "";
  const summary = review.claimMatrixSummary || {};
  return `
    <div class="panel">
      <div class="screen-actions">
        <div class="stack" style="gap:.2rem;">
          <h3>Claim-to-evidence matrix</h3>
          <p>Use this to see what is clearly supported, only weakly supported, still unsupported, or directly contradicted.</p>
        </div>
        <div class="inline-actions">
          <span class="pill">Supported ${summary.supported || 0}</span>
          <span class="pill">Weak ${summary.weaklySupported || 0}</span>
          <span class="pill">Unsupported ${summary.unsupported || 0}</span>
          <span class="pill">Contradicted ${summary.contradicted || 0}</span>
          <span class="pill">Mixed signals ${summary.mixedSignals || 0}</span>
          <span class="pill">Split support ${summary.splitSupport || 0}</span>
          <span class="pill">Implied only ${summary.impliedSupport || 0}</span>
          <span class="pill">Paraphrase-compatible ${summary.semanticSupport || 0}</span>
        </div>
      </div>
      <div class="matrix-grid" style="margin-top:.9rem;">
        ${review.claimMatrix.map(item => `
          <article class="matrix-card ${item.status === "supported" ? "is-supported" : item.status === "weakly-supported" ? "is-weak" : "is-issue"}">
            <div class="screen-actions">
              <div class="stack" style="gap:.15rem;">
                <strong>${escapeHtml(item.label)}</strong>
                <small>${escapeHtml(item.type)}</small>
              </div>
              <div class="inline-actions">
                <span class="pill">${escapeHtml(matrixStatusLabel(item.status))}</span>
                <span class="pill">${escapeHtml(matrixSeverityLabel(item.severity))}</span>
              </div>
            </div>
            <div class="stack" style="gap:.55rem; margin-top:.7rem;">
              ${item.evidenceText ? `<div class="success-box compact-note"><strong>Evidence sentence</strong><p>${escapeHtml(item.evidenceText)}</p></div>` : `<div class="note-box compact-note"><strong>Evidence sentence</strong><p>No direct support sentence is obvious yet.</p></div>`}
              <div class="note-box compact-note"><strong>Support mode</strong><p>${escapeHtml(item.supportMode || "Not yet supported")}</p></div>
              ${item.issueText ? `<div class="warning-box compact-note"><strong>Issue sentence</strong><p>${escapeHtml(item.issueText)}</p></div>` : ""}
              ${item.mixedSignal ? `<div class="warning-box compact-note"><strong>Consistency risk</strong><p>${escapeHtml(item.consistencyMode === "same-answer-region" ? "This point is supported and contradicted inside the same answer region." : "This point is supported in one answer region but contradicted elsewhere." )}</p></div>` : ""}
              ${item.matchedGroups?.length ? `<div class="success-box compact-note"><strong>Facts holding together</strong><p>${escapeHtml(item.matchedGroups.join(", "))}</p></div>` : ""}
              ${item.missingGroups?.length ? `<div class="note-box compact-note"><strong>Still needs to stay connected</strong><p>${escapeHtml(item.missingGroups.join(", "))}</p></div>` : ""}
              ${item.teachingNote ? `<div class="note-box compact-note"><strong>Why this matters</strong><p>${escapeHtml(item.teachingNote)}</p></div>` : ""}
              <div class="${matrixCardClass(item)} compact-note"><strong>Fix</strong><p>${escapeHtml(item.fixAction)}</p></div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderFixFirst(review) {
  if (!review.fixFirst?.length) return "";
  return `
    <div class="panel">
      <div class="screen-actions">
        <h3>What to fix first</h3>
        <span class="pill">${review.fixFirst.length} focus item${review.fixFirst.length === 1 ? "" : "s"}</span>
      </div>
      <div class="stack" style="margin-top:.8rem;">
        ${review.fixFirst.map(item => `
          <div class="${item.severity === "high" ? "warning-box" : item.severity === "medium" ? "note-box" : "success-box"}">
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(matrixSeverityLabel(item.severity))} · ${escapeHtml(matrixStatusLabel(item.status))}</p>
            <p>${escapeHtml(item.action)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderReviewCarryForwardSummary(review) {
  if (!review) return "";
  const summary = review.claimMatrixSummary || {};
  const firstFix = review.fixFirst?.[0];
  return `
    <section class="panel" data-review-summary="true" aria-labelledby="comparison-review-heading">
      <div class="screen-actions">
        <div class="stack" style="gap:.2rem;">
          <h3 id="comparison-review-heading">Paste-back rubric review</h3>
          <p>Keep the review visible while you compare package choices so the downstream impact is not hidden on the previous screen.</p>
        </div>
        <div class="inline-actions">
          <span class="progress-chip">${review.band} · ${review.reviewScore}</span>
          <span class="pill" data-support-mode-summary="true">Support mode cues</span>
        </div>
      </div>
      <div class="review-breakdown" style="margin-top:.9rem;">
        <article class="rubric-card ${review.reviewScore >= 80 ? "is-healthy" : review.reviewScore >= 60 ? "is-watch" : "is-weak"}">
          <div class="screen-actions">
            <strong>Claim-to-evidence status</strong>
            <span class="pill">${summary.supported || 0} supported</span>
          </div>
          <p>${summary.weaklySupported || 0} weak · ${summary.unsupported || 0} unsupported · ${summary.contradicted || 0} contradicted · ${summary.mixedSignals || 0} mixed-signal rows</p>
        </article>
        <article class="rubric-card ${summary.supported ? "is-healthy" : "is-watch"}">
          <div class="screen-actions">
            <strong>Support mode</strong>
            <span class="pill">${summary.splitSupport || 0} split support</span>
          </div>
          <p>${summary.impliedSupport || 0} implied-only rows · ${summary.semanticSupport || 0} paraphrase-compatible rows</p>
        </article>
      </div>
      ${firstFix ? `<div class="${firstFix.severity === "high" ? "warning-box" : "note-box"}" style="margin-top:.9rem;"><strong>What to fix first</strong><p>${escapeHtml(firstFix.label)} — ${escapeHtml(firstFix.action)}</p></div>` : ""}
    </section>
  `;
}

export function renderPastebackReview(review) {
  if (!review) return "";
  const sectionText = review.expectedSections.length
    ? review.expectedSections.map(item => `${item.label}: ${item.present ? "present" : "missing"}`).join(" · ")
    : "No structured sections configured for this mission.";
  const supportText = review.supportGroups.length
    ? review.supportGroups.map(item => `${item.label}: ${item.hit ? "trace found" : "not obvious yet"}`).join(" · ")
    : "No support groups available yet because the current package has little direct evidence.";
  return `
    <div class="stack" style="gap:.8rem;">
      <div class="screen-actions">
        <h3 data-review-heading="true">Paste-back rubric review</h3>
        <span class="progress-chip">${review.band} · ${review.reviewScore}</span>
      </div>
      <div class="note-box">
        <strong>Requested structure</strong>
        <p>${escapeHtml(sectionText)}</p>
      </div>
      <div class="note-box">
        <strong>Evidence carry-through</strong>
        <p>${escapeHtml(supportText)}</p>
      </div>
      <div class="screen-actions">
        <div class="note-box compact-note">
          <strong>Source traceability</strong>
          <p>${review.traceCoverageScore}% of the selected evidence, dynamic facts, mission claims, key numeric/date facts, and required caveats were traceable in the pasted answer.</p>
        </div>
        <div class="note-box compact-note">
          <strong>Claim-to-evidence status</strong>
          <p>${review.claimMatrixSummary ? `${review.claimMatrixSummary.supported} supported · ${review.claimMatrixSummary.weaklySupported} weakly supported · ${review.claimMatrixSummary.unsupported} unsupported · ${review.claimMatrixSummary.contradicted} contradicted · ${review.claimMatrixSummary.mixedSignals || 0} mixed-signal rows · ${review.claimMatrixSummary.splitSupport || 0} split across nearby sentences` : "No mission-level claim assertions configured."}</p>
        </div>
      </div>
      ${renderRubricBreakdown(review)}
      ${review.missionCoaching?.length ? `<div class="warning-box"><strong>Mission-specific coaching</strong><ul>${review.missionCoaching.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
      ${renderFixFirst(review)}
      ${renderClaimEvidenceMatrix(review)}
      <div class="note-box">
        <strong>Length and uncertainty</strong>
        <p>${review.wordCount ? `${review.wordCount} words · target ${review.conciseLimit} · ${review.concise ? "within target" : "longer than target"} · ${review.uncertaintyHit ? "uncertainty language detected" : "no uncertainty language detected"}` : "Paste an answer to evaluate length and uncertainty handling."}</p>
      </div>
      ${review.uncoveredEssential.length ? `<div class="warning-box"><strong>Essential evidence not obvious yet</strong><p>${escapeHtml(review.uncoveredEssential.join(", "))}</p></div>` : ""}
      ${review.priorityActions.length ? `<div class="warning-box"><strong>Best next fixes</strong><ul>${review.priorityActions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
      ${review.findings.map(item => `
        <div class="${severityClass(item.severity)}">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.body)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderReviewInsightsModal(review, mission) {
  return `
    <div class="modal-top">
      <div class="stack" style="gap:.3rem;">
        <h3>Paste-back review insights</h3>
        <p>${escapeHtml(mission.title)} · Inspect the rubric, source traces, claim support, and priority fixes.</p>
      </div>
      <button data-close-modal="true">Close</button>
    </div>
    ${renderPastebackReview(review)}
    <div class="stack" style="margin-top:1rem;">
      ${review.checks.map(item => `
        <div class="${item.hit ? "success-box" : "warning-box"}">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${item.hit ? "Detected in the pasted response." : "Not clearly detected in the pasted response yet."}</p>
        </div>
      `).join("")}
      ${renderAssertionMatrix(review)}
      ${renderFactMatrix(review)}
      ${renderCaveatMatrix(review)}
      <div class="panel">
        <h3>Selected evidence trace</h3>
        <div class="stack" style="margin-top:.8rem;">
          ${review.supportTraces.map(item => `
            <div class="${item.hit ? "success-box" : "warning-box"}">
              <strong>${escapeHtml(item.label)}</strong>
              <p>${item.hit ? `Matched sentence: ${escapeHtml(item.matchText)}` : "No clear sentence match detected yet."}</p>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <h3>Dynamic facts trace</h3>
        <div class="stack" style="margin-top:.8rem;">
          ${review.dynamicFactTraces.map(item => `
            <div class="${item.hit ? "success-box" : "note-box"}">
              <strong>${escapeHtml(item.label)}</strong>
              <p>${item.hit ? `Matched sentence: ${escapeHtml(item.matchText)}` : "No clear trace detected yet."}</p>
            </div>
          `).join("")}
        </div>
      </div>
      ${review.unsupportedSentences.length ? `<div class="panel"><h3>Hard-to-trace sentences</h3><div class="stack" style="margin-top:.8rem;">${review.unsupportedSentences.map(sentence => `<div class="warning-box"><p>${escapeHtml(sentence)}</p></div>`).join("")}</div></div>` : ""}
      ${review.staleMentions.length ? `<div class="warning-box"><strong>Possible weak-background leakage</strong><p>${escapeHtml(review.staleMentions.map(item => item.label).join(", "))}</p></div>` : ""}
    </div>
  `;
}
