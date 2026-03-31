import { metricGrid } from "./charts.js";
import { escapeHtml, inlineBadges, list, blockTypeBadge, trustBadge, freshnessBadge } from "./components.js";
import { buildBlockCoach, buildReadinessChecklist, buildSectionCoach, getSelectedBlock, renderCoachStatusPill, SECTION_PURPOSES } from "./coaching.js";

export const STAGES = ["launch", "brief", "studio", "copy", "review", "summary", "explore"];
export const SECTION_OPTIONS = ["ROLE", "RULES", "REFERENCE", "DYNAMIC FACTS", "TASK", "OUTPUT", "CHECKS"];

export function stageLabel(stage) {
  return ({
    launch: "1. Launch",
    brief: "2. Mission Brief",
    studio: "3. Envelope Studio",
    copy: "4. Copy & Run",
    review: "5. Return & Review",
    summary: "6. Run Summary",
    explore: "7. Explore More"
  })[stage] || stage;
}

export function selectedScenario(state) {
  return state.scenarios?.[state.run?.scenarioId] || null;
}

function renderGuidanceButton(guidance, className = "primary-btn") {
  if (!guidance?.actionType || !guidance?.actionLabel) return "";
  if (guidance.actionType === "set-stage") return `<button class="${className}" data-action="set-stage" data-stage="${escapeHtml(guidance.actionStage)}">${escapeHtml(guidance.actionLabel)}</button>`;
  if (guidance.actionType === "start-scenario") return `<button class="${className}" data-action="start-scenario" data-scenario="${escapeHtml(guidance.actionScenario || guidance.actionScenarioId || guidance.actionScenario || "")}">${escapeHtml(guidance.actionLabel)}</button>`;
  return `<button class="${className}" data-action="${escapeHtml(guidance.actionType)}">${escapeHtml(guidance.actionLabel)}</button>`;
}

export function renderNextCoachStrip(guidance) {
  if (!guidance) return "";
  return `<section class="global-coach-strip"><div><p class="coach-eyebrow">Always know the next move</p><h2>${escapeHtml(guidance.title || "What to do next")}</h2><p class="muted">${escapeHtml(guidance.body || "Keep moving through the studio one stage at a time.")}</p></div><div class="card-actions">${renderGuidanceButton(guidance, "primary-btn")}</div></section>`;
}

export function moveSelect(block, currentSection) {
  return `<select class="inline-select" data-role="move-select" data-block-id="${escapeHtml(block.id)}" aria-label="Move ${escapeHtml(block.label)} to another section">${SECTION_OPTIONS.map((section) => `<option value="${section}" ${section === currentSection ? "selected" : ""}>${section}</option>`).join("")}</select>`;
}

