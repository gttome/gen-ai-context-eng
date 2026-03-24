
(function () {
  const store = window.POLStore;
  const render = window.POLRender;
  const scoring = window.POLScoring;
  const utils = window.POLUtils;
  const cfg = window.POLConfig;
  const composer = window.POLPackageComposer;

  window.POLWizardState = { currentStep: 1, walkthroughOpen: false, walkthroughIndex: 0, whyScoredOpen: false };

  function currentMissionContext() {
    const mission = store.getCurrentMission();
    const missionState = store.getMissionState(mission.id);
    return { mission, missionState };
  }

  function scrollWizardIntoView() {
    const target = document.querySelector('.wizard-shell') || document.querySelector('.wizard-main') || document.body;
    const topbar = document.querySelector('.topbar');
    requestAnimationFrame(() => {
      const offset = (topbar ? topbar.offsetHeight : 0) + 12;
      const absoluteTop = window.pageYOffset + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, absoluteTop), behavior: 'auto' });
    });
  }

  function setStep(step) {
    window.POLWizardState.currentStep = Math.max(1, Math.min(6, step));
    if (window.POLWizardState.currentStep !== 6) window.POLWizardState.whyScoredOpen = false;
    render.renderAll();
    scrollWizardIntoView();
  }

  function analyzeCurrentMission() {
    const { mission, missionState } = currentMissionContext();
    const results = scoring.analyze(mission, missionState);
    window.POLWizardState.whyScoredOpen = false;
    const normalized = utils.plainText(missionState.pastedOutput || '');
    const attempt = {
      id: utils.uid('attempt'),
      createdAt: new Date().toISOString(),
      overall: results.overall,
      bandLabel: results.band.label,
      metrics: results.metrics,
      packageSummary: results.packageSummary,
      prediction: missionState.prediction || 'none',
      selectedSummary: composer.selectedSummary(mission, missionState),
      pastedOutput: missionState.pastedOutput || '',
      wordCount: normalized ? normalized.split(/\s+/).length : 0,
      nextBestMove: results.nextBestMove,
      coaching: results.coaching.slice(0, 3),
      deltaHighlights: results.deltaHighlights.slice(0, 3)
    };
    store.addAttempt(mission.id, attempt);
    store.updateMission(mission.id, { scoreResults: results, analyzed: true });
    if (results.completedCore) store.markComplete(mission.id);
    setStep(6);
  }

  function togglePattern(kind) {
    const { mission, missionState } = currentMissionContext();
    if (kind === 'grounding') {
      const next = !missionState.groundingEnabled;
      store.updateMission(mission.id, { groundingEnabled: next, selectedEvidence: next ? missionState.selectedEvidence : [] });
    }
    if (kind === 'memory') {
      const next = !missionState.memoryEnabled;
      store.updateMission(mission.id, {
        memoryEnabled: next,
        memoryMode: next ? (missionState.memoryMode === 'none' ? 'rolling' : missionState.memoryMode) : 'none',
        selectedMemory: next ? missionState.selectedMemory : []
      });
    }
    if (kind === 'dynamic') {
      const next = !missionState.dynamicEnabled;
      store.updateMission(mission.id, { dynamicEnabled: next, selectedFacts: next ? missionState.selectedFacts : [] });
    }
  }

  function handlePrediction(value) {
    const { mission } = currentMissionContext();
    store.updateMission(mission.id, { prediction: value });
  }

  function handleItemToggle(group, value) {
    const { mission } = currentMissionContext();
    if (group === 'evidence') store.toggleArrayItem(mission.id, 'selectedEvidence', value);
    if (group === 'memory') store.toggleArrayItem(mission.id, 'selectedMemory', value);
    if (group === 'facts') store.toggleArrayItem(mission.id, 'selectedFacts', value);
  }

  async function copyEverything() {
    const { mission, missionState } = currentMissionContext();
    const externalPrompt = composer.buildExternalPrompt(mission, missionState);
    const ok = await utils.copyText(externalPrompt.text);
    store.updateMission(mission.id, { copied: ok || true });
    render.renderAll();
  }

  function loadSampleOutput() {
    const { mission } = currentMissionContext();
    store.updateMission(mission.id, { pastedOutput: mission.sampleImprovedOutput, analyzed: false, scoreResults: null });
    setStep(5);
  }

  function clearOutput() {
    const { mission } = currentMissionContext();
    store.updateMission(mission.id, { pastedOutput: '', analyzed: false, scoreResults: null });
    setStep(5);
  }

  function handlePasteChange(value) {
    const { mission, missionState } = currentMissionContext();
    const patch = { pastedOutput: value };
    if (missionState.analyzed || missionState.scoreResults) {
      patch.analyzed = false;
      patch.scoreResults = null;
    }
    store.updateMission(mission.id, patch);
    if (window.POLWizardState.currentStep === 6) setStep(5);
    else render.renderAll();
  }

  function setMemoryMode(mode) {
    const { mission } = currentMissionContext();
    store.updateMission(mission.id, { memoryMode: mode });
  }

  function resetMission() {
    const { mission } = currentMissionContext();
    store.resetMission(mission.id, { preserveHistory: true, hardResetBonus: true });
    setStep(1);
  }

  function startOverCompletely() {
    const { mission } = currentMissionContext();
    store.resetMission(mission.id, { preserveHistory: false, hardResetBonus: true });
    setStep(1);
  }

  function openNextMission() {
    const missions = window.POLMissionData.missions;
    const current = store.getCurrentMission();
    const idx = missions.findIndex(m => m.id === current.id);
    const next = missions[(idx + 1) % missions.length];
    store.setCurrentMission(next.id);
    setStep(1);
  }

  function showWalkthrough(index = 0) {
    window.POLWizardState.walkthroughOpen = true;
    window.POLWizardState.walkthroughIndex = Math.max(0, index);
    render.renderAll();
  }

  function toggleWhyScored() {
    window.POLWizardState.whyScoredOpen = !window.POLWizardState.whyScoredOpen;
    render.renderAll();
  }

  function closeWalkthrough(markSeen = true) {
    window.POLWizardState.walkthroughOpen = false;
    window.POLWizardState.walkthroughIndex = 0;
    if (markSeen) utils.safeStorageSet(cfg.walkthroughStorageKey, true);
    render.renderAll();
  }

  function nextWalkthrough() {
    const next = window.POLWizardState.walkthroughIndex + 1;
    if (next >= 4) closeWalkthrough(true);
    else {
      window.POLWizardState.walkthroughIndex = next;
      render.renderAll();
    }
  }

  function prevWalkthrough() {
    window.POLWizardState.walkthroughIndex = Math.max(0, window.POLWizardState.walkthroughIndex - 1);
    render.renderAll();
  }

  function bindEvents() {
    document.body.addEventListener('click', event => {
      const missionBtn = event.target.closest('[data-mission-select]');
      if (missionBtn) {
        store.setCurrentMission(missionBtn.getAttribute('data-mission-select'));
        setStep(1);
        return;
      }

      const predBtn = event.target.closest('[data-prediction]');
      if (predBtn) {
        handlePrediction(predBtn.getAttribute('data-prediction'));
        render.renderAll();
        return;
      }

      const toggleBtn = event.target.closest('[data-toggle-pattern]');
      if (toggleBtn) {
        togglePattern(toggleBtn.getAttribute('data-toggle-pattern'));
        render.renderAll();
        return;
      }

      const memoryBtn = event.target.closest('[data-memory-mode]');
      if (memoryBtn) {
        setMemoryMode(memoryBtn.getAttribute('data-memory-mode'));
        render.renderAll();
        return;
      }

      const stepBtn = event.target.closest('[data-go-step]');
      if (stepBtn && !stepBtn.disabled) {
        setStep(Number(stepBtn.getAttribute('data-go-step')));
        return;
      }

      if (event.target.closest('[data-wizard-back]')) {
        setStep(window.POLWizardState.currentStep - 1);
        return;
      }

      if (event.target.closest('[data-wizard-next]')) {
        if (window.POLWizardState.currentStep < 6 && render.canAdvance(window.POLWizardState.currentStep, currentMissionContext().missionState)) {
          setStep(window.POLWizardState.currentStep + 1);
        }
        return;
      }

      if (event.target.closest('[data-copy-all]')) {
        copyEverything();
        return;
      }

      if (event.target.closest('[data-analyze-output]')) {
        analyzeCurrentMission();
        return;
      }

      if (event.target.closest('[data-load-sample]')) {
        loadSampleOutput();
        return;
      }

      if (event.target.closest('[data-clear-output]')) {
        clearOutput();
        return;
      }

      if (event.target.closest('[data-reset-mission]')) {
        resetMission();
        return;
      }

      if (event.target.closest('[data-start-over]')) {
        startOverCompletely();
        return;
      }

      if (event.target.closest('[data-next-mission]')) {
        openNextMission();
        return;
      }

      if (event.target.closest('[data-show-walkthrough]')) {
        showWalkthrough(0);
        return;
      }

      if (event.target.closest('[data-toggle-why-scored]')) {
        toggleWhyScored();
        return;
      }

      if (event.target.closest('[data-walkthrough-next]')) {
        nextWalkthrough();
        return;
      }

      if (event.target.closest('[data-walkthrough-back]')) {
        prevWalkthrough();
        return;
      }

      if (event.target.closest('[data-walkthrough-close]')) {
        closeWalkthrough(true);
      }
    });

    document.body.addEventListener('change', event => {
      if (event.target.matches('[data-item-toggle]')) {
        handleItemToggle(event.target.getAttribute('data-item-toggle'), event.target.value);
        render.renderAll();
      }
    });

    document.body.addEventListener('input', event => {
      if (event.target.id === 'pasteOutput') handlePasteChange(event.target.value);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && window.POLWizardState.walkthroughOpen) closeWalkthrough(true);
    });
  }

  function init() {
    window.POLShell.init();
    store.resetAll();
    window.POLWizardState.currentStep = 1;
    window.POLWizardState.whyScoredOpen = false;
    bindEvents();
    const seen = utils.safeStorageGet(cfg.walkthroughStorageKey, false);
    window.POLWizardState.walkthroughOpen = !seen;
    window.POLWizardState.walkthroughIndex = 0;
    render.renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
