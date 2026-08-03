const LAB_URL = new URL("../data/lab-scenarios.json", import.meta.url);
export const LAB_STATE_SCHEMA_VERSION = 1;
export const LAB_EXPORT_SCHEMA_VERSION = 1;
export const MAX_LAB_SUBMISSIONS_PER_SCENARIO = 50;
const VALID_MODES = new Set([
  "guided-assembly", "find-missing-context", "improve-weak-context",
  "diagnose-failure", "compare-context-designs", "build-from-scratch"
]);
const VALID_STATUS = new Set(["not-started", "in-progress", "completed"]);

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}
function text(value, maxLength = 5000) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}
function uniqueStrings(values, allowed = null) {
  if (!Array.isArray(values)) return [];
  const result = [];
  for (const value of values) {
    if (typeof value !== "string" || (allowed && !allowed.has(value)) || result.includes(value)) continue;
    result.push(value);
  }
  return result;
}
function exactKeys(value, allowed) {
  return plainObject(value) && Object.keys(value).every((key) => allowed.includes(key));
}
function randomId(prefix = "lab-attempt") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateLabBank(bank, catalog) {
  if (!plainObject(bank) || bank.schemaVersion !== 1 || !Array.isArray(bank.scenarios) || bank.scenarios.length < 5) {
    throw new Error("The applied-lab scenario bank is not valid.");
  }
  const chapterIds = new Set(catalog?.chapters?.map((chapter) => chapter.id) ?? []);
  const ids = new Set();
  const chapterCoverage = new Set();
  const modeCoverage = new Set();
  for (const scenario of bank.scenarios) {
    if (!plainObject(scenario) || typeof scenario.id !== "string" || ids.has(scenario.id)) throw new Error("The applied-lab bank contains an invalid or duplicate scenario ID.");
    if (!chapterIds.has(scenario.chapterId)) throw new Error(`Lab scenario ${scenario.id} references an unknown chapter.`);
    if (!VALID_MODES.has(scenario.mode)) throw new Error(`Lab scenario ${scenario.id} uses an unsupported mode.`);
    if (!Array.isArray(scenario.rubric) || !scenario.rubric.length || !Array.isArray(scenario.provenance) || !scenario.provenance.length) throw new Error(`Lab scenario ${scenario.id} is missing rubric or provenance data.`);
    if (scenario.editorialStatus !== "owner-source-grounded-for-iteration-10") throw new Error(`Lab scenario ${scenario.id} is not editorially approved for Iteration 10.`);
    ids.add(scenario.id); chapterCoverage.add(scenario.chapterId); modeCoverage.add(scenario.mode);
  }
  if (chapterCoverage.size !== chapterIds.size) throw new Error("The applied-lab bank does not cover all five chapters.");
  if (modeCoverage.size !== VALID_MODES.size) throw new Error("The applied-lab bank does not cover all approved practice modes.");
  return true;
}

export async function loadLabBank(catalog) {
  const response = await fetch(LAB_URL);
  if (!response.ok) throw new Error(`Unable to load the applied-lab bank (${response.status}).`);
  const bank = await response.json();
  validateLabBank(bank, catalog);
  return bank;
}

export function findLabScenario(bank, scenarioId) {
  return bank?.scenarios?.find((scenario) => scenario.id === scenarioId) ?? null;
}
export function scenariosForChapter(bank, chapterId) {
  return bank?.scenarios?.filter((scenario) => scenario.chapterId === chapterId) ?? [];
}

export function createEmptyLabState() {
  return { schemaVersion: LAB_STATE_SCHEMA_VERSION, updatedAt: null, scenarios: {} };
}

