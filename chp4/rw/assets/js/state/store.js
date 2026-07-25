export const APP_VERSION = "v15.0.0";

export const createInitialRunState = () => ({
  scenarioId: null,
  route: "launcher",
  reviewedChecks: {},
  checkSelections: {},
  decision: null,
  monitoring: [],
  pastebackOutput: "",
  copiedPacketAt: null,
  completed: false,
  finalizedAt: null
});

export const createInitialLauncherFilters = () => ({
  search: "",
  domain: "all",
  difficulty: "all",
  pack: "all",
  mode: "all",
  sort: "recommended"
});

export const createInitialState = () => ({
  version: APP_VERSION,
  themeChoice: null,
  runtime: "Web",
  glossaryOpen: false,
  scenarios: [],
  glossary: [],
  scenarioRegistry: { packs: [] },
  launcherFilters: createInitialLauncherFilters(),
  run: createInitialRunState()
});

export function createStore(initialState) {
  let state = structuredClone(initialState);
  const subscribers = new Set();

  return {
    getState() {
      return structuredClone(state);
    },
    setState(updater) {
      const nextState = typeof updater === "function" ? updater(structuredClone(state)) : updater;
      state = nextState;
      subscribers.forEach((fn) => fn(this.getState()));
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };
}
