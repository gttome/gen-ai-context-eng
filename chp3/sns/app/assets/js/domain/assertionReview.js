import { unique } from "../utils/helpers.js";
import {
  bestMatch,
  buildWindows,
  cueHits,
  directCueThreshold,
  joinEvidenceSentences,
  labelSupportMode,
  negatedCueHits,
  normalizeText,
  numericTokens,
  phraseMatches,
  scoreStatus,
  semanticGroupHits,
  sentenceHasSubject,
  splitSentences
} from "./reviewSemantics.js";

function buildRegions(sentences = [], radiusValues = [1, 2]) {
  const regions = [];
  radiusValues.forEach(radius => {
    buildWindows(sentences, radius)
      .filter(window => unique(window.indices).length > 1)
      .forEach(window => {
        regions.push({
          text: window.text,
          indices: window.indices,
          supportingSentences: window.text.split(/(?<=[.!?])\s+/),
          sentence: joinEvidenceSentences(window.text.split(/(?<=[.!?])\s+/)),
          matchStrength: radius === 1 ? "window" : "semantic-window"
        });
      });
  });
  return regions;
}

function analyzeSupport(text, spec = {}) {
  return {
    phraseHits: phraseMatches(text, spec.positivePhrases || spec.expectedPhrases || spec.requiredPhrases || []),
    cueMatches: cueHits(text, spec.cues || []),
    semanticHits: semanticGroupHits(text, spec.supportCueGroups || spec.semanticCueGroups || []),
    subjectHits: unique([
      ...cueHits(text, spec.subjectCues || []),
      ...semanticGroupHits(text, spec.subjectCueGroups || [])
    ])
  };
}

function analyzeContradiction(text, spec = {}) {
  return {
    contradictionHits: unique([
      ...phraseMatches(text, spec.contradictionPhrases || []),
      ...semanticGroupHits(text, spec.contradictionCueGroups || spec.semanticContradictionGroups || []),
      ...negatedCueHits(text, spec.cues || [])
    ]),
    subjectHits: unique([
      ...cueHits(text, spec.subjectCues || []),
      ...semanticGroupHits(text, spec.subjectCueGroups || [])
    ])
  };
}

function supportStrength(support, spec = {}, matchStrength = "direct") {
  if (support.phraseHits.length) return matchStrength;
  if (support.semanticHits.length) return matchStrength === "window" ? "semantic-window" : "semantic";
  if (support.cueMatches.length >= directCueThreshold(spec.cues || [], spec.supportCueGroups || spec.semanticCueGroups || [])) return "cue";
  return "";
}

function contradictionStrength(contradiction, matchStrength = "direct") {
  if (contradiction.contradictionHits.length) return matchStrength;
  return "";
}

function regionsOverlap(a = [], b = []) {
  return (a || []).some(index => (b || []).includes(index));
}

function genericMatchReview(sentences, spec = {}, reviewType = "assertion") {
  const directMatches = [];
  const windowMatches = [];
  const contradictions = [];
  const sentenceRegions = sentences.map((sentence, index) => ({ text: sentence, indices: [index], supportingSentences: [sentence], sentence, matchStrength: "direct" }));
  const windowRegions = buildRegions(sentences, [1, 2]);

  [...sentenceRegions, ...windowRegions].forEach(region => {
    if (!sentenceHasSubject(region.text, spec.subjectCues || [], spec.subjectCueGroups || [])) return;

    const support = analyzeSupport(region.text, spec);
    const contradiction = analyzeContradiction(region.text, spec);
    const supportMatchStrength = supportStrength(support, spec, region.matchStrength);
    const contradictionMatchStrength = contradictionStrength(contradiction, region.matchStrength);

    if (contradictionMatchStrength) {
      contradictions.push({
        sentence: region.sentence,
        contradictionHits: contradiction.contradictionHits,
        subjectHits: contradiction.subjectHits,
        indices: region.indices,
        supportingSentences: region.supportingSentences,
        matchStrength: contradictionMatchStrength
      });
    }

    if (supportMatchStrength && !contradictionMatchStrength) {
      const target = region.matchStrength === "direct" ? directMatches : windowMatches;
      target.push({
        sentence: region.sentence,
        supportingSentences: region.supportingSentences,
        phraseHits: support.phraseHits,
        cueMatches: support.cueMatches,
        semanticHits: support.semanticHits,
        subjectHits: support.subjectHits,
        indices: region.indices,
        matchStrength: supportMatchStrength
      });
    }
  });

  const match = bestMatch(directMatches, windowMatches);
  const contradiction = contradictions[0] || null;
  const mixedSignal = Boolean(match && contradiction);
  const consistencyMode = mixedSignal
    ? (regionsOverlap(match?.indices || [], contradiction?.indices || []) ? "same-answer-region" : "separate-answer-regions")
    : "";
  const status = contradiction ? "contradicted" : match ? "aligned" : "missing";
  const supportModeLabel = mixedSignal
    ? (consistencyMode === "same-answer-region"
      ? "Supported and contradicted in the same answer region"
      : "Supported in one region, contradicted elsewhere")
    : labelSupportMode(match?.matchStrength || "");

  return {
    reviewType,
    status,
    match,
    contradiction,
    mixedSignal,
    consistencyMode,
    supportModeLabel,
    score: scoreStatus({ status, critical: spec.critical, matchStrength: match?.matchStrength })
  };
}

