/* Dynamic Facts Firewall — Iteration 2
   Mobile-first sorting game: tap-to-select, tap-to-place (plus drag on desktop).
   Iteration 2 adds: misconception callouts + mini-quiz, challenge mode, contradiction signals, worksheet printing,
   accessibility announcements, local progress log, and a Deck Builder page.
*/

const APP_VERSION = "v0.3.0";
const THEME_KEY = "app_theme";

const STATE_KEY = "dff_state_v2";
const LEGACY_STATE_KEY = "dff_state_v1";
const RUNLOG_KEY = "dff_runlog_v1";
const CUSTOM_SCENARIOS_KEY = "dff_custom_scenarios_v1";

const BINS = [
  { id: "role", label: "Role" },
  { id: "rules", label: "Rules / Constraints" },
  { id: "dynamic", label: "Dynamic Facts" },
  { id: "grounding", label: "Grounding Knowledge" },
  { id: "memory", label: "Memory" },
  { id: "pile", label: "Unsorted pile" }
];

const BIN_LESSONS = {
  role: {
    title: "Role",
    what: "Stable identity + boundaries of the assistant. Not time-varying values.",
    do: ["Who the assistant is", "Scope/authority and task domain"],
    dont: ["Dates, statuses, counts, balances, ticket states"],
    why: "If you hide changing facts inside Role, the prompt rots when reality changes."
  },
  rules: {
    title: "Rules / Constraints",
    what: "Stable behavior rules, guardrails, formatting rules, and prohibitions.",
    do: ["Allowed sources", "Tone rules", "Output format requirements", "Safety constraints"],
    dont: ["Today’s date", "Current status", "Latest numbers"],
    why: "Rules should stay true for many runs; changing facts should not be hard-coded here."
  },
  dynamic: {
    title: "Dynamic Facts",
    what: "Time-sensitive, run-specific inputs you expect to change frequently.",
    do: ["Today’s date / ‘as-of’ date", "Current status, balances, IDs, metrics", "Latest user-provided values"],
    dont: ["Long-lived policy or runbook excerpts"],
    why: "This block is designed for fast updates without rewriting stable prompt rules."
  },
  grounding: {
    title: "Grounding Knowledge",
    what: "Reference excerpts (policies, runbooks, docs) the model should rely on.",
    do: ["Short quoted excerpts", "Links or citations (when applicable)", "Known facts that change slowly"],
    dont: ["Run-specific status updates"],
    why: "Grounding is the ‘source of truth’ material the model should cite and follow."
  },
  memory: {
    title: "Memory",
    what: "Persisted preferences or rolling summaries that remain useful across runs.",
    do: ["User style preferences", "Pinned context summaries", "Stable constraints from prior interactions"],
    dont: ["One-time ticket states", "Ephemeral metrics"],
    why: "Memory should be durable. If it changes often, it belongs in Dynamic Facts."
  }
};

