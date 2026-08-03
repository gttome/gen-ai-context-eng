import { normalizeBookmarks } from "./bookmarks.js";
import { createEmptyRetrievalState, normalizeRetrievalState } from "./retrieval.js";
import { createEmptyLabState, normalizeLabState } from "./lab.js";

export const PROGRESS_SCHEMA_VERSION = 7;
export const AUTO_COMPLETE_THRESHOLD = 0.9;
export const RESUME_MIN_SECONDS = 5;
export const RESUME_END_BUFFER_SECONDS = 5;

export function createEmptyProgress(appVersion = "2.0.2") {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    appVersion,
    updatedAt: null,
    settings: {},
    navigation: { lastChapterId: null, lastVideoId: null, lastViewedAt: null },
    videos: {},
    bookmarks: [],
    retrieval: createEmptyRetrievalState(),
    lab: createEmptyLabState()
  };
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

export function normalizeRanges(ranges, duration = Infinity) {
  if (!Array.isArray(ranges)) return [];
  const normalized = ranges
    .filter((range) => Array.isArray(range) && range.length === 2)
    .map(([start, end]) => [Math.max(0, finiteNumber(start)), Math.max(0, finiteNumber(end))])
    .map(([start, end]) => [Math.min(start, duration), Math.min(end, duration)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of normalized) {
    const previous = merged.at(-1);
    if (!previous || range[0] > previous[1] + 0.25) merged.push([...range]);
    else previous[1] = Math.max(previous[1], range[1]);
  }
  return merged.map(([start, end]) => [roundTime(start), roundTime(end)]);
}

export function addWatchedRange(ranges, start, end, duration = Infinity) {
  return normalizeRanges([...(Array.isArray(ranges) ? ranges : []), [start, end]], duration);
}

export function watchedSeconds(ranges) {
  return normalizeRanges(ranges).reduce((sum, [start, end]) => sum + (end - start), 0);
}

export function watchedRatio(record) {
  const duration = finiteNumber(record?.durationSeconds);
  if (duration <= 0) return 0;
  return Math.min(1, watchedSeconds(record?.watchedRanges) / duration);
}

export function watchedPercent(record) {
  return watchedRatio(record) * 100;
}

export function learningProgressRatio(record) {
  const duration = finiteNumber(record?.durationSeconds);
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, finiteNumber(record?.progressSeconds)) / duration);
}

export function learningProgressPercent(record) {
  return learningProgressRatio(record) * 100;
}

export function videoStatus(record) {
  if (record?.completed) return "complete";
  if (finiteNumber(record?.progressSeconds) > 0 || finiteNumber(record?.resumeSeconds) >= RESUME_MIN_SECONDS || watchedSeconds(record?.watchedRanges) > 0) return "in-progress";
  return "not-started";
}

export function canResume(record) {
  if (!record || record.completed || record.resumeAvailable !== true) return false;
  const position = finiteNumber(record.resumeSeconds);
  const duration = finiteNumber(record.durationSeconds);
  return position >= RESUME_MIN_SECONDS && duration > 0 && position < Math.max(RESUME_MIN_SECONDS, duration - RESUME_END_BUFFER_SECONDS);
}

