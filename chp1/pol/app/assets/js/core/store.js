
(function () {
  const utils = window.POLUtils;
  const cfg = window.POLConfig;
  const missionData = window.POLMissionData;

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function buildMissionState(mission) {
    return Object.assign({
      attempts: [],
      bestAttemptId: '',
      lastAttemptId: ''
    }, deepClone(mission.defaultState));
  }

  function makeDefaultState() {
    const firstMission = missionData.missions[0];
    const state = {
      version: missionData.version,
      currentMissionId: firstMission.id,
      helpMode: 'guided',
      missions: {},
      streak: 0,
      completedMissionIds: [],
      sessionStartedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    missionData.missions.forEach(mission => {
      state.missions[mission.id] = buildMissionState(mission);
    });
    return state;
  }

  function loadState() {
    const saved = utils.safeStorageGet(cfg.stateStorageKey, null);
    if (!saved || saved.version !== missionData.version) return makeDefaultState();
    const merged = makeDefaultState();
    merged.currentMissionId = saved.currentMissionId || merged.currentMissionId;
    merged.helpMode = saved.helpMode || merged.helpMode;
    merged.streak = saved.streak || 0;
    merged.completedMissionIds = Array.isArray(saved.completedMissionIds) ? saved.completedMissionIds : [];
    merged.sessionStartedAt = saved.sessionStartedAt || merged.sessionStartedAt;
    missionData.missions.forEach(mission => {
      merged.missions[mission.id] = Object.assign(buildMissionState(mission), saved.missions && saved.missions[mission.id] ? saved.missions[mission.id] : {});
    });
    return merged;
  }

  let state = loadState();

  function save() {
    state.lastUpdated = new Date().toISOString();
    utils.safeStorageSet(cfg.stateStorageKey, state);
  }

  function getState() {
    return state;
  }

  function getMissionById(id) {
    return missionData.missions.find(m => m.id === id) || missionData.missions[0];
  }

  function getCurrentMission() {
    return getMissionById(state.currentMissionId);
  }

  function getMissionState(id) {
    return state.missions[id];
  }

  function getAttemptHistory(id) {
    return (state.missions[id] && state.missions[id].attempts) ? state.missions[id].attempts.slice() : [];
  }

  function setCurrentMission(id) {
    if (!getMissionById(id)) return;
    state.currentMissionId = id;
    save();
  }

  function updateMission(id, patch) {
    state.missions[id] = Object.assign({}, state.missions[id], patch);
    save();
  }

  function toggleArrayItem(id, key, value) {
    const missionState = getMissionState(id);
    const current = Array.isArray(missionState[key]) ? missionState[key].slice() : [];
    const exists = current.includes(value);
    const next = exists ? current.filter(v => v !== value) : current.concat(value);
    missionState[key] = next;
    save();
  }

  function resetMission(id, options) {
    const mission = getMissionById(id);
    const current = state.missions[id] || buildMissionState(mission);
    const normalized = typeof options === 'boolean'
      ? { hardResetBonus: options }
      : Object.assign({ preserveHistory: false, hardResetBonus: true }, options || {});
    const fresh = buildMissionState(mission);
    if (!normalized.hardResetBonus && current.bonusMode) fresh.bonusMode = true;
    if (normalized.preserveHistory) {
      fresh.attempts = Array.isArray(current.attempts) ? current.attempts.slice() : [];
      fresh.bestAttemptId = current.bestAttemptId || '';
      fresh.lastAttemptId = current.lastAttemptId || '';
    }
    state.missions[id] = fresh;
    save();
  }

  function markComplete(id) {
    if (!state.completedMissionIds.includes(id)) {
      state.completedMissionIds.push(id);
      state.streak += 1;
      save();
    }
  }

  function toggleHelpMode() {
    state.helpMode = state.helpMode === 'guided' ? 'concise' : 'guided';
    save();
  }

  function setNestedSelection(id, key, value) {
    state.missions[id][key] = value;
    save();
  }

  function addAttempt(id, attempt) {
    const missionState = getMissionState(id);
    const attempts = Array.isArray(missionState.attempts) ? missionState.attempts.slice() : [];
    attempts.push(attempt);
    missionState.attempts = attempts;
    missionState.lastAttemptId = attempt.id;
    const currentBest = attempts.reduce((best, item) => {
      if (!best) return item;
      return item.overall > best.overall ? item : best;
    }, null);
    missionState.bestAttemptId = currentBest ? currentBest.id : '';
    save();
    return attempt;
  }

  function getSessionSummary() {
    const allAttempts = [];
    missionData.missions.forEach(mission => {
      const attempts = getAttemptHistory(mission.id);
      attempts.forEach(attempt => allAttempts.push(Object.assign({ missionId: mission.id, missionTitle: mission.title }, attempt)));
    });
    const missionsTouched = missionData.missions.filter(mission => getAttemptHistory(mission.id).length > 0).length;
    const summary = {
      totalAttempts: allAttempts.length,
      missionsTouched,
      bestAttempt: null,
      averageOverall: 0,
      commonWeakestMetric: 'Pattern Fit',
      nextMissionId: '',
      nextMissionTitle: ''
    };
    if (!allAttempts.length) {
      const untouched = missionData.missions[0];
      summary.nextMissionId = untouched.id;
      summary.nextMissionTitle = untouched.title;
      return summary;
    }
    const bestAttempt = allAttempts.reduce((best, item) => !best || item.overall > best.overall ? item : best, null);
    summary.bestAttempt = bestAttempt;
    summary.averageOverall = Math.round(allAttempts.reduce((sum, item) => sum + item.overall, 0) / allAttempts.length);
    const metricTotals = {};
    missionData.missions.forEach(() => {});
    allAttempts.forEach(item => {
      Object.keys(item.metrics || {}).forEach(metric => {
        metricTotals[metric] = (metricTotals[metric] || 0) + item.metrics[metric];
      });
    });
    const metricAverages = Object.keys(metricTotals).map(metric => [metric, metricTotals[metric] / allAttempts.length]);
    metricAverages.sort((a, b) => a[1] - b[1]);
    summary.commonWeakestMetric = metricAverages.length ? metricAverages[0][0] : 'Pattern Fit';
    const untouched = missionData.missions.find(mission => getAttemptHistory(mission.id).length === 0);
    if (untouched) {
      summary.nextMissionId = untouched.id;
      summary.nextMissionTitle = untouched.title;
    } else {
      const weakestMission = missionData.missions.map(mission => {
        const attempts = getAttemptHistory(mission.id);
        const best = attempts.reduce((bestItem, item) => !bestItem || item.overall > bestItem.overall ? item : bestItem, null);
        return { mission, bestScore: best ? best.overall : 0 };
      }).sort((a, b) => a.bestScore - b.bestScore)[0];
      summary.nextMissionId = weakestMission.mission.id;
      summary.nextMissionTitle = weakestMission.mission.title;
    }
    return summary;
  }

  function resetAll() {
    state = makeDefaultState();
    save();
  }

  window.POLStore = {
    getState,
    getMissionById,
    getCurrentMission,
    getMissionState,
    getAttemptHistory,
    getSessionSummary,
    setCurrentMission,
    updateMission,
    toggleArrayItem,
    resetMission,
    markComplete,
    toggleHelpMode,
    setNestedSelection,
    addAttempt,
    resetAll,
    save
  };
})();