const BUILTIN_SCENARIOS = [
  {
    id: "support_downgrade",
    name: "Support: Subscription Downgrade",
    note: "Practice isolating time-varying account details from stable behavior rules.",
    defaultDate: "2026-02-27",
    cards: [
      { id: "c1", text: "System/Role: You are a customer support agent for Acme.", correctBin: "role", why: "Identity and scope of the assistant belong in Role." },
      { id: "c2", text: "Rules: Use only the provided policy excerpt. Do not speculate.", correctBin: "rules", why: "Stable behavior guardrail." },

      { id: "c3", text: "Today’s date: 2026-02-27.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 0, capturedDate: "2026-02-27", why: "Dates change every run—keep them isolated for easy updates.", exclusiveKey: "asof_date" },

      { id: "c4", text: "Snapshot A (captured 2026-02-26): Current plan: PRO.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-26", validTo: "2026-02-27", exclusiveKey: "plan", why: "This is a changing customer fact; isolate it so you can refresh it." },
      { id: "c19", text: "Snapshot B (captured 2026-02-27): Current plan: BASIC (downgrade completed).", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-27", validFrom: "2026-02-27", exclusiveKey: "plan", why: "Same fact category as the prior snapshot; only one should be ‘current’ at an as-of date." },

      { id: "c20", text: "Billing state (captured 2026-02-27): Last payment FAILED; retry scheduled.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 2, capturedDate: "2026-02-27", exclusiveKey: "billing_state", why: "Run-specific status updates belong in Dynamic Facts, not Rules or Memory." },

      { id: "c5", text: "Policy excerpt: Downgrades occur after 2 failed payments; user can restore by paying within 30 days.", correctBin: "grounding", why: "This is a stable excerpt you want the model to follow." },
      { id: "c6", text: "Memory: Customer previously asked to keep a friendly tone and short steps.", correctBin: "memory", why: "A durable preference across runs." },
    ],
    quiz: [
      {
        id: "q1",
        q: "Where should today’s date go in a robust prompt?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Grounding Knowledge"],
        answer: 2,
        explain: "Dates are run-specific inputs. Keeping them in Dynamic Facts makes refresh easy and prevents prompt rot."
      },
      {
        id: "q2",
        q: "If the customer’s plan changes tomorrow, which block should you update?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Memory"],
        answer: 2,
        explain: "Plan/status changes are dynamic facts. You update Dynamic Facts without rewriting stable instructions."
      },
      {
        id: "q3",
        q: "Why is it risky to bury plan status inside Role?",
        options: ["It reduces model creativity", "It makes stable instructions harder to reuse", "It improves grounding", "It enforces safety rules"],
        answer: 1,
        explain: "Role should stay stable. Hiding changing facts inside Role makes prompts silently become wrong over time."
      }
    ]
  },
  {
    id: "ops_incident",
    name: "Ops: Incident Triage",
    note: "Dynamic facts should be isolated so status updates don’t rot.",
    defaultDate: "2026-02-27",
    cards: [
      { id: "c7", text: "System/Role: You are an operations incident analyst.", correctBin: "role", why: "Defines identity and task domain." },
      { id: "c8", text: "Rules: Do not invent facts. Label assumptions as assumptions.", correctBin: "rules", why: "Stable reliability rule." },

      { id: "c9", text: "Incident ID: 1842. Severity: SEV-2. Start time: 09:14.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-27", exclusiveKey: "incident_meta", why: "Run-specific incident metadata must be easy to refresh." },

      { id: "c10", text: "Status snapshot (captured 2026-02-27): Ticket #1842 is OPEN.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-27", validTo: "2026-02-28", exclusiveKey: "incident_status", why: "Status changes frequently; keep it out of Rules and Memory." },
      { id: "c21", text: "Status snapshot (captured 2026-02-28): Ticket #1842 is RESOLVED.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-28", validFrom: "2026-02-28", exclusiveKey: "incident_status", why: "Competing status snapshots create contradictions if you don’t refresh dynamic facts." },

      { id: "c11", text: "Runbook excerpt: If error rate > 5% for 10 minutes, roll back last deploy.", correctBin: "grounding", why: "Reference excerpt to ground decisions." },
      { id: "c12", text: "Memory: Past incidents often needed a short executive summary first.", correctBin: "memory", why: "A durable reporting preference." },
    ],
    quiz: [
      {
        id: "q1",
        q: "Where do incident status updates belong?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Grounding Knowledge"],
        answer: 2,
        explain: "Status updates are volatile. Keep them in Dynamic Facts so you can refresh without rewriting stable prompt structure."
      },
      {
        id: "q2",
        q: "Where should the runbook excerpt go?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Grounding Knowledge"],
        answer: 3,
        explain: "Runbooks/policies are grounding references—stable sources the model should follow."
      },
      {
        id: "q3",
        q: "What is the main point of Time Warp Replay in this app?",
        options: ["To randomize cards", "To show how stale facts break prompts over time", "To improve UI themes", "To enforce output formatting"],
        answer: 1,
        explain: "Time Warp highlights how quickly prompts rot when dynamic facts aren’t isolated and refreshed."
      }
    ]
  },
  {
    id: "hr_headcount",
    name: "HR: Headcount Snapshot",
    note: "Separate time-varying counts from stable policy statements.",
    defaultDate: "2026-02-27",
    cards: [
      { id: "c13", text: "System/Role: You are an HR analyst preparing a headcount update.", correctBin: "role", why: "Defines assistant identity and domain." },
      { id: "c14", text: "Rules: Use respectful language. Provide bullet points and a short summary.", correctBin: "rules", why: "Stable formatting + tone constraints." },

      { id: "c15", text: "As-of date: 2026-02-27. Department: Manufacturing.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 0, capturedDate: "2026-02-27", exclusiveKey: "asof_date", why: "As-of date and filters are run-specific inputs." },

      { id: "c16", text: "Headcount snapshot (as-of 2026-02-27): Headcount 1,248; Open roles 37; Turnover 30d 2.1%.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 7, capturedDate: "2026-02-27", validTo: "2026-02-28", exclusiveKey: "headcount_snapshot", why: "Metrics evolve; keep them isolated for easy refresh." },
      { id: "c22", text: "Headcount snapshot (as-of 2026-02-28): Headcount 1,252; Open roles 35; Turnover 30d 2.0%.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 7, capturedDate: "2026-02-28", validFrom: "2026-02-28", exclusiveKey: "headcount_snapshot", why: "Competing snapshots create contradictions if you paste both as ‘current’." },

      { id: "c17", text: "Policy excerpt: Headcount numbers must be labeled ‘preliminary’ until month-end close.", correctBin: "grounding", why: "Stable policy excerpt to ground output language." },
      { id: "c18", text: "Memory: Leadership prefers a ‘risks + next steps’ section in updates.", correctBin: "memory", why: "Durable preference across reports." },
    ],
    quiz: [
      {
        id: "q1",
        q: "Where should changing metrics (headcount, turnover) go?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Memory"],
        answer: 2,
        explain: "Metrics are volatile. Put them in Dynamic Facts so they can be updated without rewriting stable prompt rules."
      },
      {
        id: "q2",
        q: "Where does the policy excerpt belong?",
        options: ["Role", "Rules / Constraints", "Dynamic Facts", "Grounding Knowledge"],
        answer: 3,
        explain: "Policies/runbooks belong in Grounding Knowledge as reference material the model should follow."
      },
      {
        id: "q3",
        q: "If you have two snapshots from different days, what’s the correct practice?",
        options: ["Paste both as ‘current’", "Hide them in Memory", "Keep one current snapshot in Dynamic Facts and archive older ones", "Put metrics in Rules"],
        answer: 2,
        explain: "Only one snapshot should be ‘current’ at an as-of date; older snapshots should be clearly labeled or removed."
      }
    ]
  }
];

let state = {
  scenarioId: BUILTIN_SCENARIOS[0].id,
  selectedCardId: null,

  // core placement state
  placements: {},        // {cardId: binId}
  failCounts: {},        // {cardId: n incorrect checks}

  // Iteration 2 additions
  mode: "practice",      // "practice" | "challenge"
  challenge: {           // only meaningful when mode==="challenge"
    startTs: null,
    elapsedMs: 0,
    moves: 0,
    completed: false
  },

  quizAnswers: {},       // {questionId: optionIndex}
  lastCallout: null      // {level, title, body} or null
};

let challengeTimerHandle = null;

function isChallengeMode() {
  return state.mode === "challenge";
}

function resetChallengeState() {
  state.challenge = { startTs: null, elapsedMs: 0, moves: 0, completed: false };
  updateChallengeStats();
}

function startChallengeIfNeeded() {
  if (!isChallengeMode()) return;
  if (state.challenge.completed) return;
  if (state.challenge.startTs) return;
  state.challenge.startTs = Date.now();
  ensureChallengeTimer();
}

function ensureChallengeTimer() {
  if (!isChallengeMode()) {
    if (challengeTimerHandle) clearInterval(challengeTimerHandle);
    challengeTimerHandle = null;
    return;
  }
  if (challengeTimerHandle) return;
  challengeTimerHandle = setInterval(() => {
    if (!isChallengeMode() || !state.challenge.startTs || state.challenge.completed) return;
    state.challenge.elapsedMs = Date.now() - state.challenge.startTs;
    updateChallengeStats();
  }, 250);
}

function stopChallengeTimer() {
  if (challengeTimerHandle) clearInterval(challengeTimerHandle);
  challengeTimerHandle = null;
}

function fmtElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

function updateChallengeStats() {
  const el = document.getElementById("challengeStats");
  if (!el) return;
  if (!isChallengeMode()) {
    el.textContent = "Time — • Moves —";
    return;
  }
  const t = state.challenge.startTs ? fmtElapsed(state.challenge.elapsedMs) : "0:00";
  el.textContent = `Time ${t} • Moves ${state.challenge.moves}`;
}

function setCallout(level, title, body) {
  state.lastCallout = { level, title, body };
  renderCallout();
}

function clearCallout() {
  state.lastCallout = null;
  renderCallout();
}

function renderCallout() {
  const el = document.getElementById("callout");
  if (!el) return;
  const c = state.lastCallout;
  if (!c) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }
  el.style.display = "block";
  el.className = `callout ${c.level || ""}`.trim();
  el.innerHTML = `<strong>${escapeHtml(c.title || "Note")}</strong><div>${escapeHtml(c.body || "")}</div>`;
}

