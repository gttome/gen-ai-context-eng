import { getUnplacedBlocks } from "../domain/envelope.js";
import { calculateMetrics, compareMetricMaps } from "../domain/scoring.js";
import { analyzeObservedOutput } from "../domain/review.js";
import { buildLearnerArtifactText } from "../domain/artifact.js";
import { buildDetailedComparison } from "../domain/comparison.js";
import { applyCounterfactualDefinition, createRunFromStrongest } from "../domain/scenario-engine.js";
import { buildMissionDirector } from "../domain/mission-director.js";

function emptyMetrics() {
  return {
    composite: 0,
    readiness: "Choose a scenario",
    narrativeSummary: "Choose a scenario to start building.",
    nextBestActions: [],
    metrics: {
      structureClarity: 0,
      sectionBalance: 0,
      orderingQuality: 0,
      precedenceExplicitness: 0,
      outputUsability: 0,
      handlingReadiness: 0,
      operationalReadiness: 0
    },
    warnings: [],
    strengths: [],
    risks: [],
    comparison: { diffs: [] },
    sectionCounts: {}
  };
}

function scenarioFromState(state) {
  return state.scenarios?.[state.run?.scenarioId] || null;
}

function summarizeCounterCard(title, tone, run, metrics, bullets = [], summary = "") {
  return {
    title,
    tone,
    score: metrics.composite,
    readiness: metrics.readiness,
    summary: summary || metrics.narrativeSummary,
    bullets: bullets.filter(Boolean).slice(0, 4),
    decisions: {
      precedenceRule: run.precedenceRule,
      outputOption: run.outputOption,
      missingInfoHandling: run.missingInfoHandling
    }
  };
}

function buildCounterfactualStudio(scenario, runState, config, currentMetrics) {
  if (!scenario) return { cards: [], variants: [] };
  const strongestRun = createRunFromStrongest(scenario, config);
  const strongestMetrics = calculateMetrics(scenario, strongestRun, config);
  const strongestComparison = buildDetailedComparison(scenario, runState, config);
  const variantRuns = (scenario.counterfactuals || []).map((definition) => {
    const run = applyCounterfactualDefinition(scenario, definition, config);
    const metrics = calculateMetrics(scenario, run, config);
    const comparison = buildDetailedComparison(scenario, run, config);
    return { definition, run, metrics, comparison };
  }).sort((a, b) => a.metrics.composite - b.metrics.composite);
  const recommendedVariant = variantRuns[0] || null;
  const currentHighlights = [
    currentMetrics.nextBestActions?.[0],
    currentMetrics.warnings?.[0],
    strongestComparison.sections.find((item) => item.status !== "aligned")?.improvement
  ].filter(Boolean);
  const strongestHighlights = [
    strongestMetrics.strengths?.[0] || "Strongest practice keeps role, rules, evidence, and checks visibly separate.",
    scenario.strongestPractice?.rationale?.ROLE,
    scenario.strongestPractice?.rationale?.CHECKS
  ].filter(Boolean);
  const weakerHighlights = recommendedVariant
    ? [
        recommendedVariant.definition.whyPlausible,
        recommendedVariant.definition.lesson,
        recommendedVariant.comparison.sections.find((item) => item.status !== "aligned")?.improvement,
        recommendedVariant.metrics.nextBestActions?.[0]
      ].filter(Boolean)
    : [];
  return {
    cards: [
      summarizeCounterCard("Your current envelope", "current", runState, currentMetrics, currentHighlights, "This is the package you have actually shaped so far."),
      summarizeCounterCard("Strongest practice", "strongest", strongestRun, strongestMetrics, strongestHighlights, "This card shows the clean, reviewable pattern the scenario is teaching."),
      recommendedVariant
        ? summarizeCounterCard(recommendedVariant.definition.title, "weaker", recommendedVariant.run, recommendedVariant.metrics, weakerHighlights, recommendedVariant.definition.focus)
        : null
    ].filter(Boolean),
    variants: variantRuns,
    strongestRun,
    strongestMetrics,
    recommendedVariant,
    takeaway: recommendedVariant
      ? `Counterfactual lab: ${recommendedVariant.definition.lesson}`
      : "Counterfactual lab will appear once the scenario engine has a plausible weaker pattern to compare."
  };
}

