import { deepClone } from "../utils/helpers.js";

function essentialIncludeCap(mission) {
  const essentialCount = mission.cards.filter(card => card.essential).length;
  return Math.max(3, Math.min(3, essentialCount));
}

function enrichStrictBudgetCard(card) {
  if (card.isBranchOverlay) {
    return {
      ...card,
      branchFlag: "Branch-only constraint",
      branchNote: "This replay injects a compact branch-only card so the run feels materially different from the core mission. It should shape the answer without automatically demanding another full direct include."
    };
  }
  if (card.essential) {
    return {
      ...card,
      branchFlag: "Protect in full",
      branchNote: "This card materially shapes the answer. Keep it fully visible unless you can defend shrinking it."
    };
  }
  if (card.tokenCost >= 22 || card.idealAction === "omit" || card.idealAction === "retrieveLater") {
    return {
      ...card,
      branchFlag: "Compression candidate",
      branchNote: "This card is expensive relative to the tighter budget. Summarize it, defer it, or leave it out unless it changes the answer."
    };
  }
  return {
    ...card,
    branchFlag: "Earn its footprint",
    branchNote: "Under the stricter budget, this card has to prove it changes the answer enough to survive."
  };
}

function enrichAuthorityFreshnessCard(card) {
  if (card.isBranchOverlay) {
    return {
      ...card,
      branchFlag: "Branch-only current evidence",
      branchNote: "This replay injects a fresher branch-only card so the evidence landscape shifts, not just the coaching text."
    };
  }
  if (card.authority === "High" && card.recency === "Current") {
    return {
      ...card,
      branchFlag: "Lead evidence",
      branchNote: "This is the kind of card that should set the direction of the answer in this drill."
    };
  }
  if (card.authority === "Low" || card.recency === "Stale") {
    return {
      ...card,
      branchFlag: "Tempting but risky",
      branchNote: "This card may feel useful, but it should not outrank fresher or more authoritative evidence."
    };
  }
  return {
    ...card,
    branchFlag: "Support only if needed",
    branchNote: "This card can support the answer, but it should not steer the answer away from stronger evidence."
  };
}

function sortByBranchPriority(cards, branchId) {
  if (branchId === "strict-budget") {
    return [...cards].sort((a, b) => {
      const aRank = a.isBranchOverlay ? -1 : a.essential ? 0 : a.tokenCost >= 22 ? 2 : 1;
      const bRank = b.isBranchOverlay ? -1 : b.essential ? 0 : b.tokenCost >= 22 ? 2 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return a.tokenCost - b.tokenCost;
    });
  }
  if (branchId === "authority-freshness") {
    const recencyRank = { Current: 0, Aging: 1, Stale: 2 };
    const authorityRank = { High: 0, Medium: 1, Low: 2 };
    return [...cards].sort((a, b) => {
      const aRank = (a.isBranchOverlay ? -1 : 0) + (authorityRank[a.authority] ?? 2) + (recencyRank[a.recency] ?? 2);
      const bRank = (b.isBranchOverlay ? -1 : 0) + (authorityRank[b.authority] ?? 2) + (recencyRank[b.recency] ?? 2);
      if (aRank !== bRank) return aRank - bRank;
      if (a.essential !== b.essential) return a.essential ? -1 : 1;
      return a.tokenCost - b.tokenCost;
    });
  }
  return cards;
}

function applyBranchCardPack(baseMission, branch, enrichCard) {
  const mission = deepClone(baseMission);
  const suppressed = new Set(branch.suppressedCardIds || []);
  const overlayCards = (branch.overlayCards || []).map(card => ({ ...card, isBranchOverlay: true }));
  const survivingBaseCards = mission.cards.filter(card => !suppressed.has(card.id));
  mission.cards = sortByBranchPriority([...survivingBaseCards, ...overlayCards].map(enrichCard), branch.id);
  mission.branchVariant = {
    ...(mission.branchVariant || {}),
    overlayCount: overlayCards.length,
    suppressedCount: suppressed.size,
    overlayLabel: overlayCards.length ? `${overlayCards.length} branch-only card${overlayCards.length === 1 ? "" : "s"} added` : "No branch-only cards added"
  };
  return mission;
}

function strongestPracticeFromMission(mission, commentary = []) {
  return {
    actions: Object.fromEntries(mission.cards.map(card => [card.id, card.idealAction || "omit"])),
    commentary
  };
}

