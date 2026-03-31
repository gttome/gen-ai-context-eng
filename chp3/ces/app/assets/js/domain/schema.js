function isString(value){ return typeof value === "string" && value.trim().length > 0; }
function isStringArray(value){ return Array.isArray(value) && value.every(isString); }
export function validateScenarioPack(scenario, config){
  const errors=[]; const warnings=[]; const sections=new Set(config?.sectionOrder||[]);
  const optionIds={ precedence:new Set((scenario?.options?.precedenceRules||[]).map((x)=>x.id)), output:new Set((scenario?.options?.outputOptions||[]).map((x)=>x.id)), handling:new Set((scenario?.options?.handlingOptions||[]).map((x)=>x.id))};
  ["id","title","learningObjective","chapterConcept","timing","difficulty","lifecycleCue","caseBrief"].forEach((f)=>{ if(!isString(scenario?.[f])) errors.push(`Field ${f} must be a non-empty string.`); });
  ["successCriteria","outputReminder"].forEach((f)=>{ if(!isStringArray(scenario?.[f])) errors.push(`${f} must be a string array.`); });
  if (!scenario?.options?.precedenceRules?.length) errors.push("At least one precedence rule is required.");
  if (!scenario?.options?.outputOptions?.length) errors.push("At least one output option is required.");
  if (!scenario?.options?.handlingOptions?.length) errors.push("At least one handling option is required.");
  const blockIds=new Set();
  if (!Array.isArray(scenario?.blocks) || !scenario.blocks.length) errors.push("Scenario must contain authored blocks.");
  for (const block of scenario?.blocks||[]) {
    if (!isString(block?.id)) errors.push("Every block requires a non-empty id.");
    if (blockIds.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
    blockIds.add(block.id);
    ["label","text","type","trustLevel","freshnessCue"].forEach((f)=>{ if(!isString(block?.[f])) errors.push(`Block ${block.id||"<unknown>"} is missing ${f}.`); });
    if (!Array.isArray(block?.acceptableSections) || !block.acceptableSections.length) errors.push(`Block ${block.id} needs at least one acceptable section.`);
    for (const s of block?.acceptableSections||[]) if(!sections.has(s)) errors.push(`Block ${block.id} references unknown section ${s}.`);
  }
  if (!scenario?.strongestPractice?.sections) errors.push("strongestPractice.sections is required.");
  for (const s of config?.sectionOrder||[]) for (const id of (scenario?.strongestPractice?.sections?.[s]||[])) if(!blockIds.has(id)) errors.push(`strongestPractice references unknown block id ${id}.`);
  if (!optionIds.precedence.has(scenario?.strongestPractice?.precedenceRule)) errors.push("strongestPractice.precedenceRule must reference a defined precedence option.");
  if (!optionIds.output.has(scenario?.strongestPractice?.outputOption)) errors.push("strongestPractice.outputOption must reference a defined output option.");
  if (!optionIds.handling.has(scenario?.strongestPractice?.missingInfoHandling)) errors.push("strongestPractice.missingInfoHandling must reference a defined handling option.");
  if (!isStringArray(scenario?.reviewRubric?.requiredPhrases)) errors.push("reviewRubric.requiredPhrases must be a string array.");
  if (!isStringArray(scenario?.reviewRubric?.formatMarkers)) errors.push("reviewRubric.formatMarkers must be a string array.");
  if (!isString(scenario?.exploreMore?.challengeTitle) || !isString(scenario?.exploreMore?.prompt) || !isString(scenario?.exploreMore?.focus)) errors.push("exploreMore title/prompt/focus are required.");
  if (!Array.isArray(scenario?.exploreMore?.branches) || !scenario.exploreMore.branches.length) errors.push("exploreMore.branches must contain at least one branch.");
  for (const branch of scenario?.exploreMore?.branches||[]) ["title","instruction","watchFor","why"].forEach((f)=>{ if(!isString(branch?.[f])) errors.push(`exploreMore branch is missing ${f}.`); });
  ["build","copy","review"].forEach((f)=>{ if(!isStringArray(scenario?.coach?.[f])) errors.push(`coach.${f} must be a string array.`); });
  if (scenario?.missionTags && !isStringArray(scenario.missionTags)) errors.push("missionTags must be a string array when provided.");
  if (scenario?.authoringHints) {
    if (scenario.authoringHints.missionTags && !isStringArray(scenario.authoringHints.missionTags)) errors.push("authoringHints.missionTags must be a string array when provided.");
    if (scenario.authoringHints.authoringChecklist && !isStringArray(scenario.authoringHints.authoringChecklist)) errors.push("authoringHints.authoringChecklist must be a string array when provided.");
  }
  if (scenario?.counterfactuals) {
    if (!Array.isArray(scenario.counterfactuals)) errors.push("counterfactuals must be an array when provided.");
    for (const item of scenario.counterfactuals || []) {
      ["id","title","focus","whyPlausible","lesson"].forEach((f)=>{ if(!isString(item?.[f])) errors.push(`counterfactual ${item?.id || "<unknown>"} is missing ${f}.`); });
      for (const move of item?.moves || []) {
        if (!blockIds.has(move?.blockId)) errors.push(`counterfactual ${item.id} references unknown block id ${move?.blockId}.`);
        if (move?.toSection && !sections.has(move.toSection.toString().toUpperCase())) errors.push(`counterfactual ${item.id} uses unknown section ${move.toSection}.`);
      }
    }
    if (!scenario.counterfactuals.length) warnings.push("No counterfactuals provided. The scenario engine will need to derive a fallback variation.");
  }
  return { valid: errors.length===0, errors, warnings };
}
