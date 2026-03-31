import { compositeScore, tierFromScore } from "../utils/helpers.js";
import { buildPackage, buildExportPayload } from "../domain/packageComposer.js";
import { calculateMetrics, calculateRiskCues } from "../metrics/metricCalculators.js";
import { buildComparison } from "../metrics/compareEngine.js";
import { getCoaching } from "../domain/reviewEngine.js";
import { getReadiness } from "../domain/missionReadiness.js";
import { deriveBadges } from "../metrics/gamification.js";
import { analyzePasteback } from "../domain/pastebackReview.js";
import { deriveMissionVariant } from "../domain/missionVariants.js";

export function selectActiveMission(state) {
  return state.missions.find(item => item.id === state.session.missionId) || null;
}

function activeMissionFromSession(state) {
  const baseMission = selectActiveMission(state);
  const activeBonusBranch = (baseMission?.bonusBranches || []).find(branch => branch.id === state.session.bonusBranchId) || null;
  const variant = deriveMissionVariant(baseMission, activeBonusBranch);
  return {
    baseMission,
    activeBonusBranch,
    mission: variant.mission,
    branchPolicy: variant.policy
  };
}

export function selectClassifiedCount(state, mission = activeMissionFromSession(state).mission) {
  if (!mission) return 0;
  return mission.cards.filter(card => Boolean(state.session.classifications[card.id]?.action)).length;
}

export function selectDerivedState(state) {
  const { mission, baseMission, activeBonusBranch, branchPolicy } = activeMissionFromSession(state);
  if (!mission) {
    return {
      mission: null,
      baseMission: null,
      packageState: null,
      metrics: null,
      readiness: null,
      comparison: null,
      coaching: [],
      composite: 0,
      tier: "Focused",
      badges: [],
      pastebackReview: null,
      activeBonusBranch: null,
      branchPolicy: null
    };
  }

  const packageState = buildPackage(mission, state.session.classifications, state.session.budgetLimit, branchPolicy);
  const metrics = calculateMetrics(mission, packageState, state.metricsConfig);
  const riskCues = calculateRiskCues(mission, packageState);
  const comparison = buildComparison(mission, state.session.classifications);
  const readiness = getReadiness(mission, state.session.classifications, packageState);
  const coaching = getCoaching({ mission, packageState, metrics, riskCues, state });
  const composite = compositeScore(metrics.scores, state.metricsConfig);
  const tier = tierFromScore(composite);
  const badges = deriveBadges({ mission, packageState, metrics, comparison, state, composite });
  const pastebackReview = analyzePasteback({ mission, packageState, pastedOutput: state.session.pastedOutput, activeBonusBranch, branchPolicy });

  return {
    mission,
    baseMission,
    packageState,
    metrics: { ...metrics, riskCues },
    readiness,
    comparison,
    coaching,
    composite,
    tier,
    badges,
    pastebackReview,
    activeBonusBranch,
    branchPolicy,
    exportPayload: buildExportPayload(mission, packageState, activeBonusBranch, branchPolicy)
  };
}

export function selectFilteredCards(state, mission = activeMissionFromSession(state).mission) {
  if (!mission) return [];
  const { search, authority, freshness } = state.session.filters;
  return mission.cards.filter(card => {
    const text = `${card.title} ${card.excerpt} ${card.sourceType} ${card.branchFlag || ""} ${card.branchNote || ""}`.toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (authority !== "all" && card.authority !== authority) return false;
    if (freshness !== "all" && card.recency !== freshness) return false;
    return true;
  });
}

export function selectLaneCards(state, actionName, mission = activeMissionFromSession(state).mission) {
  if (!mission) return [];
  return mission.cards.filter(card => state.session.classifications[card.id]?.action === actionName);
}
