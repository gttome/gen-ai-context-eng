// Enterprise Scenario Arcade — Iteration 2 (static, no LLM calls) — Patch v0.4.0
(() => {
  "use strict";

  const APP_VERSION = "v0.4.0";
  const THEME_KEY = "app_theme";
  const STATE_KEY = "esa_state_v0_3";
  const LEGACY_STATE_KEYS = ["esa_state_v0_2","esa_state_v0_1"];
  const HISTORY_KEY = "esa_history_v0_3";
  const SAVED_RUNS_KEY = "esa_saved_runs_v0_3";

  // ---- Shared Features: env + theme (from integration guide) ----
  function detectEnvironment() {
    const { protocol, hostname } = window.location;
    if (protocol === "file:") return "File";
    if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";
    if (hostname.endsWith("github.io")) return "GitHub Pages";
    return "Web";
  }

  function setStatusPills() {
    const v = document.getElementById("pillVersion");
    const e = document.getElementById("pillEnv");
    if (v) v.textContent = APP_VERSION;
    if (e) e.textContent = detectEnvironment();
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const status = document.getElementById("themeStatus");
    if (status) status.textContent = `Theme set to ${theme}`;
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  // ---- Scenario Data ----
  const FALLBACK_SCENARIOS = {"support": {"id": "support", "title": "Customer Support: Subscription Downgrade", "tagline": "Answer a customer using only policy excerpts + account facts—no speculation.", "requiredHeadings": ["Explanation", "Next Steps", "Needed Info"], "skeleton": {"role": "You are a customer support agent for [Company].", "rules": "- Use only the provided policy excerpts.\n- Do not speculate.\n- Be concise and friendly.\n- If information is missing, ask for it in 'Needed Info'.", "dynamicFacts": "Today’s date: 2026-02-27\nAccount status: ACTIVE\nPlan: Pro\nLast payment: 2026-02-12\nDowngrade event: 2026-02-25\nCustomer sentiment: Frustrated", "grounding": ["Policy Excerpt 1: If payment fails or is reversed, accounts may be downgraded after the grace period. Remediation: update payment method and retry billing.", "Policy Excerpt 2: Customers can restore their plan by resolving billing and contacting support if the plan does not restore within 24 hours."], "memory": "", "outputFormat": "Use headings: Explanation / Next Steps / Needed Info.", "userRequest": "Why was my subscription downgraded, and how do I get it back?"}, "scoring": {"mustReferenceExcerpt": true, "mustAskForMissingInfo": true, "mustAvoidSpeculation": true}}, "hr": {"id": "hr", "title": "HR Policy Assistant: Vacation Carryover", "tagline": "Answer grounded in policy excerpt; no legal advice; provide escalation path.", "requiredHeadings": ["Answer", "Summary", "Escalation"], "skeleton": {"role": "You are an HR policy assistant. You explain policy clearly and neutrally.", "rules": "- Do not provide legal advice.\n- Use only the policy excerpt below.\n- Quote or reference the excerpt.\n- If the policy is silent or unclear, advise the employee to contact HR.", "dynamicFacts": "Today’s date: 2026-02-27\nEmployee type: Full-time\nCountry/region: [Enter region]\nCurrent balance: [Enter days/hours]", "grounding": ["HR Policy Excerpt 1: Unused vacation may be carried over up to 5 days into the next calendar year. Any amount above 5 days is forfeited unless approved exception applies."], "memory": "", "outputFormat": "Use headings: Answer / Summary / Escalation.", "userRequest": "Can I carry over unused vacation days into next year?"}, "scoring": {"mustReferenceExcerpt": true, "mustIncludeNoLegalAdvice": true, "mustIncludeEscalation": true}}, "ops": {"id": "ops", "title": "Operations Incident Triage: Status Update", "tagline": "Summarize notes without inventing facts; label assumptions; provide next actions.", "requiredHeadings": ["Timeline", "Current Impact", "Hypotheses", "Next Actions", "Owner Requests"], "skeleton": {"role": "You are an operations incident analyst.", "rules": "- Do not invent facts.\n- Label assumptions as assumptions.\n- Use only the notes in Memory + Dynamic Facts.\n- Keep it suitable for a status update.", "dynamicFacts": "Incident ID: INC-1842\nSeverity: SEV-2\nStart time: 2026-02-27 08:40 CT\nServices affected: API Gateway, Auth\nCurrent status: Investigating", "grounding": ["Note: This scenario focuses on Memory + Dynamic Facts. Grounding excerpts are optional unless you add them."], "memory": "Confirmed facts so far:\n- Elevated 5xx errors observed at 08:40 CT.\n- Deploy to API Gateway completed at 08:32 CT.\n- Rollback started at 09:05 CT.\nOpen questions:\n- Did the deploy include config changes?\n- Are errors isolated to a single region?\n- Any correlated auth latency spikes?", "outputFormat": "Use headings: Timeline / Current Impact / Hypotheses / Next Actions / Owner Requests.", "userRequest": "Summarize the incident based on the notes above."}, "scoring": {"mustAvoidInventing": true, "mustLabelAssumptions": true, "mustBeStructured": true}}};

  async function loadScenarios() {
    try {
      const res = await fetch("data/scenarios.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      return data;
    } catch (e) {
      // File:// or fetch blocked — use embedded fallback
      return FALLBACK_SCENARIOS;
    }
  }

  // Cache for other views (x-ray, history)
  let STATIONS = null;
  let SCENARIO_LOOKUP = null;

  
  // ---- Scenario normalization (Iteration 2: stations contain multiple scenarios) ----
  function normalizeStations(raw) {
    const stationsById = {};
    const lookup = {};

    function ensureScenarioIds(station) {
      const arr = Array.isArray(station.scenarios) ? station.scenarios : [];
      const out = [];
      for (let i = 0; i < arr.length; i++) {
        const sc = arr[i] || {};
        const sid = String(sc.id || `${station.id}-${String(i + 1).padStart(2, "0")}`);
        const fixed = {
          id: sid,
          title: sc.title || `Scenario ${i + 1}`,
          tagline: sc.tagline || station.tagline || "",
          requiredHeadings: Array.isArray(sc.requiredHeadings) ? sc.requiredHeadings : (Array.isArray(station.requiredHeadings) ? station.requiredHeadings : []),
          skeleton: sc.skeleton || station.skeleton || {},
          scoring: sc.scoring || station.scoring || {}
        };
        out.push(fixed);
        lookup[sid] = { stationId: station.id, scenario: fixed };
      }
      station.scenarios = out;
      return station;
    }

    if (raw && Array.isArray(raw.stations)) {
      for (const st of raw.stations) {
        if (!st || !st.id) continue;
        const station = {
          id: String(st.id),
          title: st.title || st.id,
          tagline: st.tagline || "",
          scenarios: st.scenarios || [],
          requiredHeadings: st.requiredHeadings,
          skeleton: st.skeleton,
          scoring: st.scoring
        };
        stationsById[station.id] = ensureScenarioIds(station);
      }
    } else if (raw && typeof raw === "object") {
      for (const key of Object.keys(raw)) {
        const st = raw[key];
        if (!st || typeof st !== "object") continue;
        const stationId = String(st.id || key);
        const station = {
          id: stationId,
          title: st.title || stationId,
          tagline: st.tagline || "",
          scenarios: st.scenarios || null,
          requiredHeadings: st.requiredHeadings,
          skeleton: st.skeleton,
          scoring: st.scoring
        };

        // Back-compat: if station has a single skeleton, convert to 1 scenario
        if (!Array.isArray(station.scenarios) || station.scenarios.length === 0) {
          station.scenarios = [{
            id: `${station.id}-01`,
            title: station.title,
            tagline: station.tagline,
            requiredHeadings: Array.isArray(st.requiredHeadings) ? st.requiredHeadings : [],
            skeleton: st.skeleton || {},
            scoring: st.scoring || {}
          }];
        }

        stationsById[station.id] = ensureScenarioIds(station);
      }
    }

    return { stationsById, lookup };
  }

  function getStationAndScenarioByScenarioId(scenarioId) {
    if (!scenarioId || !SCENARIO_LOOKUP) return null;
    return SCENARIO_LOOKUP[scenarioId] || null;
  }

// ---- State ----
  const state = {
    stationId: null,
    scenarioId: null,
    runStartTs: null,
    runElapsedSec: 0,
    blocks: {
      role: "",
      rules: "",
      facts: "",
      excerpts: [],
      memory: "",
      format: "",
      request: ""
    },
    responseText: "",
    score: null,
    auditOn: false,
    activeTab: "response"
  };


  // ---- Timer (Iteration 2) ----
  let timerInterval = null;

  function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function updateTimerPill() {
    const pill = document.getElementById("pillTimer");
    if (!pill) return;
    pill.textContent = formatDuration(state.runElapsedSec || 0);
  }

  function startTimer() {
    if (timerInterval) return;
    if (!state.runStartTs) state.runStartTs = Date.now();
    timerInterval = window.setInterval(() => {
      state.runElapsedSec = Math.floor((Date.now() - state.runStartTs) / 1000);
      updateTimerPill();
    }, 1000);
    updateTimerPill();
  }

  function stopTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
    updateTimerPill();
  }

  function saveState(toastMsg = null) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      if (toastMsg) toast(toastMsg);
    } catch (e) {
      if (toastMsg) toast("Could not save (storage unavailable).");
    }
  }

  function loadState() {
    try {
      // Prefer current schema
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(state, parsed);
        return;
      }

      // Migrate from legacy schemas if present
      for (const k of (LEGACY_STATE_KEYS || [])) {
        const legacy = localStorage.getItem(k);
        if (!legacy) continue;
        const parsed = JSON.parse(legacy);
        Object.assign(state, parsed);
        // Persist forward in the new key
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        return;
      }
    } catch (e) {
      // ignore
    }
  }

  function resetAll() {
    stopTimer();
    localStorage.removeItem(STATE_KEY);
    window.location.href = "index.html";
  }

  // ---- UI helpers ----
  function $(id) { return document.getElementById(id); }

  function toast(msg) {
    // Minimal: use aria-live on themeStatus if present, else console
    const live = $("themeStatus");
    if (live) live.textContent = msg;
    // Also log for debug
    // eslint-disable-next-line no-console
    console.log(msg);
  }

  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---- Run History (Iteration 2) ----
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 25)));
    } catch (e) {
      // ignore
    }
  }

  
  // ---- Saved Runs (Iteration 2) ----
  function loadSavedRuns() {
    try {
      const raw = localStorage.getItem(SAVED_RUNS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveSavedRuns(items) {
    try {
      localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      // ignore
    }
  }

  function clearSavedRuns() {
    saveSavedRuns([]);
    renderSavedRuns();
  }

  function saveNamedRun() {
    syncStateFromUI();
    if (!state.stationId || !state.scenarioId) {
      toast("Pick a station first.");
      return;
    }
    const name = String($("saveRunName")?.value || "").trim() || `Run ${new Date().toLocaleString()}`;
    const scenarioInfo = getStationAndScenarioByScenarioId(state.scenarioId);
    const stTitle = scenarioInfo?.stationId || state.stationId;
    const scTitle = scenarioInfo?.scenario?.title || state.scenarioId;

    const entry = {
      id: `saved_${Date.now()}`,
      name,
      stationId: state.stationId,
      scenarioId: state.scenarioId,
      stationTitle: stTitle,
      scenarioTitle: scTitle,
      ts: new Date().toISOString(),
      elapsedSec: state.runElapsedSec || 0,
      blocks: JSON.parse(JSON.stringify(state.blocks || {})),
      responseText: String(state.responseText || $("txtResponse")?.value || ""),
      score: state.score || null
    };

    const all = loadSavedRuns();
    all.unshift(entry);
    saveSavedRuns(all);

    const inp = $("saveRunName");
    if (inp) inp.value = "";
    renderSavedRuns();
    toast("Saved run.");
  }

  function deleteSavedRun(id) {
    const all = loadSavedRuns().filter(x => x.id !== id);
    saveSavedRuns(all);
    renderSavedRuns();
  }

  function loadSavedRun(id) {
    const all = loadSavedRuns();
    const entry = all.find(x => x.id === id);
    if (!entry) return;

    state.stationId = entry.stationId || null;
    state.scenarioId = entry.scenarioId || null;
    state.blocks = entry.blocks || state.blocks;
    state.responseText = entry.responseText || "";
    state.score = entry.score || null;
    state.auditOn = false;
    state.activeTab = "response";

    // Reset timer for resumed run
    state.runStartTs = Date.now();
    state.runElapsedSec = entry.elapsedSec || 0;

    // Restore UI
    const st = STATIONS ? STATIONS[state.stationId] : null;
    const sc = getStationAndScenarioByScenarioId(state.scenarioId)?.scenario || null;
    if (st && sc) {
      showWorkbench(st, sc);
      syncUIFromState();
      $("txtResponse").value = state.responseText || "";
      renderScore(state.score);
      renderAudit();
      renderXray();
      setTab("response");
      saveState();
      toast("Loaded saved run.");
    }
  }

  function renderSavedRuns() {
    const wrap = $("savedRuns");
    if (!wrap) return;
    const items = loadSavedRuns();
    wrap.innerHTML = "";
    if (!items.length) {
      wrap.innerHTML = '<p class="muted small" style="margin:0;">No saved runs yet.</p>';
      return;
    }

    for (const it of items.slice(0, 12)) {
      const div = document.createElement("div");
      div.className = "card";
      div.style.padding = "10px";
      const status = it.score?.overallPass ? "PASS" : (it.score ? "FAIL" : "—");
      div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
          <strong>${escapeHtml(it.name)}</strong>
          <span class="pill">${escapeHtml(status)}</span>
        </div>
        <div class="muted small" style="margin-top:6px;">
          ${escapeHtml(it.scenarioTitle || it.scenarioId)} • ${escapeHtml(new Date(it.ts).toLocaleString())}
        </div>
        <div class="split-actions" style="margin-top:10px;">
          <button class="btn btn-secondary" type="button" data-load="${escapeHtml(it.id)}">Load</button>
          <button class="btn btn-secondary" type="button" data-del="${escapeHtml(it.id)}">Delete</button>
        </div>
      `;
      div.querySelector("[data-load]")?.addEventListener("click", () => loadSavedRun(it.id));
      div.querySelector("[data-del]")?.addEventListener("click", () => deleteSavedRun(it.id));
      wrap.appendChild(div);
    }
  }

function recordRun(scenario, score) {
    const history = loadHistory();
    const ts = new Date().toISOString();
    const entry = {
      ts,
      stationId: state.stationId || (scenario?.id ? String(scenario.id).split("-")[0] : null) || "unknown",
      scenarioId: scenario?.id || state.scenarioId || "unknown",
      title: scenario?.title || "",
      overallPass: !!score?.overallPass,
      passCount: score?.passCount ?? null,
      total: score?.total ?? null,
      elapsedSec: state.runElapsedSec || 0,
      unsupportedLines: score?.unsupportedLines ?? null,
      alerts: (score?.alerts || []).length
    };
    history.unshift(entry);
    saveHistory(history);
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  function renderHistory() {
    const wrap = $("runHistory");
    if (!wrap) return;
    const items = loadHistory();
    wrap.innerHTML = "";
    if (!items.length) {
      wrap.innerHTML = '<p class="muted small" style="margin:0;">No runs yet. Click <strong>Score</strong> to create one.</p>';
      return;
    }

    const show = items.slice(0, 10);
    for (const it of show) {
      const div = document.createElement("div");
      div.className = "alert info";
      const dt = it.ts ? new Date(it.ts) : null;
      const when = dt ? dt.toLocaleString() : it.ts;
      const status = it.overallPass ? "PASS" : "FAIL";
      div.innerHTML = `
        <div class="history-item">
          <div>
            <strong>${escapeHtml(it.title || it.scenarioId)}</strong>
            <div class="meta">${escapeHtml(when)} • ${escapeHtml(status)} • ${escapeHtml(String(it.passCount ?? "—"))}/${escapeHtml(String(it.total ?? "—"))} • ${escapeHtml(formatDuration(it.elapsedSec || 0))}</div>
          </div>
          <span class="pill" aria-label="Result">${escapeHtml(status)}</span>
        </div>
      `;
      wrap.appendChild(div);
    }
  }


  // ---- Render: scenario cards ----
  function renderScenarioCards(stationsById) {
    const wrap = $("scenarioCards");
    if (!wrap) return;
    wrap.innerHTML = "";

    const entries = Object.values(stationsById || {});
    for (const st of entries) {
      const count = Array.isArray(st.scenarios) ? st.scenarios.length : 0;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.style.textAlign = "left";
      card.style.cursor = "pointer";
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <h3 style="margin:0 0 6px 0; font-size:16px;">${escapeHtml(st.title)}</h3>
        <p class="muted" style="margin:0 0 10px 0; font-size:13px;">${escapeHtml(st.tagline || "")}</p>
        <div class="pill" style="width: fit-content;">${count || 1} scenario${(count === 1 ? "" : "s")}</div>
      `;
      card.addEventListener("click", () => selectStation(stationsById, st.id));
      wrap.appendChild(card);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "\"": return "&quot;";
        case "'": return "&#039;";
        default: return ch;
      }
    });
  }

  // Escape a string so it can be safely used inside a RegExp constructor.
  function escapeReg(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ---- Workbench ----
  function selectStation(stationsById, stationId, scenarioId) {
    const st = stationsById ? stationsById[stationId] : null;
    if (!st) return;

    const scenarios = Array.isArray(st.scenarios) ? st.scenarios : [];
    const chosen = scenarioId ? scenarios.find(x => x.id === scenarioId) : (scenarios[0] || null);
    if (!chosen) return;

    state.stationId = st.id;
    state.scenarioId = chosen.id;

    // Initialize blocks from scenario defaults
    const fresh = chosen.skeleton || {};

    state.blocks.role = fresh.role || "";
    state.blocks.rules = fresh.rules || "";
    state.blocks.facts = fresh.dynamicFacts || "";
    state.blocks.excerpts = Array.isArray(fresh.grounding) ? fresh.grounding.slice() : [];
    state.blocks.memory = fresh.memory || "";
    state.blocks.format = fresh.outputFormat || "";
    state.blocks.request = fresh.userRequest || "";
    state.responseText = "";
    state.score = null;
    state.auditOn = false;
    state.activeTab = "response";

    // Start a fresh practice run timer
    state.runStartTs = Date.now();
    state.runElapsedSec = 0;

    showWorkbench(st, chosen);
    syncUIFromState();
    saveState();
  }

  function pickRandomScenarioInStation(stationId) {
    const st = STATIONS ? STATIONS[stationId] : null;
    if (!st || !Array.isArray(st.scenarios) || st.scenarios.length < 2) return null;
    const current = state.scenarioId;
    const pool = st.scenarios.filter(s => s.id !== current);
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function showWorkbench(station, scenario) {
    $("scenePicker")?.classList.add("hidden");
    $("workbench")?.classList.remove("hidden");

    const title = station?.title || "Workbench";
    const subtitle = scenario ? `${scenario.title} — ${scenario.tagline || ""}` : (station?.tagline || "");

    $("workbenchTitle").textContent = title;
    $("workbenchSubtitle").textContent = subtitle || "—";

    // Scenario selector (Iteration 2)
    const sel = $("selScenario");
    if (sel && station && Array.isArray(station.scenarios)) {
      sel.innerHTML = "";
      for (const sc of station.scenarios) {
        const opt = document.createElement("option");
        opt.value = sc.id;
        opt.textContent = sc.title;
        sel.appendChild(opt);
      }
      sel.value = scenario?.id || (station.scenarios[0]?.id || "");
    }

    // Ensure tabs are correct
    setTab("response");

    // Timer
    startTimer();
  }

  function backToPicker() {
    stopTimer();
    state.stationId = null;
    state.scenarioId = null;
    state.auditOn = false;
    state.score = null;
    state.responseText = "";
    saveState();
    window.location.href = "index.html";
  }

  function syncUIFromState() {
    $("blkRole").value = state.blocks.role || "";
    $("blkRules").value = state.blocks.rules || "";
    $("blkFacts").value = state.blocks.facts || "";
    $("blkMemory").value = state.blocks.memory || "";
    $("blkFormat").value = state.blocks.format || "";
    $("blkRequest").value = state.blocks.request || "";

    renderExcerpts(state.blocks.excerpts || []);
    $("txtResponse").value = state.responseText || "";

    renderScore(state.score);
    renderAudit();
  }

  function syncStateFromUI() {
    state.blocks.role = $("blkRole").value;
    state.blocks.rules = $("blkRules").value;
    state.blocks.facts = $("blkFacts").value;
    state.blocks.memory = $("blkMemory").value;
    state.blocks.format = $("blkFormat").value;
    state.blocks.request = $("blkRequest").value;

    // excerpts are handled by renderExcerpts inputs
    const exWrap = $("blkExcerpts");
    const ex = [];
    if (exWrap) {
      const nodes = exWrap.querySelectorAll("textarea[data-excerpt]");
      nodes.forEach((t) => ex.push(t.value));
    }
    state.blocks.excerpts = ex;
  }

  function renderExcerpts(excerpts) {
    const wrap = $("blkExcerpts");
    if (!wrap) return;
    wrap.innerHTML = "";

    excerpts.forEach((text, idx) => {
      const holder = document.createElement("div");
      holder.className = "card";
      holder.style.padding = "10px";
      holder.innerHTML = `
        <div class="muted small" style="margin-bottom:6px;">Excerpt ${idx + 1}</div>
        <textarea rows="3" data-excerpt="1" spellcheck="false"></textarea>
        <div class="split-actions" style="margin-top:10px;">
          <button class="btn btn-secondary" type="button" data-del="${idx}">Remove</button>
        </div>
      `;
      const ta = holder.querySelector("textarea");
      if (ta) ta.value = text || "";
      holder.querySelector("[data-del]")?.addEventListener("click", () => {
        const next = (state.blocks.excerpts || []).slice();
        next.splice(idx, 1);
        state.blocks.excerpts = next;
        renderExcerpts(next);
        saveState();
      });
      wrap.appendChild(holder);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-secondary";
    addBtn.textContent = "Add Excerpt";
    addBtn.addEventListener("click", () => {
      const next = (state.blocks.excerpts || []).slice();
      next.push("New excerpt: [paste here]");
      state.blocks.excerpts = next;
      renderExcerpts(next);
      saveState();
    });
    wrap.appendChild(addBtn);
  }

  // ---- Context package ----
  function buildContextPackage() {
    syncStateFromUI();

    const lines = [];
    lines.push("System / Role:");
    lines.push(state.blocks.role.trim() || "[missing]");
    lines.push("");
    lines.push("Rules / Constraints:");
    lines.push(state.blocks.rules.trim() || "[missing]");
    lines.push("");
    lines.push("Dynamic Facts:");
    lines.push(state.blocks.facts.trim() || "[none]");
    lines.push("");
    lines.push("Grounding Knowledge:");
    const ex = (state.blocks.excerpts || []).map((t, i) => `- Excerpt ${i + 1}: ${t.trim()}`);
    lines.push(ex.length ? ex.join("\n") : "[none]");
    lines.push("");
    lines.push("Memory:");
    lines.push(state.blocks.memory.trim() || "[none]");
    lines.push("");
    lines.push("Output Format:");
    lines.push(state.blocks.format.trim() || "[none]");
    lines.push("");
    lines.push("User Request:");
    lines.push(state.blocks.request.trim() || "[missing]");
    lines.push("");
    return lines.join("\n");
  }

  // ---- Exports (Iteration 2) ----
  function buildRunReport() {
    if (!state.stationId || !state.scenarioId) return "No scenario selected.";
    syncStateFromUI();

    const info = getStationAndScenarioByScenarioId(state.scenarioId);
    const station = STATIONS ? STATIONS[state.stationId] : null;
    const scenario = info?.scenario || { id: state.scenarioId, title: state.scenarioId, requiredHeadings: [] };

    const ctx = buildContextPackage();
    const resp = String(state.responseText || $("txtResponse")?.value || "");
    const score = state.score;

    const lines = [];
    lines.push(`Enterprise Scenario Arcade — Run Report (${APP_VERSION})`);
    lines.push(`Station: ${station?.title || state.stationId} (${state.stationId})`);
    lines.push(`Scenario: ${scenario.title} (${scenario.id})`);
    lines.push(`Timestamp: ${new Date().toLocaleString()}`);
    lines.push(`Elapsed: ${formatDuration(state.runElapsedSec || 0)}`);
    lines.push("");

    lines.push("=== Context Package ===");
    lines.push(ctx);
    lines.push("");

    lines.push("=== Generated/Edited Response ===");
    lines.push(resp || "[empty]");
    lines.push("");

    lines.push("=== Score Summary ===");
    if (!score) {
      lines.push("No score computed yet.");
    } else {
      lines.push(`Overall: ${score.overallPass ? "PASS" : "FAIL"}`);
      lines.push(`Checks passed: ${score.passCount}/${score.total}`);
      lines.push(`Unsupported lines (audit): ${score.unsupportedLines ?? "—"}`);

      if (score.evidence) {
        lines.push(`Evidence: Excerpts used ${score.evidence.excerptUsedCount}/${score.evidence.excerptTotal} (${score.evidence.excerptCoveragePct}%)`);
        if (score.evidence.missingRequired?.length) lines.push(`Missing required facts: ${score.evidence.missingRequired.join(", ")}`);
        if (score.evidence.missingKeyTokens?.length) lines.push(`Missing key facts (sample): ${score.evidence.missingKeyTokens.slice(0, 10).join(", ")}`);
      }

      lines.push("");
      lines.push("Findings:");
      for (const f of (score.findings || [])) {
        lines.push(`- [${f.pass ? "PASS" : "FAIL"}] ${f.title}: ${f.detail}`);
      }
      if (score.alerts && score.alerts.length) {
        lines.push("");
        lines.push("Coach Alerts:");
        for (const a of score.alerts) {
          lines.push(`- [${(a.level || "info").toUpperCase()}] ${a.title}: ${a.detail}`);
        }
      }
    }
    lines.push("");

    lines.push("=== Audit Lines (Support Tags) ===");
    const audit = buildAuditLines(resp, state.stationId);
    for (const a of audit) {
      lines.push(`[${a.support}] ${a.line}`);
    }

    lines.push("");
    return lines.join("\n");
  }

// ---- Context Package X-Ray (Iteration 2) ----
  function summarizeBlock(label, text) {
    const t = String(text || "");
    const trimmed = t.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = trimmed ? trimmed.split(/\r?\n/).length : 0;
    return { label, empty: !trimmed, words, lines, text: trimmed };
  }

  function detectDuplicateLines(text) {
    const lines = String(text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const seen = new Map();
    for (const l of lines) seen.set(l, (seen.get(l) || 0) + 1);
    const dups = [...seen.entries()].filter(([,c]) => c > 1).map(([l,c]) => ({ line: l, count: c }));
    return dups.slice(0, 5);
  }

  function renderXray() {
    const summary = $("xraySummary");
    const details = $("xrayDetails");
    if (!summary || !details) return;

    if (!state.stationId || !state.scenarioId || !SCENARIO_LOOKUP || !SCENARIO_LOOKUP[state.scenarioId]) {
      summary.innerHTML = '<p class="muted">Pick a station to view the X-Ray.</p>';
      details.innerHTML = "";
      return;
    }

    syncStateFromUI();
    const scenario = SCENARIO_LOOKUP[state.scenarioId].scenario;

    const blocks = [
      summarizeBlock("System / Role", state.blocks.role),
      summarizeBlock("Rules / Constraints", state.blocks.rules),
      summarizeBlock("Dynamic Facts", state.blocks.facts),
      summarizeBlock("Grounding Excerpts", (state.blocks.excerpts || []).join("\n\n")),
      summarizeBlock("Memory", state.blocks.memory),
      summarizeBlock("Output Format", state.blocks.format),
      summarizeBlock("User Request", state.blocks.request),
    ];

    const warnings = [];
    for (const b of blocks) {
      if (b.label === "Memory" && scenario.id !== "ops") continue;
      if (b.label === "Grounding Excerpts" && (state.blocks.excerpts || []).length === 0) {
        warnings.push({ title: "No grounding excerpts", detail: "Add at least 1 excerpt to keep answers grounded." });
      }
      if (b.empty && !(b.label === "Memory" && scenario.id !== "ops")) {
        warnings.push({ title: `Missing block: ${b.label}`, detail: "Empty blocks reduce reliability. Fill this before running." });
      }
    }

    // Placeholder detection
    const placeholderPatterns = [/\[enter /i, /\[paste/i, /\[missing\]/i];
    const placeholders = blocks.filter(b => placeholderPatterns.some(p => p.test(b.text)));
    if (placeholders.length) {
      warnings.push({ title: "Placeholders detected", detail: "Some blocks still contain placeholders like [Enter …]. Replace them with real values." });
    }

    // Format vs required headings
    const required = scenario.requiredHeadings || [];
    const fmt = String(state.blocks.format || "");
    const missingFmt = required.filter(h => !new RegExp(escapeReg(h), "i").test(fmt));
    if (missingFmt.length) {
      warnings.push({ title: "Output format may not enforce headings", detail: `Add required headings to Output Format: ${missingFmt.join(", ")}` });
    }

    // Duplicate constraints lines
    const dupRules = detectDuplicateLines(state.blocks.rules || "");
    if (dupRules.length) warnings.push({ title: "Duplicate rule lines", detail: "Some constraint lines repeat. Consider consolidating to reduce noise." });

    summary.innerHTML = `
      <div class="score-pill"><strong>Blocks:</strong> <span>${escapeHtml(String(blocks.length))}</span></div>
      <div class="muted small">Warnings: ${warnings.length}</div>
    `;

    details.innerHTML = "";
    // Block stats
    for (const b of blocks) {
      if (b.label === "Memory" && scenario.id !== "ops") continue;
      const box = document.createElement("div");
      box.className = "card";
      box.style.padding = "12px";
      box.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
          <strong>${escapeHtml(b.label)}</strong>
          <span class="pill" aria-label="Status">${b.empty ? "EMPTY" : "OK"}</span>
        </div>
        <div class="muted small" style="margin-top:6px;">${escapeHtml(String(b.words))} words • ${escapeHtml(String(b.lines))} lines</div>
      `;
      details.appendChild(box);
    }

    // Warnings list
    if (warnings.length) {
      const w = document.createElement("div");
      w.className = "card";
      w.style.padding = "12px";
      w.innerHTML = `<h4 style="margin:0 0 8px 0;">X-Ray Warnings</h4>`;
      const stack = document.createElement("div");
      stack.className = "stack";
      for (const it of warnings) {
        const a = document.createElement("div");
        a.className = "alert warn";
        a.innerHTML = `<strong>${escapeHtml(it.title)}</strong><div class="muted small">${escapeHtml(it.detail)}</div>`;
        stack.appendChild(a);
      }
      w.appendChild(stack);
      details.appendChild(w);
    }
  }

  // ---- Response generation (template-based) ----
  function parseKeyValues(text) {
    const m = new Map();
    const lines = String(text || "").split(/\r?\n/);
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k) m.set(k, v);
    }
    return m;
  }

  function generateResponse(stationId, scenario) {
    syncStateFromUI();
    const ex = state.blocks.excerpts || [];
    const facts = parseKeyValues(state.blocks.facts || "");
    const req = (state.blocks.request || "").trim();

    if (!req) return "Missing User Request. Add the user request, then generate again.";

    if (stationId === "support") {
      const plan = facts.get("Plan") || "the current plan";
      const lastPay = facts.get("Last payment") || "an unknown date";
      const event = facts.get("Downgrade event") || "a recent date";

      const supported = [
        { text: "Explanation", support: "—" },
        { text: `Based on the account facts provided, your plan changed around ${event}. Your last recorded payment is ${lastPay} (Plan: ${plan}).`, support: "Facts/Memory" },
        { text: `Policy reference: ${ex[0] ? "Excerpt 1" : "No excerpt available"}.`, support: ex[0] ? "Excerpt 1" : "Unsupported" },
        { text: "", support: "—" },
        { text: "Next Steps", support: "—" },
        { text: `1) Verify and update your payment method, then retry billing if applicable. (${
          ex[0] ? "Excerpt 1" : "no policy excerpt"
        })`, support: ex[0] ? "Excerpt 1" : "Unsupported" },
        { text: `2) If your plan does not restore within 24 hours after payment is resolved, contact support for manual review. (${
          ex[1] ? "Excerpt 2" : "no policy excerpt"
        })`, support: ex[1] ? "Excerpt 2" : "Unsupported" },
        { text: "", support: "—" },
        { text: "Needed Info", support: "—" },
        { text: "• Did you receive a billing failure or chargeback notice? (If yes, the timestamp helps.)", support: "Facts/Memory" },
        { text: "• What is the invoice/receipt ID for the last successful payment?", support: "Facts/Memory" },
      ];

      return supported.map(x => x.text).join("\n");
    }

    if (stationId === "hr") {
      const excerptLabel = ex[0] ? "Excerpt 1" : "No excerpt available";

      const supported = [
        { text: "Answer", support: "—" },
        { text: `Based on the policy excerpt provided, you can carry over unused vacation up to the stated cap. (${
          excerptLabel
        })`, support: ex[0] ? "Excerpt 1" : "Unsupported" },
        { text: `If you have more than the allowed carryover, the excess may be forfeited unless an approved exception applies. (${
          excerptLabel
        })`, support: ex[0] ? "Excerpt 1" : "Unsupported" },
        { text: "", support: "—" },
        { text: "Summary", support: "—" },
        { text: "Carry over is allowed up to the cap; beyond that, you may lose the extra days unless an exception is approved.", support: ex[0] ? "Excerpt 1" : "Unsupported" },
        { text: "", support: "—" },
        { text: "Escalation", support: "—" },
        { text: "This guidance is not legal advice. If your situation is unusual or the policy is unclear for your region, contact HR for a definitive answer.", support: "Rule/Policy" },
      ];

      return supported.map(x => x.text).join("\n");
    }

    // ops
    const mem = (state.blocks.memory || "").trim();
    const service = facts.get("Services affected") || "the impacted services";
    const start = facts.get("Start time") || "unknown";
    const inc = facts.get("Incident ID") || "INC-—";

    const supported = [
      { text: "Timeline", support: "—" },
      { text: `• ${start} — Incident begins (${
        inc
      }).`, support: "Facts/Memory" },
      { text: "• [Add key timestamps from memory here.]", support: "Facts/Memory" },
      { text: "", support: "—" },
      { text: "Current Impact", support: "—" },
      { text: `• Elevated errors affecting ${service}.`, support: "Facts/Memory" },
      { text: "", support: "—" },
      { text: "Hypotheses", support: "—" },
      { text: "• Assumption: A recent deploy may be correlated with the error spike (needs confirmation).", support: "Assumption (labelled)" },
      { text: "", support: "—" },
      { text: "Next Actions", support: "—" },
      { text: "• Confirm deploy contents (code vs config) and compare error rates pre/post.", support: "Facts/Memory" },
      { text: "• Validate whether impact is regional or global.", support: "Facts/Memory" },
      { text: "", support: "—" },
      { text: "Owner Requests", support: "—" },
      { text: "• Please provide: region breakdown, auth latency metrics, and deploy diff summary.", support: "Facts/Memory" },
    ];

    // If memory is empty, warn
    if (!mem) {
      supported.unshift({ text: "NOTE: Memory block is empty. Add confirmed facts/open questions to improve accuracy.", support: "Unsupported" });
    }

    return supported.map(x => x.text).join("\n");
  }

  // ---- Audit Mode ----
  function getExcerptUnitsFromState() {
    const arr = Array.isArray(state.blocks.excerpts) ? state.blocks.excerpts : [];
    return arr.map((t, i) => ({ id: `E${i + 1}`, idx: i + 1, text: String(t || "").trim() })).filter(x => x.text);
  }

  function tokenizeForMatch(text) {
    const stop = new Set(["the","and","for","with","that","this","from","into","over","under","when","then","than","they","them","their","your","you","are","was","were","will","shall","must","may","might","could","should","can","not","only","use","based","include","within","without","also","per","via","to","of","in","on","at","as","is","it","be","by","or","an","a"]);
    const raw = String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
    const parts = raw.split(/\s+/).filter(Boolean);
    const tokens = [];
    for (const p of parts) {
      if (p.length < 4) continue;
      if (stop.has(p)) continue;
      tokens.push(p);
      if (tokens.length >= 10) break;
    }
    return tokens;
  }

  function findBestExcerptSupport(lineLower, excerptUnits) {
    // explicit references like "Excerpt 2" or "E2"
    const m1 = lineLower.match(/\bexcerpt\s*(\d+)\b/);
    if (m1) {
      const n = parseInt(m1[1], 10);
      const hit = excerptUnits.find(x => x.idx === n);
      if (hit) return hit;
    }
    const m2 = lineLower.match(/\be(\d+)\b/);
    if (m2) {
      const n = parseInt(m2[1], 10);
      const hit = excerptUnits.find(x => x.idx === n);
      if (hit) return hit;
    }

    // fuzzy keyword overlap
    let best = null;
    let bestScore = 0;
    for (const ex of excerptUnits) {
      const keys = tokenizeForMatch(ex.text);
      if (!keys.length) continue;
      let score = 0;
      for (const k of keys) if (lineLower.includes(k)) score++;
      if (score > bestScore) {
        bestScore = score;
        best = ex;
      }
    }
    return bestScore >= 2 ? best : null; // require at least 2 hits
  }

  // ---- Audit Mode ----
  function buildAuditLines(text, stationId) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];

    // Use current blocks to better tag support
    const factsMap = parseKeyValues(state.blocks.facts || "");
    const factTokens = [];
    for (const [k, v] of factsMap.entries()) {
      if (k) factTokens.push(String(k).toLowerCase());
      if (v) factTokens.push(String(v).toLowerCase());
    }

    const mem = String(state.blocks.memory || "").toLowerCase();
    const memTokens = [];
    const idMatches = mem.match(/\b[a-z]{2,}-\d+\b/g) || [];
    memTokens.push(...idMatches);
    memTokens.push(...(mem.match(/\b\d{1,2}:\d{2}\b/g) || []));
    memTokens.push(...(mem.match(/\b\d{4}-\d{2}-\d{2}\b/g) || []));

    const excerptUnits = getExcerptUnitsFromState();

    function supportedByFacts(lineLower) {
      if (lineLower.includes("fact") || lineLower.includes("account") || lineLower.includes("incident") || lineLower.includes("services")) return true;
      for (const t of factTokens) {
        if (t && t.length >= 3 && lineLower.includes(t)) return true;
      }
      for (const t of memTokens) {
        if (t && lineLower.includes(t)) return true;
      }
      return false;
    }

    for (const line of lines) {
      if (!line.trim()) continue;

      let support = "Unsupported";
      const l = line.toLowerCase();

      // Headings
      if (/^(explanation|next steps|needed info|answer|escalation|summary|timeline|current impact|hypotheses|next actions|owner requests)\b/i.test(line.trim())) {
        support = "—";
      } else if (l.includes("assumption")) {
        support = "Assumption (labelled)";
      } else if (stationId === "hr" && l.includes("not legal advice")) {
        support = "Rule/Policy";
      } else {
        const exHit = findBestExcerptSupport(l, excerptUnits);
        if (exHit) support = exHit.id;
        else if (supportedByFacts(l)) support = "Facts/Memory";
      }

      out.push({ line, support });
    }
    return out;
  }

  function renderAudit() {
    const wrap = $("auditWrap");
    const linesWrap = $("auditLines");
    if (!wrap || !linesWrap) return;

    wrap.classList.toggle("hidden", !state.auditOn);

    linesWrap.innerHTML = "";
    if (!state.auditOn) return;

    const currentText = ($("txtResponse")?.value ?? state.responseText ?? "");
    if (!String(currentText).trim()) {
      const empty = document.createElement("div");
      empty.className = "muted small";
      empty.textContent = "No response yet. Generate or paste a response, then enable Audit Mode.";
      linesWrap.appendChild(empty);
      return;
    }

    const auditLines = buildAuditLines(currentText, state.stationId);
    for (const item of auditLines) {
      const div = document.createElement("div");
      div.className = "audit-line" + (item.support === "Unsupported" ? " audit-unsupported" : "");
      div.innerHTML = `
        <div>${escapeHtml(item.line)}</div>
        <div class="audit-tag">Support: ${escapeHtml(item.support)}</div>
      `;
      linesWrap.appendChild(div);
    }
  }

  // ---- Scoring ----
  function extractKeyFactTokens(factsText, memoryText) {
    const tokens = new Set();

    function addMatches(text, rx) {
      const m = String(text || "").match(rx) || [];
      for (const x of m) tokens.add(x);
    }

    // IDs like ACCT-123, INC-1234, SR-552, etc.
    addMatches(factsText, /\b[A-Z]{2,}-\d+\b/g);
    addMatches(memoryText, /\b[A-Z]{2,}-\d+\b/g);

    // Dates + times
    addMatches(factsText, /\b\d{4}-\d{2}-\d{2}\b/g);
    addMatches(memoryText, /\b\d{4}-\d{2}-\d{2}\b/g);
    addMatches(factsText, /\b\d{1,2}:\d{2}\b/g);
    addMatches(memoryText, /\b\d{1,2}:\d{2}\b/g);

    // Percent + small numbers (cap to avoid noise)
    addMatches(factsText, /\b\d{1,3}%\b/g);

    // Pull explicit "Account ID:" / "Incident ID:" values
    const factsMap = parseKeyValues(factsText || "");
    for (const [k, v] of factsMap.entries()) {
      const key = String(k || "").toLowerCase();
      const val = String(v || "").trim();
      if (!val) continue;
      if (key.includes("account id") || key.includes("incident id")) tokens.add(val);
      if (key.includes("plan") && val.length <= 40) tokens.add(val);
      if (key.includes("services affected")) addMatches(val, /\b[a-z0-9-]{4,}\b/gi);
    }

    return Array.from(tokens).filter(Boolean);
  }

  function getRequiredFactTokens(stationId, factsText) {
    const must = [];
    const map = parseKeyValues(factsText || "");
    function getVal(label) {
      for (const [k, v] of map.entries()) {
        if (String(k || "").toLowerCase() === label.toLowerCase()) return String(v || "").trim();
      }
      return "";
    }

    if (stationId === "support") {
      const acct = getVal("Account ID");
      if (acct) must.push(acct);
    }
    if (stationId === "ops") {
      const inc = getVal("Incident ID");
      if (inc) must.push(inc);
    }
    return must;
  }

  function analyzeEvidenceUsage(responseText) {
    const respLower = String(responseText || "").toLowerCase();
    const excerptUnits = getExcerptUnitsFromState();

    let usedCount = 0;
    const used = [];
    for (const ex of excerptUnits) {
      const explicit = new RegExp(`\\bexcerpt\\s*${ex.idx}\\b`, "i").test(responseText) || new RegExp(`\\b${ex.id.toLowerCase()}\\b`).test(respLower);
      const keys = tokenizeForMatch(ex.text);
      let overlap = 0;
      for (const k of keys) if (respLower.includes(k)) overlap++;
      const isUsed = explicit || overlap >= 2;
      if (isUsed) {
        usedCount++;
        used.push(ex.id);
      }
    }

    const total = excerptUnits.length;
    const coverage = total ? Math.round((usedCount / total) * 100) : 0;

    // Key facts
    const keyTokens = extractKeyFactTokens(state.blocks.facts || "", state.blocks.memory || "");
    const requiredTokens = getRequiredFactTokens(state.stationId, state.blocks.facts || "");
    const missingRequired = requiredTokens.filter(t => t && !respLower.includes(String(t).toLowerCase()));

    const missingKeyTokens = [];
    for (const t of keyTokens) {
      const tl = String(t).toLowerCase();
      // ignore very short numeric noise
      if (tl.length < 3) continue;
      if (!respLower.includes(tl)) missingKeyTokens.push(t);
    }
    const keyCoverage = keyTokens.length ? Math.round(((keyTokens.length - missingKeyTokens.length) / keyTokens.length) * 100) : 100;

    return {
      excerptTotal: total,
      excerptUsedCount: usedCount,
      excerptUsedIds: used,
      excerptCoveragePct: coverage,
      keyTokenTotal: keyTokens.length,
      keyCoveragePct: keyCoverage,
      missingKeyTokens,
      missingRequired
    };
  }

  function scoreResponse(stationId, scenario, responseText) {
    const res = String(responseText || "");
    const required = scenario.requiredHeadings || [];
    const missingHeadings = required.filter((h) => !new RegExp(`^${escapeReg(h)}\\b`, "im").test(res));

    const findings = [];
    const alerts = [];

    const passes = {
      structured: true,
      grounded: true,
      noSpeculation: true,
      safety: true,
      completeness: true,
      keyFacts: true
    };

    // Evidence analysis (Iteration 2)
    const evidence = analyzeEvidenceUsage(res);

    // ----------------------------
    // Structure
    // ----------------------------
    if (missingHeadings.length) {
      passes.structured = false;
      findings.push({
        title: "Structure",
        pass: false,
        detail: `Missing required heading(s): ${missingHeadings.join(", ")}`
      });
    } else {
      findings.push({ title: "Structure", pass: true, detail: "All required headings present." });
    }

    // ----------------------------
    // Audit-derived grounding signal
    // ----------------------------
    const audit = buildAuditLines(res, stationId);
    const unsupportedLines = audit.filter((a) => a.support === "Unsupported").length;

    if (stationId !== "ops") {
      const hasExcerptSignal = evidence.excerptUsedCount > 0 || /excerpt\s*\d|policy excerpt\s*\d|e\d/i.test(res);
      if (!hasExcerptSignal) {
        passes.grounded = false;
        findings.push({
          title: "Grounding",
          pass: false,
          detail: "No excerpt usage detected. Tie key claims to the Excerpts block (e.g., “Excerpt 1” / “E1”)."
        });
      } else if (unsupportedLines > 1) {
        passes.grounded = false;
        findings.push({
          title: "Grounding discipline",
          pass: false,
          detail: `Audit detected ${unsupportedLines} unsupported line(s). Tie each claim to Excerpts or Facts.`
        });
      } else {
        findings.push({ title: "Grounding", pass: true, detail: `Excerpt coverage: ${evidence.excerptCoveragePct}% (${evidence.excerptUsedCount}/${evidence.excerptTotal}).` });
      }
    } else {
      const hasUncertainty = /\b(maybe|probably|likely|might|could|seems|suggests)\b/i.test(res);
      const hasAssumptionLabel = /\bassumption\b/i.test(res);
      if (hasUncertainty && !hasAssumptionLabel) {
        passes.grounded = false;
        findings.push({
          title: "No-invent rule",
          pass: false,
          detail: "Uncertainty words found without an “Assumption” label. Label assumptions explicitly."
        });
      } else if (unsupportedLines > 3 && !hasAssumptionLabel) {
        passes.grounded = false;
        findings.push({
          title: "Grounding discipline",
          pass: false,
          detail: `Audit detected ${unsupportedLines} unsupported line(s). Use Facts/Memory only, or label hypotheses as Assumptions.`
        });
      } else {
        findings.push({ title: "No-invent rule", pass: true, detail: `Assumptions are labelled (or none detected). Excerpt coverage: ${evidence.excerptCoveragePct}% (${evidence.excerptUsedCount}/${evidence.excerptTotal}).` });
      }
    }

    // ----------------------------
    // Key facts preservation
    // ----------------------------
    if (evidence.missingRequired.length) {
      passes.keyFacts = false;
      findings.push({
        title: "Key facts preserved",
        pass: false,
        detail: `Missing required fact(s) in response: ${evidence.missingRequired.join(", ")}`
      });
      alerts.push({
        level: "warn",
        title: "Dropped key facts",
        detail: "Your response missed required identifiers from Dynamic Facts. Re-state the key ID(s) early for auditability."
      });
    } else if (evidence.keyCoveragePct < 50 && evidence.keyTokenTotal >= 4) {
      passes.keyFacts = false;
      findings.push({
        title: "Key facts preserved",
        pass: false,
        detail: `Low key-fact usage detected. Key fact coverage: ${evidence.keyCoveragePct}%.`
      });
      alerts.push({
        level: "warn",
        title: "Too many details dropped",
        detail: "Your response omitted many concrete facts (IDs/dates/times/plan names). Keep the core details visible."
      });
    } else {
      findings.push({
        title: "Key facts preserved",
        pass: true,
        detail: `Key fact coverage: ${evidence.keyCoveragePct}% (${Math.max(0, evidence.keyTokenTotal - evidence.missingKeyTokens.length)}/${evidence.keyTokenTotal || 0}).`
      });
    }

    // ----------------------------
    // Speculation
    // ----------------------------
    const uncertaintyWords = /\b(maybe|probably|likely|might|could|i think|i believe|it seems)\b/i;
    if (stationId === "support" || stationId === "hr") {
      if (uncertaintyWords.test(res)) {
        passes.noSpeculation = false;
        findings.push({
          title: "No speculation",
          pass: false,
          detail: "Speculation/uncertainty language detected. Support/HR stations require firm, excerpt-grounded wording."
        });
      } else {
        findings.push({ title: "No speculation", pass: true, detail: "No obvious speculation markers found." });
      }
    } else {
      findings.push({ title: "Speculation handling", pass: true, detail: "Ops allows hypotheses when labelled as Assumptions." });
    }

    // ----------------------------
    // Scenario-specific safety + completeness
    // ----------------------------
    if (stationId === "hr") {
      const hasNoLegal = /not legal advice/i.test(res);
      const hasEscalation = /contact\s+hr|reach\s+out\s+to\s+hr|hr\s+team|anonymous hotline|hotline/i.test(res);

      if (!hasNoLegal) {
        passes.safety = false;
        findings.push({ title: "Safety", pass: false, detail: "Missing “not legal advice” note. Add it under Escalation." });
      } else {
        findings.push({ title: "Safety", pass: true, detail: "Includes “not legal advice” note." });
      }

      if (!hasEscalation) {
        passes.completeness = false;
        findings.push({ title: "Escalation path", pass: false, detail: "Add an escalation step (e.g., contact HR / hotline) if policy is unclear." });
      } else {
        findings.push({ title: "Escalation path", pass: true, detail: "Includes an escalation path." });
      }
    }

    if (stationId === "support") {
      const hasNeeded = /^needed info\b/im.test(res);
      if (!hasNeeded) {
        passes.completeness = false;
        findings.push({
          title: "Missing info handling",
          pass: false,
          detail: "Support station requires a 'Needed Info' section to request missing details."
        });
      } else {
        const parts = res.split(/\n\s*needed info\s*\n/i);
        const neededBody = parts.length > 1 ? parts[1] : "";
        const hasQuestion = /\?/.test(neededBody) || /^\s*[-*]\s+/m.test(neededBody);
        if (!hasQuestion) {
          passes.completeness = false;
          findings.push({
            title: "Needed Info content",
            pass: false,
            detail: "Needed Info section exists but does not include a clear question or requested detail."
          });
        } else {
          findings.push({ title: "Missing info handling", pass: true, detail: "Requests missing details in 'Needed Info'." });
        }
      }
    }

    if (stationId === "ops") {
      const hasNext = /^next actions\b/im.test(res);
      const hasOwner = /^owner requests\b/im.test(res);
      if (!hasNext || !hasOwner) {
        passes.completeness = false;
        findings.push({
          title: "Actionability",
          pass: false,
          detail: "Ops station expects both 'Next Actions' and 'Owner Requests' sections for clarity."
        });
      } else {
        findings.push({ title: "Actionability", pass: true, detail: "Includes clear Next Actions and Owner Requests sections." });
      }
    }

    // ----------------------------
    // Coach alerts (Iteration 2)
    // ----------------------------
    if (stationId !== "ops" && evidence.excerptUsedCount === 0) {
      alerts.push({
        level: "warn",
        title: "No excerpt usage detected",
        detail: "You did not appear to use any excerpt. Reference Excerpts explicitly or mirror their key terms."
      });
    }
    if (!String(state.blocks.memory || "").trim()) {
      alerts.push({
        level: "info",
        title: "Memory block is empty",
        detail: "Add confirmed facts + open questions (what you still need) to reduce hallucinations and improve completeness."
      });
    }

    const checks = Object.entries(passes).map(([k, v]) => ({ key: k, pass: v }));
    const passCount = checks.filter((c) => c.pass).length;
    const total = checks.length;
    const overallPass = passCount === total;

    return {
      overallPass,
      passCount,
      total,
      unsupportedLines,
      findings,
      alerts,
      evidence,
      stationId,
      scenarioId: scenario.id
    };
  }

  function renderScore(score) {
    const summary = $("scoreSummary");
    const details = $("scoreDetails");
    const alertsWrap = $("coachAlerts");
    if (!summary || !details) return;

    function renderAlerts(items) {
      if (!alertsWrap) return;
      alertsWrap.innerHTML = "";
      const arr = Array.isArray(items) ? items : [];
      if (!arr.length) {
        alertsWrap.innerHTML = '<p class="muted small" style="margin:0;">No coach alerts.</p>';
        return;
      }
      for (const a of arr) {
        const div = document.createElement("div");
        div.className = "alert " + (a.level === "warn" ? "warn" : "info");
        div.innerHTML = `<strong>${escapeHtml(a.title)}</strong><div class="muted small">${escapeHtml(a.detail)}</div>`;
        alertsWrap.appendChild(div);
      }
    }

    if (!score) {
      summary.innerHTML = '<p class="muted">No score yet. Click <strong>Score</strong>.</p>';
      details.innerHTML = "";
      renderAlerts([]);
      renderHistory();
      return;
    }

    const overall = score.overallPass ? "PASS" : "FAIL";
    summary.innerHTML = `
      <div class="score-pill"><strong>Overall:</strong> <span>${overall}</span></div>
      <div class="muted small">Checks passed: ${score.passCount} / ${score.total} • Unsupported lines: ${escapeHtml(String(score.unsupportedLines ?? "—"))}</div>
    `;

    details.innerHTML = "";
    for (const f of (score.findings || [])) {
      const box = document.createElement("div");
      box.className = "card";
      box.style.padding = "10px";
      box.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
          <strong>${escapeHtml(f.title)}</strong>
          <span class="pill" aria-label="Result">${f.pass ? "PASS" : "FAIL"}</span>
        </div>
        <p class="muted small" style="margin:8px 0 0 0;">${escapeHtml(f.detail)}</p>
      `;
      details.appendChild(box);
    }

    // Evidence map (Iteration 2)
    if (score.evidence) {
      const ev = score.evidence;
      const box = document.createElement("div");
      box.className = "card";
      box.style.padding = "10px";
      const used = (ev.excerptUsedIds || []).join(", ") || "—";
      const missReq = (ev.missingRequired || []).join(", ") || "—";
      const missSome = (ev.missingKeyTokens || []).slice(0, 6).join(", ") || "—";
      box.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
          <strong>Evidence Map</strong>
          <span class="pill">Excerpts ${escapeHtml(String(ev.excerptCoveragePct ?? "—"))}%</span>
        </div>
        <p class="muted small" style="margin:8px 0 0 0;">
          Used: ${escapeHtml(used)} • Required missing: ${escapeHtml(missReq)}
        </p>
        <p class="muted small" style="margin:6px 0 0 0;">
          Missing key facts (sample): ${escapeHtml(missSome)}
        </p>
      `;
      details.appendChild(box);
    }

    renderAlerts(score.alerts || []);
    renderHistory();
  }

  // ---- Tabs ----
  function setTab(tab) {
    state.activeTab = tab;

    $("viewResponse")?.classList.toggle("hidden", tab !== "response");
    $("viewScore")?.classList.toggle("hidden", tab !== "score");
    $("viewXray")?.classList.toggle("hidden", tab !== "xray");

    $("tabResponse")?.setAttribute("aria-selected", tab === "response" ? "true" : "false");
    $("tabScore")?.setAttribute("aria-selected", tab === "score" ? "true" : "false");
    $("tabXray")?.setAttribute("aria-selected", tab === "xray" ? "true" : "false");

    if (tab === "xray") renderXray();
    if (tab === "score") renderHistory();
  }

  // ---- Wiring ----
  async function init() {
    applyTheme(getPreferredTheme());
    setStatusPills();
    updateTimerPill();

    const raw = await loadScenarios();
    const norm = normalizeStations(raw);
    STATIONS = norm.stationsById;
    SCENARIO_LOOKUP = norm.lookup;

    renderScenarioCards(STATIONS);

    loadState();

    // ---- State migration (v0.1/v0.2 → v0.3) ----
    if (!state.stationId && state.scenarioId) {
      // Older versions stored station id in scenarioId (support/hr/ops)
      if (STATIONS && STATIONS[state.scenarioId]) {
        state.stationId = state.scenarioId;
        state.scenarioId = STATIONS[state.stationId]?.scenarios?.[0]?.id || null;
      } else if (SCENARIO_LOOKUP && SCENARIO_LOOKUP[state.scenarioId]) {
        state.stationId = SCENARIO_LOOKUP[state.scenarioId].stationId;
      }
    }
    if (state.stationId && !state.scenarioId && STATIONS && STATIONS[state.stationId]) {
      state.scenarioId = STATIONS[state.stationId]?.scenarios?.[0]?.id || null;
    }
    if (state.stationId && state.scenarioId && SCENARIO_LOOKUP && !SCENARIO_LOOKUP[state.scenarioId]) {
      // Scenario no longer exists — fall back to first
      state.scenarioId = STATIONS[state.stationId]?.scenarios?.[0]?.id || null;
    }

    // Restart timer when restoring a session
    if (state.stationId && state.scenarioId) {
      state.runStartTs = Date.now();
      state.runElapsedSec = 0;
    }

    // If returning with a scenario selected, restore workbench
    if (state.stationId && state.scenarioId && SCENARIO_LOOKUP && SCENARIO_LOOKUP[state.scenarioId]) {
      const st = STATIONS[state.stationId];
      const sc = SCENARIO_LOOKUP[state.scenarioId].scenario;
      showWorkbench(st, sc);
      syncUIFromState();
      $("txtResponse").value = state.responseText || "";
      renderScore(state.score);
      renderAudit();
      renderSavedRuns();
    } else {
      renderSavedRuns();
    }

    // ---- Shared header controls ----
    $("btnTheme")?.addEventListener("click", toggleTheme);
    $("btnReset")?.addEventListener("click", resetAll);

    // ---- Navigation ----
    $("btnBack")?.addEventListener("click", backToPicker);

    // ---- Scenario selector (Iteration 2) ----
    $("selScenario")?.addEventListener("change", (e) => {
      const val = e?.target?.value;
      if (!val || !state.stationId) return;
      selectStation(STATIONS, state.stationId, val);
    });

    $("btnRandomScenario")?.addEventListener("click", () => {
      if (!state.stationId) return;
      const sc = pickRandomScenarioInStation(state.stationId);
      if (sc) selectStation(STATIONS, state.stationId, sc.id);
    });

    // ---- State save ----
    $("btnSave")?.addEventListener("click", () => {
      syncStateFromUI();
      saveState();
    });

    // ---- Copy/Download context ----
    $("btnCopyContext")?.addEventListener("click", async () => {
      const pkg = buildContextPackage();
      try {
        await copyToClipboard(pkg);
        toast("Context package copied.");
      } catch (e) {
        toast("Clipboard blocked. Use Download instead.");
      }
    });

    $("btnDownloadContext")?.addEventListener("click", () => {
      const pkg = buildContextPackage();
      const fn = `enterprise-scenario-arcade_${APP_VERSION}_${state.scenarioId || "scenario"}_context.txt`;
      downloadText(fn, pkg);
    });

    // ---- Response generation ----
    $("btnGenerate")?.addEventListener("click", () => {
      if (!state.stationId || !state.scenarioId) return;
      const sc = SCENARIO_LOOKUP?.[state.scenarioId]?.scenario;
      const txt = generateResponse(state.stationId, sc);
      state.responseText = txt;
      $("txtResponse").value = txt;
      state.auditOn = false;
      renderAudit();
      saveState();
      toast("Response generated.");
    });

    // ---- Scoring ----
    $("btnScore")?.addEventListener("click", () => {
      if (!state.stationId || !state.scenarioId) return;
      stopTimer();
      const sc = SCENARIO_LOOKUP?.[state.scenarioId]?.scenario;
      const txt = $("txtResponse").value;
      state.responseText = txt;
      state.score = scoreResponse(state.stationId, sc, txt);
      renderScore(state.score);
      recordRun(sc, state.score);
      setTab("score");
      saveState();
    });

    $("btnAudit")?.addEventListener("click", () => {
      state.auditOn = !state.auditOn;

      if (state.auditOn) {
        // Audit UI is inside the Response tab, so switch there for visibility.
        setTab("response");
        state.responseText = $("txtResponse")?.value || "";
        renderAudit();
        saveState("Audit enabled.");
      } else {
        renderAudit();
        saveState("Audit disabled.");
      }
    });

    $("btnCopyResponse")?.addEventListener("click", async () => {
      const txt = $("txtResponse").value || "";
      try {
        await copyToClipboard(txt);
        toast("Response copied.");
      } catch (e) {
        toast("Clipboard blocked. Use Download instead.");
      }
    });

    $("btnDownloadTxt")?.addEventListener("click", () => {
      const txt = $("txtResponse").value || "";
      const fn = `enterprise-scenario-arcade_${APP_VERSION}_${state.scenarioId || "scenario"}.txt`;
      downloadText(fn, txt);
    });

    $("btnDownloadRunReport")?.addEventListener("click", () => {
      const txt = buildRunReport();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const fn = `enterprise-scenario-arcade_${APP_VERSION}_${state.scenarioId || "scenario"}_${stamp}_run-report.txt`;
      downloadText(fn, txt);
    });

    // ---- History + Saved Runs ----
    $("btnClearHistory")?.addEventListener("click", clearHistory);
    $("btnSaveNamedRun")?.addEventListener("click", saveNamedRun);
    $("btnClearSavedRuns")?.addEventListener("click", clearSavedRuns);

    // ---- Tabs ----
    $("tabResponse")?.addEventListener("click", () => setTab("response"));
    $("tabScore")?.addEventListener("click", () => setTab("score"));
    $("tabXray")?.addEventListener("click", () => setTab("xray"));

    // ---- Initial renders ----
    renderHistory();
    renderXray();
  }
document.addEventListener("DOMContentLoaded", init);
})();
