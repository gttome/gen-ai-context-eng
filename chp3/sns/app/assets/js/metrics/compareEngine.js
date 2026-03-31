function strongestActionReason(card, strongestAction) {
  if (strongestAction === "include") {
    const reasons = [];
    if (card.essential) reasons.push("it materially changes the answer or required format");
    if (card.authority === "High") reasons.push("it is one of the strongest sources available");
    if (card.recency === "Current") reasons.push("it is current enough to lead the package");
    return `Include is stronger here because ${reasons.join(" and ") || "the card should stay visible in full"}.`;
  }
  if (strongestAction === "summarize") {
    return "Summarize is stronger here because the information still helps, but full inclusion spends more budget than the task needs.";
  }
  if (strongestAction === "retrieveLater") {
    return "Retrieve Later is stronger here because the material is useful for follow-up or edge cases, not for the core answer path.";
  }
  return "Omit is stronger here because this card weakens focus through staleness, duplication, low authority, or non-essential background.";
}

function learnerRisk(card, learnerAction, strongestAction) {
  if (learnerAction === "unclassified") {
    return "Leaving the card unclassified keeps the package hard to defend and harder to review.";
  }
  if (strongestAction === "include" && learnerAction !== "include") {
    return "Your choice hides answer-shaping evidence that should stay directly visible.";
  }
  if (strongestAction === "summarize" && learnerAction === "include") {
    return "Your choice keeps more text than the task needs, so the package becomes heavier without gaining much value.";
  }
  if (strongestAction === "retrieveLater" && learnerAction === "include") {
    return "Your choice loads follow-up detail into the core package too early, which crowds higher-value evidence.";
  }
  if (strongestAction === "omit" && learnerAction !== "omit") {
    return "Your choice keeps distracting material alive even though the package gets stronger without it.";
  }
  if (strongestAction === "include" && learnerAction === "summarize") {
    return "Your summary keeps some value, but it risks hiding wording or evidence that should remain explicit.";
  }
  return "Your choice is workable, but the strongest-practice action keeps the package easier to trust, review, and reuse.";
}

function strongestActionForCard(mission, card) {
  return mission?.strongestPractice?.actions?.[card.id] || card.idealAction || "omit";
}

export function buildComparison(mission, classifications) {
  const rows = mission.cards.map(card => {
    const learnerAction = classifications[card.id]?.action || "unclassified";
    const strongestAction = strongestActionForCard(mission, card);
    return {
      id: card.id,
      title: card.title,
      learnerAction,
      strongestAction,
      match: learnerAction === strongestAction,
      strongerReason: strongestActionReason(card, strongestAction),
      learnerRisk: learnerRisk(card, learnerAction, strongestAction),
      cardMeta: {
        recency: card.recency,
        authority: card.authority,
        essential: Boolean(card.essential),
        sourceType: card.sourceType,
        branchFlag: card.branchFlag || ""
      }
    };
  });

  const matches = rows.filter(row => row.match).length;
  const differences = rows.filter(row => !row.match);
  return {
    rows,
    matches,
    differences,
    commentary: mission?.strongestPractice?.commentary || [],
    teachingFocus: mission?.branchVariant?.debriefFocus || [],
    alignmentPercent: Math.round((matches / rows.length) * 100)
  };
}
