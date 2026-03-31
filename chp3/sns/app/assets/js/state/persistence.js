import { migrateSession } from "./migrations.js";

export function loadSession(storageKey, appVersion) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return migrateSession(JSON.parse(raw), appVersion);
  } catch (error) {
    console.warn("Could not load saved session", error);
    return null;
  }
}

export function saveSession(storageKey, payload) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not save session", error);
  }
}

export function clearSession(storageKey) {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("Could not clear session", error);
  }
}