function sanitizeDraft(scenario, raw) {
  const source = plainObject(raw) ? raw : {};
  if (scenario.selection) {
    const allowed = new Set(scenario.selection.options.map((item) => item.id));
    return { selectedIds: uniqueStrings(source.selectedIds, allowed) };
  }
  if (scenario.diagnosis) {
    const answers = {};
    for (const question of scenario.diagnosis.questions) {
      const allowed = new Set(question.choices.map((choice) => choice.id));
      if (typeof source.answers?.[question.id] === "string" && allowed.has(source.answers[question.id])) answers[question.id] = source.answers[question.id];
    }
    return { answers };
  }
  if (scenario.comparison) {
    const designs = new Set(scenario.comparison.designs.map((item) => item.id));
    const reasons = new Set(scenario.comparison.reasons.map((item) => item.id));
    return {
      designId: designs.has(source.designId) ? source.designId : null,
      reasonIds: uniqueStrings(source.reasonIds, reasons)
    };
  }
  if (scenario.structured) {
    const fields = {};
    for (const field of scenario.structured.fields) fields[field.id] = text(source.fields?.[field.id], field.maxLength ?? 5000);
    const selfCheckIds = new Set((scenario.structured.selfChecks ?? []).map((item) => item.id));
    return { fields, selfChecks: uniqueStrings(source.selfChecks, selfCheckIds) };
  }
  return {};
}

function sanitizeSubmission(scenario, raw) {
  if (!plainObject(raw) || typeof raw.id !== "string" || !validDate(raw.submittedAt)) return null;
  const rubricIds = new Set(scenario.rubric.map((item) => item.id));
  const criteria = Array.isArray(raw.criteria) ? raw.criteria
    .filter((item) => plainObject(item) && rubricIds.has(item.id))
    .map((item) => ({ id: item.id, met: item.met === true })) : [];
  const response = sanitizeDraft(scenario, raw.response);
  return {
    id: raw.id.slice(0, 140),
    submittedAt: raw.submittedAt,
    response,
    criteria,
    criteriaMet: criteria.filter((item) => item.met).length,
    criteriaTotal: scenario.rubric.length,
    feedbackState: criteria.length && criteria.every((item) => item.met) ? "all-criteria" : "needs-review"
  };
}

export function normalizeLabState(raw, labBank) {
  const output = createEmptyLabState();
  if (!plainObject(raw) || !labBank?.scenarios) return output;
  output.updatedAt = validDate(raw.updatedAt);
  for (const scenario of labBank.scenarios) {
    const candidate = raw.scenarios?.[scenario.id];
    if (!plainObject(candidate)) continue;
    const submissions = [];
    const seen = new Set();
    for (const rawSubmission of Array.isArray(candidate.submissions) ? candidate.submissions : []) {
      const submission = sanitizeSubmission(scenario, rawSubmission);
      if (!submission || seen.has(submission.id)) continue;
      seen.add(submission.id); submissions.push(submission);
    }
    submissions.sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
    const limited = submissions.slice(-MAX_LAB_SUBMISSIONS_PER_SCENARIO);
    const status = limited.length ? "completed" : VALID_STATUS.has(candidate.status) ? candidate.status : "not-started";
    output.scenarios[scenario.id] = {
      status,
      startedAt: validDate(candidate.startedAt),
      updatedAt: validDate(candidate.updatedAt),
      completedAt: status === "completed" ? validDate(candidate.completedAt) ?? limited.at(-1)?.submittedAt ?? null : null,
      draft: sanitizeDraft(scenario, candidate.draft),
      submissions: limited
    };
  }
  return output;
}

export function labScenarioRecord(state, scenarioId) {
  return state?.lab?.scenarios?.[scenarioId] ?? state?.scenarios?.[scenarioId] ?? {
    status: "not-started", startedAt: null, updatedAt: null, completedAt: null, draft: {}, submissions: []
  };
}

export function saveLabDraft(state, labBank, scenarioId, draft, now = new Date().toISOString()) {
  const scenario = findLabScenario(labBank, scenarioId);
  if (!scenario) throw new Error("The requested lab scenario does not exist.");
  const next = structuredClone(state);
  next.lab = normalizeLabState(next.lab, labBank);
  const current = labScenarioRecord(next, scenarioId);
  next.lab.scenarios[scenarioId] = {
    ...current,
    status: current.submissions?.length ? "completed" : "in-progress",
    startedAt: current.startedAt ?? now,
    updatedAt: now,
    draft: sanitizeDraft(scenario, draft),
    submissions: current.submissions ?? []
  };
  next.lab.updatedAt = now;
  next.updatedAt = now;
  return next;
}

