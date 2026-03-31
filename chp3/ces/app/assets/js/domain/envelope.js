export const DEFAULT_SECTION_ORDER = ["ROLE", "RULES", "REFERENCE", "DYNAMIC FACTS", "TASK", "OUTPUT", "CHECKS"];

export function emptySections(sectionOrder = DEFAULT_SECTION_ORDER) {
  return Object.fromEntries(sectionOrder.map((section) => [section, []]));
}

export function getPlacedBlockIds(sections, sectionOrder = DEFAULT_SECTION_ORDER) {
  return sectionOrder.flatMap((section) => sections[section] || []);
}

export function getUnplacedBlocks(scenario, sections, sectionOrder = DEFAULT_SECTION_ORDER) {
  const placed = new Set(getPlacedBlockIds(sections, sectionOrder));
  return scenario.blocks.filter((block) => !placed.has(block.id));
}

export function normalizeEnvelope(scenario, sections, sectionOrder = DEFAULT_SECTION_ORDER) {
  const blockMap = Object.fromEntries(scenario.blocks.map((block) => [block.id, block]));
  return sectionOrder.map((section) => ({
    section,
    blocks: (sections[section] || []).map((blockId) => blockMap[blockId]).filter(Boolean)
  }));
}

export function buildPreviewText(scenario, runState, config) {
  const normalized = normalizeEnvelope(scenario, runState.sections, config.sectionOrder);
  const precedenceLabel = scenario.options.precedenceRules.find((option) => option.id === runState.precedenceRule)?.label || "No precedence rule selected";
  const outputLabel = scenario.options.outputOptions.find((option) => option.id === runState.outputOption)?.label || "No output option selected";
  const handlingLabel = scenario.options.handlingOptions.find((option) => option.id === runState.missingInfoHandling)?.label || "No missing-information behavior selected";

  const lines = [];
  lines.push(`# ${scenario.title}`);
  lines.push(`Chapter focus: ${scenario.chapterConcept}`);
  lines.push("");
  for (const entry of normalized) {
    lines.push(`## ${entry.section}`);
    if (!entry.blocks.length) {
      lines.push("[Section intentionally empty or incomplete]");
    } else {
      entry.blocks.forEach((block) => lines.push(`- ${block.text}`));
    }
    lines.push("");
  }
  lines.push("## DECISIONS");
  lines.push(`- Precedence: ${precedenceLabel}`);
  lines.push(`- Output mode: ${outputLabel}`);
  lines.push(`- Missing information: ${handlingLabel}`);
  if (runState.predictions?.length) {
    lines.push("");
    lines.push("## PREDICTED FAILURE RISKS");
    runState.predictions.forEach((item) => lines.push(`- ${item}`));
  }
  return lines.join("\n");
}

export function strongestPracticeSequence(scenario, sectionOrder = DEFAULT_SECTION_ORDER) {
  return sectionOrder.flatMap((section) => scenario.strongestPractice.sections[section] || []);
}

export function compareToStrongest(scenario, runState, config) {
  const strongestSections = scenario.strongestPractice.sections;
  const diffs = [];
  for (const section of config.sectionOrder) {
    const current = runState.sections[section] || [];
    const expected = strongestSections[section] || [];
    const missing = expected.filter((blockId) => !current.includes(blockId));
    const extras = current.filter((blockId) => !expected.includes(blockId));
    if (missing.length || extras.length) {
      diffs.push({ section, missing, extras });
    }
  }
  return {
    diffs,
    expectedPrecedence: scenario.strongestPractice.precedenceRule,
    expectedOutputOption: scenario.strongestPractice.outputOption,
    expectedHandling: scenario.strongestPractice.missingInfoHandling
  };
}

export function getSectionCounts(runState, config) {
  return Object.fromEntries(config.sectionOrder.map((section) => [section, (runState.sections[section] || []).length]));
}
