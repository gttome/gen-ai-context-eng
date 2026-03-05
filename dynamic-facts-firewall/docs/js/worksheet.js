/* Worksheet — Dynamic Facts Firewall (Iteration 2) */

const APP_VERSION = "v0.3.0";
const THEME_KEY = "app_theme";
const CUSTOM_SCENARIOS_KEY = "dff_custom_scenarios_v1";

const BINS = [
  { id: "role", label: "Role" },
  { id: "rules", label: "Rules / Constraints" },
  { id: "dynamic", label: "Dynamic Facts" },
  { id: "grounding", label: "Grounding Knowledge" },
  { id: "memory", label: "Memory" }
];

const BUILTIN_SCENARIOS = [
  {
    id: "support_downgrade",
    name: "Support: Subscription Downgrade",
    note: "Practice isolating time-varying account details from stable behavior rules.",
    defaultDate: "2026-02-27",
    cards: [
      { id: "c1", text: "System/Role: You are a customer support agent for Acme.", correctBin: "role", why: "Identity and scope of the assistant belong in Role." },
      { id: "c2", text: "Rules: Use only the provided policy excerpt. Do not speculate.", correctBin: "rules", why: "Stable behavior guardrail." },
      { id: "c3", text: "Today’s date: 2026-02-27.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 0, capturedDate: "2026-02-27", exclusiveKey: "asof_date", why: "Dates change every run—keep them isolated for easy updates." },
      { id: "c4", text: "Snapshot A (captured 2026-02-26): Current plan: PRO.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-26", validTo: "2026-02-27", exclusiveKey: "plan", why: "This is a changing customer fact; isolate it so you can refresh it." },
      { id: "c19", text: "Snapshot B (captured 2026-02-27): Current plan: BASIC (downgrade completed).", correctBin: "dynamic", isDynamic: true, staleAfterDays: 1, capturedDate: "2026-02-27", validFrom: "2026-02-27", exclusiveKey: "plan", why: "Same fact category as the prior snapshot; only one should be ‘current’ at an as-of date." },
      { id: "c20", text: "Billing state (captured 2026-02-27): Last payment FAILED; retry scheduled.", correctBin: "dynamic", isDynamic: true, staleAfterDays: 2, capturedDate: "2026-02-27", exclusiveKey: "billing_state", why: "Run-specific status updates belong in Dynamic Facts, not Rules or Memory." },
      { id: "c5", text: "Policy excerpt: Downgrades occur after 2 failed payments; user can restore by paying within 30 days.", correctBin: "grounding", why: "This is a stable excerpt you want the model to follow." },
      { id: "c6", text: "Memory: Customer previously asked to keep a friendly tone and short steps.", correctBin: "memory", why: "A durable preference across runs." }
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
      { id: "c12", text: "Memory: Past incidents often needed a short executive summary first.", correctBin: "memory", why: "A durable reporting preference." }
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
      { id: "c18", text: "Memory: Leadership prefers a ‘risks + next steps’ section in updates.", correctBin: "memory", why: "Durable preference across reports." }
    ]
  }
];

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

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function loadCustomScenarios() {
  const raw = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(s => s && s.id && s.name && Array.isArray(s.cards));
  } catch {
    return [];
  }
}

function allScenarios() {
  return [...BUILTIN_SCENARIOS, ...loadCustomScenarios()];
}

function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

