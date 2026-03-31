export function bindKeyboardShortcuts({ uiState, closeModal }) {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && uiState.modal) closeModal();
    if (event.altKey && event.key.toLowerCase() === "h") window.location.href = "./help.html";
    if (event.altKey && event.key.toLowerCase() === "f") window.location.href = "./feedback.html";
  });
}
