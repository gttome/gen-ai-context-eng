export function buildManualPrompt(scenario) {
  const included = scenario.components.filter((component) => component.included);
  const orderedBlocks = included.map((component) => `[${component.label}]\n${component.content}`);
  return orderedBlocks.join('\n\n');
}

export function getPreparedOutput(scenario, state) {
  const readiness = state.derived.metrics.current.readiness;
  return readiness >= 75 ? scenario.preparedOutputs.strong : scenario.preparedOutputs.weak;
}
