/* Memory Mixer — Iteration 2 */
const APP_VERSION = "v0.3.1";
// Keep older keys for forward-compatible migration.
const STORAGE_KEYS = ["memory_mixer_state_v0.3.1", "memory_mixer_state_v0.3.0", "memory_mixer_state_v0.2.1", "memory_mixer_state_v0.2.0"];
const STORAGE_KEY_WRITE = STORAGE_KEYS[0];
const PREFS_KEYS = ["memory_mixer_prefs_v0.3.1", "memory_mixer_prefs_v0.3.0", "memory_mixer_prefs_v0.2.1", "memory_mixer_prefs_v0.2.0"];
const PREFS_KEY_WRITE = PREFS_KEYS[0];
const THEME_KEY = "app_theme";

/* -----------------------------
   Shared utilities
------------------------------ */
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

function el(id) { return document.getElementById(id); }
function sanitizeText(s) { return String(s ?? "").replace(/\s+/g, " ").trim(); }
function escapeRegExp(s) { return String(s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function uid() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/* -----------------------------
   Scenario library (Iteration 1 adds more scenarios)
------------------------------ */
const SCENARIOS = [
  {
    id: "launch-plan",
    name: "AI Training Launch Plan (Decisions + Dependencies)",
    description: "A multi-turn planning thread where missing pinned decisions causes drift.",
    turns: [
      {
        userMsg: "We need a plan to launch an internal AI training program in 6 weeks. What are the first steps?",
        notes: [
          { id:"t1n1", type:"Decision", text:"Target launch date is 6 weeks from today.", critical:true, synonyms:["launch in 6 weeks","six-week launch"] },
          { id:"t1n2", type:"Fact", text:"Audience: 300 knowledge workers across 4 departments." },
          { id:"t1n3", type:"Constraint", text:"Training must be mobile-friendly and self-paced." },
          { id:"t1n4", type:"Idea", text:"Use a short pilot cohort before full rollout." }
        ],
        requiresPinned: ["t1n1"]
      },
      {
        userMsg: "Pilot sounds good. What does the pilot need, and who owns what?",
        notes: [
          { id:"t2n1", type:"Decision", text:"Pilot cohort: 25 volunteers (mixed departments).", critical:true, synonyms:["25-person pilot","pilot cohort of 25"] },
          { id:"t2n2", type:"Decision", text:"Owner: Product Lead is accountable for scope & timeline.", critical:true, synonyms:["product lead owns scope and timeline","product lead accountable"] },
          { id:"t2n3", type:"Task", text:"Create a short onboarding guide + starter prompt pack." },
          { id:"t2n4", type:"Risk", text:"Overloading learners with too much context at once." }
        ],
        requiresPinned: ["t2n1","t2n2"]
      },
      {
        userMsg: "We have limited time. What can we cut without breaking the pilot?",
        notes: [
          { id:"t3n1", type:"Decision", text:"Cut live sessions; keep async office hours only.", critical:true, synonyms:["no live sessions","async office hours only"] },
          { id:"t3n2", type:"Constraint", text:"Do not reduce accessibility or mobile usability." },
          { id:"t3n3", type:"Idea", text:"Ship 3 modules first; add more after pilot feedback." },
          { id:"t3n4", type:"Fact", text:"Learners only have ~20 minutes per day." }
        ],
        requiresPinned: ["t3n1"]
      },
      {
        userMsg: "Remind me: what did we decide about the pilot cohort size and live sessions?",
        notes: [
          { id:"t4n1", type:"Check", text:"Need to recall: pilot cohort size (volunteers) and live session policy.", critical:true },
          { id:"t4n2", type:"Task", text:"Draft a one-paragraph summary for leadership." },
          { id:"t4n3", type:"Risk", text:"If decisions weren't pinned, answers drift." }
        ],
        requiresPinned: ["t2n1","t3n1"]
      },
      {
        userMsg: "Now write the 'Memory' block we will paste into the Context Skeleton for the next turn.",
        notes: [
          { id:"t5n1", type:"Task", text:"Export Rolling Summary + Pinned Facts + Retrieval Memory as a block.", critical:true },
          { id:"t5n2", type:"Tip", text:"Keep it short; avoid raw history dumping." }
        ],
        requiresPinned: []
      }
    ]
  },
  {
    id: "incident-triage",
    name: "Incident Triage (Confirmed Facts + Open Questions)",
    description: "A multi-turn incident where missing pinned facts causes inconsistent updates.",
    turns: [
      {
        userMsg: "We are seeing elevated 500 errors in the checkout flow. Start an incident note.",
        notes: [
          { id:"i1n1", type:"Fact", text:"Impact: elevated 500 errors in checkout.", critical:true, synonyms:["checkout 500s elevated","checkout is failing with 500s"] },
          { id:"i1n2", type:"Fact", text:"Severity: SEV-2 (customer impact, partial outage).", critical:true, synonyms:["sev2 partial outage","SEV-2 incident"] },
          { id:"i1n3", type:"Task", text:"Start timeline + owners list." }
        ],
        requiresPinned: ["i1n1","i1n2"]
      },
      {
        userMsg: "What do we know so far and what are the top hypotheses?",
        notes: [
          { id:"i2n1", type:"Fact", text:"Errors spiked after the 14:10 deploy window.", critical:true, synonyms:["spike after 14:10 deploy","post-deploy spike 14:10"] },
          { id:"i2n2", type:"Hypothesis", text:"Recent config change increased downstream timeouts." },
          { id:"i2n3", type:"Constraint", text:"Do not invent facts; label assumptions." }
        ],
        requiresPinned: ["i2n1"]
      },
      {
        userMsg: "Write the next status update. Include impact, hypothesis, and next actions.",
        notes: [
          { id:"i3n1", type:"Task", text:"Status update needs: timeline, current impact, hypotheses, next actions.", critical:true },
          { id:"i3n2", type:"Risk", text:"If key facts aren't pinned, status updates drift." }
        ],
        requiresPinned: ["i1n1","i1n2","i2n1"]
      }
    ]
  },
  {
    id: "policy-draft",
    name: "Internal Policy Draft (Scope + Non-Negotiables)",
    description: "Drafting a short internal policy where forgotten constraints cause rework.",
    turns: [
      {
        userMsg: "Draft a one-page internal policy for using GenAI tools at work. Start with the purpose and scope.",
        notes: [
          { id:"p1n1", type:"Decision", text:"Policy scope: internal work use only; no customer data unless approved.", critical:true, synonyms:["internal use only","no customer data without approval"] },
          { id:"p1n2", type:"Constraint", text:"Keep it to one page; plain language." },
          { id:"p1n3", type:"Idea", text:"Include examples of allowed vs disallowed uses." }
        ],
        requiresPinned: ["p1n1"]
      },
      {
        userMsg: "Add non-negotiables and a short escalation path.",
        notes: [
          { id:"p2n1", type:"Decision", text:"Non-negotiable: do not paste secrets, tokens, passwords, or private keys.", critical:true, synonyms:["never paste secrets","no credentials in prompts"] },
          { id:"p2n2", type:"Decision", text:"Escalation: ask Security/Legal for approval when unsure.", critical:true, synonyms:["escalate to security and legal","when in doubt ask security/legal"] },
          { id:"p2n3", type:"Task", text:"Add a simple checklist at the end." }
        ],
        requiresPinned: ["p2n1","p2n2"]
      },
      {
        userMsg: "Someone asks: can we paste vendor contracts into the tool for summarization? Answer per the policy.",
        notes: [
          { id:"p3n1", type:"Check", text:"Must recall policy scope + non-negotiables + escalation path.", critical:true },
          { id:"p3n2", type:"Risk", text:"If constraints aren't pinned, answer becomes inconsistent." }
        ],
        requiresPinned: ["p1n1","p2n1","p2n2"]
      }
    ]
  },
  {
    id: "project-kickoff",
    name: "Project Kickoff (Goals + Success Metrics)",
    description: "A kickoff thread where missing metrics causes the plan to wander.",
    turns: [
      {
        userMsg: "We are kicking off a 4-week pilot for an internal chatbot. What is the goal statement?",
        notes: [
          { id:"k1n1", type:"Decision", text:"Pilot length: 4 weeks.", critical:true, synonyms:["four-week pilot","pilot runs 4 weeks"] },
          { id:"k1n2", type:"Decision", text:"Goal: reduce time-to-answer for common internal questions.", critical:true, synonyms:["reduce time to answer","faster answers for internal questions"] },
          { id:"k1n3", type:"Constraint", text:"Limit scope to one department for the pilot." }
        ],
        requiresPinned: ["k1n1","k1n2"]
      },
      {
        userMsg: "Define success metrics and what data we will collect.",
        notes: [
          { id:"k2n1", type:"Decision", text:"Success metric: 30% reduction in time-to-answer on top 20 FAQs.", critical:true, synonyms:["30% faster time-to-answer","reduce TTA by 30%"] },
          { id:"k2n2", type:"Decision", text:"Collect: deflection rate + user satisfaction + unresolved question rate.", critical:true, synonyms:["deflection and satisfaction","track deflection rate"] },
          { id:"k2n3", type:"Risk", text:"Without metrics, iteration becomes opinion-driven." }
        ],
        requiresPinned: ["k2n1","k2n2"]
      },
      {
        userMsg: "Summarize what we decided about pilot length and success metrics.",
        notes: [
          { id:"k3n1", type:"Check", text:"Need to recall pilot length + metrics precisely.", critical:true }
        ],
        requiresPinned: ["k1n1","k2n1","k2n2"]
      }
    ]
  }
];

/* -----------------------------
   State model (Iteration 1 adds UI prefs + capture log + richer memory items)
------------------------------ */
function defaultUI() {
  return { showRequiredHints: true, showReplayPanel: false, retrievalQuery: "", retrievalTagFilter: "ALL" };
}

function loadPrefs() {
  try {
    for (const key of PREFS_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") continue;
      return {
        scenarioId: typeof p.scenarioId === "string" ? p.scenarioId : SCENARIOS[0].id,
        ui: { ...defaultUI(), ...(p.ui || {}) }
      };
    }
  } catch (e) {}
  return { scenarioId: SCENARIOS[0].id, ui: defaultUI() };
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY_WRITE, JSON.stringify(prefs)); } catch (e) {}
}

