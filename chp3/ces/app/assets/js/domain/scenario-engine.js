import { DEFAULT_SECTION_ORDER, emptySections } from "./envelope.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSectionName(value = "") {
  return value.toString().trim().toUpperCase();
}

function sectionType(block) {
  return normalizeSectionName(block?.type || block?.suggestedSection || "");
}

function firstBlockIdByType(scenario, desiredType) {
  const match = (scenario.blocks || []).find((block) => sectionType(block) === desiredType);
  return match?.id || "";
}

function blockMap(scenario) {
  return Object.fromEntries((scenario?.blocks || []).map((block) => [block.id, block]));
}

export function createRunFromStrongest(scenario, config = { sectionOrder: DEFAULT_SECTION_ORDER }) {
  return {
    scenarioId: scenario.id,
    currentStage: "studio",
    sections: clone(scenario.strongestPractice?.sections || emptySections(config.sectionOrder)),
    predictions: [],
    precedenceRule: scenario.strongestPractice?.precedenceRule || scenario.options?.precedenceRules?.[0]?.id || "",
    outputOption: scenario.strongestPractice?.outputOption || scenario.options?.outputOptions?.[0]?.id || "",
    missingInfoHandling: scenario.strongestPractice?.missingInfoHandling || scenario.options?.handlingOptions?.[0]?.id || "",
    observedOutput: "",
    compareMode: "strongest",
    coreCompleted: false,
    exploreViewed: false,
    lastUpdated: null,
    lastAttemptId: null,
    selectedBlockId: firstBlockIdByType(scenario, "ROLE") || scenario.blocks?.[0]?.id || null
  };
}

function removeFromAllSections(sections, blockId, sectionOrder) {
  for (const section of sectionOrder) {
    sections[section] = (sections[section] || []).filter((id) => id !== blockId);
  }
}

function applyMove(sections, move, sectionOrder) {
  if (!move?.blockId || !move?.toSection) return;
  const toSection = normalizeSectionName(move.toSection);
  if (!sectionOrder.includes(toSection)) return;
  removeFromAllSections(sections, move.blockId, sectionOrder);
  const bucket = sections[toSection] || [];
  if (move.position === "start") bucket.unshift(move.blockId);
  else if (move.beforeBlockId && bucket.includes(move.beforeBlockId)) bucket.splice(bucket.indexOf(move.beforeBlockId), 0, move.blockId);
  else bucket.push(move.blockId);
  sections[toSection] = bucket;
}

export function applyCounterfactualDefinition(scenario, definition, config = { sectionOrder: DEFAULT_SECTION_ORDER }) {
  const run = createRunFromStrongest(scenario, config);
  const sectionOrder = config.sectionOrder || DEFAULT_SECTION_ORDER;
  for (const move of definition?.moves || []) applyMove(run.sections, move, sectionOrder);
  if (definition?.decisionOverrides?.precedenceRule) run.precedenceRule = definition.decisionOverrides.precedenceRule;
  if (definition?.decisionOverrides?.outputOption) run.outputOption = definition.decisionOverrides.outputOption;
  if (definition?.decisionOverrides?.missingInfoHandling) run.missingInfoHandling = definition.decisionOverrides.missingInfoHandling;
  run.counterfactualId = definition?.id || null;
  return run;
}

function metricHintsFromConcept(concept = "") {
  const lower = concept.toLowerCase();
  const tags = new Set(["structureClarity"]);
  if (lower.includes("order")) tags.add("orderingQuality");
  if (lower.includes("precedence") || lower.includes("conflict")) tags.add("precedenceExplicitness");
  if (lower.includes("output")) tags.add("outputUsability");
  if (lower.includes("missing") || lower.includes("uncertainty") || lower.includes("check")) tags.add("handlingReadiness");
  if (lower.includes("handoff") || lower.includes("operational") || lower.includes("deployment")) tags.add("operationalReadiness");
  if (lower.includes("dynamic") || lower.includes("stale")) tags.add("structureClarity");
  return [...tags];
}

function buildMissionTags(rawScenario) {
  const tags = new Set(metricHintsFromConcept(rawScenario.chapterConcept || ""));
  const lower = (rawScenario.learningObjective || "").toLowerCase();
  if (lower.includes("order")) tags.add("orderingQuality");
  if (lower.includes("precedence")) tags.add("precedenceExplicitness");
  if (lower.includes("output")) tags.add("outputUsability");
  if (lower.includes("uncertainty") || lower.includes("missing")) tags.add("handlingReadiness");
  if (lower.includes("repeat") || lower.includes("handoff") || lower.includes("operational")) tags.add("operationalReadiness");
  return [...tags];
}

