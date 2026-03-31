import { clamp, unique } from "../utils/helpers.js";
import { reviewAssertions, reviewFactChecks, reviewRequiredCaveats } from "./assertionReview.js";
import { reviewCompoundChecks } from "./compoundReview.js";

const STOP_WORDS = new Set([
  "the","and","for","with","that","this","from","into","over","under","your","their","there","about","because",
  "which","while","when","what","where","will","should","would","could","through","using","used","after",
  "before","then","than","them","they","have","has","had","been","being","into","onto","also","still",
  "only","just","more","less","very","much","some","each","most","keep","keeps","need","needs","task",
  "answer","summary","current","next","step","section","sections","return","plain","language","evidence",
  "record","source","sources","policy","status","risk","review","output","brief","memo","note","notes"
]);

function normalize(text = "") { return text.toLowerCase(); }

function splitSentences(text = "") {
  return text.split(/(?<=[.!?])\s+|\n+/).map(item => item.trim()).filter(Boolean);
}

function extractExpectedSections(mission) {
  const line = (mission.outputContract || []).find(item => item.toLowerCase().startsWith("return sections:"));
  if (!line) return [];
  return line.split(":")[1].split("/").map(item => item.trim()).filter(Boolean);
}

function hitKeywords(text, keywords = []) { return keywords.some(keyword => text.includes(keyword.toLowerCase())); }

function significantTerms(text = "") {
  const numeric = Array.from(text.matchAll(/\b\d+(?:%|\.\d+)?\b/g)).map(match => match[0].toLowerCase());
  const words = text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
  const filtered = words.filter(word => !STOP_WORDS.has(word) && word.length >= 4);
  return unique([...numeric, ...filtered]);
}

function deriveCueGroup(card) {
  return {
    id: card.id,
    label: card.title,
    cues: significantTerms(`${card.title} ${card.excerpt}`).filter(term => !["today", "yesterday", "tomorrow"].includes(term)).slice(0, 7),
    hit: false
  };
}

function scoreDimension(id, label, score, max, body) { return { id, label, score, max, body }; }
function reviewBand(score) { if (score >= 85) return "Strong"; if (score >= 70) return "Reviewable"; if (score >= 55) return "Partial"; return "Weak"; }

function overlapRatio(sentence, cues = []) {
  if (!sentence || !cues.length) return 0;
  const normalized = normalize(sentence);
  const hits = cues.filter(cue => normalized.includes(cue.toLowerCase()));
  return hits.length / cues.length;
}

function bestSentenceTrace(sentences, cues) {
  let best = { sentence: "", score: 0 };
  sentences.forEach(sentence => {
    const score = overlapRatio(sentence, cues);
    if (score > best.score) best = { sentence, score };
  });
  return best;
}

function summarizeTrace(items, threshold) {
  return items.map(item => {
    const hit = item.trace.score >= threshold;
    return { ...item, hit, matchText: hit ? item.trace.sentence : "", coverageScore: item.trace.score };
  });
}

function matrixStatus(result) {
  if (result.status === "contradicted") return "contradicted";
  if (result.status === "aligned") return result.matchStrength === "cue" ? "weakly-supported" : "supported";
  return "unsupported";
}

function supportModeLabel(result) {
  if (result.status === "contradicted" && result.mixedSignal) return result.supportModeLabel || "Supported in one region, contradicted elsewhere";
  if (result.status !== "aligned") return "Not yet supported";
  return result.supportModeLabel || (result.matchStrength === "window" ? "Split across nearby sentences" : result.matchStrength === "cue" ? "Implied by cues only" : "Direct in one sentence");
}

function matrixSeverity(result) {
  if (result.status === "contradicted" && result.mixedSignal) return result.critical ? "high" : "medium";
  if (result.status === "contradicted") return result.critical ? "high" : "medium";
  if (result.status === "missing") return result.critical ? "high" : "medium";
  if (result.reviewType === "compound" && result.matchStrength === "cue") return result.critical ? "high" : "medium";
  if (result.matchStrength === "cue") return result.critical ? "medium" : "low";
  return "low";
}

function matrixTypeLabel(reviewType = "assertion") {
  if (reviewType === "number") return "Numeric fact";
  if (reviewType === "date") return "Timing fact";
  if (reviewType === "direction") return "Direction check";
  if (reviewType === "caveat") return "Required caveat";
  if (reviewType === "compound") return "Compound check";
  return "Mission claim";
}

