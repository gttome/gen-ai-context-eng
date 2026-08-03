export const BOOKMARK_EXPORT_FORMAT = "rce-video-bookmarks";
export const BOOKMARK_EXPORT_SCHEMA_VERSION = 1;
export const MAX_BOOKMARK_NOTE_LENGTH = 4000;
export const MAX_BOOKMARKS = 5000;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundTime(value) {
  return Math.round(finiteNumber(value) * 10) / 10;
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function videoIndex(catalog) {
  return new Map(catalog.chapters.flatMap((chapter) => chapter.videos.map((video) => [video.id, { chapter, video }])));
}

function validBookmarkId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

function cleanNote(value, { strict = false } = {}) {
  if (typeof value !== "string") {
    if (strict) throw new Error("Each bookmark note must be plain text.");
    return "";
  }
  if (value.length > MAX_BOOKMARK_NOTE_LENGTH) {
    if (strict) throw new Error(`Bookmark notes cannot exceed ${MAX_BOOKMARK_NOTE_LENGTH} characters.`);
    return value.slice(0, MAX_BOOKMARK_NOTE_LENGTH);
  }
  return value.replaceAll("\u0000", "");
}

function normalizedBookmark(candidate, catalog, { strict = false } = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    if (strict) throw new Error("Each imported bookmark must be an object.");
    return null;
  }
  const lookup = videoIndex(catalog);
  const match = lookup.get(candidate.videoId);
  if (!match) {
    if (strict) throw new Error(`Bookmark ${candidate.id ?? "(unknown)"} references an unknown video.`);
    return null;
  }
  if (!validBookmarkId(candidate.id)) {
    if (strict) throw new Error("Each bookmark must have a valid identifier.");
    return null;
  }
  if (candidate.chapterId !== match.chapter.id) {
    if (strict) throw new Error(`Bookmark ${candidate.id} has an invalid chapter reference.`);
    return null;
  }
  const rawSeconds = Number(candidate.seconds);
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0 || rawSeconds > match.video.durationSeconds) {
    if (strict) throw new Error(`Bookmark ${candidate.id} has a timestamp outside the video duration.`);
    return null;
  }
  const createdAt = validDate(candidate.createdAt);
  const updatedAt = validDate(candidate.updatedAt);
  if (!createdAt || !updatedAt) {
    if (strict) throw new Error(`Bookmark ${candidate.id} has an invalid created or updated time.`);
    return null;
  }
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    if (strict) throw new Error(`Bookmark ${candidate.id} was updated before it was created.`);
    return null;
  }
  return {
    id: candidate.id,
    chapterId: match.chapter.id,
    videoId: match.video.id,
    seconds: roundTime(Math.min(rawSeconds, match.video.durationSeconds)),
    note: cleanNote(candidate.note ?? "", { strict }),
    createdAt,
    updatedAt
  };
}

