import { ACTIONS } from './actions.js';
import { applyActionToScenario, applyComponentChange as applyComponentMutation, applyExploreDrill as applyExploreDrillMutation, createInitialState, hydrateState, revealStrongState, selectScenarioState, serializeState } from '../domain/missionEngine.js';

export function createStore(appData, theme) {
  let state = createInitialState(appData, theme);
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener(state));
  }

  function dispatch(action) {
    switch (action.type) {
      case ACTIONS.SELECT_SCENARIO:
        state = selectScenarioState(appData, action.payload.scenarioId, { theme: state.theme, harder: Boolean(action.payload.harder) });
        break;
      case ACTIONS.APPLY_COMPONENT_CHANGE:
        state = appDataUpdate(applyComponentMutation(state, action.payload.componentId, action.payload.included));
        break;
      case ACTIONS.APPLY_RECOMMENDED_ACTION:
        state = appDataUpdate(applyActionToScenario(state, action.payload.actionId));
        break;
      case ACTIONS.APPLY_EXPLORE_DRILL:
        state = appDataUpdate(applyExploreDrillMutation(state, action.payload.drillId));
        break;
      case ACTIONS.COMPLETE_PREDICTION:
        state = appDataUpdate({ ...state, prediction: action.payload.value, sessionTimestamp: new Date().toISOString() });
        break;
      case ACTIONS.UPDATE_PASTE_RESULT:
        state = appDataUpdate({ ...state, pasteResult: action.payload.value, sessionTimestamp: new Date().toISOString() });
        break;
      case ACTIONS.UPDATE_DEBRIEF:
        state = appDataUpdate({ ...state, debrief: action.payload.value, sessionTimestamp: new Date().toISOString() });
        break;
      case ACTIONS.TOGGLE_EXPLORE_MORE:
        state = appDataUpdate({ ...state, showExploreMore: !state.showExploreMore });
        break;
      case ACTIONS.TOGGLE_COMPARE_VIEW:
        state = appDataUpdate({ ...state, showCompareView: !state.showCompareView });
        break;
      case ACTIONS.RESET_MISSION:
        state = selectScenarioState(appData, state.selectedScenarioId, { theme: state.theme, harder: Boolean(action.payload.harder) });
        break;
      case ACTIONS.RESUME_SAVED:
        state = hydrateState(action.payload.snapshot, appData) || state;
        break;
      case ACTIONS.CHANGE_THEME:
        state = { ...state, theme: action.payload.theme };
        break;
      case ACTIONS.CLEAR_SESSION:
        state = createInitialState(appData, state.theme);
        break;
      case ACTIONS.REVEAL_STRONG_STATE:
        state = appDataUpdate(revealStrongState(state));
        break;
      default:
        break;
    }

    emit();
  }

  function appDataUpdate(nextState) {
    return hydrateState(serializeState(nextState), appData);
  }

  return {
    getState() { return state; },
    dispatch,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
