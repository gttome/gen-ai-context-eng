import { announce } from "../accessibility.js";

export function registerChangeHandlers({ store }) {
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches('[data-role="prediction-toggle"]')) {
      const checked = Array.from(document.querySelectorAll('[data-role="prediction-toggle"]:checked')).map((item) => item.value);
      store.dispatch({ type: "SET_PREDICTIONS", payload: checked });
      announce("Predicted risks updated.");
    }
    if (target.id === "precedence-select") {
      store.dispatch({ type: "SET_PRECEDENCE", payload: target.value });
      announce("Precedence rule updated.");
    }
    if (target.id === "output-select") {
      store.dispatch({ type: "SET_OUTPUT_OPTION", payload: target.value });
      announce("Output mode updated.");
    }
    if (target.id === "handling-select") {
      store.dispatch({ type: "SET_HANDLING", payload: target.value });
      announce("Missing-information behavior updated.");
    }
  });
}
