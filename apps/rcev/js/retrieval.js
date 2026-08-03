const RETRIEVAL_URL = new URL("../data/retrieval-checks.json", import.meta.url);

export const RETRIEVAL_STATE_SCHEMA_VERSION = 2;
export const RETRIEVAL_EXPORT_FORMAT = "rce-video-retrieval-history";
export const RETRIEVAL_EXPORT_SCHEMA_VERSION = 2;
export const RETRIEVAL_CONFIDENCE_VALUES = ["low", "medium", "high"];
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];
export const MAX_ATTEMPTS_PER_CHECK = 100;
export const MAX_RETRIEVAL_ITEMS = 5000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

export async function loadRetrievalBank(catalog) {
  const response = await fetch(RETRIEVAL_URL);
  if (!response.ok) throw new Error(`Retrieval-check request failed with ${response.status}.`);
  const bank = await response.json();
  validateRetrievalBank(bank, catalog);
  return bank;
}

export function validateRetrievalBank(bank, catalog) {
  if (!bank || typeof bank !== "object" || bank.schemaVersion !== 1 || !Array.isArray(bank.checks)) {
    throw new Error("The retrieval-check bank is not valid.");
  }
  const videos = new Map(catalog.chapters.flatMap((chapter) => chapter.videos.map((video) => [video.id, video])));
  const ids = new Set();
  const perVideo = new Map();
  for (const check of bank.checks) {
    if (!check || typeof check !== "object" || typeof check.id !== "string" || ids.has(check.id)) throw new Error("The retrieval-check bank contains an invalid or duplicate id.");
    const video = videos.get(check.videoId);
    if (!video || check.chapterId !== video.chapterId) throw new Error(`${check.id} references an invalid video.`);
    if (!["multiple-choice", "short-selected-response"].includes(check.type)) throw new Error(`${check.id} has an unsupported interaction type.`);
    if (typeof check.prompt !== "string" || !check.prompt.trim() || typeof check.explanation !== "string" || !check.explanation.trim()) throw new Error(`${check.id} is missing required instructional text.`);
    if (!Array.isArray(check.choices) || check.choices.length < 3 || check.choices.length > 4) throw new Error(`${check.id} must have three or four choices.`);
    const choiceIds = new Set();
    for (const choice of check.choices) {
      if (!choice || typeof choice.id !== "string" || !choice.id || choiceIds.has(choice.id) || typeof choice.text !== "string" || !choice.text.trim()) throw new Error(`${check.id} contains an invalid choice.`);
      choiceIds.add(choice.id);
    }
    if (!choiceIds.has(check.correctChoiceId)) throw new Error(`${check.id} does not identify a valid correct choice.`);
    if (!check.concept?.id || !check.concept?.label || !Array.isArray(check.provenance) || !check.provenance.length) throw new Error(`${check.id} is missing concept or provenance data.`);
    const expectedStatus = check.chapterId === "ch1" ? "approved-for-iteration-8-pilot" : "approved-for-iteration-9";
    if (check.editorialStatus !== expectedStatus) throw new Error(`${check.id} is not editorially authorized for this release.`);
    ids.add(check.id);
    perVideo.set(check.videoId, (perVideo.get(check.videoId) ?? 0) + 1);
  }
  for (const video of videos.values()) {
    const count = perVideo.get(video.id) ?? 0;
    if (count < 2 || count > 3) throw new Error(`${video.id} must have two or three retrieval checks.`);
  }
  return true;
}

export function checksForVideo(bank, videoId) {
  return bank.checks.filter((check) => check.videoId === videoId).sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
}

export function findRetrievalCheck(bank, checkId) {
  return bank.checks.find((check) => check.id === checkId) ?? null;
}

