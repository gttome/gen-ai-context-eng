import {
  renderModalCard,
  renderGlossaryModal,
  renderMetricModal,
  renderReviewInsightsModal,
  renderAnswerXRayModal
} from "../panels/renderPanels.js";

export function renderModal(state, derivedState) {
  const modal = state.__ui?.modal;
  if (!modal || !derivedState.mission) return "";
  if (modal.type === "card") {
    const card = derivedState.mission.cards.find(item => item.id === modal.value);
    if (!card) return "";
    const chosenAction = state.session.classifications[card.id]?.action;
    return renderModalCard(card, chosenAction);
  }
  if (modal.type === "glossary") {
    return renderGlossaryModal(state.glossary || []);
  }
  if (modal.type === "metric") {
    const metric = state.metricsConfig?.categories?.find(item => item.id === modal.value);
    const score = derivedState.metrics?.scores?.[modal.value] ?? "—";
    return renderMetricModal(metric, score);
  }
  if (modal.type === "review") {
    return renderReviewInsightsModal(derivedState.pastebackReview, derivedState.mission);
  }
  if (modal.type === "xray") {
    return renderAnswerXRayModal(derivedState.pastebackReview, state.session.pastedOutput, derivedState.mission);
  }
  return "";
}
