/* Context Tetris — Iteration 1 (mobile-first, no drag required)
   - Tap-based add/remove
   - Up/Down reordering
   - Token budgeting + overload signals
   - Shared features: version/env pills + theme + help/feedback
*/

const APP_VERSION = "v0.3.5";
const STORAGE_KEY = "ctetris_runs_v2";
const THEME_KEY = "app_theme";
const TUTORIAL_DONE_KEY = "ctetris_tutorial_v2_done";

let tourState = {
  isOpen: false,
  stepIndex: 0,
  lastFocus: null,
  highlightedEl: null,
};

const TOUR_STEPS = [
  {
    title: "Welcome to Context Tetris",
    body: `
      <p><strong>Goal:</strong> pack the right context blocks into a finite window without overload.</p>
      <ul>
        <li>Start mobile-first: tap <em>Add</em>, then reorder with <em>Up/Down</em>.</li>
        <li>Keep required blocks; cut noise.</li>
        <li>Score your pack and learn quick fixes.</li>
      </ul>
      <p>You can reopen this anytime via the <strong>Tutorial</strong> button.</p>
    `,
    targetId: null,
  },
  {
    title: "1) Pick a task card",
    body: `
      <p>Select a task. Each task has <strong>required</strong> and <strong>recommended</strong> context blocks.</p>
      <p>Your score depends on including required blocks and keeping the pack under budget.</p>
    `,
    targetId: "taskSelect",
  },
  {
    title: "2) Choose your window capacity",
    body: `
      <p>Set a token budget (your “context window”). Smaller budgets are harder but teach prioritization faster.</p>
      <p>Watch the meter: green is safe, orange is tight, red is overload.</p>
    `,
    targetId: "capacity",
  },
  {
    title: "3) Add blocks from the queue",
    body: `
      <p>Tap <strong>Add</strong> on blocks that match the task’s requirements.</p>
      <p>Tip: Tier 1–2 blocks usually win. Tier 6 is “nice-to-have”.</p>
    `,
    targetId: "queueList",
  },
  {
    title: "4) Pack the context window",
    body: `
      <p>Reorder blocks with <strong>Up/Down</strong>. Put the most important blocks earlier.</p>
      <p>Use <strong>Tune</strong> if a block’s token estimate feels off.</p>
    `,
    targetId: "windowList",
  },
  {
    title: "5) Score the pack",
    body: `
      <p>Press <strong>Score Pack</strong> to evaluate coverage, ordering, and overload.</p>
      <p>Scores are meant to be directional—iterate and compare runs.</p>
    `,
    targetId: "btnScore",
  },
  {
    title: "6) Apply Quick Fixes",
    body: `
      <p>If you’re overloaded or missing essentials, try <strong>Apply Quick Fixes</strong>.</p>
      <p>It prioritizes required blocks and trims low-value items when needed.</p>
    `,
    targetId: "btnQuickFix",
  },
  {
    title: "7) Review run history",
    body: `
      <p>Every scored run is saved locally. Compare your improvements over time.</p>
      <p>When you finish the tutorial, it won’t auto-open again (unless you reopen it manually).</p>
    `,
    targetId: "historyList",
  },
  {
    title: "Done",
    body: `
      <p><strong>Nice.</strong> You’re ready to pack context efficiently.</p>
      <ul>
        <li>Try a harder capacity.</li>
        <li>Experiment with block order.</li>
        <li>Use Quick Fixes as a teaching aid, not a crutch.</li>
      </ul>
      <p>Click <strong>Next</strong> to finish.</p>
    `,
    targetId: null,
  },
];

let TASKS = [];
let BLOCKS = [];
let state = {
  capacity: 1200,
  taskId: null,
  windowBlockIds: [],           // ordered list
  blockOverrides: {},          // id -> { tokenEstimate }
  drafts: {},                 // id -> textarea content
};

function currentTask() {
  return TASKS.find(t => t.id === state.taskId) || null;
}

function needForBlock(task, id) {
  if (!task) return "";
  if ((task.requiredBlocks || []).includes(id)) return "required";
  if ((task.recommendedBlocks || []).includes(id)) return "recommended";
  return "";
}

function needRank(task, id) {
  const n = needForBlock(task, id);
  return n === "required" ? 0 : (n === "recommended" ? 1 : 2);
}

function toast(message, kind = "info") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("on"), 2600);
}

function $(id) { return document.getElementById(id); }

function detectEnvironment() {
  const { protocol, hostname } = window.location;

  if (protocol === "file:") return "File";
  if (hostname === "localhost" || hostname === "127.0.0.1") return "Local";
  if (hostname.endsWith("github.io")) return "GitHub Pages";
  return "Web";
}

