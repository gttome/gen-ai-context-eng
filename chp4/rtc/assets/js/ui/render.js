import { APP_VERSION } from "../config.js";
import { detectEnvironment } from "./environment.js";
import { CORE_STEPS } from "../state/store.js";
import { buildPathCues, stepStatus, canAdvance, isCorrectSelection, getCheck } from "../domain/triage-rules.js";
import { computeMetrics, strongestImprovement } from "../metrics/scoring.js";
import { buildBestPathSummary } from "../domain/record.js";

function metricBar(score) {
  return `<div class="score-strip" aria-hidden="true"><span style="width:${score}%"></span></div>`;
}

function stableHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function stableOrdered(items, seed) {
  return [...items]
    .map((item, index) => ({ item, index, rank: stableHash(`${seed}:${item.id || index}`) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(entry => entry.item);
}

function orderedChoices(items, seed) {
  const ordered = stableOrdered(items, seed);
  const correctIndex = ordered.findIndex(item => item && item.isCorrect);
  if (correctIndex === 0 && ordered.length > 1) {
    const [correct] = ordered.splice(0, 1);
    const maxOffset = Math.min(ordered.length, 2);
    const targetIndex = stableHash(`${seed}:correct-slot`) % maxOffset;
    ordered.splice(targetIndex + 1, 0, correct);
  }
  return ordered;
}

function iconDelta(value) {
  if (!value) return "0";
  return `${value > 0 ? "+" : ""}${value}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function selectedLabel(scenario, category, value) {
  if (!value) return "Not selected";
  if (["source", "symptom", "grounding", "instruction", "history"].includes(category)) {
    return (getCheck(scenario, category)?.options || []).find(item => item.id === value)?.label || "Not selected";
  }
  const collections = {
    failureMode: scenario.failureModes,
    rootCause: scenario.rootCauses,
    mitigation: scenario.mitigations,
    regression: scenario.regressionOptions
  };
  return (collections[category] || []).find(item => item.id === value)?.label || "Not selected";
}

function compareRow(label, yourChoice, bestChoice, isMatch) {
  return `<div class="compare-row ${isMatch ? "match" : "miss"}"><div><span class="record-label">${label}</span><p>${yourChoice}</p></div><div><span class="record-label">Strongest-practice path</span><p>${bestChoice}</p></div><div class="compare-badge ${isMatch ? "match" : "miss"}">${isMatch ? "Aligned" : "Different"}</div></div>`;
}

function renderComparisonView(state, scenario) {
  const best = buildBestPathSummary(scenario);
  return `<div class="compare-grid">${[
    compareRow("Source of truth", selectedLabel(scenario, "source", state.answers.source), best.source, isCorrectSelection(scenario, "source", state.answers.source)),
    compareRow("Observable symptom", selectedLabel(scenario, "symptom", state.answers.symptom), best.symptom, isCorrectSelection(scenario, "symptom", state.answers.symptom)),
    compareRow("Grounding diagnosis", selectedLabel(scenario, "grounding", state.answers.grounding), best.grounding, isCorrectSelection(scenario, "grounding", state.answers.grounding)),
    compareRow("Primary failure mode", selectedLabel(scenario, "failureMode", state.failureMode), best.failureMode, isCorrectSelection(scenario, "failureMode", state.failureMode)),
    compareRow("Likely root cause", selectedLabel(scenario, "rootCause", state.rootCause), best.rootCause, isCorrectSelection(scenario, "rootCause", state.rootCause)),
    compareRow("Smallest credible mitigation", selectedLabel(scenario, "mitigation", state.mitigation), best.mitigation, isCorrectSelection(scenario, "mitigation", state.mitigation)),
    compareRow("Regression check", state.customRegression.trim() || selectedLabel(scenario, "regression", state.regressionChoice), state.customRegression.trim() ? "Custom wording used" : best.regression, state.customRegression.trim() ? true : isCorrectSelection(scenario, "regression", state.regressionChoice))
  ].join("")}</div>`;
}

function currentCoachPrompt(state, scenario, metrics) {
  const topRisk = metrics.risks[0];
  if (state.activeStep === "evidence") return topRisk || `Confirm which source outranks the others in ${scenario.shortTitle.toLowerCase()}.`;
  if (state.activeStep === "checks") return topRisk || "Use the first five checks to narrow, not widen, the diagnosis.";
  if (state.activeStep === "failure") return topRisk || "Prefer the most evidence-fitting failure mode over the broadest label.";
  if (state.activeStep === "mitigation") return topRisk || "The best first repair should be focused, testable, and reversible.";
  if (state.activeStep === "regression") return topRisk || "A good regression check should be concrete enough for another reviewer to run.";
  if (state.activeStep === "summary") return "Export the triage record, compare your path, and decide what you would preserve in operations.";
  return "Start from the visible symptom, not a guess about model internals.";
}

function currentFocusTag(state) {
  return ({
    launch: "Orient",
    evidence: "Anchor source of truth",
    checks: "Tighten diagnosis",
    failure: "Name the primary failure",
    mitigation: "Choose the smallest credible repair",
    regression: "Preserve the lesson",
    summary: "Review and export"
  })[state.activeStep] || "Triage focus";
}

function readinessText(state) {
  if (canAdvance(state)) {
    if (state.activeStep === "regression") return "Ready to complete the mission";
    if (state.activeStep === "summary") return "Mission complete";
    return "Ready for the next step";
  }
  return "More evidence or decisions needed";
}

function scenarioHistory(state, scenarioId) {
  return (state.history || []).filter(item => item.scenarioId === scenarioId).slice(0, 8);
}

function averageScore(entries) {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((sum, item) => sum + (item.compositeScore || 0), 0) / entries.length);
}

function trendDelta(entries) {
  if (entries.length < 2) return 0;
  return (entries[0].compositeScore || 0) - (entries[1].compositeScore || 0);
}

function renderHistorySparkline(entries) {
  if (!entries.length) return `<div class="history-sparkline empty"><span>No runs yet</span></div>`;
  const max = Math.max(...entries.map(item => item.compositeScore || 0), 1);
  return `<div class="history-sparkline" aria-hidden="true">${entries.slice(0, 6).reverse().map(item => `<span style="height:${Math.max(18, Math.round(((item.compositeScore || 0) / max) * 100))}%" title="${item.compositeScore || 0}"></span>`).join("")}</div>`;
}

function renderReplayAnalytics(state, scenario, metrics, compact = false) {
  const entries = scenarioHistory(state, scenario.id);
  const best = entries.length ? Math.max(...entries.map(item => item.compositeScore || 0)) : metrics.compositeScore;
  const avg = entries.length ? averageScore(entries) : metrics.compositeScore;
  const trend = trendDelta(entries);
  return `<div class="replay-analytics ${compact ? "compact" : ""}"><div class="panel-title-row"><div><p class="workspace-step">Replay analytics</p><h3>${compact ? "Learning trend" : "Recent mission trend"}</h3></div><span class="pill">${entries.length ? `${entries.length} prior run${entries.length === 1 ? "" : "s"}` : "First measured run"}</span></div><div class="replay-analytics-grid"><div class="mini-kpi-card"><span class="record-label">Best</span><strong>${best}</strong><p class="subtle-text">Highest composite score on this scenario</p></div><div class="mini-kpi-card"><span class="record-label">Average</span><strong>${avg}</strong><p class="subtle-text">Average score across saved attempts</p></div><div class="mini-kpi-card"><span class="record-label">Trend</span><strong>${entries.length > 1 ? iconDelta(trend) : "New"}</strong><p class="subtle-text">Change versus the previous attempt</p></div></div>${renderHistorySparkline(entries)}${entries.length ? `<div class="history-list">${entries.slice(0, 3).map(item => `<div class="history-item"><div class="metric-row"><strong>${item.compositeScore}/100</strong><span class="history-time">${item.playedAt}</span></div><p class="subtle-text">${item.tier}</p></div>`).join("")}</div>` : `<p class="subtle-text">Complete this mission again or switch to a harder scenario to build a real learning trend.</p>`}</div>`;
}

function renderMissionStats(state, scenario, metrics) {
  const completedSteps = CORE_STEPS.filter(step => stepStatus(step.id, state) === "complete").length;
  const entries = scenarioHistory(state, scenario.id);
  const trend = trendDelta(entries);
  return `<div class="hero-kpi-row"><div class="hero-kpi-card score"><span class="record-label">Mission score</span><strong>${metrics.compositeScore}<small>/100</small></strong><p class="subtle-text">${metrics.tier}</p></div><div class="hero-kpi-card"><span class="record-label">Scenario</span><strong>${scenario.shortTitle}</strong><p class="subtle-text">${scenario.estimatedTime}</p></div><div class="hero-kpi-card"><span class="record-label">Progress</span><strong>${completedSteps}/${CORE_STEPS.length - 1}</strong><p class="subtle-text">Core steps completed</p></div><div class="hero-kpi-card"><span class="record-label">Replay trend</span><strong>${entries.length > 1 ? iconDelta(trend) : "New"}</strong><p class="subtle-text">${entries.length ? `${entries.length} saved run${entries.length === 1 ? "" : "s"}` : "No history yet"}</p></div></div>`;
}

function metricDeltaFor(key, impact) {
  return impact?.categoryDeltas?.find(item => item.key === key)?.delta || 0;
}

function shortMetricLabel(key) {
  return key.replace("Evidence Discipline", "Evidence").replace("Failure-Mode Fit", "Mode fit").replace("Mitigation Restraint", "Mitigation").replace("Regression Thinking", "Regression");
}

function renderDockMetric(metric, impact) {
  const delta = metricDeltaFor(metric.key, impact);
  return `<div class="dock-metric ${delta ? "changed" : ""} ${delta > 0 ? "impact-positive" : delta < 0 ? "impact-negative" : "impact-neutral"}"><div class="metric-row"><span class="record-label">${shortMetricLabel(metric.key)}</span><span class="delta-pill ${delta > 0 ? "good" : delta < 0 ? "bad" : "neutral"}">${iconDelta(delta)}</span></div>${metricBar(metric.score)}<div class="metric-row"><strong>${metric.score}</strong><span class="subtle-text">/100</span></div></div>`;
}

function stepMeta(stepId) {
  return {
    launch: {
      objective: "Understand the workplace stakes before you diagnose.",
      evidenceFocus: "Read the scenario brief, visible symptom, and what success means in this mission.",
      strongChoice: "A strong start keeps you anchored to what failed for the user, not to abstract model theories."
    },
    evidence: {
      objective: "Choose the one source that should have governed the answer first.",
      evidenceFocus: "Prioritize authority, freshness, and explicit policy language over helpful tone or nearby context.",
      strongChoice: "A strong choice names the governing rule source before any diagnosis or repair."
    },
    checks: {
      objective: "Use the first five checks to narrow the diagnosis with visible evidence.",
      evidenceFocus: "Look for the symptom, grounding status, instruction pressure, and history or nearby context effects.",
      strongChoice: "A strong choice is narrow, evidence-based, and specific enough to rule weaker explanations out."
    },
    failure: {
      objective: "Name the primary failure mode and the most plausible root cause.",
      evidenceFocus: "Prefer the label that best matches the user-facing failure and the strongest visible clues.",
      strongChoice: "A strong diagnosis is specific, defensible, and smaller than a general 'the model was bad' claim."
    },
    mitigation: {
      objective: "Select the smallest credible mitigation before considering larger redesigns.",
      evidenceFocus: "Target the failure with the smallest testable repair you could validate on the next run.",
      strongChoice: "A strong mitigation is focused, reversible, and directly connected to the diagnosis."
    },
    regression: {
      objective: "Preserve the lesson with a reusable guard.",
      evidenceFocus: "Write or choose a check that another reviewer could run consistently later.",
      strongChoice: "A strong regression check is concrete, specific, and operationally reusable."
    },
    summary: {
      objective: "Review what failed, what governed, and what you would preserve in operations.",
      evidenceFocus: "Compare your path against strongest practice and extract one lesson worth carrying forward.",
      strongChoice: "A strong debrief is honest about what mattered most and what should change next time."
    }
  }[stepId] || {
    objective: "Continue the Chapter 4 mission.",
    evidenceFocus: "Use the visible materials rather than intuition.",
    strongChoice: "A strong choice is specific and evidence-based."
  };
}

function relevantEvidenceIds(state, scenario) {
  const map = {
    launch: scenario.requiredEvidence,
    evidence: [scenario.checks.find(item => item.id === "source")?.options.find(item => item.id === state.answers.source)?.id || "", ...scenario.requiredEvidence],
    checks: scenario.requiredEvidence,
    failure: scenario.requiredEvidence,
    mitigation: scenario.requiredEvidence,
    regression: scenario.requiredEvidence,
    summary: scenario.requiredEvidence
  };
  const ids = new Set((map[state.activeStep] || []).filter(Boolean));
  if (state.answers.source) ids.add(state.answers.source.replace("source_", ""));
  if (state.activeStep === "mitigation" || state.activeStep === "summary") ids.add("broken-output");
  if (state.activeStep === "summary") ids.add(scenario.requiredEvidence[0]);
  return ids;
}

function evidenceLinkMatch(card, state, scenario) {
  const highlight = relevantEvidenceIds(state, scenario);
  if (highlight.has(card.id)) return true;
  if (state.activeStep === "evidence" && card.type === "source-of-truth") return true;
  if (state.activeStep === "checks" && ["source-of-truth", "output", "instruction", "context clue"].includes(card.type)) return true;
  return false;
}

function renderEvidencePanel(state, scenario) {
  const linkSet = relevantEvidenceIds(state, scenario);
  return `<aside class="panel"><div class="panel-title-row"><div><p class="workspace-step">Evidence panel</p><h2>What should have governed this answer?</h2></div><span class="pill">${scenario.evidenceCards.length} cards</span></div><p class="subtle-text">Use the evidence cards below to anchor the diagnosis. Cards highlighted in blue are especially relevant to the current step.</p><div class="card-stack">${scenario.evidenceCards.map(card => {
    const reviewed = state.reviewedEvidence.includes(card.id);
    const linked = evidenceLinkMatch(card, state, scenario) || linkSet.has(card.id);
    return `<article class="evidence-card ${card.tone === "authoritative" ? "authoritative" : "warning"} ${reviewed ? "is-reviewed" : ""} ${linked ? "is-linked" : ""}"><div class="evidence-card-head"><div><div class="badge-row"><span class="badge ${card.type === "source-of-truth" ? "trust" : card.tone === "authoritative" ? "good" : "warn"}">${card.type}</span>${linked ? `<span class="mini-status strong">Linked to this step</span>` : ""}</div><h3>${card.title}</h3></div><button class="secondary-btn touch-btn" type="button" data-action="toggle-evidence" data-value="${card.id}">${reviewed ? "Marked reviewed" : "Mark reviewed"}</button></div><div class="evidence-mini-grid"><div class="mini-kpi-card"><span class="record-label">Authority</span><strong>${card.authority}</strong></div><div class="mini-kpi-card"><span class="record-label">Trust</span><strong>${card.trust}</strong></div><div class="mini-kpi-card"><span class="record-label">Freshness</span><strong>${card.freshness}</strong></div></div><p>${card.content}</p></article>`;
  }).join("")}</div></aside>`;
}

function optionButton(option, selected, action, value, uiMode = "guided") {
  return `<button class="option-card touch-card ${selected ? "selected" : ""}" type="button" data-action="${action}" data-value="${value}"><strong>${option.label}</strong>${uiMode === "guided" && option.rationale ? `<p class="subtle-text">${option.rationale}</p>` : ""}</button>`;
}

function selectedOptionFor(category, state, scenario) {
  if (["source", "symptom", "grounding", "instruction", "history"].includes(category)) {
    return (getCheck(scenario, category)?.options || []).find(item => item.id === state.answers[category]) || null;
  }
  if (category === "failureMode") return scenario.failureModes.find(item => item.id === state.failureMode) || null;
  if (category === "rootCause") return scenario.rootCauses.find(item => item.id === state.rootCause) || null;
  if (category === "mitigation") return scenario.mitigations.find(item => item.id === state.mitigation) || null;
  if (category === "regression") return scenario.regressionOptions.find(item => item.id === state.regressionChoice) || null;
  return null;
}

function collectionFor(category, scenario) {
  if (["source", "symptom", "grounding", "instruction", "history"].includes(category)) return getCheck(scenario, category)?.options || [];
  return ({
    failureMode: scenario.failureModes,
    rootCause: scenario.rootCauses,
    mitigation: scenario.mitigations,
    regression: scenario.regressionOptions
  })[category] || [];
}

function renderTeachBack(category, state, scenario, uiMode = "guided") {
  if (uiMode !== "guided") return "";
  const selected = selectedOptionFor(category, state, scenario);
  if (!selected) return "";
  const alternatives = collectionFor(category, scenario).filter(item => item.id !== selected.id);
  return `<div class="teachback-card ${selected.isCorrect ? "good" : "warn"}"><div class="panel-title-row"><div><p class="workspace-step">Teach-back feedback</p><h3>${selected.isCorrect ? "Why this works" : "Why this is weaker"}</h3></div><span class="mini-status ${selected.isCorrect ? "strong" : "weak"}">${selected.isCorrect ? "Evidence fit" : "Recheck"}</span></div><p>${selected.rationale || "This choice changes the diagnostic path."}</p>${alternatives.length ? `<div class="teachback-grid"><div><span class="record-label">Why the other options were weaker</span><ul class="standard-list compact">${alternatives.map(item => `<li><strong>${item.label}:</strong> ${item.rationale || "This option fits the evidence less well."}</li>`).join("")}</ul></div></div>` : ""}</div>`;
}

function renderStepHeader(state, scenario) {
  const meta = stepMeta(state.activeStep);
  return `<div class="workspace-header interactive-header"><div><p class="workspace-step">${currentFocusTag(state)}</p><h2>${readinessText(state)}</h2><p class="subtle-text">${meta.objective}</p></div><div class="step-objective-stack"><div class="mini-kpi-card compact"><span class="record-label">Evidence to favor</span><p>${meta.evidenceFocus}</p></div><div class="mini-kpi-card compact"><span class="record-label">Strong choice looks like</span><p>${meta.strongChoice}</p></div></div></div>`;
}

function renderGuidedModeToggle(state) {
  return `<div class="mode-toggle" role="group" aria-label="Learning mode"><button class="scenario-chip mode-chip ${state.uiMode !== "professional" ? "selected" : ""}" type="button" data-action="set-ui-mode" data-value="guided">Guided mode</button><button class="scenario-chip mode-chip ${state.uiMode === "professional" ? "selected" : ""}" type="button" data-action="set-ui-mode" data-value="professional">Professional mode</button></div>`;
}

function renderImpactBridge(state, metrics, impact) {
  const changed = (impact?.categoryDeltas || []).filter(item => item.delta).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 2);
  if (!changed.length) {
    return `<div class="impact-bridge neutral"><span class="record-label">Live impact</span><p>Make or change a selection to see score movement and coaching updates in real time.</p></div>`;
  }
  return `<div class="impact-bridge ${impact.compositeDelta >= 0 ? "good" : "warn"}"><span class="record-label">Live impact</span><p>${impact.compositeDelta >= 0 ? "Your last change strengthened" : "Your last change weakened"} ${changed.map(item => `${shortMetricLabel(item.key)} (${iconDelta(item.delta)})`).join(" and ")}.</p></div>`;
}

function renderCheckSection(check, state, scenario, ui) {
  const ordered = orderedChoices(check.options, `${scenario.id}:${check.id}`);
  const selected = state.answers[check.id];
  return `<section class="step-section linked-section"><div class="step-section-head"><div><span class="record-label">${check.id === "source" ? "Anchor" : "Check"}</span><h3>${check.prompt}</h3></div>${state.uiMode !== "professional" ? `<button class="ghost-btn touch-btn" type="button" data-action="open-modal" data-value="coach">Need coaching</button>` : ""}</div><p class="subtle-text">${check.help}</p><div class="option-grid touch-grid">${ordered.map(option => optionButton(option, option.id === selected, "select-answer", `${check.id}::${option.id}`, state.uiMode)).join("")}</div>${renderTeachBack(check.id, state, scenario, state.uiMode)}${renderImpactBridge(state, ui.metrics, ui.impact)}</section>`;
}

function renderFailureSection(state, scenario, ui) {
  const modes = orderedChoices(scenario.failureModes, `${scenario.id}:failureModes`);
  const roots = orderedChoices(scenario.rootCauses, `${scenario.id}:rootCauses`);
  return `<section class="step-section linked-section"><div class="step-section-head"><div><span class="record-label">Failure mode</span><h3>Which primary failure mode best fits the evidence?</h3></div></div><div class="option-grid touch-grid">${modes.map(option => optionButton(option, option.id === state.failureMode, "select-failure", option.id, state.uiMode)).join("")}</div>${renderTeachBack("failureMode", state, scenario, state.uiMode)}</section><section class="step-section linked-section"><div class="step-section-head"><div><span class="record-label">Root cause</span><h3>What most plausibly caused the failure?</h3></div></div><div class="option-grid touch-grid">${roots.map(option => optionButton(option, option.id === state.rootCause, "select-root", option.id, state.uiMode)).join("")}</div>${renderTeachBack("rootCause", state, scenario, state.uiMode)}${renderImpactBridge(state, ui.metrics, ui.impact)}</section>`;
}

function renderMitigationSection(state, scenario, ui) {
  const mitigations = orderedChoices(scenario.mitigations, `${scenario.id}:mitigations`);
  const analysis = ui.metrics.pastedAnalysis;
  return `<section class="step-section linked-section"><div class="step-section-head"><div><span class="record-label">Smallest credible mitigation</span><h3>What is the smallest credible next repair?</h3></div></div><div class="option-grid touch-grid">${mitigations.map(option => optionButton(option, option.id === state.mitigation, "select-mitigation", option.id, state.uiMode)).join("")}</div>${renderTeachBack("mitigation", state, scenario, state.uiMode)}</section><section class="paste-analysis ${analysis ? (analysis.strong ? "good" : "warn") : ""}"><div class="step-section-head"><div><span class="record-label">External validation</span><h3>${scenario.externalValidation.title}</h3></div><button class="secondary-btn touch-btn" type="button" data-action="copy-packet">Copy validation packet</button></div><p class="subtle-text">${scenario.externalValidation.instructions}</p><textarea class="large-textarea" data-input="pastedOutput" placeholder="Paste the returned LLM answer here to inspect whether the mitigation worked.">${escapeHtml(state.pastedOutput || "")}</textarea>${analysis ? `<p>${analysis.summary}</p>` : `<p class="subtle-text">After the external test, paste the answer back here. The console will look for stronger control signals.</p>`}${renderImpactBridge(state, ui.metrics, ui.impact)}</section>`;
}

function renderRegressionSection(state, scenario, ui) {
  const options = orderedChoices(scenario.regressionOptions, `${scenario.id}:regression`);
  return `<section class="step-section linked-section"><div class="step-section-head"><div><span class="record-label">Regression guard</span><h3>What standing check would make this easier to catch next time?</h3></div></div><div class="option-grid touch-grid">${options.map(option => optionButton(option, option.id === state.regressionChoice, "select-regression", option.id, state.uiMode)).join("")}</div>${renderTeachBack("regression", state, scenario, state.uiMode)}<div class="note-card"><label class="field-label" for="custom-regression">Or write a more specific custom check</label><textarea id="custom-regression" class="large-textarea" data-input="customRegression" placeholder="Example: Require the answer to cite Section 4.2 or explicitly route to Finance Operations when the policy does not support a direct yes/no.">${escapeHtml(state.customRegression || "")}</textarea></div><div class="note-card"><label class="field-label" for="triage-notes">Reflection notes</label><textarea id="triage-notes" class="large-textarea" data-input="notes" placeholder="What clue mattered most? Why did the chosen mitigation stay appropriately small?">${escapeHtml(state.notes || "")}</textarea><div class="mission-actions"><button class="ghost-btn touch-btn" type="button" data-action="clear-notes">Clear notes</button></div></div>${renderImpactBridge(state, ui.metrics, ui.impact)}</section>`;
}

function renderScenarioDebrief(state, scenario, metrics) {
  return `<section class="step-section scenario-debrief"><div class="step-section-head"><div><span class="record-label">Scenario debrief</span><h3>What this case was designed to teach</h3></div><span class="pill">Retention layer</span></div><div class="micro-summary-grid"><div class="mini-kpi-card"><span class="record-label">Failure pattern</span><p>${scenario.observedSymptom}</p></div><div class="mini-kpi-card"><span class="record-label">What should have governed</span><p>${buildBestPathSummary(scenario).source}</p></div><div class="mini-kpi-card"><span class="record-label">Why the best mitigation stayed small</span><p>${scenario.mitigations.find(item => item.isCorrect)?.rationale || "It directly targets the diagnosed failure without broad redesign."}</p></div><div class="mini-kpi-card"><span class="record-label">Operational lesson</span><p>${scenario.strongestPracticePath.summary}</p></div></div><ul class="standard-list"><li><strong>Primary takeaway:</strong> ${strongestImprovement(metrics)}</li><li><strong>What to watch next time:</strong> ${metrics.risks[0] || "No major active risk cues remain in the current path."}</li><li><strong>Replay prompt:</strong> On your next run, try to spot the governing source before you read the polished answer too charitably.</li></ul></section>`;
}

function renderSummary(state, scenario, metrics, ui) {
  return `<div class="summary-card">${renderScenarioDebrief(state, scenario, metrics)}<div class="step-section"><div class="panel-title-row"><div><p class="workspace-step">Mission summary</p><h3>Compare your path against strongest practice</h3></div><button class="secondary-btn touch-btn" type="button" data-action="open-modal" data-value="impact">Open detailed impact</button></div>${renderComparisonView(state, scenario)}</div><div class="mission-actions summary-actions"><button class="secondary-btn touch-btn" type="button" data-action="copy-record">Copy triage record</button><button class="primary-btn touch-btn" type="button" data-action="download-record">Download triage record</button><button class="ghost-btn touch-btn" type="button" data-action="toggle-explore">${state.exploreOpen ? "Hide" : "Explore"} optional depth</button><button class="ghost-btn touch-btn" type="button" data-action="replay">Replay mission</button></div>${state.exploreOpen ? `<div class="optional-panel"><h3>${scenario.optionalBranch.title}</h3><p>${scenario.optionalBranch.summary}</p><ul class="standard-list">${scenario.optionalBranch.prompts.map(item => `<li>${item}</li>`).join("")}</ul></div>` : ""}${renderReplayAnalytics(state, scenario, metrics)}</div>`;
}

function renderWorkspace(state, scenario, metrics, ui = {}) {
  if (state.activeStep === "launch") {
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}<section class="step-section"><div class="panel-title-row"><div><p class="workspace-step">Mission brief</p><h3>${scenario.title}</h3></div><span class="pill">${scenario.estimatedTime}</span></div><p>${scenario.learningObjective}</p><div class="hero-card-grid"><div class="mini-kpi-card"><span class="record-label">Stakes</span><p>${scenario.stakes}</p></div><div class="mini-kpi-card"><span class="record-label">Scenario brief</span><p>${scenario.scenarioBrief}</p></div><div class="mini-kpi-card"><span class="record-label">Observed symptom</span><p>${scenario.observedSymptom}</p></div><div class="mini-kpi-card"><span class="record-label">Mission rule</span><p>Diagnose before editing. Choose one small fix. Preserve the lesson with a reusable regression check.</p></div></div>${renderImpactBridge(state, metrics, ui.impact)}</section></div>`;
  }
  if (state.activeStep === "evidence") {
    const sourceCheck = getCheck(scenario, "source");
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${renderCheckSection(sourceCheck, state, scenario, { metrics, impact: ui.impact })}</div>`;
  }
  if (state.activeStep === "checks") {
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${["symptom", "grounding", "instruction", "history"].map(id => renderCheckSection(getCheck(scenario, id), state, scenario, { metrics, impact: ui.impact })).join("")}</div>`;
  }
  if (state.activeStep === "failure") {
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${renderFailureSection(state, scenario, { metrics, impact: ui.impact })}</div>`;
  }
  if (state.activeStep === "mitigation") {
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${renderMitigationSection(state, scenario, { metrics, impact: ui.impact })}</div>`;
  }
  if (state.activeStep === "regression") {
    return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${renderRegressionSection(state, scenario, { metrics, impact: ui.impact })}</div>`;
  }
  return `<div class="workspace-card" data-step-anchor="${state.activeStep}" tabindex="-1">${renderStepHeader(state, scenario)}${renderSummary(state, scenario, metrics, ui)}</div>`;
}

function renderBottomDock(state, scenario, metrics, impact) {
  const pathCues = buildPathCues(state, scenario).slice(0, 2);
  const compositeDelta = impact?.compositeDelta || 0;
  const entries = scenarioHistory(state, scenario.id);
  const changed = (impact?.categoryDeltas || []).filter(item => item.delta).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 2);
  const headline = impact ? (compositeDelta > 0 ? `Improved by ${iconDelta(compositeDelta)}.` : compositeDelta < 0 ? `Dropped by ${iconDelta(compositeDelta)}.` : "No score change yet.") : "Make one choice to see live impact.";
  return `<aside class="coach-dock" aria-label="Fixed bottom mission coach"><div class="dock-grid"><div class="dock-score-card ${compositeDelta > 0 ? "impact-positive" : compositeDelta < 0 ? "impact-negative" : "impact-neutral"}"><div class="score-orb"><strong>${metrics.compositeScore}</strong><span>/100</span></div><div><p class="workspace-step">Live signal</p><h3>${metrics.tier}</h3><p class="subtle-text">${headline}</p><div class="dock-trend-row">${renderHistorySparkline(entries)}<span class="mini-status neutral">${entries.length ? `${entries.length} runs` : "First run"}</span></div></div><span class="delta-badge ${compositeDelta > 0 ? "good" : compositeDelta < 0 ? "bad" : "neutral"}">${impact ? iconDelta(compositeDelta) : "--"}</span></div><div class="dock-impact-card"><div class="dock-card-head"><div><p class="workspace-step">Impact map</p><h3>Live scores</h3></div><button class="secondary-btn touch-btn" type="button" data-action="open-modal" data-value="impact">Details</button></div><div class="dock-metric-grid">${metrics.categories.slice(0, 4).map(item => renderDockMetric(item, impact)).join("")}</div><div class="impact-chip-row">${changed.length ? changed.map(item => `<span class="delta-pill ${item.delta > 0 ? "good" : "bad"}">${shortMetricLabel(item.key)} ${iconDelta(item.delta)}</span>`).join("") : `<span class="mini-status neutral">Waiting for a scored change</span>`}</div></div><div class="dock-coach-card"><div class="dock-card-head"><div><p class="workspace-step">Coach</p><h3>Next move</h3></div><div class="dock-button-row"><button class="secondary-btn touch-btn" type="button" data-action="open-modal" data-value="coach">Open</button>${state.uiMode === "professional" ? "" : `<button class="ghost-btn touch-btn" type="button" data-action="open-modal" data-value="playbook">Playbook</button>`}</div></div><p class="dock-coach-copy">${currentCoachPrompt(state, scenario, metrics)}</p><div class="tag-row">${metrics.risks.length ? metrics.risks.slice(0, 1).map(item => `<span class="risk-pill">${item}</span>`).join("") : `<span class="safe-pill">Stable</span>`}${pathCues.map(item => `<span class="mini-status ${item.status}">${item.label}</span>`).join("")}</div></div></div></aside>`;
}

function renderModal(state, scenario, metrics, impact) {
  if (!state.activeModal) return "";
  let title = "";
  let body = "";
  if (state.activeModal === "coach") {
    title = "Coaching and step guidance";
    body = `<div class="modal-section"><h3>What the app is telling you now</h3><p>${currentCoachPrompt(state, scenario, metrics)}</p></div><div class="modal-section"><h3>Next best improvement</h3><p>${strongestImprovement(metrics)}</p></div><div class="modal-section"><h3>Current mission focus</h3><p>${currentFocusTag(state)}</p><ul class="standard-list">${buildPathCues(state, scenario).map(item => `<li>${item.label}: <strong>${item.status === "strong" ? "strong" : item.status === "weak" ? "needs correction" : "not started"}</strong></li>`).join("")}</ul></div>`;
  }
  if (state.activeModal === "impact") {
    title = "Live impact and strongest-practice comparison";
    body = `<div class="modal-section"><h3>Composite score</h3><p><strong>${metrics.compositeScore}/100</strong> — ${metrics.tier}</p>${impact ? `<p class="subtle-text">Last change: ${iconDelta(impact.compositeDelta)} composite points.</p>` : ""}</div><div class="modal-section"><h3>Score breakdown</h3><div class="modal-metric-stack">${metrics.categories.map(item => `<div class="metric-tile"><div class="metric-row"><strong>${item.key}</strong><span>${item.score}</span></div>${metricBar(item.score)}<p class="subtle-text">${item.meaning}</p></div>`).join("")}</div></div><div class="modal-section">${renderReplayAnalytics(state, scenario, metrics, true)}</div><div class="modal-section"><h3>Compare your path against strongest practice</h3>${renderComparisonView(state, scenario)}</div>`;
  }
  if (state.activeModal === "playbook") {
    title = "Playbook lens";
    body = `<div class="modal-section"><h3>Strongest-practice path</h3><p>${scenario.strongestPracticePath.summary}</p></div><div class="modal-section"><h3>Why the weaker paths lose</h3><ul class="standard-list">${scenario.strongestPracticePath.whyNotOthers.map(item => `<li>${item}</li>`).join("")}</ul></div><div class="modal-section"><h3>Optional branch</h3><p>${scenario.optionalBranch.summary}</p></div>`;
  }
  return `<div class="modal-overlay" data-modal-overlay="true"><div class="modal-shell panel" data-modal-shell="true" role="dialog" aria-modal="true" aria-labelledby="rtc-modal-title"><div class="panel-title-row modal-title-row"><div><p class="workspace-step">Popup insight</p><h2 id="rtc-modal-title">${title}</h2></div><div class="modal-actions"><button class="icon-btn" type="button" aria-label="Close popup" data-modal-close="true">×</button><button class="secondary-btn" type="button" data-modal-close="true">Close</button></div></div>${body}<div class="modal-footer"><button class="ghost-btn" type="button" data-modal-close="true">Return to mission</button></div></div></div>`;
}

export function renderApp(root, state, scenarioPack, ui = {}) {
  const scenario = scenarioPack.cases.find(item => item.id === state.scenarioId) || scenarioPack.cases[0];
  const metrics = computeMetrics(state, scenario);
  const impact = ui.impact || null;
  root.innerHTML = `<div class="app-shell modern-coach-layout ${state.uiMode === "professional" ? "professional-mode" : "guided-mode"}"><header class="mission-strip"><div class="mission-head"><div><p class="eyebrow">Chapter 4 • Reliability, Failure Handling, and Measurement</p><h1>Reliability Triage Console</h1><p class="mission-copy">A guided no-code reliability mission for knowledge workers: diagnose before editing, choose the smallest credible mitigation, and preserve the lesson with a regression check.</p></div><div class="header-pills"><span class="pill">Version: ${APP_VERSION}</span><span class="pill">${detectEnvironment()}</span><span class="pill">Coach dock</span><span class="pill">${state.uiMode === "professional" ? "Professional mode" : "Guided mode"}</span></div></div><div class="mission-actions"><button class="secondary-btn" type="button" id="theme-toggle">Toggle theme</button><a class="secondary-btn" href="help.html">Help</a><a class="secondary-btn" href="feedback.html">Feedback</a><button class="ghost-btn" type="button" data-action="hard-reset">Clean start</button></div><div class="scenario-switcher panel-lite"><div><h2>Scenario pack</h2><p class="subtle-text">Switch scenarios without leaving the console. This build now teaches more explicitly in Guided mode and strips down helper layers in Professional mode for faster replay practice.</p></div>${renderGuidedModeToggle(state)}<div class="scenario-chip-row">${stableOrdered(scenarioPack.cases, "scenario-pack").map(item => `<button class="scenario-chip ${item.id === state.scenarioId ? "selected" : ""}" type="button" data-action="select-scenario" data-value="${item.id}">${item.shortTitle}</button>`).join("")}</div></div>${renderMissionStats(state, scenario, metrics)}<div class="progress-shell"><div class="progress-header"><div><h2>Mission progress</h2><p class="subtle-text">Core completion stays separate from optional exploration. The workspace is intentionally simpler, while the bottom coach dock keeps the live impact visible at all times.</p></div><span class="pill">${state.activeStep === "summary" ? "Core complete" : "Core in progress"}</span></div><div class="progress-rail compact">${CORE_STEPS.map(step => { const status = stepStatus(step.id, state); return `<div class="step-chip ${status === "active" ? "is-active" : status === "complete" ? "is-complete" : ""}"><small>${status === "complete" ? "Complete" : status === "active" ? "Current" : "Upcoming"}</small><strong>${step.label}</strong></div>`; }).join("")}</div></div></header><main class="triage-main"><div class="main-grid"><div class="main-column">${renderEvidencePanel(state, scenario)}</div><div class="main-column workspace-column"><section class="panel workspace-pane">${renderWorkspace(state, scenario, metrics, { impact })}<div class="mission-actions workspace-actions"><button class="ghost-btn touch-btn" type="button" data-action="back" ${state.activeStep === "launch" ? "disabled" : ""}>Back</button><button class="ghost-btn touch-btn" type="button" data-action="reset-step">Reset this step</button>${state.activeStep === "regression" ? `<button id="continue-to-summary-btn" class="primary-btn touch-btn" type="button" data-action="advance-summary" ${canAdvance(state) ? "" : "disabled"}>Go to summary now</button>` : `<button class="primary-btn touch-btn" type="button" data-action="advance" ${canAdvance(state) ? "" : "disabled"}>${state.activeStep === "launch" ? "Start mission" : "Continue"}</button>`}</div></section></div></div></main>${renderBottomDock(state, scenario, metrics, impact)}${renderModal(state, scenario, metrics, impact)}</div>`;
}
