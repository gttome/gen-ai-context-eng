import { createInitialLauncherFilters, createInitialRunState } from "./store.js";

export function createRunRecord(scenarioId) {
  return {
    ...createInitialRunState(),
    scenarioId,
    route: "workspace"
  };
}

export function toggleThemeAction(currentTheme = "light") {
  return (draft) => {
    const resolved = (draft.themeChoice || currentTheme || "light") === "dark" ? "light" : "dark";
    draft.themeChoice = resolved;
    return draft;
  };
}

export function returnToLauncherAction() {
  return (draft) => {
    draft.run.route = "launcher";
    return draft;
  };
}

export function resetLauncherFiltersAction() {
  return (draft) => {
    draft.launcherFilters = createInitialLauncherFilters();
    return draft;
  };
}

export function setLauncherFilterAction(key, value) {
  return (draft) => {
    draft.launcherFilters = {
      ...createInitialLauncherFilters(),
      ...(draft.launcherFilters || {}),
      [key]: value
    };
    return draft;
  };
}

export function startScenarioAction(scenarioId) {
  return (draft) => {
    draft.run = createRunRecord(scenarioId);
    return draft;
  };
}

export const replayScenarioAction = startScenarioAction;

export function setCheckSelectionAction(checkId, status) {
  return (draft) => {
    draft.run.checkSelections[checkId] = status;
    draft.run.reviewedChecks[checkId] = true;
    return draft;
  };
}

export function setDecisionAction(decision) {
  return (draft) => {
    draft.run.decision = decision;
    return draft;
  };
}

export function toggleMonitoringAction(item, checked) {
  return (draft) => {
    const current = new Set(draft.run.monitoring);
    if (checked) current.add(item);
    else current.delete(item);
    draft.run.monitoring = [...current];
    return draft;
  };
}

export function setPastebackOutputAction(value) {
  return (draft) => {
    draft.run.pastebackOutput = value;
    return draft;
  };
}

export function notePacketCopiedAction(copiedAt = new Date().toISOString()) {
  return (draft) => {
    draft.run.copiedPacketAt = copiedAt;
    return draft;
  };
}

export function resetCurrentRunAction() {
  return (draft) => {
    draft.run = createRunRecord(draft.run.scenarioId);
    return draft;
  };
}

export function completeRunAction({ finalizedAt = new Date().toISOString() }) {
  return (draft) => {
    draft.run.completed = true;
    draft.run.finalizedAt = finalizedAt;
    draft.run.route = "debrief";
    return draft;
  };
}