function criterionMet(scenario, criterion, response) {
  if (criterion.requiredOptionIds) {
    const selected = new Set(response.selectedIds ?? []);
    if (!criterion.requiredOptionIds.every((id) => selected.has(id))) return false;
    if (criterion.forbiddenOptionIds?.some((id) => selected.has(id))) return false;
    return true;
  }
  if (criterion.questionId) {
    const question = scenario.diagnosis?.questions?.find((item) => item.id === criterion.questionId);
    return Boolean(question && response.answers?.[question.id] === question.correctId);
  }
  if (criterion.requiredDesignId) {
    if (response.designId !== criterion.requiredDesignId) return false;
    const reasons = new Set(response.reasonIds ?? []);
    return (criterion.requiredReasonIds ?? []).every((id) => reasons.has(id));
  }
  if (criterion.requiredFieldIds || criterion.requiredSelfCheckIds) {
    const fieldsOkay = (criterion.requiredFieldIds ?? []).every((id) => text(response.fields?.[id]).trim().length > 0);
    const checks = new Set(response.selfChecks ?? []);
    const checksOkay = (criterion.requiredSelfCheckIds ?? []).every((id) => checks.has(id));
    return fieldsOkay && checksOkay;
  }
  return false;
}

export function evaluateLabResponse(scenario, response) {
  const clean = sanitizeDraft(scenario, response);
  const evaluation = scenario.evaluation?.criteria ?? [];
  const criteria = scenario.rubric.map((rubric) => {
    const rule = evaluation.find((item) => item.rubricId === rubric.id);
    return { id: rubric.id, met: Boolean(rule && criterionMet(scenario, rule, clean)) };
  });
  return {
    response: clean,
    criteria,
    criteriaMet: criteria.filter((item) => item.met).length,
    criteriaTotal: criteria.length,
    allCriteriaMet: criteria.length > 0 && criteria.every((item) => item.met)
  };
}

export function submitLabAttempt(state, labBank, scenarioId, response, now = new Date().toISOString(), attemptId = randomId()) {
  const scenario = findLabScenario(labBank, scenarioId);
  if (!scenario) throw new Error("The requested lab scenario does not exist.");
  const evaluation = evaluateLabResponse(scenario, response);
  const next = saveLabDraft(state, labBank, scenarioId, evaluation.response, now);
  const current = labScenarioRecord(next, scenarioId);
  const submission = {
    id: attemptId,
    submittedAt: now,
    response: evaluation.response,
    criteria: evaluation.criteria,
    criteriaMet: evaluation.criteriaMet,
    criteriaTotal: evaluation.criteriaTotal,
    feedbackState: evaluation.allCriteriaMet ? "all-criteria" : "needs-review"
  };
  const submissions = [...(current.submissions ?? []).filter((item) => item.id !== attemptId), submission].slice(-MAX_LAB_SUBMISSIONS_PER_SCENARIO);
  next.lab.scenarios[scenarioId] = { ...current, status: "completed", completedAt: now, updatedAt: now, draft: evaluation.response, submissions };
  next.lab.updatedAt = now; next.updatedAt = now;
  return { state: next, submission, scenario };
}

export function resetLabHistory(state, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.lab = createEmptyLabState();
  next.lab.updatedAt = now;
  next.updatedAt = now;
  return next;
}

export function resetLabScenario(state, labBank, scenarioId, now = new Date().toISOString()) {
  const scenario = findLabScenario(labBank, scenarioId);
  if (!scenario) throw new Error("The requested lab scenario does not exist.");
  const next = structuredClone(state);
  next.lab = normalizeLabState(next.lab, labBank);
  delete next.lab.scenarios[scenarioId];
  next.lab.updatedAt = now; next.updatedAt = now;
  return next;
}

