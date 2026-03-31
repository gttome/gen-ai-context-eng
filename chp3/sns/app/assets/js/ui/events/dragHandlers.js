import { ACTIONS } from "../../state/actions.js";

export function bindDragHandlers({ store, announce }) {
  let draggedCardId = null;
  document.addEventListener("dragstart", event => {
    const card = event.target.closest("[data-card-id]");
    if (!card) return;
    draggedCardId = card.dataset.cardId;
    event.dataTransfer.setData("text/plain", draggedCardId);
    card.classList.add("dragging");
  });
  document.addEventListener("dragend", event => {
    const card = event.target.closest("[data-card-id]");
    if (card) card.classList.remove("dragging");
    document.querySelectorAll("[data-drop-lane]").forEach(node => node.classList.remove("dragover"));
  });
  document.addEventListener("dragover", event => {
    const lane = event.target.closest("[data-drop-lane]");
    if (!lane) return;
    event.preventDefault();
    lane.classList.add("dragover");
  });
  document.addEventListener("dragleave", event => {
    const lane = event.target.closest("[data-drop-lane]");
    if (!lane) return;
    lane.classList.remove("dragover");
  });
  document.addEventListener("drop", event => {
    const lane = event.target.closest("[data-drop-lane]");
    if (!lane) return;
    event.preventDefault();
    lane.classList.remove("dragover");
    const cardId = draggedCardId || event.dataTransfer.getData("text/plain");
    if (!cardId) return;
    store.dispatch({ type: ACTIONS.CLASSIFY_CARD, payload: { cardId, action: lane.dataset.dropLane } });
    announce(`Card dropped into ${lane.dataset.dropLane}.`);
  });
}