function selectedCoachMarkup(coach) {
  if (!coach) return "";
  const weaker = coach.weakerWhy?.length ? `<ul class="warning-list">${coach.weakerWhy.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return `<div class="card-selected-coaching" tabindex="-1"><p class="small muted"><strong>Selected card coaching</strong></p><p class="small muted"><strong>Strongest section:</strong> ${escapeHtml(coach.strongestSection || "Use section purpose")}</p><p class="small muted">${escapeHtml(coach.preferredWhy)}</p>${weaker}<p class="small muted"><strong>Do next:</strong> ${escapeHtml(coach.nextMove)}</p></div>`;
}

export function blockCard(block, coach, isSelected = false) {
  return `<article class="block-card ${isSelected ? "selected-card" : ""}" draggable="true" data-block-id="${escapeHtml(block.id)}"><div class="card-topline"><strong>${escapeHtml(block.label)}</strong><button class="ghost-btn compact-btn" data-action="select-block" data-block-id="${escapeHtml(block.id)}">Coach this card</button></div><div class="block-meta">${blockTypeBadge(block.type)}${trustBadge(block.trustLevel)}${freshnessBadge(block.freshnessCue)}</div><p class="small muted">${escapeHtml(block.text)}</p><div class="micro-coach"><p><strong>Ask before placing:</strong> ${escapeHtml(coach.question)}</p><p class="small muted">${escapeHtml(coach.preferredWhy || coach.cues[0] || "Use section purpose, trust, and freshness to decide where this card belongs.")}</p>${coach.alternateSections?.length ? `<p class="small muted"><strong>Common temptation:</strong> ${escapeHtml(coach.alternateSections[0].why)}</p>` : ""}</div>${isSelected ? selectedCoachMarkup(coach) : ""}<div class="block-actions"><select class="inline-select" data-role="place-select" data-block-id="${escapeHtml(block.id)}" aria-label="Choose a section for ${escapeHtml(block.label)}"><option value="">Choose a section…</option>${SECTION_OPTIONS.map((section) => `<option value="${section}">${section}</option>`).join("")}</select><button class="secondary-btn" data-action="place-from-tray" data-block-id="${escapeHtml(block.id)}">Place</button></div></article>`;
}

export function placedBlockCard(block, section, coach, isSelected = false) {
  const detail = coach.status.tone === "warn" ? coach.preferredWhy : coach.status.detail;
  return `<article class="block-card placed-card ${isSelected ? "selected-card" : ""}" data-block-id="${escapeHtml(block.id)}"><div class="card-topline"><strong>${escapeHtml(block.label)}</strong><button class="ghost-btn compact-btn" data-action="select-block" data-block-id="${escapeHtml(block.id)}">Coach this card</button></div><div class="block-meta">${blockTypeBadge(block.type)}${trustBadge(block.trustLevel)}${freshnessBadge(block.freshnessCue)}${renderCoachStatusPill(coach.status)}</div><p class="small muted">${escapeHtml(block.text)}</p><p class="small muted"><strong>Why it matters:</strong> ${escapeHtml(detail)}</p>${isSelected ? selectedCoachMarkup(coach) : ""}<div class="mini-actions"><button class="ghost-btn" data-action="move-block" data-section="${section}" data-block-id="${escapeHtml(block.id)}" data-direction="up">Move up</button><button class="ghost-btn" data-action="move-block" data-section="${section}" data-block-id="${escapeHtml(block.id)}" data-direction="down">Move down</button><button class="ghost-btn" data-action="remove-block" data-section="${section}" data-block-id="${escapeHtml(block.id)}">Remove</button></div><div class="move-row">${moveSelect(block, section)}<button class="secondary-btn" data-action="move-block-section" data-block-id="${escapeHtml(block.id)}">Move to section</button></div></article>`;
}

function deltaBadge(delta) {
  const sign = delta > 0 ? "+" : "";
  const tone = delta > 0 ? "delta-positive" : delta < 0 ? "delta-negative" : "delta-neutral";
  return `<span class="delta-pill ${tone}">${sign}${delta}</span>`;
}

export function renderMetricDelta(derived) {
  if (!derived.priorAttempt || !derived.metricDelta?.length) return `<p class="muted small">No prior completed attempt for this scenario yet. Finish a second run to unlock comparison deltas.</p>`;
  return `<div class="delta-grid">${derived.metricDelta.map((item) => `<div class="delta-card"><div class="score-row"><strong>${escapeHtml(item.label)}</strong>${deltaBadge(item.delta)}</div><p class="small muted">Current ${item.current} vs prior ${item.prior}</p></div>`).join("")}</div>`;
}

function missionDirectorCard(missionDirector, buttonClass = "primary-btn") {
  if (!missionDirector) return "";
  const next = missionDirector.nextMission || {};
  const cta = next.scenarioId ? `<button class="${buttonClass}" data-action="start-scenario" data-scenario="${escapeHtml(next.scenarioId)}">${escapeHtml(next.cta || `Start ${next.title || "mission"}`)}</button>` : "";
  return `<div class="meta-card mission-director-card"><p class="coach-eyebrow">Mission Director</p><h3>${escapeHtml(missionDirector.profile)}</h3><p class="muted small">${escapeHtml(missionDirector.summary)}</p>${inlineBadges(missionDirector.badges || [])}<div class="mission-director-grid"><div><p class="small muted"><strong>Weakest recurring skill</strong></p><p>${escapeHtml(missionDirector.weakestSkill?.label || "Section separation")}</p><p class="small muted">Average: ${missionDirector.weakestSkill?.average ?? 0}</p></div><div><p class="small muted"><strong>Strongest recurring skill</strong></p><p>${escapeHtml(missionDirector.strongestSkill?.label || "—")}</p><p class="small muted">Average: ${missionDirector.strongestSkill?.average ?? 0}</p></div></div><p class="small muted"><strong>${escapeHtml(next.title || "Next mission")}</strong> — ${escapeHtml(next.instruction || "Complete a core run to unlock a specific recommendation.")}</p><div class="card-actions">${cta}</div></div>`;
}

export function renderLeftRail(state, scenario, derived) {
  const validation = state.validation?.[scenario?.id || ""];
  const scenarioMeta = scenario
    ? `<div class="meta-card"><h3>${escapeHtml(scenario.title)}</h3><p class="muted">${escapeHtml(scenario.learningObjective)}</p>${inlineBadges([scenario.timing, scenario.difficulty, scenario.chapterConcept])}${scenario.missionTags?.length ? `<p class="small muted"><strong>Training tags:</strong> ${escapeHtml(scenario.missionTags.join(", "))}</p>` : ""}</div>`
    : `<div class="meta-card"><h3>Choose a scenario</h3><p class="muted">Each pack is a compact shaping exercise that turns Chapter 3 ideas into a reviewable context envelope.</p></div>`;
  return `<aside class="panel left-rail"><h2>Mission context</h2>${scenarioMeta}${missionDirectorCard(derived.missionDirector, "secondary-btn")}<div class="meta-list" style="margin-top:1rem"><div class="meta-card"><h3>Why this app exists</h3><p class="muted">Context Envelope Studio teaches how to shape selected material into a legible operating package. Its center of gravity is Shaping, while keeping lifecycle awareness visible.</p></div><div class="meta-card"><h3>Section purpose prompts</h3><ul class="check-list">${Object.entries(SECTION_PURPOSES).slice(0, 4).map(([section, guide]) => `<li><strong>${escapeHtml(section)}:</strong> ${escapeHtml(guide.question)}</li>`).join("")}</ul></div><div class="meta-card"><h3>Recent activity</h3>${state.history?.length ? `<ul class="check-list">${state.history.map((item) => `<li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.readiness)} (${item.score})</li>`).join("")}</ul>` : `<p class="muted small">No completed runs recorded locally yet.</p>`}</div>${derived.priorAttempt ? `<div class="meta-card"><h3>Prior attempt anchor</h3><p class="muted small">Previous score for this scenario: <strong>${derived.priorAttempt.score}</strong> — ${escapeHtml(derived.priorAttempt.readiness)}</p></div>` : ""}${validation && validation.warnings?.length ? `<div class="meta-card"><h3>Scenario validation notes</h3>${list(validation.warnings, "check-list")}</div>` : ""}<div class="meta-card"><h3>Content authoring</h3><p class="muted small">Use the static authoring workspace to validate a scenario draft, clone a starter pack, generate scaffold text, and export JSON without adding any server dependency.</p><p><a href="./authoring.html">Open authoring workspace</a></p></div></div></aside>`;
}

export function renderRightRail(state, scenario, metrics, reviewResult, config, derived) {
  const hasScenario = Boolean(scenario);
  const selected = hasScenario ? getSelectedBlock(scenario, state.run) : null;
  const coach = selected ? buildBlockCoach(scenario, selected, state.run, config) : null;
  const checklist = hasScenario ? buildReadinessChecklist(scenario, state.run, metrics, config) : [];
  const selectedSection = coach?.currentSection || coach?.strongestSection || config.sectionOrder[0];
  const sectionCoach = hasScenario ? buildSectionCoach(scenario, state.run, selectedSection, config) : null;
  return `<aside class="panel right-rail"><h2>Live insights</h2>${hasScenario ? `<div class="score-card"><h3>Current readiness</h3><p><strong>${metrics.composite}</strong> — ${escapeHtml(metrics.readiness)}</p>${metricGrid(metrics.metrics)}</div><div class="insight-card cue-card" style="margin-top:1rem"><h3>Do this next</h3><p class="small muted">${escapeHtml(derived.nextGuidance?.body || metrics.nextBestActions?.[0] || "Keep tightening separation, order, and checks.")}</p><div class="card-actions">${renderGuidanceButton(derived.nextGuidance, "primary-btn")}</div></div>${missionDirectorCard(derived.missionDirector, "secondary-btn")}<div class="insight-card" style="margin-top:1rem" data-role="selected-coach"><h3>Shaping spotlight</h3>${selected && coach ? `<p><strong>${escapeHtml(selected.label)}</strong> ${renderCoachStatusPill(coach.status)}</p><p class="small muted"><strong>Ask:</strong> ${escapeHtml(coach.question)}</p><p class="small muted"><strong>Why the strongest placement wins:</strong> ${escapeHtml(coach.preferredWhy)}</p>${coach.weakerWhy?.length ? list(coach.weakerWhy, "warning-list") : list(coach.cues, "check-list")}<p class="small muted"><strong>Do next:</strong> ${escapeHtml(coach.nextMove)}</p>` : `<p class="small muted">Select a card to see targeted placement coaching.</p>`}</div><div class="insight-card" style="margin-top:1rem"><h3>Section-level coaching</h3>${sectionCoach ? `<p class="small muted"><strong>${escapeHtml(sectionCoach.section)}:</strong> ${escapeHtml(sectionCoach.summary)}</p><p class="small muted"><strong>Why strongest practice is stronger:</strong> ${escapeHtml(sectionCoach.strongerWhy)}</p>${sectionCoach.weakerCards?.length ? list(sectionCoach.weakerCards, "warning-list") : list(sectionCoach.missing.length ? sectionCoach.missing.map((item) => `Missing anchor: ${item}`) : sectionCoach.extras.map((item) => `Extra here: ${item}`), "warning-list")}<p class="small muted"><strong>Next move:</strong> ${escapeHtml(sectionCoach.nextMove)}</p>` : `<p class="small muted">Place a card to unlock section-level coaching.</p>`}</div><div class="insight-card" style="margin-top:1rem"><h3>Copy-run readiness</h3><ul class="check-list">${checklist.map((item) => `<li>${item.passed ? "✅" : "⬜"} ${escapeHtml(item.label)}</li>`).join("")}</ul></div><div class="insight-card" style="margin-top:1rem"><h3>Coaching triggers</h3>${list(metrics.warnings, "warning-list")}</div>${reviewResult?.hasOutput ? `<div class="insight-card" style="margin-top:1rem"><h3>Observed output note</h3><p class="small muted">${escapeHtml(reviewResult.summary)}</p></div>` : ""}` : `<div class="score-card"><h3>What you will practice</h3><ul class="check-list"><li>Section separation</li><li>Ordering and sequence</li><li>Precedence and conflict handling</li><li>Output usability</li><li>Operational reviewability</li></ul></div>${missionDirectorCard(derived.missionDirector, "primary-btn")}`}<div class="insight-card" style="margin-top:1rem"><h3>Glossary snapshot</h3><p class="small muted">Use Help for the full glossary and workflow guide.</p><ul class="check-list">${state.glossary.slice(0, 3).map((item) => `<li><strong>${escapeHtml(item.term)}:</strong> ${escapeHtml(item.definition)}</li>`).join("")}</ul></div></aside>`;
}
