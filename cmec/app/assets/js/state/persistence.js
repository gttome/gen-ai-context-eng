import { APP_CONFIG } from '../config.js';

export function loadTheme() {
  return localStorage.getItem(APP_CONFIG.themeKey);
}

export function saveTheme(theme) {
  localStorage.setItem(APP_CONFIG.themeKey, theme);
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(snapshot) {
  try {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore storage issues in static mode.
  }
}

export function clearSession() {
  localStorage.removeItem(APP_CONFIG.storageKey);
}
