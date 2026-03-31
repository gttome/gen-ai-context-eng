import { buildPrintableArtifactHtml } from "../../domain/artifact.js";
import { copyTextToClipboard } from "../clipboard.js";
import { announce, showToast } from "../accessibility.js";
import { removeKey } from "../../state/persistence.js";

function selectedValue(selector) {
  return document.querySelector(selector)?.value;
}

function focusStageTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const focusTarget = document.querySelector(".stage-panel.active h1, .stage-panel.active h2, .stage-panel.active button, .stage-panel.active textarea");
    if (focusTarget) {
      focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    }
  });
}

function focusSelectedCoach(blockId) {
  window.requestAnimationFrame(() => {
    const inlineCoach = document.querySelector(`.selected-card[data-block-id="${blockId}"] .card-selected-coaching`);
    const railCoach = document.querySelector('[data-role="selected-coach"]');
    const target = inlineCoach || railCoach;
    if (!target) return;
    target.scrollIntoView({ block: "center" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

async function handleCopyEnvelope() {
  const text = document.querySelector(".preview-box")?.innerText || "";
  const result = await copyTextToClipboard(text);
  if (result.ok) {
    showToast(`Envelope copied (${result.mode}).`);
    announce("Envelope copied to clipboard.");
  } else {
    showToast("Copy fallback could not complete. Select and copy manually.");
    announce("Clipboard write failed. Select and copy manually.");
  }
}

async function handleCopyArtifact(text) {
  const result = await copyTextToClipboard(text);
  if (result.ok) {
    showToast("Learner artifact copied.");
    announce("Learner artifact copied to clipboard.");
  } else {
    showToast("Artifact copy failed. Use print or manual copy.");
    announce("Artifact copy failed.");
  }
}

function handlePrintArtifact(text, theme, title) {
  const html = buildPrintableArtifactHtml({ title, bodyText: text, theme });
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const popup = window.open(url, "_blank");
  if (!popup) {
    URL.revokeObjectURL(url);
    showToast("Popup blocked. Allow popups to print the learner artifact.");
    announce("Popup blocked for learner artifact.");
    return;
  }
  popup.focus();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  showToast("Learner artifact opened in a printable view.");
  announce("Printable learner artifact opened.");
}

export function registerClickHandlers({ store, getDerived, config }) {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const state = store.getState();
    const derived = getDerived(store.getState());

    switch (action) {
      case "toggle-theme": {
        const next = state.theme === "dark" ? "light" : "dark";
        store.dispatch({ type: "SET_THEME", payload: next });
        announce(`Theme switched to ${next}.`);
        break;
      }
      case "start-scenario":
        store.dispatch({ type: "START_SCENARIO", payload: button.dataset.scenario });
        announce("Scenario started.");
        focusStageTop();
        break;
      case "resume-run":
        if (state.run?.scenarioId) {
          store.dispatch({ type: "SET_STAGE", payload: state.run.currentStage || "studio" });
          announce("Resumed current run.");
          focusStageTop();
        }
        break;
      case "set-stage":
        store.dispatch({ type: "SET_STAGE", payload: button.dataset.stage });
        announce(`${button.dataset.stage} stage opened.`);
        focusStageTop();
        break;
      case "select-block":
        store.dispatch({ type: "SELECT_BLOCK", payload: button.dataset.blockId });
        showToast("Card coaching opened below the selected card and in the right rail.");
        announce("Card coaching updated.");
        focusSelectedCoach(button.dataset.blockId);
        break;
      case "place-from-tray": {
        const blockId = button.dataset.blockId;
        const section = selectedValue(`[data-role="place-select"][data-block-id="${blockId}"]`);
        if (!section) {
          showToast("Choose a destination section first.");
          return;
        }
        store.dispatch({ type: "PLACE_BLOCK", payload: { blockId, section } });
        showToast(`Placed in ${section}.`);
        announce(`Placed block in ${section}.`);
        break;
      }
      case "move-block":
        store.dispatch({ type: "MOVE_BLOCK", payload: { section: button.dataset.section, blockId: button.dataset.blockId, direction: button.dataset.direction } });
        announce("Block reordered.");
        break;
      case "move-block-section": {
        const blockId = button.dataset.blockId;
        const toSection = selectedValue(`[data-role="move-select"][data-block-id="${blockId}"]`);
        if (!toSection) {
          showToast("Choose a destination section first.");
          return;
        }
        store.dispatch({ type: "MOVE_BLOCK_TO_SECTION", payload: { blockId, toSection } });
        showToast(`Moved to ${toSection}.`);
        announce(`Block moved to ${toSection}.`);
        break;
      }
      case "remove-block":
        store.dispatch({ type: "REMOVE_BLOCK", payload: { section: button.dataset.section, blockId: button.dataset.blockId } });
        announce("Block removed from section.");
        break;
      case "copy-preview":
        await handleCopyEnvelope();
        break;
      case "save-output-review": {
        const value = document.getElementById("observed-output")?.value || "";
        store.dispatch({ type: "SET_OBSERVED_OUTPUT", payload: value });
        showToast("Observed output saved.");
        announce("Observed output saved for review.");
        break;
      }
      case "complete-core": {
        const scenario = state.scenarios[state.run.scenarioId];
        const attemptId = `attempt-${Date.now()}`;
        store.dispatch({ type: "MARK_CORE_COMPLETE", payload: { attemptId } });
        store.dispatch({
          type: "PUSH_HISTORY",
          payload: {
            attemptId,
            scenarioId: scenario.id,
            title: scenario.title,
            readiness: derived.metrics.readiness,
            score: derived.metrics.composite,
            metrics: derived.metrics.metrics,
            warnings: derived.metrics.warnings,
            completedAt: new Date().toISOString()
          }
        });
        showToast("Core run completed.");
        announce("Core run completed.");
        focusStageTop();
        break;
      }
      case "copy-artifact":
        await handleCopyArtifact(derived.learnerArtifactText);
        break;
      case "print-artifact":
        handlePrintArtifact(derived.learnerArtifactText, state.theme, `${state.config.appName} — Learner Artifact`);
        break;
      case "open-explore":
        store.dispatch({ type: "OPEN_EXPLORE" });
        announce("Explore More opened.");
        focusStageTop();
        break;
      case "replay-same-pack":
      case "reset-run":
        store.dispatch({ type: "RESET_CURRENT_RUN" });
        if (action === "reset-run") showToast("Fresh run started.");
        announce("Fresh run started.");
        focusStageTop();
        break;
      case "clear-all":
        removeKey(config.storageKeys.runState);
        store.dispatch({ type: "CLEAR_ALL" });
        showToast("Current run cleared.");
        announce("Current run cleared.");
        focusStageTop();
        break;
      default:
        break;
    }
  });
}
