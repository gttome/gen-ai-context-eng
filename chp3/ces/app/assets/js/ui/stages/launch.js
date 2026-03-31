import { escapeHtml, inlineBadges, list } from "../components.js";

function scenarioCard(card, activeScenarioId, hasResume){
  return `<article class="scenario-card"><header><div><h3>${escapeHtml(card.title)}</h3><p class="muted">${escapeHtml(card.chapterConcept)}</p></div>${inlineBadges([card.timing,card.difficulty, ...(card.missionTags || []).slice(0, 2)])}</header><p class="small muted">Fast shaping practice with copy-run-paste review, counterfactual comparison, and stronger coaching during build.</p><div class="card-actions"><button class="primary-btn" data-action="start-scenario" data-scenario="${escapeHtml(card.id)}">Start new run</button>${hasResume&&activeScenarioId===card.id?`<button class="secondary-btn" data-action="resume-run">Resume current run</button>`:''}</div></article>`;
}

function missionDirectorPanel(derived) {
  const director = derived.missionDirector;
  return `<div class="callout cue mission-launch-panel"><p class="coach-eyebrow">Adaptive Mission Director</p><h2>${escapeHtml(director.nextMission?.title || "Start your first mission")}</h2><p class="muted">${escapeHtml(director.summary)}</p>${inlineBadges(director.badges || [])}<div class="two-col compact-two-col"><div><h3>Focus next</h3><p class="small muted"><strong>${escapeHtml(director.weakestSkill?.label || "Section separation")}</strong> — average ${director.weakestSkill?.average ?? 0}</p><p class="small muted">${escapeHtml(director.nextMission?.instruction || "Complete one run to unlock a recommendation.")}</p></div><div><h3>Local mastery snapshot</h3>${list((director.skillRows || []).filter((row) => row.attempts).slice(0, 3).map((row) => `${row.label}: ${row.average}`), "check-list")}</div></div><div class="card-actions">${director.recommendedScenarioId ? `<button class="primary-btn" data-action="start-scenario" data-scenario="${escapeHtml(director.recommendedScenarioId)}">${escapeHtml(director.nextMission?.cta || "Start recommended mission")}</button>` : ""}</div></div>`;
}

export function renderLaunch(state, derived){
  const order=(state.scenarioIndex?.scenarios||[]).map((item)=>item.id);
  const byId=state.scenarios||{};
  const cards=(order.length ? order.map((id)=>byId[id] || state.scenarioIndex.scenarios.find((item)=>item.id===id)).filter(Boolean) : Object.values(byId));
  const hasResume=!!state.run?.scenarioId&&state.run?.currentStage!=="launch";
  return `<section class="stage-panel active" id="panel-launch">${missionDirectorPanel(derived)}<div class="scenario-grid">${cards.map((card)=>scenarioCard(card,state.run?.scenarioId,hasResume)).join("")}</div></section>`;
}
