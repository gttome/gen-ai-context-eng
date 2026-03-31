import { loadConfig, loadScenarioIndex, loadScenarioPack } from "./domain/content.js";
import { validateScenarioPack } from "./domain/schema.js";
import { compileScenario } from "./domain/scenario-engine.js";

function getStorage() {
  try { return window.localStorage; } catch {
    const memory = {};
    return {
      getItem: (key) => Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null,
      setItem: (key, value) => { memory[key] = String(value); },
      removeItem: (key) => { delete memory[key]; },
      clear: () => { Object.keys(memory).forEach((key) => delete memory[key]); }
    };
  }
}

function applyTheme() {
  const storage = getStorage();
  const saved = storage.getItem("app_theme");
  const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='toggle-theme']");
    if (!button) return;
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.setItem("app_theme", next);
  });
}

function blankScenario() {
  return {
    id: "new-scenario-id",
    title: "New Scenario Title",
    learningObjective: "What should the learner get better at by the end of this run?",
    chapterConcept: "Chapter 3 shaping concept",
    timing: "6–8 min",
    difficulty: "Core",
    lifecycleCue: "This pack assumes Discovery and Selection are already complete.",
    caseBrief: "Describe the bounded workplace case and what the learner must shape responsibly.",
    successCriteria: [
      "Learner keeps unlike material visibly separate.",
      "Learner makes precedence and output expectations explicit."
    ],
    outputReminder: [
      "What should the learner watch for in the external run?"
    ],
    missionTags: ["structureClarity", "orderingQuality"],
    options: {
      precedenceRules: [{ id: "source-of-record-wins", label: "The source of record outranks weaker notes and memory." }],
      outputOptions: [{ id: "reviewable-sections", label: "Use a reviewable multi-section answer." }],
      handlingOptions: [{ id: "state-uncertainty", label: "State uncertainty or escalate instead of guessing." }]
    },
    blocks: [],
    strongestPractice: {
      sections: { ROLE: [], RULES: [], REFERENCE: [], "DYNAMIC FACTS": [], TASK: [], OUTPUT: [], CHECKS: [] },
      precedenceRule: "source-of-record-wins",
      outputOption: "reviewable-sections",
      missingInfoHandling: "state-uncertainty",
      rationale: {}
    },
    counterfactuals: [
      {
        id: "plausible-but-weaker-example",
        title: "Plausible but weaker example",
        focus: "Visible contrast",
        whyPlausible: "Describe why a tempting but weaker structure might still look reasonable.",
        lesson: "Describe the shaping lesson this comparison should teach.",
        moves: [],
        decisionOverrides: {}
      }
    ],
    reviewRubric: {
      requiredPhrases: ["required phrase"],
      preferredPhrases: ["preferred evidence phrase"],
      uncertaintyPhrases: ["unknown", "not enough information"],
      formatMarkers: ["Explanation", "Next Steps"]
    },
    exploreMore: {
      challengeTitle: "Optional extension",
      prompt: "Describe the optional challenge branch here.",
      focus: "Explore More focus",
      branches: [{ title: "Branch 1", instruction: "What should the learner try?", watchFor: "What should the learner observe?", why: "Why the branch matters." }]
    },
    coach: {
      build: ["Explain the strongest placement logic in plain language."],
      copy: ["Tell the learner what to watch for in the external run."],
      review: ["Explain how to connect observed output back to structure."]
    }
  };
}

function sectionList() {
  return ["ROLE", "RULES", "REFERENCE", "DYNAMIC FACTS", "TASK", "OUTPUT", "CHECKS"];
}

function scaffoldBlocks(baseId = "scenario") {
  const items = [
    ["ROLE", "Role anchor", "Act as a careful assistant for this workflow.", "trusted", "stable"],
    ["RULES", "Must-follow rule", "Follow only the approved source material and do not guess.", "trusted", "stable"],
    ["REFERENCE", "Approved reference", "Approved excerpt or evidence source for this case.", "authoritative", "current"],
    ["DYNAMIC FACTS", "Current run facts", "Run-specific details that must be refreshed before each test.", "run-specific", "current"],
    ["TASK", "Current task", "The exact job the model should do in this run.", "trusted", "current"],
    ["OUTPUT", "Output contract", "Return a reviewable answer with named sections or fields.", "trusted", "stable"],
    ["CHECKS", "Missing-information check", "State uncertainty, ask, or escalate instead of guessing when information is missing.", "trusted", "stable"]
  ];
  return items.map(([section, label, text, trustLevel, freshnessCue], index) => ({
    id: `${baseId}_${section.toLowerCase().replace(/\s+/g, "_")}`,
    label,
    text,
    type: section,
    acceptableSections: [section],
    trustLevel,
    freshnessCue,
    priority: index + 1
  }));
}

