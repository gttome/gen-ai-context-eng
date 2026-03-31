import { unique } from "../utils/helpers.js";

export const NEGATION_MARKERS = [
  "no", "not", "never", "without", "cannot", "can't", "isn't", "wasn't", "won't", "didn't", "doesn't", "aren't", "lack", "lacks", "lacking"
];

const WORD_NUMBER_MAP = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10"
};

const PHRASE_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "at", "by", "from", "with", "that", "this", "these", "those", "it", "its", "their", "his", "her", "be", "is", "are", "was", "were", "been", "being", "as", "into", "than"
]);

export function normalizeText(text = "") {
  return String(text).toLowerCase();
}

function stemToken(token = "") {
  let value = String(token).toLowerCase();
  if (WORD_NUMBER_MAP[value]) return WORD_NUMBER_MAP[value];
  value = value.replace(/[^a-z0-9%]+/g, "").trim();
  if (!value) return "";
  if (value.length > 5 && value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.length > 5 && value.endsWith("ing")) return value.slice(0, -3);
  if (value.length > 4 && value.endsWith("ed")) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith("s") && !value.endsWith("ss")) return value.slice(0, -1);
  return value;
}

function comparableTokens(text = "") {
  return normalizeText(text)
    .replace(/[%]/g, " % ")
    .match(/[a-z0-9%]+/g)?.map(stemToken).filter(Boolean) || [];
}

