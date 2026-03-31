export function announce(message) {
  const region = document.getElementById("aria-live-region");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 25);
}