export function normalizeBookmarks(raw, catalog) {
  if (!Array.isArray(raw)) return [];
  const output = [];
  const ids = new Set();
  for (const candidate of raw.slice(0, MAX_BOOKMARKS)) {
    const bookmark = normalizedBookmark(candidate, catalog);
    if (!bookmark || ids.has(bookmark.id)) continue;
    ids.add(bookmark.id);
    output.push(bookmark);
  }
  return output.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function createBookmarkId(cryptoLike = globalThis.crypto) {
  if (typeof cryptoLike?.randomUUID === "function") return `bm-${cryptoLike.randomUUID()}`;
  if (typeof cryptoLike?.getRandomValues === "function") {
    const bytes = new Uint32Array(4);
    cryptoLike.getRandomValues(bytes);
    return `bm-${Array.from(bytes, (value) => value.toString(36)).join("-")}`;
  }
  return `bm-${Date.now().toString(36)}-${Math.trunc(performance.now() * 1000).toString(36)}`;
}

function duplicateFingerprint(bookmark) {
  return `${bookmark.videoId}\u001f${roundTime(bookmark.seconds)}\u001f${bookmark.note}`;
}

export function addBookmark(state, video, seconds, note = "", now = new Date().toISOString(), id = createBookmarkId()) {
  const timestamp = roundTime(Math.max(0, Math.min(finiteNumber(seconds), finiteNumber(video.durationSeconds))));
  const bookmark = {
    id,
    chapterId: video.chapterId,
    videoId: video.id,
    seconds: timestamp,
    note: cleanNote(note, { strict: true }),
    createdAt: now,
    updatedAt: now
  };
  const existing = Array.isArray(state.bookmarks) ? state.bookmarks : [];
  const duplicate = existing.find((candidate) => duplicateFingerprint(candidate) === duplicateFingerprint(bookmark));
  if (duplicate) return { state, bookmark: duplicate, duplicate: true };
  const next = structuredClone(state);
  next.bookmarks = [...existing, bookmark];
  next.updatedAt = now;
  return { state: next, bookmark, duplicate: false };
}

export function updateBookmark(state, catalog, bookmarkId, changes, now = new Date().toISOString()) {
  const current = (state.bookmarks ?? []).find((bookmark) => bookmark.id === bookmarkId);
  if (!current) throw new Error("The selected bookmark no longer exists.");
  const candidate = normalizedBookmark({
    ...current,
    seconds: changes.seconds ?? current.seconds,
    note: changes.note ?? current.note,
    updatedAt: now
  }, catalog, { strict: true });
  const duplicate = (state.bookmarks ?? []).find((bookmark) => bookmark.id !== bookmarkId && duplicateFingerprint(bookmark) === duplicateFingerprint(candidate));
  if (duplicate) throw new Error("An identical bookmark already exists at that timestamp.");
  const next = structuredClone(state);
  next.bookmarks = next.bookmarks.map((bookmark) => bookmark.id === bookmarkId ? candidate : bookmark);
  next.updatedAt = now;
  return { state: next, bookmark: candidate };
}

export function deleteBookmark(state, bookmarkId, now = new Date().toISOString()) {
  const next = structuredClone(state);
  const before = Array.isArray(next.bookmarks) ? next.bookmarks.length : 0;
  next.bookmarks = (next.bookmarks ?? []).filter((bookmark) => bookmark.id !== bookmarkId);
  if (next.bookmarks.length === before) return { state, deleted: false };
  next.updatedAt = now;
  return { state: next, deleted: true };
}

export function bookmarkExportPayload(state, appVersion = "1.2.0", now = new Date().toISOString()) {
  return {
    format: BOOKMARK_EXPORT_FORMAT,
    schemaVersion: BOOKMARK_EXPORT_SCHEMA_VERSION,
    appVersion,
    exportedAt: now,
    bookmarks: structuredClone(state.bookmarks ?? [])
  };
}

export function validateBookmarkImport(raw, catalog) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("The selected file is not a bookmark export object.");
  const topLevelKeys = new Set(["format", "schemaVersion", "appVersion", "exportedAt", "bookmarks"]);
  if (Object.keys(raw).some((key) => !topLevelKeys.has(key))) throw new Error("The bookmark export contains unsupported top-level fields.");
  if (raw.format !== BOOKMARK_EXPORT_FORMAT) throw new Error("The selected file is not an RCE Video bookmark export.");
  if (raw.schemaVersion !== BOOKMARK_EXPORT_SCHEMA_VERSION) throw new Error("This bookmark export uses an unsupported schema version.");
  if (typeof raw.appVersion !== "string" || raw.appVersion.trim() === "") throw new Error("The bookmark export has an invalid application version.");
  if (!validDate(raw.exportedAt)) throw new Error("The bookmark export has an invalid export time.");
  if (!Array.isArray(raw.bookmarks)) throw new Error("The bookmark export does not contain a bookmark list.");
  if (raw.bookmarks.length > MAX_BOOKMARKS) throw new Error(`A bookmark import cannot contain more than ${MAX_BOOKMARKS} items.`);
  const bookmarkKeys = new Set(["id", "chapterId", "videoId", "seconds", "note", "createdAt", "updatedAt"]);
  for (const candidate of raw.bookmarks) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    if (Object.keys(candidate).some((key) => !bookmarkKeys.has(key))) throw new Error("An imported bookmark contains unsupported fields.");
  }
  const bookmarks = raw.bookmarks.map((candidate) => normalizedBookmark(candidate, catalog, { strict: true }));
  const ids = new Set();
  for (const bookmark of bookmarks) {
    if (ids.has(bookmark.id)) throw new Error(`The import contains the bookmark identifier ${bookmark.id} more than once.`);
    ids.add(bookmark.id);
  }
  return { ...raw, bookmarks };
}