function blankState({ scenarioId, ui }) {
  return {
    mode: "idle",
    scenarioId: scenarioId || SCENARIOS[0].id,
    turnIndex: 0,
    rollingSummary: "",
    pinnedFacts: [],
    retrievalNotes: [],
    snapshots: [],
    captureLog: [],
    ui: { ...defaultUI(), ...(ui || {}) }
  };
}

function newRunState({ scenarioId, ui }) {
  return { ...blankState({ scenarioId, ui }), mode: "running", turnIndex: 0 };
}

function normalizeRunState(parsed) {
  const prefs = loadPrefs();
  const base = newRunState({
    scenarioId: parsed?.scenarioId || prefs.scenarioId || SCENARIOS[0].id,
    ui: { ...prefs.ui, ...(parsed?.ui || {}) }
  });

  const merged = {
    ...base,
    ...parsed,
    mode: "running",
    ui: { ...base.ui, ...(parsed?.ui || {}) }
  };

  if (!Array.isArray(merged.pinnedFacts)) merged.pinnedFacts = [];
  if (!Array.isArray(merged.retrievalNotes)) merged.retrievalNotes = [];
  if (!Array.isArray(merged.snapshots)) merged.snapshots = [];
  if (!Array.isArray(merged.captureLog)) merged.captureLog = [];
  // Iteration 2: ensure retrieval notes have tags
  merged.retrievalNotes = (merged.retrievalNotes || []).map(r => {
    if (!r || typeof r !== "object") return null;
    const tags = Array.isArray(r.tags) ? r.tags.filter(t => typeof t === "string" && t.trim()) : [];
    return { ...r, tags };
  }).filter(Boolean);

  // Iteration 2: UI fields
  if (!merged.ui) merged.ui = defaultUI();
  if (typeof merged.ui.retrievalQuery !== "string") merged.ui.retrievalQuery = "";
  if (typeof merged.ui.retrievalTagFilter !== "string") merged.ui.retrievalTagFilter = "ALL";

  if (typeof merged.rollingSummary !== "string") merged.rollingSummary = "";
  if (typeof merged.turnIndex !== "number") merged.turnIndex = 0;

  return merged;
}

function loadSavedRunState() {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") continue;
      return normalizeRunState(parsed);
    }
    return null;
  } catch (e) {
    return null;
  }
}

function saveRunState(state) {
  localStorage.setItem(STORAGE_KEY_WRITE, JSON.stringify(state));
}

function clearSavedRunState() {
  for (const key of STORAGE_KEYS) localStorage.removeItem(key);
}

function getScenario(state) {
  return SCENARIOS.find(s => s.id === state.scenarioId) || SCENARIOS[0];
}

function getTurn(state) {
  const sc = getScenario(state);
  return sc.turns[Math.min(state.turnIndex, sc.turns.length - 1)];
}

function normalizeTokens(s) {
  const raw = sanitizeText(s).toLowerCase();
  const tokens = raw.split(/[^a-z0-9]+/).filter(Boolean);
  const stop = new Set(["the","a","an","and","or","to","of","in","on","for","is","are","be","with","as","we","it","this","that","at","by","from","so","far"]);
  return tokens.filter(t => t.length >= 3 && !stop.has(t));
}

