// Iteration Lab — app logic (no external libraries)
(function(){
  const APP_VERSION = "v0.5.0";
  const STORAGE_KEY = "iter_lab_run_v0_5";
  const LEGACY_STORAGE_KEYS = ["iter_lab_run_v0_4","iter_lab_run_v0_3","iter_lab_run_v0_2","iter_lab_run_v0_1"]; // migrate forward if found // migrate forward if found // migrate forward if found

  // Shared Features Integration (Version/Env pills + theme)
  const THEME_KEY = "app_theme";
  const TEST_TEMPLATES_KEY = "iter_lab_test_templates_v0_4";
  const USER_SCENARIOS_KEY = "iter_lab_user_scenarios_v0_5";
  const EVENT_LOG_MAX = 200;

  function detectEnvironment() {
    const { protocol, hostname } = window.location;
    if (protocol === "file:") return "File";
    if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";
    if (hostname && hostname.endsWith("github.io")) return "GitHub Pages";
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

  // State
  function nowISO() { return new Date().toISOString(); }

  function hashStringDjb2(str){
    let h = 5381;
    const s = String(str || "");
    for (let i=0;i<s.length;i++){
      h = ((h << 5) + h) ^ s.charCodeAt(i);
    }
    return (h >>> 0).toString(16);
  }

  function hashQuestions(qs){
    const norm = (qs || []).map(x => String(x).trim()).filter(x => x.length).join("\n");
    return hashStringDjb2(norm);
  }

  function iterQuestions(iter){
    return (iter && Array.isArray(iter.tests)) ? iter.tests.map(t => String(t.question || "").trim()).filter(x => x.length) : [];
  }

  function ensureIterationHashes(run){
    if (!run || !run.iterations) return;
    Object.values(run.iterations).forEach(it => {
      if (!it.testSetHash){
        it.testSetHash = hashQuestions(iterQuestions(it));
      }
    });
  }

  function logEvent(run, type, detail){
    run = normalizeRun(run);
    if (!Array.isArray(run.eventLog)) run.eventLog = [];
    run.eventLog.push({ ts: nowISO(), type: String(type||"event"), detail: detail || {} });
    if (run.eventLog.length > EVENT_LOG_MAX) run.eventLog = run.eventLog.slice(-EVENT_LOG_MAX);
  }


  function defaultRun(scenarioId) {
    const s = getScenario(scenarioId);
    const blocks = {};
    ITER_LAB_DATA.BLOCKS.forEach(b => { blocks[b.id] = s.baseline[b.id] || ""; });

    return {
      schemaVersion: "0.5",
      eventLog: [],
      settings: { rubric: JSON.parse(JSON.stringify(ITER_LAB_DATA.RUBRIC_DEFAULT || { weights:{grounded:1,relevant:1,consistent:1,structured:1,safe:1}, passThreshold:1.5, regressionAlertDelta:-0.2 })), testSet: (s.tests || []).slice() },
      createdAt: nowISO(),
      updatedAt: nowISO(),
      runName: "",
      scenarioId,
      activeIterationId: "i1",
      iterations: {
        i1: {
          id: "i1",
          number: 1,
          createdAt: nowISO(),
          changeType: "Baseline",
          changeBlockId: null,
          changeNotes: "",
          lockBlockId: null,
          blocks,
          tests: s.tests.map((q, idx) => ({
            id: `t${idx+1}`,
            question: q,
            modelOutput: "",
            scores: {
              grounded: null,
              relevant: null,
              consistent: null,
              structured: null,
              safe: null
            }
          })),
          testSetHash: hashQuestions(s.tests)
        }
      }
    };
  }

  function safeParseJSON(raw){
    try { return JSON.parse(raw); } catch(e){ return null; }
  }

  function loadFromKey(key){
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = safeParseJSON(raw);
    if (!parsed) return null;
    // Accept older schemaVersions as long as it looks like a run
    if (!parsed.iterations || !parsed.scenarioId) return null;
    return parsed;
  }

  function loadRunAny(){
    const primary = loadFromKey(STORAGE_KEY);
    if (primary) return { run: primary, keyUsed: STORAGE_KEY };
    for (const k of LEGACY_STORAGE_KEYS){
      const legacy = loadFromKey(k);
      if (legacy) return { run: legacy, keyUsed: k };
    }
    return null;
  }

    function normalizeRun(run){
    if (!run || !run.iterations) return run;
    run.schemaVersion = run.schemaVersion || "0.2";
    if (!run.settings) run.settings = {};
    if (!run.settings.rubric){
      // Deep copy default to avoid shared references
      run.settings.rubric = JSON.parse(JSON.stringify(ITER_LAB_DATA.RUBRIC_DEFAULT || { weights:{grounded:1,relevant:1,consistent:1,structured:1,safe:1}, passThreshold:1.5, regressionAlertDelta:-0.2 }));
    } else {
      // Backfill missing keys
      const def = (ITER_LAB_DATA.RUBRIC_DEFAULT || { weights:{grounded:1,relevant:1,consistent:1,structured:1,safe:1}, passThreshold:1.5, regressionAlertDelta:-0.2 });
      run.settings.rubric.weights = run.settings.rubric.weights || {};
      Object.keys(def.weights).forEach(k => {
        if (run.settings.rubric.weights[k] === undefined || run.settings.rubric.weights[k] === null) run.settings.rubric.weights[k] = def.weights[k];
      });
      if (run.settings.rubric.passThreshold === undefined || run.settings.rubric.passThreshold === null) run.settings.rubric.passThreshold = def.passThreshold;
      if (run.settings.rubric.regressionAlertDelta === undefined || run.settings.rubric.regressionAlertDelta === null) run.settings.rubric.regressionAlertDelta = def.regressionAlertDelta;
    }

    // Test set settings (v0.4+)
    if (!run.settings.testSet || !Array.isArray(run.settings.testSet)){
      const s = getScenario(run.scenarioId);
      const it = (run.activeIterationId && run.iterations) ? run.iterations[run.activeIterationId] : null;
      const fromIter = (it && Array.isArray(it.tests) && it.tests.length) ? it.tests.map(t => String(t.question || "")) : null;
      run.settings.testSet = (fromIter && fromIter.length) ? fromIter : ((s.tests || []).map(x => String(x)));
    } else {
      run.settings.testSet = run.settings.testSet.map(x => String(x)).filter(x => x.trim().length);
    }
    
    // Event log (v0.5+)
    if (!Array.isArray(run.eventLog)) run.eventLog = [];
    if (run.eventLog.length > EVENT_LOG_MAX) run.eventLog = run.eventLog.slice(-EVENT_LOG_MAX);

    // Test set hash per iteration (trend guardrails)
    ensureIterationHashes(run);

    // Bump schema version marker
    run.schemaVersion = "0.5";

    return run;
  }

  function getRubric(run){
    run = normalizeRun(run);
    return run.settings.rubric;
  }

  function updateRubric(run, patch){
    const r = getRubric(run);
    if (patch.weights){
      r.weights = r.weights || {};
      Object.keys(patch.weights).forEach(k => r.weights[k] = Number(patch.weights[k]));
    }
    if (patch.passThreshold !== undefined) r.passThreshold = Number(patch.passThreshold);
    if (patch.regressionAlertDelta !== undefined) r.regressionAlertDelta = Number(patch.regressionAlertDelta);
    saveRun(run);
  }

function saveRun(run) {
    run = normalizeRun(run);
    run.updatedAt = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  }

  function clearAllRuns(){
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
  
  }

    function getTestSet(run){
    run = normalizeRun(run);
    return (run.settings && Array.isArray(run.settings.testSet)) ? run.settings.testSet : [];
  }

  function setTestSet(run, questions){
    run = normalizeRun(run);
    run.settings.testSet = (questions || []).map(x => String(x)).filter(x => x.trim().length).map(x => x.trim());
    saveRun(run);
  }

  function buildTestsFromQuestions(questions){
    const qs = (questions || []).map(x => String(x)).map(x => x.trim()).filter(x => x.length);
    return qs.map((q, idx) => ({
      id: `t${idx+1}`,
      question: q,
      modelOutput: "",
      scores: { grounded:null, relevant:null, consistent:null, structured:null, safe:null }
    }));
  }

  function migrateTestsPreservingData(oldTests, questions){
    const qs = (questions || []).map(x => String(x)).map(x => x.trim()).filter(x => x.length);
    const map = new Map();
    (oldTests || []).forEach(t => {
      const k = String(t.question || "").trim();
      if (!k) return;
      if (!map.has(k)) map.set(k, t);
    });

    return qs.map((q, idx) => {
      const prev = map.get(q);
      if (prev){
        return {
          id: `t${idx+1}`,
          question: q,
          modelOutput: String(prev.modelOutput || ""),
          scores: {
            grounded: (prev.scores && prev.scores.grounded !== undefined) ? prev.scores.grounded : null,
            relevant: (prev.scores && prev.scores.relevant !== undefined) ? prev.scores.relevant : null,
            consistent: (prev.scores && prev.scores.consistent !== undefined) ? prev.scores.consistent : null,
            structured: (prev.scores && prev.scores.structured !== undefined) ? prev.scores.structured : null,
            safe: (prev.scores && prev.scores.safe !== undefined) ? prev.scores.safe : null
          }
        };
      }
      return {
        id: `t${idx+1}`,
        question: q,
        modelOutput: "",
        scores: { grounded:null, relevant:null, consistent:null, structured:null, safe:null }
      };
    });
  }

  function applyTestSet(run, scope){
    const qs = getTestSet(run);
    if (!qs.length){
      alert("Test set is empty. Add at least one question.");
      return;
    }
    if (scope === "all"){
      Object.values(run.iterations).forEach(it => {
        it.tests = migrateTestsPreservingData(it.tests, qs);
      });
    } else {
      const it = activeIteration(run);
      it.tests = migrateTestsPreservingData(it.tests, qs);
    }
    ensureIterationHashes(run);
    logEvent(run, "test_set_applied", { scope: scope, questions: getTestSet(run).slice(0,200) });
    saveRun(run);
    renderAll(run);
    setTab("test");
  }

  function getTestTemplatesSafe(){
    const raw = localStorage.getItem(TEST_TEMPLATES_KEY);
    const parsed = safeParseJSON(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => t && typeof t.name === "string" && Array.isArray(t.questions))
      .map(t => ({ name: t.name.trim().slice(0,60), questions: t.questions.map(x => String(x)).map(x => x.trim()).filter(x => x.length), createdAt: t.createdAt || nowISO() }))
      .filter(t => t.name.length && t.questions.length);
  }



  function saveTestTemplates(templates){
    localStorage.setItem(TEST_TEMPLATES_KEY, JSON.stringify(templates || []));
  }

  function upsertTemplate(name, questions){
    const n = String(name || "").trim().slice(0,60);
    const qs = (questions || []).map(x => String(x)).map(x => x.trim()).filter(x => x.length);
    if (!n) { alert("Template name required."); return; }
    if (!qs.length) { alert("Template needs at least one question."); return; }

    const all = (typeof getTestTemplatesSafe === "function") ? getTestTemplatesSafe() : [];
    const idx = all.findIndex(t => t.name.toLowerCase() === n.toLowerCase());
    const item = { name: n, questions: qs, createdAt: nowISO() };
    if (idx >= 0) all[idx] = item; else all.unshift(item);
    saveTestTemplates(all);
    return all;
  }

  function getUserScenariosSafe(){
    const raw = localStorage.getItem(USER_SCENARIOS_KEY);
    const parsed = safeParseJSON(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(s => s && typeof s.id === "string" && typeof s.name === "string" && s.baseline && typeof s.baseline === "object")
      .map(s => ({
        id: String(s.id).trim(),
        name: String(s.name).trim(),
        description: String(s.description || "").trim(),
        baseline: s.baseline,
        tests: Array.isArray(s.tests) ? s.tests.map(x => String(x)).map(x => x.trim()).filter(x => x.length) : [],
        userCreatedAt: s.userCreatedAt || nowISO()
      }))
      .filter(s => s.id.length && s.name.length);
  }

  function saveUserScenarios(list){
    localStorage.setItem(USER_SCENARIOS_KEY, JSON.stringify(list || []));
  }

  function isUserScenario(id){
    const list = getUserScenariosSafe();
    return list.some(s => s.id === id);
  }

  function getAllScenarios(){
    return ([]).concat(ITER_LAB_DATA.SCENARIOS || [], getUserScenariosSafe());
  }

  function getScenario(id){
    return getAllScenarios().find(s => s.id === id) || (ITER_LAB_DATA.SCENARIOS && ITER_LAB_DATA.SCENARIOS[0]);
  }

  function activeIteration(run){ return run.iterations[run.activeIterationId]; }

  // UI helpers
  function qs(sel){ return document.querySelector(sel); }
  function el(tag, attrs={}, children=[]){
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    children.forEach(c => n.appendChild(c));
    return n;
  }

  function setTab(tabId){
    document.querySelectorAll(".tab").forEach(btn => {
      const is = btn.dataset.tab === tabId;
      btn.setAttribute("aria-selected", is ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.classList.toggle("active", p.dataset.panel === tabId);
    });
  }

  function toastNotice(msg){
    const notice = qs("#editNotice");
    if (!notice) return;
    notice.textContent = msg || "";
  }

  // Token estimate + ordering validator
  function estimateTokens(text){
    const t = (text || "").trim();
    if (!t) return 0;
    // Rough heuristic: ~4 chars per token, with a small floor for short strings
    const byChars = Math.ceil(t.length / 4);
    const byWords = Math.ceil(t.split(/\s+/).length * 1.3);
    return Math.max(byChars, byWords);
  }

  function tokenSummary(iter){
    const per = {};
    let total = 0;
    ITER_LAB_DATA.BLOCKS.forEach(b => {
      const v = iter.blocks[b.id] || "";
      const tok = estimateTokens(v);
      per[b.id] = tok;
      total += tok;
    });
    return { per, total };
  }

  function validateOrdering(iter){
    const warnings = [];
    const role = (iter.blocks.role || "").trim();
    const rules = (iter.blocks.rules || "").trim();
    const fmt = (iter.blocks.format || "").trim();
    const req = (iter.blocks.request || "").trim();

    if (!role) warnings.push("System / Role is empty. Add a clear role so the model behaves consistently.");
    if (!rules) warnings.push("Rules / Constraints is empty. Add non-negotiables to reduce drift and hallucinations.");
    if (!fmt) warnings.push("Output Format is empty. Define headings/schema to improve structure.");
    if (!req) warnings.push("User Request is empty. Add a clear task/question for the run.");

    // Heuristic: request contains role/constraint language
    const reqLower = req.toLowerCase();
    const looksLikeRole = reqLower.includes("you are ") || reqLower.includes("act as ") || reqLower.includes("system") || reqLower.includes("rules") || reqLower.includes("constraints") || reqLower.includes("must ");
    if (req && looksLikeRole) warnings.push("User Request looks like it contains role/constraint language. Keep role/rules in the top blocks; keep the request as the actual question/task.");

    return warnings;
  }

  function renderContextHealth(run){
    const iter = activeIteration(run);
    const box = qs("#contextHealth");
    if (!box) return;

    const warn = validateOrdering(iter);
    const tok = tokenSummary(iter);

    const total = tok.total;
    const soft = 800;
    const hard = 1500;
    const status = total <= soft ? "Lean" : (total <= hard ? "Heavy" : "Bloated");
    const pct = Math.min(100, Math.round((total / 2000) * 100));

    const parts = [];
    parts.push(`<div class="health-row"><div class="health-title">Context Health</div><div class="muted small">≈ ${total} tokens • ${status}</div></div>`);

    if (warn.length){
      parts.push(`<ul>${warn.map(w=>`<li>${escapeHtml(w)}</li>`).join("")}</ul>`);
    } else {
      parts.push(`<div class="muted small">✅ Ordering and essentials look OK (role/rules/schema present; request last).</div>`);
    }

    parts.push(`<div class="meter" aria-label="Token bloat meter"><div style="width:${pct}%"></div></div>`);
    parts.push(`<div class="muted small">Tip: If tokens are high, prune/summarize grounding/memory or tighten the request.</div>`);

    box.innerHTML = parts.join("\n");

    // Keep fix palette in sync with changes that affect it
    renderFixPalette(run);
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;");
  }

  function buildBlockCard(run, iter, blockDef){
    const id = blockDef.id;
    const locked = iter.lockBlockId && iter.lockBlockId !== id;

    const tokBadge = el("span", { class:"badge", text:`≈ ${estimateTokens(iter.blocks[id] || "")} tok` });
    const lockBadge = locked ? el("span", { class:"badge", text:"Locked" }) : el("span", { class:"badge", text:"Editable" });

    const header = el("div", { class: "block-header" }, [
      el("div", {}, [
        el("div", { class:"block-title", text: blockDef.label }),
        el("div", { class:"muted small", text: blockDef.hint })
      ]),
      el("div", { class:"block-actions" }, [tokBadge, lockBadge])
    ]);

    const ta = el("textarea", {
      class: "textarea",
      rows: "6",
      "aria-label": blockDef.label,
      "data-block": id
    });
    ta.value = iter.blocks[id] || "";
    if (locked) {
      ta.setAttribute("disabled","disabled");
      ta.classList.add("muted");
    }
    ta.addEventListener("input", () => {
      iter.blocks[id] = ta.value;
      tokBadge.textContent = `≈ ${estimateTokens(ta.value)} tok`;
      saveRun(run);
      renderContextHealth(run);
      renderChangeAudit(run);
      renderFixPalette(run);
    });

    return el("div", { class:"block" }, [header, ta]);
  }

  function renderBlocks(run){
    const iter = activeIteration(run);
    const container = qs("#blocksContainer");
    container.innerHTML = "";
    ITER_LAB_DATA.BLOCKS.forEach(b => {
      container.appendChild(buildBlockCard(run, iter, b));
    });

    if (iter.lockBlockId) {
      const lockedLabel = ITER_LAB_DATA.BLOCKS.find(b => b.id === iter.lockBlockId)?.label || iter.lockBlockId;
      toastNotice(`Editing is locked to ONE block for this iteration: ${lockedLabel}. Use Adjust → Unlock only if needed.`);
    } else {
      toastNotice("All blocks are editable. When you create the next iteration, choose ONE block to change to enforce discipline.");
    }

    // populate changeBlock dropdown
    const cb = qs("#changeBlock");
    if (cb){
      cb.innerHTML = "";
      ITER_LAB_DATA.BLOCKS.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.label;
        cb.appendChild(opt);
      });
    }

    renderContextHealth(run);
  }

  function contextPackageText(iter, questionOverride){
    const blocks = ITER_LAB_DATA.BLOCKS;
    const lines = [];
    blocks.forEach(b => {
      if (b.id === "request") return;
      const v = (iter.blocks[b.id] || "").trim();
      if (!v) return;
      lines.push(`${b.label}:\n${v}\n`);
    });
    const requestText = questionOverride ? questionOverride : (iter.blocks.request || "");
    lines.push(`User Request:\n${requestText}\n`);
    return lines.join("\n");
  }

  async function copyToClipboard(text){
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch(e){
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Copied to clipboard.");
    }
  }

  
  function renderTestSetEditor(run){
    const host = qs("#testSetEditor");
    const sel = qs("#testTemplateSelect");
    if (!host) return;

    // Templates
    const templates = (typeof getTestTemplatesSafe === "function") ? getTestTemplatesSafe() : [];
    if (sel){
      const current = sel.value;
      sel.innerHTML = "";
      const o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = "— Select —";
      sel.appendChild(o0);
      templates.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.name;
        opt.textContent = `${t.name} (${t.questions.length})`;
        sel.appendChild(opt);
      });
      // preserve if possible
      if ([...sel.options].some(o => o.value === current)) sel.value = current;
    }

    const qsList = getTestSet(run).slice();
    host.innerHTML = "";

    if (!qsList.length){
      host.appendChild(el("div", { class:"muted small", text:"No questions yet. Add at least one question." }));
      return;
    }

    const list = el("div", { class:"testset-list" });
    qsList.forEach((q, idx) => {
      const ta = el("textarea", { class:"textarea", rows:"2", "aria-label":`Test question ${idx+1}` });
      ta.value = q;

      ta.addEventListener("input", () => {
        qsList[idx] = ta.value;
        setTestSet(run, qsList);
      });

      const btnUp = el("button", { class:"btn btn-secondary sm", type:"button", text:"Up", onclick: () => {
        if (idx === 0) return;
        const tmp = qsList[idx-1]; qsList[idx-1] = qsList[idx]; qsList[idx] = tmp;
        setTestSet(run, qsList);
        renderTestSetEditor(run);
      }});

      const btnDown = el("button", { class:"btn btn-secondary sm", type:"button", text:"Down", onclick: () => {
        if (idx >= qsList.length-1) return;
        const tmp = qsList[idx+1]; qsList[idx+1] = qsList[idx]; qsList[idx] = tmp;
        setTestSet(run, qsList);
        renderTestSetEditor(run);
      }});

      const btnRemove = el("button", { class:"btn danger sm", type:"button", text:"Remove", onclick: () => {
        qsList.splice(idx, 1);
        setTestSet(run, qsList);
        renderTestSetEditor(run);
      }});

      const row = el("div", { class:"testset-row" }, [
        el("div", { class:"testset-num", text:String(idx+1) }),
        el("div", { class:"col grow" }, [ta]),
        el("div", { class:"testset-actions" }, [btnUp, btnDown, btnRemove])
      ]);

      list.appendChild(row);
    });

    host.appendChild(list);
  }

  function blockDiffIdsBetween(aIter, bIter){
    if (!aIter || !bIter) return [];
    const changed = [];
    ITER_LAB_DATA.BLOCKS.forEach(b => {
      const id = b.id;
      const a = (aIter.blocks && aIter.blocks[id]) ? String(aIter.blocks[id]) : "";
      const c = (bIter.blocks && bIter.blocks[id]) ? String(bIter.blocks[id]) : "";
      if (a.trim() !== c.trim()) changed.push(id);
    });
    return changed;
  }

  
  // Line-level diff (LCS on lines) for Compare view
  function diffLinesHtml(aText, bText){
    const a = String(aText || "").split(/\r?\n/);
    const b = String(bText || "").split(/\r?\n/);
    const n = a.length;
    const m = b.length;

    // dp matrix (n+1) x (m+1)
    const dp = new Array(n+1);
    for (let i=0;i<=n;i++){
      dp[i] = new Array(m+1).fill(0);
    }
    for (let i=n-1;i>=0;i--){
      for (let j=m-1;j>=0;j--){
        dp[i][j] = (a[i] === b[j]) ? (dp[i+1][j+1] + 1) : Math.max(dp[i+1][j], dp[i][j+1]);
      }
    }

    let i=0, j=0;
    const out = [];
    while (i < n && j < m){
      if (a[i] === b[j]){
        out.push({ t:"ctx", s:a[i] });
        i++; j++;
      } else if (dp[i+1][j] >= dp[i][j+1]){
        out.push({ t:"del", s:a[i] });
        i++;
      } else {
        out.push({ t:"add", s:b[j] });
        j++;
      }
    }
    while (i < n){ out.push({ t:"del", s:a[i] }); i++; }
    while (j < m){ out.push({ t:"add", s:b[j] }); j++; }

    // collapse empty trailing line noise (optional)
    const lines = out.map(x => {
      const cls = x.t === "add" ? "diff-line diff-add" : (x.t === "del" ? "diff-line diff-del" : "diff-line diff-ctx");
      const prefix = x.t === "add" ? "+" : (x.t === "del" ? "−" : " ");
      const safe = escapeHtml(x.s);
      return `<span class="${cls}"><span class="diff-prefix">${prefix}</span>${safe}</span>`;
    }).join("");

    return lines || `<span class="muted small">—</span>`;
  }

function renderCompare(run){
    const selA = qs("#cmpA");
    const selB = qs("#cmpB");
    const btnSwap = qs("#btnSwapCompare");
    const summary = qs("#compareSummary");
    const tests = qs("#compareTests");
    const blocks = qs("#compareBlocks");
    if (!selA || !selB || !summary || !tests || !blocks) return;

    const iters = getSortedIterations(run);
    if (!iters.length){
      summary.textContent = "No iterations yet.";
      tests.textContent = "";
      blocks.textContent = "";
      return;
    }

    // Populate selects (preserve selection when possible)
    const prevA = selA.value;
    const prevB = selB.value;

    const fill = (sel) => {
      sel.innerHTML = "";
      iters.forEach(it => {
        const opt = document.createElement("option");
        opt.value = it.id;
        opt.textContent = `Iteration ${it.number}`;
        sel.appendChild(opt);
      });
    };

    fill(selA);
    fill(selB);

    const last = iters[iters.length-1].id;
    const secondLast = iters.length >= 2 ? iters[iters.length-2].id : last;

    selA.value = (prevA && run.iterations[prevA]) ? prevA : secondLast;
    selB.value = (prevB && run.iterations[prevB]) ? prevB : last;

    const update = () => {
      const a = run.iterations[selA.value];
      const b = run.iterations[selB.value];
      const rubric = getRubric(run);

      if (!a || !b){
        summary.textContent = "Select two iterations to compare.";
        tests.textContent = "";
        blocks.textContent = "";
        return;
      }

      const sa = computeIterationScore(a, rubric);
      const sb = computeIterationScore(b, rubric);

      const deltaOverall = (sa.overall !== null && sb.overall !== null) ? (sb.overall - sa.overall) : null;
      const d = deltaBadge(deltaOverall);

      const critRows = ITER_LAB_DATA.CHECKLIST.map(c => {
        const va = sa.averages[c.id];
        const vb = sb.averages[c.id];
        const dd = (va !== null && vb !== null) ? (vb - va) : null;
        const bd = deltaBadge(dd);
        return `<tr>
          <td>${escapeHtml(c.label)}</td>
          <td>${escapeHtml(va === null ? "—" : va.toFixed(2))}</td>
          <td>${escapeHtml(vb === null ? "—" : vb.toFixed(2))}</td>
          <td><span class="${bd.cls}">${escapeHtml(bd.text)}</span></td>
        </tr>`;
      }).join("");

      summary.innerHTML = `
        <div class="card inner">
          <h3 class="h3">Score comparison</h3>
          <p class="muted small">Rubric-weighted averages (0–2). Overall shown as percent of 2.</p>
          <div class="row wrap gap">
            <div class="pill">A: Iteration ${a.number}</div>
            <div class="pill">B: Iteration ${b.number}</div>
            <div class="pill ${d.cls}">Δ Overall: ${escapeHtml(d.text)}</div>
          </div>
          <div class="divider"></div>
          <div class="row wrap gap">
            <div class="col grow">
              <strong>Overall A:</strong> ${escapeHtml(formatPctFrom02(sa.overall))}
            </div>
            <div class="col grow">
              <strong>Overall B:</strong> ${escapeHtml(formatPctFrom02(sb.overall))}
            </div>
          </div>
          <div style="margin-top:10px;overflow:auto;">
            <table class="table" aria-label="Criteria comparison">
              <thead><tr><th>Criterion</th><th>A</th><th>B</th><th>Δ</th></tr></thead>
              <tbody>${critRows}</tbody>
            </table>
          </div>
        </div>
      `;

      // Per-test compare (match by question)
      const mapA = new Map();
      (a.tests || []).forEach(t => {
        const k = String(t.question || "").trim();
        if (k && !mapA.has(k)) mapA.set(k, t);
      });

      const mapB = new Map();
      (b.tests || []).forEach(t => {
        const k = String(t.question || "").trim();
        if (k && !mapB.has(k)) mapB.set(k, t);
      });

      const allQs = [];
      (b.tests || []).forEach(t => { const k = String(t.question || "").trim(); if (k) allQs.push(k); });
      // include A-only tests at end
      (a.tests || []).forEach(t => {
        const k = String(t.question || "").trim();
        if (k && !allQs.includes(k)) allQs.push(k);
      });

      const testRows = allQs.map((q, idx) => {
        const ta = mapA.get(q);
        const tb = mapB.get(q);
        const va = ta ? testAverage(ta, rubric) : null;
        const vb = tb ? testAverage(tb, rubric) : null;
        const dd = (va !== null && vb !== null) ? (vb - va) : null;
        const bd = deltaBadge(dd);
        const note = (!ta || !tb) ? `<span class="muted small">(missing in ${!ta ? "A" : "B"})</span>` : "";
        return `<tr>
          <td>${escapeHtml(q)} ${note}</td>
          <td>${escapeHtml(formatPctFrom02(va))}</td>
          <td>${escapeHtml(formatPctFrom02(vb))}</td>
          <td><span class="${bd.cls}">${escapeHtml(bd.text)}</span></td>
        </tr>`;
      }).join("");

      tests.innerHTML = `
        <div class="card inner">
          <h3 class="h3">Per-test deltas</h3>
          <p class="muted small">Matches tests by question text. Missing tests are flagged.</p>
          <div style="overflow:auto;">
            <table class="table" aria-label="Per-test comparison">
              <thead><tr><th>Question</th><th>A</th><th>B</th><th>Δ</th></tr></thead>
              <tbody>${testRows || ""}</tbody>
            </table>
          </div>
        </div>
      `;

      // Block compare
      const changed = blockDiffIdsBetween(a, b);
      const list = changed.length ? changed.map(id => {
        const label = (ITER_LAB_DATA.BLOCKS.find(x => x.id === id)?.label || id);
        const aText = a.blocks && a.blocks[id] ? String(a.blocks[id]) : "";
        const bText = b.blocks && b.blocks[id] ? String(b.blocks[id]) : "";
        return `
          <details>
            <summary>${escapeHtml(label)}</summary>
            <div class="compare-grid" style="margin-top:10px;">
              <div class="compare-pane">
                <div class="label">A</div>
                <div class="pre">${escapeHtml(aText || "—")}</div>
              </div>
              <div class="compare-pane">
                <div class="label">B</div>
                <div class="pre">${escapeHtml(bText || "—")}</div>
              </div>
            </div>
            <div style="margin-top:10px;">
              <div class="label">Diff</div>
              <div class="diff-pre">${diffLinesHtml(aText, bText)}</div>
            </div>
          </details>
        `;
      }).join("\n") : `<div class="muted small">No block changes detected between these iterations.</div>`;

      blocks.innerHTML = `
        <div class="card inner">
          <h3 class="h3">Changed blocks</h3>
          <p class="muted small">Shows before/after for blocks that differ (trim-based compare).</p>
          <div class="stack" style="display:flex;flex-direction:column;gap:10px;">
            ${list}
          </div>
        </div>
      `;
    };

    if (!selA.dataset.bound){
      selA.addEventListener("change", update);
      selB.addEventListener("change", update);
      if (btnSwap){
        btnSwap.addEventListener("click", () => {
          const a = selA.value;
          selA.value = selB.value;
          selB.value = a;
          update();
        });
      }
      selA.dataset.bound = "1";
    }

    update();
  }
function renderTests(run){
    const iter = activeIteration(run);
    const list = qs("#testList");
    list.innerHTML = "";

    iter.tests.forEach(t => {
      const qP = el("p", { class:"test-q", text: t.question });
      const actions = el("div", { class:"test-actions" }, [
        el("button", { class:"btn btn-secondary", type:"button", text:"Copy Context + This Question", onclick: () => copyToClipboard(contextPackageText(iter, t.question)) }),
        el("button", { class:"btn btn-secondary", type:"button", text:"Copy Question Only", onclick: () => copyToClipboard(t.question) })
      ]);

      const outLabel = el("label", { class:"label", for:`out_${t.id}`, text:"Paste model output (optional but recommended)" });
      const out = el("textarea", { class:"textarea", id:`out_${t.id}`, rows:"6" });
      out.value = t.modelOutput || "";
      out.addEventListener("input", () => { t.modelOutput = out.value; saveRun(run); });

      list.appendChild(el("div", { class:"test-card" }, [qP, actions, outLabel, out]));
    });
  }

  function scoreValue(v){
    if (v === null || v === undefined) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return Math.max(0, Math.min(2, n));
  }

  function computeIterationScore(iter, rubric){
    rubric = rubric || (ITER_LAB_DATA.RUBRIC_DEFAULT || { weights:{grounded:1,relevant:1,consistent:1,structured:1,safe:1}, passThreshold:1.5, regressionAlertDelta:-0.2 });
    const crit = ITER_LAB_DATA.CHECKLIST.map(c => c.id);

    const totals = {};
    crit.forEach(id => totals[id] = { sum:0, count:0 });

    iter.tests.forEach(t => {
      crit.forEach(id => {
        const val = scoreValue(t.scores[id]);
        if (val !== null){
          totals[id].sum += val;
          totals[id].count += 1;
        }
      });
    });

    const averages = {};
    crit.forEach(id => {
      averages[id] = totals[id].count ? (totals[id].sum / totals[id].count) : null;
    });

    const overall = (() => {
      const w = rubric.weights || {};
      let num = 0;
      let den = 0;
      crit.forEach(id => {
        const a = averages[id];
        const wt = Number(w[id] ?? 1);
        if (a !== null && wt > 0){
          num += a * wt;
          den += wt;
        }
      });
      if (!den) return null;
      return num / den;
    })();

    return { averages, overall };
  }

  function testAverage(t, rubric){
    rubric = rubric || (ITER_LAB_DATA.RUBRIC_DEFAULT || { weights:{grounded:1,relevant:1,consistent:1,structured:1,safe:1}, passThreshold:1.5, regressionAlertDelta:-0.2 });
    const crit = ITER_LAB_DATA.CHECKLIST.map(c => c.id);
    const w = rubric.weights || {};
    let num = 0;
    let den = 0;
    crit.forEach(id => {
      const v = scoreValue(t.scores[id]);
      const wt = Number(w[id] ?? 1);
      if (v !== null && wt > 0){
        num += v * wt;
        den += wt;
      }
    });
    if (!den) return null;
    return num / den;
  }

  function getSortedIterations(run){
    return Object.values(run.iterations).sort((a,b)=>a.number-b.number);
  }

  function getPreviousIteration(run, iter){
    const iters = getSortedIterations(run);
    const idx = iters.findIndex(i => i.id === iter.id);
    if (idx <= 0) return null;
    return iters[idx-1];
  }

  function formatPctFrom02(val){
    if (val === null || val === undefined) return "—";
    return `${(val/2*100).toFixed(0)}%`;
  }

  function deltaBadge(delta){
    if (delta === null) return { text:"Δ —", cls:"delta-badge" };
    const pct = (delta/2*100);
    const abs = Math.abs(pct);
    if (abs < 1) return { text:"= 0%", cls:"delta-badge" };
    const arrow = pct > 0 ? "▲" : "▼";
    const cls = pct > 0 ? "delta-badge positive" : "delta-badge negative";
    return { text:`${arrow} ${abs.toFixed(0)}%`, cls };
  }

  function renderScoreSummary(run){
    const iter = activeIteration(run);
    const rubric = getRubric(run);
    const s = computeIterationScore(iter, rubric);
    const prev = getPreviousIteration(run, iter);
    const sPrev = prev ? computeIterationScore(prev, rubric) : null;

    const box = qs("#scoreSummary");
    const overall = formatPctFrom02(s.overall);

    let deltaText = "";
    if (s.overall !== null && sPrev && sPrev.overall !== null){
      const d = s.overall - sPrev.overall;
      const badge = deltaBadge(d);
      deltaText = ` • <span class=\"${badge.cls}\">${badge.text}</span>`;
    }

    box.innerHTML = [
      `<strong>Iteration ${iter.number}</strong> • Overall reliability: <strong>${overall}</strong>${deltaText}`,
      `<span class=\"muted small\">Weighted rubric • Scale: 0=Fail, 1=Partial, 2=Pass • Pass ≥ ${Number(rubric.passThreshold).toFixed(2)}</span>`
    ].join("<br/>");
  }

    function clampNumber(n, min, max){
    n = Number(n);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function renderRubric(run){
    const grid = qs("#rubricGrid");
    const pass = qs("#passThreshold");
    const reg = qs("#regressThreshold");
    if (!grid || !pass || !reg) return;

    const rubric = getRubric(run);

    // Build weights grid (2-up on desktop, 1-up on mobile via CSS)
    grid.innerHTML = "";
    const crit = ITER_LAB_DATA.CHECKLIST.map(c => c.id);
    crit.forEach((id) => {
      const def = ITER_LAB_DATA.CHECKLIST.find(c => c.id === id);
      const label = def ? def.label : id;
      const rowLabel = el("div", { class:"rubric-row-label", text: label });
      const input = el("input", { class:"input rubric-weight", type:"number", min:"0", max:"5", step:"0.25", value:String(rubric.weights[id] ?? 1) });
      input.addEventListener("change", () => {
        const v = clampNumber(input.value, 0, 5);
        rubric.weights[id] = v;
        saveRun(run);
        renderScoreSummary(run);
        renderEvaluations(run);
        renderIterationSummary(run);
        renderRegression(run);
        renderTrend(run);
        renderFixPalette(run);
        renderLog(run);
      });
      grid.appendChild(rowLabel);
      grid.appendChild(input);
    });

    pass.value = String(clampNumber(rubric.passThreshold, 0, 2).toFixed(2));
    reg.value = String(clampNumber(rubric.regressionAlertDelta, -2, 2).toFixed(2));

    pass.onchange = () => {
      rubric.passThreshold = clampNumber(pass.value, 0, 2);
      saveRun(run);
      renderScoreSummary(run);
      renderIterationSummary(run);
      renderRegression(run);
      renderTrend(run);
      renderFixPalette(run);
      renderLog(run);
    };

    reg.onchange = () => {
      rubric.regressionAlertDelta = clampNumber(reg.value, -2, 2);
      saveRun(run);
      renderRegression(run);
      renderFixPalette(run);
      renderLog(run);
    };
  }

  function blockDiffIds(prevIter, iter){
    if (!prevIter) return [];
    const changed = [];
    ITER_LAB_DATA.BLOCKS.forEach(b => {
      const id = b.id;
      const a = (prevIter.blocks && prevIter.blocks[id]) ? String(prevIter.blocks[id]) : "";
      const c = (iter.blocks && iter.blocks[id]) ? String(iter.blocks[id]) : "";
      if (a.trim() !== c.trim()) changed.push(id);
    });
    return changed;
  }

  function renderChangeAudit(run){
    const target = qs("#changeAudit");
    if (!target) return;
    const iter = activeIteration(run);
    const prev = getPreviousIteration(run, iter);
    if (!prev){
      target.textContent = "No previous iteration yet. After Iteration 2+, this panel shows what changed between iterations.";
      return;
    }

    const changed = blockDiffIds(prev, iter);
    const declared = iter.changeBlockId;
    const lock = iter.lockBlockId;

    const chips = [];
    const rubric = getRubric(run);
    const delta = (() => {
      const s = computeIterationScore(iter, rubric);
      const sp = computeIterationScore(prev, rubric);
      if (s.overall === null || sp.overall === null) return null;
      return s.overall - sp.overall;
    })();

    const disciplineOk = (changed.length <= 1) || (lock && changed.length === 1 && changed[0] === lock);
    const declaredOk = (!declared && iter.changeType === "Baseline") || (!declared) || (changed.includes(declared) && changed.length === 1);

    const badge = (text, cls) => `<span class="badge ${cls}">${escapeHtml(text)}</span>`;

    if (!changed.length){
      chips.push(badge("No block changes detected", "good"));
    } else {
      chips.push(badge(`${changed.length} block(s) changed`, changed.length === 1 ? "good" : "bad"));
      changed.forEach(id => {
        const lab = (ITER_LAB_DATA.BLOCKS.find(b => b.id === id)?.label || id);
        chips.push(badge(lab, "badge"));
      });
    }

    if (lock){
      const lockLab = (ITER_LAB_DATA.BLOCKS.find(b => b.id === lock)?.label || lock);
      chips.push(badge(`Locked: ${lockLab}`, "badge"));
    }

    if (declared){
      const decLab = (ITER_LAB_DATA.BLOCKS.find(b => b.id === declared)?.label || declared);
      chips.push(badge(`Declared: ${decLab}`, declaredOk ? "good" : "bad"));
    }

    if (delta !== null){
      const d = deltaBadge(delta);
      chips.push(`<span class="${d.cls}">${escapeHtml(d.text)}</span>`);
      if (delta <= Number(getRubric(run).regressionAlertDelta)) chips.push(badge("Regression alert", "bad"));
    }

    const msg = [];
    msg.push(`This checks discipline vs previous iteration.`);
    msg.push(`<div class="audit-badges">${chips.join("")}</div>`);
    if (!disciplineOk){
      msg.push(`<div class="muted small" style="margin-top:8px;"><strong>Warning:</strong> multiple blocks changed. For reliable learning, change one block per iteration.</div>`);
    }
    if (declared && !declaredOk){
      msg.push(`<div class="muted small" style="margin-top:6px;"><strong>Note:</strong> declared block does not match detected changes.</div>`);
    }
    target.innerHTML = msg.join("");
  }

  function downloadTextFile(filename, text, mime){
    const blob = new Blob([text], { type: mime || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function iterationReportMarkdown(run){
    const s = getScenario(run.scenarioId);
    const rubric = getRubric(run);
    const iter = activeIteration(run);
    const prev = getPreviousIteration(run, iter);

    const score = computeIterationScore(iter, rubric);
    const prevScore = prev ? computeIterationScore(prev, rubric) : null;

    const delta = (score.overall !== null && prevScore && prevScore.overall !== null) ? (score.overall - prevScore.overall) : null;

    const changed = prev ? blockDiffIds(prev, iter) : [];
    const lockLabel = iter.lockBlockId ? (ITER_LAB_DATA.BLOCKS.find(b => b.id === iter.lockBlockId)?.label || iter.lockBlockId) : "None";

    const lines = [];
    lines.push(`# Iteration Lab Report — ${run.runName || "Run"} — Iteration ${iter.number}`);
    lines.push(`- Date: ${new Date().toISOString()}`);
    lines.push(`- App version: ${APP_VERSION}`);
    lines.push(`- Scenario: ${s.name}`);
    lines.push(`- Change type: ${iter.changeType}`);
    lines.push(`- Declared changed block: ${iter.changeBlockId || "—"}`);
    lines.push(`- Locked block: ${lockLabel}`);
    lines.push("");

    lines.push(`## Rubric`);
    lines.push(`- Pass threshold (0–2): ${Number(rubric.passThreshold).toFixed(2)}`);
    lines.push(`- Regression alert Δ: ${Number(rubric.regressionAlertDelta).toFixed(2)}`);
    lines.push(`- Weights:`);
    Object.keys(rubric.weights || {}).forEach(k => {
      lines.push(`  - ${k}: ${Number(rubric.weights[k]).toFixed(2)}`);
    });
    lines.push("");

    lines.push(`## Scores`);
    lines.push(`- Overall reliability: ${formatPctFrom02(score.overall)}${delta !== null ? ` (Δ ${delta.toFixed(2)})` : ""}`);
    ITER_LAB_DATA.CHECKLIST.forEach(c => {
      const a = score.averages[c.id];
      lines.push(`- ${c.label}: ${a === null ? "—" : `${a.toFixed(2)} / 2`}`);
    });
    lines.push("");

    lines.push(`## Per-test summary`);
    iter.tests.forEach((t, idx) => {
      const avg = testAverage(t, rubric);
      const k = String(t.question || "").trim();
      const prevMap = new Map();
      (prev && prev.tests ? prev.tests : []).forEach(pt => {
        const pk = String(pt.question || "").trim();
        if (pk && !prevMap.has(pk)) prevMap.set(pk, pt);
      });
      const p = k ? prevMap.get(k) : null;
      const pAvg = p ? testAverage(p, rubric) : null;
      const d = (avg !== null && pAvg !== null) ? (avg - pAvg) : null;
      lines.push(`- T${idx+1}: ${t.question}`);
      lines.push(`  - Reliability: ${formatPctFrom02(avg)}${d !== null ? ` (Δ ${d.toFixed(2)})` : ""}`);
    });
    lines.push("");

    lines.push(`## Change audit`);
    if (!prev){
      lines.push(`- No previous iteration.`);
    } else {
      lines.push(`- Blocks changed vs previous: ${changed.length ? changed.join(", ") : "none detected"}`);
      if (changed.length > 1){
        lines.push(`- Warning: multiple blocks changed. Consider re-running with one-block discipline.`);
      }
    }
    lines.push("");

    lines.push(`## Suggested fixes (from Fix Palette)`);
    const fix = computeFixSuggestions(run);
    if (!fix.length){
      lines.push(`- —`);
    } else {
      fix.forEach(x => lines.push(`- ${x}`));
    }

    return lines.join("\n");
  }

  function computeFixSuggestions(run){
    // Return the same suggestions currently shown in the Fix Palette, but as plain strings.
    const iter = activeIteration(run);
    const tok = tokenSummary(iter);
    const rubric = getRubric(run);
    const s = computeIterationScore(iter, rubric);

    const suggestions = [];

    // If no scores yet, give lightweight guidance
    const a = s.averages || {};
    const low = Object.keys(a).filter(k => a[k] !== null && a[k] < 1.2);

    if (!Object.values(a).some(v => v !== null)){
      suggestions.push("Add scores in Evaluate to unlock targeted fix suggestions.");
      return suggestions;
    }

    if (tok.total > 1200) suggestions.push("Reduce context bloat: trim or move non-essential text out of the prompt blocks.");
    if (low.includes("grounded")) suggestions.push("Add or tighten Grounding Knowledge excerpts; require citations to excerpts.");
    if (low.includes("relevant")) suggestions.push("Clarify the task intent and remove unrelated context; add a crisp success definition.");
    if (low.includes("consistent")) suggestions.push("Add rules for consistency (terminology, assumptions, decision policy).");
    if (low.includes("structured")) suggestions.push("Specify a strict output schema with headings and bullet rules; include a short example.");
    if (low.includes("safe")) suggestions.push("Add explicit safety/on-policy constraints and refusal behavior for missing info.");

    if (!suggestions.length) suggestions.push("No major issues detected. Consider small clarity refinements or add a test that previously failed.");

    return suggestions;
  }

function renderEvaluations(run){
    const iter = activeIteration(run);
    const prev = getPreviousIteration(run, iter);
    const rubric = getRubric(run);

    const list = qs("#evalList");
    list.innerHTML = "";
    renderScoreSummary(run);

    const prevMap = new Map();
    if (prev && prev.tests){
      prev.tests.forEach(pt => {
        const pk = String(pt.question || "").trim();
        if (pk && !prevMap.has(pk)) prevMap.set(pk, pt);
      });
    }
    const sig = (it) => (it && it.tests ? it.tests.map(x => String(x.question || "").trim()).join("||") : "");
    const testSetChanged = prev ? (sig(iter) !== sig(prev)) : false;


    iter.tests.forEach((t, idx) => {
      const card = el("div", { class:"test-card" }, [
        el("p", { class:"test-q", text: `T${idx+1}. ${t.question}` }),
      ]);

      // Per-test regression marker (avg across criteria)
      const thisAvg = testAverage(t, rubric);
      const key = String(t.question || "").trim();
      const p = key ? prevMap.get(key) : null;
      const prevAvg = p ? testAverage(p, rubric) : null;
      let delta = null;
      if (thisAvg !== null && prevAvg !== null) delta = thisAvg - prevAvg;
      const b = deltaBadge(delta);

      const deltaRow = el("div", { class:"delta" }, [
        el("span", { class:"muted small", text: `Test reliability: ${formatPctFrom02(thisAvg)}` }),
        el("span", { class: b.cls, text: b.text })
      ]);
      card.appendChild(deltaRow);

      const criteriaWrap = el("div", { class:"criteria" });

      ITER_LAB_DATA.CHECKLIST.forEach(c => {
        const fs = el("fieldset", { class:"crit" });
        const lg = el("legend", { text: c.label });
        const tip = el("div", { class:"muted small", text: c.tip });
        const opts = el("div", { class:"options" });

        const name = `${iter.id}_${t.id}_${c.id}`;
        const choices = [
          { val: 0, label: "Fail" },
          { val: 1, label: "Partial" },
          { val: 2, label: "Pass" }
        ];

        choices.forEach(ch => {
          const id = `${name}_${ch.val}`;
          const input = el("input", { type:"radio", name, id, value:String(ch.val) });
          if (String(t.scores[c.id]) === String(ch.val)) input.checked = true;
          input.addEventListener("change", () => {
            t.scores[c.id] = Number(input.value);
            saveRun(run);
            renderScoreSummary(run);
            renderIterationSummary(run);
            renderRegression(run);
            renderLog(run);
            renderTrend(run);
            renderFixPalette(run);
          });

          const lab = el("label", { class:"option", for:id }, [input, document.createTextNode(ch.label)]);
          opts.appendChild(lab);
        });

        fs.appendChild(lg);
        fs.appendChild(tip);
        fs.appendChild(opts);
        criteriaWrap.appendChild(fs);
      });

      card.appendChild(criteriaWrap);
      list.appendChild(card);
    });
  }

  function renderIterationSummary(run){
    const iter = activeIteration(run);
    const rubric = getRubric(run);
    const s = computeIterationScore(iter, rubric);
    const overall = formatPctFrom02(s.overall);
    const lockLabel = iter.lockBlockId ? (ITER_LAB_DATA.BLOCKS.find(b => b.id === iter.lockBlockId)?.label || iter.lockBlockId) : "None";
    const target = qs("#currentIterationSummary");
    target.innerHTML = [
      `Iteration <strong>${iter.number}</strong>`,
      `Change: <strong>${iter.changeType}</strong>`,
      `Locked block: <strong>${lockLabel}</strong>`,
      `Reliability: <strong>${overall}</strong>`
    ].join("<br/>");
  }

  function renderRegression(run){
    const panel = qs("#regressionPanel");
    const iters = getSortedIterations(run);
    if (iters.length < 2){
      panel.textContent = "Run at least two iterations to see regressions.";
      return;
    }

    const last = iters[iters.length-1];
    const prev = iters[iters.length-2];

    const sig = (it) => (it.tests || []).map(t => String(t.question || "").trim()).join("||");
    const testSetChanged = sig(last) !== sig(prev);

    const rubric = getRubric(run);
    const sLast = computeIterationScore(last, rubric);
    const sPrev = computeIterationScore(prev, rubric);

    if (sLast.overall === null || sPrev.overall === null){
      panel.textContent = "Add scores in Evaluate tab for at least two iterations.";
      return;
    }

    const regCriteria = [];
    ITER_LAB_DATA.CHECKLIST.forEach(c => {
      const a = sPrev.averages[c.id];
      const b = sLast.averages[c.id];
      if (a !== null && b !== null && b < a) {
        regCriteria.push(`${c.label} decreased (${formatPctFrom02(a)} → ${formatPctFrom02(b)})`);
      }
    });

    const prevMap = new Map();
    (prev.tests || []).forEach(t => {
      const k = String(t.question || "").trim();
      if (k && !prevMap.has(k)) prevMap.set(k, t);
    });

    const regTests = [];
    last.tests.forEach((t, idx) => {
      const k = String(t.question || "").trim();
      const p = k ? prevMap.get(k) : null;
      const a = p ? testAverage(p, rubric) : null;
      const b = testAverage(t, rubric);
      if (a !== null && b !== null && b < a) {
        regTests.push(`T${idx+1} decreased (${formatPctFrom02(a)} → ${formatPctFrom02(b)})`);
      }
    });

    const html = [];

    if (!regCriteria.length && !regTests.length){
      html.push(`<strong>No regressions detected</strong><br/><span class="muted small">Checklist averages and matched per-test scores stayed the same or improved vs previous iteration.</span>${testSetChanged ? `<br/><span class="muted small">Note: test set changed between these iterations; per-test comparisons may be incomplete.</span>` : ""}`);
      panel.innerHTML = html.join("\n");
      return;
    }

    html.push(`<strong>Regression warnings</strong>`);
    if (testSetChanged) html.push(`<div class="muted small">Note: test set changed between these iterations; per-test comparisons may be incomplete.</div>`);

    if (regCriteria.length){
      html.push(`<div class="muted small">Checklist averages:</div>`);
      html.push(`<ul>${regCriteria.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>`);
    }
    if (regTests.length){
      html.push(`<div class="muted small">Per-test markers (matched by question):</div>`);
      html.push(`<ul>${regTests.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>`);
    }

    panel.innerHTML = html.join("\n");
  }


  function renderLog(run){
    const view = qs("#logView");
    const iters = getSortedIterations(run);
    const rubric = getRubric(run);
    const lines = iters.map(it => {
      const s = computeIterationScore(it, rubric);
      const overall = formatPctFrom02(s.overall);
      const lock = it.lockBlockId ? (ITER_LAB_DATA.BLOCKS.find(b => b.id === it.lockBlockId)?.label || it.lockBlockId) : "None";
      return [
        `Iteration ${it.number}`,
        `- Created: ${it.createdAt}`,
        `- Change: ${it.changeType}`,
        `- Changed block: ${it.changeBlockId || "—"}`,
        `- Locked block: ${lock}`,
        `- Notes: ${it.changeNotes || "—"}`,
        `- Reliability: ${overall}`
      ].join("\n");
    }).join("\n\n");

    view.textContent = lines || "No iterations yet.";
  }

  function iterationLogText(run){
    const iters = getSortedIterations(run);
    const s = getScenario(run.scenarioId);
    const header = [
      `Iteration Lab Log`,
      `Run: ${run.runName || "—"}`,
      `Scenario: ${s.name}`,
      `Created: ${run.createdAt}`,
      `Updated: ${run.updatedAt}`,
      `---`
    ].join("\n");

    const rubric = getRubric(run);

    const body = iters.map(it => {
      const sc = computeIterationScore(it, rubric);
      const overall = formatPctFrom02(sc.overall);
      return `Iteration ${it.number} • ${it.changeType} • Reliability ${overall}\nNotes: ${it.changeNotes || "—"}`;
    }).join("\n\n");

    return `${header}\n${body}\n`;
  }

  function createNextIteration(run){
    const iter = activeIteration(run);
    const changeType = qs("#changeType").value;
    const changeBlockId = qs("#changeBlock").value;
    const changeNotes = qs("#changeNotes").value || "";

    // Discipline warning if current iteration changed multiple blocks vs previous
    const prevIter = getPreviousIteration(run, iter);
    if (prevIter){
      const changed = blockDiffIds(prevIter, iter);
      if (changed.length > 1){
        const ok = confirm(`Discipline warning: ${changed.length} blocks changed since the previous iteration.\n\nFor reliable learning, change ONE block per iteration.\n\nProceed anyway?`);
        if (!ok) return;
      }
    }

    // clone current iteration
    const iters = Object.values(run.iterations);
    const nextNum = Math.max(...iters.map(i=>i.number)) + 1;
    const nextId = `i${nextNum}`;

    const next = JSON.parse(JSON.stringify(iter));
    next.id = nextId;
    next.number = nextNum;
    next.createdAt = nowISO();
    next.changeType = changeType;
    next.changeBlockId = changeBlockId;
    next.changeNotes = changeNotes;
    next.lockBlockId = changeBlockId;

    // fresh test set (from settings)
    const qs = getTestSet(run);
    next.tests = buildTestsFromQuestions(qs);
    next.testSetHash = hashQuestions(qs);

    run.iterations[nextId] = next;
    run.activeIterationId = nextId;
    logEvent(run, "iteration_created", { number: nextNum, changeType, changeBlockId, lockBlockId: next.lockBlockId });
    saveRun(run);

    // update UI
    renderAll(run);
    setTab("design");
  }

  function unlockAll(run){
    const iter = activeIteration(run);
    iter.lockBlockId = null;
    saveRun(run);
    renderBlocks(run);
    renderIterationSummary(run);
  }

  function clearOutputs(run){
    const iter = activeIteration(run);
    iter.tests.forEach(t => t.modelOutput = "");
    saveRun(run);
    renderTests(run);
  }

  function resetRun(){
    if (!confirm("Reset this run? This clears your local data for Iteration Lab.")) return;
    clearAllRuns();
    init();
  }

  function exportRun(run){
    const blob = new Blob([JSON.stringify(run, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iteration-lab-run-${(run.runName||run.scenarioId||"run").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  function exportBundle(run){
    run = normalizeRun(run);
    const report = iterationReportMarkdown(run);
    const bundle = {
      meta: {
        app: "Iteration Lab",
        appVersion: APP_VERSION,
        exportedAt: nowISO()
      },
      run,
      report_md: report,
      userScenarios: getUserScenariosSafe(),
      testTemplates: getTestTemplatesSafe(),
      iterationLog_md: iterationLogText(run),
      eventLog: Array.isArray(run.eventLog) ? run.eventLog : []
    };
    const nameBase = (run.runName || run.scenarioId || "bundle").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-+|-+$)/g,"");
    downloadTextFile(`iteration-lab-bundle-${nameBase || "run"}.json`, JSON.stringify(bundle, null, 2), "application/json");
    logEvent(run, "bundle_exported", { name: nameBase || "run" });
    saveRun(run);
  }

  function importRunFromFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if (!parsed || !parsed.iterations || !parsed.scenarioId) throw new Error("Invalid file.");
        // normalize
        parsed.schemaVersion = parsed.schemaVersion || "0.2";
        normalizeRun(parsed);
        saveRun(parsed);
        currentRun = parsed;
        renderAll(currentRun);
        alert("Imported run.");
      }catch(e){
        alert("Could not import: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  // Trend chart (overall reliability over time)
  function renderTrend(run){
    const canvas = qs("#trendCanvas");
    const note = qs("#trendNote");
    if (!canvas) return;

    const iters = getSortedIterations(run);
    const rubric = getRubric(run);

    // Build scored points with test-set hash (guardrails)
    const scored = iters
      .map(it => {
        const s = computeIterationScore(it, rubric).overall;
        const hash = it.testSetHash || hashQuestions(iterQuestions(it));
        return { n: it.number, overall: s, hash };
      })
      .filter(p => p.overall !== null)
      .map(p => ({ n: p.n, pct: (p.overall/2*100), hash: p.hash }));

    if (!scored.length){
      if (note) note.textContent = "Scores appear after you evaluate at least one iteration.";
    } else {
      const baseHash = scored[0].hash;
      const changedAt = scored.filter(p => p.hash !== baseHash).map(p => p.n);
      if (note){
        if (changedAt.length){
          const uniq = Array.from(new Set(changedAt)).join(", ");
          note.textContent = `Showing ${scored.length} scored iteration(s). Test set changed at iteration(s): ${uniq}. Trend segments are separated (not apples-to-apples).`;
        } else {
          note.textContent = `Showing ${scored.length} scored iteration(s).`;
        }
      }
    }

    // responsive hi-dpi
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.floor(rect.height || 160);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border") || "#d6dbe6";
    for (let i=0;i<=4;i++){
      const y = 10 + (h-20) * (i/4);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(w-10, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // labels
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#475569";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("100%", 10, 12);
    ctx.fillText("0%", 10, h-8);

    if (scored.length === 1){
      const p = scored[0];
      const x = w/2;
      const y = 10 + (1 - p.pct/100) * (h-20);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#2563eb";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text") || "#0f172a";
      ctx.fillText(`I${p.n}: ${p.pct.toFixed(0)}%`, Math.max(10, x-40), Math.max(20, y-8));
      return;
    }

    const minN = Math.min(...scored.map(p=>p.n));
    const maxN = Math.max(...scored.map(p=>p.n));
    const span = Math.max(1, maxN - minN);

    function xOf(n){
      const t = (n - minN) / span;
      return 20 + t * (w - 40);
    }
    function yOf(pct){
      return 10 + (1 - pct/100) * (h - 20);
    }

    const baseHash = scored[0].hash;

    // plot segments (break when test set hash changes)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#2563eb";
    ctx.lineWidth = 2;

    let prevHash = null;
    scored.forEach((p, i) => {
      const x = xOf(p.n);
      const y = yOf(p.pct);
      if (i === 0 || p.hash !== prevHash){
        if (i !== 0) ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      prevHash = p.hash;
    });
    ctx.stroke();

    // markers (circle = same test set as baseline; square = test set changed)
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#2563eb";
    ctx.fillStyle = primary;
    scored.forEach(p => {
      const x = xOf(p.n);
      const y = yOf(p.pct);
      const changed = (p.hash !== baseHash);
      if (changed){
        ctx.fillRect(x-3.5, y-3.5, 7, 7);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI*2);
        ctx.fill();
      }
    });

    // last label
    const last = scored[scored.length-1];
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text") || "#0f172a";
    ctx.fillText(`I${last.n}: ${last.pct.toFixed(0)}%`, Math.max(10, xOf(last.n)-46), Math.max(20, yOf(last.pct)-8));
  }

  // Fix palette suggestions (based on scores + bloat + ordering) (based on scores + bloat + ordering)
  function renderFixPalette(run){
    const box = qs("#fixPalette");
    if (!box) return;

    const iter = activeIteration(run);
    const warn = validateOrdering(iter);
    const tok = tokenSummary(iter);
    const rubric = getRubric(run);
    const s = computeIterationScore(iter, rubric);

    // If no scores yet, give lightweight guidance
    const anyScore = iter.tests.some(t => Object.values(t.scores || {}).some(v => v !== null && v !== undefined));

    const suggestions = [];

    if (warn.length){
      suggestions.push({ type: "Fix ordering (move role/rules higher)", why: "Ordering/essentials warnings detected." });
    }

    if (tok.total > 1500){
      suggestions.push({ type: "Reduce noise (prune/summarize)", why: "Context looks bloated; shorten grounding/memory or remove low-value text." });
    } else if (tok.total > 800){
      suggestions.push({ type: "Reduce noise (prune/summarize)", why: "Context is getting heavy; consider trimming before adding more." });
    }

    if (anyScore){
      const av = s.averages;
      const low = (id) => (av[id] !== null && av[id] < 1.25);

      if (low("grounded")) suggestions.push({ type: "Add grounding excerpt(s)", why: "Grounded scores are low; add/replace short excerpts that directly support the answers." });
      if (low("structured")) suggestions.push({ type: "Add / improve output schema", why: "Structured scores are low; tighten headings/schema and add an example if needed." });
      if (low("consistent")) suggestions.push({ type: "Add / tighten constraints", why: "Consistency is low; add clearer do/don’t rules and escalate/ask-for-missing-info behavior." });
      if (low("relevant")) suggestions.push({ type: "Clarify the task statement", why: "Relevance is low; rewrite the request to be direct and remove conflicting goals." });
      if (low("safe")) suggestions.push({ type: "Add / tighten constraints", why: "Safety/on-policy is low; strengthen boundaries, uncertainty labeling, and escalation rules." });
    }

    if (!suggestions.length){
      box.innerHTML = anyScore
        ? "✅ No obvious issues detected. Keep one-block changes and re-test."
        : "Add scores (Evaluate) to see targeted suggestions.";
      return;
    }

    const unique = [];
    const seen = new Set();
    for (const s of suggestions){
      const k = s.type;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(s);
    }

    box.innerHTML = `<ul class="fix-list">${unique.map(s => `<li><strong>${escapeHtml(s.type)}</strong><br/><span class="muted small">${escapeHtml(s.why)}</span></li>`).join("")}</ul>`;
  }

  function renderAll(run){
    // scenario select
    const sel = qs("#scenarioSelect");
    const btnDelSc = qs("#btnDeleteScenario");
    sel.innerHTML = "";

    const builtIn = (ITER_LAB_DATA.SCENARIOS || []).slice();
    const user = getUserScenariosSafe();

    function addGroup(label, list){
      if (!list.length) return;
      const og = document.createElement("optgroup");
      og.label = label;
      list.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        if (s.id === run.scenarioId) opt.selected = true;
        og.appendChild(opt);
      });
      sel.appendChild(og);
    }

    addGroup("Built-in", builtIn);
    addGroup("My Scenarios", user);

    // Fallback if selected scenario vanished
    if (!sel.value){
      sel.value = builtIn[0] ? builtIn[0].id : (user[0] ? user[0].id : "");
      run.scenarioId = sel.value;
    }

    if (btnDelSc){
      btnDelSc.disabled = !isUserScenario(run.scenarioId);
    }
// run name
    const rn = qs("#runName");
    rn.value = run.runName || "";
    rn.oninput = () => { run.runName = rn.value; saveRun(run); renderLog(run); };

    // change type dropdown
    const ct = qs("#changeType");
    ct.innerHTML = "";
    ITER_LAB_DATA.CHANGE_TYPES.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      ct.appendChild(opt);
    });

    renderBlocks(run);
    renderTestSetEditor(run);
    renderTests(run);
    renderEvaluations(run);
    renderRubric(run);
    renderIterationSummary(run);
    renderChangeAudit(run);
    renderRegression(run);
    renderTrend(run);
    renderFixPalette(run);
    renderCompare(run);
    renderLog(run);
  }

  // Resume modal
  function showResumeModal(loaded){
    const modal = qs("#resumeModal");
    const summary = qs("#resumeSummary");
    const btnResume = qs("#btnResumeRun");
    const btnStartNew = qs("#btnStartNew");
    const btnExportOld = qs("#btnExportOld");

    if (!modal || !summary || !btnResume || !btnStartNew || !btnExportOld) return false;

    const iters = Object.values(loaded.iterations || {}).length;
    const s = getScenario(loaded.scenarioId);
    summary.innerHTML = `Saved run found: <strong>${escapeHtml(loaded.runName || "(unnamed run)")}</strong><br/>Scenario: <strong>${escapeHtml(s.name)}</strong><br/>Iterations: <strong>${iters}</strong> • Last updated: <strong>${escapeHtml(loaded.updatedAt || "—")}</strong>`;

    modal.classList.remove("hidden");

    btnExportOld.onclick = () => exportRun(loaded);

    btnResume.onclick = () => {
      modal.classList.add("hidden");
      currentRun = loaded;
      // Migrate by saving under v0.3 key
      saveRun(currentRun);
      LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      renderAll(currentRun);
      setTab("design");
    };

    btnStartNew.onclick = () => {
      if (!confirm("Start a new run? This will clear the saved run from this browser.")) return;
      clearAllRuns();
      currentRun = defaultRun(loaded.scenarioId || ITER_LAB_DATA.SCENARIOS[0].id);
      saveRun(currentRun);
      modal.classList.add("hidden");
      renderAll(currentRun);
      setTab("design");
    };

    return true;
  }

  
  // Scenario Builder (local-only)
  function openScenarioModal(run){
    const modal = qs("#scenarioModal");
    if (!modal) return;

    const name = qs("#scName");
    const desc = qs("#scDesc");
    const blocks = qs("#scBlocks");
    const tests = qs("#scTests");

    if (name) name.value = "";
    if (desc) desc.value = "";
    if (blocks) blocks.innerHTML = "";
    if (tests) tests.value = "";

    const srcIter = run ? activeIteration(run) : null;

    // Baseline blocks (prefill from current iteration blocks if available)
    if (blocks){
      ITER_LAB_DATA.BLOCKS.forEach(b => {
        const wrap = document.createElement("div");
        wrap.className = "card inner";
        wrap.style.padding = "10px";

        const lab = document.createElement("label");
        lab.className = "label";
        lab.setAttribute("for", `scBlock_${b.id}`);
        lab.textContent = b.label;

        const ta = document.createElement("textarea");
        ta.className = "input";
        ta.id = `scBlock_${b.id}`;
        ta.rows = 4;
        ta.placeholder = b.hint || "";
        ta.value = (srcIter && srcIter.blocks && srcIter.blocks[b.id]) ? String(srcIter.blocks[b.id]) : "";

        wrap.appendChild(lab);
        wrap.appendChild(ta);
        blocks.appendChild(wrap);
      });
    }

    // Test set (prefill from current run's settings test set)
    if (tests && run){
      tests.value = getTestSet(run).join("\n");
    }

    modal.classList.remove("hidden");
  }

  function closeScenarioModal(){
    const modal = qs("#scenarioModal");
    if (!modal) return;
    modal.classList.add("hidden");
  }

  function slugifyId(s){
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "")
      .slice(0, 48);
  }

  function saveScenarioFromModal(){
    const modal = qs("#scenarioModal");
    if (!modal) return;

    const nameEl = qs("#scName");
    const descEl = qs("#scDesc");
    const testsEl = qs("#scTests");

    const name = nameEl ? nameEl.value.trim() : "";
    const description = descEl ? descEl.value.trim() : "";
    const testsRaw = testsEl ? testsEl.value : "";

    if (!name){
      alert("Scenario name is required.");
      return;
    }

    const baseline = {};
    ITER_LAB_DATA.BLOCKS.forEach(b => {
      const el = qs(`#scBlock_${b.id}`);
      baseline[b.id] = el ? String(el.value || "") : "";
    });

    const tests = String(testsRaw || "")
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(x => x.length);

    const existing = new Set(getAllScenarios().map(s => s.id));
    const base = slugifyId(name) || "scenario";
    let id = base;
    let i = 2;
    while (existing.has(id)){
      id = `${base}-${i}`;
      i++;
    }

    const list = getUserScenariosSafe();
    list.push({ id, name, description, baseline, tests, userCreatedAt: nowISO() });
    saveUserScenarios(list);

    // Switch to new scenario as a fresh run
    const fresh = defaultRun(id);
    fresh.runName = (currentRun && currentRun.runName) ? currentRun.runName : "";
    currentRun = fresh;

    logEvent(currentRun, "scenario_created", { id, name });
    saveRun(currentRun);

    closeScenarioModal();
    renderAll(currentRun);
    setTab("design");
  }

  function deleteSelectedUserScenario(){
    if (!currentRun) return;
    const id = currentRun.scenarioId;

    if (!isUserScenario(id)){
      alert("Only scenarios you created in this browser can be deleted.");
      return;
    }

    const ok = confirm("Delete this scenario? This cannot be undone (local-only).");
    if (!ok) return;

    const remaining = getUserScenariosSafe().filter(s => s.id !== id);
    saveUserScenarios(remaining);

    const fallbackId = (ITER_LAB_DATA.SCENARIOS && ITER_LAB_DATA.SCENARIOS[0]) ? ITER_LAB_DATA.SCENARIOS[0].id : (remaining[0] ? remaining[0].id : id);
    const fresh = defaultRun(fallbackId);
    fresh.runName = (currentRun && currentRun.runName) ? currentRun.runName : "";
    currentRun = fresh;

    logEvent(currentRun, "scenario_deleted", { id });
    saveRun(currentRun);

    renderAll(currentRun);
    setTab("design");
  }


  function init(){
    applyTheme(getPreferredTheme());
    setStatusPills();

    // Tabs
    document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
    setTab("design");

    // Wire buttons
    qs("#btnTheme").addEventListener("click", toggleTheme);
    qs("#btnReset").addEventListener("click", resetRun);

    qs("#btnCopyBaseline").addEventListener("click", () => copyToClipboard(contextPackageText(activeIteration(currentRun), null)));
    qs("#btnClearOutputs").addEventListener("click", () => clearOutputs(currentRun));
    qs("#btnCreateNextIteration").addEventListener("click", () => createNextIteration(currentRun));
    qs("#btnUnlockAll").addEventListener("click", () => unlockAll(currentRun));
    qs("#btnExport").addEventListener("click", () => exportRun(currentRun));
    qs("#btnCopyIterationLog").addEventListener("click", () => copyToClipboard(iterationLogText(currentRun)));

    qs("#btnCopyReport").addEventListener("click", () => copyToClipboard(iterationReportMarkdown(currentRun)));
    qs("#btnDownloadReport").addEventListener("click", () => downloadTextFile(`iteration-lab-iteration-${activeIteration(currentRun).number}-report.md`, iterationReportMarkdown(currentRun), "text/markdown"));
    qs("#btnDownloadBundle").addEventListener("click", () => exportBundle(currentRun));

    qs("#importFile").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importRunFromFile(file);
      e.target.value = "";
    });

    // Test Set editor controls
    const btnAddQ = qs("#btnAddTestQ");
    if (btnAddQ){
      btnAddQ.addEventListener("click", () => {
        const qsList = getTestSet(currentRun).slice();
        qsList.push("");
        setTestSet(currentRun, qsList);
        renderTestSetEditor(currentRun);
        alert("Added a new blank question. Type it in, then apply the test set.");
      });
    }

    const btnApplyCur = qs("#btnApplyTestSetCurrent");
    if (btnApplyCur){
      btnApplyCur.addEventListener("click", () => {
        const ok = confirm("Apply the current Test Set to THIS iteration?\n\nMatching questions will preserve pasted outputs/scores. New questions start blank.");
        if (ok) applyTestSet(currentRun, "current");
      });
    }

    const btnApplyAll = qs("#btnApplyTestSetAll");
    if (btnApplyAll){
      btnApplyAll.addEventListener("click", () => {
        const ok = confirm("Apply the current Test Set to ALL iterations?\n\nMatching questions will preserve pasted outputs/scores. New questions start blank.");
        if (ok) applyTestSet(currentRun, "all");
      });
    }

    const btnSaveTpl = qs("#btnSaveTemplate");
    if (btnSaveTpl){
      btnSaveTpl.addEventListener("click", () => {
        const name = prompt("Template name (saved in this browser):");
        if (!name) return;
        upsertTemplate(name, getTestSet(currentRun));
        renderTestSetEditor(currentRun);
        alert("Template saved.");
      });
    }

    const btnLoadTpl = qs("#btnLoadTemplate");
    if (btnLoadTpl){
      btnLoadTpl.addEventListener("click", () => {
        const sel = qs("#testTemplateSelect");
        const name = sel ? sel.value : "";
        if (!name) { alert("Select a template first."); return; }
        const t = getTestTemplatesSafe().find(x => x.name === name);
        if (!t) { alert("Template not found."); return; }
        setTestSet(currentRun, t.questions);
        renderTestSetEditor(currentRun);
        const ok = confirm("Template loaded into the Test Set editor.\n\nApply it to the current iteration now?");
        if (ok) applyTestSet(currentRun, "current");
      });
    }

    
    // Scenario Builder (local-only)
    const btnNewScenario = qs("#btnNewScenario");
    const btnDeleteScenario = qs("#btnDeleteScenario");
    if (btnNewScenario){
      btnNewScenario.addEventListener("click", () => openScenarioModal(currentRun));
    }
    if (btnDeleteScenario){
      btnDeleteScenario.addEventListener("click", () => deleteSelectedUserScenario());
    }

    // Scenario modal controls
    const btnSaveScenario = qs("#btnSaveScenario");
    const btnCancelScenario = qs("#btnCancelScenario");
    if (btnSaveScenario) btnSaveScenario.addEventListener("click", () => saveScenarioFromModal());
    if (btnCancelScenario) btnCancelScenario.addEventListener("click", () => closeScenarioModal());

    // Scenario change rebuilds run (keeps it simple)
    qs("#scenarioSelect").addEventListener("change", (e) => {
      const id = e.target.value;
      const fresh = defaultRun(id);
      // preserve run name if user typed one
      fresh.runName = (currentRun && currentRun.runName) ? currentRun.runName : "";
      saveRun(fresh);
      currentRun = fresh;
      renderAll(currentRun);
      setTab("design");
    });

    // Load, resume, or create
    const loadedObj = loadRunAny();
    if (loadedObj && loadedObj.run){
      normalizeRun(loadedObj.run);
      const shown = showResumeModal(loadedObj.run);
      if (shown){
        // Keep UI dormant until user chooses
        currentRun = loadedObj.run;
        return;
      }
      // fallback (modal not present)
      currentRun = loadedObj.run;
      saveRun(currentRun);
      LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      renderAll(currentRun);
      return;
    }

    currentRun = defaultRun(ITER_LAB_DATA.SCENARIOS[0].id);
    saveRun(currentRun);
    renderAll(currentRun);
  }

  let currentRun = null;
  document.addEventListener("DOMContentLoaded", init);
})();
