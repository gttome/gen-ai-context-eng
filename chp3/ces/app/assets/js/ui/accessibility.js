let liveRegion;
let toastNode;
let toastTimer;

export function initAccessibility() {
  liveRegion = document.getElementById("live-region");
  toastNode = document.getElementById("toast");
}

export function announce(message) {
  if (!liveRegion) return;
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 20);
}

export function showToast(message) {
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastNode.classList.remove("show");
  }, 2200);
}
