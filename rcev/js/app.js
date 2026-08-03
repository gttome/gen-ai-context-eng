import { loadCatalog, findChapter, findVideo } from "./catalog.js";
import { readRoute, navigate } from "./router.js";
import { renderHome, renderChapter, renderVideo, renderReview, renderLab, renderNotFound, renderCatalogError } from "./render.js";
import { createProgressStore } from "./storage.js";
import {
  resetLearningProgress, setLastViewed,
  setVideoCompletion, updateVideoProgress
} from "./progress.js";
import {
  addBookmark, applyBookmarkImport, deleteBookmark, updateBookmark
} from "./bookmarks.js";
import {
  applyRetrievalImport, loadRetrievalBank, observeReviewClock, resetRetrievalHistory,
  setRetrievalConfidence, setRetrievalReview, submitRetrievalAnswer
} from "./retrieval.js";
import {
  applyLabImport, loadLabBank, resetLabHistory, resetLabScenario, saveLabDraft, submitLabAttempt
} from "./lab.js";

const APP_VERSION = "2.0.2";
const main = document.querySelector("#main");
const live = document.querySelector("#app-status");
let catalog;
let retrievalBank;
let labBank;
let progress;
let store;
let storageNotice = null;
let mediaNotice = null;
let storageRecovered = false;
let currentPlayer = null;
let reviewClockNotice = null;

function announce(message) {
  if (!message) return;
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = message; });
}

function routeFromDataset(target) {
  const name = target.dataset.route;
  if (name === "home") return { name: "home" };
  if (name === "chapter") return { name, chapterId: target.dataset.chapter };
  if (name === "review") return { name, mode: target.dataset.reviewMode || "quick", chapterId: target.dataset.chapter || null };
  if (name === "lab") return { name, scenarioId: target.dataset.scenario || null };
  if (name === "video") {
    const rawTime = target.dataset.time;
    const timeSeconds = rawTime === undefined || rawTime === "" ? null : Number(rawTime);
    return {
      name, chapterId: target.dataset.chapter, videoId: target.dataset.video,
      timeSeconds: Number.isFinite(timeSeconds) && timeSeconds >= 0 ? timeSeconds : null
    };
  }
  return null;
}

function persist(next, message = false) {
  progress = next;
  const result = store.save(progress);
  storageNotice = result.notice;
  if (message) announce(message);
  return result;
}

function context() {
  return {
    catalog,
    retrievalBank,
    labBank,
    appVersion: APP_VERSION,
    progress,
    getProgress: () => progress,
    storagePersistent: store.persistent,
    storageNotice,
    mediaNotice,
    storageRecovered,
    reviewClockNotice,
    announce,
    onToggleComplete(video, completed) {
      persist(setVideoCompletion(progress, video, completed), completed ? "Video marked complete." : "Video marked incomplete.");
      return { record: progress.videos[video.id] };
    },
    onVideoProgress(video, update) {
      const before = progress.videos[video.id]?.completed === true;
      const next = updateVideoProgress(progress, video, update);
      persist(next, null);
      const after = progress.videos[video.id]?.completed === true;
      if (!before && after) announce("Video completed automatically.");
      return { record: progress.videos[video.id] };
    },
    onAddBookmark(video, seconds, note) {
      const result = addBookmark(progress, video, seconds, note);
      if (result.duplicate) {
        announce("An identical bookmark already exists at this timestamp.");
        return result;
      }
      persist(result.state, `Bookmark saved at ${Math.floor(result.bookmark.seconds / 60)}:${String(Math.floor(result.bookmark.seconds % 60)).padStart(2, "0")}.`);
      return result;
    },
    onUpdateBookmark(bookmarkId, changes) {
      const result = updateBookmark(progress, catalog, bookmarkId, changes);
      persist(result.state, "Bookmark updated.");
      return result;
    },
    onDeleteBookmark(bookmarkId) {
      const result = deleteBookmark(progress, bookmarkId);
      if (result.deleted) persist(result.state, "Bookmark deleted.");
      return result;
    },
    onImportBookmarks(plan) {
      const next = applyBookmarkImport(progress, plan);
      persist(next, `${plan.additions.length} bookmark${plan.additions.length === 1 ? "" : "s"} added, ${plan.updates.length} updated, and ${plan.duplicates.length} duplicate${plan.duplicates.length === 1 ? "" : "s"} skipped.`);
      return { state: progress };
    },
    onSubmitRetrieval(checkId, choiceId) {
      const result = submitRetrievalAnswer(progress, retrievalBank, checkId, choiceId);
      persist(result.state, result.attempt.correct ? "Correct answer recorded." : "Answer recorded. Review the explanation and retry when ready.");
      return result;
    },
    onSetRetrievalConfidence(checkId, confidence) {
      const result = setRetrievalConfidence(progress, retrievalBank, checkId, confidence);
      persist(result.state, `Confidence set to ${confidence}.`);
      return result;
    },
    onSetRetrievalReview(checkId, review) {
      const result = setRetrievalReview(progress, retrievalBank, checkId, review);
      persist(result.state, review ? "Marked for review." : "Review mark removed.");
      return result;
    },
    onImportRetrieval(plan) {
      const next = applyRetrievalImport(progress, plan);
      persist(next, `${plan.newAttempts} new attempt${plan.newAttempts === 1 ? "" : "s"} imported across ${plan.newItems + plan.updatedItems} check record${plan.newItems + plan.updatedItems === 1 ? "" : "s"}.`);
      return { state: progress };
    },
    onResetRetrieval() {
      persist(resetRetrievalHistory(progress), "Retrieval-check history, confidence, and review marks were reset.");
      return { state: progress };
    },
    onSaveLabDraft(scenarioId, draft) {
      persist(saveLabDraft(progress, labBank, scenarioId, draft), "Lab draft saved.");
      return { state: progress };
    },
    onSubmitLab(scenarioId, response) {
      const result = submitLabAttempt(progress, labBank, scenarioId, response);
      persist(result.state, "Lab submission saved with criterion feedback.");
      return result;
    },
    onImportLab(plan) {
      persist(applyLabImport(progress, plan, labBank), `${plan.newScenarios} new lab scenario record${plan.newScenarios === 1 ? "" : "s"}, ${plan.updatedScenarios} updated, and ${plan.duplicateScenarios} unchanged.`);
      return { state: progress };
    },
    onResetLab() {
      persist(resetLabHistory(progress), "All context-lab drafts and submissions were reset.");
      return { state: progress };
    },
    onResetLabScenario(scenarioId) {
      persist(resetLabScenario(progress, labBank, scenarioId), "This context-lab scenario was reset.");
      return { state: progress };
    },
    onResetRequest: showResetDialog
  };
}