export function normalizeProgress(raw, catalog, retrievalBank, appVersion = "2.0.2", labBank = null) {
  const empty = createEmptyProgress(appVersion);
  if (!raw || typeof raw !== "object") return empty;
  const validIds = new Set(catalog.chapters.flatMap((chapter) => chapter.videos.map((video) => video.id)));
  const durations = new Map(catalog.chapters.flatMap((chapter) => chapter.videos.map((video) => [video.id, video.durationSeconds])));
  const output = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    appVersion,
    updatedAt: validDate(raw.updatedAt),
    settings: {},
    navigation: {
      lastChapterId: catalog.chapters.some((chapter) => chapter.id === raw.navigation?.lastChapterId) ? raw.navigation.lastChapterId : null,
      lastVideoId: validIds.has(raw.navigation?.lastVideoId) ? raw.navigation.lastVideoId : null,
      lastViewedAt: validDate(raw.navigation?.lastViewedAt)
    },
    videos: {},
    bookmarks: normalizeBookmarks(raw.bookmarks, catalog),
    retrieval: normalizeRetrievalState(raw.retrieval, retrievalBank),
    lab: normalizeLabState(raw.lab, labBank)
  };
  for (const [videoId, candidate] of Object.entries(raw.videos ?? {})) {
    if (!validIds.has(videoId) || !candidate || typeof candidate !== "object") continue;
    const duration = finiteNumber(durations.get(videoId));
    const completed = candidate.completed === true;
    const ranges = normalizeRanges(candidate.watchedRanges, duration);
    const resumeSeconds = completed ? 0 : roundTime(Math.max(0, Math.min(finiteNumber(candidate.resumeSeconds), duration)));
    const migratedProgress = Math.max(
      finiteNumber(candidate.progressSeconds),
      resumeSeconds,
      ranges.reduce((maximum, range) => Math.max(maximum, finiteNumber(range[1])), 0)
    );
    const progressSeconds = normalizeProgressPosition(migratedProgress, duration);
    const resumeAvailable = !completed && candidate.resumeAvailable === true
      && resumeSeconds >= RESUME_MIN_SECONDS
      && resumeSeconds < Math.max(RESUME_MIN_SECONDS, duration - RESUME_END_BUFFER_SECONDS);
    output.videos[videoId] = {
      completed,
      completionSource: completed && ["manual", "automatic"].includes(candidate.completionSource) ? candidate.completionSource : completed ? "manual" : null,
      completedAt: completed ? validDate(candidate.completedAt) : null,
      progressSeconds,
      resumeSeconds,
      resumeAvailable,
      resumeSavedAt: resumeAvailable ? validDate(candidate.resumeSavedAt) : null,
      durationSeconds: duration,
      watchedRanges: ranges,
      lastViewedAt: validDate(candidate.lastViewedAt)
    };
  }
  return output;
}

export function updateVideoProgress(state, video, update, now = new Date().toISOString()) {
  const next = structuredClone(state);
  const current = next.videos[video.id] ?? {
    completed: false,
    completionSource: null,
    completedAt: null,
    progressSeconds: 0,
    resumeSeconds: 0,
    resumeAvailable: false,
    resumeSavedAt: null,
    durationSeconds: video.durationSeconds,
    watchedRanges: [],
    lastViewedAt: null
  };
  if (Array.isArray(update.range)) {
    current.watchedRanges = addWatchedRange(current.watchedRanges, update.range[0], update.range[1], video.durationSeconds);
    current.progressSeconds = normalizeProgressPosition(Math.max(current.progressSeconds ?? 0, finiteNumber(update.range[1])), video.durationSeconds);
  }
  if (update.progressSeconds !== undefined && !current.completed) {
    const selectedPosition = Math.max(0, Math.min(finiteNumber(update.progressSeconds), video.durationSeconds));
    // Learning progress follows the furthest timeline position reached. A forward
    // seek advances it immediately; a backward seek never erases prior progress.
    current.progressSeconds = normalizeProgressPosition(Math.max(finiteNumber(current.progressSeconds), selectedPosition), video.durationSeconds);
  }
  if (update.resumeSeconds !== undefined && !current.completed) current.resumeSeconds = roundTime(Math.max(0, Math.min(finiteNumber(update.resumeSeconds), video.durationSeconds)));
  if (update.resumeAvailable !== undefined && !current.completed) {
    const eligible = Boolean(update.resumeAvailable)
      && current.resumeSeconds >= RESUME_MIN_SECONDS
      && current.resumeSeconds < Math.max(RESUME_MIN_SECONDS, video.durationSeconds - RESUME_END_BUFFER_SECONDS);
    current.resumeAvailable = eligible;
    current.resumeSavedAt = eligible ? now : null;
  }
  current.durationSeconds = video.durationSeconds;
  current.lastViewedAt = now;
  if (!current.completed && learningProgressRatio(current) >= AUTO_COMPLETE_THRESHOLD) {
    current.completed = true;
    current.completionSource = "automatic";
    current.completedAt = now;
    current.progressSeconds = video.durationSeconds;
    current.resumeSeconds = 0;
    current.resumeAvailable = false;
    current.resumeSavedAt = null;
  }
  next.videos[video.id] = current;
  next.navigation = { lastChapterId: video.chapterId, lastVideoId: video.id, lastViewedAt: now };
  next.updatedAt = now;
  return next;
}

