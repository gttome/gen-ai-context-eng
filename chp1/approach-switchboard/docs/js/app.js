/* Approach Switchboard logic (Chapter 1 grounded)
   - Ask 6–10 diagnostic toggles
   - Recommend: Basic prompting, Context engineering, RAG / Retrieval, Fine-tuning
   - Provide “Why” and “What to do next” checklist
*/

const STATE_KEY = "approach_switchboard_state_v1";
const HISTORY_KEY = "approach_switchboard_history_v1";
const MODE_DEFAULT = "simple";
const TOUR_DONE_KEY = "asw_tour_done_v1";
const TOUR_SUPPRESS_KEY = "asw_tour_suppress_v1";

// In Simple mode we show only the core signals to reduce overwhelm.
const CORE_SIGNAL_IDS = new Set([
  "reexplaining",
  "not_grounded",
  "forgets_constraints",
  "needs_structure",
  "output_wrong"
]);

const DEMOS = {
  oneoff_email: {
    name: "One-off email",
    scenario: "one_off",
    mode: "simple",
    toggles: {
      needs_structure: true
    }
  },
  policy_grounded: {
    name: "Policy-grounded answer",
    scenario: "enterprise_policy",
    mode: "simple",
    toggles: {
      not_grounded: true,
      output_wrong: true,
      forgets_constraints: true
    }
  },
  multi_turn_project: {
    name: "Multi-turn project",
    scenario: "multi_turn",
    mode: "simple",
    toggles: {
      reexplaining: true,
      forgets_constraints: true,
      needs_structure: true,
      token_overload: true
    }
  }
};


const APPROACHES = {
  prompting: {
    title: "Basic prompting",
    whyTemplate: [
      "This looks like a one-off / low-risk task with no special facts required."
    ],
    doNext: [
      "Write a clear instruction (what you want).",
      "Specify the output format (headings, bullets, etc.).",
      "Add 1–2 examples only if needed."
    ]
  },
  context: {
    title: "Context engineering",
    whyTemplate: [
      "You need reliability: the model should consistently follow rules, use the right facts, and keep continuity."
    ],
    doNext: [
      "Define the role (system instruction) and the non‑negotiable rules/constraints.",
      "Add the minimum relevant facts and/or policy excerpts needed for correctness.",
      "Include only necessary memory for continuity (avoid dumping history).",
      "Add 1–2 examples and an explicit output structure (schema/format).",
      "Iterate: test → evaluate → adjust → re-test."
    ]
  },
  rag: {
    title: "RAG / retrieval (grounded answers)",
    whyTemplate: [
      "The answer depends on information that may be unknown to the model or changes over time."
    ],
    doNext: [
      "Find 2–6 short, relevant excerpts from approved sources (avoid dumping whole documents).",
      "Insert those excerpts into the context as grounding knowledge.",
      "Ask the model to answer using only the provided excerpts and to say when they are insufficient.",
      "Keep constraints and output format explicit."
    ]
  },
  finetune: {
    title: "Fine-tuning (plus context engineering)",
    whyTemplate: [
      "You need consistent behavior across many similar tasks and you have high-quality labeled data."
    ],
    doNext: [
      "Confirm you have enough high-quality labeled examples for the behavior you want.",
      "Fine-tune outside the chat (or use adapters).",
      "Still use context engineering for dynamic facts and safety/constraint rules.",
      "Validate on a held-out test set before broad use."
    ]
  }
};

const SCENARIOS = {
  one_off: { name: "One-off question (low risk)", base: { prompting: 3, context: 0, rag: 0, finetune: 0 } },
  enterprise_policy: { name: "Enterprise policy / approved knowledge", base: { prompting: 0, context: 2, rag: 3, finetune: 0 } },
  multi_turn: { name: "Multi-turn work", base: { prompting: 0, context: 3, rag: 1, finetune: 0 } },
  strict_structure: { name: "Strict structure / reusable outputs", base: { prompting: 1, context: 3, rag: 1, finetune: 0 } }
};