export function createEmptyRetrievalState() {
  return {
    schemaVersion: RETRIEVAL_STATE_SCHEMA_VERSION,
    updatedAt: null,
    clock: { lastObservedAt: null, timezoneOffsetMinutes: null, rollbackDetectedAt: null },
    items: {}
  };
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function validId(value, prefix) {
  return typeof value === "string" && value.length <= 120 && new RegExp(`^${prefix}[A-Za-z0-9._:-]+$`).test(value);
}

function createAttemptId(cryptoLike = globalThis.crypto) {
  if (cryptoLike?.randomUUID) return `attempt-${cryptoLike.randomUUID()}`;
  return `attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function addDays(iso, days) {
  return new Date(Date.parse(iso) + days * 86400000).toISOString();
}

function clampIntervalIndex(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number < REVIEW_INTERVAL_DAYS.length ? number : 0;
}

function normalizeAttempt(candidate, check) {
  if (!candidate || typeof candidate !== "object" || !validId(candidate.id, "attempt-")) return null;
  const attemptedAt = validDate(candidate.attemptedAt);
  if (!attemptedAt || !check.choices.some((choice) => choice.id === candidate.choiceId)) return null;
  return { id: candidate.id, choiceId: candidate.choiceId, correct: candidate.choiceId === check.correctChoiceId, attemptedAt };
}

function inferredSchedule(attempts) {
  const latest = attempts.at(-1);
  if (!latest) return { intervalIndex: 0, dueAt: null, lastReviewedAt: null, lastCompletedAt: null };
  return latest.correct
    ? { intervalIndex: 0, dueAt: addDays(latest.attemptedAt, REVIEW_INTERVAL_DAYS[0]), lastReviewedAt: latest.attemptedAt, lastCompletedAt: latest.attemptedAt }
    : { intervalIndex: 0, dueAt: latest.attemptedAt, lastReviewedAt: latest.attemptedAt, lastCompletedAt: null };
}

function normalizeSchedule(candidate, attempts) {
  const fallback = inferredSchedule(attempts);
  if (!candidate || typeof candidate !== "object") return fallback;
  return {
    intervalIndex: clampIntervalIndex(candidate.intervalIndex),
    dueAt: validDate(candidate.dueAt) ?? fallback.dueAt,
    lastReviewedAt: validDate(candidate.lastReviewedAt) ?? fallback.lastReviewedAt,
    lastCompletedAt: validDate(candidate.lastCompletedAt) ?? fallback.lastCompletedAt
  };
}

function normalizeRetrievalItem(candidate, check) {
  if (!candidate || typeof candidate !== "object") return null;
  const attempts = [];
  const seen = new Set();
  for (const rawAttempt of Array.isArray(candidate.attempts) ? candidate.attempts : []) {
    const attempt = normalizeAttempt(rawAttempt, check);
    if (!attempt || seen.has(attempt.id)) continue;
    seen.add(attempt.id);
    attempts.push(attempt);
  }
  attempts.sort((a, b) => Date.parse(a.attemptedAt) - Date.parse(b.attemptedAt) || a.id.localeCompare(b.id));
  const confidence = RETRIEVAL_CONFIDENCE_VALUES.includes(candidate.confidence) ? candidate.confidence : null;
  const review = candidate.review === true;
  const schedule = normalizeSchedule(candidate.schedule, attempts);
  const updatedAt = validDate(candidate.updatedAt) ?? attempts.at(-1)?.attemptedAt ?? null;
  if (!attempts.length && !confidence && !review && !updatedAt) return null;
  return { attempts: attempts.slice(-MAX_ATTEMPTS_PER_CHECK), confidence, review, schedule, updatedAt };
}

function normalizeClock(candidate) {
  const timezone = Number(candidate?.timezoneOffsetMinutes);
  return {
    lastObservedAt: validDate(candidate?.lastObservedAt),
    timezoneOffsetMinutes: Number.isInteger(timezone) && timezone >= -840 && timezone <= 840 ? timezone : null,
    rollbackDetectedAt: validDate(candidate?.rollbackDetectedAt)
  };
}

export function normalizeRetrievalState(raw, bank) {
  const output = createEmptyRetrievalState();
  if (!raw || typeof raw !== "object") return output;
  const items = raw.items && typeof raw.items === "object" ? raw.items : {};
  for (const [checkId, candidate] of Object.entries(items).slice(0, MAX_RETRIEVAL_ITEMS)) {
    const check = findRetrievalCheck(bank, checkId);
    if (!check) continue;
    const item = normalizeRetrievalItem(candidate, check);
    if (item) output.items[checkId] = item;
  }
  output.clock = normalizeClock(raw.clock);
  output.updatedAt = validDate(raw.updatedAt) ?? Object.values(output.items).map((item) => item.updatedAt).filter(Boolean).sort().at(-1) ?? null;
  return output;
}

export function retrievalRecord(state, checkId) {
  return state?.retrieval?.items?.[checkId] ?? {
    attempts: [], confidence: null, review: false,
    schedule: { intervalIndex: 0, dueAt: null, lastReviewedAt: null, lastCompletedAt: null }, updatedAt: null
  };
}

export function effectiveReviewNow(state, now = new Date().toISOString()) {
  const actual = validDate(now) ?? new Date().toISOString();
  const last = validDate(state?.retrieval?.clock?.lastObservedAt);
  if (!last) return actual;
  return Date.parse(actual) < Date.parse(last) ? last : actual;
}

export function observeReviewClock(state, now = new Date().toISOString(), timezoneOffsetMinutes = new Date().getTimezoneOffset()) {
  const actual = validDate(now) ?? new Date().toISOString();
  const next = structuredClone(state);
  next.retrieval ??= createEmptyRetrievalState();
  const previous = validDate(next.retrieval.clock?.lastObservedAt);
  const previousTimezone = next.retrieval.clock?.timezoneOffsetMinutes;
  const rollbackDetected = Boolean(previous && Date.parse(actual) + CLOCK_ROLLBACK_TOLERANCE_MS < Date.parse(previous));
  const timezoneChanged = Number.isInteger(previousTimezone) && previousTimezone !== timezoneOffsetMinutes;
  const effective = previous && Date.parse(previous) > Date.parse(actual) ? previous : actual;
  next.retrieval.clock = {
    lastObservedAt: effective,
    timezoneOffsetMinutes: Number.isInteger(timezoneOffsetMinutes) ? timezoneOffsetMinutes : null,
    rollbackDetectedAt: rollbackDetected ? actual : validDate(next.retrieval.clock?.rollbackDetectedAt)
  };
  next.retrieval.updatedAt = next.retrieval.updatedAt ?? effective;
  return { state: next, rollbackDetected, timezoneChanged, effectiveNow: effective };
}

function withRetrievalItem(state, checkId, item, now) {
  const next = structuredClone(state);
  next.retrieval ??= createEmptyRetrievalState();
  next.retrieval.items ??= {};
  next.retrieval.items[checkId] = item;
  next.retrieval.updatedAt = now;
  if (next.retrieval.clock) next.retrieval.clock.lastObservedAt = effectiveReviewNow(next, now);
  next.updatedAt = now;
  return next;
}

export function submitRetrievalAnswer(state, bank, checkId, choiceId, now = new Date().toISOString(), id = createAttemptId()) {
  const check = findRetrievalCheck(bank, checkId);
  if (!check) throw new Error("This retrieval check is not available.");
  if (!check.choices.some((choice) => choice.id === choiceId)) throw new Error("Choose one of the available answers.");
  const effectiveNow = effectiveReviewNow(state, now);
  const current = retrievalRecord(state, checkId);
  const correct = choiceId === check.correctChoiceId;
  const attempt = { id, choiceId, correct, attemptedAt: effectiveNow };
  const previousIndex = clampIntervalIndex(current.schedule?.intervalIndex);
  const intervalIndex = correct ? Math.min(previousIndex + (current.attempts.length ? 1 : 0), REVIEW_INTERVAL_DAYS.length - 1) : previousIndex;
  const schedule = correct
    ? { intervalIndex, dueAt: addDays(effectiveNow, REVIEW_INTERVAL_DAYS[intervalIndex]), lastReviewedAt: effectiveNow, lastCompletedAt: effectiveNow }
    : { intervalIndex, dueAt: effectiveNow, lastReviewedAt: effectiveNow, lastCompletedAt: current.schedule?.lastCompletedAt ?? null };
  const item = {
    attempts: [...current.attempts, attempt].slice(-MAX_ATTEMPTS_PER_CHECK),
    confidence: current.confidence ?? null,
    review: current.review === true,
    schedule,
    updatedAt: effectiveNow
  };
  return { state: withRetrievalItem(state, checkId, item, effectiveNow), attempt, check };
}

export function setRetrievalConfidence(state, bank, checkId, confidence, now = new Date().toISOString()) {
  if (!findRetrievalCheck(bank, checkId)) throw new Error("This retrieval check is not available.");
  if (!RETRIEVAL_CONFIDENCE_VALUES.includes(confidence)) throw new Error("Confidence must be Low, Medium, or High.");
  const effectiveNow = effectiveReviewNow(state, now);
  const current = retrievalRecord(state, checkId);
  const item = { ...structuredClone(current), confidence, updatedAt: effectiveNow };
  return { state: withRetrievalItem(state, checkId, item, effectiveNow), item };
}

export function setRetrievalReview(state, bank, checkId, review, now = new Date().toISOString()) {
  if (!findRetrievalCheck(bank, checkId)) throw new Error("This retrieval check is not available.");
  const effectiveNow = effectiveReviewNow(state, now);
  const current = retrievalRecord(state, checkId);
  const item = { ...structuredClone(current), review: review === true, updatedAt: effectiveNow };
  return { state: withRetrievalItem(state, checkId, item, effectiveNow), item };
}

export function resetRetrievalHistory(state, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.retrieval = createEmptyRetrievalState();
  next.retrieval.updatedAt = now;
  next.retrieval.clock.lastObservedAt = now;
  next.retrieval.clock.timezoneOffsetMinutes = new Date().getTimezoneOffset();
  next.updatedAt = now;
  return next;
}

function sameLocalDay(a, b) {
  if (!validDate(a) || !validDate(b)) return false;
  const left = new Date(a);
  const right = new Date(b);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function reviewStatusForCheck(state, checkId, now = new Date().toISOString()) {
  const record = retrievalRecord(state, checkId);
  const latest = record.attempts.at(-1) ?? null;
  const effectiveNow = effectiveReviewNow(state, now);
  if (latest && !latest.correct) return { state: "due", reason: "incorrect", priority: 0, dueAt: record.schedule?.dueAt ?? latest.attemptedAt };
  if (record.confidence === "low" && latest) return { state: "due", reason: "low-confidence", priority: 1, dueAt: record.schedule?.dueAt ?? latest.attemptedAt };
  if (record.review) return { state: "due", reason: "marked", priority: 2, dueAt: record.schedule?.dueAt ?? record.updatedAt };
  const dueAt = validDate(record.schedule?.dueAt);
  if (dueAt && Date.parse(dueAt) <= Date.parse(effectiveNow)) return { state: "due", reason: "elapsed", priority: 3, dueAt };
  if (record.schedule?.lastCompletedAt && sameLocalDay(record.schedule.lastCompletedAt, now) && dueAt) return { state: "completed", reason: "completed-today", priority: 4, dueAt };
  if (dueAt) return { state: "upcoming", reason: "scheduled", priority: 5, dueAt };
  return { state: "unscheduled", reason: latest ? "not-scheduled" : "unattempted", priority: 6, dueAt: null };
}

function catalogOrder(catalog) {
  const order = new Map();
  let index = 0;
  for (const chapter of catalog.chapters) for (const video of chapter.videos) order.set(video.id, index++);
  return order;
}

export function buildReviewQueue(catalog, bank, state, { chapterId = null, now = new Date().toISOString(), limit = null, includeUpcoming = false } = {}) {
  const order = catalogOrder(catalog);
  const entries = [];
  for (const check of bank.checks) {
    if (chapterId && check.chapterId !== chapterId) continue;
    const status = reviewStatusForCheck(state, check.id, now);
    if (status.state !== "due" && !(includeUpcoming && status.state === "upcoming")) continue;
    entries.push({ check, status, record: retrievalRecord(state, check.id) });
  }
  entries.sort((a, b) => {
    if (a.status.priority !== b.status.priority) return a.status.priority - b.status.priority;
    const dueDifference = Date.parse(a.status.dueAt ?? 8640000000000000) - Date.parse(b.status.dueAt ?? 8640000000000000);
    if (dueDifference) return dueDifference;
    const videoDifference = (order.get(a.check.videoId) ?? 999) - (order.get(b.check.videoId) ?? 999);
    return videoDifference || a.check.sequence - b.check.sequence || a.check.id.localeCompare(b.check.id);
  });
  return Number.isInteger(limit) && limit > 0 ? entries.slice(0, limit) : entries;
}

export function reviewSummary(catalog, bank, state, now = new Date().toISOString()) {
  const summary = { total: bank.checks.length, due: 0, upcoming: 0, completed: 0, unscheduled: 0, marked: 0, incorrect: 0, lowConfidence: 0, byChapter: {} };
  for (const chapter of catalog.chapters) summary.byChapter[chapter.id] = { due: 0, upcoming: 0, completed: 0, total: 0 };
  for (const check of bank.checks) {
    const status = reviewStatusForCheck(state, check.id, now);
    const record = retrievalRecord(state, check.id);
    summary[status.state] += 1;
    summary.byChapter[check.chapterId].total += 1;
    if (status.state in summary.byChapter[check.chapterId]) summary.byChapter[check.chapterId][status.state] += 1;
    if (record.review) summary.marked += 1;
    if (record.attempts.at(-1)?.correct === false) summary.incorrect += 1;
    if (record.confidence === "low") summary.lowConfidence += 1;
  }
  return summary;
}

export function reviewCountsByVideo(bank, state, now = new Date().toISOString()) {
  const counts = {};
  for (const check of bank.checks) {
    counts[check.videoId] ??= { due: 0, upcoming: 0, completed: 0 };
    const status = reviewStatusForCheck(state, check.id, now);
    if (status.state in counts[check.videoId]) counts[check.videoId][status.state] += 1;
  }
  return counts;
}

export function retrievalSummary(state, bank) {
  const result = { total: bank.checks.length, attempted: 0, correctLatest: 0, review: 0, lowConfidence: 0 };
  for (const check of bank.checks) {
    const record = retrievalRecord(state, check.id);
    const latest = record.attempts.at(-1);
    if (latest) result.attempted += 1;
    if (latest?.correct) result.correctLatest += 1;
    if (record.review) result.review += 1;
    if (record.confidence === "low") result.lowConfidence += 1;
  }
  return result;
}

export function retrievalExportPayload(state, appVersion = "2.0.2", now = new Date().toISOString()) {
  return { format: RETRIEVAL_EXPORT_FORMAT, schemaVersion: RETRIEVAL_EXPORT_SCHEMA_VERSION, appVersion, exportedAt: now, retrieval: structuredClone(state.retrieval ?? createEmptyRetrievalState()) };
}

function hasOnlyKeys(candidate, allowed) {
  return Object.keys(candidate).every((key) => allowed.has(key));
}

function validateClock(clock) {
  if (!clock || typeof clock !== "object" || Array.isArray(clock) || !hasOnlyKeys(clock, new Set(["lastObservedAt", "timezoneOffsetMinutes", "rollbackDetectedAt"]))) return false;
  if (clock.lastObservedAt !== null && !validDate(clock.lastObservedAt)) return false;
  if (clock.rollbackDetectedAt !== null && !validDate(clock.rollbackDetectedAt)) return false;
  if (clock.timezoneOffsetMinutes !== null && (!Number.isInteger(clock.timezoneOffsetMinutes) || clock.timezoneOffsetMinutes < -840 || clock.timezoneOffsetMinutes > 840)) return false;
  return true;
}

function validateSchedule(schedule) {
  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule) || !hasOnlyKeys(schedule, new Set(["intervalIndex", "dueAt", "lastReviewedAt", "lastCompletedAt"]))) return false;
  if (!Number.isInteger(schedule.intervalIndex) || schedule.intervalIndex < 0 || schedule.intervalIndex >= REVIEW_INTERVAL_DAYS.length) return false;
  return ["dueAt", "lastReviewedAt", "lastCompletedAt"].every((key) => schedule[key] === null || validDate(schedule[key]));
}

export function validateRetrievalImport(raw, bank) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.format !== RETRIEVAL_EXPORT_FORMAT) throw new Error("The selected file is not an RCE Video retrieval-history export.");
  if (!hasOnlyKeys(raw, new Set(["format", "schemaVersion", "appVersion", "exportedAt", "retrieval"]))) throw new Error("The retrieval-history export contains unsupported top-level fields.");
  if (![1, RETRIEVAL_EXPORT_SCHEMA_VERSION].includes(raw.schemaVersion)) throw new Error("The retrieval-history export uses an unsupported schema version.");
  if (typeof raw.appVersion !== "string" || !raw.appVersion.trim() || raw.appVersion.length > 40) throw new Error("The retrieval-history export does not identify a valid application version.");
  if (!validDate(raw.exportedAt)) throw new Error("The retrieval-history export does not contain a valid export time.");
  const retrieval = raw.retrieval;
  const legacy = raw.schemaVersion === 1 || retrieval?.schemaVersion === 1;
  if (!retrieval || typeof retrieval !== "object" || Array.isArray(retrieval) || ![1, RETRIEVAL_STATE_SCHEMA_VERSION].includes(retrieval.schemaVersion) || !retrieval.items || typeof retrieval.items !== "object" || Array.isArray(retrieval.items)) {
    throw new Error("The retrieval-history export contains an invalid retrieval state.");
  }
  const retrievalFields = legacy ? new Set(["schemaVersion", "updatedAt", "items"]) : new Set(["schemaVersion", "updatedAt", "clock", "items"]);
  if (!hasOnlyKeys(retrieval, retrievalFields)) throw new Error("The retrieval-history export contains unsupported retrieval-state fields.");
  if (!legacy && !validateClock(retrieval.clock)) throw new Error("The retrieval-history export contains an invalid review clock.");
  if (retrieval.updatedAt !== null && !validDate(retrieval.updatedAt)) throw new Error("The retrieval-history export contains an invalid retrieval update time.");
  const entries = Object.entries(retrieval.items);
  if (entries.length > MAX_RETRIEVAL_ITEMS) throw new Error("The retrieval-history export contains too many check records.");
  for (const [checkId, candidate] of entries) {
    const check = findRetrievalCheck(bank, checkId);
    if (!check || !candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("The retrieval-history export contains invalid or unknown check records.");
    const allowed = legacy ? new Set(["attempts", "confidence", "review", "updatedAt"]) : new Set(["attempts", "confidence", "review", "schedule", "updatedAt"]);
    if (!hasOnlyKeys(candidate, allowed)) throw new Error(`${checkId} contains unsupported record fields.`);
    if (!legacy && !validateSchedule(candidate.schedule)) throw new Error(`${checkId} contains an invalid review schedule.`);
    if (!Array.isArray(candidate.attempts) || candidate.attempts.length > MAX_ATTEMPTS_PER_CHECK) throw new Error(`${checkId} contains an invalid attempt history.`);
    if (candidate.confidence !== null && !RETRIEVAL_CONFIDENCE_VALUES.includes(candidate.confidence)) throw new Error(`${checkId} contains an invalid confidence rating.`);
    if (typeof candidate.review !== "boolean") throw new Error(`${checkId} contains an invalid review mark.`);
    if (candidate.updatedAt !== null && !validDate(candidate.updatedAt)) throw new Error(`${checkId} contains an invalid update time.`);
    const attemptIds = new Set();
    for (const attempt of candidate.attempts) {
      if (!attempt || typeof attempt !== "object" || Array.isArray(attempt) || !hasOnlyKeys(attempt, new Set(["id", "choiceId", "correct", "attemptedAt"]))) throw new Error(`${checkId} contains an invalid attempt record.`);
      const normalizedAttempt = normalizeAttempt(attempt, check);
      if (!normalizedAttempt || attemptIds.has(attempt.id) || typeof attempt.correct !== "boolean" || attempt.correct !== normalizedAttempt.correct) throw new Error(`${checkId} contains an invalid or duplicate attempt.`);
      attemptIds.add(attempt.id);
    }
    const normalizedItem = normalizeRetrievalItem(candidate, check);
    if (!normalizedItem || normalizedItem.attempts.length !== candidate.attempts.length) throw new Error(`${checkId} contains a retrieval record that cannot be normalized safely.`);
  }
  const normalized = normalizeRetrievalState(retrieval, bank);
  if (Object.keys(normalized.items).length !== entries.length) throw new Error("The retrieval-history export contains invalid or unknown check records.");
  return { retrieval: normalized, exportedAt: raw.exportedAt, appVersion: raw.appVersion, migratedFromSchema: legacy ? 1 : null };
}

export function parseRetrievalImport(text, bank) {
  let raw;
  try { raw = JSON.parse(text); }
  catch { throw new Error("The selected retrieval-history file is not valid JSON."); }
  return validateRetrievalImport(raw, bank);
}

function sameRecord(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function planRetrievalImport(existingState, incomingState, bank) {
  const current = normalizeRetrievalState(existingState, bank);
  const incoming = normalizeRetrievalState(incomingState, bank);
  const merged = structuredClone(current);
  let newItems = 0;
  let updatedItems = 0;
  let duplicateItems = 0;
  let newAttempts = 0;
  for (const [checkId, incomingItem] of Object.entries(incoming.items)) {
    const existing = merged.items[checkId];
    if (!existing) {
      merged.items[checkId] = structuredClone(incomingItem);
      newItems += 1;
      newAttempts += incomingItem.attempts.length;
      continue;
    }
    const byId = new Map(existing.attempts.map((attempt) => [attempt.id, attempt]));
    for (const attempt of incomingItem.attempts) if (!byId.has(attempt.id)) { byId.set(attempt.id, attempt); newAttempts += 1; }
    const incomingNewer = Date.parse(incomingItem.updatedAt ?? 0) > Date.parse(existing.updatedAt ?? 0);
    const combined = {
      attempts: [...byId.values()].sort((a, b) => Date.parse(a.attemptedAt) - Date.parse(b.attemptedAt) || a.id.localeCompare(b.id)).slice(-MAX_ATTEMPTS_PER_CHECK),
      confidence: incomingNewer ? incomingItem.confidence : existing.confidence,
      review: incomingNewer ? incomingItem.review : existing.review,
      schedule: structuredClone(incomingNewer ? incomingItem.schedule : existing.schedule),
      updatedAt: incomingNewer ? incomingItem.updatedAt : existing.updatedAt
    };
    if (sameRecord(existing, combined)) duplicateItems += 1;
    else { merged.items[checkId] = combined; updatedItems += 1; }
  }
  const clockTimes = [current.clock?.lastObservedAt, incoming.clock?.lastObservedAt].filter(Boolean).sort();
  merged.clock = structuredClone(current.clock);
  if (clockTimes.length) merged.clock.lastObservedAt = clockTimes.at(-1);
  merged.updatedAt = Object.values(merged.items).map((item) => item.updatedAt).filter(Boolean).sort().at(-1) ?? current.updatedAt;
  return { merged, newItems, updatedItems, duplicateItems, newAttempts };
}

export function applyRetrievalImport(state, plan, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.retrieval = structuredClone(plan.merged);
  next.retrieval.updatedAt = effectiveReviewNow(next, now);
  next.updatedAt = next.retrieval.updatedAt;
  return next;
}