function buildNextGuidance(state, scenario, metrics, reviewResult, missionDirector) {
  const stage = state.run?.currentStage || "launch";
  const sectionOrder = state.config?.sectionOrder || [];
  const unplaced = scenario ? getUnplacedBlocks(scenario, state.run.sections, sectionOrder).length : 0;
  const hasOutput = Boolean(reviewResult?.hasOutput);

  if (!scenario) {
    if (state.run?.scenarioId) {
      return {
        title: "Resume or restart",
        body: "A run is already stored locally. Resume it below or start a fresh scenario pack.",
        actionType: "resume-run",
        actionLabel: "Resume current run"
      };
    }
    return {
      title: missionDirector?.nextMission?.title || "Start here",
      body: missionDirector?.summary || "Choose a Chapter 3 scenario pack below. Each run is designed to finish with a reviewable envelope and a clear next-best revision in about 5–10 minutes.",
      actionType: missionDirector?.recommendedScenarioId ? "start-scenario" : null,
      actionLabel: missionDirector?.recommendedScenarioId ? "Start recommended mission" : "",
      actionScenario: missionDirector?.recommendedScenarioId || ""
    };
  }

  if (stage === "brief") {
    return {
      title: "Do this next",
      body: "Review the mission brief, predict one likely failure, then start the build so you can shape the envelope intentionally instead of placing cards mechanically.",
      actionType: "set-stage",
      actionLabel: "Start build",
      actionStage: "studio"
    };
  }

  if (stage === "studio") {
    if (unplaced > 0) {
      return {
        title: "Do this next",
        body: `You still have ${unplaced} unplaced card${unplaced === 1 ? "" : "s"}. Use “Coach this card” when you are unsure, then place the next card where its job stays easiest to review.`,
        actionType: null,
        actionLabel: ""
      };
    }
    if (metrics.composite >= 72) {
      return {
        title: "Ready to test",
        body: "The envelope is coherent enough to learn from a real external run. Copy it now, test it externally, then return with the observed output.",
        actionType: "set-stage",
        actionLabel: "Go to Copy & Run",
        actionStage: "copy"
      };
    }
    return {
      title: "Tighten before testing",
      body: metrics.nextBestActions?.[0] || "Tighten section separation, order, and checks before you run the envelope externally.",
      actionType: null,
      actionLabel: ""
    };
  }

  if (stage === "copy") {
    return {
      title: "Run and return",
      body: "Copy the envelope, run it in your external LLM, then come back and paste the observed response so the app can connect visible output problems back to structure.",
      actionType: "set-stage",
      actionLabel: "I ran it — go to Review",
      actionStage: "review"
    };
  }

  if (stage === "review") {
    if (!hasOutput) {
      return {
        title: "Paste the result",
        body: "Paste the external-model response into the review box, then select Analyze output so the app can explain what the structure caused and what to change next.",
        actionType: null,
        actionLabel: ""
      };
    }
    return {
      title: "Finish the core run",
      body: reviewResult?.nextMove || "You have enough evidence to finish the core run and capture a learner artifact.",
      actionType: "complete-core",
      actionLabel: "Finish core run"
    };
  }

  if (stage === "summary") {
    return {
      title: missionDirector?.nextMission?.title || "Choose your finish",
      body: missionDirector?.nextMission?.instruction || "Copy or print the learner artifact if you want a reviewable handoff, or open Explore More for one optional deeper variation without losing your completed core run.",
      actionType: missionDirector?.recommendedScenarioId ? "start-scenario" : "open-explore",
      actionLabel: missionDirector?.recommendedScenarioId ? missionDirector.nextMission.cta : "Optional: Explore More",
      actionScenario: missionDirector?.recommendedScenarioId || ""
    };
  }

  if (stage === "explore") {
    return {
      title: "Close the loop",
      body: "Use this optional branch to inspect a harder tradeoff, then return to the summary or replay the scenario with one intentional structural change.",
      actionType: "set-stage",
      actionLabel: "Back to summary",
      actionStage: "summary"
    };
  }

  return {
    title: "What to do next",
    body: "Keep moving forward through the studio one stage at a time.",
    actionType: null,
    actionLabel: ""
  };
}

export function selectAppViewModel(state) {
  const scenario = scenarioFromState(state);
  const metrics = scenario ? calculateMetrics(scenario, state.run, state.config) : emptyMetrics();
  const reviewResult = scenario
    ? analyzeObservedOutput(scenario, state.run, metrics, state.run.observedOutput)
    : {
        hasOutput: false,
        summary: "",
        nextMove: "",
        scores: { taskFit: 0, evidenceUse: 0, uncertaintyHandling: 0, formatFit: 0 },
        notes: []
      };
  const priorAttempt = scenario
    ? (state.history || []).find((item) => item.scenarioId === scenario.id && item.attemptId !== state.run.lastAttemptId)
    : null;
  const metricDelta = priorAttempt?.metrics ? compareMetricMaps(metrics.metrics, priorAttempt.metrics) : [];
  const strongestComparison = scenario ? buildDetailedComparison(scenario, state.run, state.config) : { sections: [], decisions: [] };
  const missionDirector = buildMissionDirector(state, metrics);
  const counterfactualStudio = scenario ? buildCounterfactualStudio(scenario, state.run, state.config, metrics) : { cards: [], variants: [] };
  const learnerArtifactText = scenario
    ? buildLearnerArtifactText(scenario, state.run, metrics, reviewResult, state.config, priorAttempt)
    : "";
  const nextGuidance = buildNextGuidance(state, scenario, metrics, reviewResult, missionDirector);
  return { scenario, metrics, reviewResult, priorAttempt, metricDelta, strongestComparison, missionDirector, counterfactualStudio, learnerArtifactText, nextGuidance };
}
