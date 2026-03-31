import { announce } from "../accessibility.js";

export function registerDragHandlers({ store }) {
  let draggingBlockId = null;

  document.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".block-card[draggable='true']");
    if (!card) return;
    draggingBlockId = card.dataset.blockId;
    card.classList.add("dragging");
    event.dataTransfer?.setData("text/plain", draggingBlockId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  });

  document.addEventListener("dragend", (event) => {
    const card = event.target.closest(".block-card[draggable='true']");
    if (card) card.classList.remove("dragging");
    draggingBlockId = null;
    document.querySelectorAll("[data-drop-zone]").forEach((zone) => zone.classList.remove("drag-over"));
  });

  document.addEventListener("dragover", (event) => {
    const zone = event.target.closest("[data-drop-zone]");
    if (!zone) return;
    event.preventDefault();
    zone.classList.add("drag-over");
  });

  document.addEventListener("dragleave", (event) => {
    const zone = event.target.closest("[data-drop-zone]");
    if (zone) zone.classList.remove("drag-over");
  });

  document.addEventListener("drop", (event) => {
    const zone = event.target.closest("[data-drop-zone]");
    if (!zone || !draggingBlockId) return;
    event.preventDefault();
    zone.classList.remove("drag-over");
    const section = zone.dataset.dropZone;
    store.dispatch({ type: "PLACE_BLOCK", payload: { blockId: draggingBlockId, section } });
    announce(`Placed block in ${section}.`);
  });
}
