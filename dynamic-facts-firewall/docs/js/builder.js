/* Deck Builder — Dynamic Facts Firewall (Iteration 2) */

const APP_VERSION = "v0.3.0";
const THEME_KEY = "app_theme";
const CUSTOM_SCENARIOS_KEY = "dff_custom_scenarios_v1";

const BUILTIN_SCENARIOS = [
  { id: "support_downgrade", name: "Support: Subscription Downgrade", defaultDate: "2026-02-27", note: "Practice separating account + time values from behavior rules." },
  { id: "ops_incident", name: "Ops: Incident Triage", defaultDate: "2026-02-27", note: "Dynamic facts should be isolated so status updates don’t rot." },
  { id: "hr_headcount", name: "HR: Headcount Snapshot", defaultDate: "2026-02-27", note: "Separate time-varying counts from stable policy statements." }
];

const BINS = [
  { id: "role", label: "Role" },
  { id: "rules", label: "Rules / Constraints" },
  { id: "dynamic", label: "Dynamic Facts" },
  { id: "grounding", label: "Grounding Knowledge" },
  { id: "memory", label: "Memory" }
];

let selectedDeckId = null;
let workingDeck = null;

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

function loadCustomScenarios() {
  const raw = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCustomScenarios(arr) {
  localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(arr));
}

function uid() {
  return "custom_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function ensureWorkingDeck() {
  if (!workingDeck) {
    workingDeck = {
      id: uid(),
      name: "",
      note: "",
      defaultDate: new Date().toISOString().slice(0, 10),
      cards: []
    };
  }
}

function renderDeckList() {
  const root = document.getElementById("deckList");
  if (!root) return;

  const decks = loadCustomScenarios();
  root.innerHTML = "";

  if (!decks.length) {
    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = "No custom decks yet. Click New deck.";
    root.appendChild(p);
    return;
  }

  for (const d of decks) {
    const row = document.createElement("div");
    row.className = "deck-row" + (d.id === selectedDeckId ? " selected" : "");

    const left = document.createElement("div");
    left.className = "deck-left";
    left.innerHTML = `<div class="deck-name">${escapeHtml(d.name || "(unnamed deck)")}</div><div class="deck-note">${escapeHtml(d.note || "")}</div>`;

    const right = document.createElement("div");
    right.className = "deck-right";

    const btnSel = document.createElement("button");
    btnSel.type = "button";
    btnSel.className = "btn btn-small";
    btnSel.textContent = "Edit";
    btnSel.onclick = () => {
      selectedDeckId = d.id;
      workingDeck = JSON.parse(JSON.stringify(d));
      syncFormFromDeck();
      renderDeckList();
      renderCardsEditor();
      toast("Loaded deck for editing.");
    };

    right.appendChild(btnSel);
    row.appendChild(left);
    row.appendChild(right);
    root.appendChild(row);
  }
}

function syncFormFromDeck() {
  ensureWorkingDeck();
  document.getElementById("deckName").value = workingDeck.name || "";
  document.getElementById("deckNote").value = workingDeck.note || "";
  document.getElementById("deckDate").value = workingDeck.defaultDate || new Date().toISOString().slice(0, 10);
}

function syncDeckFromForm() {
  ensureWorkingDeck();
  workingDeck.name = (document.getElementById("deckName").value || "").trim();
  workingDeck.note = (document.getElementById("deckNote").value || "").trim();
  workingDeck.defaultDate = document.getElementById("deckDate").value || new Date().toISOString().slice(0, 10);
}

function renderCardsEditor() {
  const root = document.getElementById("cardsEditor");
  if (!root) return;

  ensureWorkingDeck();
  root.innerHTML = "";

  if (!workingDeck.cards.length) {
    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = "No cards yet. Click Add card.";
    root.appendChild(p);
    return;
  }

  for (const c of workingDeck.cards) {
    const wrap = document.createElement("div");
    wrap.className = "card-edit";

    const text = document.createElement("textarea");
    text.rows = 2;
    text.className = "card-edit-text";
    text.value = c.text || "";
    text.oninput = () => c.text = text.value;

    const row = document.createElement("div");
    row.className = "card-edit-row";

    const sel = document.createElement("select");
    sel.className = "card-edit-select";
    for (const b of BINS) {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = b.label;
      sel.appendChild(o);
    }
    sel.value = c.correctBin || "dynamic";
    sel.onchange = () => c.correctBin = sel.value;

    const dyn = document.createElement("label");
    dyn.className = "check";
    dyn.innerHTML = `<input type="checkbox" ${c.isDynamic ? "checked" : ""} /> <span>Dynamic</span>`;
    dyn.querySelector("input").onchange = (ev) => c.isDynamic = ev.target.checked;

    const stale = document.createElement("label");
    stale.className = "stale";
    stale.innerHTML = `<span>Stale-after (days)</span><input type="number" min="0" step="1" value="${typeof c.staleAfterDays === "number" ? c.staleAfterDays : ""}" placeholder="e.g., 7" />`;
    stale.querySelector("input").oninput = (ev) => {
      const v = ev.target.value.trim();
      c.staleAfterDays = v === "" ? undefined : Math.max(0, parseInt(v, 10) || 0);
    };

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn btn-secondary btn-small";
    btnDel.textContent = "Remove";
    btnDel.onclick = () => {
      workingDeck.cards = workingDeck.cards.filter(x => x.id !== c.id);
      renderCardsEditor();
      toast("Card removed.");
    };

    row.appendChild(sel);
    row.appendChild(dyn);
    row.appendChild(stale);
    row.appendChild(btnDel);

    wrap.appendChild(text);
    wrap.appendChild(row);

    root.appendChild(wrap);
  }
}

