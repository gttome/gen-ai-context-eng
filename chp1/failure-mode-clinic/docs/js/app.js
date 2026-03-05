/* Failure Mode Clinic — v0.5.0 (Iteration 4) — 2026-02-27
   Static-site, mobile-first. No external dependencies.
*/
(() => {
  "use strict";

  const APP = {
    id: "failure-mode-clinic",
    name: "Failure Mode Clinic",
    version: "0.5.0",
    storage: {
      state: "fmc.state.v1",
      packs: "fmc.packs.v1",
      settings: "fmc.settings.v1",
      history: "fmc.history.v1",
    },
  };

  // ---------- utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const nowIso = () => new Date().toISOString();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const safeJsonParse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

  function esc(s) {
    return (s ?? "").toString().replace(/[&<>"']/g, ch =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[ch])
    );
  }

  function toast(msg, ms = 2200) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = setTimeout(() => el.classList.remove("show"), ms);
  }

  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  // ---------- shared features ----------
  function detectEnv() {
    const host = location.host || "";
    if (location.protocol === "file:") return "File";
    if (host.includes("localhost") || host.startsWith("127.")) return "Local";
    if (host.includes("github.io")) return "GitHub Pages";
    return "Web";
  }

  // (Regression fix) — defined and safe.
  function showEnvNotice(env) {
    if (env === "File") toast("Tip: run docs/start-server.bat (file:// can break fetch & storage).", 3400);
  }

  function loadSettings() {
    const s = safeJsonParse(localStorage.getItem(APP.storage.settings) || "", null);
    if (s && typeof s === "object") return s;
    return { theme: "dark" };
  }

  function saveSettings(s) {
    localStorage.setItem(APP.storage.settings, JSON.stringify(s));
  }

  function setTheme(theme) {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }

  function initSharedFeatures() {
    const env = detectEnv();
    const pillEnv = $("#pillEnv");
    const pillVersion = $("#pillVersion");
    if (pillEnv) pillEnv.textContent = env;
    if (pillVersion) pillVersion.textContent = `v${APP.version}`;
    showEnvNotice(env);

    const s = loadSettings();
    setTheme(s.theme);

    const btnTheme = $("#btnTheme");
    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        const x = loadSettings();
        x.theme = (x.theme === "light") ? "dark" : "light";
        saveSettings(x);
        setTheme(x.theme);
      });
    }

    $$(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.getAttribute("data-nav")));
    });
  }

  // ---------- modal ----------
  function closeModal() {
    const root = $("#modalRoot");
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
    root.onclick = null;
  }

  function openModal({ title, body, footer, onAction }) {
    const root = $("#modalRoot");
    if (!root) return;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    root.innerHTML = `
      <div class="modal-backdrop" data-action="close" tabindex="-1"></div>
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title || "Dialog")}">
        <div class="modal-header">
          <div class="modal-title">${esc(title || "")}</div>
          <button class="btn ghost" type="button" data-action="close" aria-label="Close">✕</button>
        </div>
        <div class="hr"></div>
        <div class="modal-body">${body || ""}</div>
        <div class="hr"></div>
        <div class="modal-footer" style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">
          ${footer || `<button class="btn primary" data-action="close">Close</button>`}
        </div>
      </div>
    `;

    root.onclick = (e) => {
      const act = e.target?.getAttribute?.("data-action");
      if (!act) return;
      if (act === "close") return closeModal();
      if (typeof onAction === "function") onAction(act, e);
    };

    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey, { once: true });

    setTimeout(() => (root.querySelector("[data-action='close']") || root.querySelector("button"))?.focus?.(), 0);
  }

  // ---------- storage ----------
  function defaultState() {
    return {
      view: "clinic",
      activePackId: "core",
      activeCaseId: null,
      stats: { attempts: 0, totalScore: 0, diagnosisCompletions: 0, verifiedAttempts: 0, verifiedPasses: 0 },
      drill: null,
      __cases: {}, // per-session case state
    };
  }

  // (Regression fix) — defined and safe.
  function loadState() {
    const raw = localStorage.getItem(APP.storage.state);
    const s = safeJsonParse(raw || "", null);
    if (!s || typeof s !== "object") return defaultState();

    const merged = Object.assign(defaultState(), s);
    merged.stats = Object.assign(defaultState().stats, s.stats || {});
    // migration: older builds used stats.completions as "diagnosis completions"
    if (typeof merged.stats.diagnosisCompletions !== "number" && typeof merged.stats.completions === "number") {
      merged.stats.diagnosisCompletions = merged.stats.completions;
    }
    if (typeof merged.stats.verifiedAttempts !== "number") merged.stats.verifiedAttempts = 0;
    if (typeof merged.stats.verifiedPasses !== "number") merged.stats.verifiedPasses = 0;
    merged.__cases = s.__cases || {};

    return merged;
  }

  function saveState(s) {
    localStorage.setItem(APP.storage.state, JSON.stringify(s));
  }

  
  // ---------- attempt history (Iteration 4) ----------
  function defaultHistory() {
    return { schemaVersion: 1, attempts: [] };
  }

  function loadHistory() {
    const raw = localStorage.getItem(APP.storage.history);
    const h = safeJsonParse(raw || "", null);
    if (!h || typeof h !== "object" || !Array.isArray(h.attempts)) return defaultHistory();
    return h;
  }

  function saveHistory(h) {
    localStorage.setItem(APP.storage.history, JSON.stringify(h));
  }

  function truncateText(s, maxLen = 8000) {
    const t = (s ?? "").toString();
    if (t.length <= maxLen) return t;
    return t.slice(0, maxLen) + "\n…[truncated]";
  }

  function deriveRubricItems(expected) {
    const t = (expected || "").trim();
    let parts = [];

    if (!t) return [{ id: uid("rb"), text: "Meets expected behavior", checked: false }];

    if (t.includes("+")) {
      parts = t.split("+").map(x => x.trim()).filter(Boolean);
    } else if (t.includes("\n")) {
      parts = t.split(/\n+/).map(x => x.replace(/^[-•*\s]+/, "").trim()).filter(Boolean);
    } else {
      parts = t.split(/[.;]+/).map(x => x.trim()).filter(Boolean);
    }

    // de-dup + cap
    const uniq = [];
    const seen = new Set();
    for (const p of parts) {
      const key = p.toLowerCase();
      if (!p || seen.has(key)) continue;
      seen.add(key);
      uniq.push(p);
      if (uniq.length >= 6) break;
    }
    return uniq.length
      ? uniq.map(x => ({ id: uid("rb"), text: x, checked: false }))
      : [{ id: uid("rb"), text: "Meets expected behavior", checked: false }];
  }

  function pushAttempt(attempt) {
    const h = loadHistory();
    h.attempts = Array.isArray(h.attempts) ? h.attempts : [];
    h.attempts.unshift(attempt);
    h.attempts = h.attempts.slice(0, 50);
    saveHistory(h);
    return attempt.id;
  }

  function findAttempt(attemptId) {
    const h = loadHistory();
    return (h.attempts || []).find(a => a.id === attemptId) || null;
  }

  function updateAttempt(attemptId, patch) {
    const h = loadHistory();
    const idx = (h.attempts || []).findIndex(a => a.id === attemptId);
    if (idx === -1) return null;
    h.attempts[idx] = Object.assign({}, h.attempts[idx], patch);
    saveHistory(h);
    return h.attempts[idx];
  }

  function latestAttemptForCase(caseId) {
    const h = loadHistory();
    return (h.attempts || []).find(a => a.caseId === caseId) || null;
  }

  function ensureActiveAttempt(state, c, st) {
    if (st.activeAttemptId) {
      const existing = findAttempt(st.activeAttemptId);
      if (existing) return existing;
    }
    const attempt = {
      id: uid("att"),
      startedAt: nowIso(),
      caseId: c.id,
      caseTitle: c.title,
      packId: state.activePackId || "core",
      diagnosis: {
        symptom: st.choices?.symptom || "",
        cause: st.choices?.cause || "",
        fix: st.choices?.fix || "",
        score: st.score || 0,
        scored: !!st.scored,
      },
      badOutput: truncateText(c.badOutput || "", 4000),
      expected: truncateText(c.expected || "", 2000),
      baselineContext: truncateText(c.baselineContext || "", 9000),
      fixedContext: st.applied ? truncateText(st.fixedText || "", 9000) : "",
      verification: null,
    };
    st.activeAttemptId = attempt.id;
    pushAttempt(attempt);
    saveState(state);
    return attempt;
  }