function tokenSimilarity(a, b) {
  const A = new Set(normalizeTokens(a));
  const B = new Set(normalizeTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

function memoryText(item) { return sanitizeText(item?.text ?? ""); }

function normalizeTags(input) {
  const raw = (input || "").split(/[,\n]/g).map(s => sanitizeText(s).replace(/^#/, "")).filter(Boolean);
  const uniq = [];
  const seen = new Set();
  for (const t of raw) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
  }
  return uniq.slice(0, 12);
}

function allRetrievalTags(state) {
  const set = new Set();
  for (const r of (state.retrievalNotes || [])) {
    for (const t of (r.tags || [])) set.add(t);
  }
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function matchesRetrievalFilter(state, item) {
  const q = (state.ui?.retrievalQuery || "").trim().toLowerCase();
  const tag = (state.ui?.retrievalTagFilter || "ALL");
  const text = (item.text || "").toLowerCase();
  const tags = (item.tags || []).map(t => t.toLowerCase());
  if (tag && tag !== "ALL") {
    if (!tags.includes(tag.toLowerCase())) return false;
  }
  if (!q) return true;
  if (text.includes(q)) return true;
  return tags.some(t => t.includes(q));
}


function dedupeByText(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const t = memoryText(it).toLowerCase();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(it);
  }
  return out;
}

function addMemoryItem(state, listKey, { text, type="Note", sourceNoteId=null, sourceTurnIndex=null }) {
  const t = sanitizeText(text);
  if (!t) return state;

  const item = {
    id: uid(),
    text: t,
    type,
    sourceNoteId,
    sourceTurnIndex,
    addedAt: new Date().toISOString(),
    ...(listKey === "retrievalNotes" ? { tags: [] } : {})
  };

  const nextList = dedupeByText([item, ...(state[listKey] || [])]);
  const log = [{
    ts: item.addedAt,
    turnIndex: state.turnIndex,
    action: listKey === "pinnedFacts" ? "PIN" : "RETRIEVE",
    noteId: sourceNoteId,
    text: t
  }, ...(state.captureLog || [])].slice(0, 200);

  return { ...state, [listKey]: nextList, captureLog: log };
}

function removeMemoryItem(state, listKey, itemId) {
  const nextList = (state[listKey] || []).filter(it => it.id !== itemId);
  return { ...state, [listKey]: nextList };
}

function updateMemoryItem(state, listKey, itemId, nextText) {
  const t = sanitizeText(nextText);
  if (!t) return removeMemoryItem(state, listKey, itemId);
  const nextList = (state[listKey] || []).map(it => it.id === itemId ? { ...it, text: t } : it);
  return { ...state, [listKey]: dedupeByText(nextList) };
}

function updateRetrievalTags(state, itemId, tags) {
  const nextTags = Array.isArray(tags) ? tags : [];
  const nextList = (state.retrievalNotes || []).map(it => it.id === itemId ? { ...it, tags: nextTags } : it);
  return { ...state, retrievalNotes: nextList };
}

function exportBlock(state) {
  const lines = [];
  lines.push("Memory:");
  lines.push("Rolling summary:");
  lines.push(state.rollingSummary.trim() ? state.rollingSummary.trim() : "- (empty)");
  lines.push("");
  lines.push("Pinned facts:");
  const pins = state.pinnedFacts || [];
  if (pins.length) {
    for (const p of pins) lines.push(`- [${p.type}] ${p.text}`);
  } else {
    lines.push("- (none)");
  }
  lines.push("");
  lines.push("Retrieval memory:");
  const rets = state.retrievalNotes || [];
  if (rets.length) {
    for (const r of rets) {
      const tagPart = (r.tags && r.tags.length) ? ` (tags: ${r.tags.join(", ")})` : "";
      lines.push(`- [${r.type}] ${r.text}${tagPart}`);
    }
  } else {
    lines.push("- (none)");
  }
  return lines.join("\n");
}

function downloadTextFile(filename, text, mime="application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportRunJSON(state) {
  if (!state || state.mode !== "running") return null;
  const payload = {
    app: "Memory Mixer",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    run: state
  };
  return JSON.stringify(payload, null, 2);
}

function readImportedRunPayload(payload) {
  if (!payload) return null;
  if (payload.run && typeof payload.run === "object") return payload.run;
  // backward/alternate shape
  if (payload.mode && payload.scenarioId) return payload;
  return null;
}

/* -----------------------------
   Drift detection + scoring (Iteration 1: noteId + synonyms + token similarity)
------------------------------ */
function isRequiredSatisfied(requiredNote, pinnedItems) {
  // Direct: user pinned from the note (noteId match)
  if (pinnedItems.some(p => p.sourceNoteId && p.sourceNoteId === requiredNote.id)) return true;

  // Indirect: manual pin that is "close enough" to required note or its synonyms
  const target = requiredNote.text;
  const candidates = [target, ...(requiredNote.synonyms || [])];

  for (const p of pinnedItems) {
    const pt = p.text;
    for (const cand of candidates) {
      const sim = tokenSimilarity(cand, pt);
      if (sim >= 0.55) return true;
      // short-circuit: prefix match for very short items
      const a = sanitizeText(cand).toLowerCase();
      const b = sanitizeText(pt).toLowerCase();
      if (a.length >= 12 && b.includes(a.slice(0, 12))) return true;
    }
  }
  return false;
}


/* -----------------------------
   Contradiction detection (Iteration 2)
------------------------------ */
function parseKeyValue(text) {
  const t = sanitizeText(text);
  if (!t) return null;
  const m = t.match(/^([^:＝=\-—]{2,40})\s*[:＝=\-—]\s*(.+)$/);
  if (!m) return null;
  const key = sanitizeText(m[1]);
  const value = sanitizeText(m[2]);
  if (!key || !value) return null;
  // Avoid keys that are too generic
  if (key.length < 2) return null;
  return { key, value };
}

function extractSummaryValueForKey(rollingSummary, key) {
  const lines = (rollingSummary || "").split(/\n/g);
  const k = key.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const line = sanitizeText(lines[i]);
    if (!line) continue;
    if (!line.toLowerCase().includes(k)) continue;
    const m = line.match(new RegExp('^.*' + escapeRegExp(key) + '\\s*[:＝=\\-—]\\s*(.+)$', 'i'));
    if (!m) continue;
    return { index: i, line, value: sanitizeText(m[1]) };
  }
  return null;
}

function computeConflicts(state) {
  if (!state || state.mode !== "running") return [];
  const conflicts = [];
  const pins = state.pinnedFacts || [];
  for (const p of pins) {
    const kv = parseKeyValue(p.text);
    if (!kv) continue;
    const found = extractSummaryValueForKey(state.rollingSummary || "", kv.key);
    if (!found) continue;
    const a = kv.value.toLowerCase();
    const b = (found.value || "").toLowerCase();
    if (!a || !b) continue;
    if (a === b) continue;
    // If values are very similar, ignore
    if (tokenSimilarity(kv.value, found.value) >= 0.82) continue;
    conflicts.push({
      key: kv.key,
      pinnedValue: kv.value,
      summaryValue: found.value,
      summaryLine: found.line,
      summaryLineIndex: found.index,
      pinnedItemId: p.id
    });
  }
  return conflicts.slice(0, 20);
}

function computeScores(state) {
  if (!state || state.mode !== "running") {
    return { continuity: null, bloat: null, driftRisk: "—", missingCritical: [] };
  }
  const turn = getTurn(state);
  const requiredIds = (turn.requiresPinned || []);
  const requiredNotes = (turn.notes || []).filter(n => requiredIds.includes(n.id));

  const pinnedItems = state.pinnedFacts || [];
  const missingCritical = [];
  for (const rn of requiredNotes) {
    if (!isRequiredSatisfied(rn, pinnedItems)) missingCritical.push(rn.text);
  }

  const driftRisk = missingCritical.length ? "HIGH" : "LOW";

  // Continuity: subtract for each missing required pin
  let continuity = 100 - (missingCritical.length * 25);

  // Mild penalty if rolling summary is empty after first turn
  if (state.turnIndex >= 1 && !sanitizeText(state.rollingSummary)) continuity -= 10;

  continuity = clamp(continuity, 0, 100);

  // Bloat: penalize for too much memory
  const rsChars = (state.rollingSummary || "").length;
  const pinChars = (state.pinnedFacts || []).map(p => p.text).join(" ").length;
  const retChars = (state.retrievalNotes || []).map(r => r.text).join(" ").length;
  const total = rsChars + pinChars + retChars;

  let bloat = 100;
  if (total > 1200) bloat -= 20;
  if (total > 2000) bloat -= 25;
  if ((state.pinnedFacts || []).length > 10) bloat -= 15;
  if ((state.retrievalNotes || []).length > 14) bloat -= 15;
  bloat = clamp(bloat, 0, 100);

  return { continuity, bloat, driftRisk, missingCritical };
}

/* -----------------------------
   Snapshots (Iteration 1: modal list + diff view)
------------------------------ */
function saveSnapshot(state) {
  const snap = {
    id: uid(),
    ts: new Date().toISOString(),
    scenarioId: state.scenarioId,
    turnIndex: state.turnIndex,
    rollingSummary: state.rollingSummary,
    pinnedFacts: state.pinnedFacts || [],
    retrievalNotes: state.retrievalNotes || []
  };
  const next = [snap, ...(state.snapshots || [])].slice(0, 20);
  return { ...state, snapshots: next };
}

function restoreSnapshot(state, snapId) {
  const snaps = state.snapshots || [];
  const s = snaps.find(x => x.id === snapId);
  if (!s) return state;
  return {
    ...state,
    scenarioId: s.scenarioId,
    turnIndex: s.turnIndex,
    rollingSummary: s.rollingSummary,
    pinnedFacts: s.pinnedFacts || [],
    retrievalNotes: s.retrievalNotes || []
  };
}

function snapshotLabel(snap) {
  const dt = snap.ts.replace("T"," ").replace("Z","");
  return `${dt} • ${snap.scenarioId} • turn ${snap.turnIndex + 1} • pinned ${(snap.pinnedFacts || []).length}`;
}

function diffLines(aText, bText) {
  const a = (aText || "").split("\n").map(s => sanitizeText(s)).filter(Boolean);
  const b = (bText || "").split("\n").map(s => sanitizeText(s)).filter(Boolean);
  const A = new Set(a);
  const B = new Set(b);
  const removed = a.filter(x => !B.has(x));
  const added = b.filter(x => !A.has(x));
  return { added, removed };
}

function diffItems(aItems, bItems) {
  const a = (aItems || []).map(it => memoryText(it)).filter(Boolean);
  const b = (bItems || []).map(it => memoryText(it)).filter(Boolean);
  const A = new Set(a);
  const B = new Set(b);
  const removed = a.filter(x => !B.has(x));
  const added = b.filter(x => !A.has(x));
  return { added, removed };
}

function computeSnapshotDiff(aSnap, bSnap) {
  return {
    rolling: diffLines(aSnap.rollingSummary, bSnap.rollingSummary),
    pinned: diffItems(aSnap.pinnedFacts, bSnap.pinnedFacts),
    retrieval: diffItems(aSnap.retrievalNotes, bSnap.retrievalNotes)
  };
}

/* -----------------------------
   Rendering
------------------------------ */
function renderScenarioSelect(state) {
  const sel = el("scenarioSelect");
  if (!sel) return;
  sel.innerHTML = "";
  for (const s of SCENARIOS) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    if (s.id === state.scenarioId) opt.selected = true;
    sel.appendChild(opt);
  }
}

function isNoteCaptured(state, noteId) {
  const pins = state.pinnedFacts || [];
  const rets = state.retrievalNotes || [];
  return pins.some(p => p.sourceNoteId === noteId) || rets.some(r => r.sourceNoteId === noteId);
}

function renderRequiredHints(state) {
  const box = el("requiredBox");
  const list = el("requiredList");
  if (!box || !list) return;

  if (!state.ui.showRequiredHints) {
    box.classList.add("hidden");
    return;
  }

  const turn = getTurn(state);
  const requiredIds = (turn.requiresPinned || []);
  const requiredNotes = (turn.notes || []).filter(n => requiredIds.includes(n.id));

  if (!requiredNotes.length) {
    box.classList.remove("hidden");
    list.innerHTML = `<div class="muted">No required pins on this turn.</div>`;
    return;
  }

  const pinnedItems = state.pinnedFacts || [];
  box.classList.remove("hidden");
  list.innerHTML = "";

  for (const rn of requiredNotes) {
    const row = document.createElement("div");
    row.className = "req-item";

    const status = document.createElement("span");
    const ok = isRequiredSatisfied(rn, pinnedItems);
    status.className = ok ? "req-ok" : "req-miss";
    status.textContent = ok ? "✓" : "•";

    const txt = document.createElement("div");
    txt.className = "req-text";
    txt.textContent = rn.text;

    row.appendChild(status);
    row.appendChild(txt);
    list.appendChild(row);
  }
}

function renderReplayPanel(state) {
  const box = el("replayBox");
  const list = el("replayList");
  if (!box || !list) return;

  if (!state.ui.showReplayPanel) {
    box.classList.add("hidden");
    return;
  }

  const sc = getScenario(state);
  const log = state.captureLog || [];

  box.classList.remove("hidden");
  list.innerHTML = "";

  for (let i = 0; i < sc.turns.length; i++) {
    const pins = (state.pinnedFacts || []).filter(p => p.sourceTurnIndex === i).length;
    const rets = (state.retrievalNotes || []).filter(r => r.sourceTurnIndex === i).length;
    const row = document.createElement("button");
    row.type = "button";
    row.className = "replay-row";
    row.textContent = `Turn ${i + 1}: pinned ${pins} • retrieved ${rets}`;
    if (i === state.turnIndex) row.classList.add("active");
    row.addEventListener("click", () => {
      window.MM_setState({ ...state, turnIndex: i });
    });
    list.appendChild(row);
  }
}

function renderTurn(state) {
  const sc = getScenario(state);
  const notesList = el("notesList");

  if (state.mode !== "running") {
    if (turnMeta) turnMeta.textContent = `Scenario: ${sc.name} • No active run`;
    if (turnUserMsg) turnUserMsg.textContent = "Choose a scenario, then click ‘New Run’ (or ‘Resume’ if available).";
    if (notesList) notesList.innerHTML = `<div class=\"muted\">No active run. Click <strong>New Run</strong> to begin.</div>`;
    const req = el("requiredBox"); if (req) req.classList.add("hidden");
    const rep = el("replayBox"); if (rep) rep.classList.add("hidden");
  

  const btnPrev = el("btnPrevTurn");
    const btnNext = el("btnNextTurn");
    const btnSave = el("btnSaveSnapshot");
    const btnHist = el("btnHistory");
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    if (btnSave) btnSave.disabled = true;
    if (btnHist) btnHist.disabled = true;
    return;
  }

  const turn = getTurn(state);

  if (turnMeta) turnMeta.textContent = `Scenario: ${sc.name} • Turn ${state.turnIndex + 1} / ${sc.turns.length}`;
  if (turnUserMsg) turnUserMsg.textContent = turn.userMsg;

  renderRequiredHints(state);
  renderReplayPanel(state);

  if (!notesList) return;

  notesList.innerHTML = "";

  const requiredSet = new Set(turn.requiresPinned || []);

  for (const note of turn.notes) {
    const card = document.createElement("div");
    card.className = "note";

    const top = document.createElement("div");
    top.className = "note-top";

    const type = document.createElement("div");
    type.className = "note-type";
    const required = requiredSet.has(note.id);
    type.textContent = note.critical ? `${note.type} • critical` : note.type;

    const badge = document.createElement("div");
    badge.className = "pill";
    const captured = isNoteCaptured(state, note.id);
    if (captured) {
      badge.textContent = "Captured";
      badge.classList.add("pill-good");
    } else if (required) {
      badge.textContent = "Required";
      badge.classList.add("pill-warn");
    } else {
      badge.textContent = "New";
    }

    top.appendChild(type);
    top.appendChild(badge);

    const text = document.createElement("div");
    text.className = "note-text";
    text.textContent = note.text;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const disableActions = false; // (Replay panel is informational; keep actions enabled.)

    const btnPin = document.createElement("button");
    btnPin.type = "button";
    btnPin.className = "btn btn-secondary btn-mini";
    btnPin.textContent = "Pin";
    btnPin.disabled = disableActions;
    btnPin.addEventListener("click", () => {
      const next = addMemoryItem(state, "pinnedFacts", {
        text: note.text,
        type: note.type || "Note",
        sourceNoteId: note.id,
        sourceTurnIndex: state.turnIndex
      });
      window.MM_setState(next);
    });

    const btnRoll = document.createElement("button");
    btnRoll.type = "button";
    btnRoll.className = "btn btn-secondary btn-mini";
    btnRoll.textContent = "Roll up";
    btnRoll.disabled = disableActions;
    btnRoll.addEventListener("click", () => {
      const line = `- ${sanitizeText(note.text)}`;
      const current = (state.rollingSummary || "").trim();
      const nextText = current ? (current + "\n" + line) : line;
      const next = {
        ...state,
        rollingSummary: nextText,
        captureLog: [{
          ts: new Date().toISOString(),
          turnIndex: state.turnIndex,
          action: "ROLLUP",
          noteId: note.id,
          text: note.text
        }, ...(state.captureLog || [])].slice(0, 200)
      };
      window.MM_setState(next);
    });

    const btnRet = document.createElement("button");
    btnRet.type = "button";
    btnRet.className = "btn btn-secondary btn-mini";
    btnRet.textContent = "Retrieve";
    btnRet.disabled = disableActions;
    btnRet.addEventListener("click", () => {
      const next = addMemoryItem(state, "retrievalNotes", {
        text: note.text,
        type: note.type || "Note",
        sourceNoteId: note.id,
        sourceTurnIndex: state.turnIndex
      });
      window.MM_setState(next);
    });

    actions.appendChild(btnPin);
    actions.appendChild(btnRoll);
    actions.appendChild(btnRet);

    card.appendChild(top);
    card.appendChild(text);
    card.appendChild(actions);

    notesList.appendChild(card);
  }

  const btnPrev = el("btnPrevTurn");
  const btnNext = el("btnNextTurn");
  if (btnPrev) btnPrev.disabled = state.turnIndex === 0;
  if (btnNext) btnNext.disabled = state.turnIndex >= sc.turns.length - 1;
}

function renderMemory(state) {
  const rolling = el("rollingSummary");
  if (rolling) {
    rolling.value = state.rollingSummary;
    rolling.oninput = (ev) => {
      window.MM_setState({ ...state, rollingSummary: ev.target.value });
    };
  }

  const pinnedList = el("pinnedFactsList");
  if (pinnedList) {
    pinnedList.innerHTML = "";
    (state.pinnedFacts || []).forEach((item) => {
      const row = document.createElement("div");
      row.className = "item";

      const txt = document.createElement("div");
      txt.className = "item-text";
      txt.textContent = `[${item.type}] ${item.text}`;

      const meta = document.createElement("div");
      meta.className = "item-meta muted";
      if (item.sourceTurnIndex !== null && item.sourceTurnIndex !== undefined) {
        meta.textContent = `from turn ${item.sourceTurnIndex + 1}`;
      } else {
        meta.textContent = `manual`;
      }

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "linkbtn";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        const next = prompt("Edit pinned fact:", item.text);
        if (next === null) return;
        window.MM_setState(updateMemoryItem(state, "pinnedFacts", item.id, next));
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "linkbtn danger";
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        window.MM_setState(removeMemoryItem(state, "pinnedFacts", item.id));
      });

      actions.appendChild(edit);
      actions.appendChild(del);

      const wrap = document.createElement("div");
      wrap.className = "item-wrap";
      wrap.appendChild(txt);
      wrap.appendChild(meta);

      row.appendChild(wrap);
      row.appendChild(actions);
      pinnedList.appendChild(row);
    });
  }

  const retrievalSearch = el("retrievalSearch");
  if (retrievalSearch) {
    retrievalSearch.value = state.ui?.retrievalQuery || "";
    retrievalSearch.oninput = (ev) => {
      const nextUi = { ...state.ui, retrievalQuery: ev.target.value };
      setState({ ...state, ui: nextUi }, { persist: state.mode === "running" });
    };
  }

  const tagFilter = el("retrievalTagFilter");
  if (tagFilter) {
    const tags = allRetrievalTags(state);
    const current = state.ui?.retrievalTagFilter || "ALL";
    const options = ["ALL", ...tags];
    tagFilter.innerHTML = "";
    for (const optVal of options) {
      const opt = document.createElement("option");
      opt.value = optVal;
      opt.textContent = optVal === "ALL" ? "All tags" : `#${optVal}`;
      if (optVal === current) opt.selected = true;
      tagFilter.appendChild(opt);
    }
    tagFilter.onchange = (ev) => {
      const nextUi = { ...state.ui, retrievalTagFilter: ev.target.value || "ALL" };
      setState({ ...state, ui: nextUi }, { persist: state.mode === "running" });
    };
  }

  const retrievalList = el("retrievalList");
  if (retrievalList) {
    retrievalList.innerHTML = "";
    const filtered = (state.retrievalNotes || []).filter((item) => matchesRetrievalFilter(state, item));
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = (state.ui?.retrievalQuery || "").trim() || (state.ui?.retrievalTagFilter && state.ui.retrievalTagFilter !== "ALL")
        ? "No retrieval notes match your filter."
        : "No retrieval notes yet.";
      retrievalList.appendChild(empty);
    } else {
      filtered.forEach((item) => {
        const row = document.createElement("div");
        row.className = "item";

        const txt = document.createElement("div");
        txt.className = "item-text";
        txt.textContent = `[${item.type}] ${item.text}`;

        const meta = document.createElement("div");
        meta.className = "item-meta muted";
        if (item.sourceTurnIndex !== null && item.sourceTurnIndex !== undefined) {
          meta.textContent = `from turn ${item.sourceTurnIndex + 1}`;
        } else {
          meta.textContent = `manual`;
        }

        const tagsWrap = document.createElement("div");
        tagsWrap.className = "tags";
        (item.tags || []).forEach((t) => {
          const chip = document.createElement("span");
          chip.className = "tagchip";
          chip.textContent = `#${t}`;
          tagsWrap.appendChild(chip);
        });

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "linkbtn";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
          const next = prompt("Edit retrieval note:", item.text);
          if (next === null) return;
          window.MM_setState(updateMemoryItem(state, "retrievalNotes", item.id, next));
        });

        const tagBtn = document.createElement("button");
        tagBtn.type = "button";
        tagBtn.className = "linkbtn";
        tagBtn.textContent = "Tags";
        tagBtn.addEventListener("click", () => {
          const current = (item.tags || []).join(", ");
          const next = prompt("Tags (comma-separated). Example: vendor, dates, risks", current);
          if (next === null) return;
          const tags = normalizeTags(next);
          window.MM_setState(updateRetrievalTags(state, item.id, tags));
        });

        const del = document.createElement("button");
        del.type = "button";
        del.className = "linkbtn danger";
        del.textContent = "Remove";
        del.addEventListener("click", () => {
          window.MM_setState(removeMemoryItem(state, "retrievalNotes", item.id));
        });

        actions.appendChild(edit);
        actions.appendChild(tagBtn);
        actions.appendChild(del);

        const wrap = document.createElement("div");
        wrap.className = "item-wrap";
        wrap.appendChild(txt);
        wrap.appendChild(meta);
        if ((item.tags || []).length) wrap.appendChild(tagsWrap);

        row.appendChild(wrap);
        row.appendChild(actions);
        retrievalList.appendChild(row);
      });
    }
  }

