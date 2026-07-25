function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function buildLabel(score) {
  if (score >= 85) return "Strong";
  if (score >= 65) return "Usable";
  if (score >= 45) return "Mixed";
  return "Weak";
}

function evaluateKeywordRules(normalizedOutput, phrases = [], { weight = 12, discouraged = false } = {}) {
  const matched = [];
  const missed = [];
  for (const phrase of phrases) {
    if (normalizedOutput.includes(normalize(phrase))) matched.push(phrase);
    else missed.push(phrase);
  }
  const penalty = discouraged ? matched.length * weight : missed.length * weight;
  return { matched, missed, penalty };
}

export function analyzeExternalOutput(scenario, output) {
  if (!scenario?.manualExternalComparison) return null;

  const raw = String(output || "").trim();
  if (!raw) {
    return {
      score: null,
      label: "Not scored yet",
      summary: "Paste an external-model result to score it against the authored watchtower heuristics.",
      strengths: [],
      risks: [],
      matchedRequired: [],
      missingRequired: [],
      hitDiscouraged: [],
      requiredHits: 0,
      requiredTotal: 0,
      discouragedHits: 0,
      sentences: 0
    };
  }

  const heuristics = scenario.externalHeuristics || {};
  const requiredAnchors = heuristics.requiredKeywords || heuristics.requiredPhrases || [];
  const discouragedAnchors = heuristics.discouragedKeywords || heuristics.discouragedPhrases || [];
  const normalized = normalize(raw);
  const requiredRule = evaluateKeywordRules(normalized, requiredAnchors, { weight: 12, discouraged: false });
  const discouragedRule = evaluateKeywordRules(normalized, discouragedAnchors, { weight: 16, discouraged: true });
  const sentenceCount = raw.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean).length;

  let score = 100;
  score -= requiredRule.penalty;
  score -= discouragedRule.penalty;
  if (raw.length < 70) score -= 8;
  if (sentenceCount < 2) score -= 5;
  score = Math.max(0, Math.min(100, score));

  const strengths = [];
  const risks = [];

  if (requiredRule.matched.length) {
    strengths.push(`Kept ${requiredRule.matched.length} required anchor${requiredRule.matched.length === 1 ? "" : "s"} from the authored comparison packet.`);
  }
  if (!requiredRule.matched.length) {
    risks.push("Did not preserve any of the required watchtower anchors.");
  }
  if (requiredRule.missed.length) {
    risks.push(`Missing required anchor${requiredRule.missed.length === 1 ? "" : "s"}: ${requiredRule.missed.join(", ")}.`);
  }
  if (discouragedRule.matched.length) {
    risks.push(`Included discouraged language: ${discouragedRule.matched.join(", ")}.`);
  }
  if (sentenceCount < 2) {
    risks.push("The external result is too compressed to show a stable, comparison-ready explanation.");
  }
  if (!discouragedRule.matched.length && requiredRule.matched.length >= Math.max(1, Math.ceil(requiredAnchors.length / 2))) {
    strengths.push("Avoided the most obvious regression-prone phrases.");
  }

  const weakSummary = heuristics.weakSummary || "The external output still weakens the guarded behaviors this scenario is trying to preserve.";
  const strongSummary = heuristics.strongSummary || "The external output stayed aligned to the protected baseline behaviors.";

  return {
    score,
    label: buildLabel(score),
    summary: score >= 70 ? strongSummary : weakSummary,
    strengths,
    risks,
    matchedRequired: requiredRule.matched,
    missingRequired: requiredRule.missed,
    hitDiscouraged: discouragedRule.matched,
    requiredHits: requiredRule.matched.length,
    requiredTotal: requiredAnchors.length,
    discouragedHits: discouragedRule.matched.length,
    sentences: sentenceCount
  };
}

export function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
