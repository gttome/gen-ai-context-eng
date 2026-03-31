export const SECTION_PURPOSES = {
  ROLE: {
    question: "Who is the assistant and what stable job stance should govern the run?",
    why: "ROLE should be stable. It gives the model an operating stance before it sees evidence or the task."
  },
  RULES: {
    question: "What must govern every run before the model sees evidence or the task?",
    why: "RULES should declare must-follow constraints early so the model does not treat them like optional notes."
  },
  REFERENCE: {
    question: "What approved evidence should ground the answer instead of generic knowledge?",
    why: "REFERENCE is strongest when approved evidence is visibly separate from instructions and the current task."
  },
  "DYNAMIC FACTS": {
    question: "What changes for this run and must be refreshed explicitly?",
    why: "DYNAMIC FACTS are strongest when they stay compact, current, and obviously refreshable."
  },
  TASK: {
    question: "What exactly is the model being asked to do in this run?",
    why: "TASK is strongest when the job is visible only after the governing stance, rules, and evidence are clear."
  },
  OUTPUT: {
    question: "What response shape will make the result easy to review?",
    why: "OUTPUT should make the answer easy to compare across runs and reviewers."
  },
  CHECKS: {
    question: "What should happen when information is missing, stale, or contradictory?",
    why: "CHECKS should keep uncertainty, silence, and conflict handling visible instead of leaving them implicit."
  }
};

function currentSectionForBlock(runState, blockId, sectionOrder) {
  for (const section of sectionOrder) {
    if ((runState.sections?.[section] || []).includes(blockId)) return section;
  }
  return null;
}

function strongestSectionForBlock(scenario, blockId, sectionOrder) {
  for (const section of sectionOrder) {
    if ((scenario.strongestPractice?.sections?.[section] || []).includes(blockId)) return section;
  }
  return null;
}

function reasonForPreferredSection(block, strongestSection) {
  const cues = [];
  if (strongestSection) cues.push(`${strongestSection} keeps ${block.label} legible because ${SECTION_PURPOSES[strongestSection]?.why?.toLowerCase() || "it matches the card's job."}`);
  if (block.trustLevel === "authoritative") cues.push("Authoritative evidence is weaker when it is mixed with instructions because the model may blur what to obey and what to cite.");
  if (block.trustLevel === "weak") cues.push("Weak material needs visible boundaries so it cannot quietly outrank stronger evidence.");
  if (block.freshnessCue === "stale") cues.push("Stale material must stay visibly bounded so it does not masquerade as a fresh fact.");
  if (block.trustLevel === "run-specific") cues.push("Run-specific facts should be fast to refresh before each external test.");
  return cues;
}

function reasonWhyWeaker(block, currentSection, strongestSection) {
  const lines = [];
  if (currentSection && strongestSection && currentSection !== strongestSection) {
    lines.push(`${currentSection} is plausible because the card sounds related to that section, but it is weaker than ${strongestSection} for this scenario.`);
  }
  if (currentSection === "RULES" && strongestSection === "CHECKS") lines.push("Leaving it in RULES hides the conditional branch inside general constraints instead of making uncertainty handling visible at the end of the package.");
  if (currentSection === "REFERENCE" && strongestSection === "DYNAMIC FACTS") lines.push("Leaving it in REFERENCE makes a changing fact look like stable evidence.");
  if (currentSection === "CHECKS" && strongestSection === "RULES") lines.push("Leaving it in CHECKS delays a must-follow rule that should shape the run from the start.");
  if (currentSection === "REFERENCE" && block.trustLevel !== "authoritative") lines.push("REFERENCE works best for approved evidence. This card is likely to create source blur here.");
  if (currentSection === "DYNAMIC FACTS" && block.freshnessCue === "stale") lines.push("DYNAMIC FACTS should make the current run obvious. A stale note here misrepresents what is current.");
  return lines;
}

function nextMoveForCoach(block, currentSection, strongestSection, statusTone) {
  if (statusTone === "good") return `Keep ${block.label} in ${strongestSection} and use it as an anchor while you tighten weaker cards.`;
  if (statusTone === "warn") return `Move ${block.label} to ${strongestSection} if you want the section purpose to stay easier to inspect and compare.`;
  if (statusTone === "risk") return `Move ${block.label} out of ${currentSection} and place it in ${strongestSection} so unlike material stops competing for attention.`;
  return `Decide where ${block.label} is easiest to review, then place it in ${strongestSection || block.type}.`;
}

export function getSelectedBlock(scenario, runState) {
  if (!scenario) return null;
  const id = runState?.selectedBlockId;
  return scenario.blocks.find((block) => block.id === id) || scenario.blocks[0] || null;
}

