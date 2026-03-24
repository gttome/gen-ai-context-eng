export function createStore(initialState, storageKey) {
  let state = structuredClone(initialState);
  const listeners = new Set();

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function notify() {
    persist();
    listeners.forEach((listener) => listener(getState()));
  }

  function getState() {
    return structuredClone(state);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    notify();
  }

  function update(mutator) {
    const draft = structuredClone(state);
    mutator(draft);
    state = draft;
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function hydrate() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } catch {
      // ignore corrupt persistence and continue with defaults
    }
  }

  function reset(nextState) {
    state = structuredClone(nextState);
    notify();
  }

  hydrate();
  return { getState, setState, update, subscribe, reset };
}
