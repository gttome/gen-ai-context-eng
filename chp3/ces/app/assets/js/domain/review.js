import { averageScores, clamp, scoreSummary } from "./review-metrics.js";

function containsAny(text, items = []) {
  const lower = text.toLowerCase();
  return items.some((item) => lower.includes(item.toLowerCase()));
}

function countMatches(text, items = []) {
  const lower = text.toLowerCase();
  return items.filter((item) => lower.includes(item.toLowerCase())).length;
}

export function analyzeObservedOutput(scenario, runState, metrics, observedText) {
  if (!observedText || !observedText.trim()) {
    return {
      hasOutput: false,
      summary: "No observed output has been pasted yet. Structural review is still available.",
      scores: { taskFit: 0, evidenceUse: 0, uncertaintyHandling: 0, formatFit: 0 },
      notes: ["Paste an external-model response to review how the structure affected the outcome."],
      nextMove: "Run the envelope in your external model, paste the response back, then compare the result with the structural warnings."
    };
  }

  const text = observedText.trim();
  const requiredHits = countMatches(text, scenario.reviewRubric.requiredPhrases);
  const preferredHits = countMatches(text, scenario.reviewRubric.preferredPhrases);
  const uncertaintyHits = countMatches(text, scenario.reviewRubric.uncertaintyPhrases);
  const formatHits = countMatches(text, scenario.reviewRubric.formatMarkers);

  const taskFit = clamp(35 + (requiredHits * 10) + (preferredHits * 5));
  let evidenceUse = clamp(30 + (preferredHits * 12) + (requiredHits * 6));
  const uncertaintyHandling = clamp(20 + (uncertaintyHits * 18) + (runState.missingInfoHandling === scenario.strongestPractice.missingInfoHandling ? 10 : 0));
  let formatFit = clamp(25 + (formatHits * 20));
  if (metrics.metrics.outputUsability < 60) formatFit = clamp(formatFit - 10);
  if (metrics.metrics.precedenceExplicitness < 50) evidenceUse = clamp(evidenceUse - 8);

  const notes = [];
  if (requiredHits < Math.max(2, Math.floor(scenario.reviewRubric.requiredPhrases.length / 2))) {
    notes.push("The observed output is missing several task-critical signals from the package.");
  } else {
    notes.push("The observed output reflects the core task and package boundaries reasonably well.");
  }

  if (!containsAny(text, scenario.reviewRubric.preferredPhrases)) {
    notes.push("Evidence use looks generic. The response is not clearly echoing the strongest evidence or conflict rule.");
  } else {
    notes.push("The response appears to reference the stronger evidence instead of relying on generic language.");
  }

  if (!containsAny(text, scenario.reviewRubric.uncertaintyPhrases) && runState.missingInfoHandling === scenario.strongestPractice.missingInfoHandling) {
    notes.push("Uncertainty handling is weaker than the package design intended.");
  } else if (containsAny(text, scenario.reviewRubric.uncertaintyPhrases)) {
    notes.push("The response acknowledges limits or missing information instead of silently guessing.");
  }

  if (formatHits < Math.max(1, Math.floor(scenario.reviewRubric.formatMarkers.length / 2))) {
    notes.push("The answer format is not fully following the requested output contract.");
  } else {
    notes.push("The answer shape is reviewable and close to the requested contract.");
  }

  const average = averageScores([taskFit, evidenceUse, uncertaintyHandling, formatFit]);
  const summary = scoreSummary(average);

  let nextMove = "Tighten the package where the diagnostic notes point, then rerun the same case for an apples-to-apples comparison.";
  if (evidenceUse < 65) nextMove = "Strengthen source ordering or precedence so the response leans on the approved evidence instead of generic filler.";
  else if (formatFit < 65) nextMove = "Make the output contract more explicit and rerun the same case so the answer becomes easier to review.";
  else if (uncertaintyHandling < 65) nextMove = "Clarify what the model should do when information is missing so uncertainty becomes visible instead of implied.";

  return { hasOutput: true, summary, nextMove, scores: { taskFit, evidenceUse, uncertaintyHandling, formatFit }, notes };
}