function setStatusPills() {
  const v = $("pillVersion");
  const e = $("pillEnv");
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
  const status = $("themeStatus");
  if (status) status.textContent = `Theme set to ${theme}`;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function isTutorialDone() {
  return localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
}

function markTutorialDone() {
  localStorage.setItem(TUTORIAL_DONE_KEY, "1");
}

function setTourMode(mode) {
  const root = document.getElementById("tour");
  if (!root) return;
  root.classList.toggle("tour-hole", mode === "hole");
}

function hideTutorialSpotlight() {
  const spot = document.getElementById("tourSpotlight");
  if (!spot) return;
  spot.hidden = true;
}

function positionTutorialSpotlight(el) {
  const spot = document.getElementById("tourSpotlight");
  if (!spot || !tourState.isOpen) return;

  if (!el) {
    setTourMode("full");
    hideTutorialSpotlight();
    return;
  }

  setTourMode("hole");

  const rect = el.getBoundingClientRect();
  const pad = window.innerWidth < 520 ? 10 : 12;

  const top = Math.max(8, rect.top - pad);
  const left = Math.max(8, rect.left - pad);
  const width = Math.max(24, Math.min(window.innerWidth - 16, rect.width + pad * 2));
  const height = Math.max(24, Math.min(window.innerHeight - 16, rect.height + pad * 2));

  spot.style.top = top + "px";
  spot.style.left = left + "px";
  spot.style.width = width + "px";
  spot.style.height = height + "px";
  spot.hidden = false;
}



function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function resetTutorialPanelPosition() {
  const els = getTourEls();
  if (!els.panel) return;
  els.panel.style.left = "50%";
  els.panel.style.top = "50%";
  els.panel.style.transform = "translate(-50%, -50%)";
}

function positionTutorialPanel(targetEl) {
  const els = getTourEls();
  const panel = els.panel;
  if (!panel || !tourState.isOpen) return;

  // Default center if no target
  if (!targetEl) {
    resetTutorialPanelPosition();
    return;
  }

  // Measure
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = vw < 520 ? 10 : 12;

  const t = targetEl.getBoundingClientRect();

  // Temporarily center to get stable measurements if needed
  resetTutorialPanelPosition();
  const p = panel.getBoundingClientRect();
  const w = p.width;
  const h = p.height;

  const spaceBelow = vh - t.bottom - pad;
  const spaceAbove = t.top - pad;
  const spaceRight = vw - t.right - pad;
  const spaceLeft  = t.left - pad;

  let placement = "below";
  if (spaceBelow >= h + 8) placement = "below";
  else if (spaceAbove >= h + 8) placement = "above";
  else if (Math.max(spaceLeft, spaceRight) >= w + 8) placement = spaceRight >= spaceLeft ? "right" : "left";
  else placement = spaceBelow >= spaceAbove ? "below" : "above";

  let top = 0, left = 0;

  if (placement === "below") {
    top = t.bottom + pad;
    left = clamp(t.left + t.width/2 - w/2, pad, vw - w - pad);
  } else if (placement === "above") {
    top = t.top - pad - h;
    left = clamp(t.left + t.width/2 - w/2, pad, vw - w - pad);
  } else if (placement === "right") {
    left = t.right + pad;
    top = clamp(t.top + t.height/2 - h/2, pad, vh - h - pad);
  } else { // left
    left = t.left - pad - w;
    top = clamp(t.top + t.height/2 - h/2, pad, vh - h - pad);
  }

  // If the panel still overlaps the target (small screens), nudge away.
  const overlaps = !(left + w < t.left || left > t.right || top + h < t.top || top > t.bottom);
  if (overlaps) {
    // Try alternate placement
    const tryOrder = placement === "below" ? ["above", "right", "left"] :
                    placement === "above" ? ["below", "right", "left"] :
                    placement === "right" ? ["left", "below", "above"] :
                                            ["right", "below", "above"];

    for (const alt of tryOrder) {
      let tt = top, ll = left;
      if (alt === "below") {
        tt = t.bottom + pad;
        ll = clamp(t.left + t.width/2 - w/2, pad, vw - w - pad);
      } else if (alt === "above") {
        tt = t.top - pad - h;
        ll = clamp(t.left + t.width/2 - w/2, pad, vw - w - pad);
      } else if (alt === "right") {
        ll = t.right + pad;
        tt = clamp(t.top + t.height/2 - h/2, pad, vh - h - pad);
      } else if (alt === "left") {
        ll = t.left - pad - w;
        tt = clamp(t.top + t.height/2 - h/2, pad, vh - h - pad);
      }
      const ok = !(ll + w < t.left || ll > t.right || tt + h < t.top || tt > t.bottom);
      if (!ok) { top = tt; left = ll; break; }
    }
  }

  top = clamp(top, pad, vh - h - pad);
  left = clamp(left, pad, vw - w - pad);

  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.transform = "none";
}

function clearTutorialHighlight() {
  if (tourState.highlightedEl) {
    tourState.highlightedEl.classList.remove("tour-highlight");
    tourState.highlightedEl = null;
  }
  setTourMode("full");
  hideTutorialSpotlight();
  resetTutorialPanelPosition();
}

function setTutorialHighlight(targetId) {
  clearTutorialHighlight();

  // If the step has no target, use full-dim mode (no spotlight hole).
  if (!targetId) {
    positionTutorialSpotlight(null);
    resetTutorialPanelPosition();
    return;
  }

  const el = document.getElementById(targetId);
  if (!el) {
    positionTutorialSpotlight(null);
    resetTutorialPanelPosition();
    return;
  }

  el.classList.add("tour-highlight");
  tourState.highlightedEl = el;

  try {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  } catch {
    el.scrollIntoView();
  }

  // Position spotlight after scroll settles (mobile keyboards / smooth scroll).
  requestAnimationFrame(() => { positionTutorialSpotlight(el); positionTutorialPanel(el); });
  setTimeout(() => { positionTutorialSpotlight(el); positionTutorialPanel(el); }, 240);
}


function setupTutorialUI() {
  const tutBtn = $("btnTutorial");
  if (tutBtn) tutBtn.addEventListener("click", () => openTutorial(0));

  const els = getTourEls();
  if (els.backdrop) els.backdrop.addEventListener("click", () => closeTutorial({ markDone: false }));
  if (els.btnClose) els.btnClose.addEventListener("click", () => closeTutorial({ markDone: false }));
  if (els.btnSkip) els.btnSkip.addEventListener("click", () => closeTutorial({ markDone: true }));
  if (els.btnNext) els.btnNext.addEventListener("click", () => nextTutorialStep());
  if (els.btnBack) els.btnBack.addEventListener("click", () => prevTutorialStep());

  document.addEventListener("keydown", (e) => {
    if (!tourState.isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closeTutorial({ markDone: false }); return; }
    trapFocus(e);
  });

  window.addEventListener("resize", () => {
    if (!tourState.isOpen) return;
    positionTutorialSpotlight(tourState.highlightedEl);
    positionTutorialPanel(tourState.highlightedEl);
  });

  window.addEventListener("scroll", () => {
    if (!tourState.isOpen) return;
    positionTutorialSpotlight(tourState.highlightedEl);
    positionTutorialPanel(tourState.highlightedEl);
  }, true);
}

function getTourEls() {
  return {
    root: $("tour"),
    backdrop: document.querySelector("#tour .tour-backdrop"),
    panel: document.querySelector("#tour .tour-panel"),
    title: $("tourTitle"),
    body: $("tourBody"),
    progress: $("tourProgress"),
    btnNext: $("tourNext"),
    btnBack: $("tourBack"),
    btnSkip: $("tourSkip"),
    btnClose: $("tourClose"),
  };
}

function openTutorial(startIndex = 0, { auto = false } = {}) {
  const els = getTourEls();
  if (!els.root || !els.panel) return;

  tourState.isOpen = true;
  tourState.stepIndex = Math.max(0, Math.min(startIndex, TOUR_STEPS.length - 1));
  tourState.lastFocus = document.activeElement;

  document.body.classList.add("tour-open");
  els.root.hidden = false;

  renderTutorialStep();

  // Focus first actionable control for accessibility
  setTimeout(() => {
    (els.btnNext || els.panel).focus?.();
  }, 0);
}

function closeTutorial({ markDone = false } = {}) {
  const els = getTourEls();
  if (!els.root) return;

  tourState.isOpen = false;

  if (markDone) markTutorialDone();

  clearTutorialHighlight();
  document.body.classList.remove("tour-open");
  els.root.hidden = true;

  const restore = tourState.lastFocus;
  tourState.lastFocus = null;
  if (restore && restore.focus) restore.focus();
}

function renderTutorialStep() {
  const els = getTourEls();
  const step = TOUR_STEPS[tourState.stepIndex];
  if (!els.root || !step) return;

  if (els.title) els.title.textContent = step.title;
  if (els.body) els.body.innerHTML = step.body;
  if (els.progress) els.progress.textContent = `Step ${tourState.stepIndex + 1} of ${TOUR_STEPS.length}`;

  if (els.btnBack) els.btnBack.disabled = tourState.stepIndex === 0;

  if (els.btnNext) {
    els.btnNext.textContent = tourState.stepIndex >= TOUR_STEPS.length - 1 ? "Finish" : "Next";
  }

  setTutorialHighlight(step.targetId);
}

function nextTutorialStep() {
  if (tourState.stepIndex >= TOUR_STEPS.length - 1) {
    closeTutorial({ markDone: true });
    return;
  }
  tourState.stepIndex += 1;
  renderTutorialStep();
}

function prevTutorialStep() {
  if (tourState.stepIndex <= 0) return;
  tourState.stepIndex -= 1;
  renderTutorialStep();
}

function trapFocus(e) {
  if (!tourState.isOpen || e.key !== "Tab") return;

  const els = getTourEls();
  const panel = els.panel;
  if (!panel) return;

  const focusables = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const list = Array.from(focusables).filter(x => !x.disabled && x.offsetParent !== null);
  if (list.length === 0) return;

  const first = list[0];
  const last = list[list.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function loadJSON(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${url}`);
    return r.json();
  });
}

function tierLabel(tier) {
  switch (tier) {
    case 1: return "Non‑negotiable";
    case 2: return "Facts/grounding";
    case 3: return "Memory";
    case 4: return "Examples/schema";
    case 5: return "Request";
    case 6: return "Nice‑to‑have";
    default: return `Tier ${tier}`;
  }
}

function getBlock(id) {
  return BLOCKS.find(b => b.id === id);
}

function tokenEstimateFor(id) {
  const base = getBlock(id)?.tokenEstimate ?? 0;
  const override = state.blockOverrides[id]?.tokenEstimate;
  return Number.isFinite(override) ? override : base;
}

function tokensUsed() {
  return state.windowBlockIds.reduce((sum, id) => sum + tokenEstimateFor(id), 0);
}

function setCapacityFromUI() {
  const v = Number($("capacity").value);
  state.capacity = Number.isFinite(v) ? v : 1200;
  $("tokensCap").textContent = String(state.capacity);
  renderAll();
}

function ensureTaskSelected() {
  return Boolean(state.taskId);
}

function requiredForTask(task) {
  return task?.requiredBlocks ?? [];
}

function recommendedForTask(task) {
  return task?.recommendedBlocks ?? [];
}

function isInWindow(id) {
  return state.windowBlockIds.includes(id);
}

function addToWindow(id) {
  if (isInWindow(id)) return;
  state.windowBlockIds.push(id);
  toast(`Added: ${getBlock(id)?.label ?? id}`);
  renderAll();
}

function removeFromWindow(id) {
  state.windowBlockIds = state.windowBlockIds.filter(x => x !== id);
  toast(`Removed: ${getBlock(id)?.label ?? id}`, "warn");
  renderAll();
}

function moveInWindow(id, dir) {
  const idx = state.windowBlockIds.indexOf(id);
  if (idx < 0) return;
  const next = idx + dir;
  if (next < 0 || next >= state.windowBlockIds.length) return;
  const copy = [...state.windowBlockIds];
  [copy[idx], copy[next]] = [copy[next], copy[idx]];
  state.windowBlockIds = copy;
  renderAll();
}

function renderTaskSelect() {
  const sel = $("taskSelect");
  if (!sel) return;
  sel.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select a task…";
  ph.disabled = true;
  ph.selected = !state.taskId;
  sel.appendChild(ph);

  TASKS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
  sel.value = state.taskId ?? "";
}

function renderTaskDetails() {
  const box = $("taskDetails");
  if (!box) return;
  const task = currentTask();

  if (!task) {
    box.innerHTML = `
      <div class="muted small"><strong>No task selected.</strong> Pick a task card to load its required/recommended context blocks.</div>
      <ul class="small" style="margin-top:8px;">
        <li>Then add blocks from the queue into the Context Window.</li>
        <li>Keep the pack under budget (avoid overload).</li>
        <li>Score your pack to learn what to keep, cut, or reorder.</li>
      </ul>
    `;
    return;
  }

  const reqIds = requiredForTask(task);
  const recIds = recommendedForTask(task);
  const req = reqIds.map(id => getBlock(id)?.label ?? id);
  const rec = recIds.map(id => getBlock(id)?.label ?? id);

  const missingReq = reqIds.filter(id => !isInWindow(id)).map(id => getBlock(id)?.label ?? id);
  const missingRec = recIds.filter(id => !isInWindow(id)).map(id => getBlock(id)?.label ?? id);

  const crit = Array.isArray(task.successCriteria) ? task.successCriteria : [];
  const critHTML = crit.length ? `<ul class="small">${crit.map(c => `<li>${escapeHTML(c)}</li>`).join("")}</ul>` : "";

  box.innerHTML = `
    <div class="small"><strong>${escapeHTML(task.name)}</strong> — ${escapeHTML(task.description || "")}</div>

    <div class="reqrec">
      <div class="small muted"><strong>Required:</strong> ${req.join(", ") || "—"}</div>
      <div class="small muted"><strong>Recommended:</strong> ${rec.join(", ") || "—"}</div>
    </div>

    <div class="reqrec">
      <div class="small ${missingReq.length ? "warn" : "muted"}"><strong>Missing required right now:</strong> ${missingReq.length ? missingReq.join(", ") : "None ✅"}</div>
      <div class="small ${missingRec.length ? "muted" : "muted"}"><strong>Missing recommended right now:</strong> ${missingRec.length ? missingRec.join(", ") : "None ✅"}</div>
    </div>

    ${critHTML ? `<div class="small" style="margin-top:8px;"><strong>Success criteria:</strong>${critHTML}</div>` : ""}
  `;
}

function blockCardHTML(b, mode) {
  const inWindow = isInWindow(b.id);
  const t = tokenEstimateFor(b.id);
  const hint = b.hint ?? "";

  const task = currentTask();

  const need = needForBlock(task, b.id);
  const needTag = need === "required"
    ? `<span class="badge badge-req">Required</span>`
    : (need === "recommended" ? `<span class="badge badge-rec">Recommended</span>` : "");

  const badge = `${tierLabel(b.tier)} • ~${t} tok`;

  if (mode === "queue") {
    return `
      <div class="block ${need ? "need-"+need : ""}" data-id="${b.id}">
        <div class="block-head">
          <div>
            <div class="block-title">${b.label}</div>
            <div class="small muted">${hint}</div>
          </div>
          <div class="badge-stack">
            ${needTag}
            <span class="badge">${badge}</span>
          </div>
        </div>
        <div class="block-actions">
          <button class="icon-btn" type="button" data-action="add" ${inWindow ? "disabled" : ""} aria-label="Add block">Add</button>
        </div>
      </div>
    `;
  }

  // window mode
  const draft = state.drafts[b.id] ?? "";
  return `
    <div class="block ${need ? "need-"+need : ""}" data-id="${b.id}">
      <div class="block-head">
        <div>
          <div class="block-title">${b.label}</div>
          <div class="small muted">${hint}</div>
        </div>
        <div class="badge-stack">
          ${needTag}
          <span class="badge">${badge}</span>
        </div>
      </div>

      <div class="row" style="margin-top:10px;">
        <label class="label" for="txt_${b.id}">Optional content</label>
        <textarea class="textarea" id="txt_${b.id}" data-action="draft" placeholder="Type short content (optional)">${escapeHTML(draft)}</textarea>
      </div>

      <div class="block-actions">
        <button class="icon-btn" type="button" data-action="up" aria-label="Move up">Up</button>
        <button class="icon-btn" type="button" data-action="down" aria-label="Move down">Down</button>
        <button class="icon-btn" type="button" data-action="tune" aria-label="Tune tokens">Tune</button>
        <button class="icon-btn" type="button" data-action="remove" aria-label="Remove">Remove</button>
      </div>
    </div>
  `;
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderQueue() {
  const list = $("queueList");
  if (!list) return;

  const task = currentTask();
  if (!task) {
    list.innerHTML = `<div class="muted small">Select a task card to load the block queue.</div>`;
    return;
  }


  const sorted = [...BLOCKS].sort((a, b) => {
    const ar = needRank(task, a.id);
    const br = needRank(task, b.id);
    if (ar !== br) return ar - br;
    if ((a.tier ?? 99) !== (b.tier ?? 99)) return (a.tier ?? 99) - (b.tier ?? 99);
    return String(a.label).localeCompare(String(b.label));
  });

  list.innerHTML = sorted.map(b => blockCardHTML(b, "queue")).join("");
  list.querySelectorAll("button[data-action='add']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest(".block")?.dataset?.id;
      if (id) addToWindow(id);
    });
  });
}

function renderWindow() {
  const list = $("windowList");
  if (!list) return;

  if (!state.windowBlockIds.length) {
    list.innerHTML = `<div class="muted small">No blocks in the Context Window yet.</div>`;
    return;
  }


  const inOrder = state.windowBlockIds.map(id => getBlock(id)).filter(Boolean);
  list.innerHTML = inOrder.map(b => blockCardHTML(b, "window")).join("");

  // handlers
  list.querySelectorAll(".block").forEach(el => {
    const id = el.dataset.id;
    el.querySelectorAll("button.icon-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.action;
        if (act === "remove") removeFromWindow(id);
        if (act === "up") moveInWindow(id, -1);
        if (act === "down") moveInWindow(id, +1);
        if (act === "tune") tuneTokens(id);
      });
    });

    const ta = el.querySelector("textarea[data-action='draft']");
    if (ta) {
      ta.addEventListener("input", () => {
        state.drafts[id] = ta.value;
      });
    }
  });
}

function tuneTokens(id) {
  const current = tokenEstimateFor(id);
  const next = prompt("Token estimate for this block (number):", String(current));
  if (next === null) return;
  const n = Number(next);
  if (!Number.isFinite(n) || n < 0) {
    alert("Please enter a non-negative number.");
    return;
  }
  state.blockOverrides[id] = { tokenEstimate: Math.round(n) };
  renderAll();
}

function renderMeter() {
  const used = tokensUsed();
  const cap = state.capacity;
  const pct = cap > 0 ? Math.min(used / cap, 1) : 0;
  $("tokensUsed").textContent = String(used);
  $("tokensCap").textContent = String(cap);

  const bar = $("meterBar");
  if (bar) bar.style.width = `${Math.round(pct * 100)}%`;

  const label = $("overloadLabel");
  if (!label) return;

  if (used > cap) {
    label.textContent = "Overloaded";
    label.style.color = "var(--danger)";
  } else if (used > cap * 0.85) {
    label.textContent = "Near limit";
    label.style.color = "var(--warn)";
  } else {
    label.textContent = "OK";
    label.style.color = "var(--ok)";
  }
}

function ghostState() {
  const ids = state.windowBlockIds;
  const idxRules = ids.indexOf("rules");
  const idxRole = ids.indexOf("role");

  // ghost triggers if rules are missing or buried after 2nd position,
  // or if role is missing, or if role/rules aren't near the top.
  const trigger = (idxRules === -1) || (idxRules > 1) || (idxRole === -1) || (idxRole > 1);

  const box = $("ghostBox");
  if (!box) return;

  if (trigger) {
    box.classList.add("on");
    box.innerHTML = `
      <strong>Constraint Drift Ghost 👻</strong>
      <div class="small muted" style="margin-top:6px;">
        Your non‑negotiables aren’t anchored at the top. Expect drift: ignored constraints, weird focus, and “plausible” guesses.
      </div>
    `;
  } else {
    box.classList.remove("on");
    box.innerHTML = "";
  }
}

function scorePack() {
  const task = currentTask();

  if (!task) {
    toast("Pick a task card first.", "warn");
    return;
  }

  const cap = state.capacity;
  const used = tokensUsed();
  const overload = used > cap;

  const req = requiredForTask(task);
  const rec = recommendedForTask(task);

  const missingReq = req.filter(id => !isInWindow(id));
  const missingRec = rec.filter(id => !isInWindow(id));

  const hasNice = isInWindow("nice");
  const hasRole = isInWindow("role");
  const hasRules = isInWindow("rules");
  const requestLast = state.windowBlockIds[state.windowBlockIds.length - 1] === "request";

  // ordering score: reward ascending tiers + request-last
  let orderPairsOk = 0;
  const tierSeq = state.windowBlockIds.map(id => getBlock(id)?.tier ?? 99);
  for (let i = 1; i < tierSeq.length; i++) {
    if (tierSeq[i] >= tierSeq[i - 1]) orderPairsOk += 1;
  }
  const orderRatio = tierSeq.length <= 1 ? 1 : (orderPairsOk / (tierSeq.length - 1));
  const orderBonus = requestLast ? 1 : 0;

  // budget score: sweet spot is 70–95%
  const pct = cap > 0 ? used / cap : 0;
  let budgetPts = 0;
  if (overload) budgetPts = 0;
  else if (pct >= 0.70 && pct <= 0.95) budgetPts = 20;
  else if (pct >= 0.55 && pct < 0.70) budgetPts = 16;
  else if (pct > 0.95 && pct <= 1.00) budgetPts = Math.max(10, 20 - Math.round((pct - 0.95) * 200));
  else budgetPts = 12;

  // component scores
  const reqPts = req.length ? Math.round((req.length - missingReq.length) / req.length * 55) : 55;
  const recPts = rec.length ? Math.round((rec.length - missingRec.length) / rec.length * 15) : 15;
  const orderPts = Math.round((orderRatio * 12) + (orderBonus * 3));

  let score = reqPts + recPts + orderPts + budgetPts;

  // penalties (anti-patterns)
  const penalties = [];
  if (!hasRole) penalties.push({ k: "Missing Role", p: 8 });
  if (!hasRules) penalties.push({ k: "Missing Rules", p: 8 });
  if (!requestLast && isInWindow("request")) penalties.push({ k: "Request not last", p: 5 });
  if (hasNice && missingReq.length) penalties.push({ k: "Nice-to-have before essentials", p: 10 });
  if (hasNice && pct > 0.80) penalties.push({ k: "Nice-to-have consumes budget", p: 5 });

  const penaltyPts = penalties.reduce((a, x) => a + x.p, 0);
  score = Math.max(0, Math.min(100, score - penaltyPts));

  const pass = (missingReq.length === 0) && !overload;

  const results = $("results");
  if (!results) return;
  results.classList.add("on");

  const missingReqNames = missingReq.map(id => getBlock(id)?.label ?? id);
  const missingRecNames = missingRec.map(id => getBlock(id)?.label ?? id);

  const fixes = recommendFixes({ task, missingReq, missingRec, overload, hasNice, used, cap, requestLast });

  const status = pass ? `<span class="pill ok">PASS</span>` : `<span class="pill danger">FAIL</span>`;

  const breakdown = `
    <div class="score-grid">
      <div class="score-item"><div class="small muted">Required</div><div><strong>${req.length - missingReq.length}</strong> / ${req.length}</div></div>
      <div class="score-item"><div class="small muted">Recommended</div><div><strong>${rec.length - missingRec.length}</strong> / ${rec.length}</div></div>
      <div class="score-item"><div class="small muted">Budget</div><div><strong>${used}</strong> / ${cap} tok ${overload ? '<span class="pill danger">Overload</span>' : '<span class="pill ok">OK</span>'}</div></div>
      <div class="score-item"><div class="small muted">Ordering</div><div><strong>${Math.round(orderRatio * 100)}%</strong> ${requestLast ? '<span class="pill ok">Request last</span>' : (isInWindow("request") ? '<span class="pill warn">Move request last</span>' : '')}</div></div>
    </div>
  `;

  const antiHTML = penalties.length
    ? `<div style="margin-top:10px;"><strong>Anti-patterns detected:</strong><ul class="small">${penalties.map(x => `<li>${escapeHTML(x.k)} (−${x.p})</li>`).join("")}</ul></div>`
    : `<div style="margin-top:10px;"><strong>Anti-patterns:</strong> none ✅</div>`;

  const missingHTML = missingReq.length
    ? `<div style="margin-top:10px;"><strong>Missing required:</strong> ${missingReqNames.join(", ")}</div>`
    : `<div style="margin-top:10px;"><strong>Required blocks:</strong> all present ✅</div>`;

  const missingRecHTML = missingRec.length
    ? `<div class="small muted" style="margin-top:6px;"><strong>Missing recommended:</strong> ${missingRecNames.join(", ")}</div>`
    : `<div class="small muted" style="margin-top:6px;"><strong>Recommended:</strong> all present ✅</div>`;

  const fixesHTML = fixes.length
    ? `<div style="margin-top:10px;"><strong>Suggested quick fixes:</strong><ul class="small">${fixes.map(f => `<li>${f}</li>`).join("")}</ul></div>`
    : "";

  results.innerHTML = `
    <div class="score-head">
      <div><strong>Score:</strong> ${score} / 100</div>
      <div>${status}</div>
    </div>
    ${breakdown}
    ${missingHTML}
    ${missingRecHTML}
    ${antiHTML}
    ${fixesHTML}
  `;

  saveRun({
    score,
    pass,
    used,
    cap,
    taskId: task.id,
    window: state.windowBlockIds,
    breakdown: { reqPts, recPts, orderPts, budgetPts, penaltyPts }
  });
  renderHistory();
}

function recommendFixes({ task, missingReq, missingRec, overload, hasNice, used, cap, requestLast }) {
  const fixes = [];

  if (missingReq.includes("role") || missingReq.includes("rules")) fixes.push("Add Role + Rules at the top (non‑negotiables).");
  if (missingReq.includes("grounding")) fixes.push("Add short grounding excerpts (avoid dumping whole docs).");
  if (missingReq.includes("memory")) fixes.push("Add a concise rolling Memory summary (not raw history).");
  if (missingReq.includes("dynamic")) fixes.push("Add a Dynamic Facts block for dates/IDs/status (keep separate from rules).");
  if (missingReq.includes("checks")) fixes.push("Add an Evaluation/Checks block (success criteria + test cases).");
  if (missingReq.includes("output")) fixes.push("Add an Output Format block (headings/checklist/schema).");
  if (missingReq.includes("request")) fixes.push("Add the User Request block, placed last.");

  if (!requestLast && isInWindow("request")) fixes.push("Move the User Request to the bottom (last block).");

  if (hasNice && (missingReq.length > 0 || used > cap * 0.80)) fixes.push("Prune: remove Nice‑to‑have until essentials fit comfortably.");

  if (overload) {
    fixes.push("Summarize: compress Memory into a short structured summary.");
    fixes.push("Retrieve: swap large docs for 2–6 short excerpts.");
    fixes.push("Structure: make the layout scannable with headings.");
  }

  // Encourage recommended blocks only if essentials are present
  if (!missingReq.length && missingRec.length) {
    const names = missingRec.map(id => getBlock(id)?.label ?? id);
    fixes.push(`Optional: add recommended blocks if budget allows (${names.join(", ")}).`);
  }

  return fixes;
}

function applyQuickFixes() {
  const task = currentTask();

  if (!task) {
    toast("Pick a task card first.", "warn");
    return;
  }

  const cap = state.capacity;

  // 1) Ensure essentials for this task exist
  const req = requiredForTask(task);
  req.forEach(id => { if (!isInWindow(id)) state.windowBlockIds.push(id); });

  // 2) If overloaded or crowded, remove nice-to-have
  const usedBefore = tokensUsed();
  if (usedBefore > cap || usedBefore > cap * 0.80) {
    if (isInWindow("nice")) removeFromWindow("nice");
  }

  // 3) If still tight, compress memory + grounding (simulate summarization/retrieval)
  if (tokensUsed() > cap) {
    if (isInWindow("memory")) state.blockOverrides["memory"] = { tokenEstimate: 90 };
    if (isInWindow("grounding")) state.blockOverrides["grounding"] = { tokenEstimate: 220 };
  }

  // 4) Ordering: sort by tier asc, then force request last
  const uniq = [];
  for (const id of state.windowBlockIds) if (!uniq.includes(id)) uniq.push(id);
  uniq.sort((a, b) => (getBlock(a)?.tier ?? 99) - (getBlock(b)?.tier ?? 99));
  // move request last if present
  const reqIdx = uniq.indexOf("request");
  if (reqIdx >= 0) {
    uniq.splice(reqIdx, 1);
    uniq.push("request");
  }
  state.windowBlockIds = uniq;

  toast("Quick fixes applied.");
  renderAll();
}

function clearResultsUI() {
  const results = $("results");
  if (results) {
    results.classList.remove("on");
    results.innerHTML = "";
  }
}

function resetPack(opts = {}) {
  state.windowBlockIds = [];
  state.blockOverrides = {};
  state.drafts = {};
  clearResultsUI();
  if (!opts.silent) toast("Pack reset.");
  renderAll();
}

function resetApp() {
  if (tourState?.isOpen) closeTutorial();
  resetPack({ silent: true });
  state.taskId = null;
  if ($("taskSelect")) $("taskSelect").value = "";
  toast("App reset.");
  renderAll();
}

function saveRun(run) {
  try {
    const now = new Date();
    const entry = {
      ts: now.toISOString(),
      ...run,
    };
    const prior = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    prior.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prior.slice(0, 30)));
  } catch (e) {
    // ignore
  }
}

function renderHistory() {
  const box = $("historyList");
  if (!box) return;

  let runs = [];
  try {
    runs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    runs = [];
  }

  if (!runs.length) {
    box.innerHTML = `<div class="muted small">No saved runs yet.</div>`;
    return;
  }

  box.innerHTML = runs.map(r => {
    const task = TASKS.find(t => t.id === r.taskId)?.name ?? r.taskId;
    const when = new Date(r.ts).toLocaleString();
    const status = r.pass ? `<span class="pill ok">PASS</span>` : `<span class="pill danger">FAIL</span>`;
    return `
      <div class="block">
        <div class="block-head">
          <div>
            <div class="block-title">${escapeHTML(task)}</div>
            <div class="small muted">${escapeHTML(when)}</div>
          </div>
          <div class="badge-stack">
            ${status}
            <span class="badge">${r.score}/100 • ${r.used}/${r.cap} tok</span>
          </div>
        </div>
        <div class="block-actions">
          <button class="icon-btn" type="button" data-act="replay">Replay</button>
        </div>
      </div>
    `;
  }).join("");

  box.querySelectorAll("button[data-act='replay']").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      try {
        const runs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const r = runs[i];
        if (!r) return;
        state.taskId = r.taskId;
        state.windowBlockIds = Array.isArray(r.window) ? r.window : [];
        if ($("taskSelect")) $("taskSelect").value = state.taskId;
        toast("Replayed a saved run.");
        renderAll();
      } catch {}
    });
  });
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  toast("History cleared.");
  renderHistory();
}


function renderControlsState() {
  const hasTask = Boolean(state.taskId);
  const scoreBtn = $("btnScore");
  const qfBtn = $("btnQuickFix");
  const resetBtn = $("btnReset");
  if (scoreBtn) scoreBtn.disabled = !hasTask;
  if (qfBtn) qfBtn.disabled = !hasTask;
  if (resetBtn) resetBtn.disabled = (!hasTask && state.windowBlockIds.length === 0);
}

function renderAll() {
  renderTaskSelect();
  renderTaskDetails();
  renderQueue();
  renderWindow();
  renderMeter();
  ghostState();
  renderControlsState();
}

async function init() {
  applyTheme(getPreferredTheme());
  setStatusPills();
  if (typeof setupTutorialUI === "function") setupTutorialUI();

  // load data
  [TASKS, BLOCKS] = await Promise.all([
    loadJSON("data/tasks.json"),
    loadJSON("data/blocks.json"),
  ]);


  // wiring
  $("taskSelect").addEventListener("change", () => {
    const prev = state.taskId;
    const next = $("taskSelect").value || null;
    state.taskId = next;
    if (next && next !== prev) {
      // switching tasks: clear the current pack so you don’t start with “previous” state
      state.windowBlockIds = [];
      state.blockOverrides = {};
      state.drafts = {};
      clearResultsUI();
      toast("Task loaded. Start packing blocks.");
    }
    renderAll();
  });

  $("capacity").addEventListener("change", setCapacityFromUI);

  $("btnTheme").addEventListener("click", toggleTheme);
  const resetAppBtn = $("btnResetApp");
  if (resetAppBtn) resetAppBtn.addEventListener("click", resetApp);
  $("btnScore").addEventListener("click", scorePack);
  $("btnQuickFix").addEventListener("click", applyQuickFixes);
  $("btnReset").addEventListener("click", resetPack);
  $("btnClearHistory").addEventListener("click", clearHistory);

  // initial
  $("tokensCap").textContent = String(state.capacity);
  renderAll();

  // Auto-open tutorial for first-time users (can be re-opened via header button)
  if (!isTutorialDone()) {
    setTimeout(() => openTutorial(0, { auto: true }), 350);
  }
  renderHistory();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(err => {
    console.error(err);
    alert("Failed to initialize app. See console for details.");
  });
});
