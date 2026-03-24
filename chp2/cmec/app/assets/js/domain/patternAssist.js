export function getPatternAssist(scenario, state) {
  const current = state.currentScenario;
  const included = current.components.filter((component) => component.included);
  const hasGrounding = included.some((component) => component.type === 'grounding');
  const hasMemory = included.some((component) => component.type === 'memory');
  const hasSchema = included.some((component) => component.type === 'schema');
  const hasConstraint = included.some((component) => component.type === 'constraint');

  const assist = [];
  if (scenario.patternLens === 'grounding') {
    assist.push(hasGrounding
      ? 'Grounding is present. Now check whether it is short, relevant, and actually tied to the task.'
      : 'This mission still lacks explicit approved evidence, so the model is more likely to guess.');
    assist.push(hasConstraint
      ? 'Constraint support is active. That lowers the risk of unsupported interpretation.'
      : 'A short escalation or “do not speculate” rule can keep the model from wandering.');
  }

  if (scenario.patternLens === 'memory') {
    assist.push(hasMemory
      ? 'The memory block now carries forward the facts that still matter.'
      : 'Without a memory block, the model has to infer continuity from weak or missing context.');
    assist.push(hasSchema
      ? 'The incident schema will help separate facts, hypotheses, and next actions.'
      : 'Structure matters here because messy summaries hide what is known versus guessed.');
  }

  return assist;
}
