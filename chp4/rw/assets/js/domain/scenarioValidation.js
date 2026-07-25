const REQUIRED_SCENARIO_FIELDS = [
  "id",
  "title",
  "objective",
  "domain",
  "difficulty",
  "incidentSummary",
  "proposedChange",
  "baselineResult",
  "monitoringFollowUps"
];

function ensureString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function normalizeStandingCheck(check, index) {
  ensureString(check.id, `standingChecks[${index}].id`);
  ensureString(check.title, `standingChecks[${index}].title`);
  ensureString(check.expectedStatus, `standingChecks[${index}].expectedStatus`);
  const expectedStatus = check.expectedStatus.trim();
  const whatItProtects = typeof check.whatItProtects === "string" && check.whatItProtects.trim()
    ? check.whatItProtects.trim()
    : "A baseline-protected behavior that must be checked deliberately before the change ships.";
  const baselineProtectedBehavior = typeof check.baselineProtectedBehavior === "string" && check.baselineProtectedBehavior.trim()
    ? check.baselineProtectedBehavior.trim()
    : "The baseline preserved this behavior clearly enough that it should remain visible after the change.";
  const candidateObservation = typeof check.candidateObservation === "string" && check.candidateObservation.trim()
    ? check.candidateObservation.trim()
    : "Inspect the candidate change and decide whether this protected behavior improved, held, weakened, or became a trade-off.";
  const riskWhy = check.riskWhy || "";

  const interpretationPrompt = typeof check.interpretationPrompt === "string" && check.interpretationPrompt.trim()
    ? check.interpretationPrompt.trim()
    : `Ask whether the candidate still keeps this protection visible: ${whatItProtects}`;
  const strongestPracticeRead = typeof check.strongestPracticeRead === "string" && check.strongestPracticeRead.trim()
    ? check.strongestPracticeRead.trim()
    : `Strongest practice reads this as ${expectedStatus} because the baseline protected "${baselineProtectedBehavior}" while the candidate now shows: ${candidateObservation}`;
  const commonMistake = typeof check.commonMistake === "string" && check.commonMistake.trim()
    ? check.commonMistake.trim()
    : expectedStatus === "improved"
      ? "A common mistake is to under-credit a real improvement because the surrounding scenario still feels risky overall."
      : expectedStatus === "held"
        ? "A common mistake is to search for drama and miss that the baseline behavior mostly held."
        : expectedStatus === "tradeoff"
          ? "A common mistake is to reward the visible gain without naming the cost the baseline is now absorbing."
          : "A common mistake is to reward brevity or tone while the protected boundary has actually become weaker.";

  return {
    ...check,
    whatItProtects,
    baselineProtectedBehavior,
    candidateObservation,
    riskLevel: check.riskLevel || "Medium",
    riskWhy,
    interpretationPrompt,
    strongestPracticeRead,
    commonMistake
  };
}

function normalizeNarrative(scenario) {
  const strongestWhy = scenario.strongestPracticeDecision?.why || "Protect the baseline before rewarding the candidate change.";
  const riskyAnchors = (scenario.standingChecks || [])
    .filter((check) => ["weakened", "tradeoff"].includes(check.expectedStatus))
    .map((check) => `${check.title} was expected to show ${check.expectedStatus}.`);

  return {
    chooseWhy: scenario.decisionNarrative?.chooseWhy || strongestWhy,
    anchors: ensureArray(scenario.decisionNarrative?.anchors || riskyAnchors, "decisionNarrative.anchors"),
    alternativePaths: ensureArray(scenario.decisionNarrative?.alternativePaths || [], "decisionNarrative.alternativePaths"),
    monitoringWhy: scenario.decisionNarrative?.monitoringWhy || "Choose monitoring that remains proportional to the uncertainty left after the release judgment."
  };
}

export function validateScenarioRegistry(registry) {
  const packs = ensureArray(registry?.packs, "registry.packs").map((pack, index) => ({
    id: ensureString(pack.id, `registry.packs[${index}].id`),
    title: ensureString(pack.title, `registry.packs[${index}].title`),
    file: ensureString(pack.file, `registry.packs[${index}].file`),
    scenarioCount: Number(pack.scenarioCount || 0)
  }));
  if (!packs.length) {
    throw new Error("Scenario registry must declare at least one scenario pack.");
  }
  return { packs };
}

export function validateGlossary(payload) {
  const glossary = ensureArray(payload?.glossary, "glossary").map((item, index) => ({
    term: ensureString(item.term, `glossary[${index}].term`),
    definition: ensureString(item.definition, `glossary[${index}].definition`)
  }));
  return { glossary };
}

export function validatePackPayload(packPayload, packMeta) {
  const scenarios = ensureArray(packPayload?.scenarios, `${packMeta.title}.scenarios`).map((scenario, index) => normalizeScenario(scenario, index, packMeta.title));
  return {
    packId: packMeta.id,
    packTitle: packMeta.title,
    scenarios
  };
}

export function normalizeScenario(scenario, index, packTitle) {
  for (const field of REQUIRED_SCENARIO_FIELDS) {
    if (field === "monitoringFollowUps") continue;
    ensureString(scenario[field], `scenario[${index}].${field}`);
  }
  const monitoring = ensureArray(scenario.monitoringFollowUps, `scenario[${index}].monitoringFollowUps`).map((item, itemIndex) => ensureString(item, `scenario[${index}].monitoringFollowUps[${itemIndex}]`));
  const standingChecks = ensureArray(scenario.standingChecks, `scenario[${index}].standingChecks`).map((check, checkIndex) => normalizeStandingCheck(check, checkIndex));
  const walkthrough = ensureArray(scenario.strongestPracticeWalkthrough || [], `scenario[${index}].strongestPracticeWalkthrough`);
  const bonus = scenario.bonus && typeof scenario.bonus === "object"
    ? { title: scenario.bonus.title || "Extend the watchtower run", summary: scenario.bonus.summary || "Replay the mission and compare a different judgment path." }
    : { title: "Extend the watchtower run", summary: "Replay the mission and compare a different judgment path." };
  return {
    ...scenario,
    pack: scenario.pack || packTitle || "Core Watchtower Pack",
    monitoringFollowUps: monitoring,
    standingChecks,
    strongestPracticeWalkthrough: walkthrough,
    decisionNarrative: normalizeNarrative({ ...scenario, standingChecks }),
    bonus
  };
}

export function validateScenarioCollection({ registry, packPayloads, glossary }) {
  const validatedRegistry = validateScenarioRegistry(registry);
  const validatedGlossary = validateGlossary(glossary);
  const scenarios = [];
  const seenIds = new Set();

  packPayloads.forEach((payload, index) => {
    const packMeta = validatedRegistry.packs[index];
    const validatedPack = validatePackPayload(payload, packMeta);
    validatedPack.scenarios.forEach((scenario) => {
      if (seenIds.has(scenario.id)) {
        throw new Error(`Duplicate scenario id detected: ${scenario.id}`);
      }
      seenIds.add(scenario.id);
      scenarios.push(scenario);
    });
  });

  return {
    registry: validatedRegistry,
    glossary: validatedGlossary.glossary,
    scenarios
  };
}