// Signals grounded in Chapter 1 “Signals that you need more than basic prompting” + decision guide
const SIGNALS = [
  {
    id: "reexplaining",
    title: "You keep re-explaining the same background every time you ask a question",
    desc: "A strong signal you need reusable context components instead of rewriting the same background each time.",
    weights: { prompting: -1, context: 2, rag: 0, finetune: 0 }
  },
  {
    id: "not_grounded",
    title: "Answers are plausible but not grounded in your organization’s information (policies, products, internal terms)",
    desc: "If the correct facts live in policies/products/internal terms, provide short, relevant excerpts and/or curated facts in context.",
    weights: { prompting: -1, context: 1, rag: 3, finetune: 0 }
  },
  {
    id: "forgets_constraints",
    title: "The model forgets earlier constraints (“Use only these rules…”) or contradicts itself across turns",
    desc: "Move non-negotiable rules higher in the context and include only the continuity memory needed for the task.",
    weights: { prompting: -1, context: 3, rag: 0, finetune: 0 }
  },
  {
    id: "needs_structure",
    title: "You need outputs in a structure that another person or tool can reuse (consistent headings, fields, checklists)",
    desc: "Standardize the output format (schema) so outputs are predictable and reusable.",
    weights: { prompting: 0, context: 3, rag: 0, finetune: 0 }
  },
  {
    id: "output_generic",
    title: "Output is generic (missing key facts, constraints, or examples)",
    desc: "Improve input quality: add the minimum specific facts, constraints, and 1–2 examples that truly matter for this task.",
    weights: { prompting: 0, context: 2, rag: 0, finetune: 0 }
  },
  {
    id: "output_wrong",
    title: "Output is wrong (needs grounding or you have conflicting instructions)",
    desc: "Ground the model: provide short, relevant reference excerpts, remove instruction conflicts, and restate non-negotiable rules.",
    weights: { prompting: -1, context: 2, rag: 3, finetune: 0 }
  },
  {
    id: "output_inconsistent",
    title: "If the output is inconsistent, you likely failed to standardize format (schema) or provide repeatable context components",
    desc: "Use a stable output structure and repeatable context blocks to improve consistency.",
    weights: { prompting: 0, context: 3, rag: 0, finetune: 0 }
  },
  {
    id: "token_overload",
    title: "Context is getting too large (token budget / working memory limits)",
    desc: "Reduce and structure: prune, summarize, and (when needed) retrieve only targeted excerpts so the model can focus on what matters.",
    weights: { prompting: -1, context: 2, rag: 3, finetune: 0 }
  },
  {
    id: "perfect_prompt_belief",
    title: "I believe a perfect prompt should be enough",
    desc: "Common misconception: real work often needs specific facts, constraints, or history provided as context.",
    weights: { prompting: 1, context: 0, rag: 0, finetune: 0 },
    misconceptionFlag: true
  }
];

function getEl(id) { return document.getElementById(id); }

function normalizeState(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    scenario: typeof s.scenario === "string" ? s.scenario : "one_off",
    toggles: (s.toggles && typeof s.toggles === "object") ? s.toggles : {},
    mode: (s.mode === "advanced" || s.mode === "simple") ? s.mode : MODE_DEFAULT
  };
}

function setMode(mode, state) {
  const next = (mode === "advanced") ? "advanced" : "simple";
  state.mode = next;
  try { document.documentElement.setAttribute("data-mode", next); } catch {}

  const bS = getEl("btnModeSimple");
  const bA = getEl("btnModeAdvanced");
  if (bS && bA) {
    bS.setAttribute("aria-selected", next === "simple" ? "true" : "false");
    bA.setAttribute("aria-selected", next === "advanced" ? "true" : "false");
  }

  saveState(state);
  buildToggleList(state);
  updateRecommendation(state);

  // Keep compare selects in sync if switching to Advanced.
  if (next === "advanced") {
    const history = normalizeHistory(loadHistory());
    renderHistoryList(history);
    populateCompareSelects(history, state);
    updateCompare(history, state);
  }
}

function visibleSignalsFor(state) {
  if (state.mode === "advanced") return SIGNALS;
  return SIGNALS.filter(s => CORE_SIGNAL_IDS.has(s.id));
}

function applyDemo(demoId, state) {
  const demo = DEMOS[demoId];
  if (!demo) return;

  state.scenario = demo.scenario;
  state.toggles = { ...(demo.toggles || {}) };
  setMode(demo.mode || "simple", state);

  const sel = getEl("scenarioSelect");
  if (sel) sel.value = state.scenario;

  saveState(state);
  updateRecommendation(state);

  // Scroll to recommendation to show the result immediately.
  const rec = getEl("recCard");
  if (rec) rec.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}


function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

