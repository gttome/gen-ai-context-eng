import { ACTIONS } from "../../state/actions.js";
import { selectDerivedState } from "../../state/selectors.js";
import { nextTheme, persistTheme } from "../shell/themeController.js";

export function handleGlobalClick(event, { store, announce, clearSession, closeModal, openModal }) {
  const target = event.target.closest("button, [data-start-mission], [data-open-detail], [data-open-glossary], [data-open-metric], [data-open-review-insights], a");
  if (!target) return;

  if (target.id === "modal") return closeModal();
  if (target.dataset.startMission) {
    store.dispatch({ type: ACTIONS.START_MISSION, payload: { missionId: target.dataset.startMission } });
    return announce("Mission started.");
  }
  if (target.dataset.resumeSession) {
    const state = store.getState();
    if (state.session.missionId) {
      const resumeStage = state.session.resumeStage || (state.session.stage !== "launch" ? state.session.stage : "brief");
      store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: resumeStage } });
      announce(`Saved session resumed at ${resumeStage}.`);
    } else {
      announce("No saved session is available to resume.");
    }
    return;
  }
  if (target.dataset.clearSession) {
    const state = store.getState();
    clearSession(state.config.storageKeys.session);
    store.dispatch({ type: ACTIONS.CLEAR_SESSION });
    return announce("Saved session cleared.");
  }
  if (target.dataset.restartFresh) {
    const state = store.getState();
    clearSession(state.config.storageKeys.session);
    store.dispatch({ type: ACTIONS.RESTART_FRESH });
    return announce("App restarted fresh.");
  }
  if (target.dataset.themeToggle) {
    const state = store.getState();
    const next = nextTheme(state.theme);
    store.dispatch({ type: ACTIONS.TOGGLE_THEME, payload: { value: next } });
    persistTheme(state.config.storageKeys.theme, next);
    return announce(`Theme set to ${next}.`);
  }
  if (target.dataset.openDetail) return openModal("card", target.dataset.openDetail);
  if (target.dataset.openGlossary) return openModal("glossary");
  if (target.dataset.openMetric) return openModal("metric", target.dataset.openMetric);
  if (target.dataset.openReviewInsights) return openModal("review");
  if (target.dataset.openAnswerXray) return openModal("xray");
  if (target.dataset.closeModal) return closeModal();
  if (target.dataset.backToLaunch) return store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: "launch" } });
  if (target.dataset.goWorkspace) {
    store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: "workspace" } });
    return announce("Workspace opened.");
  }
  if (target.dataset.resetMission) {
    store.dispatch({ type: ACTIONS.RESET_MISSION });
    return announce("Mission reset.");
  }
  if (target.dataset.backWorkspace) return store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: "workspace" } });
  if (target.dataset.backExport) return store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: "export" } });
  if (target.dataset.backComparison) return store.dispatch({ type: ACTIONS.SET_STAGE, payload: { stage: "comparison" } });
  if (target.dataset.buildExport) {
    const derived = selectDerivedState(store.getState());
    store.dispatch({ type: ACTIONS.BUILD_EXPORT_PAYLOAD, payload: { value: derived.exportPayload } });
    return announce("Export package built.");
  }
  if (target.dataset.copyExport) {
    const state = store.getState();
    return navigator.clipboard?.writeText(state.session.exportPayload || "")
      .then(() => {
        store.dispatch({ type: ACTIONS.MARK_PACKAGE_COPIED, payload: {} });
        announce("Export package copied.");
      })
      .catch(() => announce("Clipboard copy failed."));
  }
  if (target.dataset.openComparison) {
    store.dispatch({ type: ACTIONS.OPEN_REVIEW_COMPARISON, payload: {} });
    return announce("Comparison opened.");
  }
  if (target.dataset.openSummary) {
    const derived = selectDerivedState(store.getState());
    store.dispatch({
      type: ACTIONS.OPEN_SUMMARY,
      payload: {
        composite: derived.composite,
        reviewScore: derived.pastebackReview?.reviewScore || 0,
        branchId: store.getState().session.bonusBranchId || null,
        branchLabel: store.getState().session.bonusBranchLabel || ""
      }
    });
    return announce("Summary opened.");
  }
  if (target.dataset.activateBonus) {
    const derived = selectDerivedState(store.getState());
    const branch = (derived.mission.bonusBranches || []).find(item => item.id === target.dataset.activateBonus);
    if (!branch) return;
    store.dispatch({
      type: ACTIONS.ACTIVATE_BONUS_BRANCH,
      payload: { budgetLimit: branch.budgetLimit || derived.mission.bonusBudgetLimit || derived.mission.budgetLimit, branchId: branch.id, bonusLabel: branch.title }
    });
    return announce(`Bonus drill activated: ${branch.title}.`);
  }
  if (target.dataset.cardAction) {
    const cardId = target.dataset.cardId;
    const action = target.dataset.cardAction;
    store.dispatch({ type: ACTIONS.CLASSIFY_CARD, payload: { cardId, action } });
    return announce(`Card moved to ${action}.`);
  }
}