function detectEnvironment() {
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "Local";
  return "GitHub Pages";
}

function setStatusPills() {
  const v = document.getElementById("pillVersion");
  const e = document.getElementById("pillEnv");
  if (v) v.textContent = APP_VERSION;
  if (e) e.textContent = detectEnvironment();
}

function getPreferredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const s = document.getElementById("themeStatus");
  if (s) s.textContent = `Theme: ${theme}`;
}

function toggleTheme() {
  const curr = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(curr === "dark" ? "light" : "dark");
}

function announce(msg) {
  const live = document.getElementById("ariaLive");
  if (live) live.textContent = msg;
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  announce(msg);
  setTimeout(() => el.classList.remove("show"), 1700);
}

/* ---------- Storage ---------- */
function saveState() {
  const payload = {
    scenarioId: state.scenarioId,
    placements: state.placements,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STATE_KEY, JSON.stringify(payload));
}

function loadSavedState() {
  const raw = localStorage.getItem(STATE_KEY) || localStorage.getItem(LEGACY_STATE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearSavedState() {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(LEGACY_STATE_KEY);
}

function loadRunLog() {
  const raw = localStorage.getItem(RUNLOG_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRunLog(arr) {
  const capped = arr.slice(-100);
  localStorage.setItem(RUNLOG_KEY, JSON.stringify(capped));
}

function recordRun(entry) {
  const log = loadRunLog();
  log.push(entry);
  saveRunLog(log);
}

function clearRunLog() {
  localStorage.removeItem(RUNLOG_KEY);
}

function loadCustomScenarios() {
  const raw = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // minimal validation
    return arr.filter(s => s && s.id && s.name && Array.isArray(s.cards));
  } catch {
    return [];
  }
}

function allScenarios() {
  return [...BUILTIN_SCENARIOS, ...loadCustomScenarios()];
}

function getScenario() {
  const s = allScenarios().find(x => x.id === state.scenarioId);
  return s || allScenarios()[0];
}

/* ---------- Placement model ---------- */
function cardPlacement(cardId) {
  return state.placements[cardId] || "pile";
}

function setPlacement(cardId, binId) {
  const sc = getScenario();
  const c = sc.cards.find(x => x.id === cardId);
  const prev = state.placements[cardId] || "pile";
  state.placements[cardId] = binId;

  // Challenge mode tracking
  if (prev !== binId) {
    if (isChallengeMode()) {
      startChallengeIfNeeded();
      state.challenge.moves += 1;
      updateChallengeStats();
    }
  }

  // Misconception callout: dynamic facts do NOT belong inside Role/Rules/Memory/Grounding.
  if (c && c.isDynamic) {
    if (binId !== "dynamic") {
      setCallout(
        "warn",
        "Misconception: dynamic facts hiding in stable blocks",
        "Changing values (dates, status, metrics) should be isolated in Dynamic Facts so they can be refreshed without rewriting Role/Rules."
      );
    } else {
      // If it was previously misplaced, give positive reinforcement
      if (prev !== "dynamic") {
        setCallout(
          "good",
          "Good move: dynamic fact isolated",
          "Now Time Warp can reveal staleness and contradictions without corrupting Role/Rules."
        );
      }
    }
  }

  // Contradiction signal: multiple 'current' values for the same exclusive key
  if (c && c.exclusiveKey && binId === "dynamic") {
    const inDyn = sc.cards.filter(x => cardPlacement(x.id) === "dynamic" || x.id === cardId);
    const same = inDyn.filter(x => x.exclusiveKey === c.exclusiveKey);
    if (same.length > 1) {
      setCallout(
        "warn",
        "Contradiction risk: multiple current values",
        "You have more than one value for the same fact category in Dynamic Facts. In real prompts, keep only one 'current' value for a given as-of date."
      );
    }
  }

  saveState();
  render();
  renderInspector();
  renderQuiz();
}

function clearPlacements() {
  state.placements = {};
  state.selectedCardId = null;
  state.failCounts = {};
  state.quizAnswers = {};
  clearCallout();
  resetChallengeState();
  saveState();
  render();
  renderInspector();
  renderQuiz(); 
}

function selectCard(cardId) {
  state.selectedCardId = (state.selectedCardId === cardId) ? null : cardId;
  render();
  renderInspector();
}

function placeSelected(binId) {
  if (!state.selectedCardId) return;
  const c = getScenario().cards.find(x => x.id === state.selectedCardId);
  setPlacement(state.selectedCardId, binId);
  toast(`Placed: ${labelForBin(binId)}`);
  if (c) announce(`Placed card in ${labelForBin(binId)}.`);
}

/* ---------- UI setup ---------- */
function setupScenarioSelector() {
  const sel = document.getElementById("selScenario");
  if (!sel) return;

  const scenarios = allScenarios();
  sel.innerHTML = "";
  for (const sc of scenarios) {
    const opt = document.createElement("option");
    opt.value = sc.id;
    opt.textContent = loadCustomScenarios().some(x => x.id === sc.id) ? `★ ${sc.name}` : sc.name;
    sel.appendChild(opt);
  }

  sel.value = state.scenarioId;

  sel.onchange = () => {
    state.scenarioId = sel.value;
    state.selectedCardId = null;
    state.placements = {};
    state.failCounts = {};
    state.quizAnswers = {};
    clearCallout();
    resetChallengeState();
    applyScenarioDefaults();
    saveState();
    render();
    renderInspector();
    renderProgress();
    renderQuiz();
  };

  const note = document.getElementById("scenarioNote");
  const sc = getScenario();
  if (note) note.textContent = sc.note || "";
}

function applyScenarioDefaults() {
  const sc = getScenario();
  const dateWarp = document.getElementById("dateWarp");
  if (dateWarp) dateWarp.value = sc.defaultDate || "2026-02-27";

  const note = document.getElementById("scenarioNote");
  if (note) note.textContent = sc.note || "";
}

/* ---------- Rendering ---------- */
function render() {
  const sc = getScenario();

  // clear bins
  for (const b of BINS) {
    const binEl = document.getElementById(`bin_${b.id}`);
    if (binEl) binEl.innerHTML = "";
  }

  const dateVal = document.getElementById("dateWarp")?.value || sc.defaultDate || "2026-02-27";

  // render cards
  for (const c of sc.cards) {
    const binId = cardPlacement(c.id);
    const binEl = document.getElementById(`bin_${binId}`);
    if (!binEl) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-item";
    btn.dataset.cardId = c.id;

    const cardText = document.createElement("div");
    cardText.className = "card-text";
    cardText.textContent = c.text.replaceAll(sc.defaultDate || "2026-02-27", dateVal);
    btn.appendChild(cardText);

    const hintAllowed = (state.failCounts[c.id] || 0) >= 2;
    if (hintAllowed) {
      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `Hint: ${labelForBin(c.correctBin)}`;
      btn.appendChild(meta);
      btn.classList.add("hinted");
    }

    btn.setAttribute("aria-label", `Card: ${c.text}`);

    if (state.selectedCardId === c.id) btn.classList.add("selected");

    // drag support (desktop)
    btn.draggable = true;
    btn.addEventListener("dragstart", (ev) => {
      ev.dataTransfer.setData("text/plain", c.id);
    });

    btn.addEventListener("click", () => selectCard(c.id));
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        selectCard(c.id);
      }
    });

    binEl.appendChild(btn);
  }

  // counts
  for (const b of BINS) {
    const countEl = document.getElementById(`count_${b.id}`);
    if (!countEl) continue;
    const n = sc.cards.filter(c => cardPlacement(c.id) === b.id).length;
    countEl.textContent = String(n);
  }

  // bin interactions
  document.querySelectorAll(".bin").forEach(bin => {
    const binId = bin.getAttribute("data-bin");

    bin.onclick = () => placeSelected(binId);

    bin.onkeydown = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        placeSelected(binId);
      }
    };

    bin.ondragover = (ev) => ev.preventDefault();
    bin.ondrop = (ev) => {
      ev.preventDefault();
      const cardId = ev.dataTransfer.getData("text/plain");
      if (cardId) {
        setPlacement(cardId, binId);
      }
    };
  });

  ensureChallengeTimer();
  updateChallengeStats();
  updateTimeWarpWarnings();
}

