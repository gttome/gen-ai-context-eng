export function loadJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Failed to load localStorage key", key, error);
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Failed to save localStorage key", key, error);
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn("Failed to remove localStorage key", key, error);
    return false;
  }
}