export function buildBlockCoach(scenario, block, runState, config) {
  if (!scenario || !block) return null;
  const currentSection = currentSectionForBlock(runState, block.id, config.sectionOrder);
  const strongestSection = strongestSectionForBlock(scenario, block.id, config.sectionOrder);
  let status = {
    tone: "pending",
    label: "Decision pending",
    detail: "This card is still unplaced, so its job in the envelope has not been made visible yet."
  };

  if (currentSection === strongestSection && currentSection) {
    status = { tone: "good", label: "Strong placement", detail: `${block.label} is in ${strongestSection}, which matches the strongest-practice pattern for this case.` };
  } else if (currentSection && (block.acceptableSections || []).includes(currentSection)) {
    status = { tone: "warn", label: "Plausible but weaker", detail: `${block.label} can work in ${currentSection}, but ${strongestSection} makes its job more legible in this scenario.` };
  } else if (currentSection) {
    status = { tone: "risk", label: "Likely misplaced", detail: `${block.label} is in ${currentSection}, which mixes its job with the wrong kind of material.` };
  }

  const alternateSections = (block.acceptableSections || [])
    .filter((section) => section !== strongestSection)
    .map((section) => ({ section, why: `${section} is a tempting alternative because the text sounds related to that section, but it gives up some reviewability compared with ${strongestSection}.` }));
  const weakerWhy = Array.from(new Set(reasonWhyWeaker(block, currentSection, strongestSection)));
  const cues = [];
  if ((block.acceptableSections || []).length > 1) cues.push(`This card can plausibly live in ${block.acceptableSections.join(" or ")}. Decide which section makes its job easiest to inspect.`);
  else cues.push("There is a clearer home for this card. Place it where its purpose stays obvious to a reviewer.");
  cues.push(...reasonForPreferredSection(block, strongestSection));
  cues.push(...weakerWhy);

  return {
    currentSection,
    strongestSection,
    status,
    question: (SECTION_PURPOSES[block.type] || SECTION_PURPOSES.ROLE).question,
    preferredWhy: strongestSection ? `${strongestSection} is stronger here because ${SECTION_PURPOSES[strongestSection]?.why?.toLowerCase() || "it matches the card's job."}` : "Use the section that keeps the card easiest to review.",
    alternateSections,
    weakerWhy,
    cues: Array.from(new Set(cues)).slice(0, 6),
    nextMove: nextMoveForCoach(block, currentSection, strongestSection, status.tone)
  };
}

export function buildSectionCoach(scenario, runState, section, config) {
  const blockMap = Object.fromEntries((scenario?.blocks || []).map((block) => [block.id, block]));
  const currentIds = runState.sections?.[section] || [];
  const expectedIds = scenario?.strongestPractice?.sections?.[section] || [];
  const missing = expectedIds.filter((id) => !currentIds.includes(id)).map((id) => blockMap[id]?.label || id);
  const extras = currentIds.filter((id) => !expectedIds.includes(id)).map((id) => blockMap[id]?.label || id);
  const weakerCards = currentIds.map((id) => ({ block: blockMap[id], coach: buildBlockCoach(scenario, blockMap[id], runState, config) }))
    .filter((item) => item.block && item.coach && item.coach.status.tone === "warn")
    .map((item) => `${item.block.label}: ${item.coach.preferredWhy}`);
  let summary = `${section} is currently aligned with its purpose.`;
  if (!currentIds.length) summary = `${section} is empty, so the package is hiding a part of the operating logic.`;
  else if (missing.length || extras.length) summary = `${section} is doing some work, but it is still weaker than the strongest-practice pattern.`;
  else if (weakerCards.length) summary = `${section} contains plausible choices that are still giving up some legibility.`;

  return {
    section,
    summary,
    strongerWhy: scenario?.strongestPractice?.rationale?.[section] || SECTION_PURPOSES[section]?.why,
    missing,
    extras,
    weakerCards,
    nextMove: missing.length ? `Add the missing anchor material to ${section} before rerunning.` : extras.length ? `Move the extra material out of ${section} so unlike things stay separate.` : weakerCards.length ? `Tighten the plausible-but-weaker placements in ${section} so the section reads more cleanly.` : `Keep ${section} stable and use it as an anchor while you tighten weaker sections.`
  };
}

export function renderCoachStatusPill(status) {
  return `<span class="coach-pill ${status.tone}">${status.label}</span>`;
}

export function buildReadinessChecklist(scenario, runState, metrics, config) {
  const counts = metrics.sectionCounts || Object.fromEntries((config.sectionOrder || []).map((section) => [section, (runState.sections?.[section] || []).length]));
  return [
    { label: "All seven envelope sections are represented.", passed: config.sectionOrder.every((section) => (counts[section] || 0) > 0) },
    { label: "Precedence is explicit enough that the model does not need to guess.", passed: metrics.metrics.precedenceExplicitness >= 80 },
    { label: "The output contract is reviewable.", passed: metrics.metrics.outputUsability >= 80 },
    { label: "Missing-information handling is explicit.", passed: metrics.metrics.handlingReadiness >= 80 },
    { label: "The envelope is ready for an external test run.", passed: metrics.composite >= 72 }
  ];
}