function snapshotFromState(state) {
  const totals = score(state);
  const { bestKey, runnerKey, conf, entries } = pickRecommendation(totals);
  return {
    id: Date.now(),
    createdAt: Date.now(),
    scenario: state.scenario,
    toggles: { ...state.toggles },
    bestKey,
    runnerKey,
    conf: Math.round(conf),
    totals,
    scoreboard: entries,
    summaryText: buildExportText(state)
  };
}

function normalizeHistory(history) {
  // Keep most recent first, max 10
  const list = Array.isArray(history) ? history : [];
  const dedup = [];
  const seen = new Set();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const id = item.id ?? item.createdAt ?? Math.random();
    if (seen.has(id)) continue;
    seen.add(id);
    dedup.push(item);
  }
  dedup.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  return dedup.slice(0, 10);
}


function makeSnapLabel(snap) {
  try {
    const bestName = APPROACHES[snap.bestKey]?.title || snap.bestKey || "—";
    const scenarioName = SCENARIOS[snap.scenario]?.name || snap.scenario || "—";
    const when = formatTime(snap.createdAt || snap.id);
    const conf = (snap.conf != null ? `${snap.conf}%` : "—");
    return `${when} • ${bestName} • ${scenarioName} • ${conf}`;
  } catch {
    return "Snapshot";
  }
}

function getSnapBySelectValue(history, value, state) {
  if (value === "__current__") {
    return snapshotFromState(state);
  }
  const idNum = Number(value);
  const found = history.find(h => (h && Number(h.id) === idNum) || (h && Number(h.createdAt) === idNum));
  if (!found) return snapshotFromState(state);
  // Ensure fields exist
  const totals = found.totals || score({ scenario: found.scenario || "one_off", toggles: { ...(found.toggles || {}) } });
  const { bestKey, runnerKey, conf, entries } = pickRecommendation(totals);
  return {
    ...found,
    id: found.id ?? found.createdAt ?? Date.now(),
    createdAt: found.createdAt ?? found.id ?? Date.now(),
    scenario: found.scenario || "one_off",
    toggles: { ...(found.toggles || {}) },
    totals,
    bestKey: found.bestKey || bestKey,
    runnerKey: found.runnerKey || runnerKey,
    conf: found.conf ?? Math.round(conf),
    scoreboard: found.scoreboard || entries
  };
}

function populateCompareSelects(history, state) {
  const a = getEl("compareA");
  const b = getEl("compareB");
  if (!a || !b) return;

  const prevA = a.value || "__current__";
  const prevB = b.value || "__current__";

  const opts = [{ value: "__current__", label: "Current state" }]
    .concat(history.map(h => ({ value: String(h.id ?? h.createdAt ?? ""), label: makeSnapLabel(h) })));

  function fill(selectEl, preferred) {
    selectEl.innerHTML = "";
    for (const o of opts) {
      if (!o.value) continue;
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      selectEl.appendChild(opt);
    }
    // restore if possible
    const values = opts.map(x => x.value);
    selectEl.value = values.includes(preferred) ? preferred : "__current__";
  }

  fill(a, prevA);
  fill(b, prevB);

  // reasonable defaults: left=current, right=most recent snapshot (if available)
  if (!history.length) {
    a.value = "__current__";
    b.value = "__current__";
  } else if (a.value === "__current__" && b.value === "__current__") {
    b.value = String(history[0].id ?? history[0].createdAt);
  }
}

