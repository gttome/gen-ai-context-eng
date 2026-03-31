import { unique } from "../utils/helpers.js";
import {
  buildWindows,
  labelSupportMode,
  phraseMatches,
  scoreStatus,
  semanticGroupHits,
  sentenceHasSubject,
  splitSentences
} from "./reviewSemantics.js";

function buildRegions(sentences = [], radiusValues = [0, 1, 2]) {
  const direct = sentences.map((text, index) => ({ text, sentence: text, indices: [index], matchStrength: "direct" }));
  const windows = radiusValues
    .filter(radius => radius > 0)
    .flatMap(radius => buildWindows(sentences, radius)
      .filter(window => unique(window.indices).length > 1)
      .map(window => ({
        text: window.text,
        sentence: window.text,
        indices: window.indices,
        matchStrength: radius === 1 ? "window" : "semantic-window"
      })));
  return [...direct, ...windows];
}

function groupResult(regionText, group = {}, index = 0) {
  const label = group.label || `group-${index + 1}`;
  const phrase = phraseMatches(regionText, group.phrases || []);
  const cues = phraseMatches(regionText, group.cues || []);
  const semanticHits = semanticGroupHits(regionText, group.supportCueGroups || group.semanticCueGroups || []);
  return {
    label,
    phrase,
    cues,
    semanticHits,
    matched: phrase.length > 0 || semanticHits.length > 0 || cues.length >= Math.max(1, Math.min(2, (group.cues || []).length || 1))
  };
}

function contradictionHits(regionText, check = {}) {
  return unique([
    ...phraseMatches(regionText, check.contradictionPhrases || []),
    ...semanticGroupHits(regionText, check.contradictionCueGroups || check.semanticContradictionGroups || [])
  ]);
}

function labelForCompound(mode = "", mixedSignal = false, consistencyMode = "") {
  if (mixedSignal) {
    return consistencyMode === "same-answer-region"
      ? "Multiple facts align, but the same answer region also contradicts them"
      : "Multiple facts align in one region, but are contradicted elsewhere in the answer";
  }
  if (mode === "semantic-window") return "Paraphrase-compatible across one answer region";
  if (mode === "semantic") return "Paraphrase-compatible in one sentence";
  if (mode === "cue") return "Partially aligned in one region";
  if (mode === "window") return "Multiple facts aligned in one answer region";
  return "Direct in one sentence";
}

export function reviewCompoundChecks(compoundChecks = [], pastedOutput = "") {
  const sentences = splitSentences(pastedOutput || "");
  if (!compoundChecks.length) {
    return { results: [], alignedCount: 0, contradictedCount: 0, coveragePercent: 0, criticalMisses: [], contradictionLabels: [] };
  }

  const results = compoundChecks.map(check => {
    const regions = buildRegions(sentences, [0, 1, 2]);
    let bestMatch = null;
    let bestPartial = null;
    let contradiction = null;

    for (const region of regions) {
      if (!sentenceHasSubject(region.text, check.subjectCues || [], check.subjectCueGroups || [])) continue;
      const groups = (check.groups || []).map((group, index) => groupResult(region.text, group, index));
      const matchedGroups = groups.filter(group => group.matched);
      const contradicted = contradictionHits(region.text, check);
      const semanticMatch = matchedGroups.some(group => group.semanticHits.length);
      const minGroups = Math.min(check.minGroups || groups.length || 1, groups.length || 1);

      if (contradicted.length && !contradiction) {
        contradiction = {
          sentence: region.sentence,
          contradictionHits: contradicted,
          matchedGroups: matchedGroups.map(group => group.label),
          matchStrength: region.matchStrength
        };
      }

      if (matchedGroups.length >= minGroups) {
        const candidate = {
          sentence: region.sentence,
          matchedGroups: matchedGroups.map(group => group.label),
          matchStrength: semanticMatch
            ? (region.matchStrength === "direct" ? "semantic" : "semantic-window")
            : region.matchStrength
        };
        if (!bestMatch || candidate.matchedGroups.length > bestMatch.matchedGroups.length || (candidate.matchStrength === "direct" && bestMatch.matchStrength !== "direct")) {
          bestMatch = candidate;
        }
      } else if (matchedGroups.length >= Math.max(1, minGroups - 1)) {
        const candidate = {
          sentence: region.sentence,
          matchedGroups: matchedGroups.map(group => group.label),
          matchStrength: semanticMatch ? "semantic" : "cue"
        };
        if (!bestPartial || candidate.matchedGroups.length > bestPartial.matchedGroups.length) {
          bestPartial = candidate;
        }
      }
    }

    const match = bestMatch || bestPartial;
    const mixedSignal = Boolean(match && contradiction);
    const consistencyMode = mixedSignal
      ? ((match?.sentence || "") === (contradiction?.sentence || "") ? "same-answer-region" : "separate-answer-regions")
      : "";
    const status = contradiction ? "contradicted" : match ? "aligned" : "missing";
    const missingGroups = (check.groups || []).map(group => group.label).filter(label => !(match?.matchedGroups || []).includes(label));

    return {
      id: check.id,
      label: check.label,
      reviewType: "compound",
      critical: Boolean(check.critical),
      status,
      matchedSentence: match?.sentence || "",
      contradictionSentence: contradiction?.sentence || "",
      matchedGroups: unique(match?.matchedGroups || []),
      contradictionHits: unique(contradiction?.contradictionHits || []),
      missingGroups,
      conflictFamily: contradiction ? "multi-fact contradiction" : "",
      matchStrength: match?.matchStrength || "",
      supportModeLabel: match ? labelForCompound(match.matchStrength, mixedSignal, consistencyMode) : "Not yet supported",
      mixedSignal,
      consistencyMode,
      teachingNote: check.teachingNote || "",
      score: scoreStatus({ status, critical: check.critical, matchStrength: match?.matchStrength })
    };
  });

  const alignedCount = results.filter(item => item.status === "aligned").length;
  const contradictedCount = results.filter(item => item.status === "contradicted").length;
  const weightedCoverage = results.reduce((total, item) => total + item.score, 0) / Math.max(results.length, 1);

  return {
    results,
    alignedCount,
    contradictedCount,
    coveragePercent: Math.round(weightedCoverage * 100),
    criticalMisses: results.filter(item => item.critical && item.status !== "aligned").map(item => item.label),
    contradictionLabels: results.filter(item => item.status === "contradicted").map(item => item.label)
  };
}