function buildStrictBudgetVariant(baseMission, branch) {
  const mission = applyBranchCardPack(baseMission, branch, enrichStrictBudgetCard);
  const includeCap = essentialIncludeCap(mission);
  mission.branchVariant = {
    id: branch.id,
    title: branch.title,
    modeLabel: "Harder selection constraint",
    checklist: [
      `Keep no more than ${includeCap} direct-include cards.`,
      "Push background and duplicate detail into Summarize or Retrieve Later.",
      "Expect at least one branch-only card or overlay to affect your replay choices.",
      "Prove the tighter budget changed your package, not just your score."
    ],
    overlayCount: mission.branchVariant.overlayCount,
    suppressedCount: mission.branchVariant.suppressedCount,
    overlayLabel: mission.branchVariant.overlayLabel,
    debriefFocus: [
      "Show that the tighter budget changed which evidence stayed fully visible.",
      "Protect answer-shaping evidence first, then compress anything that mainly adds background or duplication.",
      "A shorter answer is only better when it still preserves the decisive rule, fact pattern, and required caveat."
    ]
  };
  mission.taskBrief = `${baseMission.taskBrief} In this replay, you may keep no more than ${includeCap} direct-include cards.`;
  mission.dynamicFacts = [
    ...baseMission.dynamicFacts,
    `Bonus drill constraint: no more than ${includeCap} direct-include cards.`,
    `Replay pack shift: ${mission.branchVariant.overlayLabel}; ${mission.branchVariant.suppressedCount} lower-value base card${mission.branchVariant.suppressedCount === 1 ? " was" : "s were"} suppressed.`,
    "Background detail must shrink or move out unless it materially changes the answer."
  ];
  mission.outputContract = [
    ...baseMission.outputContract,
    "Keep each section to one or two sentences if possible"
  ];

  const compressibleIds = mission.cards.filter(card => !card.essential && (card.tokenCost >= 22 || ["retrieveLater", "omit", "summarize"].includes(card.idealAction))).map(card => card.id);
  mission.strongestPractice = strongestPracticeFromMission(
    mission,
    branch.strongestPracticeOverride?.commentary || [
      "The stricter-budget replay should protect only the few cards that directly change the answer.",
      "Replay-only constraint cards can still matter, but they often belong in Summarize rather than another full direct include.",
      "Older background and follow-up detail should move out earlier than in the core mission."
    ]
  );

  return {
    mission,
    policy: {
      id: branch.id,
      title: branch.title,
      modeLabel: "Harder selection constraint",
      includeCap,
      riskyIncludeIds: compressibleIds,
      maxRiskyIncludes: 1,
      exportRules: [
        `No more than ${includeCap} direct-include cards.`,
        "Compress support detail aggressively.",
        "Keep the answer obviously tighter than the core run.",
        "Use at least one branch-only card if it materially shapes the answer."
      ],
      debriefFocus: mission.branchVariant.debriefFocus
    }
  };
}

function buildAuthorityFreshnessVariant(baseMission, branch) {
  const mission = applyBranchCardPack(baseMission, branch, enrichAuthorityFreshnessCard);
  const leadIds = mission.cards.filter(card => card.authority === "High" && card.recency === "Current").map(card => card.id);
  const riskyIds = mission.cards.filter(card => card.authority === "Low" || card.recency === "Stale").map(card => card.id);

  mission.branchVariant = {
    id: branch.id,
    title: branch.title,
    modeLabel: "Source-of-record discipline",
    checklist: [
      "Let current high-authority evidence set the answer direction.",
      "Aging or lower-authority commentary can support, but it should not lead.",
      "Expect at least one branch-only current evidence card to matter in this replay.",
      "Be explicit when you are deprioritizing weaker background."
    ],
    overlayCount: mission.branchVariant.overlayCount,
    suppressedCount: mission.branchVariant.suppressedCount,
    overlayLabel: mission.branchVariant.overlayLabel,
    debriefFocus: [
      "Make the current source-of-record evidence visibly lead the answer.",
      "Use weaker or aging material only as secondary support, not as the answer's spine.",
      "When the evidence base is uneven, say that plainly instead of letting weaker commentary fill the gap."
    ]
  };
  mission.taskBrief = `${baseMission.taskBrief} In this replay, current high-authority material must lead, and weaker commentary should stay visibly secondary.`;
  mission.dynamicFacts = [
    ...baseMission.dynamicFacts,
    "Bonus drill constraint: at least two lead-evidence cards should remain fully included when available.",
    `Replay pack shift: ${mission.branchVariant.overlayLabel}; ${mission.branchVariant.suppressedCount} weaker base card${mission.branchVariant.suppressedCount === 1 ? " was" : "s were"} suppressed.`,
    "Weaker or stale cards should not steer the answer."
  ];
  mission.outputContract = [
    ...baseMission.outputContract,
    "Make the source-of-record evidence visibly lead the answer"
  ];
  mission.strongestPractice = strongestPracticeFromMission(
    mission,
    branch.strongestPracticeOverride?.commentary || [
      "The authority-versus-freshness replay should make current source-of-record evidence visibly lead the answer.",
      "Branch-only fresh evidence should change what the best package looks like, not just how the coaching sounds.",
      "Comfortable but aging summaries can support the answer, but they should not steer it."
    ]
  );

  return {
    mission,
    policy: {
      id: branch.id,
      title: branch.title,
      modeLabel: "Source-of-record discipline",
      leadIncludeIds: leadIds.slice(0, Math.min(2, leadIds.length)),
      riskyIncludeIds: riskyIds,
      maxRiskyIncludes: 0,
      exportRules: [
        "Lead with current high-authority evidence.",
        "Do not let stale or low-authority background steer the answer.",
        "Name uncertainty rather than filling gaps with weaker commentary.",
        "Let the branch-only current evidence visibly affect the replay when it matters."
      ],
      debriefFocus: mission.branchVariant.debriefFocus
    }
  };
}

export function deriveMissionVariant(baseMission, activeBonusBranch = null) {
  if (!baseMission || !activeBonusBranch) {
    return { mission: baseMission ? deepClone(baseMission) : null, policy: null };
  }
  if (activeBonusBranch.id === "strict-budget") return buildStrictBudgetVariant(baseMission, activeBonusBranch);
  if (activeBonusBranch.id === "authority-freshness") return buildAuthorityFreshnessVariant(baseMission, activeBonusBranch);
  return {
    mission: deepClone(baseMission),
    policy: {
      id: activeBonusBranch.id,
      title: activeBonusBranch.title,
      modeLabel: "Bonus drill",
      exportRules: [activeBonusBranch.coachNote || activeBonusBranch.description]
    }
  };
}