function renderCompareResults(leftSnap, rightSnap) {
  const results = getEl("compareResults");
  const scoreRows = getEl("compareScoreRows");
  const signalList = getEl("compareSignalList");
  if (!results || !scoreRows || !signalList) return;

  results.classList.remove("hidden");

  // Score deltas
  scoreRows.innerHTML = "";
  const keys = ["prompting", "context", "rag", "finetune"];
  for (const k of keys) {
    const row = document.createElement("div");
    row.className = "t-row t-4";
    row.setAttribute("role","row");

    const c1 = document.createElement("div");
    c1.className = "t-cell";
    c1.setAttribute("role","cell");
    c1.textContent = APPROACHES[k].title;

    const left = Number(leftSnap.totals?.[k] ?? 0);
    const right = Number(rightSnap.totals?.[k] ?? 0);
    const delta = right - left;

    const c2 = document.createElement("div");
    c2.className = "t-cell t-num";
    c2.setAttribute("role","cell");
    c2.textContent = String(left);

    const c3 = document.createElement("div");
    c3.className = "t-cell t-num";
    c3.setAttribute("role","cell");
    c3.textContent = String(right);

    const c4 = document.createElement("div");
    c4.className = "t-cell t-num";
    c4.setAttribute("role","cell");
    c4.textContent = (delta > 0 ? `+${delta}` : String(delta));
    if (delta > 0) c4.classList.add("delta-pos");
    if (delta < 0) c4.classList.add("delta-neg");

    row.appendChild(c1);
    row.appendChild(c2);
    row.appendChild(c3);
    row.appendChild(c4);
    scoreRows.appendChild(row);
  }

  // Signals changed
  signalList.innerHTML = "";
  const diffs = [];
  for (const s of SIGNALS) {
    const l = !!(leftSnap.toggles || {})[s.id];
    const r = !!(rightSnap.toggles || {})[s.id];
    if (l !== r) diffs.push({ s, l, r });
  }

  if (!diffs.length) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "No signal differences. The states are equivalent for this decision logic.";
    signalList.appendChild(p);
    return;
  }

  for (const d of diffs) {
    const item = document.createElement("div");
    item.className = "compare-signal-item";

    const title = document.createElement("p");
    title.className = "compare-signal-title";
    title.textContent = d.s.title;

    const desc = document.createElement("p");
    desc.className = "compare-signal-desc";
    desc.textContent = d.s.desc;

    const badges = document.createElement("div");
    badges.className = "badges";

    const b1 = document.createElement("span");
    b1.className = "badge " + (d.l ? "badge-on" : "badge-off");
    b1.textContent = `Left: ${d.l ? "ON" : "OFF"}`;

    const b2 = document.createElement("span");
    b2.className = "badge " + (d.r ? "badge-on" : "badge-off");
    b2.textContent = `Right: ${d.r ? "ON" : "OFF"}`;

    badges.appendChild(b1);
    badges.appendChild(b2);

    item.appendChild(title);
    item.appendChild(desc);
    item.appendChild(badges);
    signalList.appendChild(item);
  }
}