// Disable workspace controls when no run is active
  const running = state.mode === "running";
  const pinInput = el("pinnedFactInput");
  const addPin = el("btnAddPinned");
  const retInput = el("retrievalInput");
  const addRet = el("btnAddRetrieval");
  const retSearch = el("retrievalSearch");
  const retTag = el("retrievalTagFilter");
  const btnExport = el("btnExport");
  const btnCopy = el("btnCopyExport");
  const btnExportRun = el("btnExportRun");
  const btnImportRun = el("btnImportRun");

  if (rolling) rolling.disabled = !running;
  if (pinInput) pinInput.disabled = !running;
  if (addPin) addPin.disabled = !running;
  if (retInput) retInput.disabled = !running;
  if (addRet) addRet.disabled = !running;
  if (retSearch) retSearch.disabled = !running;
  if (retTag) retTag.disabled = !running;
  if (btnExport) btnExport.disabled = !running;
  if (btnCopy) btnCopy.disabled = !running;
  if (btnExportRun) btnExportRun.disabled = !running;
  if (btnImportRun) btnImportRun.disabled = false;

}

function renderExport(state) {
  const exportBox = el("exportBox");
  const exportText = el("exportText");
  if (!exportBox || !exportText) return;
  if (state.mode !== "running") {
    exportBox.classList.add("hidden");
    exportText.textContent = "";
    return;
  }
  if (exportBox.classList.contains("hidden")) return;
  exportText.textContent = exportBlock(state);
}