function addCard() {
  ensureWorkingDeck();
  workingDeck.cards.push({
    id: "card_" + Math.random().toString(16).slice(2),
    text: "",
    correctBin: "dynamic",
    isDynamic: true,
    staleAfterDays: 7,
    why: ""
  });
  renderCardsEditor();
}

function saveDeck() {
  syncDeckFromForm();
  ensureWorkingDeck();

  if (!workingDeck.name) {
    toast("Deck name is required.");
    return;
  }
  if (!workingDeck.cards.length) {
    toast("Add at least 1 card.");
    return;
  }

  // cleanup cards
  for (const c of workingDeck.cards) {
    c.text = (c.text || "").trim();
    if (!c.text) {
      toast("Every card needs text.");
      return;
    }
    if (!c.correctBin) c.correctBin = "dynamic";
  }

  const decks = loadCustomScenarios();
  const idx = decks.findIndex(x => x.id === workingDeck.id);
  if (idx >= 0) decks[idx] = workingDeck;
  else decks.push(workingDeck);

  saveCustomScenarios(decks);
  selectedDeckId = workingDeck.id;
  renderDeckList();
  toast("Deck saved.");
}

function deleteDeck() {
  if (!selectedDeckId) {
    toast("Select a deck first.");
    return;
  }
  if (!confirm("Delete selected deck?")) return;

  const decks = loadCustomScenarios().filter(x => x.id !== selectedDeckId);
  saveCustomScenarios(decks);

  selectedDeckId = null;
  workingDeck = null;
  ensureWorkingDeck();
  syncFormFromDeck();
  renderDeckList();
  renderCardsEditor();
  toast("Deck deleted.");
}

function duplicateBuiltin() {
  const pick = prompt("Type one: support, ops, hr");
  if (!pick) return;

  const map = { support: "support_downgrade", ops: "ops_incident", hr: "hr_headcount" };
  const id = map[pick.trim().toLowerCase()];
  if (!id) {
    toast("Unknown choice.");
    return;
  }

  const built = BUILTIN_SCENARIOS.find(x => x.id === id);
  if (!built) return;

  workingDeck = {
    id: uid(),
    name: built.name + " (Copy)",
    note: built.note || "",
    defaultDate: built.defaultDate || new Date().toISOString().slice(0, 10),
    cards: [
      { id: "c1", text: "System/Role: [copy and edit]", correctBin: "role" },
      { id: "c2", text: "Rules: [copy and edit]", correctBin: "rules" },
      { id: "c3", text: "Today’s date: " + (built.defaultDate || "2026-02-27"), correctBin: "dynamic", isDynamic: true, staleAfterDays: 0 },
    ]
  };

  selectedDeckId = workingDeck.id;
  syncFormFromDeck();
  renderCardsEditor();
  toast("Created a starter copy. Edit the cards, then Save deck.");
}

function exportJson() {
  if (!workingDeck) {
    toast("Nothing selected.");
    return;
  }
  syncDeckFromForm();
  const box = document.getElementById("jsonBox");
  box.value = JSON.stringify(workingDeck, null, 2);
  toast("Deck JSON exported to the box.");
}

function importJson() {
  const box = document.getElementById("jsonBox");
  const raw = (box.value || "").trim();
  if (!raw) {
    toast("Paste JSON first.");
    return;
  }

  let data;
  try { data = JSON.parse(raw); } catch {
    toast("Invalid JSON.");
    return;
  }

  const decks = loadCustomScenarios();

  const incoming = Array.isArray(data) ? data : [data];
  const cleaned = incoming
    .filter(d => d && d.name && Array.isArray(d.cards))
    .map(d => ({
      id: d.id || uid(),
      name: d.name,
      note: d.note || "",
      defaultDate: d.defaultDate || new Date().toISOString().slice(0, 10),
      cards: d.cards.map(c => ({
        id: c.id || ("card_" + Math.random().toString(16).slice(2)),
        text: (c.text || "").trim(),
        correctBin: c.correctBin || "dynamic",
        isDynamic: !!c.isDynamic,
        staleAfterDays: typeof c.staleAfterDays === "number" ? c.staleAfterDays : undefined,
        why: c.why || ""
      })).filter(c => c.text)
    }));

  if (!cleaned.length) {
    toast("No valid deck objects found.");
    return;
  }

  // upsert
  for (const d of cleaned) {
    const idx = decks.findIndex(x => x.id === d.id);
    if (idx >= 0) decks[idx] = d;
    else decks.push(d);
  }

  saveCustomScenarios(decks);
  toast(`Imported ${cleaned.length} deck(s).`);
  renderDeckList();
}

function escapeHtml(s) {
  return (s || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  setStatusPills();
  applyTheme(getPreferredTheme());

  document.getElementById("btnTheme").addEventListener("click", toggleTheme);
  document.getElementById("btnNew").addEventListener("click", () => {
    workingDeck = { id: uid(), name: "", note: "", defaultDate: new Date().toISOString().slice(0,10), cards: [] };
    selectedDeckId = workingDeck.id;
    syncFormFromDeck();
    renderCardsEditor();
    renderDeckList();
    toast("New deck created. Fill fields and add cards.");
  });
  document.getElementById("btnDuplicateCurrent").addEventListener("click", duplicateBuiltin);
  document.getElementById("btnAddCard").addEventListener("click", () => { addCard(); toast("Card added."); });
  document.getElementById("btnSave").addEventListener("click", saveDeck);
  document.getElementById("btnDelete").addEventListener("click", deleteDeck);
  document.getElementById("btnExportJson").addEventListener("click", exportJson);
  document.getElementById("btnImportJson").addEventListener("click", importJson);

  ensureWorkingDeck();
  syncFormFromDeck();
  renderDeckList();
  renderCardsEditor();
});
