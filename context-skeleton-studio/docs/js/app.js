(function () {
  "use strict";

  const appState = {
    workflowId: null,
    blocks: [],
    xrayEnabled: true
  };

  const LIMITS = {
    lean: 1200,
    comfortable: 3500,
    heavy: 7000
  };

  const el = {
    workflowSelect: document.getElementById("workflowSelect"),
    blocksContainer: document.getElementById("blocksContainer"),
    validationList: document.getElementById("validationList"),
    previewArea: document.getElementById("previewArea"),
    statusMsg: document.getElementById("statusMsg"),
    validateBtn: document.getElementById("validateBtn"),
    copyBtn: document.getElementById("copyBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    saveBtn: document.getElementById("saveBtn"),
    loadBtn: document.getElementById("loadBtn"),
    clearBtn: document.getElementById("clearBtn"),
    resetOrderBtn: document.getElementById("resetOrderBtn"),
    presetSelect: document.getElementById("presetSelect"),
    loadPresetBtn: document.getElementById("loadPresetBtn"),
    presetDesc: document.getElementById("presetDesc"),
    budgetSummary: document.getElementById("budgetSummary"),
    budgetHint: document.getElementById("budgetHint"),
    xrayToggle: document.getElementById("xrayToggle"),
    exportSnapshotBtn: document.getElementById("exportSnapshotBtn"),
    importSnapshotBtn: document.getElementById("importSnapshotBtn"),
    snapshotFileInput: document.getElementById("snapshotFileInput"),

    appVersion: document.getElementById("appVersion"),
    appEnv: document.getElementById("appEnv"),

    fixtureSelect: document.getElementById("fixtureSelect"),
    loadFixtureBtn: document.getElementById("loadFixtureBtn"),
    fixtureDesc: document.getElementById("fixtureDesc"),
    fixtureLinks: document.getElementById("fixtureLinks"),

    mobileToolsBtn: document.getElementById("mobileToolsBtn"),
    mobileValidateBtn: document.getElementById("mobileValidateBtn"),
    mobileCopyBtn: document.getElementById("mobileCopyBtn"),
    mobileDownloadBtn: document.getElementById("mobileDownloadBtn")
  };

  function init() {
    const data = window.CONTEXT_SKELETON_DATA;
    appState.workflowId = data.workflowTypes[0].id;
    appState.blocks = data.blockTemplates.map(function (b, idx) {
      return {
        id: b.id,
        xrayTag: b.xrayTag || b.id.toUpperCase(),
        label: b.label,
        description: b.description,
        placeholder: b.placeholder,
        example: (data.blockExamples && data.blockExamples[b.id]) ? data.blockExamples[b.id] : "",
        content: "",
        defaultIndex: idx
      };
    });

    renderWorkflowOptions();
    renderPresetOptions();
    renderHeaderBadges();
    renderFixtureOptions();
    renderFixtureLinks();
    renderBlocks();
    bindEvents();
    refreshPreview();
    updateBudgetMeter();

    if (el.xrayToggle) el.xrayToggle.checked = appState.xrayEnabled;

    const startupNotes = [];
    if (window.location && window.location.protocol === "file:") {
      startupNotes.push({
        type: "warn",
        text: "You are running from a file:// URL. For best results, use start-server.bat (local) or GitHub Pages (live)."
      });
    }
    startupNotes.push({ type: "ok", text: "Ready. Fill blocks or load a preset/fixture, then click Validate." });
    renderValidation(startupNotes);
  }

  function renderHeaderBadges() {
    const data = window.CONTEXT_SKELETON_DATA;

    if (el.appVersion) {
      el.appVersion.textContent = (data.appVersion || "").trim() ? data.appVersion : "v?";
    }

    if (el.appEnv) {
      el.appEnv.textContent = getRuntimeEnvLabel();
      el.appEnv.title = getRuntimeEnvDetail();
    }
  }

  function getRuntimeEnvLabel() {
    const loc = window.location;
    if (!loc) return "Unknown";

    if (loc.protocol === "file:") return "File";

    const host = (loc.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return "Local";
    if (host.endsWith("github.io")) return "GitHub Pages";

    return "Web";
  }

  function getRuntimeEnvDetail() {
    const loc = window.location;
    if (!loc) return "";

    return (loc.protocol || "") + "//" + (loc.host || "") + (loc.pathname || "");
  }

  
  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  function scrollToElement(targetEl) {
    if (!targetEl || !targetEl.scrollIntoView) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    try {
      targetEl.scrollIntoView({ behavior: behavior, block: "start" });
    } catch (e) {
      targetEl.scrollIntoView();
    }
  }

function renderWorkflowOptions() {
    const data = window.CONTEXT_SKELETON_DATA;
    el.workflowSelect.innerHTML = "";
    data.workflowTypes.forEach(function (wf) {
      const opt = document.createElement("option");
      opt.value = wf.id;
      opt.textContent = wf.label;
      if (wf.id === appState.workflowId) opt.selected = true;
      el.workflowSelect.appendChild(opt);
    });
  }

  function renderPresetOptions() {
    const presets = window.CONTEXT_SKELETON_DATA.presets || [];
    el.presetSelect.innerHTML = "";
    presets.forEach(function (preset) {
      const opt = document.createElement("option");
      opt.value = preset.id;
      opt.textContent = preset.label;
      el.presetSelect.appendChild(opt);
    });
    updatePresetDescription();
  }

  function updatePresetDescription() {
    const preset = getSelectedPreset();
    el.presetDesc.textContent = preset ? preset.description : "";
  }

  function renderFixtureOptions() {
    if (!el.fixtureSelect || !el.loadFixtureBtn || !el.fixtureDesc) return;

    const fixtures = window.CONTEXT_SKELETON_DATA.fixtures || [];
    el.fixtureSelect.innerHTML = "";

    if (!fixtures.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(No fixtures available)";
      el.fixtureSelect.appendChild(opt);
      el.loadFixtureBtn.disabled = true;
      el.fixtureDesc.textContent = "";
      return;
    }

    fixtures.forEach(function (fixture) {
      const opt = document.createElement("option");
      opt.value = fixture.id;
      opt.textContent = fixture.label;
      el.fixtureSelect.appendChild(opt);
    });

    el.loadFixtureBtn.disabled = false;
    updateFixtureDescription();
  }

  function updateFixtureDescription() {
    if (!el.fixtureDesc) return;
    const fixture = getSelectedFixture();
    el.fixtureDesc.textContent = fixture ? fixture.description : "";
  }

  function renderFixtureLinks() {
    if (!el.fixtureLinks) return;

    const samples = window.CONTEXT_SKELETON_DATA.sampleSnapshotFiles || [];
    el.fixtureLinks.innerHTML = "";

    if (!samples.length) return;

    const label = document.createElement("p");
    label.className = "small-help";
    label.textContent = "Sample snapshot files (for Import .json testing):";
    el.fixtureLinks.appendChild(label);

    const list = document.createElement("ul");
    list.className = "mini-links";

    samples.forEach(function (s) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = s.path;
      a.textContent = s.label;
      a.setAttribute("download", "");
      li.appendChild(a);
      list.appendChild(li);
    });

    el.fixtureLinks.appendChild(list);
  }

  function renderBlocks(focusIndex) {
    el.blocksContainer.innerHTML = "";

    appState.blocks.forEach(function (block, index) {
      const card = document.createElement("div");
      card.className = "block-card";
      card.setAttribute("data-block-id", block.id);

      const top = document.createElement("div");
      top.className = "block-top";

      const titleWrap = document.createElement("div");
      const title = document.createElement("p");
      title.className = "block-title";
      title.textContent = String(index + 1) + ". " + block.label;

      const desc = document.createElement("p");
      desc.className = "block-desc";
      desc.textContent = block.description;

      titleWrap.appendChild(title);
      titleWrap.appendChild(desc);

      const controls = document.createElement("div");
      controls.className = "order-controls";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.textContent = "Move ↑";
      upBtn.title = "Move up";
      upBtn.setAttribute("aria-label", "Move " + block.label + " up");
      upBtn.disabled = index === 0;
      upBtn.addEventListener("click", function () {
        moveBlock(index, -1, true);
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.textContent = "Move ↓";
      downBtn.title = "Move down";
      downBtn.setAttribute("aria-label", "Move " + block.label + " down");
      downBtn.disabled = index === appState.blocks.length - 1;
      downBtn.addEventListener("click", function () {
        moveBlock(index, 1, true);
      });

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);

      top.appendChild(titleWrap);
      top.appendChild(controls);

      const area = document.createElement("textarea");
      area.setAttribute("aria-label", block.label);
      area.setAttribute("data-block-index", String(index));
      area.placeholder = block.placeholder;
      area.value = block.content;
      area.addEventListener("input", function (evt) {
        block.content = evt.target.value;
        refreshPreview();
        updateBudgetMeter();
      });
      area.addEventListener("keydown", function (evt) {
        handleBlockKeyboard(evt, index);
      });

      const hint = document.createElement("p");
      hint.className = "example-hint";
      hint.textContent = "Example: " + block.example;

      card.appendChild(top);
      card.appendChild(area);
      card.appendChild(hint);
      el.blocksContainer.appendChild(card);
    });

    if (typeof focusIndex === "number") {
      const areas = el.blocksContainer.querySelectorAll("textarea");
      const safeIndex = Math.max(0, Math.min(areas.length - 1, focusIndex));
      if (areas[safeIndex]) areas[safeIndex].focus();
    }
  }

  function handleBlockKeyboard(evt, index) {
    if (evt.altKey && evt.shiftKey && !evt.ctrlKey && evt.key === "ArrowUp") {
      evt.preventDefault();
      moveBlock(index, -1, true);
      return;
    }
    if (evt.altKey && evt.shiftKey && !evt.ctrlKey && evt.key === "ArrowDown") {
      evt.preventDefault();
      moveBlock(index, 1, true);
      return;
    }
    if (evt.ctrlKey && !evt.altKey && evt.key === "Enter") {
      evt.preventDefault();
      const messages = validateCurrentState();
      renderValidation(messages);
      setStatus("Validated (keyboard shortcut).");
    }
  }

  function moveBlock(index, delta, preserveFocus) {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= appState.blocks.length) return;
    const moved = appState.blocks.splice(index, 1)[0];
    appState.blocks.splice(newIndex, 0, moved);
    renderBlocks(preserveFocus ? newIndex : undefined);
    refreshPreview();
    updateBudgetMeter();
    setStatus("Moved \"" + moved.label + "\" to position " + (newIndex + 1) + ".");
  }

  function resetOrder() {
    appState.blocks.sort(function (a, b) { return a.defaultIndex - b.defaultIndex; });
    renderBlocks();
    refreshPreview();
    updateBudgetMeter();
    setStatus("Block order reset.");
  }

  function bindEvents() {
    el.workflowSelect.addEventListener("change", function () {
      appState.workflowId = el.workflowSelect.value;
      refreshPreview();
      updateBudgetMeter();
      setStatus("Workflow changed to: " + el.workflowSelect.options[el.workflowSelect.selectedIndex].text);
    });

    el.presetSelect.addEventListener("change", updatePresetDescription);

    el.loadPresetBtn.addEventListener("click", function () {
      loadSelectedPreset();
    });

    if (el.fixtureSelect) {
      el.fixtureSelect.addEventListener("change", updateFixtureDescription);
    }

    if (el.loadFixtureBtn) {
      el.loadFixtureBtn.addEventListener("click", function () {
        loadSelectedFixture();
      });
    }

    el.validateBtn.addEventListener("click", function () {
      const messages = validateCurrentState();
      renderValidation(messages);
      refreshPreview();
      updateBudgetMeter();
      setStatus("Validation complete.");
    });

    el.xrayToggle.addEventListener("change", function () {
      appState.xrayEnabled = !!el.xrayToggle.checked;
      refreshPreview();
      setStatus(appState.xrayEnabled ? "Context X-Ray labels enabled." : "Context X-Ray labels disabled.");
    });

    el.copyBtn.addEventListener("click", async function () {
      const text = buildAssembledText();
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Copied assembled context to clipboard.");
      } catch (err) {
        setStatus("Clipboard copy blocked by browser. Use Download .txt instead.");
      }
    });

    el.downloadBtn.addEventListener("click", function () {
      const blob = new Blob([buildAssembledText()], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "context-package.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setStatus("Downloaded context-package.txt");
    });

    el.exportSnapshotBtn.addEventListener("click", function () {
      downloadSnapshotJson();
    });

    el.importSnapshotBtn.addEventListener("click", function () {
      el.snapshotFileInput.value = "";
      el.snapshotFileInput.click();
    });

    el.snapshotFileInput.addEventListener("change", function () {
      if (!el.snapshotFileInput.files || !el.snapshotFileInput.files[0]) return;
      importSnapshotFile(el.snapshotFileInput.files[0]);
    });

    el.saveBtn.addEventListener("click", function () {
      const payload = buildDraftPayload();
      localStorage.setItem(window.CONTEXT_SKELETON_DATA.storageKey, JSON.stringify(payload));
      setStatus("Draft saved in this browser.");
    });

    el.loadBtn.addEventListener("click", function () {
      const raw = localStorage.getItem(window.CONTEXT_SKELETON_DATA.storageKey);
      if (!raw) {
        setStatus("No saved draft found.");
        return;
      }
      try {
        const payload = JSON.parse(raw);
        applyDraft(payload);
        setStatus("Draft loaded.");
      } catch (err) {
        setStatus("Saved draft could not be loaded (invalid format).");
      }
    });

    el.clearBtn.addEventListener("click", function () {
      const ok = window.confirm("Clear all blocks and remove the saved draft?");
      if (!ok) return;
      appState.blocks.forEach(function (b) { b.content = ""; });
      localStorage.removeItem(window.CONTEXT_SKELETON_DATA.storageKey);
      renderBlocks();
      refreshPreview();
      updateBudgetMeter();
      renderValidation([{ type: "ok", text: "Draft cleared." }]);
      setStatus("Draft cleared.");
    });


    /* Mobile quick-action bar bindings (phone/tablet usability) */
    if (el.mobileToolsBtn) {
      el.mobileToolsBtn.addEventListener("click", function () {
        const tools = document.getElementById("toolsTitle");
        scrollToElement(tools);
        setStatus("Jumped to Tools.");
      });
    }
    if (el.mobileValidateBtn) {
      el.mobileValidateBtn.addEventListener("click", function () {
        el.validateBtn.click();
      });
    }
    if (el.mobileCopyBtn) {
      el.mobileCopyBtn.addEventListener("click", function () {
        el.copyBtn.click();
      });
    }
    if (el.mobileDownloadBtn) {
      el.mobileDownloadBtn.addEventListener("click", function () {
        el.downloadBtn.click();
      });
    }

    /* Theme toggle status (theme.js dispatches css-theme-changed) */
    window.addEventListener("css-theme-changed", function (evt) {
      if (!evt || !evt.detail || !evt.detail.theme) return;
      setStatus("Theme set to " + evt.detail.theme + ".");
    });

    el.resetOrderBtn.addEventListener("click", resetOrder);
  }

  function buildDraftPayload() {
    return {
      savedAt: new Date().toISOString(),
      workflowId: appState.workflowId,
      xrayEnabled: appState.xrayEnabled,
      blocks: appState.blocks.map(function (b) { return { id: b.id, content: b.content }; }),
      order: appState.blocks.map(function (b) { return b.id; })
    };
  }

  function buildSnapshotPayload() {
    const wf = getWorkflowConfig();
    const data = window.CONTEXT_SKELETON_DATA;

    return {
      app: data.appName || "Context Skeleton Studio",
      appVersion: data.appVersion || "",
      snapshotVersion: data.snapshotVersion || "1.0.0",
      exportedAt: new Date().toISOString(),
      workflow: {
        id: appState.workflowId,
        label: wf ? wf.label : appState.workflowId
      },
      xrayEnabled: appState.xrayEnabled,
      order: appState.blocks.map(function (b) { return b.id; }),
      blocks: appState.blocks.map(function (b) {
        return {
          id: b.id,
          label: b.label,
          xrayTag: b.xrayTag,
          content: b.content || ""
        };
      })
    };
  }

  function downloadSnapshotJson() {
    const payload = buildSnapshotPayload();
    const slug = (payload.workflow && payload.workflow.id ? payload.workflow.id : "snapshot").replace(/[^a-z0-9_-]/gi, "_");
    const stamp = (payload.exportedAt || "").replace(/[:]/g, "-").replace(/\..+$/, "").replace("T", "_");
    const fileName = "context-snapshot_" + slug + "_" + stamp + ".json";
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setStatus("Downloaded " + fileName);
  }

  function importSnapshotFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const payload = JSON.parse(String(reader.result || ""));
        validateSnapshotPayload(payload);
        applyDraft({
          workflowId: payload.workflow && payload.workflow.id ? payload.workflow.id : payload.workflowId,
          xrayEnabled: payload.xrayEnabled,
          order: payload.order,
          blocks: Array.isArray(payload.blocks)
            ? payload.blocks.map(function (b) { return { id: b.id, content: b.content || "" }; })
            : []
        });
        const messages = validateCurrentState();
        renderValidation(messages);
        setStatus("Imported snapshot: " + file.name);
      } catch (err) {
        setStatus("Snapshot import failed: " + (err && err.message ? err.message : "Invalid JSON"));
      }
    };
    reader.onerror = function () {
      setStatus("Snapshot import failed: file could not be read.");
    };
    reader.readAsText(file);
  }

  function validateSnapshotPayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Snapshot must be a JSON object");
    }
    if (!Array.isArray(payload.blocks)) {
      throw new Error("Snapshot missing blocks array");
    }
    if (!Array.isArray(payload.order)) {
      throw new Error("Snapshot missing order array");
    }
    if (!payload.workflow || typeof payload.workflow.id !== "string") {
      throw new Error("Snapshot missing workflow.id");
    }

    const knownIds = new Set(appState.blocks.map(function (b) { return b.id; }));
    payload.blocks.forEach(function (b) {
      if (!b || typeof b.id !== "string" || !knownIds.has(b.id)) {
        throw new Error("Snapshot contains unknown block id");
      }
      if (typeof b.content !== "string") {
        throw new Error("Snapshot block content must be text");
      }
    });
    payload.order.forEach(function (id) {
      if (!knownIds.has(id)) throw new Error("Snapshot order contains unknown block id");
    });
  }

  function getSelectedPreset() {
    const presets = window.CONTEXT_SKELETON_DATA.presets || [];
    const selectedId = el.presetSelect.value;
    for (let i = 0; i < presets.length; i += 1) {
      if (presets[i].id === selectedId) return presets[i];
    }
    return null;
  }

  function loadSelectedPreset() {
    const preset = getSelectedPreset();
    if (!preset || preset.id === "blank") {
      setStatus("Blank preset selected. No changes applied.");
      return;
    }

    const hasExistingContent = appState.blocks.some(function (b) {
      return !!(b.content && b.content.trim());
    });

    if (hasExistingContent) {
      const confirmOverwrite = window.confirm("This will replace the current block text with preset content. Continue?");
      if (!confirmOverwrite) {
        setStatus("Preset load canceled.");
        return;
      }
    }

    appState.workflowId = preset.workflowId || appState.workflowId;
    el.workflowSelect.value = appState.workflowId;

    appState.blocks.sort(function (a, b) { return a.defaultIndex - b.defaultIndex; });

    appState.blocks.forEach(function (block) {
      const text = preset.blocks && Object.prototype.hasOwnProperty.call(preset.blocks, block.id)
        ? preset.blocks[block.id]
        : "";
      block.content = text || "";
    });

    renderBlocks();
    refreshPreview();
    updateBudgetMeter();

    const messages = validateCurrentState();
    renderValidation(messages);
    setStatus("Loaded preset: " + preset.label);
  }

  function getSelectedFixture() {
    const fixtures = window.CONTEXT_SKELETON_DATA.fixtures || [];
    const selectedId = el.fixtureSelect ? el.fixtureSelect.value : "";
    for (let i = 0; i < fixtures.length; i += 1) {
      if (fixtures[i].id === selectedId) return fixtures[i];
    }
    return null;
  }

  function loadSelectedFixture() {
    const fixture = getSelectedFixture();
    if (!fixture) {
      setStatus("No fixture selected.");
      return;
    }

    const hasExistingContent = appState.blocks.some(function (b) {
      return !!(b.content && b.content.trim());
    });

    if (hasExistingContent) {
      const confirmOverwrite = window.confirm("This will replace the current block text with fixture content. Continue?");
      if (!confirmOverwrite) {
        setStatus("Fixture load canceled.");
        return;
      }
    }

    const payload = {
      workflowId: fixture.workflowId,
      xrayEnabled: typeof fixture.xrayEnabled === "boolean" ? fixture.xrayEnabled : true,
      order: fixture.order,
      blocks: appState.blocks.map(function (b) {
        const content = fixture.blocks && Object.prototype.hasOwnProperty.call(fixture.blocks, b.id)
          ? String(fixture.blocks[b.id] || "")
          : "";
        return { id: b.id, content: content };
      })
    };

    applyDraft(payload);

    const messages = validateCurrentState();
    renderValidation(messages);
    setStatus("Loaded fixture: " + fixture.label);
  }

  function applyDraft(payload) {
    if (payload.workflowId) {
      appState.workflowId = payload.workflowId;
      el.workflowSelect.value = payload.workflowId;
    }

    if (typeof payload.xrayEnabled === "boolean") {
      appState.xrayEnabled = payload.xrayEnabled;
      el.xrayToggle.checked = appState.xrayEnabled;
    }

    const byId = new Map(appState.blocks.map(function (b) { return [b.id, b]; }));
    (payload.blocks || []).forEach(function (saved) {
      if (byId.has(saved.id)) {
        byId.get(saved.id).content = saved.content || "";
      }
    });

    if (Array.isArray(payload.order) && payload.order.length === appState.blocks.length) {
      const ordered = [];
      payload.order.forEach(function (id) {
        if (byId.has(id)) ordered.push(byId.get(id));
      });
      if (ordered.length === appState.blocks.length) {
        appState.blocks = ordered;
      }
    }

    renderBlocks();
    refreshPreview();
    updateBudgetMeter();
  }

  function getWorkflowConfig() {
    return window.CONTEXT_SKELETON_DATA.workflowTypes.find(function (wf) {
      return wf.id === appState.workflowId;
    });
  }

  function getContentStats() {
    const totalChars = appState.blocks.reduce(function (sum, b) {
      return sum + (b.content || "").trim().length;
    }, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    return { totalChars: totalChars, estimatedTokens: estimatedTokens };
  }

  function updateBudgetMeter() {
    const stats = getContentStats();
    el.budgetSummary.textContent = "Chars: " + stats.totalChars + " · Est. tokens: " + stats.estimatedTokens;

    let hintText = "";
    let cls = "budget-hint ok";

    if (stats.totalChars === 0) {
      hintText = "Start small. Fill only what you know, then validate.";
      cls = "budget-hint";
    } else if (stats.totalChars <= LIMITS.lean) {
      hintText = "Lean draft. Good for fast prompts. Add grounding if you need more reliability.";
      cls = "budget-hint ok";
    } else if (stats.totalChars <= LIMITS.comfortable) {
      hintText = "Good range for most tasks. Keep only the highest-value facts and constraints.";
      cls = "budget-hint ok";
    } else if (stats.totalChars <= LIMITS.heavy) {
      hintText = "Getting heavy. Trim repeated instructions and summarize long grounding text.";
      cls = "budget-hint warn";
    } else {
      hintText = "Very long draft. High risk of wasted tokens or buried instructions. Compress before shipping.";
      cls = "budget-hint err";
    }

    el.budgetHint.textContent = hintText;
    el.budgetHint.className = cls;
  }

  function validateCurrentState() {
    const messages = [];
    const wf = getWorkflowConfig();

    wf.required.forEach(function (requiredId) {
      const block = appState.blocks.find(function (b) { return b.id === requiredId; });
      if (!block || !block.content.trim()) {
        messages.push({
          type: "err",
          text: "Missing required block for \"" + wf.label + "\": " + (block ? block.label : requiredId)
        });
      }
    });

    const indexById = {};
    appState.blocks.forEach(function (b, idx) { indexById[b.id] = idx; });

    const half = Math.floor(appState.blocks.length / 2);
    if (indexById.role > half) {
      messages.push({ type: "warn", text: "Role / System Instructions is buried too low. Move it near the top." });
    }
    if (indexById.rules > half) {
      messages.push({ type: "warn", text: "Rules / Constraints should usually be near the top." });
    }
    if (indexById.request < appState.blocks.length - 2) {
      messages.push({ type: "warn", text: "User Request is early. Move it near the end." });
    }

    const stats = getContentStats();
    if (stats.totalChars > LIMITS.comfortable && stats.totalChars <= LIMITS.heavy) {
      messages.push({
        type: "warn",
        text: "Content is getting long (" + stats.totalChars + " chars, ~" + stats.estimatedTokens + " tokens). Trim repeated text."
      });
    }
    if (stats.totalChars > LIMITS.heavy) {
      messages.push({
        type: "warn",
        text: "Content is very long (" + stats.totalChars + " chars, ~" + stats.estimatedTokens + " tokens). Summarize before export."
      });
    }

    if (appState.workflowId === "multi_turn") {
      const memoryBlock = appState.blocks.find(function (b) { return b.id === "memory"; });
      if (memoryBlock && !memoryBlock.content.trim()) {
        messages.push({ type: "warn", text: "Multi-turn workflow selected, but Memory is empty. Add pinned facts or a rolling summary." });
      }
    }

    if (appState.workflowId === "reliability") {
      const groundingBlock = appState.blocks.find(function (b) { return b.id === "grounding"; });
      if (groundingBlock && groundingBlock.content.trim().length < 40) {
        messages.push({ type: "warn", text: "Reliability workflow works best with a stronger Grounding Knowledge block (excerpt, notes, or facts)." });
      }
    }

    if (messages.length === 0) {
      messages.push({ type: "ok", text: "Validation passed for \"" + wf.label + "\"." });
    }

    return messages;
  }

  function renderValidation(messages) {
    el.validationList.innerHTML = "";
    messages.forEach(function (msg) {
      const li = document.createElement("li");
      li.className = msg.type;
      li.textContent = msg.text;
      el.validationList.appendChild(li);
    });
  }

  function buildAssembledText() {
    const wf = getWorkflowConfig();
    const lines = [];
    lines.push("# Context Package");
    lines.push("Workflow: " + wf.label);
    lines.push("Context X-Ray: " + (appState.xrayEnabled ? "On" : "Off"));
    lines.push("Generated by: " + (window.CONTEXT_SKELETON_DATA.appName || "Context Skeleton Studio") + " " + (window.CONTEXT_SKELETON_DATA.appVersion || ""));
    lines.push("");

    appState.blocks.forEach(function (block) {
      const trimmed = (block.content || "").trim();
      if (!trimmed) return;

      if (appState.xrayEnabled) {
        lines.push("## [" + block.xrayTag + "] " + block.label);
      } else {
        lines.push("## " + block.label);
      }
      lines.push(trimmed);
      lines.push("");
    });

    return lines.join("\n");
  }

  function refreshPreview() {
    el.previewArea.value = buildAssembledText();
  }

  function setStatus(text) {
    el.statusMsg.textContent = text || "";
  }

  init();
})();
