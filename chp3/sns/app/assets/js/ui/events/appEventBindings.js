import { handleGlobalClick } from "./clickHandlers.js";
import { handleInput } from "./inputHandlers.js";
import { bindDragHandlers } from "./dragHandlers.js";
import { bindKeyboardShortcuts } from "./keyboardHandlers.js";

export function bindAppInteractions({ store, uiState, announce, clearSession, closeModal, openModal }) {
  document.addEventListener("click", event => handleGlobalClick(event, { store, announce, clearSession, closeModal, openModal }));
  document.addEventListener("input", event => handleInput(event, { store }));
  bindDragHandlers({ store, announce });
  bindKeyboardShortcuts({ uiState, closeModal });
}
