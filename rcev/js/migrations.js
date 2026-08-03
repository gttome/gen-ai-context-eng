import { PROGRESS_SCHEMA_VERSION, normalizeProgress } from "./progress.js";

export function migrateProgress(raw, catalog, retrievalBank, appVersion, labBank = null) {
  if (!raw || typeof raw !== "object") return { state: normalizeProgress(null, catalog, retrievalBank, appVersion, labBank), migrated: false };
  let version = Number(raw.schemaVersion ?? 0);
  if (version > PROGRESS_SCHEMA_VERSION) throw new Error("Saved progress was created by a newer application version.");
  let candidate = raw;
  let migrated = false;
  if (version === 0) {
    candidate = migrateVersionZero(candidate);
    version = 1;
    migrated = true;
  }
  if (version === 1) {
    candidate = migrateVersionOne(candidate);
    version = 2;
    migrated = true;
  }
  if (version === 2) {
    candidate = migrateVersionTwo(candidate);
    version = 3;
    migrated = true;
  }
  if (version === 3) {
    candidate = migrateVersionThree(candidate);
    version = 4;
    migrated = true;
  }
  if (version === 4) {
    candidate = migrateVersionFour(candidate);
    version = 5;
    migrated = true;
  }
  if (version === 5) {
    candidate = migrateVersionFive(candidate);
    version = 6;
    migrated = true;
  }
  if (version === 6) {
    candidate = migrateVersionSix(candidate);
    version = 7;
    migrated = true;
  }
  return { state: normalizeProgress(candidate, catalog, retrievalBank, appVersion, labBank), migrated };
}

function migrateVersionZero(raw) {
  const videos = {};
  for (const [videoId, value] of Object.entries(raw.completedVideos ?? {})) {
    videos[videoId] = {
      completed: value === true,
      completionSource: value === true ? "manual" : null,
      completedAt: null,
      resumeSeconds: Number(raw.positions?.[videoId] ?? 0),
      resumeAvailable: false,
      resumeSavedAt: null,
      watchedRanges: []
    };
  }
  return {
    schemaVersion: 1,
    settings: {},
    navigation: { lastChapterId: null, lastVideoId: raw.lastVideoId ?? null, lastViewedAt: null },
    videos
  };
}

function migrateVersionOne(raw) {
  const videos = {};
  for (const [videoId, candidate] of Object.entries(raw.videos ?? {})) {
    if (!candidate || typeof candidate !== "object") continue;
    const rangeMaximum = Array.isArray(candidate.watchedRanges)
      ? candidate.watchedRanges.reduce((maximum, range) => Array.isArray(range) ? Math.max(maximum, Number(range[1]) || 0) : maximum, 0)
      : 0;
    videos[videoId] = {
      ...candidate,
      progressSeconds: Math.max(Number(candidate.progressSeconds) || 0, Number(candidate.resumeSeconds) || 0, rangeMaximum)
    };
  }
  return { ...raw, schemaVersion: 2, videos };
}

function migrateVersionTwo(raw) {
  // v1.0.2 makes 90% completion a fixed rule and removes the user preference.
  return { ...raw, schemaVersion: 3, settings: {} };
}

function migrateVersionThree(raw) {
  // v1.2.0 adds local timestamped bookmarks and notes without changing video progress records.
  return { ...raw, schemaVersion: 4, bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : [] };
}

function migrateVersionFour(raw) {
  // v1.3.0 adds retrieval-check attempts, confidence, and review marks without changing video progress or bookmarks.
  return { ...raw, schemaVersion: 5, retrieval: raw.retrieval && typeof raw.retrieval === "object" ? raw.retrieval : { schemaVersion: 1, updatedAt: null, items: {} } };
}

function migrateVersionFive(raw) {
  // v1.4.0 adds deterministic spaced-review scheduling and clock metadata.
  // Retrieval normalization infers schedules from existing attempts while preserving IDs, confidence, and review marks.
  return { ...raw, schemaVersion: 6 };
}

function migrateVersionSix(raw) {
  // v2.0.0 adds local Interactive Context Engineering Lab drafts and submissions.
  return { ...raw, schemaVersion: 7, lab: raw.lab && typeof raw.lab === "object" ? raw.lab : { schemaVersion: 1, updatedAt: null, scenarios: {} } };
}