function reviewSingleAssertion(assertion, sentences) {
  const reviewed = genericMatchReview(sentences, assertion, "assertion");
  return {
    id: assertion.id,
    label: assertion.label,
    reviewType: "assertion",
    critical: Boolean(assertion.critical),
    status: reviewed.status,
    matchedSentence: reviewed.match?.sentence || "",
    contradictionSentence: reviewed.contradiction?.sentence || "",
    phraseHits: unique(reviewed.match?.phraseHits || []),
    contradictionHits: unique(reviewed.contradiction?.contradictionHits || []),
    cueMatches: unique(reviewed.match?.cueMatches || []),
    semanticHits: unique(reviewed.match?.semanticHits || []),
    subjectHits: unique(reviewed.match?.subjectHits || []),
    supportSentences: reviewed.match?.supportingSentences || [],
    matchStrength: reviewed.match?.matchStrength || "",
    supportModeLabel: reviewed.supportModeLabel,
    mixedSignal: reviewed.mixedSignal,
    consistencyMode: reviewed.consistencyMode,
    score: reviewed.score
  };
}

export function reviewAssertions(assertions = [], pastedOutput = "") {
  const sentences = splitSentences(pastedOutput || "");
  if (!assertions.length) {
    return { results: [], alignedCount: 0, contradictedCount: 0, coveragePercent: 0, criticalMisses: [], contradictionLabels: [] };
  }

  const results = assertions.map(assertion => reviewSingleAssertion(assertion, sentences));
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

function reviewNumberFact(check, sentences) {
  const expectedValues = (check.expectedValues || []).map(value => normalizeText(value));
  const contradictionValues = (check.contradictionValues || []).map(value => normalizeText(value));
  const directMatches = [];
  const windowMatches = [];
  const contradictions = [];
  const regions = [
    ...sentences.map((sentence, index) => ({ text: sentence, sentence, indices: [index], supportingSentences: [sentence], matchStrength: "direct" })),
    ...buildRegions(sentences, [1, 2])
  ];

  regions.forEach(region => {
    if (!sentenceHasSubject(region.text, check.subjectCues || [], check.subjectCueGroups || [])) return;
    const foundNumbers = numericTokens(region.text);
    const expectedHits = foundNumbers.filter(token => expectedValues.includes(token));
    const contradictionHits = foundNumbers.filter(token => contradictionValues.includes(token));
    const semanticHits = semanticGroupHits(region.text, check.supportCueGroups || check.semanticCueGroups || []);
    const contradictionSemanticHits = semanticGroupHits(region.text, check.contradictionCueGroups || check.semanticContradictionGroups || []);
    const subjectHits = unique([...cueHits(region.text, check.subjectCues || []), ...semanticGroupHits(region.text, check.subjectCueGroups || [])]);
    const unitHits = unique([...cueHits(region.text, check.expectedUnits || []), ...semanticGroupHits(region.text, check.unitCueGroups || [])]);
    const matchStrength = expectedHits.length ? region.matchStrength : semanticHits.length ? (region.matchStrength === "direct" ? "semantic" : "semantic-window") : "";
    if ((expectedHits.length || semanticHits.length) && !contradictionHits.length && !contradictionSemanticHits.length) {
      const target = region.matchStrength === "direct" ? directMatches : windowMatches;
      target.push({ sentence: region.sentence, supportingSentences: region.supportingSentences, expectedHits, semanticHits, subjectHits, unitHits, matchStrength });
    }
    if (contradictionHits.length || contradictionSemanticHits.length) {
      contradictions.push({ sentence: region.sentence, contradictionHits: unique([...contradictionHits, ...contradictionSemanticHits]), subjectHits, unitHits, matchStrength: region.matchStrength });
    }
  });

  const match = bestMatch(directMatches, windowMatches);
  const contradiction = contradictions[0] || null;
  const mixedSignal = Boolean(match && contradiction);
  const consistencyMode = mixedSignal
    ? (regionsOverlap(match?.indices || [], contradiction?.indices || []) ? "same-answer-region" : "separate-answer-regions")
    : "";
  const status = contradiction ? "contradicted" : match ? "aligned" : "missing";
  return {
    id: check.id,
    label: check.label,
    reviewType: check.type || "number",
    type: "number",
    critical: Boolean(check.critical),
    status,
    matchedSentence: match?.sentence || "",
    contradictionSentence: contradiction?.sentence || "",
    expectedHits: unique(match?.expectedHits || []),
    semanticHits: unique(match?.semanticHits || []),
    contradictionHits: unique(contradiction?.contradictionHits || []),
    subjectHits: unique(match?.subjectHits || contradiction?.subjectHits || []),
    unitHits: unique(match?.unitHits || []),
    supportSentences: match?.supportingSentences || [],
    conflictFamily: contradiction ? "numeric drift" : "",
    matchStrength: match?.matchStrength || "",
    supportModeLabel: mixedSignal
      ? (consistencyMode === "same-answer-region"
        ? "Supported and contradicted in the same answer region"
        : "Supported in one region, contradicted elsewhere")
      : labelSupportMode(match?.matchStrength || ""),
    mixedSignal,
    consistencyMode,
    score: scoreStatus({ status, critical: check.critical, matchStrength: match?.matchStrength })
  };
}

function reviewPhraseFact(check, sentences, type = "date") {
  const reviewed = genericMatchReview(sentences, check, type);
  const conflictFamily = type === "direction"
    ? "direction-of-change drift"
    : type === "date"
      ? "date/timing drift"
      : "fact drift";

  return {
    id: check.id,
    label: check.label,
    reviewType: type,
    type,
    critical: Boolean(check.critical),
    status: reviewed.status,
    matchedSentence: reviewed.match?.sentence || "",
    contradictionSentence: reviewed.contradiction?.sentence || "",
    expectedHits: unique(reviewed.match?.phraseHits || []),
    semanticHits: unique(reviewed.match?.semanticHits || []),
    contradictionHits: unique(reviewed.contradiction?.contradictionHits || []),
    subjectHits: unique(reviewed.match?.subjectHits || reviewed.contradiction?.subjectHits || []),
    supportSentences: reviewed.match?.supportingSentences || [],
    conflictFamily: reviewed.contradiction ? conflictFamily : "",
    matchStrength: reviewed.match?.matchStrength || "",
    supportModeLabel: reviewed.supportModeLabel,
    mixedSignal: reviewed.mixedSignal,
    consistencyMode: reviewed.consistencyMode,
    score: reviewed.score
  };
}

export function reviewFactChecks(factChecks = [], pastedOutput = "") {
  const sentences = splitSentences(pastedOutput || "");
  if (!factChecks.length) {
    return { results: [], alignedCount: 0, contradictedCount: 0, coveragePercent: 0, criticalMisses: [], contradictionLabels: [] };
  }

  const results = factChecks.map(check => check.type === "number" ? reviewNumberFact(check, sentences) : reviewPhraseFact(check, sentences, check.type || "date"));
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

export function reviewRequiredCaveats(requiredCaveats = [], pastedOutput = "") {
  const sentences = splitSentences(pastedOutput || "");
  if (!requiredCaveats.length) {
    return { results: [], alignedCount: 0, contradictedCount: 0, coveragePercent: 0, criticalMisses: [], contradictionLabels: [] };
  }

  const results = requiredCaveats.map(caveat => {
    const reviewed = genericMatchReview(sentences, {
      ...caveat,
      positivePhrases: caveat.requiredPhrases || [],
      supportCueGroups: caveat.supportCueGroups || caveat.semanticCueGroups || []
    }, "caveat");

    return {
      id: caveat.id,
      label: caveat.label,
      reviewType: "caveat",
      critical: Boolean(caveat.critical),
      status: reviewed.status,
      matchedSentence: reviewed.match?.sentence || "",
      contradictionSentence: reviewed.contradiction?.sentence || "",
      requiredHits: unique(reviewed.match?.phraseHits || []),
      semanticHits: unique(reviewed.match?.semanticHits || []),
      contradictionHits: unique(reviewed.contradiction?.contradictionHits || []),
      subjectHits: unique(reviewed.match?.subjectHits || reviewed.contradiction?.subjectHits || []),
      supportSentences: reviewed.match?.supportingSentences || [],
      mixedSignal: reviewed.mixedSignal,
      consistencyMode: reviewed.consistencyMode,
      conflictFamily: reviewed.contradiction ? "missing caveat or overclaim" : "",
      matchStrength: reviewed.match?.matchStrength || "",
      supportModeLabel: reviewed.supportModeLabel,
      score: reviewed.score
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
