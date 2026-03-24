export function calculateProgress(state) {
  if (!state.currentScenario) {
    return { corePercent: 0, optionalPercent: 0, completedSteps: [] };
  }

  const scenario = state.currentScenario;
  const appliedRepairs = scenario.components.filter((component) => component.included === component.recommendedStrong).length;
  const repairThreshold = Math.max(2, Math.ceil(scenario.components.length * 0.5));

  const completedSteps = [
    state.prediction ? 'Prediction completed' : null,
    appliedRepairs >= repairThreshold ? 'Guided repairs applied' : null,
    state.pasteResult?.trim() ? 'Observed output captured' : null,
    state.debrief?.trim() ? 'Debrief answered' : null
  ].filter(Boolean);

  const optionalPercent = state.activeExploreDrillId ? 100 : state.showExploreMore ? 35 : 0;
  const optionalSteps = state.activeExploreDrillId ? [`Explore drill loaded: ${state.activeExploreDrillId}`] : [];

  return { corePercent: Math.round((completedSteps.length / 4) * 100), optionalPercent, completedSteps: [...completedSteps, ...optionalSteps] };
}