function check() {
  const sc = getScenario();
  const mistakes = [];
  let correct = 0;

  // reset card styles
  document.querySelectorAll(".card-item").forEach(el => {
    el.classList.remove("correct", "incorrect");
  });

  for (const c of sc.cards) {
    const placed = cardPlacement(c.id);
    const ok = placed === c.correctBin;
    const el = document.querySelector(`.card-item[data-card-id="${c.id}"]`);
    if (el) el.classList.add(ok ? "correct" : "incorrect");

    if (ok) {
      correct++;
    } else {
      state.failCounts[c.id] = (state.failCounts[c.id] || 0) + 1;
      mistakes.push({ card: c, placed, expected: c.correctBin });
    }
  }

  const score = Math.round((correct / sc.cards.length) * 100);
  const scoreText = document.getElementById("scoreText");
  if (scoreText) scoreText.textContent = `${score} / 100`;

  // Challenge mode completion snapshot
  if (isChallengeMode()) {
    if (state.challenge.startTs) state.challenge.elapsedMs = Date.now() - state.challenge.startTs;
    state.challenge.completed = true;
    stopChallengeTimer();
    updateChallengeStats();
  }
  renderChallengeSummary(score, sc.cards.length);


  // mistakes list with "why" micro-lessons + hint / fix controls
  const list = document.getElementById("mistakes");
  if (list) {
    list.innerHTML = "";
    if (mistakes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No mistakes. Dynamic Facts are cleanly isolated.";
      list.appendChild(li);
    } else {
      for (const m of mistakes) {
        const li = document.createElement("li");
        li.className = "mistake-item";

        const top = document.createElement("div");
        top.className = "mistake-top";
        top.textContent = `"${m.card.text}" → placed in "${labelForBin(m.placed)}", expected "${labelForBin(m.expected)}".`;
        li.appendChild(top);

        const why = document.createElement("div");
        why.className = "mistake-why";
        why.textContent = m.card.why ? `Why: ${m.card.why}` : `Why: ${BIN_LESSONS[m.expected]?.why || "Place it where it stays easy to update."}`;
        li.appendChild(why);

        const actions = document.createElement("div");
        actions.className = "mistake-actions";

        const btnReveal = document.createElement("button");
        btnReveal.type = "button";
        btnReveal.className = "btn btn-small btn-secondary";
        btnReveal.textContent = (state.failCounts[m.card.id] || 0) >= 2 ? "Hint shown" : "Reveal hint";
        btnReveal.disabled = (state.failCounts[m.card.id] || 0) >= 2;
        btnReveal.onclick = () => {
          state.failCounts[m.card.id] = 2;
          render();
          renderInspector();
          toast("Hint revealed on the card.");
        };

        const btnFix = document.createElement("button");
        btnFix.type = "button";
        btnFix.className = "btn btn-small";
        btnFix.textContent = "Auto-place";
        btnFix.onclick = () => {
          setPlacement(m.card.id, m.expected);
          toast("Auto-placed.");
        };

        actions.appendChild(btnReveal);
        actions.appendChild(btnFix);
        li.appendChild(actions);

        list.appendChild(li);
      }
    }
  }

  // record run
  const dateVal = document.getElementById("dateWarp")?.value || sc.defaultDate || "2026-02-27";
  recordRun({
    at: new Date().toISOString(),
    scenarioId: sc.id,
    scenarioName: sc.name,
    date: dateVal,
    score,
    correct,
    total: sc.cards.length,
    mistakes: mistakes.length,
    mode: state.mode,
    timeSec: isChallengeMode() ? Math.floor((state.challenge.elapsedMs || 0) / 1000) : null,
    moves: isChallengeMode() ? state.challenge.moves : null
  });

  renderProgress();

  toast(score === 100 ? "Perfect. Ready to Time Warp." : "Checked. Fix the red cards and re-check.");

  saveState();
  updateTimeWarpWarnings();
  renderInspector();
}