function renderScores(state) {
  const scores = computeScores(state);
  const conflicts = computeConflicts(state);

  const c = el("scoreContinuity");
  const b = el("scoreBloat");
  const d = el("scoreDrift");
  const x = el("scoreConflicts");
  const btnX = el("btnConflicts");

  if (scores.continuity === null || scores.bloat === null || state.mode !== "running") {
    if (c) c.textContent = "—";
    if (b) b.textContent = "—";
    if (d) d.textContent = "—";
    if (x) x.textContent = "—";
    if (btnX) btnX.disabled = true;
  } else {
    if (c) c.textContent = `${scores.continuity}/100`;
    if (b) b.textContent = `${scores.bloat}/100`;
    if (d) d.textContent = scores.driftRisk;
    if (x) x.textContent = String(conflicts.length);
    if (btnX) btnX.disabled = conflicts.length === 0;
  }

  const banner = el("bannerDrift");
  const bannerText = el("bannerDriftText");
  if (banner && bannerText) {
    if (state.mode === "running" && scores.missingCritical.length) {
      banner.classList.remove("hidden");
      bannerText.textContent = "Pin the missing critical decision(s) before you move on: " + scores.missingCritical.join(" • ");
    } else {
      banner.classList.add("hidden");
      bannerText.textContent = "";
    }
  }
}

