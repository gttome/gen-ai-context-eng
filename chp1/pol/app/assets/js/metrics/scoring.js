(function () {
  const utils = window.POLUtils;
  const cfg = window.POLConfig;
  const composer = window.POLPackageComposer;

  const rubrics = {
    'support-downgrade': {
      sections: ['explanation', 'next steps', 'what we know'],
      grounding: ['policy', '§4.2', '§4.3', 'grace period', '7-day', '30 days', 'downgrade', 'restore payment'],
      dynamic: ['2026-03-11', '2026-03-16', 'standard', 'pro annual', 'ai assist', 'failed payment', 'current plan'],
      continuity: ['confirmed', 'known', 'we know', 'unknown'],
      directAnswer: ['downgraded', 'restore', 'payment'],
      generic: ['may have been', 'usually', 'contact support', 'seems wrong', 'i\'m sorry this happened']
    },
    'hr-carryover': {
      sections: ['answer', 'why', 'escalation needed'],
      grounding: ['policy', 'october 1', 'carry over', 'carryover', 'payout', 'us salaried'],
      dynamic: ['2026-11-12', '2026-12-29', '32 hours', 'after october 1', 'hire date', 'unused balance'],
      continuity: ['confirmed', 'employee facts', 'classification'],
      directAnswer: ['would not carry', 'carry over', 'payout', 'not carry'],
      generic: ['may be able', 'check with hr', 'final determination', 'in the abstract']
    },
    'incident-triage': {
      sections: ['timeline', 'current impact', 'hypotheses', 'next actions', 'owner requests'],
      grounding: ['status update', 'structure', 'confirmed facts'],
      dynamic: ['10:05', 'inc-1842', 'sev-2', 'login', 'current impact', 'remains open'],
      continuity: ['09:14', '09:26', 'confirmed facts', 'open questions', 'actions already taken', 'hypotheses', 'rollback', 'support volume'],
      directAnswer: ['timeline', 'next actions', 'owner requests'],
      generic: ['investigating', 'share more updates soon', 'engineers are working on mitigation']
    },
    'contract-activation': {
      sections: ['answer', 'why', 'what to do next'],
      grounding: ['activation rule', 'signed amendment', 'billing sync complete', 'manual restore', 'platform ops', '24 hours'],
      dynamic: ['2026-03-16', '10:42', 'billing sync pending', 'disabled', 'less than 24 hours', 'admin console'],
      continuity: ['yesterday', 'wait for system confirmation'],
      directAnswer: ['not yet', 'stay disabled', 'wait for billing sync', 'manual-restore exception'],
      generic: ['should be able', 'probably restore', 'verify later']
    }
  };

  function getRubric(mission) { return rubrics[mission.id] || { sections: [], grounding: [], dynamic: [], continuity: [], directAnswer: [], generic: [] }; }
  function plain(text) { return utils.plainText(text || '').toLowerCase(); }
  function wordCount(text) { const cleaned = utils.plainText(text || ''); return cleaned ? cleaned.split(/\s+/).length : 0; }
  function countHits(text, phrases) { return utils.countKeywordHits(text, phrases || []); }
  function matchedPhrases(text, phrases) {
    const lower = plain(text);
    const seen = new Set();
    return (phrases || []).filter(Boolean).filter(phrase => {
      const key = phrase.toLowerCase();
      if (!lower.includes(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function countSectionHits(text, sections) {
    const lower = plain(text); let hits = 0;
    (sections || []).forEach(section => { const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`(^|\\n|\\r|\\s)${escaped}(\\s|:|\\n|\\r)`, 'i'); if (re.test(lower)) hits += 1; });
    return hits;
  }
  function splitSentences(text) { return String(text || '').split(/\n+|(?<=[.!?])\s+/).map(item => utils.plainText(item)).filter(item => item && item.length > 8).slice(0, 8); }
  function genericPenalty(text, rubric) {
    const genericHits = countHits(text, rubric.generic); const wc = wordCount(text); let penalty = genericHits * 8;
    if (wc === 0) penalty += 28; else if (wc < 12) penalty += 18; else if (wc < 28) penalty += 8; return penalty;
  }
  function qualityFloor(text, rubric) {
    const wc = wordCount(text); if (wc === 0) return 0; let score = 25; if (wc >= 20) score += 8; if (wc >= 45) score += 7;
    score += Math.min(18, countSectionHits(text, rubric.sections) * 6); score += Math.min(12, countHits(text, rubric.directAnswer) * 4); score -= genericPenalty(text, rubric);
    return utils.clamp(score, 0, 70);
  }
  function selectionCoverage(ids, selected) { const recCount = Math.max(1, (ids || []).length); return Math.round(((selected || []).length / recCount) * 100); }
  function missionEvidenceSignals(mission, missionState, outputText) {
    const rubric = getRubric(mission);
    return { sections: countSectionHits(outputText, rubric.sections), groundingHits: countHits(outputText, rubric.grounding), continuityHits: countHits(outputText, rubric.continuity), dynamicHits: countHits(outputText, rubric.dynamic), directAnswerHits: countHits(outputText, rubric.directAnswer), rubric };
  }
  function activeRecommendedMechanisms(mission) { const rec = mission.recommendedState || {}; return ['groundingEnabled', 'memoryEnabled', 'dynamicEnabled'].filter(key => Boolean(rec[key])).length; }
  function selectedMechanisms(missionState) { return ['groundingEnabled', 'memoryEnabled', 'dynamicEnabled'].filter(key => Boolean(missionState[key])).length; }
  function dominantLabel(mission) {
    if (mission.dominantMechanism === 'mixed') {
      const labels = []; if (mission.recommendedState.groundingEnabled) labels.push('grounding'); if (mission.recommendedState.memoryEnabled) labels.push('memory'); if (mission.recommendedState.dynamicEnabled) labels.push('dynamic facts'); return labels.join(' + ');
    }
    if (mission.dominantMechanism === 'dynamic') return 'dynamic facts';
    return mission.dominantMechanism;
  }
  function scorePatternFit(mission, missionState, outputText) {
    let score = 16; if (missionState.prediction === mission.dominantMechanism) score += mission.dominantMechanism === 'mixed' ? 28 : 24;
    if (mission.dominantMechanism === 'grounding' && missionState.groundingEnabled) score += 20;
    if (mission.dominantMechanism === 'memory' && missionState.memoryEnabled) score += 20;
    if (mission.dominantMechanism === 'dynamic' && missionState.dynamicEnabled) score += 20;
    if (mission.dominantMechanism === 'mixed') { const active = selectedMechanisms(missionState); if (active >= activeRecommendedMechanisms(mission)) score += 24; else if (active >= 2) score += 14; }
    const rec = mission.recommendedState;
    ['groundingEnabled', 'memoryEnabled', 'dynamicEnabled'].forEach(key => { if (Boolean(missionState[key]) === Boolean(rec[key])) score += 6; });
    const signals = missionEvidenceSignals(mission, missionState, outputText);
    let dominantHits = 0;
    if (mission.dominantMechanism === 'grounding') dominantHits = signals.groundingHits;
    if (mission.dominantMechanism === 'memory') dominantHits = signals.continuityHits;
    if (mission.dominantMechanism === 'dynamic') dominantHits = signals.dynamicHits;
    if (mission.dominantMechanism === 'mixed') dominantHits = Math.min(signals.groundingHits, 3) + Math.min(signals.dynamicHits, 3);
    score += Math.min(14, dominantHits * 4); score += Math.min(6, signals.directAnswerHits * 2); score -= Math.min(18, genericPenalty(outputText, signals.rubric));
    return utils.clamp(score, 0, 100);
  }
  function scoreGrounding(mission, missionState, outputText) {
    const recIds = mission.recommendedState.selectedEvidence || []; let score = missionState.groundingEnabled ? 12 + Math.round(selectionCoverage(recIds, missionState.selectedEvidence) * 0.35) : 4;
    const signals = missionEvidenceSignals(mission, missionState, outputText);
    score += qualityFloor(outputText, signals.rubric) * 0.18; score += Math.min(34, signals.groundingHits * 7 + signals.sections * 3); if (/according to|under .*policy|based on|rule requires|contract rule/i.test(outputText)) score += 8; score -= Math.min(20, genericPenalty(outputText, signals.rubric));
    return utils.clamp(Math.round(score), 0, 100);
  }
  function scoreContinuity(mission, missionState, outputText) {
    const recIds = mission.recommendedState.selectedMemory || []; let score = missionState.memoryEnabled ? 14 + Math.round(selectionCoverage(recIds, missionState.selectedMemory) * 0.35) : 6;
    if (missionState.memoryEnabled && missionState.memoryMode === mission.recommendedState.memoryMode) score += 10;
    const signals = missionEvidenceSignals(mission, missionState, outputText);
    score += qualityFloor(outputText, signals.rubric) * 0.16; score += Math.min(34, signals.continuityHits * 7 + signals.sections * 2); if (/confirmed facts|open questions|already taken|hypotheses|yesterday/i.test(outputText)) score += 8; score -= Math.min(18, genericPenalty(outputText, signals.rubric));
    return utils.clamp(Math.round(score), 0, 100);
  }
  function scoreCurrentState(mission, missionState, outputText) {
    const recIds = mission.recommendedState.selectedFacts || []; let score = missionState.dynamicEnabled ? 14 + Math.round(selectionCoverage(recIds, missionState.selectedFacts) * 0.38) : 6;
    const signals = missionEvidenceSignals(mission, missionState, outputText);
    score += qualityFloor(outputText, signals.rubric) * 0.16; score += Math.min(34, signals.dynamicHits * 7 + signals.sections * 2); if (/today|current|date|status|hire date|failed payment|remains open|billing sync pending|less than 24 hours/i.test(outputText)) score += 8; score -= Math.min(18, genericPenalty(outputText, signals.rubric));
    return utils.clamp(Math.round(score), 0, 100);
  }
  function scoreTokenDiscipline(mission, missionState, outputText) {
    const token = composer.computeTokenUsage(mission, missionState); const budget = missionState.bonusMode && mission.challenge ? mission.challenge.tokenBudget : mission.tokenBudget; const pct = token.total / budget; let score = 100;
    if (pct > 1) score = 28 - Math.round((pct - 1) * 45); else if (pct > 0.92) score = 66; else if (pct > 0.82) score = 80; else if (pct < 0.35) score = 58; else score = 92;
    const wc = wordCount(outputText); if (wc === 0) score -= 16; else if (wc > 220) score -= 10; else if (wc < 18) score -= 12;
    if (!missionState.groundingEnabled && !missionState.memoryEnabled && !missionState.dynamicEnabled) score -= 20; return utils.clamp(score, 0, 100);
  }
  function baselineMetricMap(mission) {
    if (mission.id === 'support-downgrade') return { 'Pattern Fit': 28, 'Grounding': 20, 'Continuity': 26, 'Current-State': 46, 'Token Discipline': 82 };
    if (mission.id === 'hr-carryover') return { 'Pattern Fit': 34, 'Grounding': 62, 'Continuity': 22, 'Current-State': 18, 'Token Discipline': 88 };
    if (mission.id === 'contract-activation') return { 'Pattern Fit': 24, 'Grounding': 28, 'Continuity': 22, 'Current-State': 24, 'Token Discipline': 84 };
    return { 'Pattern Fit': 26, 'Grounding': 18, 'Continuity': 22, 'Current-State': 50, 'Token Discipline': 84 };
  }
  function buildCoaching(mission, metrics, missionState, outputText) {
    const notes = []; const predicted = missionState.prediction || 'none'; const rubric = getRubric(mission); const wc = wordCount(outputText); const dominant = dominantLabel(mission);
    if (predicted !== mission.dominantMechanism) notes.push(`You predicted ${predicted}, but this mission’s dominant need was ${dominant}.`);
    else notes.push(`Good diagnosis: you identified ${dominant} as the main missing mechanism.`);
    if (wc === 0) notes.push('No pasted answer was detected. Paste the external model output, then analyze again.'); else if (wc < 20) notes.push('The pasted answer is extremely short, so the scorer treats it as incomplete rather than strong.');
    if (metrics['Grounding'] < 65) notes.push('The answer still needs stronger evidence use. Name the rule, cite the policy, or refer directly to the evidence you selected.');
    if (metrics['Continuity'] < 65) notes.push('Continuity is still weak. Separate confirmed facts, previous actions, and open questions instead of collapsing them together.');
    if (metrics['Current-State'] < 65) notes.push('The response is not applying enough current-state detail. Surface the date, status, or account facts before answering.');
    if (metrics['Token Discipline'] < 70) notes.push('Token discipline slipped. Keep only the minimum context that makes the answer reliable.');
    if (countHits(outputText, rubric.generic)) notes.push('The wording is still generic or hedged. Replace vague language with the concrete facts and rules that decide the answer.');
    return notes.slice(0, 4);
  }
  function buildDeltaHighlights(mission, metrics, baseline) {
    const highlights = []; Object.keys(metrics).forEach(name => { const delta = metrics[name] - baseline[name]; if (delta >= 12) highlights.push(`${name} improved by ${delta} points.`); if (delta <= -8) highlights.push(`${name} dropped by ${Math.abs(delta)} points.`); });
    if (!highlights.length) highlights.push('Little changed yet. Try adjusting one major mechanism and rerun the mission.'); return highlights.slice(0, 4);
  }
  function buildNextBestMove(mission, metrics, missionState, outputText) {
    if (!utils.plainText(outputText)) return 'Paste a real model answer first. Step 6 refreshes only when you analyze the current pasted text.';
    if (metrics['Pattern Fit'] < 60 && missionState.prediction !== mission.dominantMechanism) return `Change the diagnosis first. This mission is mainly about ${dominantLabel(mission)}, so fix the mechanism choice before adding more context.`;
    const weakest = Object.entries(metrics).sort((a, b) => a[1] - b[1])[0][0];
    if (weakest === 'Grounding') return 'Keep the rest of the package stable and add the single most decision-driving evidence excerpt, then rerun.';
    if (weakest === 'Continuity') return 'Keep the package otherwise stable and add a compact memory block that carries only the facts the answer must preserve.';
    if (weakest === 'Current-State') return 'Keep the package otherwise stable and add the current date, status, or account facts that actually decide the answer.';
    if (weakest === 'Token Discipline') return 'Remove one low-value item or tighten the response so you can see whether the package stays strong while becoming leaner.';
    return mission.challenge ? 'You are in a good place to try the harder replay with fewer cues.' : 'Rerun once with one small, deliberate change so you can confirm why the answer improved.';
  }
  function buildEncouragement(overall, completedCore) {
    if (completedCore && overall >= 85) return 'The package is now teaching the right lesson clearly. The answer is strong enough that you can move to replay or the next mission.';
    if (completedCore) return 'You crossed the core threshold. The mechanism is now visible even if some metrics can still improve.';
    if (overall >= 55) return 'The answer is moving in the right direction. Use the coaching to sharpen the weakest metric rather than rebuilding everything.';
    return 'The result is still fragile, which is useful. The lab is showing that the current package is not yet solving the real failure mode.';
  }
  function sectionMatches(text, sections) {
    const lower = plain(text);
    const matches = [];
    (sections || []).forEach(section => {
      const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|\n|\r|\s)${escaped}(\s|:|\n|\r)`, 'i');
      if (re.test(lower)) matches.push(section);
    });
    return matches;
  }
  function selectedLabels(collection, ids) {
    return composer.getSelectedItems(collection || [], ids || []).map(item => item.label);
  }
  function formatYesNo(value, trueText='Yes', falseText='No') { return value ? trueText : falseText; }
  function buildTrace(mission, missionState, outputText, metrics) {
    const rubric = getRubric(mission);
    const token = composer.computeTokenUsage(mission, missionState);
    const budget = missionState.bonusMode && mission.challenge ? mission.challenge.tokenBudget : mission.tokenBudget;
    const sections = sectionMatches(outputText, rubric.sections);
    const groundingPhrases = matchedPhrases(outputText, rubric.grounding);
    const continuityPhrases = matchedPhrases(outputText, rubric.continuity);
    const dynamicPhrases = matchedPhrases(outputText, rubric.dynamic);
    const directPhrases = matchedPhrases(outputText, rubric.directAnswer);
    const genericPhrases = matchedPhrases(outputText, rubric.generic);
    const trace = {};
    trace['Pattern Fit'] = {
      score: metrics['Pattern Fit'],
      triggers: [
        `Diagnosis selected: ${missionState.prediction || 'none'} (expected: ${dominantLabel(mission)}).`,
        `Grounding enabled: ${formatYesNo(missionState.groundingEnabled)} · Memory enabled: ${formatYesNo(missionState.memoryEnabled)} · Dynamic facts enabled: ${formatYesNo(missionState.dynamicEnabled)}.`,
        directPhrases.length ? `Direct-answer phrases found in the pasted answer: ${directPhrases.join(', ')}.` : 'No direct-answer phrases from the mission rubric were found in the pasted answer.',
        genericPhrases.length ? `Generic or weak phrasing penalty triggered by: ${genericPhrases.join(', ')}.` : 'No generic-phrasing penalty fired for Pattern Fit.'
      ]
    };
    trace['Grounding'] = {
      score: metrics['Grounding'],
      triggers: [
        `Selected evidence (${selectedLabels(mission.evidence, missionState.selectedEvidence).length}): ${selectedLabels(mission.evidence, missionState.selectedEvidence).join(', ') || 'none'}.`,
        sections.length ? `Section labels detected: ${sections.join(', ')}.` : 'No expected section labels were detected in the pasted answer.',
        groundingPhrases.length ? `Grounding phrases matched in the pasted answer: ${groundingPhrases.join(', ')}.` : 'No grounding phrases from the mission rubric were matched in the pasted answer.',
        /according to|under .*policy|based on|rule requires|contract rule/i.test(outputText) ? 'Grounding bonus fired because the answer explicitly cited a rule or policy.' : 'No explicit rule-citation bonus fired for Grounding.',
        genericPhrases.length ? `Grounding penalty applied for generic wording: ${genericPhrases.join(', ')}.` : 'No generic-wording penalty fired for Grounding.'
      ]
    };
    trace['Continuity'] = {
      score: metrics['Continuity'],
      triggers: [
        `Memory mode: ${missionState.memoryMode || 'none'} · Selected memory (${selectedLabels(mission.memory, missionState.selectedMemory).length}): ${selectedLabels(mission.memory, missionState.selectedMemory).join(', ') || 'none'}.`,
        continuityPhrases.length ? `Continuity phrases matched in the pasted answer: ${continuityPhrases.join(', ')}.` : 'No continuity phrases from the mission rubric were matched in the pasted answer.',
        /confirmed facts|open questions|already taken|hypotheses|yesterday/i.test(outputText) ? 'Continuity bonus fired because the answer preserved prior facts, actions, or open questions.' : 'No continuity bonus fired from preserved-history wording.',
        genericPhrases.length ? `Continuity penalty applied for generic wording: ${genericPhrases.join(', ')}.` : 'No generic-wording penalty fired for Continuity.'
      ]
    };
    trace['Current-State'] = {
      score: metrics['Current-State'],
      triggers: [
        `Selected dynamic facts (${selectedLabels(mission.dynamicFacts, missionState.selectedFacts).length}): ${selectedLabels(mission.dynamicFacts, missionState.selectedFacts).join(', ') || 'none'}.`,
        dynamicPhrases.length ? `Current-state phrases matched in the pasted answer: ${dynamicPhrases.join(', ')}.` : 'No current-state phrases from the mission rubric were matched in the pasted answer.',
        /today|current|date|status|hire date|failed payment|remains open|billing sync pending|less than 24 hours/i.test(outputText) ? 'Current-state bonus fired because the answer explicitly referenced live date, status, or account facts.' : 'No explicit live-facts bonus fired for Current-State.',
        genericPhrases.length ? `Current-state penalty applied for generic wording: ${genericPhrases.join(', ')}.` : 'No generic-wording penalty fired for Current-State.'
      ]
    };
    const outputWords = wordCount(outputText);
    const tokenPct = budget ? Math.round((token.total / budget) * 100) : 0;
    trace['Token Discipline'] = {
      score: metrics['Token Discipline'],
      triggers: [
        `Package size: ${token.total} estimated tokens against a budget of ${budget} (${tokenPct}%).`,
        `Output length: ${outputWords} words.`,
        tokenPct > 100 ? 'Token penalty fired because the package exceeded the mission budget.' : tokenPct < 35 ? 'Token-discipline warning fired because the package was very light for the mission.' : 'Package size stayed inside the expected mission range.',
        outputWords === 0 ? 'Output-length penalty fired because no pasted answer was present.' : outputWords > 220 ? 'Output-length penalty fired because the pasted answer was unusually long.' : outputWords < 18 ? 'Output-length penalty fired because the pasted answer was unusually short.' : 'Output length stayed inside the expected mission range.'
      ]
    };
    return trace;
  }

  function buildSentenceFeedback(mission, outputText) {
    const rubric = getRubric(mission); const sentences = splitSentences(outputText); if (!sentences.length) return [];
    const feedback = sentences.map(sentence => {
      const grounding = countHits(sentence, rubric.grounding), dynamic = countHits(sentence, rubric.dynamic), continuity = countHits(sentence, rubric.continuity), generic = countHits(sentence, rubric.generic);
      let tone = 'neutral', note = 'Readable sentence, but it is not carrying much mechanism-specific evidence yet.', score = grounding + dynamic + continuity - generic;
      if (generic > 0) { tone = 'warning'; note = 'This sentence stays generic or overconfident. Replace it with a rule or a concrete fact.'; score -= 3; }
      else if (grounding > 0 && dynamic > 0) { tone = 'success'; note = 'Strong mixed sentence: it ties a rule or policy to the current state that actually decides the answer.'; score += 4; }
      else if (grounding > 0) { tone = 'success'; note = 'Good grounding move: this sentence uses source evidence instead of speculation.'; score += 3; }
      else if (dynamic > 0) { tone = 'success'; note = 'Good current-state move: this sentence applies the live date, status, or account fact.'; score += 3; }
      else if (continuity > 0) { tone = 'success'; note = 'Good continuity move: this sentence preserves prior facts, actions, or open questions.'; score += 2; }
      return { sentence, tone, note, score };
    });
    return feedback.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5);
  }
  function analyze(mission, missionState) {
    const outputText = missionState.pastedOutput || '';
    const metrics = { 'Pattern Fit': scorePatternFit(mission, missionState, outputText), 'Grounding': scoreGrounding(mission, missionState, outputText), 'Continuity': scoreContinuity(mission, missionState, outputText), 'Current-State': scoreCurrentState(mission, missionState, outputText), 'Token Discipline': scoreTokenDiscipline(mission, missionState, outputText) };
    const overall = Math.round(Object.values(metrics).reduce((sum, value) => sum + value, 0) / Object.keys(metrics).length);
    const baseline = baselineMetricMap(mission); const band = utils.scoreBand(overall, cfg.readinessBands); const completedCore = overall >= 70;
    const coaching = buildCoaching(mission, metrics, missionState, outputText), deltaHighlights = buildDeltaHighlights(mission, metrics, baseline), nextBestMove = buildNextBestMove(mission, metrics, missionState, outputText), encouragement = buildEncouragement(overall, completedCore), sentenceFeedback = buildSentenceFeedback(mission, outputText);
    const trace = buildTrace(mission, missionState, outputText, metrics);
    return { metrics, overall, band, baseline, coaching, deltaHighlights, packageSummary: composer.selectedSummary(mission, missionState), completedCore, nextBestMove, encouragement, sentenceFeedback, trace };
  }
  window.POLScoring = { analyze, baselineMetricMap, dominantLabel };
})();