function render(route = readRoute(), { focus = true } = {}) {
  currentPlayer?.destroy?.();
  currentPlayer = null;
  document.body.classList.remove("video-focus-mode");
  main.classList.remove("focus-mode-main");
  main.setAttribute("aria-busy", "true");
  if (route.name === "home") renderHome(main, catalog, context());
  else if (route.name === "lab") renderLab(main, catalog, context(), route.scenarioId ?? null);
  else if (route.name === "review") {
    const chapter = route.mode === "chapter" ? findChapter(catalog, route.chapterId) : null;
    if (route.mode === "chapter" && !chapter) renderNotFound(main, "The requested chapter review does not exist.");
    else renderReview(main, catalog, context(), { mode: route.mode === "chapter" ? "chapter" : "quick", chapterId: chapter?.id ?? null });
  } else if (route.name === "chapter") {
    const chapter = findChapter(catalog, route.chapterId);
    chapter ? renderChapter(main, chapter, context()) : renderNotFound(main, "The requested chapter does not exist.");
  } else if (route.name === "video") {
    const chapter = findChapter(catalog, route.chapterId);
    const video = findVideo(chapter, route.videoId);
    if (chapter && video) {
      persist(setLastViewed(progress, video), null);
      currentPlayer = renderVideo(main, chapter, video, context(), route);
    } else renderNotFound(main, "The requested video does not exist in that chapter.");
  } else renderNotFound(main);
  main.setAttribute("aria-busy", "false");
  if (focus) {
    window.scrollTo({ top: 0, behavior: "auto" });
    main.focus({ preventScroll: true });
  }
}

function showResetDialog() {
  const dialog = document.querySelector("#reset-dialog");
  const trigger = document.activeElement;
  if (typeof dialog.showModal !== "function") {
    if (window.confirm("Reset all learning progress for all 40 videos? Bookmarks, notes, retrieval-check history, and lab work will be kept.")) resetAll();
    return;
  }
  const cancel = dialog.querySelector("[data-dialog-cancel]");
  const confirm = dialog.querySelector("[data-dialog-confirm]");
  const close = () => { dialog.close(); trigger?.focus?.(); };
  const onCancel = () => { cleanup(); close(); };
  const onConfirm = () => { cleanup(); dialog.close(); resetAll(); };
  const onNativeCancel = (event) => { event.preventDefault(); onCancel(); };
  function cleanup() {
    cancel.removeEventListener("click", onCancel);
    confirm.removeEventListener("click", onConfirm);
    dialog.removeEventListener("cancel", onNativeCancel);
  }
  cancel.addEventListener("click", onCancel);
  confirm.addEventListener("click", onConfirm);
  dialog.addEventListener("cancel", onNativeCancel);
  dialog.showModal();
  cancel.focus();
}

function resetAll() {
  progress = resetLearningProgress(progress, APP_VERSION);
  store.clear();
  persist(progress, "All learning progress was reset. Bookmarks, notes, retrieval-check history, and lab work were kept.");
  render({ name: "home" });
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a.app-link");
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const route = routeFromDataset(anchor);
  if (!route) return;
  event.preventDefault();
  navigate(route);
});
window.addEventListener("popstate", () => render(readRoute()));
window.addEventListener("app:navigate", (event) => render(event.detail));

try {
  catalog = await loadCatalog();
  retrievalBank = await loadRetrievalBank(catalog);
  labBank = await loadLabBank(catalog);
  store = createProgressStore({ catalog, retrievalBank, labBank, appVersion: APP_VERSION });
  const loaded = store.load();
  progress = loaded.state;
  const clock = observeReviewClock(progress, new Date().toISOString(), new Date().getTimezoneOffset());
  progress = clock.state;
  reviewClockNotice = clock.rollbackDetected
    ? "The device clock appears to have moved backward. Review due dates are temporarily clamped to the last observed time."
    : clock.timezoneChanged
      ? "The device timezone changed. Stored review dates remain fixed and are displayed in the current timezone."
      : null;
  if (clock.rollbackDetected || clock.timezoneChanged) store.save(progress);
  storageNotice = loaded.notice;
  storageRecovered = loaded.recovered === true;
  render(readRoute(), { focus: false });
} catch (error) {
  console.error(error);
  main.setAttribute("aria-busy", "false");
  renderCatalogError(main);
}