function defaultUserPacks() {
    return {
      schemaVersion: 1,
      packs: [{
        packId: "my",
        name: "My Pack",
        version: "0.1.0",
        author: "You",
        description: "Your custom cases (stored locally in this browser).",
        cases: [],
      }],
    };
  }

  async function loadBuiltinPacks() {
    const res = await fetch("./data/builtin_packs.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load built-in packs");
    return await res.json();
  }

  function loadUserPacks() {
    const raw = localStorage.getItem(APP.storage.packs);
    const obj = safeJsonParse(raw || "", null);
    if (obj && typeof obj === "object" && Array.isArray(obj.packs)) return obj;
    return defaultUserPacks();
  }

  function saveUserPacks(p) {
    localStorage.setItem(APP.storage.packs, JSON.stringify(p));
  }

  // ---------- model ----------
  let MODEL = { builtin: null, user: null };

  function normalizeCase(c) {
    const out = { ...c };
    out.id = out.id || uid("case");
    out.title = (out.title || "Untitled").trim();
    out.symptom = (out.symptom || "Uncategorized").trim();
    out.cause = (out.cause || "Unspecified cause").trim();
    out.fix = (out.fix || "Unspecified fix").trim();
    out.difficulty = Number.isFinite(+out.difficulty) ? +out.difficulty : 1;
    out.tags = Array.isArray(out.tags) ? out.tags : [];
    out.badOutput = out.badOutput || "";
    out.expected = out.expected || "";
    out.baselineContext = out.baselineContext || "";
    out.stethoscope = Array.isArray(out.stethoscope) ? out.stethoscope : [];
    out.explanation = (out.explanation && typeof out.explanation === "object") ? out.explanation : {};
    return out;
  }

  function getAllPacks() {
    const packs = [];
    (MODEL.builtin?.packs || []).forEach(p => packs.push(p));
    (MODEL.user?.packs || []).forEach(p => packs.push(p));
    return packs;
  }

  function findPack(packId) {
    return getAllPacks().find(p => p.packId === packId) || null;
  }

  function listCasesInPack(packId) {
    const p = findPack(packId);
    if (!p) return [];
    return (p.cases || []).map(normalizeCase);
  }

  function allCases() {
    const out = [];
    getAllPacks().forEach(p => (p.cases || []).forEach(c => out.push(normalizeCase(c))));
    return out;
  }

  function upsertUserCase(packId, c) {
    const user = MODEL.user;
    const p = user.packs.find(x => x.packId === packId);
    if (!p) throw new Error("User pack not found");
    p.cases = Array.isArray(p.cases) ? p.cases : [];
    const nc = normalizeCase(c);
    const idx = p.cases.findIndex(x => x.id === nc.id);
    if (idx === -1) p.cases.unshift(nc);
    else p.cases[idx] = nc;
    saveUserPacks(user);
    return nc;
  }

  function deleteUserCase(packId, caseId) {
    const user = MODEL.user;
    const p = user.packs.find(x => x.packId === packId);
    if (!p) return false;
    const before = p.cases.length;
    p.cases = p.cases.filter(c => c.id !== caseId);
    saveUserPacks(user);
    return p.cases.length !== before;
  }

  // ---------- parsing (hardening) ----------
  const BLOCK_KEYS = [
    { key:"system",    label:"System / Role",         synonyms:["system","role","persona","you are","acting as"] },
    { key:"rules",     label:"Rules / Instructions",  synonyms:["rules","instructions","constraints","must","do not","non-negotiable"] },
    { key:"grounding", label:"Grounding / Sources",   synonyms:["grounding","sources","cite","evidence","provided","use only"] },
    { key:"memory",    label:"Memory / Preferences",  synonyms:["memory","preferences","remember","going forward","pinned facts"] },
    { key:"format",    label:"Output Format",         synonyms:["format","output","schema","json","markdown","structure"] },
    { key:"request",   label:"Task / Request",        synonyms:["task","request","goal","deliverable","do"] },
  ];

  function labelForKey(k){
    const m = {
      system:"System / Role",
      rules:"Rules / Instructions",
      grounding:"Grounding / Sources",
      memory:"Memory / Preferences",
      format:"Output Format",
      request:"Task / Request",
      unlabeled:"Unlabeled",
    };
    return m[k] || k;
  }

  function classifyHeader(h){
    const up = (h || "").trim().toLowerCase();
    for (const bk of BLOCK_KEYS){
      for (const syn of bk.synonyms){
        if (up === syn) return bk.key;
        if (up.includes(syn) && syn.length >= 4) return bk.key;
      }
    }
    if (["system","role"].includes(up)) return "system";
    if (["rules","instructions","constraints"].includes(up)) return "rules";
    if (["grounding","sources","citations","evidence"].includes(up)) return "grounding";
    if (["memory","preferences"].includes(up)) return "memory";
    if (["format","output format","schema"].includes(up)) return "format";
    if (["task","request","goal"].includes(up)) return "request";
    return null;
  }

  function heuristicSplit(text){
    const t = (text || "").trim();
    if (!t) return [];
    const roleMatch = t.match(/^(You are[\s\S]*?)(\n\n|$)/i);
    if (roleMatch){
      const rest = t.slice(roleMatch[1].length).trim();
      const out = [{ key:"system", header:"System / Role", body: roleMatch[1].trim() }];
      if (rest) out.push({ key:"rules", header:"Rules / Instructions", body: rest });
      return out;
    }
    return [{ key:"rules", header:"Rules / Instructions", body: t }];
  }

  function parseContextBlocks(text){
    const t = (text || "").replace(/\r\n/g, "\n");
    const lines = t.split("\n");
    const headerRe = /^(\s*)(###|##|#)?\s*([A-Za-z][A-Za-z0-9 _\-\/]+?)\s*(:)?\s*$/;

    const blocks = [];
    let cur = null;

    const pushCur = () => {
      if (!cur) return;
      cur.body = (cur.bodyLines.join("\n")).trim();
      delete cur.bodyLines;
      blocks.push(cur);
      cur = null;
    };

    for (let i=0; i<lines.length; i++){
      const line = lines[i];
      const m = line.match(headerRe);
      const isHeader = !!m && (m[3].length <= 46) && (m[1].length <= 4) &&
        (m[2] || m[4] || ["SYSTEM","ROLE","RULES","INSTRUCTIONS","GROUNDING","SOURCES","FORMAT","OUTPUT","REQUEST","TASK","MEMORY","PREFERENCES"].includes(m[3].trim().toUpperCase()));

      if (isHeader){
        const rawH = m[3].trim();
        const key = classifyHeader(rawH);
        if (key){
          pushCur();
          cur = { key, header: rawH, bodyLines: [] };
          continue;
        }
      }

      if (!cur){
        const inline = line.match(/^\s*([A-Za-z][A-Za-z0-9 _\-\/]+)\s*:\s*(.+)$/);
        if (inline){
          const key = classifyHeader(inline[1].trim());
          if (key){
            pushCur();
            cur = { key, header: inline[1].trim(), bodyLines: [inline[2]] };
            continue;
          }
        }
        cur = { key:"unlabeled", header:"Unlabeled", bodyLines: [line] };
        continue;
      } else {
        cur.bodyLines.push(line);
      }
    }
    pushCur();

    if (blocks.length === 1 && blocks[0].key === "unlabeled") return heuristicSplit(blocks[0].body);

    // merge tiny unlabeled fragments into previous block
    const merged = [];
    for (const b of blocks){
      if (b.key === "unlabeled" && (b.body || "").trim().length < 80 && merged.length){
        merged[merged.length-1].body = (merged[merged.length-1].body + "\n" + (b.body || "")).trim();
      } else merged.push(b);
    }
    return merged.filter(b => (b.body || "").trim().length > 0);
  }

  function blocksToText(blocks){
    return (blocks || []).map(b => `# ${labelForKey(b.key)}\n${(b.body || "").trim()}`).join("\n\n").trim();
  }

  // ---------- fix templates (heuristic) ----------
  const FIX = {
    grounding: `- Use only information provided by the user or linked sources.
- If unsure or missing evidence, say so and ask for the missing input.
- Do not invent policies, dates, statistics, or URLs.
- Provide citations only when sources are provided.`,
    format_json: `Return ONLY valid JSON. No surrounding commentary.
Example:
{
  "items": ["A","B"]
}`,
    brevity: `Keep the answer brief. Respect the user's requested length.
Hard limit: 1–2 sentences unless the user asks for more.`,
    clarify: `If the request is ambiguous, ask up to 2 clarifying questions before answering.
If you must proceed, state your assumptions explicitly.`,
    consistency: `Maintain consistency with prior stated preferences and constraints.
If a new instruction conflicts, ask which one to follow.`,
    acceptance: `Before final output, re-check requirements against acceptance criteria
(format, tone, static constraints, etc.).`,
    memory: `Maintain a “Pinned Facts + Decisions” memory block.
Update it each turn: confirmed facts, decisions, and open questions.`,
    prune: `Prune irrelevant context. Keep only what the model needs to answer.
Summarize long material and retrieve only relevant excerpts.`,
  };

  function suggestFixBlocks(caseObj){
    const blocks = parseContextBlocks(caseObj.baselineContext || "");
    const out = [...blocks];

    const s = (caseObj.symptom || "").toLowerCase();
    const c = (caseObj.cause || "").toLowerCase();
    const f = (caseObj.fix || "").toLowerCase();
    const all = `${s} ${c} ${f}`;

    const ensure = (key, body) => {
      const idx = out.findIndex(b => b.key === key);
      if (idx === -1) out.push({ key, header: labelForKey(key), body });
      else out[idx].body = (out[idx].body + "\n" + body).trim();
    };

    if (all.includes("ground") || all.includes("halluc") || all.includes("source")) ensure("grounding", FIX.grounding);
    if (all.includes("json") || all.includes("schema") || all.includes("format")) ensure("format", FIX.format_json);
    if (all.includes("brief") || all.includes("concise") || all.includes("brev")) ensure("rules", FIX.brevity);
    if (all.includes("clarif") || all.includes("ambig")) ensure("rules", FIX.clarify);
    if (all.includes("consisten")) ensure("rules", FIX.consistency);
    if (all.includes("acceptance") || (caseObj.difficulty || 1) >= 3) ensure("rules", FIX.acceptance);
    if (all.includes("memory") || all.includes("pinned facts") || all.includes("forgets")) ensure("memory", FIX.memory);
    if (all.includes("prune") || all.includes("overload") || all.includes("irrelevant")) ensure("rules", FIX.prune);

    // Ensure at least one explicit rules block exists
    if (!out.some(b => b.key === "rules")){
      out.push({
        key: "rules",
        header: "Rules / Instructions",
        body: `- Follow the user's instructions precisely.
- If constraints conflict, ask for guidance.
- Provide the requested format and tone.`,
      });
    }

    const order = ["system","rules","grounding","memory","format","request","unlabeled"];
    out.sort((a,b) => order.indexOf(a.key) - order.indexOf(b.key));
    return out;
  }

  // ---------- diff (Myers, line-based) ----------
  function diffLines(aText, bText){
    const a = (aText || "").replace(/\r\n/g,"\n").split("\n");
    const b = (bText || "").replace(/\r\n/g,"\n").split("\n");
    const n = a.length, m = b.length;
    const max = n + m;

    const v = new Map();
    v.set(1, 0);
    const trace = [];

    const getV = (k) => (v.has(k) ? v.get(k) : -Infinity);
    const setV = (k, val) => v.set(k, val);

    for (let d=0; d<=max; d++){
      trace.push(new Map(v));
      for (let k=-d; k<=d; k+=2){
        let x;
        if (k === -d || (k !== d && getV(k-1) < getV(k+1))) x = getV(k+1);
        else x = getV(k-1) + 1;

        let y = x - k;
        while (x < n && y < m && a[x] === b[y]) { x++; y++; }
        setV(k, x);

        if (x >= n && y >= m) return backtrack(trace, a, b, n, m);
      }
    }
    return [];
  }

  function backtrack(trace, a, b, n, m){
    let x = n, y = m;
    const edits = [];
    for (let d = trace.length - 1; d >= 0; d--){
      const v = trace[d];
      const k = x - y;
      let prevK;
      if (k === -d || (k !== d && (v.get(k-1) ?? -Infinity) < (v.get(k+1) ?? -Infinity))) prevK = k + 1;
      else prevK = k - 1;

      const prevX = v.get(prevK) ?? 0;
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY){
        edits.push({ type:"ctx", line: a[x-1] });
        x--; y--;
      }
      if (d === 0) break;

      if (x === prevX){
        edits.push({ type:"add", line: b[y-1] });
        y--;
      } else {
        edits.push({ type:"del", line: a[x-1] });
        x--;
      }
    }
    return edits.reverse();
  }

  // ---------- router ----------
  function setActiveView(state, view){
    state.view = view;
    saveState(state);
    $$(".view").forEach(v => v.classList.remove("is-active"));
    $(`[data-view="${view}"]`)?.classList.add("is-active");
    $$(".nav-item").forEach(btn => btn.classList.toggle("is-active", btn.getAttribute("data-nav") === view));
  }

  function navigate(view){
    const state = loadState();
    setActiveView(state, view);
    renderAll(state);
  }

  // ---------- render helpers ----------
  function unique(arr){
    const out = [];
    const seen = new Set();
    for (const v of arr){
      const s = (v || "").toString().trim();
      if (!s || seen.has(s)) continue;
      seen.add(s); out.push(s);
    }
    return out.sort((a,b)=>a.localeCompare(b));
  }

  function renderBlocksTable(blocks){
    if (!blocks || !blocks.length) return `<div class="small muted">No blocks detected.</div>`;
    const rows = blocks.map(b => `
      <tr>
        <td style="width:180px;"><b>${esc(labelForKey(b.key))}</b></td>
        <td><div style="white-space:pre-wrap;">${esc((b.body || "").trim())}</div></td>
      </tr>
    `).join("");
    return `
      <table class="table" role="table">
        <thead><tr><th>Block</th><th>Content</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function escapeRegExp(str){ return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function hintForPhrase(phrase, c){
    const p = (phrase || "").toLowerCase();
    if (p.includes("yesterday") || p.includes("report") || p.includes("updated")) return "Time-sensitive claim: require sources or admit uncertainty.";
    if (p.includes("unlimited") || p.includes("always") || p.includes("never")) return "Absolutist claim: check policy text or qualify.";
    if (p.includes("general") || p.includes("tips")) return "Vagueness marker: needs grounding facts + example.";
    return `Signal supporting symptom: ${c.symptom}`;
  }

  function renderHighlightedBadOutput(c){
    const text = c.badOutput || "";
    const phrases = (c.stethoscope || []).filter(Boolean).sort((a,b)=>b.length-a.length);
    if (!phrases.length) return `<div style="white-space:pre-wrap;">${esc(text)}</div>`;

    let out = esc(text);
    for (const p of phrases){
      const safeP = esc(p);
      const re = new RegExp(escapeRegExp(safeP), "g");
      out = out.replace(re,
        `<span class="highlight" tabindex="0" role="button" data-phrase="${safeP}" data-hint="${esc(hintForPhrase(p, c))}">${safeP}</span>`
      );
    }
    return `<div style="white-space:pre-wrap; line-height:1.45;">${out}</div>`;
  }

  function renderDiffSection(beforeText, afterText){
    const edits = diffLines(beforeText, afterText);
    const showSbs = window.matchMedia("(min-width: 920px)").matches;

    const list = `
      <div class="diff" aria-label="Line diff">
        ${edits.map(e => `<div class="diff-line ${e.type}">${esc((e.type==="add"?"+ ":"- ")+e.line)}</div>`).join("")}
      </div>
    `;

    const sbs = showSbs ? `
      <div class="diff-sbs" style="margin-top:10px;">
        <div>
          <div class="small">Baseline</div>
          <div class="diff" style="margin-top:8px;">
            ${(beforeText || "").split(/\r\n|\n/).map(l => `<div class="diff-line ctx">${esc(l)}</div>`).join("")}
          </div>
        </div>
        <div>
          <div class="small">Fixed</div>
          <div class="diff" style="margin-top:8px;">
            ${(afterText || "").split(/\r\n|\n/).map(l => `<div class="diff-line ctx">${esc(l)}</div>`).join("")}
          </div>
        </div>
      </div>
    ` : "";

    return `
      <div class="hr"></div>
      <div class="h2">Diff</div>
      <div class="small">Green = additions, red = deletions. Wide screens also show side-by-side.</div>
      <div style="margin-top:10px;">${list}</div>
      ${sbs}
    `;
  }

  function downloadJson(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- clinic session state ----------
  function getCaseSessionState(state, caseId){
    state.__cases = state.__cases || {};
    if (!state.__cases[caseId]){
      state.__cases[caseId] = {
        choices: { symptom:"", cause:"", fix:"" },
        scored: false, score: 0,
        applied: false, fixedText: ""
      };
    }
    return state.__cases[caseId];
  }

  function getActiveCase(state){
    if (!state.activeCaseId) return null;
    return allCases().find(c => c.id === state.activeCaseId) || null;
  }

  // ---------- drill ----------
  function openDrillSetup(state){
    const all = allCases();
    const symptoms = unique(all.map(c => c.symptom));

    openModal({
      title: "Drill mode",
      body: `
        <div class="small">Practice triage quickly (random rounds + instant feedback).</div>
        <div class="hr"></div>
        <div class="field">
          <div class="label">Filter by symptom (optional)</div>
          <select id="drillSym">
            <option value="">Any symptom</option>
            ${symptoms.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
          </select>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="col">
            <div class="label">Rounds</div>
            <select id="drillRounds">
              <option value="3">3</option>
              <option value="5" selected>5</option>
              <option value="8">8</option>
            </select>
          </div>
          <div class="col">
            <div class="label">Auto-advance after scoring</div>
            <select id="drillAdv">
              <option value="yes" selected>Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      `,
      footer: `
        <button class="btn" data-action="close">Cancel</button>
        <button class="btn primary" id="btnStartDrill" type="button">Start</button>
      `
    });

    setTimeout(() => {
      $("#btnStartDrill")?.addEventListener("click", () => {
        const sym = $("#drillSym").value;
        const rounds = parseInt($("#drillRounds").value, 10) || 5;
        const adv = $("#drillAdv").value === "yes";
        closeModal();
        startDrill(state, { symptom: sym, rounds, autoAdvance: adv });
      });
    }, 0);
  }

  function startDrill(state, opts){
    const pool = allCases().filter(c => !opts.symptom || c.symptom === opts.symptom);
    if (!pool.length) return toast("No cases match that filter.", 2200);
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(opts.rounds, shuffled.length)).map(c => c.id);

    state.drill = { startedAt: nowIso(), rounds: picks.length, autoAdvance: !!opts.autoAdvance, ids: picks, roundIndex: 0 };
    state.activeCaseId = picks[0];
    saveState(state);
    navigate("clinic");
    toast("Drill started.", 1600);
  }

  function advanceDrill(state){
    if (!state.drill || !state.drill.autoAdvance) return;
    const next = state.drill.roundIndex + 1;
    if (next >= state.drill.rounds){
      openModal({
        title:"Drill complete",
        body:`<div class="small">You finished ${state.drill.rounds} rounds.</div>`,
        footer:`<button class="btn primary" data-action="close">Close</button>`
      });
      state.drill = null; saveState(state); renderAll(state);
      return;
    }
    state.drill.roundIndex = next;
    state.activeCaseId = state.drill.ids[next];
    saveState(state);
    renderAll(state);
    toast(`Round ${next+1} / ${state.drill.rounds}`, 1300);
  }

  function endDrill(state){
    state.drill = null; saveState(state); renderAll(state);
    toast("Drill ended.", 1400);
  }

  // ---------- wizard ----------
  function suggestWizardClassification(badOutput, baselineContext){
    const out = (badOutput || "").toLowerCase();
    const ctx = (baselineContext || "").toLowerCase();
    const blocks = parseContextBlocks(baselineContext || "");
    const has = new Set(blocks.map(b => b.key));

    if (/secret|api key|private key|password/.test(out)) {
      return { symptom:"Security issue", cause:"Missing no-secrets rule", fix:"Add secret redaction + safe handling guidance" };
    }
    if (/\bjson\b|\bschema\b/.test(out) || (/json/.test(ctx) && !has.has("format"))) {
      return { symptom:"Formatting mismatch", cause:"Missing explicit output schema + examples", fix:"Add strict format contract + example" };
    }
    if ((/yesterday|today|202\d|according to|report/.test(out)) && !has.has("grounding")) {
      return { symptom:"Wrong facts / hallucination", cause:"No reliable reference content; ambiguous question", fix:"Add approved sources; require use only provided sources; ask a clarifying question." };
    }
    if (/general tips|might help|best practices/.test(out)) {
      return { symptom:"Generic answer", cause:"Missing task-specific facts or examples", fix:"Add grounding excerpts; add 1 example; tighten the task statement." };
    }
    return { symptom:"Inconsistent structure", cause:"No schema or format requirement", fix:"Add an explicit format (headings, checklist, fields)." };
  }

  function openWizard(){
    const w = {
      step: 1,
      data: { title:"", badOutput:"", baselineContext:"", expected:"", symptom:"", cause:"", fix:"", difficulty:2, stethoscope:"" },
    };

    function stepsHtml(){
      const names = {1:"Inputs",2:"Classify",3:"Parse blocks",4:"Save"};
      return [1,2,3,4].map(n => {
        const cls = (n===w.step) ? "step is-active" : (n<w.step ? "step is-done" : "step");
        return `<span class="${cls}">${n} · ${names[n]}</span>`;
      }).join("");
    }

    function pullInputs(){
      if (w.step === 1){
        w.data.title = $("#wTitle")?.value || w.data.title;
        w.data.badOutput = $("#wBad")?.value || w.data.badOutput;
        w.data.baselineContext = $("#wContext")?.value || w.data.baselineContext;
        w.data.expected = $("#wExpected")?.value || w.data.expected;
      }
      if (w.step === 2){
        w.data.symptom = $("#wSymptom")?.value || w.data.symptom;
        w.data.cause = $("#wCause")?.value || w.data.cause;
        w.data.fix = $("#wFix")?.value || w.data.fix;
        w.data.difficulty = parseInt($("#wDiff")?.value || w.data.difficulty, 10) || 2;
        w.data.stethoscope = $("#wStetho")?.value || w.data.stethoscope;
      }
    }

    function validateStep(){
      const d = w.data;
      if (w.step === 1){
        if (!d.title.trim()) return toast("Title is required.", 2200), false;
        if (!d.badOutput.trim()) return toast("Bad output is required.", 2200), false;
        if (!d.baselineContext.trim()) return toast("Baseline context is required.", 2200), false;
      }
      if (w.step === 2){
        if (!d.symptom) return toast("Select a symptom.", 2200), false;
        if (!d.cause) return toast("Select a cause.", 2200), false;
        if (!d.fix) return toast("Select a fix.", 2200), false;
      }
      return true;
    }

    function render(){
      const d = w.data;
      const all = allCases();
      const symptomOptions = unique(all.map(x => x.symptom));
      const causeOptions = unique(all.map(x => x.cause));
      const fixOptions = unique(all.map(x => x.fix));

      let body = "";
      if (w.step === 1){
        body = `
          <div class="stepper">${stepsHtml()}</div>
          <div class="hr"></div>
          <div class="small">Paste real “bad output” and the baseline context/prompt that produced it.</div>
          <div class="field"><div class="label">Case title</div><input id="wTitle" class="input" value="${esc(d.title)}" /></div>
          <div class="field"><div class="label">Bad output</div><textarea id="wBad">${esc(d.badOutput)}</textarea></div>
          <div class="field"><div class="label">Baseline context / prompt</div><textarea id="wContext">${esc(d.baselineContext)}</textarea></div>
          <div class="field"><div class="label">Expected behavior (optional)</div><textarea id="wExpected">${esc(d.expected)}</textarea></div>
        `;
      }

      if (w.step === 2){
        const sug = suggestWizardClassification(d.badOutput, d.baselineContext);
        body = `
          <div class="stepper">${stepsHtml()}</div>
          <div class="hr"></div>
          <div class="small">Classify the failure mode. Suggestions are heuristic — override freely.</div>

          <div class="card" style="padding:12px; border-radius:14px; background:rgba(255,255,255,0.02);">
            <div class="small muted">Suggestions</div>
            <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
              <span class="badge">${esc(sug.symptom)}</span>
              <span class="badge">${esc(sug.cause)}</span>
              <span class="badge">${esc(sug.fix)}</span>
            </div>
            <div class="small muted" style="margin-top:8px;">Based on keywords and missing context blocks.</div>
          </div>

          <div class="row" style="margin-top:10px;">
            <div class="col">
              <div class="label">Symptom</div>
              <select id="wSymptom">
                <option value="">Select…</option>
                ${symptomOptions.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("")}
              </select>
            </div>
            <div class="col">
              <div class="label">Cause</div>
              <select id="wCause">
                <option value="">Select…</option>
                ${causeOptions.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("")}
              </select>
            </div>
            <div class="col">
              <div class="label">Fix</div>
              <select id="wFix">
                <option value="">Select…</option>
                ${fixOptions.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="row" style="margin-top:10px;">
            <div class="col">
              <div class="label">Difficulty</div>
              <select id="wDiff">
                <option value="1">1</option>
                <option value="2" selected>2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div class="col">
              <div class="label">Stethoscope phrases (one per line)</div>
              <textarea id="wStetho" style="min-height:90px;" placeholder="3–6 phrases to highlight">${esc(d.stethoscope)}</textarea>
              <div class="small muted" style="margin-top:6px;">Include confidence markers, dates, invented URLs, etc.</div>
            </div>
          </div>

          <div class="hr"></div>
          <button class="btn" type="button" id="btnAutoFill">Apply suggestions</button>
        `;
      }

      if (w.step === 3){
        const blocks = parseContextBlocks(d.baselineContext);
        body = `
          <div class="stepper">${stepsHtml()}</div>
          <div class="hr"></div>
          <div class="small">We parsed your context into blocks. If it looks wrong, go back and edit the baseline context.</div>
          <div class="hr"></div>
          <div class="card" style="padding:12px; border-radius:14px; background:rgba(255,255,255,0.02);">
            ${renderBlocksTable(blocks)}
          </div>
        `;
      }

      if (w.step === 4){
        body = `
          <div class="stepper">${stepsHtml()}</div>
          <div class="hr"></div>
          <div class="small">Save your new case into <b>My Pack</b>.</div>
          <div class="hr"></div>
          <div class="row">
            <div class="col">
              <div class="small muted">Title</div>
              <div><b>${esc(d.title || "(untitled)")}</b></div>
              <div class="hr"></div>
              <div class="small muted">Symptom / Cause / Fix</div>
              <div class="case-meta">
                <span class="badge">${esc(d.symptom)}</span>
                <span class="badge">${esc(d.cause)}</span>
                <span class="badge">${esc(d.fix)}</span>
                <span class="badge">Diff ${esc(String(d.difficulty))}</span>
              </div>
            </div>
            <div class="col">
              <div class="small muted">Next</div>
              <ul>
                <li>Case appears in <b>Builder</b> and <b>Library → My Pack</b>.</li>
                <li>Load it in <b>Clinic</b> to practice diagnosis and generate a fixed context diff.</li>
              </ul>
            </div>
          </div>
        `;
      }

      openModal({
        title: "Case Wizard",
        body,
        footer: `
          <button class="btn" data-action="close">Close</button>
          <button class="btn" id="btnPrev" type="button" ${w.step===1?"disabled":""}>Back</button>
          <button class="btn primary" id="btnNext" type="button">${w.step===4?"Save case":"Next"}</button>
        `
      });

      setTimeout(() => {
        $("#btnPrev")?.addEventListener("click", () => {
          pullInputs();
          w.step = clamp(w.step - 1, 1, 4);
          render();
        });

        $("#btnNext")?.addEventListener("click", () => {
          pullInputs();
          if (!validateStep()) return;
          if (w.step === 4){
            const newCase = {
              id: uid("case"),
              title: w.data.title.trim(),
              symptom: w.data.symptom.trim(),
              cause: w.data.cause.trim(),
              fix: w.data.fix.trim(),
              difficulty: w.data.difficulty,
              tags: ["wizard"],
              badOutput: w.data.badOutput,
              expected: w.data.expected,
              baselineContext: w.data.baselineContext,
              stethoscope: (w.data.stethoscope || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean),
              explanation: { symptomWhy:"", causeWhy:"", fixWhy:"" }
            };
            upsertUserCase("my", newCase);
            closeModal();
            toast("Saved to My Pack.", 1600);
            renderAll(loadState());
            return;
          }
          w.step = clamp(w.step + 1, 1, 4);
          render();
        });

        $("#btnAutoFill")?.addEventListener("click", () => {
          const s = suggestWizardClassification(w.data.badOutput, w.data.baselineContext);
          $("#wSymptom").value = s.symptom;
          $("#wCause").value = s.cause;
          $("#wFix").value = s.fix;
          toast("Applied suggestions.", 1400);
        });
      }, 0);

      if (w.step === 2){
        setTimeout(() => {
          if (w.data.symptom) $("#wSymptom").value = w.data.symptom;
          if (w.data.cause) $("#wCause").value = w.data.cause;
          if (w.data.fix) $("#wFix").value = w.data.fix;
          $("#wDiff").value = String(w.data.difficulty || 2);
        }, 0);
      }
    }

    render();
  }

  // ---------- pack manager ----------
  function openPackManager(state){
    const user = MODEL.user;

    const rows = user.packs.map(p => `
      <tr>
        <td><b>${esc(p.name)}</b><div class="small muted">${esc(p.packId)}</div></td>
        <td class="small">${esc(p.version || "")}</td>
        <td class="small">${(p.cases || []).length}</td>
        <td style="text-align:right;">
          <button class="btn" type="button" data-action="renamePack" data-id="${esc(p.packId)}">Rename</button>
          ${p.packId==="my" ? "" : `<button class="btn danger" type="button" data-action="deletePack" data-id="${esc(p.packId)}">Delete</button>`}
        </td>
      </tr>
    `).join("");

    openModal({
      title: "Pack Manager",
      body: `
        <div class="small">Built-in packs are read-only. User packs are stored locally in this browser.</div>
        <div class="hr"></div>
        <table class="table">
          <thead><tr><th>User pack</th><th>Ver</th><th>Cases</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="hr"></div>
        <div class="row">
          <div class="col">
            <div class="label">New pack name</div>
            <input id="newPackName" class="input" placeholder="e.g., Hallucination Pack" />
          </div>
          <div class="col">
            <div class="label">New pack id</div>
            <input id="newPackId" class="input" placeholder="e.g., hallucinations" />
            <div class="small muted" style="margin-top:6px;">Lowercase letters/numbers/_/- recommended.</div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn" data-action="close">Close</button>
        <button class="btn primary" id="btnCreatePack" type="button">Create pack</button>
      `,
      onAction: (act, e) => {
        const id = e.target?.getAttribute?.("data-id");
        if (act === "renamePack"){
          const p = user.packs.find(x => x.packId === id);
          if (!p) return;
          openModal({
            title: "Rename pack",
            body: `
              <div class="small muted">PackId: <code>${esc(p.packId)}</code></div>
              <div class="field"><div class="label">New name</div><input id="renamePackName" class="input" value="${esc(p.name)}" /></div>
            `,
            footer: `
              <button class="btn" data-action="close">Cancel</button>
              <button class="btn primary" id="btnDoRename" type="button">Save</button>
            `
          });
          setTimeout(() => {
            $("#btnDoRename")?.addEventListener("click", () => {
              p.name = ($("#renamePackName").value || "").trim() || p.name;
              saveUserPacks(user);
              closeModal();
              toast("Renamed.", 1400);
              renderAll(loadState());
            });
          }, 0);
        }

        if (act === "deletePack"){
          const p = user.packs.find(x => x.packId === id);
          if (!p) return;
          openModal({
            title: "Delete pack?",
            body: `<div>Delete <b>${esc(p.name)}</b> and all its cases? (local to this browser)</div>`,
            footer: `
              <button class="btn" data-action="close">Cancel</button>
              <button class="btn danger" id="btnDoDelPack" type="button">Delete</button>
            `
          });
          setTimeout(() => {
            $("#btnDoDelPack")?.addEventListener("click", () => {
              user.packs = user.packs.filter(x => x.packId !== id);
              if (state.activePackId === id) state.activePackId = "core";
              saveUserPacks(user);
              saveState(state);
              closeModal();
              toast("Pack deleted.", 1600);
              renderAll(loadState());
            });
          }, 0);
        }
      }
    });

    setTimeout(() => {
      $("#btnCreatePack")?.addEventListener("click", () => {
        const name = ($("#newPackName").value || "").trim();
        let id = ($("#newPackId").value || "").trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
        if (!name || !id) return toast("Provide both name and id.", 2200);
        if (MODEL.builtin.packs.some(p => p.packId === id) || user.packs.some(p => p.packId === id)) {
          return toast("That pack id already exists.", 2200);
        }
        user.packs.push({ packId:id, name, version:"0.1.0", author:"You", description:"", cases:[] });
        saveUserPacks(user);
        closeModal();
        toast("Pack created.", 1600);
        renderAll(loadState());
      });
    }, 0);
  }

  // ---------- import/export packs ----------
  function exportCurrentPack(state){
    const p = findPack(state.activePackId);
    if (!p) return;
    downloadJson({ schemaVersion:1, exportedAt:nowIso(), app:{id:APP.id, version:APP.version}, packs:[p] },
      `${APP.id}_pack_${p.packId}.json`);
    toast("Pack exported.", 1600);
  }

  function importPackFlow(state){
    openModal({
      title: "Import pack JSON",
      body: `
        <div class="small">Paste a pack export JSON. Packs are added to <b>User packs</b> (local only).</div>
        <div class="field"><div class="label">Pack JSON</div><textarea id="importJson"></textarea></div>
        <div class="small muted">If packId exists, it will import as <code>packId_copy</code>.</div>
      `,
      footer: `
        <button class="btn" data-action="close">Cancel</button>
        <button class="btn primary" id="btnDoImport" type="button">Import</button>
      `
    });

    setTimeout(() => {
      $("#btnDoImport")?.addEventListener("click", () => {
        const raw = $("#importJson").value || "";
        const obj = safeJsonParse(raw, null);
        if (!obj || !Array.isArray(obj.packs)) return toast("Invalid JSON (expected {packs:[...]}).", 2400);

        const user = MODEL.user;
        for (const p of obj.packs){
          const baseId = (p.packId || uid("pack")).toString();
          let newId = baseId;
          let n = 1;
          while (user.packs.some(x => x.packId === newId) || MODEL.builtin.packs.some(x => x.packId === newId)){
            newId = `${baseId}_copy${n===1?"":n}`; n++;
          }
          user.packs.push({
            packId: newId,
            name: (p.name || newId),
            version: (p.version || "0.1.0"),
            author: (p.author || "Imported"),
            description: (p.description || ""),
            cases: Array.isArray(p.cases) ? p.cases.map(normalizeCase) : [],
          });
        }
        saveUserPacks(user);
        closeModal();
        toast("Imported pack(s).", 1800);
        renderAll(loadState());
      });
    }, 0);
  }

  // ---------- reset ----------
  
  // ---------- verification + history UI (Iteration 4) ----------
  function openVerifyModal(state, c, st) {
    const attempt = ensureActiveAttempt(state, c, st);
    const prior = attempt.verification || null;

    const rubric = prior?.rubric?.length ? prior.rubric : deriveRubricItems(c.expected || "");
    const newOutput = prior?.output || "";
    const overall = prior?.overallPass ? true : false;

    openModal({
      title: "Verify fix",
      body: `
        <div class="small">Paste the improved model output after you applied the fixed context. Then mark which rubric items are satisfied.</div>
        <div class="hr"></div>

        <div class="small muted">Expected behavior</div>
        <div class="card" style="margin-top:8px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,0.02);">${esc(c.expected || "")}</div>

        <div class="field">
          <div class="label">Improved output (after applying fix)</div>
          <textarea id="verOutput" placeholder="Paste the improved output here…">${esc(newOutput)}</textarea>
        </div>

        <div class="hr"></div>
        <div class="h2">Rubric</div>
        <div class="small">Check items satisfied by the improved output.</div>

        <div style="margin-top:10px;">
          ${rubric.map(item => `
            <label style="display:flex; gap:10px; align-items:flex-start; padding:10px 10px; border:1px solid var(--border); border-radius:14px; margin-top:8px; background:rgba(255,255,255,0.02);">
              <input type="checkbox" data-rubric="${esc(item.id)}" ${item.checked ? "checked":""} style="margin-top:4px;" />
              <span>${esc(item.text)}</span>
            </label>
          `).join("")}
        </div>

        <div class="hr"></div>
        <label style="display:flex; gap:10px; align-items:center;">
          <input id="overallPass" type="checkbox" ${overall ? "checked":""} />
          <span><b>Overall pass</b> (override)</span>
        </label>

        <div class="small muted" style="margin-top:8px;">Tip: pass is automatic when ≥80% of rubric items are checked, unless you override.</div>
      `,
      footer: `
        <button class="btn" data-action="close">Cancel</button>
        <button class="btn" id="btnPreviewVerify" type="button">Preview</button>
        <button class="btn primary" id="btnSaveVerify" type="button">Save verification</button>
      `
    });

    setTimeout(() => {
      $("#btnPreviewVerify")?.addEventListener("click", () => {
        const res = computeVerificationFromModal(rubric);
        toast(res.pass ? `PASS (${res.percent}%)` : `CHECK (${res.percent}%)`, 2200);
      });

      $("#btnSaveVerify")?.addEventListener("click", () => {
        const res = computeVerificationFromModal(rubric);
        if (!res.output.trim()) return toast("Paste the improved output first.", 2200);

        const wasVerified = !!attempt.verifiedAt;
        const patch = {
          verification: res,
          verifiedAt: nowIso(),
        };
        updateAttempt(attempt.id, patch);

        // update session
        st.verify = { done: true, pass: res.pass, percent: res.percent };
        saveState(state);

        // stats: count verification exactly once per attempt
        const s = loadState();
        if (!wasVerified) {
          s.stats.verifiedAttempts += 1;
          if (res.pass) s.stats.verifiedPasses += 1;
          saveState(s);
        }

        closeModal();
        toast(res.pass ? "Verified PASS saved." : "Verification saved (needs work).", 2200);
        renderClinic(loadState());
      });
    }, 0);
  }

  function computeVerificationFromModal(rubric) {
    const output = $("#verOutput")?.value || "";
    const checks = $$("input[type='checkbox'][data-rubric]", $("#modalRoot")).map(inp => ({
      id: inp.getAttribute("data-rubric"),
      checked: !!inp.checked
    }));

    const mergedRubric = rubric.map(item => {
      const m = checks.find(x => x.id === item.id);
      return { id: item.id, text: item.text, checked: !!m?.checked };
    });

    const total = mergedRubric.length || 1;
    const checked = mergedRubric.filter(x => x.checked).length;
    const percent = Math.round((checked / total) * 100);

    const overallPass = !!$("#overallPass")?.checked;
    const pass = !!output.trim() && (overallPass || percent >= 80);

    return { output: truncateText(output, 8000), rubric: mergedRubric, percent, overallPass, pass };
  }

  function openHistoryModal(state) {
    const h = loadHistory();
    const attempts = (h.attempts || []).slice(0, 25);

    const rows = attempts.map(a => {
      const when = (a.verifiedAt || a.startedAt || "").replace("T", " ").replace("Z", "");
      const score = (a.diagnosis?.score ?? 0);
      const v = a.verification ? (a.verification.pass ? "PASS" : "CHECK") : "—";
      return `
        <tr>
          <td class="small">${esc(when.slice(0, 19))}</td>
          <td><b>${esc(a.caseTitle || a.caseId)}</b></td>
          <td class="small">${score}</td>
          <td class="small">${esc(v)}</td>
          <td style="text-align:right;">
            <button class="btn" type="button" data-action="viewAttempt" data-id="${esc(a.id)}">View</button>
          </td>
        </tr>
      `;
    }).join("");

    openModal({
      title: "Attempt history",
      body: `
        <div class="small">Recent attempts stored locally in this browser.</div>
        <div class="hr"></div>
        ${attempts.length ? `
          <table class="table">
            <thead><tr><th>When</th><th>Case</th><th>Score</th><th>Verified</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : `<div class="muted">No attempts yet. Score a case, then verify it.</div>`}
      `,
      footer: `
        <button class="btn" data-action="close">Close</button>
        <button class="btn" id="btnExportHistory" type="button">Export history</button>
        <button class="btn danger" id="btnClearHistory" type="button">Clear history</button>
      `
    });

    const root = $("#modalRoot");
    root.onclick = (e) => {
      const act = e.target?.getAttribute?.("data-action");
      const id = e.target?.getAttribute?.("data-id");
      if (act === "viewAttempt" && id) {
        const a = findAttempt(id);
        if (!a) return;
        openModal({
          title: "Attempt details",
          body: `
            <div class="small muted">Attempt</div>
            <div><b>${esc(a.caseTitle || a.caseId)}</b></div>
            <div class="hr"></div>

            <div class="small muted">Diagnosis</div>
            <div class="case-meta" style="margin-top:8px;">
              <span class="badge">${esc(a.diagnosis?.symptom || "")}</span>
              <span class="badge">${esc(a.diagnosis?.cause || "")}</span>
              <span class="badge">${esc(a.diagnosis?.fix || "")}</span>
              <span class="badge">Score ${esc(String(a.diagnosis?.score ?? 0))}</span>
            </div>

            <div class="hr"></div>
            <div class="small muted">Bad output</div>
            <div class="card" style="margin-top:8px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,0.02); white-space:pre-wrap;">${esc(a.badOutput || "")}</div>

            <div class="hr"></div>
            <div class="small muted">Improved output</div>
            <div class="card" style="margin-top:8px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,0.02); white-space:pre-wrap;">${esc(a.verification?.output || "")}</div>

            <div class="hr"></div>
            <div class="small muted">Verification</div>
            <div>${a.verification ? (a.verification.pass ? "<b>PASS</b>" : "<b>CHECK</b>") : "Not verified"}</div>
            ${a.verification?.rubric?.length ? `
              <div style="margin-top:10px;">
                ${a.verification.rubric.map(r => `
                  <div class="small" style="margin-top:6px;">${r.checked ? "✅" : "⬜"} ${esc(r.text)}</div>
                `).join("")}
              </div>
            ` : ""}
          `,
          footer: `
            <button class="btn" data-action="close">Close</button>
            <button class="btn primary" id="btnExportAttempt" type="button">Export attempt</button>
          `
        });
        setTimeout(() => {
          $("#btnExportAttempt")?.addEventListener("click", () => {
            downloadJson(a, `${APP.id}_attempt_${a.id}.json`);
            toast("Attempt exported.", 1600);
          });
        }, 0);
      }
    };

    setTimeout(() => {
      $("#btnExportHistory")?.addEventListener("click", () => {
        const payload = loadHistory();
        payload.exportedAt = nowIso();
        payload.app = { id: APP.id, version: APP.version };
        downloadJson(payload, `${APP.id}_history_export.json`);
        toast("History exported.", 1600);
      });

      $("#btnClearHistory")?.addEventListener("click", () => {
        saveHistory(defaultHistory());
        toast("History cleared.", 1400);
        closeModal();
        renderAll(loadState());
      });
    }, 0);
  }
function confirmResetAll(){
    openModal({
      title: "Reset app?",
      body: `
        <div>This clears <b>User packs</b>, stats, and progress in this browser.</div>
        <div class="small muted" style="margin-top:8px;">Built-in packs remain.</div>
      `,
      footer: `
        <button class="btn" data-action="close">Cancel</button>
        <button class="btn danger" id="btnDoReset" type="button">Reset</button>
      `
    });
    setTimeout(() => {
      $("#btnDoReset")?.addEventListener("click", () => {
        localStorage.removeItem(APP.storage.state);
        localStorage.removeItem(APP.storage.packs);
        localStorage.removeItem(APP.storage.history);
        closeModal();
        toast("Reset complete.", 1600);
        navigate("clinic");
      });
    }, 0);
  }

  // ---------- views ----------
  function renderClinic(state){
    const el = $("#viewClinic");
    const c = getActiveCase(state);
    const stats = state.stats || defaultState().stats;

    const kpis = `
      <div class="kpis">
        <div class="kpi"><div class="kpi-v">${stats.attempts}</div><div class="kpi-l">Attempts</div></div>
        <div class="kpi"><div class="kpi-v">${stats.attempts ? Math.round(stats.totalScore / stats.attempts) : 0}</div><div class="kpi-l">Avg score</div></div>
        <div class="kpi"><div class="kpi-v">${stats.verifiedPasses}</div><div class="kpi-l">Verified</div</div>
      </div>
    `;

    if (!c){
      el.innerHTML = `
        <div class="card"><div class="h1">Clinic</div><div class="small">Load a case from <b>Library</b> or create one in <b>Builder</b>.</div></div>
        <div class="card">
          ${kpis}
          <div class="hr"></div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn primary" data-action="goLibrary" type="button">Browse cases</button>
            <button class="btn" data-action="startDrill" type="button">Start drill</button>
            <button class="btn danger" data-action="resetAll" type="button">Reset app</button>
          </div>
        </div>
      `;
      el.onclick = (e) => {
        const act = e.target?.getAttribute?.("data-action");
        if (act==="goLibrary") navigate("library");
        if (act==="startDrill") openDrillSetup(loadState());
        if (act==="resetAll") confirmResetAll();
      };
      return;
    }

    const st = getCaseSessionState(state, c.id);
    const symptomOptions = unique(allCases().map(x => x.symptom));
    const causeOptions = unique(allCases().map(x => x.cause));
    const fixOptions = unique(allCases().map(x => x.fix));
    const highlight = renderHighlightedBadOutput(c);

    const baselineBlocks = parseContextBlocks(c.baselineContext || "");
    const fixedBlocks = st.applied ? parseContextBlocks(st.fixedText || "") : null;

    const scoredBadge =
      st.scored
        ? `<span class="badge ${st.score>=75?"good":st.score>=45?"warn":"bad"}">Score ${st.score}</span>`
        : `<span class="badge">Not scored yet</span>`;

    const verifyBadge = (st.verify && st.verify.done)
      ? `<span class="badge ${st.verify.pass?"good":"warn"}">Verified ${st.verify.pass?"PASS":"CHECK"} (${st.verify.percent||0}%)</span>`
      : `<span class="badge">Not verified</span>`;


    const teaching = st.scored ? `
      <div class="hr"></div>
      <div class="h2">Teaching feedback</div>
      <div class="row">
        <div class="col"><div class="small">Symptom</div><div style="margin-top:6px;">${esc(c.explanation?.symptomWhy || "")}</div></div>
        <div class="col"><div class="small">Cause</div><div style="margin-top:6px;">${esc(c.explanation?.causeWhy || "")}</div></div>
        <div class="col"><div class="small">Fix</div><div style="margin-top:6px;">${esc(c.explanation?.fixWhy || "")}</div></div>
      </div>
    ` : "";

    const diff = st.applied ? renderDiffSection(c.baselineContext || "", st.fixedText || "") : "";

    const drillBar = state.drill ? `
      <span class="badge warn">Drill active</span>
      <span class="small">Round ${state.drill.roundIndex+1} / ${state.drill.rounds}</span>
      <button class="btn ghost" data-action="endDrill" type="button">End</button>
    ` : "";

    el.innerHTML = `
      <div class="card">
        <div class="h1">Clinic</div>
        <div class="small">Diagnose the failure mode, apply a context fix, then verify by pasting the improved output.</div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:flex-start;">
          <div>
            <div class="h1">${esc(c.title)}</div>
            <div class="case-meta">
              <span class="badge">${esc(c.symptom)}</span>
              <span class="badge">${esc(c.cause)}</span>
              <span class="badge">${esc(c.fix)}</span>
              <span class="badge">Difficulty ${c.difficulty}</span>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            ${drillBar}
            <button class="btn" data-action="openHistory" type="button">History</button>
            <button class="btn" data-action="exportCase" type="button">Export</button>
            <button class="btn danger" data-action="resetAll" type="button">Reset</button
          </div>
        </div>

        <div class="hr"></div>
        ${kpis}

        <div class="hr"></div>
        <div class="row">
          <div class="col">
            <div class="small">Bad output (tap highlights)</div>
            <div class="card" style="margin-top:8px; background:rgba(255,255,255,0.02);">${highlight}</div>
          </div>
          <div class="col">
            <div class="small">Expected behavior</div>
            <div class="card" style="margin-top:8px; background:rgba(255,255,255,0.02);">${esc(c.expected || "")}</div>
          </div>
        </div>

        <div class="hr"></div>
        <div class="h2">Diagnose</div>
        <div class="row">
          <div class="col">
            <div class="label">Symptom</div>
            <select id="pickSymptom">
              <option value="">Select…</option>
              ${symptomOptions.map(v => `<option ${v===st.choices.symptom?"selected":""} value="${esc(v)}">${esc(v)}</option>`).join("")}
            </select>
          </div>
          <div class="col">
            <div class="label">Likely cause</div>
            <select id="pickCause">
              <option value="">Select…</option>
              ${causeOptions.map(v => `<option ${v===st.choices.cause?"selected":""} value="${esc(v)}">${esc(v)}</option>`).join("")}
            </select>
          </div>
          <div class="col">
            <div class="label">Best fix</div>
            <select id="pickFix">
              <option value="">Select…</option>
              ${fixOptions.map(v => `<option ${v===st.choices.fix?"selected":""} value="${esc(v)}">${esc(v)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn primary" data-action="score" type="button">Score</button>
          ${scoredBadge}
          ${verifyBadge}
          <button class="btn" data-action="startDrill" type="button">Drill…</button
        </div>

        ${teaching}

        <div class="hr"></div>
        <div class="h2">Generate context fix</div>
        <div class="small">Adds or tightens missing blocks (role/rules/grounding/format/memory). Review before using.</div>

        <div class="row" style="margin-top:10px;">
          <div class="col">
            <div class="small">Baseline blocks</div>
            <div class="card" style="margin-top:8px; background:rgba(255,255,255,0.02);">${renderBlocksTable(baselineBlocks)}</div>
          </div>
          <div class="col">
            <div class="small">Fixed blocks (generated)</div>
            <div class="card" style="margin-top:8px; background:rgba(255,255,255,0.02);">
              ${st.applied ? renderBlocksTable(fixedBlocks) : `<div class="small muted">Not generated yet.</div>`}
            </div>
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn primary" data-action="applyFix" type="button">Generate fix</button>
          <button class="btn" data-action="openVerify" type="button" ${st.applied ? "" : "disabled"}>Verify fix</button>
        </div>

        ${diff}
      </div>
    `;

    el.onclick = (e) => {
      const h = e.target?.closest?.(".highlight");
      if (h){
        const phrase = h.getAttribute("data-phrase") || h.textContent || "";
        const hint = h.getAttribute("data-hint") || "";
        openModal({
          title: "Stethoscope hint",
          body: `
            <div class="small">Tapped phrase</div>
            <div class="card" style="margin-top:8px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,0.02);">${esc(phrase)}</div>
            <div class="hr"></div>
            <div class="small">Why it matters</div>
            <div style="margin-top:8px;">${esc(hint)}</div>
          `,
          footer: `<button class="btn primary" data-action="close">Close</button>`
        });
        return;
      }

      const act = e.target?.getAttribute?.("data-action");
      if (!act) return;

      const st2 = getCaseSessionState(state, c.id);


      if (act === "openHistory") {
        openHistoryModal(loadState());
        return;
      }

      if (act === "openVerify") {
        if (!st2.applied) { toast("Generate a fix first.", 1800); return; }
        openVerifyModal(loadState(), c, st2);
        return;
      }


      if (act === "score"){
        st2.choices.symptom = $("#pickSymptom").value;
        st2.choices.cause = $("#pickCause").value;
        st2.choices.fix = $("#pickFix").value;

        st2.scored = true;
        let score = 0;
        if (st2.choices.symptom && st2.choices.symptom === c.symptom) score += 34;
        if (st2.choices.cause && st2.choices.cause === c.cause) score += 33;
        if (st2.choices.fix && st2.choices.fix === c.fix) score += 33;
        st2.score = score;

        state.stats.attempts += 1;
        state.stats.totalScore += score;
        if (score >= 75) state.stats.diagnosisCompletions += 1;
        // start a new attempt record for this scoring event
        const attempt = ensureActiveAttempt(state, c, st2);
        attempt.diagnosis = {
          symptom: st2.choices.symptom,
          cause: st2.choices.cause,
          fix: st2.choices.fix,
          score: score,
          scored: true,
        };
        attempt.scoredAt = nowIso();
        updateAttempt(attempt.id, attempt);
        // reset per-attempt verification state (new attempt)
        st2.verify = { done: false, pass: false, percent: 0 };


        saveState(state);
        renderClinic(loadState());
        toast(score >= 75 ? "Nice diagnosis." : "Scored — review feedback.", 2400);

        if (state.drill && state.drill.autoAdvance) setTimeout(() => advanceDrill(loadState()), 750);
      }

      if (act === "applyFix"){
        const fixedBlocks2 = suggestFixBlocks(c);
        st2.applied = true;
        st2.fixedText = blocksToText(fixedBlocks2);
        // attach fixed context to the active attempt (if any)
        try {
          const attempt = ensureActiveAttempt(state, c, st2);
          updateAttempt(attempt.id, { fixedContext: truncateText(st2.fixedText || "", 9000) });
        } catch {}

        saveState(state);
        renderClinic(loadState());
        toast("Generated fixed context. Review the diff.", 2200);
      }

      if (act === "exportCase"){
        const payload = {
          exportedAt: nowIso(),
          app: { id: APP.id, version: APP.version },
          case: c,
          session: { choices: st2.choices, score: st2.score, fixedContext: st2.fixedText || null },
          latestAttempt: latestAttemptForCase(c.id)
        };
        downloadJson(payload, `${APP.id}_${c.id}_export.json`);
        toast("Exported JSON.", 1600);
      }

      if (act === "resetAll") confirmResetAll();
      if (act === "startDrill") openDrillSetup(loadState());
      if (act === "endDrill") endDrill(loadState());
    };
  }

  function renderLibrary(state){
    const el = $("#viewLibrary");
    const packs = getAllPacks();
    const active = findPack(state.activePackId) || packs[0];
    const cases = listCasesInPack(active.packId);

    el.innerHTML = `
      <div class="card">
        <div class="h1">Library</div>
        <div class="small">Browse cases, manage packs, and load a case into the Clinic.</div>
      </div>

      <div class="card">
        <div class="row">
          <div class="col">
            <div class="label">Pack</div>
            <select id="selPack">
              ${packs.map(p => `<option ${p.packId===active.packId?"selected":""} value="${esc(p.packId)}">${esc(p.name)} (${esc(p.packId)})</option>`).join("")}
            </select>
          </div>
          <div class="col">
            <div class="label">Search</div>
            <input id="searchCases" class="input" placeholder="title, symptom, tag…" />
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn" data-action="managePacks" type="button">Manage packs</button>
          <button class="btn" data-action="exportPack" type="button">Export pack</button>
          <button class="btn" data-action="importPack" type="button">Import pack</button>
          <button class="btn danger" data-action="resetAll" type="button">Reset app</button>
        </div>
      </div>

      <div class="card">
        <div class="h2">Cases (${cases.length})</div>
        <div id="caseList" class="small" style="margin-top:10px;"></div>
      </div>
    `;

    const listEl = $("#caseList", el);

    function renderList(filter = ""){
      const f = (filter || "").trim().toLowerCase();
      const filtered = !f ? cases : cases.filter(c => {
        const blob = `${c.title} ${c.symptom} ${c.cause} ${c.fix} ${(c.tags||[]).join(" ")}`.toLowerCase();
        return blob.includes(f);
      });

      if (!filtered.length){
        listEl.innerHTML = `<div class="muted">No matches.</div>`;
        return;
      }

      listEl.innerHTML = filtered.map(c => `
        <div class="card" style="padding:12px; border-radius:14px; background:rgba(255,255,255,0.02); margin-top:10px;">
          <div class="case-title">${esc(c.title)}</div>
          <div class="case-meta">
            <span class="badge">${esc(c.symptom)}</span>
            <span class="badge">Diff ${c.difficulty}</span>
            ${(c.tags||[]).slice(0,3).map(t => `<span class="badge">${esc(t)}</span>`).join("")}
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button class="btn primary" data-action="loadCase" data-id="${esc(c.id)}" type="button">Load in Clinic</button>
            ${active.packId==="my"
              ? `<button class="btn" data-action="editCase" data-id="${esc(c.id)}" type="button">Edit</button>
                 <button class="btn danger" data-action="deleteCase" data-id="${esc(c.id)}" type="button">Delete</button>`
              : `<button class="btn" data-action="dupToMy" data-id="${esc(c.id)}" type="button">Duplicate to My Pack</button>`}
          </div>
        </div>
      `).join("");
    }

    renderList();

    $("#selPack", el).addEventListener("change", (e) => {
      state.activePackId = e.target.value;
      saveState(state);
      renderAll(loadState());
    });

    $("#searchCases", el).addEventListener("input", (e) => renderList(e.target.value));

    el.onclick = (e) => {
      const act = e.target?.getAttribute?.("data-action");
      const id = e.target?.getAttribute?.("data-id");
      if (!act) return;

      if (act==="loadCase"){
        state.activeCaseId = id;
        saveState(state);
        navigate("clinic");
        toast("Case loaded.", 1200);
      }

      if (act==="dupToMy"){
        const src = allCases().find(x => x.id === id);
        if (!src) return;
        const copy = { ...src, id: uid("case"), title: src.title + " (copy)", tags: [...(src.tags||[]), "dup"] };
        upsertUserCase("my", copy);
        toast("Duplicated to My Pack.", 1400);
        renderAll(loadState());
      }

      if (act==="editCase"){
        const src = listCasesInPack("my").find(x => x.id === id);
        if (src) openCaseEditor(src);
      }

      if (act==="deleteCase"){
        openModal({
          title:"Delete case?",
          body:`<div>Delete this case from <b>My Pack</b>? (local to this browser)</div>`,
          footer:`<button class="btn" data-action="close">Cancel</button>
                  <button class="btn danger" id="btnDoDelCase" type="button">Delete</button>`
        });
        setTimeout(() => {
          $("#btnDoDelCase")?.addEventListener("click", () => {
            deleteUserCase("my", id);
            closeModal();
            toast("Deleted.", 1400);
            renderAll(loadState());
          });
        }, 0);
      }

      if (act==="managePacks") openPackManager(loadState());
      if (act==="exportPack") exportCurrentPack(loadState());
      if (act==="importPack") importPackFlow(loadState());
      if (act==="resetAll") confirmResetAll();
    };
  }

  function openCaseEditor(caseObj){
    const c = caseObj ? normalizeCase(caseObj) : normalizeCase({
      id: uid("case"),
      title: "",
      symptom: "",
      cause: "",
      fix: "",
      difficulty: 2,
      tags: [],
      badOutput: "",
      expected: "",
      baselineContext: "",
      stethoscope: [],
      explanation: { symptomWhy:"", causeWhy:"", fixWhy:"" }
    });

    const symptomOptions = unique(allCases().map(x => x.symptom));
    const causeOptions = unique(allCases().map(x => x.cause));
    const fixOptions = unique(allCases().map(x => x.fix));

    openModal({
      title: caseObj ? "Edit case (My Pack)" : "New case (My Pack)",
      body: `
        <div class="row">
          <div class="col">
            <div class="label">Title</div>
            <input id="ceTitle" class="input" value="${esc(c.title)}" />
          </div>
          <div class="col">
            <div class="label">Difficulty</div>
            <select id="ceDiff">
              <option value="1" ${c.difficulty===1?"selected":""}>1</option>
              <option value="2" ${c.difficulty===2?"selected":""}>2</option>
              <option value="3" ${c.difficulty===3?"selected":""}>3</option>
            </select>
          </div>
        </div>

        <div class="row" style="margin-top:10px;">
          <div class="col">
            <div class="label">Symptom</div>
            <input id="ceSymptom" class="input" list="symList" value="${esc(c.symptom)}" />
            <datalist id="symList">${symptomOptions.map(v => `<option value="${esc(v)}"></option>`).join("")}</datalist>
          </div>
          <div class="col">
            <div class="label">Cause</div>
            <input id="ceCause" class="input" list="causeList" value="${esc(c.cause)}" />
            <datalist id="causeList">${causeOptions.map(v => `<option value="${esc(v)}"></option>`).join("")}</datalist>
          </div>
          <div class="col">
            <div class="label">Fix</div>
            <input id="ceFix" class="input" list="fixList" value="${esc(c.fix)}" />
            <datalist id="fixList">${fixOptions.map(v => `<option value="${esc(v)}"></option>`).join("")}</datalist>
          </div>
        </div>

        <div class="field"><div class="label">Bad output</div><textarea id="ceBad">${esc(c.badOutput)}</textarea></div>
        <div class="field"><div class="label">Expected behavior</div><textarea id="ceExpected">${esc(c.expected)}</textarea></div>
        <div class="field"><div class="label">Baseline context / prompt</div><textarea id="ceContext">${esc(c.baselineContext)}</textarea></div>

        <div class="row" style="margin-top:10px;">
          <div class="col">
            <div class="label">Stethoscope phrases (one per line)</div>
            <textarea id="ceStetho" style="min-height:90px;">${esc((c.stethoscope||[]).join("\n"))}</textarea>
          </div>
          <div class="col">
            <div class="label">Tags (comma-separated)</div>
            <input id="ceTags" class="input" value="${esc((c.tags||[]).join(", "))}" />
          </div>
        </div>
      `,
      footer: `
        <button class="btn" data-action="close">Cancel</button>
        <button class="btn primary" id="btnSaveCase" type="button">Save</button>
      `
    });

    setTimeout(() => {
      $("#btnSaveCase")?.addEventListener("click", () => {
        c.title = ($("#ceTitle").value || "").trim();
        c.difficulty = parseInt($("#ceDiff").value, 10) || 2;
        c.symptom = ($("#ceSymptom").value || "").trim();
        c.cause = ($("#ceCause").value || "").trim();
        c.fix = ($("#ceFix").value || "").trim();
        c.badOutput = $("#ceBad").value || "";
        c.expected = $("#ceExpected").value || "";
        c.baselineContext = $("#ceContext").value || "";
        c.stethoscope = ($("#ceStetho").value || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
        c.tags = ($("#ceTags").value || "").split(",").map(s=>s.trim()).filter(Boolean);

        if (!c.title || !c.symptom || !c.cause || !c.fix) return toast("Title, symptom, cause, and fix are required.", 2400);

        upsertUserCase("my", c);
        closeModal();
        toast("Saved to My Pack.", 1600);
        renderAll(loadState());
      });
    }, 0);
  }

  function renderBuilder(state){
    const el = $("#viewBuilder");
    const myCases = listCasesInPack("my");

    el.innerHTML = `
      <div class="card">
        <div class="h1">Builder</div>
        <div class="small">Create custom cases stored in <b>My Pack</b>, or use the guided <b>Wizard</b>.</div>
        <div class="hr"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn primary" data-action="openWizard" type="button">Open Wizard</button>
          <button class="btn" data-action="newCase" type="button">New manual case</button>
        </div>
      </div>

      <div class="card">
        <div class="h2">My Pack cases</div>
        <div id="myList" style="margin-top:10px;"></div>
      </div>
    `;

    const list = $("#myList", el);
    if (!myCases.length){
      list.innerHTML = `<div class="muted">No custom cases yet.</div>`;
    } else {
      list.innerHTML = myCases.slice(0,12).map(c => `
        <div class="card" style="padding:12px; border-radius:14px; background:rgba(255,255,255,0.02); margin-top:10px;">
          <div class="case-title">${esc(c.title)}</div>
          <div class="case-meta"><span class="badge">${esc(c.symptom)}</span><span class="badge">Diff ${c.difficulty}</span></div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button class="btn" data-action="editCase" data-id="${esc(c.id)}" type="button">Edit</button>
            <button class="btn primary" data-action="loadCase" data-id="${esc(c.id)}" type="button">Load in Clinic</button>
          </div>
        </div>
      `).join("");
    }

    el.onclick = (e) => {
      const act = e.target?.getAttribute?.("data-action");
      const id = e.target?.getAttribute?.("data-id");
      if (!act) return;

      if (act==="openWizard") openWizard();
      if (act==="newCase") openCaseEditor(null);
      if (act==="editCase"){
        const c = myCases.find(x => x.id === id);
        if (c) openCaseEditor(c);
      }
      if (act==="loadCase"){
        state.activeCaseId = id;
        saveState(state);
        navigate("clinic");
        toast("Case loaded.", 1200);
      }
    };
  }

  function renderAbout(state){
    const el = $("#viewAbout");
    el.innerHTML = `
      <div class="card">
        <div class="h1">About</div>
        <div class="small">Mobile-first practice tool for diagnosing LLM failures via context engineering.</div>
        <div class="hr"></div>
        <div class="row">
          <div class="col">
            <div class="h2">What’s new in Iteration 4 (v${esc(APP.version)})</div>
            <ul>
              <li><b>Fix verification</b> (paste improved output + rubric)</li>
              <li><b>Attempt history</b> (view/export attempts)</li>
              <li><b>Wizard + packs + drill</b> (from Iteration 3)</li>
              <li><b>Side-by-side diff</b> on wide screens</li>
            </ul>
          </div>
          <div class="col">
            <div class="h2">Local-only data</div>
            <div class="small">User packs and stats are stored via localStorage. Export packs to back up.</div>
            <div class="hr"></div>
            <button class="btn" data-action="startDrill" type="button">Start drill</button>
            <button class="btn danger" data-action="resetAll" type="button" style="margin-left:8px;">Reset app</button>
          </div>
        </div>
      </div>
    `;
    el.onclick = (e) => {
      const act = e.target?.getAttribute?.("data-action");
      if (act==="resetAll") confirmResetAll();
      if (act==="startDrill") openDrillSetup(loadState());
    };
  }

  function renderAll(state){
    renderClinic(state);
    renderLibrary(state);
    renderBuilder(state);
    renderAbout(state);

    $$(".view").forEach(v => v.classList.remove("is-active"));
    $(`[data-view="${state.view}"]`)?.classList.add("is-active");
    $$(".nav-item").forEach(btn => btn.classList.toggle("is-active", btn.getAttribute("data-nav") === state.view));
  }

  // ---------- boot ----------
  async function init(){
    MODEL.builtin = await loadBuiltinPacks();
    MODEL.user = loadUserPacks();

    const state = loadState();
    initSharedFeatures();
    setActiveView(state, state.view || "clinic");

    // Default active case
    const activePack = findPack(state.activePackId) || MODEL.builtin.packs[0];
    const packCases = listCasesInPack(activePack.packId);
    if (!state.activeCaseId && packCases.length){
      state.activeCaseId = packCases[0].id;
      saveState(state);
    }

    renderAll(loadState());
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(err => {
      console.error(err);
      toast("Startup error. Open console for details.", 3400);
    });
  });
})();