function buildCounterfactuals(rawScenario, config) {
  const existing = Array.isArray(rawScenario.counterfactuals) ? rawScenario.counterfactuals.filter(Boolean) : [];
  if (existing.length) return existing;

  const candidates = [];
  const dynamicId = firstBlockIdByType(rawScenario, "DYNAMIC FACTS");
  const checksId = firstBlockIdByType(rawScenario, "CHECKS");
  const outputId = firstBlockIdByType(rawScenario, "OUTPUT");
  const referenceId = firstBlockIdByType(rawScenario, "REFERENCE");
  const altPrecedence = rawScenario.options?.precedenceRules?.[1]?.id || rawScenario.strongestPractice?.precedenceRule;
  const altHandling = rawScenario.options?.handlingOptions?.find((item) => item.id !== rawScenario.strongestPractice?.missingInfoHandling)?.id || rawScenario.strongestPractice?.missingInfoHandling;

  if (dynamicId) {
    candidates.push({
      id: `${rawScenario.id}-counterfactual-blended-facts`,
      title: "Plausible but weaker: blended current facts into reference",
      focus: "Current-state control",
      whyPlausible: "The fact still looks relevant, so the package can appear complete even while the run-specific material stops looking refreshable.",
      lesson: "Keep run-specific facts visibly separate so stale or changing details do not masquerade as stable evidence.",
      moves: [{ blockId: dynamicId, toSection: "REFERENCE" }],
      decisionOverrides: {}
    });
  }

  if (checksId) {
    candidates.push({
      id: `${rawScenario.id}-counterfactual-buried-checks`,
      title: "Plausible but weaker: uncertainty handling buried in rules",
      focus: "Conditional behavior visibility",
      whyPlausible: "The handling still sounds like a rule, but the condition becomes less reviewable when it is buried with general constraints.",
      lesson: "Move uncertainty and escalation behavior into CHECKS when you want reviewers and models to see the branch clearly at the end of the package.",
      moves: [{ blockId: checksId, toSection: "RULES" }],
      decisionOverrides: { missingInfoHandling: altHandling }
    });
  }

  if (outputId && referenceId) {
    candidates.push({
      id: `${rawScenario.id}-counterfactual-loose-output`,
      title: "Plausible but weaker: output contract softened",
      focus: "Reviewability",
      whyPlausible: "The package still appears usable, but weaker output guidance makes later evaluation less consistent.",
      lesson: "A visible output contract is one of the easiest ways to improve reviewability across runs and reviewers.",
      moves: [{ blockId: outputId, toSection: "TASK" }],
      decisionOverrides: { precedenceRule: altPrecedence }
    });
  }

  return candidates.slice(0, 3);
}

function buildAuthoringHints(rawScenario) {
  const firstCounterfactual = (rawScenario.counterfactuals || [])[0];
  return {
    missionTags: rawScenario.missionTags || buildMissionTags(rawScenario),
    nextLikelyWeakness: metricHintsFromConcept(rawScenario.chapterConcept || "")[0] || "structureClarity",
    counterfactualPattern: firstCounterfactual?.focus || "Separate stable instructions, evidence, current facts, and conditional checks.",
    authoringChecklist: [
      "Keep the core run finishable in under ten minutes.",
      "Make the strongest-practice rationale explicit for each section.",
      "Include at least one plausible but weaker counterfactual so learners can compare structure-driven consequences.",
      "Write coaching in plain language so a non-developer knows the next move immediately."
    ]
  };
}

function buildCoachingEngine(rawScenario) {
  return {
    cardQuestionStyle: "Ask before placing",
    preferredPrompt: "What job does this card do best when the package needs to stay reviewable?",
    counterfactualPrompt: "What tempting placement would still feel plausible but weaken the package?",
    missionFocus: (rawScenario.missionTags || buildMissionTags(rawScenario))[0] || "structureClarity"
  };
}

export function compileScenario(rawScenario, config = { sectionOrder: DEFAULT_SECTION_ORDER }) {
  const scenario = clone(rawScenario);
  scenario.missionTags = scenario.missionTags?.length ? scenario.missionTags : buildMissionTags(scenario);
  scenario.counterfactuals = buildCounterfactuals(scenario, config);
  scenario.authoringHints = scenario.authoringHints || buildAuthoringHints(scenario);
  scenario.coachingEngine = scenario.coachingEngine || buildCoachingEngine(scenario);
  const map = blockMap(scenario);
  scenario.strongestPractice = scenario.strongestPractice || {};
  scenario.strongestPractice.rationale = scenario.strongestPractice.rationale || {};
  for (const section of config.sectionOrder || DEFAULT_SECTION_ORDER) {
    if (!scenario.strongestPractice.rationale[section]) {
      const anchor = (scenario.strongestPractice.sections?.[section] || []).map((id) => map[id]?.label || id).join(", ");
      scenario.strongestPractice.rationale[section] = anchor
        ? `${section} is strongest when ${anchor} stays visibly grouped there.`
        : `${section} should stay visibly distinct so reviewers can understand its job at a glance.`;
    }
  }
  return scenario;
}

export function compileScenarioCollection(rawScenarios = {}, config = { sectionOrder: DEFAULT_SECTION_ORDER }) {
  return Object.fromEntries(Object.entries(rawScenarios).map(([id, scenario]) => [id, compileScenario(scenario, config)]));
}