function writeDraft(data) {
  document.getElementById("draft-json").value = JSON.stringify(data, null, 2);
  renderDraftInsights(data);
}

function safeReadDraft() {
  try {
    const parsed = JSON.parse(document.getElementById("draft-json").value);
    return { ok: true, data: parsed };
  } catch (error) {
    return { ok: false, error };
  }
}

function readDraft() {
  return JSON.parse(document.getElementById("draft-json").value);
}

function setStatus(message, tone = "") {
  const node = document.getElementById("authoring-status");
  node.className = `authoring-status ${tone}`.trim();
  node.textContent = message;
}

function renderValidation(result) {
  const summary = document.getElementById("validation-summary");
  if (result.valid) {
    summary.innerHTML = `<p><strong>PASS</strong> — schema checks passed.</p><p class="small muted">Warnings: ${result.warnings.length || 0}</p>${result.warnings.length ? `<ul class="check-list">${result.warnings.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}`;
  } else {
    summary.innerHTML = `<p><strong>FAIL</strong> — fix the issues below before exporting.</p><ul class="warning-list">${result.errors.map((item) => `<li>${item}</li>`).join("")}</ul>${result.warnings.length ? `<h4>Warnings</h4><ul class="check-list">${result.warnings.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}`;
  }
}

function renderEnginePreview(data, config) {
  const node = document.getElementById("engine-preview");
  if (!node) return;
  const compiled = compileScenario(data, config);
  node.innerHTML = `<p class="small muted"><strong>Mission tags:</strong> ${(compiled.missionTags || []).join(", ") || "None"}</p><p class="small muted"><strong>Counterfactuals:</strong> ${(compiled.counterfactuals || []).length}</p><p class="small muted"><strong>Counterfactual focus:</strong> ${compiled.counterfactuals?.[0]?.focus || "Engine fallback will derive one."}</p><p class="small muted"><strong>Next likely weakness:</strong> ${compiled.authoringHints?.nextLikelyWeakness || "structureClarity"}</p>`;
}

function renderDraftInsights(data, config = { sectionOrder: sectionList() }) {
  const node = document.getElementById("draft-insights");
  if (!node) return;
  const sections = sectionList();
  const blockCount = Array.isArray(data.blocks) ? data.blocks.length : 0;
  const sectionCounts = sections.map((section) => `${section}: ${(data.strongestPractice?.sections?.[section] || []).length}`).join(" • ");
  const missing = [];
  if (!blockCount) missing.push("No blocks yet.");
  if (!Array.isArray(data.successCriteria) || !data.successCriteria.length) missing.push("Add success criteria.");
  if (!Array.isArray(data.outputReminder) || !data.outputReminder.length) missing.push("Add external-run watch points.");
  if (!Array.isArray(data.coach?.build) || !data.coach.build.length) missing.push("Add build coaching.");
  if (!Array.isArray(data.exploreMore?.branches) || !data.exploreMore.branches.length) missing.push("Add at least one Explore More branch.");
  if (!Array.isArray(data.counterfactuals) || !data.counterfactuals.length) missing.push("Add a plausible-but-weaker counterfactual or rely on the engine fallback.");
  node.innerHTML = `<p class="small muted"><strong>Draft summary:</strong> ${blockCount} blocks • ${sectionCounts}</p><p class="small muted"><strong>Mission tags:</strong> ${(data.missionTags || []).join(", ") || "Not authored yet"}</p>${missing.length ? `<ul class="warning-list">${missing.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p class="small muted">This draft has all major authoring layers present.</p>`}`;
  renderEnginePreview(data, config);
}

function downloadDraft(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${data.id || "scenario-draft"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ensureScaffoldedBlocks(data) {
  const next = structuredClone(data);
  if (!Array.isArray(next.blocks) || !next.blocks.length) next.blocks = scaffoldBlocks(next.id || "scenario");
  for (const section of sectionList()) {
    next.strongestPractice.sections[section] = next.strongestPractice.sections[section] || [];
    if (!next.strongestPractice.sections[section].length) {
      const block = next.blocks.find((item) => item.type === section);
      if (block) next.strongestPractice.sections[section] = [block.id];
    }
  }
  return next;
}

function ensureSupportStarters(data) {
  const next = structuredClone(data);
  next.strongestPractice.rationale = next.strongestPractice.rationale || {};
  for (const section of sectionList()) {
    if (!next.strongestPractice.rationale[section]) next.strongestPractice.rationale[section] = `${section} should stay visibly distinct so reviewers can see what it contributes to the envelope.`;
  }
  next.reviewRubric = next.reviewRubric || {};
  next.reviewRubric.requiredPhrases = next.reviewRubric.requiredPhrases?.length ? next.reviewRubric.requiredPhrases : ["required phrase"];
  next.reviewRubric.preferredPhrases = next.reviewRubric.preferredPhrases?.length ? next.reviewRubric.preferredPhrases : ["preferred evidence phrase"];
  next.reviewRubric.uncertaintyPhrases = next.reviewRubric.uncertaintyPhrases?.length ? next.reviewRubric.uncertaintyPhrases : ["unknown", "not enough information"];
  next.reviewRubric.formatMarkers = next.reviewRubric.formatMarkers?.length ? next.reviewRubric.formatMarkers : ["Explanation", "Next Steps"];
  next.coach = next.coach || {};
  next.coach.build = next.coach.build?.length ? next.coach.build : ["Tell the learner which shaping decision matters most in this scenario.", "Explain how to separate unlike material clearly before the run."];
  next.coach.copy = next.coach.copy?.length ? next.coach.copy : ["Tell the learner what to watch for in the external output.", "Remind the learner to compare the response against the output contract and missing-information rule."];
  next.coach.review = next.coach.review?.length ? next.coach.review : ["Connect the observed output back to envelope structure.", "Name one next-best revision that would improve the next run."];
  next.outputReminder = next.outputReminder?.length ? next.outputReminder : ["What should the learner watch for in the external run?"];
  next.missionTags = next.missionTags?.length ? next.missionTags : ["structureClarity", "orderingQuality"];
  next.counterfactuals = next.counterfactuals?.length ? next.counterfactuals : [{
    id: `${next.id || "scenario"}-plausible-but-weaker`,
    title: "Plausible but weaker pattern",
    focus: "Counterfactual contrast",
    whyPlausible: "Explain why this weaker structure would still feel tempting.",
    lesson: "Explain what the learner should understand after comparing it with strongest practice.",
    moves: [],
    decisionOverrides: {}
  }];
  return next;
}

async function bootstrapAuthoring() {
  applyTheme();
  const config = await loadConfig();
  const index = await loadScenarioIndex();
  const starterSelect = document.getElementById("starter-select");
  starterSelect.innerHTML = index.scenarios.map((item) => `<option value="${item.id}">${item.title}</option>`).join("");

  document.getElementById("load-starter").addEventListener("click", async () => {
    const scenario = await loadScenarioPack(starterSelect.value);
    writeDraft(scenario);
    setStatus(`Loaded starter scenario: ${scenario.title}`);
  });
  document.getElementById("load-blank").addEventListener("click", () => {
    writeDraft(blankScenario());
    setStatus("Loaded blank scaffold.");
  });
  document.getElementById("generate-blocks").addEventListener("click", () => {
    const parsed = safeReadDraft();
    if (!parsed.ok) return setStatus("Draft JSON could not be parsed.", "fail");
    writeDraft(ensureScaffoldedBlocks(parsed.data));
    setStatus("Generated starter block set and strongest-practice section anchors.", "pass");
  });
  document.getElementById("generate-support").addEventListener("click", () => {
    const parsed = safeReadDraft();
    if (!parsed.ok) return setStatus("Draft JSON could not be parsed.", "fail");
    writeDraft(ensureSupportStarters(parsed.data));
    setStatus("Generated rationale, rubric, coaching, mission-tag, and counterfactual starters.", "pass");
  });
  document.getElementById("validate-draft").addEventListener("click", () => {
    try {
      const scenario = readDraft();
      const result = validateScenarioPack(scenario, config);
      renderValidation(result);
      renderDraftInsights(scenario, config);
      setStatus(result.valid ? "Draft passed schema validation." : "Draft has validation errors.", result.valid ? "pass" : "fail");
    } catch (error) {
      renderValidation({ valid: false, errors: [error.message], warnings: [] });
      setStatus("Draft JSON could not be parsed.", "fail");
    }
  });
  document.getElementById("download-draft").addEventListener("click", () => {
    try {
      const scenario = readDraft();
      downloadDraft(scenario);
      renderDraftInsights(scenario, config);
      setStatus("Draft JSON downloaded.", "pass");
    } catch (error) {
      setStatus(`Download blocked: ${error.message}`, "fail");
    }
  });
  document.getElementById("draft-file").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const text = await file.text();
    document.getElementById("draft-json").value = text;
    const parsed = safeReadDraft();
    if (parsed.ok) renderDraftInsights(parsed.data, config);
    setStatus(`Loaded local file: ${file.name}`);
  });
  document.getElementById("draft-json").addEventListener("input", () => {
    const parsed = safeReadDraft();
    if (parsed.ok) renderDraftInsights(parsed.data, config);
  });

  const starter = await loadScenarioPack(index.scenarios[0].id);
  writeDraft(starter);
  renderDraftInsights(starter, config);
  setStatus("Loaded starter scenario for editing.");
}

bootstrapAuthoring().catch((error) => {
  setStatus(`Authoring workspace failed to load: ${error.message}`, "fail");
});