function rerender(state) {
  renderResumeButton();
  renderScenarioSelect(state);
  renderTurn(state);
  renderMemory(state);
  renderExport(state);
  renderScores(state);
  renderSnapshotModal(state); // keep modal content synced if open
  renderConflictModal(state);
}

/* -----------------------------
   Snapshot Modal UI
------------------------------ */
let modalState = { open:false, compareA:null, compareB:null };

let conflictModalState = { open:false };

function openConflictModal() {
  conflictModalState.open = true;
  const m = el("conflictModal");
  if (m) m.classList.remove("hidden");
  const closeBtn = el("btnCloseConflicts");
  if (closeBtn) closeBtn.focus();
}

function closeConflictModal() {
  conflictModalState.open = false;
  const m = el("conflictModal");
  if (m) m.classList.add("hidden");
}

function applyPinnedToSummary(state, conflict) {
  const lines = (state.rollingSummary || "").split(/\n/g);
  const idx = conflict.summaryLineIndex;
  if (idx < 0 || idx >= lines.length) return state;
  // Preserve existing key prefix up to delimiter if possible
  const line = lines[idx];
  const prefixMatch = line.match(new RegExp('^(.*' + escapeRegExp(conflict.key) + '\\s*[:＝=\\-—]\\s*).+$', 'i'));
  const prefix = prefixMatch ? prefixMatch[1] : (conflict.key + ": ");
  lines[idx] = prefix + conflict.pinnedValue;
  return { ...state, rollingSummary: lines.join("\n") };
}

function applySummaryToPinned(state, conflict) {
  const pins = (state.pinnedFacts || []).map(p => {
    if (p.id !== conflict.pinnedItemId) return p;
    const prefixMatch = p.text.match(new RegExp('^(.*' + escapeRegExp(conflict.key) + '\\s*[:＝=\\-—]\\s*).+$', 'i'));
    const prefix = prefixMatch ? prefixMatch[1] : (conflict.key + ": ");
    return { ...p, text: prefix + conflict.summaryValue };
  });
  return { ...state, pinnedFacts: pins };
}