function renderHistory(history, state) {
  const root = getEl("historyList");
  if (!root) return;

  root.innerHTML = "";

  if (!history.length) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "No snapshots yet. Click “Save Snapshot” to store the current decision.";
    root.appendChild(p);
    return;
  }

  for (const snap of history) {
    const item = document.createElement("div");
    item.className = "history-item";

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const title = document.createElement("p");
    title.className = "history-title";
    const scenarioName = SCENARIOS[snap.scenario]?.name || snap.scenario || "—";
    const bestName = APPROACHES[snap.bestKey]?.title || snap.bestKey || "—";
    title.textContent = `${bestName}`;

    const sub = document.createElement("p");
    sub.className = "history-sub";
    sub.textContent = `${formatTime(snap.createdAt)} • ${scenarioName} • ${snap.conf ?? "—"}%`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const btnLoad = document.createElement("button");
    btnLoad.className = "btn-mini";
    btnLoad.type = "button";
    btnLoad.textContent = "Load";
    btnLoad.addEventListener("click", () => {
      state.scenario = snap.scenario || "one_off";
      state.toggles = { ...(snap.toggles || {}) };
      saveState(state);

      const sel = getEl("scenarioSelect");
      if (sel) sel.value = state.scenario;

      // Update checkboxes without rebuilding everything
      for (const s of SIGNALS) {
        const cb = getEl(`t_${s.id}`);
        if (cb) cb.checked = !!state.toggles[s.id];
      }

      updateRecommendation(state);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn-mini";
    btnCopy.type = "button";
    btnCopy.textContent = "Copy";
    btnCopy.addEventListener("click", async () => {
      const ok = await copyToClipboard(String(snap.summaryText || ""));
      btnCopy.textContent = ok ? "Copied!" : "Copy failed";
      setTimeout(() => (btnCopy.textContent = "Copy"), 900);
    });

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-mini";
    btnDelete.type = "button";
    btnDelete.textContent = "Delete";
    btnDelete.addEventListener("click", () => {
      const next = history.filter(h => h !== snap);
      const norm = normalizeHistory(next);
      saveHistory(norm);
      renderHistory(norm, state);
      populateCompareSelects(norm, state);
    });

    actions.appendChild(btnLoad);
    actions.appendChild(btnCopy);
    actions.appendChild(btnDelete);

    item.appendChild(meta);
    item.appendChild(actions);
    root.appendChild(item);
  }
}

function downloadJson(filename, obj) {
  const text = JSON.stringify(obj, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildToggleList(state) {
  const root = getEl("toggleList");
  if (!root) return;

  root.innerHTML = "";

  const list = visibleSignalsFor(state);

  for (const s of list) {
    const checked = !!state.toggles[s.id];
    const wrap = document.createElement("label");
    wrap.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.id = `t_${s.id}`;
    input.addEventListener("change", () => {
      state.toggles[s.id] = input.checked;
      saveState(state);
      updateRecommendation(state);
      // compare panel should update live in Advanced mode
      if (state.mode === "advanced") {
        const history = normalizeHistory(loadHistory());
        populateCompareSelects(history, state);
        updateCompare(history, state);
      }
    });

    const text = document.createElement("div");

    const title = document.createElement("p");
    title.className = "t-title";
    title.textContent = s.title;

    const desc = document.createElement("p");
    desc.className = "t-desc";
    desc.textContent = s.desc;

    const meta = document.createElement("div");
    meta.className = "t-meta";

    const whyBtn = document.createElement("button");
    whyBtn.type = "button";
    whyBtn.className = "icon-btn";
    whyBtn.textContent = "Why?";
    whyBtn.setAttribute("aria-label", `Why this signal matters: ${s.title}`);
    whyBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const impact = signalImpactSummary(s);
      openInfoModal("Why this matters", `${s.desc} ${impact}`.trim());
    });

    meta.appendChild(whyBtn);

    text.appendChild(title);
    text.appendChild(desc);
    text.appendChild(meta);

    wrap.appendChild(input);
    wrap.appendChild(text);
    root.appendChild(wrap);
  }
}


function score(state) {
  const scenario = SCENARIOS[state.scenario] || SCENARIOS.one_off;
  const totals = { ...scenario.base };

  for (const s of SIGNALS) {
    if (!state.toggles[s.id]) continue;
    for (const k of Object.keys(totals)) {
      totals[k] += (s.weights[k] || 0);
    }
  }

  // Clamp minimums
  for (const k of Object.keys(totals)) totals[k] = Math.max(-3, totals[k]);

  return totals;
}

function pickRecommendation(totals) {
  const entries = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  const [bestKey, bestScore] = entries[0];
  const runnerKey = entries[1]?.[0] ?? bestKey;
  const runnerScore = entries[1]?.[1] ?? bestScore;

  const spread = bestScore - runnerScore;

  // Convert to a simple confidence (0–100) based on spread and absolute score.
  const abs = Math.max(0, bestScore + 2); // shift
  const conf = Math.max(10, Math.min(100, 30 + abs*8 + spread*10));

  return { bestKey, bestScore, runnerKey, runnerScore, conf, entries };
}

function buildWhy(state, totals, bestKey) {
  const why = [];
  const scenario = SCENARIOS[state.scenario]?.name || SCENARIOS.one_off.name;

  why.push(`Scenario: ${scenario}.`);

  // Mirror the chapter signals into “why” lines.
  const onSignals = SIGNALS.filter(s => state.toggles[s.id] && !s.misconceptionFlag);
  for (const s of onSignals.slice(0, 4)) why.push(s.title + ".");

  // Add a single approach-specific summary line.
  for (const line of (APPROACHES[bestKey].whyTemplate || [])) why.push(line);

  // If RAG is high but Context is close, mention hybrid.
  if (bestKey !== "rag" && totals.rag >= totals.context && totals.rag >= totals.prompting && totals.rag >= totals.finetune) {
    // Already rag
  } else if (bestKey === "context" && totals.rag >= totals.context - 1 && state.toggles.not_grounded) {
    why.push("Note: You may need retrieval (RAG) to supply short, relevant policy/manual excerpts as grounding.");
  }

  return why;
}

function updateMisconception(state, bestKey) {
  const alert = getEl("misconceptionAlert");
  const text = getEl("misconceptionText");
  if (!alert || !text) return;

  const believes = !!state.toggles.perfect_prompt_belief;
  const signalsPointBeyond = (bestKey === "context" || bestKey === "rag" || bestKey === "finetune");

  if (believes && signalsPointBeyond) {
    alert.classList.remove("hidden");
    text.textContent = "A “perfect prompt” often isn’t enough if you need task-specific facts, policies, or history—those must be provided as context.";
  } else {
    alert.classList.add("hidden");
    text.textContent = "";
  }
}

function renderScoreboard(entries) {
  const root = getEl("scoreRows");
  if (!root) return;
  root.innerHTML = "";

  for (const [key, score] of entries) {
    const row = document.createElement("div");
    row.className = "t-row";
    row.setAttribute("role", "row");

    const c1 = document.createElement("div");
    c1.className = "t-cell";
    c1.setAttribute("role", "cell");
    c1.textContent = APPROACHES[key].title;

    const c2 = document.createElement("div");
    c2.className = "t-cell t-num";
    c2.setAttribute("role", "cell");
    c2.textContent = String(score);

    row.appendChild(c1);
    row.appendChild(c2);
    root.appendChild(row);
  }
}

function openInfoModal(title, body) {
  const overlay = getEl("infoOverlay");
  const t = getEl("infoTitle");
  const b = getEl("infoBody");
  if (!overlay || !t || !b) return;

  t.textContent = title || "Info";
  b.textContent = body || "";

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  const btn = getEl("btnInfoOk");
  if (btn) btn.focus();
}

function closeInfoModal() {
  const overlay = getEl("infoOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function signalImpactSummary(signal) {
  const w = signal && signal.weights ? signal.weights : {};
  const entries = Object.entries(w).sort((a,b) => (b[1]||0)-(a[1]||0));
  const top = entries[0];
  if (!top) return "";
  const [k,v] = top;
  if (!v) return "";
  const label = APPROACHES[k]?.title || k;
  return `Usually pushes toward: ${label}.`;
}

function renderList(el, items) {
  if (!el) return;
  el.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  }
}


function renderDecisionTrace(state, totals, bestKey) {
  const root = getEl("traceRows");
  if (!root) return;

  const scenarioBase = (SCENARIOS[state.scenario]?.base || SCENARIOS.one_off.base)[bestKey] || 0;

  const items = [];
  items.push({ label: "Scenario base", impact: scenarioBase });

  for (const s of SIGNALS) {
    if (!state.toggles[s.id]) continue;
    const impact = (s.weights && s.weights[bestKey]) ? s.weights[bestKey] : 0;
    if (impact !== 0 && !s.misconceptionFlag) {
      items.push({ label: s.title, impact });
    }
  }

  // Sort by absolute impact desc
  items.sort((a,b) => Math.abs(b.impact) - Math.abs(a.impact));
  const top = items.slice(0, 8);

  root.innerHTML = "";
  for (const it of top) {
    const row = document.createElement("div");
    row.className = "t-row";
    row.setAttribute("role","row");

    const c1 = document.createElement("div");
    c1.className = "t-cell";
    c1.setAttribute("role","cell");
    c1.textContent = it.label;

    const c2 = document.createElement("div");
    c2.className = "t-cell t-num";
    c2.setAttribute("role","cell");
    c2.textContent = (it.impact > 0 ? `+${it.impact}` : String(it.impact));

    row.appendChild(c1);
    row.appendChild(c2);
    root.appendChild(row);
  }
}

function updateRecommendation(state) {
  const totals = score(state);
  const { bestKey, runnerKey, conf, entries } = pickRecommendation(totals);

  const recTitle = getEl("recTitle");
  if (recTitle) recTitle.textContent = APPROACHES[bestKey].title;

  const why = buildWhy(state, totals, bestKey);
  renderList(getEl("whyList"), why);

  renderList(getEl("doList"), APPROACHES[bestKey].doNext);

  // Stress test runner-up (2nd place)
  const runnerTitle = getEl("runnerTitle");
  if (runnerTitle) runnerTitle.textContent = APPROACHES[runnerKey].title;

  const runnerWhy = buildWhy(state, totals, runnerKey)
    .filter(x => !String(x).startsWith("Scenario:"))  // keep it compact
    .slice(0, 4);
  renderList(getEl("runnerWhyList"), runnerWhy);

  renderScoreboard(entries);
  renderDecisionTrace(state, totals, bestKey);

  const fill = getEl("confidenceFill");
  if (fill) fill.style.width = `${conf}%`;
  const confText = getEl("confidenceText");
  if (confText) confText.textContent = `${Math.round(conf)}%`;

  updateMisconception(state, bestKey);
}

function buildExportText(state) {
  const totals = score(state);
  const { bestKey, runnerKey, conf, entries } = pickRecommendation(totals);

  const scenario = SCENARIOS[state.scenario]?.name || SCENARIOS.one_off.name;
  const enabled = SIGNALS.filter(s => state.toggles[s.id]).map(s => `- ${s.title}`).join("\n") || "- (none)";

  const why = buildWhy(state, totals, bestKey).map(x => `- ${x}`).join("\n");
  const doNext = (APPROACHES[bestKey].doNext || []).map(x => `- ${x}`).join("\n");

  const scoreboard = entries.map(([k,v]) => `- ${APPROACHES[k].title}: ${v}`).join("\n");

  return [
    "Approach Switchboard • Recommendation",
    "",
    `Scenario: ${scenario}`,
    `Confidence: ${Math.round(conf)}%`,
    "",
    "Signals selected:",
    enabled,
    "",
    "Recommendation:",
    `- ${APPROACHES[bestKey].title}`,
    `- Runner-up: ${APPROACHES[runnerKey].title}`,
    "",
    "Why:",
    why,
    "",
    "What to do next:",
    doNext,
    "",
    "Scoreboard (for transparency):",
    scoreboard,
    ""
  ].join("\n");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      ta.remove();
    }
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetState(state) {
  state.scenario = "one_off";
  state.toggles = {};
  saveState(state);
  const sel = getEl("scenarioSelect");
  if (sel) sel.value = state.scenario;
  buildToggleList(state);
  updateRecommendation(state);
}

function startTour(state) {
  const overlay = getEl("tourOverlay");
  const titleEl = getEl("tourTitle");
  const bodyEl = getEl("tourBody");
  const btnBack = getEl("btnTourBack");
  const btnNext = getEl("btnTourNext");
  const btnSkip = getEl("btnTourSkip");
  const btnClose = getEl("btnTourClose");
  const dontShow = getEl("tourDontShow");

  if (!overlay || !titleEl || !bodyEl || !btnBack || !btnNext || !btnSkip || !btnClose) return;

  const steps = [
    { target: "#quickStart", title: "Quick start", body: "Pick Simple or Advanced, or tap a Demo story to see the app in action." },
    { target: "#scenarioSelect", title: "Scenario", body: "Choose the scenario that best matches your situation. This sets the starting weights." },
    { target: "#toggleList", title: "Signals", body: "Toggle the signals that match your reality. Tap “Why?” to learn what each signal changes." },
    { target: "#recCard", title: "Recommendation", body: "Read the recommended approach, then follow the “What to do next” checklist. Copy or download it." },
    { target: "#btnModeAdvanced", title: "Advanced tools", body: "Switch to Advanced to unlock snapshots, compare, scoreboard, and decision trace." }
  ];

  let i = 0;

  function clearHighlights() {
    document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
  }

  function highlightStep(step) {
    clearHighlights();
    const el = document.querySelector(step.target);
    if (el) {
      el.classList.add("tour-highlight");
      try { el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" }); } catch {}
    }
  }

  function render() {
    const step = steps[i];
    titleEl.textContent = `Tour (${i+1}/${steps.length}): ${step.title}`;
    bodyEl.textContent = step.body;

    btnBack.disabled = i === 0;
    btnNext.textContent = (i === steps.length - 1) ? "Done" : "Next";

    highlightStep(step);
  }

  function close(commitDone) {
    clearHighlights();
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");

    const suppress = !!(dontShow && dontShow.checked);
    if (suppress) localStorage.setItem(TOUR_SUPPRESS_KEY, "1");
    if (commitDone) localStorage.setItem(TOUR_DONE_KEY, "1");
  }

  btnBack.onclick = () => { if (i > 0) { i--; render(); } };
  btnNext.onclick = () => {
    if (i < steps.length - 1) { i++; render(); }
    else { close(true); }
  };
  btnSkip.onclick = () => close(true);
  btnClose.onclick = () => close(true);

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  render();

  btnNext.focus();
}

function shouldAutoTour() {
  try {
    const done = localStorage.getItem(TOUR_DONE_KEY) === "1";
    const suppress = localStorage.getItem(TOUR_SUPPRESS_KEY) === "1";
    return !done && !suppress;
  } catch {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const state = normalizeState(loadState());
  let history = normalizeHistory(loadHistory());

  // Apply mode to document + segmented control
  document.documentElement.setAttribute("data-mode", state.mode);

  const btnModeSimple = getEl("btnModeSimple");
  const btnModeAdvanced = getEl("btnModeAdvanced");
  if (btnModeSimple && btnModeAdvanced) {
    btnModeSimple.addEventListener("click", () => setMode("simple", state));
    btnModeAdvanced.addEventListener("click", () => setMode("advanced", state));
    // initialize aria-selected
    btnModeSimple.setAttribute("aria-selected", state.mode === "simple" ? "true" : "false");
    btnModeAdvanced.setAttribute("aria-selected", state.mode === "advanced" ? "true" : "false");
  }

  // Demo stories
  const demoRoot = getEl("demoCards");
  if (demoRoot) {
    demoRoot.querySelectorAll("[data-demo]").forEach(btn => {
      btn.addEventListener("click", () => applyDemo(btn.getAttribute("data-demo"), state));
    });
  }

  // Info modal close handlers
  const btnInfoOk = getEl("btnInfoOk");
  const btnInfoClose = getEl("btnInfoClose");
  const infoOverlay = getEl("infoOverlay");
  if (btnInfoOk) btnInfoOk.addEventListener("click", closeInfoModal);
  if (btnInfoClose) btnInfoClose.addEventListener("click", closeInfoModal);
  if (infoOverlay) {
    infoOverlay.addEventListener("click", (e) => {
      if (e.target === infoOverlay) closeInfoModal();
    });
  }

  // Tour button + first-run auto tour
  const btnTour = getEl("btnTour");
  if (btnTour) btnTour.addEventListener("click", () => startTour(state));


  const sel = getEl("scenarioSelect");
  if (sel) {
    sel.value = state.scenario;
    sel.addEventListener("change", () => {
      state.scenario = sel.value;
      saveState(state);
      updateRecommendation(state);
    });
  }

  buildToggleList(state);
  updateRecommendation(state);
  renderHistory(history, state);
  populateCompareSelects(history, state);

  const btnReset = getEl("btnReset");
  if (btnReset) btnReset.addEventListener("click", () => resetState(state));

  const btnCopy = getEl("btnCopy");
  if (btnCopy) btnCopy.addEventListener("click", async () => {
    const text = buildExportText(state);
    const ok = await copyToClipboard(text);
    btnCopy.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btnCopy.textContent = "Copy Recommendation"), 1200);
  });

  const btnDownload = getEl("btnDownload");
  if (btnDownload) btnDownload.addEventListener("click", () => {
    const text = buildExportText(state);
    downloadText("approach-switchboard-recommendation.txt", text);
  });

  const btnSave = getEl("btnSaveSnap");
  if (btnSave) btnSave.addEventListener("click", () => {
    const snap = snapshotFromState(state);
    history = normalizeHistory([snap, ...history]);
    saveHistory(history);
    renderHistory(history, state);
  populateCompareSelects(history, state);

    btnSave.textContent = "Saved!";
    setTimeout(() => (btnSave.textContent = "Save Snapshot"), 900);
  });

  const btnExport = getEl("btnExportHistory");
  if (btnExport) btnExport.addEventListener("click", () => {
    downloadJson("approach-switchboard-history.json", history);
  });

  const btnClear = getEl("btnClearHistory");
  if (btnClear) btnClear.addEventListener("click", () => {
    history = [];
    saveHistory(history);
    renderHistory(history, state);
  populateCompareSelects(history, state);
  });


  const btnSwap = getEl("btnCompareSwap");
  if (btnSwap) btnSwap.addEventListener("click", () => {
    const a = getEl("compareA");
    const b = getEl("compareB");
    if (!a || !b) return;
    const tmp = a.value;
    a.value = b.value;
    b.value = tmp;
  });

  const btnRun = getEl("btnCompareRun");
  if (btnRun) btnRun.addEventListener("click", () => {
    const a = getEl("compareA");
    const b = getEl("compareB");
    if (!a || !b) return;
    const leftSnap = getSnapBySelectValue(history, a.value, state);
    const rightSnap = getSnapBySelectValue(history, b.value, state);
    renderCompareResults(leftSnap, rightSnap);
  });

  const file = getEl("fileImportHistory");
  if (file) file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;

    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const merged = normalizeHistory([...(Array.isArray(parsed) ? parsed : []), ...history]);
      history = merged;
      saveHistory(history);
      renderHistory(history, state);
  populateCompareSelects(history, state);
    } catch {
      // ignore parse errors silently (non-engineer friendly)
      alert("Import failed. Please choose a valid JSON history file.");
    } finally {
      file.value = "";
    }
  });

  // First-run auto tour (after UI is ready)
  if (shouldAutoTour()) {
    setTimeout(() => startTour(state), 150);
  }

});