function renderQuiz() {
  const root = document.getElementById("quiz");
  if (!root) return;

  const sc = getScenario();
  root.innerHTML = "";

  if (!sc.quiz || !Array.isArray(sc.quiz) || sc.quiz.length === 0) {
    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = "No quiz for this scenario.";
    root.appendChild(p);
    return;
  }

  const header = document.createElement("div");
  header.className = "small-note";
  header.textContent = "Misconception Check: keep changing values (dates/status/metrics) in Dynamic Facts, not buried in Role/Rules.";
  root.appendChild(header);

  let correct = 0;
  let answered = 0;

  for (const q of sc.quiz) {
    const wrap = document.createElement("div");
    wrap.className = "quiz-item";

    const qt = document.createElement("div");
    qt.className = "quiz-q";
    qt.textContent = q.q;
    wrap.appendChild(qt);

    const opts = document.createElement("div");
    opts.className = "quiz-options";

    const selected = (q.id in state.quizAnswers) ? state.quizAnswers[q.id] : null;

    q.options.forEach((opt, i) => {
      const row = document.createElement("label");
      row.className = "quiz-opt";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `quiz_${q.id}`;
      input.value = String(i);
      input.checked = selected === i;

      input.onchange = () => {
        state.quizAnswers[q.id] = i;
        renderQuiz();
      };

      const span = document.createElement("span");
      span.textContent = opt;

      row.appendChild(input);
      row.appendChild(span);
      opts.appendChild(row);
    });

    wrap.appendChild(opts);

    const fb = document.createElement("div");
    fb.className = "quiz-feedback";

    if (selected !== null) {
      answered++;
      const ok = selected === q.answer;
      if (ok) correct++;
      fb.textContent = (ok ? "✅ Correct. " : "❌ Not quite. ") + (q.explain || "");
    } else {
      fb.textContent = "Select an answer to see feedback.";
    }

    wrap.appendChild(fb);
    root.appendChild(wrap);
  }

  const summary = document.createElement("div");
  summary.className = "small-note";
  summary.textContent = answered ? `Quiz score: ${correct} / ${sc.quiz.length}.` : "Quiz score: —";
  root.appendChild(summary);
}