function renderConflictModal(state) {
  const m = el("conflictModal");
  if (!m || m.classList.contains("hidden")) return;

  const list = el("conflictList");
  if (!list) return;

  const conflicts = computeConflicts(state);
  list.innerHTML = "";

  if (!conflicts.length) {
    const ok = document.createElement("div");
    ok.className = "muted";
    ok.textContent = "No conflicts detected.";
    list.appendChild(ok);
    return;
  }

  for (const c of conflicts) {
    const card = document.createElement("div");
    card.className = "conflict-item";

    const head = document.createElement("div");
    head.className = "conflict-head";

    const key = document.createElement("div");
    key.className = "conflict-key";
    key.textContent = c.key;

    const badge = document.createElement("div");
    badge.className = "pill pill-warn";
    badge.textContent = "Mismatch";

    head.appendChild(key);
    head.appendChild(badge);

    const body = document.createElement("div");
    body.className = "conflict-body";

    const rowA = document.createElement("div");
    rowA.className = "conflict-row";
    const rowALabel = document.createElement("div");
    rowALabel.className = "muted small";
    rowALabel.textContent = "Pinned Fact";
    const rowAVal = document.createElement("div");
    const rowAValStrong = document.createElement("strong");
    rowAValStrong.textContent = c.pinnedValue;
    rowAVal.appendChild(rowAValStrong);
    rowA.appendChild(rowALabel);
    rowA.appendChild(rowAVal);

    const rowB = document.createElement("div");
    rowB.className = "conflict-row";
    const rowBLabel = document.createElement("div");
    rowBLabel.className = "muted small";
    rowBLabel.textContent = "Rolling Summary";
    const rowBVal = document.createElement("div");
    const rowBValStrong = document.createElement("strong");
    rowBValStrong.textContent = c.summaryValue;
    rowBVal.appendChild(rowBValStrong);
    rowB.appendChild(rowBLabel);
    rowB.appendChild(rowBVal);

    const actions = document.createElement("div");
    actions.className = "conflict-actions";

    const btn1 = document.createElement("button");
    btn1.type = "button";
    btn1.className = "btn btn-secondary btn-mini";
    btn1.textContent = "Replace summary";
    btn1.addEventListener("click", () => {
      window.MM_setState(applyPinnedToSummary(state, c));
    });

    const btn2 = document.createElement("button");
    btn2.type = "button";
    btn2.className = "btn btn-secondary btn-mini";
    btn2.textContent = "Update pinned";
    btn2.addEventListener("click", () => {
      window.MM_setState(applySummaryToPinned(state, c));
    });

    actions.appendChild(btn1);
    actions.appendChild(btn2);

    body.appendChild(rowA);
    body.appendChild(rowB);
    body.appendChild(actions);

    card.appendChild(head);
    card.appendChild(body);
    list.appendChild(card);
  }
}


function openSnapshotModal() {
  modalState.open = true;
  modalState.compareA = null;
  modalState.compareB = null;
  const m = el("snapshotModal");
  if (m) m.classList.remove("hidden");
  const closeBtn = el("btnCloseSnapshots");
  if (closeBtn) closeBtn.focus();
}

function closeSnapshotModal() {
  modalState.open = false;
  const m = el("snapshotModal");
  if (m) m.classList.add("hidden");
}

function renderSnapshotModal(state) {
  const m = el("snapshotModal");
  if (!m || m.classList.contains("hidden")) return;

  const list = el("snapshotList");
  const diffBox = el("snapshotDiff");
  const diffTitle = el("snapshotDiffTitle");
  const diffBody = el("snapshotDiffBody");

  if (!list || !diffBox || !diffTitle || !diffBody) return;

  const snaps = state.snapshots || [];
  list.innerHTML = "";

  if (!snaps.length) {
    list.innerHTML = `<div class="muted">No snapshots yet. Use “Save Snapshot” after a turn.</div>`;
    diffBox.classList.add("hidden");
    return;
  }

  for (const s of snaps) {
    const row = document.createElement("div");
    row.className = "snap-row";

    const label = document.createElement("div");
    label.className = "snap-label";
    label.textContent = snapshotLabel(s);

    const actions = document.createElement("div");
    actions.className = "snap-actions";

    const btnRestore = document.createElement("button");
    btnRestore.type = "button";
    btnRestore.className = "btn btn-secondary btn-mini";
    btnRestore.textContent = "Restore";
    btnRestore.addEventListener("click", () => {
      if (!confirm("Restore this snapshot?")) return;
      closeSnapshotModal();
      window.MM_setState(restoreSnapshot(state, s.id));
    });

    const a = document.createElement("button");
    a.type = "button";
    a.className = "btn btn-secondary btn-mini";
    a.textContent = modalState.compareA === s.id ? "A ✓" : "Set A";
    a.addEventListener("click", () => {
      modalState.compareA = s.id;
      renderSnapshotModal(state);
    });

    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-secondary btn-mini";
    b.textContent = modalState.compareB === s.id ? "B ✓" : "Set B";
    b.addEventListener("click", () => {
      modalState.compareB = s.id;
      renderSnapshotModal(state);
    });

    actions.appendChild(btnRestore);
    actions.appendChild(a);
    actions.appendChild(b);

    row.appendChild(label);
    row.appendChild(actions);
    list.appendChild(row);
  }

  // Diff view
  const aId = modalState.compareA;
  const bId = modalState.compareB;
  if (aId && bId && aId !== bId) {
    const aSnap = snaps.find(x => x.id === aId);
    const bSnap = snaps.find(x => x.id === bId);
    if (aSnap && bSnap) {
      const diff = computeSnapshotDiff(aSnap, bSnap);
      diffBox.classList.remove("hidden");
      diffTitle.textContent = `Diff: A → B`;

      const lines = [];
      lines.push("Rolling summary:");
      if (!diff.rolling.added.length && !diff.rolling.removed.length) lines.push("  (no changes)");
      for (const x of diff.rolling.removed) lines.push(`  - ${x}`);
      for (const x of diff.rolling.added) lines.push(`  + ${x}`);

      lines.push("");
      lines.push("Pinned facts:");
      if (!diff.pinned.added.length && !diff.pinned.removed.length) lines.push("  (no changes)");
      for (const x of diff.pinned.removed) lines.push(`  - ${x}`);
      for (const x of diff.pinned.added) lines.push(`  + ${x}`);

      lines.push("");
      lines.push("Retrieval memory:");
      if (!diff.retrieval.added.length && !diff.retrieval.removed.length) lines.push("  (no changes)");
      for (const x of diff.retrieval.removed) lines.push(`  - ${x}`);
      for (const x of diff.retrieval.added) lines.push(`  + ${x}`);

      diffBody.textContent = lines.join("\n");
    } else {
      diffBox.classList.add("hidden");
    }
  } else {
    diffBox.classList.add("hidden");
  }
}

/* -----------------------------
   Resume handling (do not auto-resume on load)
------------------------------ */
let resumeCandidate = null;

