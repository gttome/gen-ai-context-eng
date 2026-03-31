const LABELS = {
  structureClarity: "Section separation",
  sectionBalance: "Section balance",
  orderingQuality: "Ordering quality",
  precedenceExplicitness: "Precedence handling",
  outputUsability: "Output contract",
  handlingReadiness: "Checks and uncertainty",
  operationalReadiness: "Operational readiness"
};

function average(values = []) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function streak(history = []) {
  let count = 0;
  for (let index = history.length - 1; index > 0; index -= 1) {
    if ((history[index].score || 0) > (history[index - 1].score || 0)) count += 1;
    else break;
  }
  return count;
}

function fallbackMetrics() {
  return {
    structureClarity: 0,
    sectionBalance: 0,
    orderingQuality: 0,
    precedenceExplicitness: 0,
    outputUsability: 0,
    handlingReadiness: 0,
    operationalReadiness: 0
  };
}

function skillRows(history = []) {
  const keys = Object.keys(fallbackMetrics());
  return keys.map((key) => {
    const values = history.map((attempt) => attempt.metrics?.[key]).filter((value) => typeof value === "number");
    return { key, label: LABELS[key] || key, average: average(values), attempts: values.length };
  });
}

function pickScenario(scenariosById, weakestKey, currentScenarioId = null) {
  const scenarios = Object.values(scenariosById || {});
  const scored = scenarios.map((scenario) => ({
    scenario,
    score: (scenario.missionTags || []).includes(weakestKey) ? 3 : 0
      + (scenario.id !== currentScenarioId ? 1 : 0)
      + ((scenario.counterfactuals || []).length ? 1 : 0)
  })).sort((a, b) => b.score - a.score || a.scenario.title.localeCompare(b.scenario.title));
  return scored[0]?.scenario || scenarios[0] || null;
}

function profileName(completedRuns) {
  if (!completedRuns) return "New operator";
  if (completedRuns < 3) return "Core builder";
  if (completedRuns < 6) return "Reliable structurer";
  return "Mission director in training";
}

export function buildMissionDirector(state, currentMetrics = null) {
  const history = state.history || [];
  const rows = skillRows(history);
  const weakest = rows.filter((row) => row.attempts).sort((a, b) => a.average - b.average)[0] || { key: "structureClarity", label: LABELS.structureClarity, average: currentMetrics?.metrics?.structureClarity || 0 };
  const strongest = rows.filter((row) => row.attempts).sort((a, b) => b.average - a.average)[0] || { key: "outputUsability", label: LABELS.outputUsability, average: 0 };
  const recommended = pickScenario(state.scenarios, weakest.key, state.run?.scenarioId || null);
  const completedRuns = history.length;
  const completedScenarios = new Set(history.map((item) => item.scenarioId)).size;
  const improvementStreak = streak([...history].reverse());
  const badges = [profileName(completedRuns), `${completedScenarios} scenario${completedScenarios === 1 ? "" : "s"} completed`];
  if (improvementStreak > 0) badges.push(`${improvementStreak} run improvement streak`);
  if ((currentMetrics?.composite || 0) >= 85) badges.push("Strong current envelope");
  const nextMission = recommended ? {
    scenarioId: recommended.id,
    title: `Next mission: ${recommended.title}`,
    instruction: `Train ${weakest.label.toLowerCase()} next. ${recommended.chapterConcept} is a strong follow-on because it keeps the next rep focused on a visible shaping lever.`,
    why: `Recommended because your weakest recurring signal is ${weakest.label.toLowerCase()}.`,
    cta: `Start ${recommended.title}`
  } : {
    scenarioId: null,
    title: "Choose any scenario to begin",
    instruction: "You do not have local run history yet, so start with the first core scenario to establish a baseline.",
    why: "The Mission Director becomes more specific after your first completed run.",
    cta: ""
  };
  return {
    profile: profileName(completedRuns),
    badges,
    completedRuns,
    completedScenarios,
    weakestSkill: weakest,
    strongestSkill: strongest,
    skillRows: rows,
    recommendedScenarioId: nextMission.scenarioId,
    recommendedScenarioTitle: recommended?.title || "",
    nextMission,
    summary: completedRuns
      ? `Your current local pattern says ${weakest.label.toLowerCase()} is the biggest leverage point to train next.`
      : "Complete one core run and the Mission Director will start steering you toward the highest-leverage next mission."
  };
}