export function setVideoCompletion(state, video, completed, source = "manual", now = new Date().toISOString()) {
  const next = updateVideoProgress(state, video, {}, now);
  const record = next.videos[video.id];
  record.completed = completed;
  record.completionSource = completed ? source : null;
  record.completedAt = completed ? now : null;
  if (completed) {
    record.progressSeconds = video.durationSeconds;
    record.resumeSeconds = 0;
    record.resumeAvailable = false;
    record.resumeSavedAt = null;
  }
  next.updatedAt = now;
  return next;
}


export function setLastViewed(state, video, now = new Date().toISOString()) {
  const next = structuredClone(state);
  next.navigation = { lastChapterId: video.chapterId, lastVideoId: video.id, lastViewedAt: now };
  const current = next.videos[video.id] ?? {
    completed: false, completionSource: null, completedAt: null, progressSeconds: 0, resumeSeconds: 0,
    resumeAvailable: false, resumeSavedAt: null,
    durationSeconds: video.durationSeconds, watchedRanges: [], lastViewedAt: null
  };
  current.lastViewedAt = now;
  next.videos[video.id] = current;
  next.updatedAt = now;
  return next;
}

export function chapterProgress(chapter, state) {
  const total = chapter.videos.length;
  const completed = chapter.videos.filter((video) => state.videos[video.id]?.completed).length;
  return { completed, total, ratio: total ? completed / total : 0, percent: total ? completed / total * 100 : 0 };
}

export function overallProgress(catalog, state) {
  const videos = catalog.chapters.flatMap((chapter) => chapter.videos);
  const total = videos.length;
  const completed = videos.filter((video) => state.videos[video.id]?.completed).length;
  return { completed, total, ratio: total ? completed / total : 0, percent: total ? completed / total * 100 : 0 };
}

export function courseStatusSummary(catalog, state) {
  const videos = catalog.chapters.flatMap((chapter) => chapter.videos);
  const summary = { notStarted: 0, inProgress: 0, complete: 0, total: videos.length };
  for (const video of videos) {
    const status = videoStatus(state.videos[video.id]);
    if (status === "complete") summary.complete += 1;
    else if (status === "in-progress") summary.inProgress += 1;
    else summary.notStarted += 1;
  }
  summary.started = summary.inProgress + summary.complete;
  return summary;
}

function validTimestamp(value) {
  const time = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
}

function chapterForVideo(catalog, video) {
  return video ? catalog.chapters.find((chapter) => chapter.id === video.chapterId) ?? null : null;
}

function decision(kind, chapter, video, state, resumeSeconds = null) {
  if (!chapter || !video) {
    return {
      kind: "empty",
      chapter: null,
      video: null,
      resumeSeconds: null,
      actionLabel: null,
      heading: "No learning videos are available",
      explanation: "The catalog did not provide a video destination."
    };
  }
  const destination = `Chapter ${chapter.number} · Video ${video.sequence}: ${video.title}`;
  if (kind === "resume") {
    const time = formatTime(resumeSeconds);
    return {
      kind, chapter, video, resumeSeconds,
      actionLabel: `Resume ${destination} at ${time}`,
      heading: `Resume where you stopped in Chapter ${chapter.number}`,
      explanation: `A genuine saved stop point is available at ${time}.`
    };
  }
  if (kind === "start") {
    return {
      kind, chapter, video, resumeSeconds: null,
      actionLabel: `Start ${destination}`,
      heading: "Start the learning path",
      explanation: "No videos have been started yet, so the course begins with the first video."
    };
  }
  if (kind === "current-chapter") {
    return {
      kind, chapter, video, resumeSeconds: null,
      actionLabel: `Continue ${destination}`,
      heading: `Continue Chapter ${chapter.number}`,
      explanation: "This is the next incomplete video in the current chapter."
    };
  }
  if (kind === "next-chapter") {
    return {
      kind, chapter, video, resumeSeconds: null,
      actionLabel: `Continue with ${destination}`,
      heading: `Continue with Chapter ${chapter.number}`,
      explanation: "The current chapter is complete, so the next incomplete chapter is ready."
    };
  }
  return {
    kind: "review",
    chapter, video, resumeSeconds: null,
    actionLabel: `Review ${destination}`,
    heading: "Course complete — begin a review",
    explanation: "All 40 videos are complete. Review begins with the first video in the book."
  };
}