function matrixAction(result) {
  if (result.status === "contradicted" && result.mixedSignal) {
    return result.reviewType === "compound"
      ? "Unify the answer so the interacting facts stay consistent everywhere, not just in one region."
      : "Resolve the mixed signals so the answer stops supporting the claim in one place while contradicting it in another.";
  }
  if (result.status === "contradicted") return result.reviewType === "compound" ? "Rewrite the answer region so the interacting facts stay consistent together, not just individually." : "Rewrite the conflicting sentence so it matches the selected package.";
  if (result.status === "missing") {
    return result.reviewType === "caveat"
      ? "Add the required caveat explicitly so the answer stays bounded."
      : "Restore this point explicitly in the answer.";
  }
  if (result.reviewType === "compound" && result.matchStrength === "cue") return "Bring the interacting facts together in one clearer answer region so the logic is easy to audit.";
  if (result.matchStrength === "cue") return "Make the support more explicit so a reviewer can see it immediately.";
  if (result.matchStrength === "window") return "Support is present, but it is spread across nearby sentences. Tighten it if you want easier review.";
  return "No immediate fix needed.";
}

function buildClaimMatrix(assertionResults = [], factResults = [], caveatResults = [], compoundResults = []) {
  const matrix = [...assertionResults, ...factResults, ...caveatResults, ...compoundResults].map(result => ({
    id: result.id,
    label: result.label,
    type: matrixTypeLabel(result.reviewType),
    status: matrixStatus(result),
    severity: matrixSeverity(result),
    evidenceText: result.matchedSentence || "",
    issueText: result.contradictionSentence || "",
    supportMode: supportModeLabel(result),
    fixAction: matrixAction(result),
    teachingNote: result.teachingNote || "",
    matchedGroups: result.matchedGroups || [],
    missingGroups: result.missingGroups || [],
    mixedSignal: Boolean(result.mixedSignal),
    consistencyMode: result.consistencyMode || "",
    critical: Boolean(result.critical)
  }));

  const summary = {
    supported: matrix.filter(item => item.status === "supported").length,
    weaklySupported: matrix.filter(item => item.status === "weakly-supported").length,
    unsupported: matrix.filter(item => item.status === "unsupported").length,
    contradicted: matrix.filter(item => item.status === "contradicted").length,
    mixedSignals: matrix.filter(item => item.mixedSignal).length,
    highSeverity: matrix.filter(item => item.severity === "high").length,
    mediumSeverity: matrix.filter(item => item.severity === "medium").length,
    lowSeverity: matrix.filter(item => item.severity === "low").length
  };

  return { matrix, summary };
}


function deriveMissionCoaching(mission, assertionReview, factReview, caveatReview, compoundReview) {
  const rules = mission.reviewCoaching || [];
  const flags = new Set();
  if (assertionReview.criticalMisses.length || assertionReview.contradictedCount) flags.add("assertion-miss");
  if (factReview.criticalMisses.length || factReview.contradictedCount) flags.add("fact-miss");
  if (caveatReview.criticalMisses.length || caveatReview.contradictedCount) flags.add("caveat-miss");
  if (compoundReview.criticalMisses.length || compoundReview.contradictedCount) flags.add("compound-miss");
  return unique(rules.filter(rule => flags.has(rule.when)).map(rule => rule.message)).slice(0, 3);
}

function fixFirstFromMatrix(matrix = []) {
  return matrix
    .filter(item => item.status !== "supported")
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      const statusOrder = { contradicted: 0, unsupported: 1, "weakly-supported": 2 };
      return (severityOrder[a.severity] - severityOrder[b.severity]) || (statusOrder[a.status] - statusOrder[b.status]);
    })
    .slice(0, 4)
    .map(item => ({
      label: item.label,
      severity: item.severity,
      status: item.status,
      action: item.fixAction
    }));
}

