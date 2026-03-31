export function classifyFromDrop(store, cardId, action) {
  store.dispatch({ type: "CLASSIFY_CARD", payload: { cardId, action } });
}
