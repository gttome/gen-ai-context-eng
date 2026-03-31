export function loadJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Persistence unavailable for", key, error);
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Could not remove key", key, error);
  }
}