function dateDiffDays(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const ms = db - da;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isCardValidOnDate(card, dateVal) {
  if (card.validFrom && dateVal < card.validFrom) return false;
  if (card.validTo && dateVal > card.validTo) return false;
  return true;
}

function baseDateForCard(card, sc, dateVal) {
  return card.capturedDate || sc.defaultDate || dateVal;
}

function renderSignals(sc, dateVal) {
  const el = document.getElementById("wsSignals");
  if (!el) return;

  const dynamicCards = (sc.cards || []).filter(c => c.isDynamic);
  const stale = dynamicCards.filter(c => {
    const n = typeof c.staleAfterDays === "number" ? c.staleAfterDays : null;
    if (n === null) return false;
    const base = baseDateForCard(c, sc, dateVal);
    const d = dateDiffDays(base, dateVal);
    return Math.abs(d) > n;
  });

  const invalid = dynamicCards.filter(c => !isCardValidOnDate(c, dateVal));

  const groups = {};
  for (const c of dynamicCards) {
    if (!c.exclusiveKey) continue;
    groups[c.exclusiveKey] = groups[c.exclusiveKey] || [];
    groups[c.exclusiveKey].push(c);
  }
  const contradictions = Object.keys(groups).filter(k => groups[k].length > 1);

  const parts = [];
  if (stale.length) parts.push(`Stale dynamic facts: ${stale.length}`);
  if (invalid.length) parts.push(`Invalid-by-date facts: ${invalid.length}`);
  if (contradictions.length) parts.push(`Potential contradictions: ${contradictions.join(", ")}`);

  el.textContent = parts.length ? `Signals for ${dateVal}: ${parts.join(" • ")}` : `Signals for ${dateVal}: OK`;
}

function renderWorksheet(sc, dateVal) {
  const root = document.getElementById("wsTable");
  const ans = document.getElementById("wsAnswers");
  if (!root || !ans) return;

  root.innerHTML = "";
  ans.innerHTML = "";

  const table = document.createElement("table");
  table.className = "ws-table";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  const th0 = document.createElement("th");
  th0.textContent = "Statement (card)";
  trh.appendChild(th0);
  for (const b of BINS) {
    const th = document.createElement("th");
    th.textContent = b.label;
    th.className = "ws-check";
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const c of sc.cards || []) {
    const tr = document.createElement("tr");

    const tdText = document.createElement("td");
    tdText.textContent = (c.text || "").replaceAll(sc.defaultDate || "2026-02-27", dateVal);
    tr.appendChild(tdText);

    for (const b of BINS) {
      const td = document.createElement("td");
      td.className = "ws-check";
      td.textContent = "☐";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  root.appendChild(table);

  // Answer key
  const ul = document.createElement("ul");
  for (const c of sc.cards || []) {
    const li = document.createElement("li");
    const binLabel = (BINS.find(x => x.id === c.correctBin) || {label:c.correctBin}).label;
    li.textContent = `"${(c.text || "").replaceAll(sc.defaultDate || "2026-02-27", dateVal)}" → ${binLabel}. ${c.why ? "Why: " + c.why : ""}`;
    ul.appendChild(li);
  }
  ans.appendChild(ul);

  renderSignals(sc, dateVal);
}

function setup() {
  setStatusPills();
  applyTheme(getPreferredTheme());

  const btnTheme = document.getElementById("btnTheme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  const scenarios = allScenarios();
  const sel = document.getElementById("selWsScenario");
  const note = document.getElementById("wsNote");
  const dateIn = document.getElementById("wsDate");

  if (!sel || !dateIn) return;

  sel.innerHTML = "";
  for (const sc of scenarios) {
    const opt = document.createElement("option");
    opt.value = sc.id;
    const isCustom = loadCustomScenarios().some(x => x.id === sc.id);
    opt.textContent = isCustom ? `★ ${sc.name}` : sc.name;
    sel.appendChild(opt);
  }

  const fromParam = getParam("scenario");
  const initialScenario = scenarios.find(s => s.id === fromParam) || scenarios[0];
  sel.value = initialScenario.id;

  const dateParam = getParam("date");
  dateIn.value = dateParam || initialScenario.defaultDate || "2026-02-27";

  const refresh = () => {
    const sc = scenarios.find(s => s.id === sel.value) || scenarios[0];
    if (note) note.textContent = sc.note || "";
    const dateVal = dateIn.value || sc.defaultDate || "2026-02-27";
    renderWorksheet(sc, dateVal);
  };

  sel.onchange = () => {
    const sc = scenarios.find(s => s.id === sel.value) || scenarios[0];
    dateIn.value = sc.defaultDate || dateIn.value || "2026-02-27";
    refresh();
  };

  dateIn.onchange = refresh;

  const btnPrint = document.getElementById("btnPrint");
  if (btnPrint) btnPrint.onclick = () => window.print();

  const chkAnswers = document.getElementById("chkAnswers");
  const details = document.querySelector("details.details");
  if (chkAnswers && details) {
    chkAnswers.checked = false;
    details.open = false;
    chkAnswers.onchange = () => {
      details.open = chkAnswers.checked;
      toast(chkAnswers.checked ? "Answer key shown." : "Answer key hidden.");
    };
  }

  refresh();
}

document.addEventListener("DOMContentLoaded", setup);
