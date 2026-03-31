import { ACTIONS } from "../../state/actions.js";

export function handleInput(event, { store }) {
  const target = event.target;
  if (target.matches("[data-prediction-input]")) return store.dispatch({ type: ACTIONS.SAVE_PREDICTION, payload: { value: target.value } });
  if (target.matches("[data-pasteback-output]")) return store.dispatch({ type: ACTIONS.CAPTURE_PASTEBACK_OUTPUT, payload: { value: target.value } });
  if (target.matches("[data-filter-search]")) return store.dispatch({ type: ACTIONS.SET_FILTERS, payload: { search: target.value } });
  if (target.matches("[data-filter-authority]")) return store.dispatch({ type: ACTIONS.SET_FILTERS, payload: { authority: target.value } });
  if (target.matches("[data-filter-freshness]")) return store.dispatch({ type: ACTIONS.SET_FILTERS, payload: { freshness: target.value } });
}