export function splitSentences(text = "") {
  return String(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function splitClauses(text = "") {
  return String(text)
    .split(/[;:•]|\s+-\s+|\s+—\s+|,\s+(?=[a-z])/i)
    .map(item => item.trim())
    .filter(Boolean);
}

export function buildWindows(sentences = [], radius = 1) {
  return sentences.map((sentence, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(sentences.length - 1, index + radius);
    const windowSentences = sentences.slice(start, end + 1);
    return {
      index,
      sentence,
      start,
      end,
      indices: windowSentences.map((_, offset) => start + offset),
      text: windowSentences.join(" ")
    };
  });
}

function orderedWithinGap(textTokens = [], candidateTokens = [], maxGap = 4) {
  if (!candidateTokens.length) return false;
  let cursor = -1;
  for (const token of candidateTokens) {
    let foundIndex = -1;
    for (let index = cursor + 1; index < textTokens.length; index += 1) {
      if (textTokens[index] !== token) continue;
      if (cursor === -1 || index - cursor <= maxGap + 1) {
        foundIndex = index;
        break;
      }
    }
    if (foundIndex === -1) return false;
    cursor = foundIndex;
  }
  return true;
}

function tokensContainAll(textTokens = [], candidateTokens = []) {
  if (!candidateTokens.length) return false;
  const haystack = new Set(textTokens);
  return candidateTokens.every(token => haystack.has(token));
}

export function containsCandidate(text = "", candidate = "") {
  const normalizedText = normalizeText(text);
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate.trim()) return false;
  if (normalizedText.includes(normalizedCandidate)) return true;
  const candidateTokens = comparableTokens(candidate).filter(token => !PHRASE_STOP_WORDS.has(token));
  if (!candidateTokens.length) return false;
  const textTokens = comparableTokens(text);
  if (!tokensContainAll(textTokens, candidateTokens)) return false;
  if (candidateTokens.length === 1) return true;
  return orderedWithinGap(textTokens, candidateTokens, candidateTokens.length >= 4 ? 5 : 3);
}

export function phraseMatches(text = "", phrases = []) {
  return unique((phrases || []).filter(phrase => containsCandidate(text, phrase)));
}

export function cueHits(text = "", cues = []) {
  return unique((cues || []).filter(cue => containsCandidate(text, cue)));
}

function groupLabel(group, index) {
  if (typeof group === "string") return group;
  if (Array.isArray(group)) return group[0] || `group-${index + 1}`;
  return group.label || group.any?.[0] || `group-${index + 1}`;
}

function normalizeGroup(group) {
  if (typeof group === "string") return { any: [group], label: group };
  if (Array.isArray(group)) return { any: group, label: group[0] || "group" };
  return {
    label: group.label,
    any: group.any || group.variants || [],
    all: group.all || []
  };
}

export function semanticGroupHits(text = "", groups = []) {
  return unique((groups || []).map((group, index) => {
    const normalized = normalizeGroup(group);
    const anyMatch = (normalized.any || []).some(candidate => containsCandidate(text, candidate));
    const allMatch = (normalized.all || []).length
      ? normalized.all.every(set => (Array.isArray(set) ? set : [set]).some(candidate => containsCandidate(text, candidate)))
      : false;
    return (anyMatch || allMatch) ? (normalized.label || groupLabel(group, index)) : null;
  }).filter(Boolean));
}

export function sentenceHasSubject(text = "", subjectCues = [], subjectCueGroups = []) {
  if (!subjectCues.length && !subjectCueGroups.length) return true;
  const cueMatchCount = cueHits(text, subjectCues).length;
  const groupMatchCount = semanticGroupHits(text, subjectCueGroups).length;
  return cueMatchCount >= Math.max(1, Math.min(2, subjectCues.length || 1)) || groupMatchCount >= 1;
}

export function negatedCueHits(text = "", cues = []) {
  const normalized = normalizeText(text);
  return unique((cues || []).filter(cue => {
    const cuePattern = normalizeText(cue).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return NEGATION_MARKERS.some(marker => {
      const markerPattern = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${markerPattern}\\b(?:\\s+\\w+){0,4}\\s+${cuePattern}`);
      return regex.test(normalized);
    });
  }));
}

export function numericTokens(text = "") {
  return unique([
    ...(String(text).match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(item => normalizeText(item)),
    ...(String(text).match(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi) || []).map(item => normalizeText(item)),
    ...(String(text).match(/\b\d+\s*percent\b/gi) || []).map(item => normalizeText(item).replace(/\s+/g, " "))
  ]);
}

export function labelSupportMode(matchStrength = "") {
  if (matchStrength === "semantic") return "Paraphrase-compatible in one sentence";
  if (matchStrength === "semantic-window") return "Paraphrase-compatible across nearby sentences";
  if (matchStrength === "window") return "Split across nearby sentences";
  if (matchStrength === "cue") return "Implied by cues only";
  return "Direct in one sentence";
}

export function scoreStatus({ status, critical, matchStrength }) {
  if (status === "contradicted") return 0;
  if (status === "aligned") {
    if (matchStrength === "cue") return critical ? 0.76 : 0.66;
    if (matchStrength === "semantic") return critical ? 0.9 : 0.82;
    if (matchStrength === "semantic-window") return critical ? 0.96 : 0.9;
    if (matchStrength === "window") return critical ? 0.95 : 0.88;
    return critical ? 1 : 0.9;
  }
  return critical ? 0 : 0.35;
}

export function directCueThreshold(cues = [], groups = []) {
  if (groups?.length) return 1;
  return Math.max(2, Math.min(3, Math.max(cues.length, 1)));
}

export function joinEvidenceSentences(sentences = []) {
  return unique(sentences.filter(Boolean)).slice(0, 3).join(" ");
}

export function bestMatch(directMatches = [], windowMatches = []) {
  const scoreItem = (item) => ((item.phraseHits?.length || 0) * 4)
    + ((item.semanticHits?.length || 0) * 3)
    + ((item.cueMatches?.length || 0) * 1)
    + ((item.subjectHits?.length || 0) * 1);

  const sortedDirect = [...directMatches].sort((a, b) => scoreItem(b) - scoreItem(a));
  if (sortedDirect.length) return sortedDirect[0];
  const sortedWindows = [...windowMatches].sort((a, b) => scoreItem(b) - scoreItem(a));
  return sortedWindows[0] || null;
}