export function continueLearningDecision(catalog, state) {
  const videos = catalog.chapters.flatMap((chapter) => chapter.videos);
  if (!videos.length) return decision("empty", null, null, state);

  const resumeCandidates = videos
    .map((video, index) => ({ video, index, record: state.videos[video.id] }))
    .filter(({ record }) => canResume(record))
    .sort((a, b) => {
      const savedDifference = validTimestamp(b.record.resumeSavedAt) - validTimestamp(a.record.resumeSavedAt);
      if (savedDifference) return savedDifference;
      if (a.video.id === state.navigation.lastVideoId) return -1;
      if (b.video.id === state.navigation.lastVideoId) return 1;
      const viewedDifference = validTimestamp(b.record.lastViewedAt) - validTimestamp(a.record.lastViewedAt);
      return viewedDifference || a.index - b.index;
    });
  if (resumeCandidates.length) {
    const target = resumeCandidates[0];
    return decision("resume", chapterForVideo(catalog, target.video), target.video, state, target.record.resumeSeconds);
  }

  const incomplete = (video) => state.videos[video.id]?.completed !== true;
  if (!videos.some(incomplete)) return decision("review", catalog.chapters[0], catalog.chapters[0].videos[0], state);

  const lastVideo = videos.find((video) => video.id === state.navigation.lastVideoId) ?? null;
  const currentChapter = catalog.chapters.find((chapter) => chapter.id === state.navigation.lastChapterId)
    ?? chapterForVideo(catalog, lastVideo);
  const started = courseStatusSummary(catalog, state).started > 0;

  if (currentChapter) {
    if (lastVideo?.chapterId === currentChapter.id && incomplete(lastVideo)) {
      return decision("current-chapter", currentChapter, lastVideo, state);
    }
    const lastIndex = lastVideo?.chapterId === currentChapter.id
      ? currentChapter.videos.findIndex((video) => video.id === lastVideo.id)
      : -1;
    const afterCurrent = currentChapter.videos.slice(lastIndex + 1).find(incomplete);
    const firstIncomplete = afterCurrent ?? currentChapter.videos.find(incomplete);
    if (firstIncomplete) return decision("current-chapter", currentChapter, firstIncomplete, state);

    const chapterIndex = catalog.chapters.findIndex((chapter) => chapter.id === currentChapter.id);
    const nextIncompleteChapter = catalog.chapters.slice(chapterIndex + 1)
      .find((chapter) => chapter.videos.some(incomplete))
      ?? catalog.chapters.find((chapter) => chapter.videos.some(incomplete));
    if (nextIncompleteChapter) {
      return decision("next-chapter", nextIncompleteChapter, nextIncompleteChapter.videos.find(incomplete), state);
    }
  }

  const firstIncompleteChapter = catalog.chapters.find((chapter) => chapter.videos.some(incomplete));
  const firstIncompleteVideo = firstIncompleteChapter?.videos.find(incomplete) ?? null;
  return decision(started ? "next-chapter" : "start", firstIncompleteChapter, firstIncompleteVideo, state);
}

export function nextLearningTarget(catalog, state) {
  return continueLearningDecision(catalog, state).video;
}

export function resetLearningProgress(state, appVersion = "2.0.2", now = new Date().toISOString()) {
  const next = createEmptyProgress(appVersion);
  next.bookmarks = structuredClone(state?.bookmarks ?? []);
  next.retrieval = structuredClone(state?.retrieval ?? createEmptyRetrievalState());
  next.lab = structuredClone(state?.lab ?? createEmptyLabState());
  next.updatedAt = now;
  return next;
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function formatTime(seconds) {
  const value = Math.max(0, Math.floor(finiteNumber(seconds)));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}

function normalizeProgressPosition(value, duration) {
  const clamped = Math.max(0, Math.min(finiteNumber(value), finiteNumber(duration)));
  if (duration > 0 && duration - clamped <= 0.05) return duration;
  return roundTime(clamped);
}

function roundTime(value) { return Math.round(value * 10) / 10; }
