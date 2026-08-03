import { createEmptyProgress } from "./progress.js";
import { migrateProgress } from "./migrations.js";

export const STORAGE_KEY = "rceVideo.progress";

export function createProgressStore({ catalog, retrievalBank, labBank, appVersion, storage = globalThis.localStorage } = {}) {
  let memory = createEmptyProgress(appVersion);
  let persistent = false;
  let notice = null;
  try {
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    persistent = true;
  } catch {
    notice = "Learning progress, bookmarks, notes, retrieval checks, and lab work cannot be saved in this browser. They will remain available only until this page is closed.";
  }

  function load() {
    if (!persistent) return { state: memory, persistent, notice, recovered: false };
    const rawText = storage.getItem(STORAGE_KEY);
    if (!rawText) return { state: memory, persistent, notice, recovered: false };
    try {
      const { state, migrated } = migrateProgress(JSON.parse(rawText), catalog, retrievalBank, appVersion, labBank);
      memory = state;
      if (migrated) save(state);
      return { state, persistent, notice: migrated ? "Saved learning data was updated to the current format." : notice, recovered: false };
    } catch {
      memory = createEmptyProgress(appVersion);
      notice = "Saved learning data could not be read and was reset safely. Video playback remains available.";
      try { storage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
      return { state: memory, persistent, notice, recovered: true };
    }
  }

  function save(state) {
    memory = state;
    if (!persistent) return { saved: false, persistent, notice };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return { saved: true, persistent, notice };
    } catch {
      persistent = false;
      notice = "Learning progress, bookmarks, notes, retrieval checks, and lab work could not be saved. Your current session will continue without permanent storage.";
      return { saved: false, persistent, notice };
    }
  }

  function clear() {
    memory = createEmptyProgress(appVersion);
    if (persistent) {
      try { storage.removeItem(STORAGE_KEY); }
      catch { persistent = false; notice = "Stored learning data could not be removed, but this session was reset."; }
    }
    return { state: memory, persistent, notice };
  }

  return { load, save, clear, get persistent() { return persistent; }, get notice() { return notice; } };
}
