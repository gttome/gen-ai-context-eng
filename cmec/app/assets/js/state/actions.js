export const ACTIONS = {
  SELECT_SCENARIO: 'SELECT_SCENARIO',
  APPLY_COMPONENT_CHANGE: 'APPLY_COMPONENT_CHANGE',
  APPLY_RECOMMENDED_ACTION: 'APPLY_RECOMMENDED_ACTION',
  APPLY_EXPLORE_DRILL: 'APPLY_EXPLORE_DRILL',
  COMPLETE_PREDICTION: 'COMPLETE_PREDICTION',
  UPDATE_PASTE_RESULT: 'UPDATE_PASTE_RESULT',
  UPDATE_DEBRIEF: 'UPDATE_DEBRIEF',
  TOGGLE_EXPLORE_MORE: 'TOGGLE_EXPLORE_MORE',
  TOGGLE_COMPARE_VIEW: 'TOGGLE_COMPARE_VIEW',
  RESET_MISSION: 'RESET_MISSION',
  RESUME_SAVED: 'RESUME_SAVED',
  CHANGE_THEME: 'CHANGE_THEME',
  CLEAR_SESSION: 'CLEAR_SESSION',
  REVEAL_STRONG_STATE: 'REVEAL_STRONG_STATE'
};

export const selectScenario = (scenarioId, options = {}) => ({ type: ACTIONS.SELECT_SCENARIO, payload: { scenarioId, ...options } });
export const applyComponentChange = (componentId, included) => ({ type: ACTIONS.APPLY_COMPONENT_CHANGE, payload: { componentId, included } });
export const applyRecommendedAction = (actionId) => ({ type: ACTIONS.APPLY_RECOMMENDED_ACTION, payload: { actionId } });
export const applyExploreDrill = (drillId) => ({ type: ACTIONS.APPLY_EXPLORE_DRILL, payload: { drillId } });
export const completePrediction = (value) => ({ type: ACTIONS.COMPLETE_PREDICTION, payload: { value } });
export const updatePasteResult = (value) => ({ type: ACTIONS.UPDATE_PASTE_RESULT, payload: { value } });
export const updateDebrief = (value) => ({ type: ACTIONS.UPDATE_DEBRIEF, payload: { value } });
export const toggleExploreMore = () => ({ type: ACTIONS.TOGGLE_EXPLORE_MORE });
export const toggleCompareView = () => ({ type: ACTIONS.TOGGLE_COMPARE_VIEW });
export const resetMission = (harder = false) => ({ type: ACTIONS.RESET_MISSION, payload: { harder } });
export const resumeSaved = (snapshot) => ({ type: ACTIONS.RESUME_SAVED, payload: { snapshot } });
export const changeTheme = (theme) => ({ type: ACTIONS.CHANGE_THEME, payload: { theme } });
export const clearSession = () => ({ type: ACTIONS.CLEAR_SESSION });
export const revealStrongState = () => ({ type: ACTIONS.REVEAL_STRONG_STATE });