export function parseBookmarkImport(text, catalog) {
  if (typeof text !== "string" || text.trim() === "") throw new Error("The selected JSON file is empty.");
  let raw;
  try { raw = JSON.parse(text); }
  catch { throw new Error("The selected file is not valid JSON."); }
  return validateBookmarkImport(raw, catalog);
}

export function planBookmarkImport(existingBookmarks, incomingBookmarks) {
  const working = structuredClone(Array.isArray(existingBookmarks) ? existingBookmarks : []);
  const byId = new Map(working.map((bookmark, index) => [bookmark.id, index]));
  const fingerprints = new Map(working.map((bookmark) => [duplicateFingerprint(bookmark), bookmark.id]));
  const additions = [];
  const updates = [];
  const duplicates = [];

  for (const incoming of incomingBookmarks) {
    const existingIndex = byId.get(incoming.id);
    if (existingIndex !== undefined) {
      const existing = working[existingIndex];
      if (duplicateFingerprint(existing) === duplicateFingerprint(incoming)
          && existing.createdAt === incoming.createdAt && existing.updatedAt === incoming.updatedAt) {
        duplicates.push({ id: incoming.id, reason: "identical" });
        continue;
      }
      if (Date.parse(incoming.updatedAt) > Date.parse(existing.updatedAt)) {
        fingerprints.delete(duplicateFingerprint(existing));
        const conflictId = fingerprints.get(duplicateFingerprint(incoming));
        if (conflictId && conflictId !== incoming.id) {
          duplicates.push({ id: incoming.id, reason: "content-duplicate" });
          fingerprints.set(duplicateFingerprint(existing), existing.id);
          continue;
        }
        working[existingIndex] = incoming;
        fingerprints.set(duplicateFingerprint(incoming), incoming.id);
        updates.push(incoming);
      } else {
        duplicates.push({ id: incoming.id, reason: "existing-newer-or-equal" });
      }
      continue;
    }
    const fingerprint = duplicateFingerprint(incoming);
    if (fingerprints.has(fingerprint)) {
      duplicates.push({ id: incoming.id, reason: "content-duplicate" });
      continue;
    }
    byId.set(incoming.id, working.length);
    fingerprints.set(fingerprint, incoming.id);
    working.push(incoming);
    additions.push(incoming);
  }

  working.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
  return { additions, updates, duplicates, resultingBookmarks: working };
}

export function applyBookmarkImport(state, plan, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.bookmarks = structuredClone(plan.resultingBookmarks ?? []);
  next.updatedAt = now;
  return next;
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(finiteNumber(seconds)));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}

function markdownText(text) {
  return String(text).replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function bookmarksMarkdown(catalog, state, now = new Date().toISOString()) {
  const lookup = videoIndex(catalog);
  const lines = [
    "# RCE Video Bookmarks and Notes",
    "",
    `Exported: ${now}`,
    "",
    `Bookmarks: ${(state.bookmarks ?? []).length}`,
    ""
  ];
  if (!(state.bookmarks ?? []).length) {
    lines.push("No bookmarks have been saved.", "");
    return lines.join("\n");
  }
  const sorted = [...state.bookmarks].sort((a, b) => {
    const aMatch = lookup.get(a.videoId);
    const bMatch = lookup.get(b.videoId);
    return (aMatch?.chapter.number ?? 0) - (bMatch?.chapter.number ?? 0)
      || (aMatch?.video.sequence ?? 0) - (bMatch?.video.sequence ?? 0)
      || a.seconds - b.seconds;
  });
  for (const bookmark of sorted) {
    const match = lookup.get(bookmark.videoId);
    if (!match) continue;
    lines.push(`## Chapter ${match.chapter.number} · Video ${match.video.sequence}: ${match.video.title}`);
    lines.push("");
    lines.push(`- Timestamp: ${formatTime(bookmark.seconds)}`);
    lines.push(`- Created: ${bookmark.createdAt}`);
    lines.push(`- Updated: ${bookmark.updatedAt}`);
    if (bookmark.note) {
      lines.push("- Note:", "");
      for (const line of markdownText(bookmark.note).split("\n")) lines.push(`  > ${line}`);
    } else {
      lines.push("- Note: (none)");
    }
    lines.push("");
  }
  return lines.join("\n");
}