export function analyzePasteback({ mission, packageState, pastedOutput, activeBonusBranch = null, branchPolicy = null }) {
  const text = pastedOutput || "";
  const normalized = normalize(text);
  const sentences = splitSentences(text);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const expectedSections = extractExpectedSections(mission).map(label => ({ label, present: normalized.includes(label.toLowerCase()) }));
  const checks = (mission.pastebackChecks || []).map(check => ({ ...check, hit: hitKeywords(normalized, check.keywords) }));
  const uncertaintyHit = hitKeywords(normalized, ["uncertain", "uncertainty", "unknown", "unclear", "not enough", "cannot verify", "not provided", "insufficient", "if confirmed", "if needed", "based on the provided evidence"]);
  const conciseLimit = activeBonusBranch?.id === "strict-budget" ? Math.max(110, (mission.pastebackWordLimit || 180) - 30) : (mission.pastebackWordLimit || 180);
  const concise = wordCount > 0 ? wordCount <= conciseLimit : false;
  const nearConcise = wordCount > 0 ? wordCount <= Math.round(conciseLimit * 1.2) : false;

  const supportCards = packageState.includeCards.filter(card => card.essential).length
    ? packageState.includeCards.filter(card => card.essential)
    : packageState.includeCards.slice(0, 4);
  const supportTraces = summarizeTrace(supportCards.map(card => ({
    id: card.id,
    label: card.title,
    cues: deriveCueGroup(card).cues,
    trace: bestSentenceTrace(sentences, deriveCueGroup(card).cues)
  })), 0.22);
  const dynamicFactTraces = summarizeTrace((mission.dynamicFacts || []).map((fact, index) => ({
    id: `dynamic-${index + 1}`,
    label: fact,
    cues: significantTerms(fact).slice(0, 6),
    trace: bestSentenceTrace(sentences, significantTerms(fact).slice(0, 6))
  })), 0.26);
  const staleRiskCards = packageState.omitCards.filter(card => card.recency === "Stale" || card.authority === "Low").slice(0, 4);
  const staleMentions = summarizeTrace(staleRiskCards.map(card => ({
    id: card.id,
    label: card.title,
    cues: deriveCueGroup(card).cues,
    trace: bestSentenceTrace(sentences, deriveCueGroup(card).cues)
  })), 0.18).filter(group => group.hit);
  const assertionReview = reviewAssertions(mission.pastebackAssertions || [], text);
  const factReview = reviewFactChecks(mission.factChecks || [], text);
  const caveatReview = reviewRequiredCaveats(mission.requiredCaveats || [], text);
  const compoundReview = reviewCompoundChecks(mission.compoundChecks || [], text);
  const claimMatrixBundle = buildClaimMatrix(assertionReview.results, factReview.results, caveatReview.results, compoundReview.results);
  const claimMatrix = claimMatrixBundle.matrix;
  const claimMatrixSummary = claimMatrixBundle.summary;
  const splitSupportCount = claimMatrix.filter(item => item.supportMode === "Split across nearby sentences").length;
  const impliedSupportCount = claimMatrix.filter(item => item.supportMode === "Implied by cues only").length;
  const semanticSupportCount = claimMatrix.filter(item => item.supportMode?.includes("Paraphrase-compatible")).length;
  const missionCoaching = deriveMissionCoaching(mission, assertionReview, factReview, caveatReview, compoundReview);

  const sectionHits = expectedSections.filter(item => item.present).length;
  const checkHits = checks.filter(item => item.hit).length;
  const supportHits = supportTraces.filter(item => item.hit).length;
  const dynamicHits = dynamicFactTraces.filter(item => item.hit).length;
  const essentialIds = new Set(packageState.includeCards.filter(card => card.essential).map(card => card.id));
  const uncoveredEssential = supportTraces.filter(item => essentialIds.has(item.id) && !item.hit).map(item => item.label);
  const allTraceItems = [...supportTraces, ...dynamicFactTraces];
  const unsupportedSentences = sentences.filter(sentence => {
    if (sentence.split(/\s+/).length < 8) return false;
    const best = allTraceItems.reduce((max, item) => Math.max(max, overlapRatio(sentence, item.cues || [])), 0);
    const hasCheck = checks.some(check => hitKeywords(normalize(sentence), check.keywords));
    return best < 0.16 && !hasCheck;
  }).slice(0, 3);

  const sectionRatio = sectionHits / Math.max(expectedSections.length || 1, 1);
  const checkRatio = checkHits / Math.max(checks.length || 1, 1);
  const supportRatio = supportHits / Math.max(supportTraces.length || 1, 1);
  const dynamicRatio = dynamicHits / Math.max(dynamicFactTraces.length || 1, 1);
  const assertionRatio = assertionReview.coveragePercent / 100;
  const factRatio = factReview.coveragePercent / 100;
  const caveatRatio = caveatReview.results.length ? (caveatReview.coveragePercent / 100) : 1;
  const compoundRatio = compoundReview.results.length ? (compoundReview.coveragePercent / 100) : 1;
  const structureScore = text.trim() ? Math.round(sectionRatio * 25) : 0;
  const evidenceRatio = (checkRatio * 0.14) + (supportRatio * 0.2) + (dynamicRatio * 0.1) + (assertionRatio * 0.16) + (factRatio * 0.14) + (caveatRatio * 0.1) + (compoundRatio * 0.16);
  const evidenceScore = text.trim() ? Math.round(evidenceRatio * 25) : 0;
  const groundingBase = 8 + (supportRatio * 5) + (dynamicRatio * 3) + (assertionRatio * 3) + (factRatio * 3) + (caveatRatio * 2) + (compoundRatio * 4);
  const groundingPenalty = (staleMentions.length * 4) + (unsupportedSentences.length * 2) + (assertionReview.contradictedCount * 5) + (factReview.contradictedCount * 5) + (caveatReview.contradictedCount * 4) + (compoundReview.contradictedCount * 6) + (assertionReview.criticalMisses.length * 2) + (factReview.criticalMisses.length * 2) + (caveatReview.criticalMisses.length * 2) + (compoundReview.criticalMisses.length * 3) + (activeBonusBranch?.id === "authority-freshness" && staleMentions.length ? 3 : 0);
  const groundingScore = text.trim() ? clamp(Math.round(groundingBase - groundingPenalty), 0, 20) : 0;
  const uncertaintyScore = text.trim() ? (uncertaintyHit || caveatReview.alignedCount ? 15 : 6) : 0;
  const concisionScore = text.trim() ? clamp(concise ? 15 - ((assertionReview.contradictedCount + factReview.contradictedCount + caveatReview.contradictedCount + compoundReview.contradictedCount) ? 2 : 0) : nearConcise ? 9 : 3, 0, 15) : 0;
  const traceCoverageScore = Math.round(((supportRatio * 0.32) + (dynamicRatio * 0.14) + (assertionRatio * 0.14) + (factRatio * 0.14) + (caveatRatio * 0.12) + (compoundRatio * 0.14)) * 100);
  const factCoverageScore = factReview.coveragePercent;
  const caveatCoverageScore = caveatReview.coveragePercent;

  const rubric = [
    scoreDimension("structure", "Requested structure", structureScore, 25, sectionHits === expectedSections.length ? "All requested sections were detected." : "One or more requested sections were not detected clearly enough."),
    scoreDimension("evidence", "Mission evidence coverage", evidenceScore, 25, assertionReview.coveragePercent >= 70 && factReview.coveragePercent >= 60 && caveatRatio >= 0.6 && compoundRatio >= 0.6 && supportHits >= Math.max(1, supportTraces.length - 1) ? "Selected evidence, mission claims, key numeric/date facts, compound logic, and required caveats are surfacing with visible carry-through into the pasted answer." : "Some decisive evidence, interacting facts, or required caveats are not surviving the handoff clearly enough yet."),
    scoreDimension("grounding", "Grounding discipline", groundingScore, 20, assertionReview.contradictedCount || factReview.contradictedCount || caveatReview.contradictedCount || compoundReview.contradictedCount || staleMentions.length || unsupportedSentences.length ? "Some of the pasted answer may be drifting, contradicting the package, or breaking the logic that should hold several facts together." : "The pasted answer appears anchored in the selected package and aligned to the mission claims, key facts, compound logic, and required caveats."),
    scoreDimension("uncertainty", "Uncertainty handling", uncertaintyScore, 15, uncertaintyHit || caveatReview.alignedCount ? "Boundary or caveat language was detected when the answer needed to stay bounded." : "No explicit uncertainty or caveat language was detected."),
    scoreDimension("concision", "Concision and reviewability", concisionScore, 15, wordCount ? `${wordCount} words against a target of ${conciseLimit}.` : "Paste an answer to evaluate concision.")
  ];

  const reviewScore = rubric.reduce((total, item) => total + item.score, 0);
  const findings = [];
  if (!text.trim()) {
    findings.push({ severity: "note", title: "No pasted output yet", body: "Paste an external model response to see rubric scoring, source traceability, claim support, and suggested fixes." });
  } else {
    if (structureScore < 20) findings.push({ severity: "warn", title: "Requested shape is incomplete", body: "The answer does not clearly match the requested section structure yet." });
    if (evidenceScore < 18) findings.push({ severity: "warn", title: "Core evidence is not fully surfacing", body: "The answer needs more of the mission-specific facts, claims, or caveats that should survive the package handoff." });
    if (claimMatrixSummary.mixedSignals) findings.push({ severity: "warn", title: "Some answer regions send mixed signals", body: `${claimMatrixSummary.mixedSignals} review item${claimMatrixSummary.mixedSignals === 1 ? "" : "s"} were supported in one region but contradicted elsewhere. Tighten those regions so the answer reads as one consistent position.` });
    if (assertionReview.contradictedCount) findings.push({ severity: "warn", title: "One or more mission claims were contradicted", body: `Detected contradictions against the selected package: ${assertionReview.contradictionLabels.join(", ")}.` });
    if (factReview.contradictedCount) findings.push({ severity: "warn", title: "Numeric, timing, or direction drift was detected", body: `Detected fidelity conflicts against the selected package: ${factReview.contradictionLabels.join(", ")}.` });
    if (caveatReview.contradictedCount) findings.push({ severity: "warn", title: "Required caveat language drifted", body: `Detected caveat conflicts against the selected package: ${caveatReview.contradictionLabels.join(", ")}.` });
    if (compoundReview.contradictedCount) findings.push({ severity: "warn", title: "Interacting facts drifted together", body: `Detected multi-fact conflicts against the selected package: ${compoundReview.contradictionLabels.join(", ")}.` });
    if (assertionReview.criticalMisses.length) findings.push({ severity: "warn", title: "Critical mission claims are not obvious yet", body: `These mission claims still need clearer carry-through: ${assertionReview.criticalMisses.join(", ")}.` });
    if (factReview.criticalMisses.length) findings.push({ severity: "warn", title: "Critical numeric or timing facts are not obvious yet", body: `These key facts still need clearer carry-through: ${factReview.criticalMisses.join(", ")}.` });
    if (caveatReview.criticalMisses.length) findings.push({ severity: "warn", title: "Critical caveats are not obvious yet", body: `These caveats still need clearer carry-through: ${caveatReview.criticalMisses.join(", ")}.` });
    if (compoundReview.criticalMisses.length) findings.push({ severity: "warn", title: "Critical multi-fact logic is not obvious yet", body: `These interacting facts still need to hold together more clearly: ${compoundReview.criticalMisses.join(", ")}.` });
    if (uncoveredEssential.length) findings.push({ severity: "warn", title: "Essential selected evidence is not obvious yet", body: `These selected cards are not clearly traceable in the pasted answer: ${uncoveredEssential.join(", ")}.` });
    if (staleMentions.length) findings.push({ severity: "warn", title: "Weaker background may be leaking back in", body: `Detected cues associated with omitted material: ${staleMentions.map(item => item.label).join(", ")}.` });
    if (unsupportedSentences.length) findings.push({ severity: "note", title: "Some answer text is hard to trace", body: "One or more sentences do not map cleanly back to the selected package. Tighten or ground them more explicitly." });
    if (splitSupportCount >= 2) findings.push({ severity: "note", title: "Some support is spread across nearby sentences", body: "The answer appears directionally right, but several important points are only recoverable by combining adjacent sentences. Tighten them if you want easier human review." });
    if (semanticSupportCount >= 1) findings.push({ severity: "note", title: "Some support is paraphrase-compatible rather than exact", body: "The review found answer regions that preserve the meaning, but not always the original phrasing. Keep those regions precise when the fact is high stakes." });
    if (impliedSupportCount >= 1) findings.push({ severity: "note", title: "Some claims are only implied by cues", body: "At least one important point looks inferable rather than explicit. Consider restating it directly." });
    if (!uncertaintyHit && !caveatReview.alignedCount) findings.push({ severity: "note", title: "Boundaries are not explicit yet", body: "When evidence is incomplete or conditional, the answer should say so plainly instead of smoothing it over." });
    if (branchPolicy?.includeCap && wordCount > conciseLimit) findings.push({ severity: "warn", title: "Tighter-budget replay still reads heavy", body: "The answer is longer than the tighter-budget replay should usually produce." });
    if (reviewScore >= 85) findings.push({ severity: "good", title: "Paste-back looks strong", body: "The answer is structured, bounded, reasonably grounded, and concise enough to review quickly." });
  }

  const priorityActions = rubric
    .filter(item => item.score < Math.round(item.max * 0.72))
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .map(item => item.id === "structure"
      ? "Restore the requested section headings so the answer is easier to review."
      : item.id === "evidence"
        ? "Bring back the decisive mission facts, claims, and caveats explicitly."
        : item.id === "grounding"
          ? "Lean harder on selected source-of-record material and trim drift or unsupported claims."
          : item.id === "uncertainty"
            ? "State the remaining uncertainty or caveat instead of smoothing it over."
            : "Trim length so the answer stays easy to inspect and compare.")
    .slice(0, 3);
  if (caveatReview.criticalMisses.length) priorityActions.unshift(`Restore the missing caveats: ${caveatReview.criticalMisses.slice(0, 2).join(", ")}.`);
  if (compoundReview.criticalMisses.length) priorityActions.unshift(`Restore the missing multi-fact logic: ${compoundReview.criticalMisses.slice(0, 1).join(", ")}.`);
  if (assertionReview.criticalMisses.length) priorityActions.unshift(`Restore the missing mission claims: ${assertionReview.criticalMisses.slice(0, 2).join(", ")}.`);
  if (factReview.criticalMisses.length) priorityActions.unshift(`Restore the missing numeric/date facts: ${factReview.criticalMisses.slice(0, 2).join(", ")}.`);
  if (claimMatrixSummary.mixedSignals) priorityActions.unshift("Resolve any mixed-signal rows first so the answer stops supporting a point in one region while contradicting it in another.");
  if (assertionReview.contradictedCount || factReview.contradictedCount || caveatReview.contradictedCount || compoundReview.contradictedCount) priorityActions.unshift("Rewrite any sentence region that contradicts the selected evidence, dynamic facts, compound logic, or required caveats.");
  if (uncoveredEssential.length) priorityActions.unshift(`Make the selected essential evidence obvious again: ${uncoveredEssential.slice(0, 2).join(", ")}.`);
  if (unsupportedSentences.length) priorityActions.unshift("Rewrite or remove any sentence that cannot be traced back to the selected package.");
  if (impliedSupportCount) priorityActions.unshift("Turn implied support into direct support for the most important claims.");
  if (semanticSupportCount) priorityActions.unshift("Keep paraphrase-compatible support precise on the highest-risk facts and caveats.");
  if (activeBonusBranch?.id === "authority-freshness") priorityActions.unshift("Double-check that current, higher-authority evidence still leads the answer.");
  if (activeBonusBranch?.id === "strict-budget") priorityActions.unshift("Keep the answer tight enough to prove the tighter budget changed your choices.");

  return {
    expectedSections,
    checks,
    supportGroups: supportTraces,
    supportTraces,
    dynamicFactTraces,
    staleMentions,
    assertionResults: assertionReview.results,
    assertionCoverageScore: assertionReview.coveragePercent,
    contradictionCount: assertionReview.contradictedCount,
    criticalAssertionMisses: assertionReview.criticalMisses,
    factResults: factReview.results,
    factCoverageScore,
    factContradictionCount: factReview.contradictedCount,
    criticalFactMisses: factReview.criticalMisses,
    caveatResults: caveatReview.results,
    caveatCoverageScore,
    caveatContradictionCount: caveatReview.contradictedCount,
    criticalCaveatMisses: caveatReview.criticalMisses,
    compoundResults: compoundReview.results,
    compoundCoverageScore: compoundReview.coveragePercent,
    compoundContradictionCount: compoundReview.contradictedCount,
    criticalCompoundMisses: compoundReview.criticalMisses,
    claimMatrix,
    claimMatrixSummary: { ...claimMatrixSummary, splitSupport: splitSupportCount, impliedSupport: impliedSupportCount, semanticSupport: semanticSupportCount },
    uncertaintyHit,
    concise,
    conciseLimit,
    wordCount,
    reviewScore,
    band: reviewBand(reviewScore),
    rubric,
    traceCoverageScore,
    uncoveredEssential,
    unsupportedSentences,
    priorityActions: unique(priorityActions).slice(0, 5),
    missionCoaching,
    fixFirst: fixFirstFromMatrix(claimMatrix),
    findings: findings.slice(0, 6)
  };
}