export function labSummary(labBank, state) {
  const summary = { total: labBank?.scenarios?.length ?? 0, notStarted: 0, inProgress: 0, completed: 0, byChapter: {} };
  for (const scenario of labBank?.scenarios ?? []) {
    const record = labScenarioRecord(state, scenario.id);
    const status = record.status === "completed" ? "completed" : record.status === "in-progress" ? "inProgress" : "notStarted";
    summary[status] += 1;
    const chapter = summary.byChapter[scenario.chapterId] ?? { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
    chapter.total += 1; chapter[status] += 1; summary.byChapter[scenario.chapterId] = chapter;
  }
  return summary;
}

export function labExportPayload(state, appVersion, exportedAt = new Date().toISOString()) {
  return {
    format: "rce-video-context-lab",
    schemaVersion: LAB_EXPORT_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    lab: structuredClone(state.lab ?? createEmptyLabState())
  };
}

export function validateLabImport(payload, labBank) {
  const topKeys = ["format", "schemaVersion", "appVersion", "exportedAt", "lab"];
  if (!exactKeys(payload, topKeys)) throw new Error("The lab import contains unsupported top-level fields.");
  if (payload.format !== "rce-video-context-lab") throw new Error("This file is not an RCE Video context-lab export.");
  if (payload.schemaVersion !== LAB_EXPORT_SCHEMA_VERSION) throw new Error("This context-lab export uses an unsupported schema version.");
  if (!validDate(payload.exportedAt)) throw new Error("The context-lab export date is invalid.");
  const lab = normalizeLabState(payload.lab, labBank);
  return { ...payload, lab };
}

export function parseLabImport(textValue, labBank) {
  let payload;
  try { payload = JSON.parse(textValue); }
  catch { throw new Error("The selected context-lab file is not valid JSON."); }
  return validateLabImport(payload, labBank);
}

function mergeScenarioRecord(current, incoming, scenario) {
  const currentSubmissions = current?.submissions ?? [];
  const incomingSubmissions = incoming?.submissions ?? [];
  const ids = new Set(currentSubmissions.map((item) => item.id));
  const additions = incomingSubmissions.filter((item) => !ids.has(item.id));
  const newestCurrent = Date.parse(current?.updatedAt ?? 0) || 0;
  const newestIncoming = Date.parse(incoming?.updatedAt ?? 0) || 0;
  const useIncomingDraft = newestIncoming > newestCurrent;
  const merged = {
    status: current?.status ?? "not-started",
    startedAt: current?.startedAt ?? incoming?.startedAt ?? null,
    updatedAt: useIncomingDraft ? incoming.updatedAt : current?.updatedAt ?? incoming?.updatedAt ?? null,
    completedAt: current?.completedAt ?? incoming?.completedAt ?? null,
    draft: useIncomingDraft ? incoming.draft : current?.draft ?? incoming?.draft ?? sanitizeDraft(scenario, {}),
    submissions: [...currentSubmissions, ...additions].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt)).slice(-MAX_LAB_SUBMISSIONS_PER_SCENARIO)
  };
  if (merged.submissions.length) {
    merged.status = "completed";
    merged.completedAt = merged.submissions.at(-1).submittedAt;
  } else if (merged.startedAt) merged.status = "in-progress";
  return { merged, newSubmissions: additions.length, draftUpdated: useIncomingDraft };
}

export function planLabImport(currentLab, incomingLab, labBank) {
  const current = normalizeLabState(currentLab, labBank);
  const incoming = normalizeLabState(incomingLab, labBank);
  const scenarios = {};
  let newScenarios = 0, updatedScenarios = 0, duplicateScenarios = 0, newSubmissions = 0;
  for (const scenario of labBank.scenarios) {
    const existing = current.scenarios[scenario.id];
    const candidate = incoming.scenarios[scenario.id];
    if (!candidate) continue;
    const merged = mergeScenarioRecord(existing, candidate, scenario);
    scenarios[scenario.id] = merged.merged;
    newSubmissions += merged.newSubmissions;
    if (!existing) newScenarios += 1;
    else if (merged.newSubmissions || merged.draftUpdated) updatedScenarios += 1;
    else duplicateScenarios += 1;
  }
  return { scenarios, newScenarios, updatedScenarios, duplicateScenarios, newSubmissions };
}

export function applyLabImport(state, plan, labBank, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.lab = normalizeLabState(next.lab, labBank);
  for (const [scenarioId, record] of Object.entries(plan.scenarios ?? {})) next.lab.scenarios[scenarioId] = record;
  next.lab.updatedAt = now; next.updatedAt = now;
  return next;
}
