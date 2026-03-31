import { ACTIONS } from "./actions.js";
import { deepClone } from "../utils/helpers.js";

function initialSession() {
  return {
    missionId: null,
    stage: "launch",
    resumeStage: null,
    quickPrediction: "",
    classifications: {},
    filters: {
      search: "",
      authority: "all",
      freshness: "all"
    },
    copiedAt: null,
    exportPayload: "",
    pastedOutput: "",
    compareOpened: false,
    summaryOpened: false,
    coreComplete: false,
    bonusActive: false,
    bonusBranchId: null,
    bonusBranchLabel: "",
    budgetLimit: null,
    startedAt: null,
    lastSavedAt: null
  };
}

function normalizeRestoredSession(session) {
  const next = { ...initialSession(), ...(session || {}) };
  if (next.missionId && !next.resumeStage) {
    if (next.stage && next.stage !== "launch") next.resumeStage = next.stage;
    else if (next.summaryOpened) next.resumeStage = "summary";
    else if (next.compareOpened) next.resumeStage = "comparison";
    else if (next.exportPayload || next.pastedOutput) next.resumeStage = "export";
    else if (Object.keys(next.classifications || {}).length) next.resumeStage = "workspace";
    else next.resumeStage = "brief";
  }
  return next;
}

export function createInitialState() {
  return {
    appVersion: "",
    appName: "",
    config: null,
    metricsConfig: null,
    coachingConfig: null,
    glossary: [],
    missions: [],
    theme: "system",
    environmentLabel: "",
    needsResumeNotice: false,
    session: initialSession(),
    missionDirector: {}
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT_DATA: {
      return {
        ...state,
        appVersion: action.payload.config.version,
        appName: action.payload.config.appName,
        config: action.payload.config,
        metricsConfig: action.payload.metricsConfig,
        coachingConfig: action.payload.coachingConfig,
        glossary: action.payload.glossary,
        missions: action.payload.missions,
        environmentLabel: action.payload.environmentLabel,
        theme: action.payload.theme ?? state.theme
      };
    }
    case ACTIONS.RESTORE_SESSION: {
      return {
        ...state,
        theme: action.payload.theme ?? state.theme,
        needsResumeNotice: action.payload.needsResumeNotice ?? state.needsResumeNotice,
        missionDirector: action.payload.missionDirector || state.missionDirector || {},
        session: action.payload.session ? normalizeRestoredSession(action.payload.session) : state.session
      };
    }
    case ACTIONS.START_MISSION: {
      const mission = state.missions.find(item => item.id === action.payload.missionId);
      const existingRecord = state.missionDirector?.[mission.id] || {};
      const startedAt = new Date().toISOString();
      return {
        ...state,
        needsResumeNotice: false,
        missionDirector: {
          ...state.missionDirector,
          [mission.id]: {
            ...existingRecord,
            attempts: (existingRecord.attempts || 0) + 1,
            lastPlayedAt: startedAt
          }
        },
        session: {
          ...initialSession(),
          missionId: mission.id,
          stage: "brief",
          resumeStage: "brief",
          budgetLimit: mission.budgetLimit,
          startedAt
        }
      };
    }
    case ACTIONS.SET_STAGE: {
      const nextStage = action.payload.stage;
      return {
        ...state,
        session: {
          ...state.session,
          stage: nextStage,
          resumeStage: nextStage === "launch"
            ? (state.session.resumeStage || (state.session.stage !== "launch" ? state.session.stage : null))
            : nextStage
        }
      };
    }
    case ACTIONS.CLASSIFY_CARD: {
      const next = deepClone(state.session.classifications);
      next[action.payload.cardId] = { action: action.payload.action };
      return {
        ...state,
        session: {
          ...state.session,
          stage: state.session.stage === "brief" ? "workspace" : state.session.stage,
          resumeStage: (state.session.stage === "brief" ? "workspace" : state.session.resumeStage || state.session.stage),
          classifications: next
        }
      };
    }
    case ACTIONS.SET_FILTERS: {
      return {
        ...state,
        session: {
          ...state.session,
          filters: {
            ...state.session.filters,
            ...action.payload
          }
        }
      };
    }
    case ACTIONS.SAVE_PREDICTION: {
      return {
        ...state,
        session: {
          ...state.session,
          quickPrediction: action.payload.value
        }
      };
    }
    case ACTIONS.BUILD_EXPORT_PAYLOAD: {
      return {
        ...state,
        session: {
          ...state.session,
          stage: "export",
          resumeStage: "export",
          exportPayload: action.payload.value
        }
      };
    }
    case ACTIONS.MARK_PACKAGE_COPIED: {
      return {
        ...state,
        session: {
          ...state.session,
          copiedAt: new Date().toISOString()
        }
      };
    }
    case ACTIONS.CAPTURE_PASTEBACK_OUTPUT: {
      return {
        ...state,
        session: {
          ...state.session,
          pastedOutput: action.payload.value
        }
      };
    }
    case ACTIONS.OPEN_REVIEW_COMPARISON: {
      return {
        ...state,
        session: {
          ...state.session,
          stage: "comparison",
          resumeStage: "comparison",
          compareOpened: true
        }
      };
    }
    case ACTIONS.OPEN_SUMMARY: {
      const missionId = state.session.missionId;
      const existingRecord = state.missionDirector?.[missionId] || {};
      const completedAt = new Date().toISOString();
      const nextBranches = { ...(existingRecord.branchesCompleted || {}) };
      if (action.payload?.branchId) nextBranches[action.payload.branchId] = true;
      const nextBestComposite = typeof action.payload?.composite === "number"
        ? Math.max(existingRecord.bestComposite || 0, action.payload.composite)
        : (existingRecord.bestComposite || 0);
      const nextBestReview = typeof action.payload?.reviewScore === "number"
        ? Math.max(existingRecord.bestReviewScore || 0, action.payload.reviewScore)
        : (existingRecord.bestReviewScore || 0);
      return {
        ...state,
        missionDirector: missionId ? {
          ...state.missionDirector,
          [missionId]: {
            ...existingRecord,
            coreCompleted: !state.session.bonusBranchId ? true : Boolean(existingRecord.coreCompleted),
            bestComposite: nextBestComposite,
            bestReviewScore: nextBestReview,
            branchesCompleted: nextBranches,
            lastCompletedAt: completedAt,
            lastBranchLabel: action.payload?.branchLabel || existingRecord.lastBranchLabel || ""
          }
        } : state.missionDirector,
        session: {
          ...state.session,
          stage: "summary",
          resumeStage: "summary",
          summaryOpened: true,
          coreComplete: true
        }
      };
    }
    case ACTIONS.ACTIVATE_BONUS_BRANCH: {
      return {
        ...state,
        session: {
          ...state.session,
          bonusActive: true,
          bonusBranchId: action.payload.branchId,
          bonusBranchLabel: action.payload.bonusLabel,
          stage: "workspace",
          resumeStage: "workspace",
          budgetLimit: action.payload.budgetLimit,
          classifications: {},
          exportPayload: "",
          pastedOutput: "",
          copiedAt: null
        }
      };
    }
    case ACTIONS.RESET_MISSION: {
      if (!state.session.missionId) return state;
      const mission = state.missions.find(item => item.id === state.session.missionId);
      return {
        ...state,
        session: {
          ...initialSession(),
          missionId: mission.id,
          stage: "brief",
          resumeStage: "brief",
          budgetLimit: mission.budgetLimit,
          startedAt: new Date().toISOString()
        }
      };
    }
    case ACTIONS.TOGGLE_THEME: {
      return {
        ...state,
        theme: action.payload.value
      };
    }
    case ACTIONS.CLEAR_SESSION: {
      return {
        ...state,
        needsResumeNotice: false,
        session: initialSession()
      };
    }
    case ACTIONS.RESTART_FRESH: {
      return {
        ...state,
        needsResumeNotice: false,
        missionDirector: {},
        session: initialSession()
      };
    }
    default:
      return state;
  }
}

export function createStore(initialState, reducerFn) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState() {
      return state;
    },
    dispatch(action) {
      state = reducerFn(state, action);
      listeners.forEach(listener => listener(state, action));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