function renderChallengeSummary(score, totalCards) {
  const el = document.getElementById("challengeSummary");
  if (!el) return;

  if (!isChallengeMode()) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  const t = state.challenge.startTs ? fmtElapsed(state.challenge.elapsedMs) : "0:00";
  const moves = state.challenge.moves;
  const minMoves = totalCards; // at least one placement per card
  const over = Math.max(0, moves - minMoves);

  el.style.display = "block";
  el.innerHTML = `<strong>Challenge results</strong><div>Time: ${escapeHtml(t)} • Moves: ${moves} (min ${minMoves}, +${over} extra) • Score: ${score}/100</div>`;
}

function labelForBin(binId) {
  const b = BINS.find(x => x.id === binId);
  return b ? b.label : binId;
}

function exportBlocks() {
  const sc = getScenario();
  const dateVal = document.getElementById("dateWarp")?.value || sc.defaultDate || "2026-02-27";
  const grouped = { role: [], rules: [], dynamic: [], grounding: [], memory: [] };

  for (const c of sc.cards) {
    const placed = cardPlacement(c.id);
    if (grouped[placed]) grouped[placed].push(c.text.replaceAll(sc.defaultDate || "2026-02-27", dateVal));
  }

  const lines = [];
  lines.push("System / Role:");
  lines.push(...(grouped.role.length ? grouped.role.map(x => `- ${x}`) : ["- [Add role here]"]));
  lines.push("");
  lines.push("Rules / Constraints:");
  lines.push(...(grouped.rules.length ? grouped.rules.map(x => `- ${x}`) : ["- [Add rules here]"]));
  lines.push("");
  lines.push("Dynamic Facts:");
  lines.push(...(grouped.dynamic.length ? grouped.dynamic.map(x => `- ${x}`) : ["- Today’s date: [YYYY-MM-DD]"]));
  lines.push("");
  lines.push("Grounding Knowledge:");
  lines.push(...(grouped.grounding.length ? grouped.grounding.map(x => `- ${x}`) : ["- [Insert 2–6 short excerpts]"]));
  lines.push("");
  lines.push("Memory:");
  lines.push(...(grouped.memory.length ? grouped.memory.map(x => `- ${x}`) : ["- [Pinned facts / rolling summary]"]));
  lines.push("");
  lines.push("User Request:");
  lines.push("- [Paste the user’s question here]");

  const txt = lines.join("\n");

  navigator.clipboard.writeText(txt).then(() => toast("Copied to clipboard.")).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Copied to clipboard.");
  });
}

