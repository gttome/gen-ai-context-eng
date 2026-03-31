import { initApp } from "./app.js";

window.addEventListener("DOMContentLoaded", () => {
  initApp().catch((error) => {
    console.error(error);
    const root = document.getElementById("app-root");
    if (root) {
      root.innerHTML = `<section class="panel"><h2>Application failed to load</h2><p>Check the console for details.</p></section>`;
    }
  });
});
