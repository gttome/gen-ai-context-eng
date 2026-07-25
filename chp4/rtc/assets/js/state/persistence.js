import { STORAGE_KEYS } from "../config.js";

function storage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function loadSession() {
  try {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to load RTC session state.", error);
    return null;
  }
}

export function saveSession(state) {
  try {
    const store = storage();
    if (!store) return;
    store.setItem(STORAGE_KEYS.session, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save RTC session state.", error);
  }
}

export function loadHistory() {
  try {
    const store = storage();
    if (!store) return [];
    const current = store.getItem(STORAGE_KEYS.history);
    if (current) return JSON.parse(current);
    const legacy = store.getItem("rtc_replay_history_v1");
    return legacy ? JSON.parse(legacy) : [];
  } catch (error) {
    console.warn("Unable to load RTC replay history.", error);
    return [];
  }
}

export function saveHistory(historyItems) {
  try {
    const store = storage();
    if (!store) return;
    store.setItem(STORAGE_KEYS.history, JSON.stringify(historyItems.slice(0, 20)));
  } catch (error) {
    console.warn("Unable to save RTC replay history.", error);
  }
}


export function clearAllState() {
  try {
    const store = storage();
    if (!store) return;
    store.removeItem(STORAGE_KEYS.session);
    store.removeItem(STORAGE_KEYS.history);
  } catch (error) {
    console.warn("Unable to clear RTC persisted state.", error);
  }
}