function renderResumeButton() {
  const btn = el("btnResumeRun");
  if (!btn) return;
  if (resumeCandidate) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

/* -----------------------------
   Event wiring
------------------------------ */
let state = null;
function setState(next, opts = {}) {
  const persist = opts.persist !== false;
  state = next;
  if (persist && state.mode === "running") saveRunState(state);
  rerender(state);
}

window.MM_setState = setState;

function wireActions() {
  const sel = el("scenarioSelect");
  if (sel) {
    sel.onchange = (ev) => {
      const nextScenario = ev.target.value;
      savePrefs({ scenarioId: nextScenario, ui: { showRequiredHints: state.ui.showRequiredHints, showReplayPanel: state.ui.showReplayPanel } });
      if (state.mode === "running") {
        const ok = confirm("Switch scenario and start a new run? This will clear the current run.");
        if (!ok) { ev.target.value = state.scenarioId; return; }
        clearSavedRunState();
        resumeCandidate = null;
        setState(newRunState({ scenarioId: nextScenario, ui: state.ui }), { persist: true });
      } else {
        setState({ ...state, scenarioId: nextScenario }, { persist: false });
      }
    };
  }

  const btnTheme = el("btnTheme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  const btnNew = el("btnNewRun");
  if (btnNew) btnNew.addEventListener("click", () => {
    const chosen = (el("scenarioSelect") && el("scenarioSelect").value) ? el("scenarioSelect").value : state.scenarioId;
    savePrefs({ scenarioId: chosen, ui: { showRequiredHints: state.ui.showRequiredHints, showReplayPanel: state.ui.showReplayPanel } });
    clearSavedRunState();
    resumeCandidate = null;
    setState(newRunState({ scenarioId: chosen, ui: state.ui }), { persist: true });
  });

  const btnReset = el("btnResetRun");
  if (btnReset) btnReset.addEventListener("click", () => {
    if (state.mode !== "running") {
      if (!resumeCandidate) { alert("Nothing to reset. Click New Run to begin."); return; }
      const ok = confirm("Clear the saved run data from this browser?");
      if (!ok) return;
      clearSavedRunState();
      resumeCandidate = null;
      setState(state, { persist: false });
      return;
    }
    if (!confirm("Reset memory for this run? This clears Rolling Summary, Pinned Facts, and Retrieval Memory.")) return;
    setState({ ...state, rollingSummary: "", pinnedFacts: [], retrievalNotes: [], captureLog: [] }, { persist: true });
  });


const btnResume = el("btnResumeRun");
if (btnResume) btnResume.addEventListener("click", () => {
  const saved = loadSavedRunState();
  if (!saved) {
    alert("No saved run found in this browser.");
    resumeCandidate = null;
    rerender(state);
    return;
  }
  resumeCandidate = null;
  setState(saved, { persist: true });
});

  const btnPrev = el("btnPrevTurn");
  if (btnPrev) btnPrev.addEventListener("click", () => {
    setState({ ...state, turnIndex: Math.max(0, state.turnIndex - 1) });
  });

  const btnNext = el("btnNextTurn");
  if (btnNext) btnNext.addEventListener("click", () => {
    const sc = getScenario(state);
    const scores = computeScores(state);
    if (scores.missingCritical.length) {
      const proceed = confirm("Drift risk is HIGH because critical decisions are not pinned. Move on anyway?");
      if (!proceed) return;
    }
    setState({ ...state, turnIndex: Math.min(sc.turns.length - 1, state.turnIndex + 1) });
  });

  const btnAddPinned = el("btnAddPinned");
  const pinnedInput = el("pinnedFactInput");
  if (btnAddPinned && pinnedInput) {
    btnAddPinned.addEventListener("click", () => {
      const next = addMemoryItem(state, "pinnedFacts", {
        text: pinnedInput.value,
        type: "Pinned",
        sourceNoteId: null,
        sourceTurnIndex: null
      });
      pinnedInput.value = "";
      setState(next);
    });
  }

  const btnAddRet = el("btnAddRetrieval");
  const retInput = el("retrievalInput");
  if (btnAddRet && retInput) {
    btnAddRet.addEventListener("click", () => {
      const next = addMemoryItem(state, "retrievalNotes", {
        text: retInput.value,
        type: "Retrieval",
        sourceNoteId: null,
        sourceTurnIndex: null
      });
      retInput.value = "";
      setState(next);
    });
  }

  const btnSave = el("btnSaveSnapshot");
  if (btnSave) btnSave.addEventListener("click", () => {
    setState(saveSnapshot(state));
    alert("Snapshot saved.");
  });

  const btnHistory = el("btnHistory");
  if (btnHistory) btnHistory.addEventListener("click", () => {
    openSnapshotModal();
    renderSnapshotModal(state);
  });

  const btnClose = el("btnCloseSnapshots");
  if (btnClose) btnClose.addEventListener("click", closeSnapshotModal);

  const backdrop = el("snapshotBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeSnapshotModal);

  const btnExport = el("btnExport");
  const exportBox = el("exportBox");
  if (btnExport && exportBox) {
    btnExport.addEventListener("click", () => {
      exportBox.classList.toggle("hidden");
      rerender(state);
    });
  }

  const btnCopy = el("btnCopyExport");
  if (btnCopy) {
    btnCopy.addEventListener("click", async () => {
      try {
        const txt = exportBlock(state);
        await navigator.clipboard.writeText(txt);
        alert("Copied to clipboard.");
      } catch (e) {
        alert("Copy failed (browser permission). You can still open Export and copy manually.");
      }
    });
  }


  const btnExportRun = el("btnExportRun");
  if (btnExportRun) {
    btnExportRun.addEventListener("click", () => {
      const txt = exportRunJSON(state);
      if (!txt) {
        alert("No active run to export. Click New Run or Resume first.");
        return;
      }
      const fname = `memory-mixer-run_${APP_VERSION}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      downloadTextFile(fname, txt, "application/json");
    });
  }

  const btnImportRun = el("btnImportRun");
  const fileImport = el("fileImportRun");
  if (btnImportRun && fileImport) {
    btnImportRun.addEventListener("click", () => fileImport.click());
    fileImport.addEventListener("change", async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        const run = readImportedRunPayload(payload);
        if (!run) throw new Error("Unrecognized run file format.");
        const next = normalizeRunState(run);
        // Move into running mode and persist immediately
        setState(next, { persist: true });
        alert("Run imported.");
      } catch (e) {
        alert("Import failed: " + (e?.message || "invalid JSON"));
      } finally {
        fileImport.value = "";
      }
    });
  }

  const btnConflicts = el("btnConflicts");
  if (btnConflicts) btnConflicts.addEventListener("click", () => {
    openConflictModal();
    renderConflictModal(state);
  });

  const btnCloseConflicts = el("btnCloseConflicts");
  if (btnCloseConflicts) btnCloseConflicts.addEventListener("click", closeConflictModal);

  const conflictBackdrop = el("conflictBackdrop");
  if (conflictBackdrop) conflictBackdrop.addEventListener("click", closeConflictModal);

  const toggleHints = el("toggleHints");
  if (toggleHints) {
    toggleHints.checked = !!state.ui.showRequiredHints;
    toggleHints.addEventListener("change", (ev) => {
      const nextUi = { ...state.ui, showRequiredHints: !!ev.target.checked };
      savePrefs({ scenarioId: state.scenarioId, ui: { showRequiredHints: nextUi.showRequiredHints, showReplayPanel: nextUi.showReplayPanel } });
      setState({ ...state, ui: nextUi }, { persist: state.mode === "running" });
    });
  }

  const toggleReplay = el("toggleReplay");
  if (toggleReplay) {
    toggleReplay.checked = !!state.ui.showReplayPanel;
    toggleReplay.addEventListener("change", (ev) => {
      const nextUi = { ...state.ui, showReplayPanel: !!ev.target.checked };
      savePrefs({ scenarioId: state.scenarioId, ui: { showRequiredHints: nextUi.showRequiredHints, showReplayPanel: nextUi.showReplayPanel } });
      setState({ ...state, ui: nextUi }, { persist: state.mode === "running" });
    });
  }

  // Esc to close modal
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { closeSnapshotModal(); closeConflictModal(); }
  });
}

/* -----------------------------
   Boot
------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getPreferredTheme());
  setStatusPills();

  const prefs = loadPrefs();
  resumeCandidate = loadSavedRunState();

  // Start in a blank "idle" screen; do not auto-resume.
  state = blankState({ scenarioId: prefs.scenarioId, ui: prefs.ui });

  wireActions();
  rerender(state);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resumeCandidate = loadSavedRunState();
      if (state.mode === "running") {
        const saved = loadSavedRunState();
        if (saved) state = saved;
      }
      rerender(state);
    }
  });
});