function dateDiffDays(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const ms = db - da;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isCardValidOnDate(card, dateVal) {
  if (!card) return true;
  if (card.validFrom && dateVal < card.validFrom) return false;
  if (card.validTo && dateVal > card.validTo) return false;
  return true;
}

function baseDateForCard(card, scenario, dateVal) {
  return card.capturedDate || scenario.defaultDate || dateVal;
}

function updateTimeWarpWarnings() {
  const sc = getScenario();
  const warn = document.getElementById("warpWarning");
  if (!warn) return;

  const dateVal = document.getElementById("dateWarp")?.value || sc.defaultDate || "2026-02-27";
  const delta = dateDiffDays(sc.defaultDate || dateVal, dateVal);

  const dynamicCards = sc.cards.filter(c => c.isDynamic);
  const misplacedDynamic = dynamicCards.filter(c => cardPlacement(c.id) !== "dynamic");

  // Staleness is computed from the card's capture date (if provided), otherwise scenario default.
  const staleDynamic = dynamicCards.filter(c => {
    const n = typeof c.staleAfterDays === "number" ? c.staleAfterDays : null;
    if (n === null) return false;
    const base = baseDateForCard(c, sc, dateVal);
    const d = dateDiffDays(base, dateVal);
    return Math.abs(d) > n;
  });

  const placedDynamic = sc.cards.filter(c => cardPlacement(c.id) === "dynamic");
  const invalidOnDate = placedDynamic.filter(c => c.isDynamic && !isCardValidOnDate(c, dateVal));

  const groups = {};
  for (const c of placedDynamic) {
    if (!c.exclusiveKey) continue;
    groups[c.exclusiveKey] = groups[c.exclusiveKey] || [];
    groups[c.exclusiveKey].push(c);
  }
  const contradictionKeys = Object.keys(groups).filter(k => groups[k].length > 1);

  const main = [];
  main.push(`Time Warp date=${dateVal} (Δ${delta} days)`);

  warn.innerHTML = "";
  warn.style.color = "";

  const mainLine = document.createElement("div");
  mainLine.textContent = main.join(" • ");
  warn.appendChild(mainLine);

  // 1) Misplaced dynamic facts (the classic mistake)
  if (misplacedDynamic.length === 0) {
    const ok = document.createElement("div");
    ok.className = "small-note";
    ok.textContent = "OK: all dynamic facts are isolated in Dynamic Facts.";
    warn.appendChild(ok);
  } else {
    const risk = document.createElement("div");
    risk.className = "small-note";
    risk.textContent = `Staleness risk: ${misplacedDynamic.length} dynamic fact card(s) are NOT in Dynamic Facts.`;
    warn.appendChild(risk);
    warn.style.color = "var(--muted)";
  }

  // 2) Stale facts vs capture dates
  if (staleDynamic.length) {
    const stale = document.createElement("div");
    stale.className = "small-note";
    stale.textContent = `Update needed: ${staleDynamic.length} dynamic fact card(s) are stale for this Time Warp date.`;
    warn.appendChild(stale);
  }

  // 3) Invalid-by-date facts (validFrom/validTo)
  if (invalidOnDate.length) {
    const inv = document.createElement("div");
    inv.className = "small-note";
    inv.textContent = `Invalid on this date: ${invalidOnDate.length} dynamic fact card(s) have a validity window that doesn’t match the Time Warp date.`;
    warn.appendChild(inv);
  }

  // 4) Contradiction patterns (multiple 'current' values)
  if (contradictionKeys.length) {
    const con = document.createElement("div");
    con.className = "small-note";
    con.textContent = `Contradiction risk: multiple current values detected for: ${contradictionKeys.join(", ")}.`;
    warn.appendChild(con);
  }
}


/* ---------- Panels ---------- */
function renderLessons() {
  const root = document.getElementById("lessons");
  if (!root) return;

  root.innerHTML = "";
  for (const b of ["role","rules","dynamic","grounding","memory"]) {
    const card = document.createElement("div");
    card.className = "lesson-card";

    const h = document.createElement("div");
    h.className = "lesson-title";
    h.textContent = BIN_LESSONS[b].title;

    const p1 = document.createElement("div");
    p1.className = "lesson-what";
    p1.textContent = BIN_LESSONS[b].what;

    const ulDo = document.createElement("ul");
    ulDo.className = "lesson-list";
    for (const x of BIN_LESSONS[b].do) {
      const li = document.createElement("li");
      li.textContent = x;
      ulDo.appendChild(li);
    }

    const ulDont = document.createElement("ul");
    ulDont.className = "lesson-list lesson-dont";
    for (const x of BIN_LESSONS[b].dont) {
      const li = document.createElement("li");
      li.textContent = x;
      ulDont.appendChild(li);
    }

    const why = document.createElement("div");
    why.className = "lesson-why";
    why.textContent = `Why it matters: ${BIN_LESSONS[b].why}`;

    card.appendChild(h);
    card.appendChild(p1);

    const cols = document.createElement("div");
    cols.className = "lesson-cols";

    const col1 = document.createElement("div");
    col1.innerHTML = "<div class='lesson-sub'>Do</div>";
    col1.appendChild(ulDo);

    const col2 = document.createElement("div");
    col2.innerHTML = "<div class='lesson-sub'>Don’t</div>";
    col2.appendChild(ulDont);

    cols.appendChild(col1);
    cols.appendChild(col2);

    card.appendChild(cols);
    card.appendChild(why);

    root.appendChild(card);
  }
}

function renderInspector() {
  const root = document.getElementById("inspector");
  if (!root) return;

  const sc = getScenario();
  const selectedId = state.selectedCardId;
  root.innerHTML = "";

  if (!selectedId) {
    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = "Select a card to see why it belongs in a bin and to use hints.";
    root.appendChild(p);
    return;
  }

  const c = sc.cards.find(x => x.id === selectedId);
  if (!c) return;

  const placed = cardPlacement(c.id);
  const fails = state.failCounts[c.id] || 0;

  const title = document.createElement("div");
  title.className = "inspector-title";
  title.textContent = c.text;

  const meta = document.createElement("div");
  meta.className = "small-note";
  meta.textContent = `Placed in: ${labelForBin(placed)} • Expected: ${labelForBin(c.correctBin)} • Failed checks: ${fails}`;

  const why = document.createElement("div");
  why.className = "inspector-why";
  why.textContent = c.why ? `Why: ${c.why}` : `Why: ${BIN_LESSONS[c.correctBin]?.why || ""}`;

  const actions = document.createElement("div");
  actions.className = "inspector-actions";

  const btnReveal = document.createElement("button");
  btnReveal.type = "button";
  btnReveal.className = "btn btn-secondary btn-small";
  btnReveal.textContent = fails >= 2 ? "Hint already shown" : "Reveal hint";
  btnReveal.disabled = fails >= 2;
  btnReveal.onclick = () => {
    state.failCounts[c.id] = 2;
    render();
    renderInspector();
    toast("Hint revealed on the card.");
  };

  const btnAuto = document.createElement("button");
  btnAuto.type = "button";
  btnAuto.className = "btn btn-small";
  btnAuto.textContent = "Auto-place correctly";
  btnAuto.onclick = () => setPlacement(c.id, c.correctBin);

  const btnToPile = document.createElement("button");
  btnToPile.type = "button";
  btnToPile.className = "btn btn-secondary btn-small";
  btnToPile.textContent = "Move to pile";
  btnToPile.onclick = () => setPlacement(c.id, "pile");

  actions.appendChild(btnReveal);
  actions.appendChild(btnAuto);
  actions.appendChild(btnToPile);

  root.appendChild(title);
  root.appendChild(meta);
  root.appendChild(why);
  root.appendChild(actions);
}

function renderProgress() {
  const root = document.getElementById("progress");
  if (!root) return;

  const log = loadRunLog();
  const sc = getScenario();
  const recent = log.filter(x => x.scenarioId === sc.id).slice(-5).reverse();
  const best = log.filter(x => x.scenarioId === sc.id).reduce((m, x) => Math.max(m, x.score || 0), 0);

  root.innerHTML = "";

  const sum = document.createElement("div");
  sum.className = "progress-summary";
  sum.textContent = `Best score (this scenario): ${best} / 100 • Runs logged: ${log.length}`;
  root.appendChild(sum);

  const btnRow = document.createElement("div");
  btnRow.className = "progress-actions";

  const btnClearHistory = document.createElement("button");
  btnClearHistory.type = "button";
  btnClearHistory.className = "btn btn-secondary btn-small";
  btnClearHistory.textContent = "Clear run history";
  btnClearHistory.onclick = () => {
    clearRunLog();
    renderProgress();
    toast("Run history cleared.");
  };

  const btnFactory = document.createElement("button");
  btnFactory.type = "button";
  btnFactory.className = "btn btn-secondary btn-small";
  btnFactory.textContent = "Factory reset (all local data)";
  btnFactory.onclick = () => {
    if (!confirm("This clears saved runs, progress, custom decks, and resume state. Continue?")) return;
    clearRunLog();
    localStorage.removeItem(CUSTOM_SCENARIOS_KEY);
    clearSavedState();
    clearPlacements();
    setupScenarioSelector();
    applyScenarioDefaults();
    renderLessons();
    renderProgress();
    toast("Factory reset complete.");
  };

  btnRow.appendChild(btnClearHistory);
  btnRow.appendChild(btnFactory);
  root.appendChild(btnRow);

  if (!recent.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No runs yet. Press Check to log progress.";
    root.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "progress-table";
  table.innerHTML = "<thead><tr><th>When</th><th>Date</th><th>Score</th><th>Mistakes</th></tr></thead>";
  const tb = document.createElement("tbody");

  for (const r of recent) {
    const tr = document.createElement("tr");
    const when = new Date(r.at).toLocaleString();
    tr.innerHTML = `<td>${when}</td><td>${r.date}</td><td>${r.score}</td><td>${r.mistakes}</td>`;
    tb.appendChild(tr);
  }

  table.appendChild(tb);
  root.appendChild(table);
}

/* ---------- Buttons ---------- */
function setupButtons() {
  const btnTheme = document.getElementById("btnTheme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  const chkChallenge = document.getElementById("chkChallenge");
  if (chkChallenge) {
    chkChallenge.checked = isChallengeMode();
    chkChallenge.addEventListener("change", () => {
      // Do not allow mode switching mid-run
      const hasPlacements = Object.keys(state.placements || {}).length > 0;
      if (hasPlacements) {
        chkChallenge.checked = isChallengeMode();
        toast("Reset before switching Challenge mode.");
        return;
      }
      state.mode = chkChallenge.checked ? "challenge" : "practice";
      clearCallout();
      resetChallengeState();
      ensureChallengeTimer();
      const cs = document.getElementById("challengeSummary");
      if (cs) { cs.style.display = "none"; cs.innerHTML = ""; }
      toast(state.mode === "challenge" ? "Challenge mode enabled." : "Practice mode enabled.");
    });
  }

  const btnWorksheet = document.getElementById("btnWorksheet");
  if (btnWorksheet) {
    btnWorksheet.addEventListener("click", () => {
      const sc = getScenario();
      const dateVal = document.getElementById("dateWarp")?.value || sc.defaultDate || "2026-02-27";
      const url = `worksheet.html?scenario=${encodeURIComponent(sc.id)}&date=${encodeURIComponent(dateVal)}`;
      window.open(url, "_blank");
    });
  }


  const btnCheck = document.getElementById("btnCheck");
  if (btnCheck) btnCheck.addEventListener("click", check);

  const btnReset = document.getElementById("btnReset");
  if (btnReset) btnReset.addEventListener("click", () => {
    clearPlacements();
    stopChallengeTimer();
    const st = document.getElementById("scoreText");
    if (st) st.textContent = "—";
    const ms = document.getElementById("mistakes");
    if (ms) ms.innerHTML = "";
    const cs = document.getElementById("challengeSummary");
    if (cs) { cs.style.display = "none"; cs.innerHTML = ""; }
    toast("Reset (placements cleared).");
  });

  const btnExport = document.getElementById("btnExport");
  if (btnExport) btnExport.addEventListener("click", exportBlocks);

  const dateWarp = document.getElementById("dateWarp");
  if (dateWarp) dateWarp.addEventListener("change", () => render());

  const btnResume = document.getElementById("btnResume");
  if (btnResume) {
    btnResume.addEventListener("click", () => {
      const saved = loadSavedState();
      if (!saved || !saved.placements || !Object.keys(saved.placements).length) return;
      state.scenarioId = saved.scenarioId || state.scenarioId;
      state.placements = saved.placements || {};
      state.selectedCardId = null;
      state.failCounts = {};
      state.quizAnswers = {};
      state.mode = "practice";
      resetChallengeState();
      const chk = document.getElementById("chkChallenge");
      if (chk) chk.checked = false;
      setupScenarioSelector();
      applyScenarioDefaults();
      render();
      renderInspector();
      renderProgress();
      renderQuiz();
      toast("Resumed last run.");
    });
  }
}

function setupResumeButton() {
  const saved = loadSavedState();
  const btnResume = document.getElementById("btnResume");
  if (!btnResume) return;
  if (saved && saved.placements && Object.keys(saved.placements).length) {
    btnResume.style.display = "inline-flex";
  } else {
    btnResume.style.display = "none";
  }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setStatusPills();
  applyTheme(getPreferredTheme());

  // Start fresh by default. Do not auto-resume.
  setupScenarioSelector();
  applyScenarioDefaults();
  setupButtons();
  setupResumeButton();
  render();
  renderLessons();
  renderInspector();
  renderProgress();
  renderQuiz();
  renderCallout();
  updateChallengeStats();
});
