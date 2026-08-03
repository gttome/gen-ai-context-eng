import { createPlayer } from "./player.js";
import { routeUrl } from "./router.js";
import {
  bookmarkExportPayload, bookmarksMarkdown, MAX_BOOKMARK_NOTE_LENGTH,
  parseBookmarkImport, planBookmarkImport
} from "./bookmarks.js";
import {
  canResume, chapterProgress, continueLearningDecision, courseStatusSummary,
  formatPercent, formatTime, learningProgressPercent, overallProgress, videoStatus
} from "./progress.js";
import {
  buildReviewQueue, checksForVideo, parseRetrievalImport, planRetrievalImport,
  retrievalExportPayload, retrievalRecord, retrievalSummary, reviewCountsByVideo,
  reviewStatusForCheck, reviewSummary
} from "./retrieval.js";
import {
  findLabScenario, labExportPayload, labScenarioRecord, labSummary,
  parseLabImport, planLabImport, scenariosForChapter
} from "./lab.js";

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(options)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "attrs") for (const [name, attrValue] of Object.entries(value)) node.setAttribute(name, attrValue);
  }
  for (const child of children) if (child) node.append(child);
  return node;
}
function link(text, route, className = "") {
  return el("a", {
    class: `${className} app-link`.trim(), text,
    attrs: { href: routeUrl(route) },
    dataset: {
      route: route.name,
      chapter: route.chapterId ?? "",
      video: route.videoId ?? "",
      time: Number.isFinite(route.timeSeconds) ? String(route.timeSeconds) : "",
      reviewMode: route.mode ?? "",
      scenario: route.scenarioId ?? ""
    }
  });
}
function chip(text) { return el("span", { class: "meta-chip", text }); }
function breadcrumbs(items) {
  const nav = el("nav", { class: "breadcrumbs", attrs: { "aria-label": "Breadcrumb" } });
  const list = el("ol");
  items.forEach((item) => {
    const li = el("li");
    li.append(item.route ? link(item.text, item.route) : el("span", { text: item.text, attrs: { "aria-current": "page" } }));
    list.append(li);
  });
  nav.append(list);
  return nav;
}
function setTitle(text) { document.title = `${text} · RCE Video`; }
function statusLabel(status) {
  return status === "complete" ? "Complete" : status === "in-progress" ? "In progress" : "Not started";
}
function statusSymbol(status) {
  return status === "complete" ? "✓" : status === "in-progress" ? "◐" : "○";
}
function reviewStatusLabel(status) {
  if (status.state === "due") {
    if (status.reason === "incorrect") return "Due now · last answer incorrect";
    if (status.reason === "low-confidence") return "Due now · low confidence";
    if (status.reason === "marked") return "Due now · marked for review";
    return "Due now · scheduled";
  }
  if (status.state === "completed") return "Completed for today";
  if (status.state === "upcoming" && status.dueAt) return `Upcoming · ${new Date(status.dueAt).toLocaleDateString()}`;
  return "Not scheduled";
}
function progressBar(label, value, max = 100, displayValue = Math.round(value)) {
  const wrap = el("div", { class: "progress-wrap" });
  const progress = el("progress", { attrs: { value: String(value), max: String(max), "aria-label": label } });
  wrap.append(progress, el("span", { text: `${displayValue}%`, attrs: { "aria-hidden": "true" } }));
  return wrap;
}
function noticeBanner(message, kind = "info") {
  if (!message) return null;
  return el("div", { class: `notice notice-${kind}`, attrs: { role: kind === "error" ? "alert" : "status" } }, [el("p", { text: message })]);
}
function noticeNodes(context) {
  const fragments = [];
  if (context.mediaNotice) fragments.push(noticeBanner(context.mediaNotice, "warning"));
  if (context.storageNotice) fragments.push(noticeBanner(context.storageNotice, context.storagePersistent ? "info" : "warning"));
  if (context.reviewClockNotice) fragments.push(noticeBanner(context.reviewClockNotice, "warning"));
  if (context.storageRecovered) {
    fragments.push(noticeBanner("The learning dashboard recovered with an empty, valid progress state. You can continue using every chapter and video.", "info"));
  }
  return fragments;
}

export function renderHome(main, catalog, context) {
  setTitle("Learning dashboard");
  const course = overallProgress(catalog, context.progress);
  const summary = courseStatusSummary(catalog, context.progress);
  const review = reviewSummary(catalog, context.retrievalBank, context.progress);
  const reviewCounts = reviewCountsByVideo(context.retrievalBank, context.progress);
  const lab = labSummary(context.labBank, context.progress);
  const recommendation = continueLearningDecision(catalog, context.progress);
  const navigatedChapter = catalog.chapters.find((chapter) => chapter.id === context.progress.navigation.lastChapterId);
  const currentChapterId = navigatedChapter?.id ?? recommendation.chapter?.id ?? null;

  const hero = el("section", { class: "hero", attrs: { "aria-labelledby": "page-title" } });
  const copy = el("div");
  copy.append(el("p", { class: "eyebrow", text: "Reliable Generative AI Context Engineering" }));
  copy.append(el("h1", { text: "See the full learning path and take the right next step.", attrs: { id: "page-title" } }));
  copy.append(el("p", { class: "lede", text: "Track five chapters and forty concise videos from one synchronized, browser-local learning dashboard." }));
  const stats = el("aside", { class: "hero-panel", attrs: { "aria-label": "Course metrics" } }, [
    stat(String(catalog.chapterCount), "chapters"), stat(String(catalog.videoCount), "videos"), stat(catalog.totalDurationLabel, "total runtime")
  ]);
  hero.append(copy, stats);

  const progressSection = buildContinueSection(course, recommendation, context);
  const reviewSection = buildReviewOverview(catalog, review);
  const labSection = buildLabOverview(context.labBank, context.progress, lab);
  const mapSection = buildLearningMap(catalog, context.progress, currentChapterId, review, lab);
  const masterySection = buildMasteryDashboard(catalog, context.progress, summary, reviewCounts, lab);
  main.replaceChildren(...noticeNodes(context), hero, progressSection, reviewSection, labSection, mapSection, masterySection);
}

function stat(value, label) { return el("div", { class: "hero-stat" }, [el("strong", { text: value }), el("span", { text: label })]); }

function buildContinueSection(course, recommendation, context) {
  const section = el("section", {
    class: `course-progress continue-panel continue-${recommendation.kind}`,
    attrs: { "aria-labelledby": "progress-title" },
    dataset: { continueKind: recommendation.kind }
  });
  const progressCopy = el("div", { class: "continue-copy" }, [
    el("p", { class: "eyebrow", text: "Intelligent Continue Learning" }),
    el("h2", { text: recommendation.heading, attrs: { id: "progress-title" } }),
    el("p", { class: "continue-explanation", text: recommendation.explanation }),
    el("p", { class: "course-completion-copy", text: `${course.completed} of ${course.total} videos complete` }),
    progressBar("Overall course completion", course.percent)
  ]);
  const progressActions = el("div", { class: "progress-actions" });
  if (recommendation.video && recommendation.actionLabel) {
    const action = link(recommendation.actionLabel, {
      name: "video", chapterId: recommendation.video.chapterId, videoId: recommendation.video.id
    }, "button primary continue-action");
    action.dataset.continueAction = "";
    action.dataset.targetVideo = recommendation.video.id;
    progressActions.append(action);
  }
  const resetButton = el("button", { class: "button danger-button", text: "Reset progress", attrs: { type: "button" } });
  resetButton.addEventListener("click", context.onResetRequest);
  progressActions.append(resetButton);
  const privacy = el("p", { class: "privacy-note", text: context.storagePersistent
    ? "Progress is stored only in this browser on this device. It is not sent to a server."
    : "Progress is available for this session only because permanent browser storage is unavailable." });
  section.append(progressCopy, progressActions, privacy);
  return section;
}

function buildReviewOverview(catalog, summary) {
  const section = el("section", { class: "review-overview", attrs: { "aria-labelledby": "review-overview-title" } });
  const copy = el("div", { class: "review-overview-copy" }, [
    el("p", { class: "eyebrow", text: "Spaced review queue" }),
    el("h2", { text: "Review what needs attention now", attrs: { id: "review-overview-title" } }),
    el("p", { text: "The local queue prioritizes incorrect answers, low confidence, learner review marks, and elapsed review dates. It does not change video completion." })
  ]);
  const metrics = el("div", { class: "review-metrics", attrs: { "aria-label": "Review queue summary" } }, [
    stat(String(summary.due), "due now"),
    stat(String(summary.upcoming), "upcoming"),
    stat(String(summary.completed), "completed today")
  ]);
  const actions = el("div", { class: "review-overview-actions" });
  const quick = link(summary.due ? `Start Quick Review · ${Math.min(summary.due, 10)} item${Math.min(summary.due, 10) === 1 ? "" : "s"}` : "Open Quick Review", { name: "review", mode: "quick" }, "button primary");
  actions.append(quick);
  for (const chapter of catalog.chapters) {
    const due = summary.byChapter[chapter.id]?.due ?? 0;
    actions.append(link(`Chapter ${chapter.number} Review · ${due} due`, { name: "review", mode: "chapter", chapterId: chapter.id }, "button"));
  }
  const policy = el("p", { class: "privacy-note", text: "Review intervals are 1, 3, 7, 14, and 30 days. Dates remain local to this browser and are scheduling guidance, not a certification or mastery claim." });
  section.append(copy, metrics, actions, policy);
  return section;
}

function buildLabOverview(labBank, progress, summary = labSummary(labBank, progress)) {
  const section = el("section", { class: "lab-overview", attrs: { "aria-labelledby": "lab-overview-title" } });
  const copy = el("div", { class: "lab-overview-copy" }, [
    el("p", { class: "eyebrow", text: "Interactive Context Engineering Lab" }),
    el("h2", { text: "Practice applied context-engineering judgment", attrs: { id: "lab-overview-title" } }),
    el("p", { text: "Work through six source-grounded scenarios spanning guided assembly, diagnosis, comparison, and build-from-scratch practice. Feedback checks documented criteria; it is not AI grading or a mastery claim." })
  ]);
  const metrics = el("div", { class: "lab-metrics", attrs: { "aria-label": "Applied lab summary" } }, [
    stat(String(summary.completed), "completed"),
    stat(String(summary.inProgress), "in progress"),
    stat(String(summary.notStarted), "not started")
  ]);
  const actions = el("div", { class: "lab-overview-actions" }, [
    link(summary.inProgress ? "Continue the applied lab" : summary.completed === summary.total ? "Review lab scenarios" : "Open the applied lab", { name: "lab", scenarioId: null }, "button primary")
  ]);
  const chapterLinks = el("div", { class: "lab-chapter-links", attrs: { "aria-label": "Applied lab scenarios by chapter" } });
  for (const scenario of labBank?.scenarios ?? []) {
    const record = labScenarioRecord(progress, scenario.id);
    chapterLinks.append(link(`Chapter ${scenario.chapterNumber}: ${scenario.modeLabel} · ${statusLabel(record.status === "completed" ? "complete" : record.status === "in-progress" ? "in-progress" : "not-started")}`, { name: "lab", scenarioId: scenario.id }, "lab-mini-link"));
  }
  section.append(copy, metrics, actions, chapterLinks, el("p", { class: "privacy-note", text: "Lab drafts and submissions stay in this browser unless you explicitly export them." }));
  return section;
}

function buildLearningMap(catalog, progress, currentChapterId, review, lab) {
  const section = el("section", { class: "learning-map-section", attrs: { "aria-labelledby": "learning-map-title" } });
  const head = el("div", { class: "section-head" }, [
    el("div", {}, [el("p", { class: "eyebrow", text: "Interactive book learning map" }), el("h2", { text: "Five connected chapter stages", attrs: { id: "learning-map-title" } })]),
    el("p", { text: "Open any chapter directly. Each stage shows its runtime, completion count, and current position." })
  ]);
  const path = el("ol", { class: "learning-map", attrs: { "aria-label": "Book learning path" } });
  catalog.chapters.forEach((chapter) => {
    const item = el("li", { class: "learning-stage" });
    item.append(chapterStageCard(chapter, progress, chapter.id === currentChapterId, review.byChapter[chapter.id]?.due ?? 0, lab.byChapter[chapter.id]));
    path.append(item);
  });
  section.append(head, path);
  return section;
}

function chapterStageCard(chapter, progress, isCurrent, dueCount = 0, labChapter = null) {
  const route = { name: "chapter", chapterId: chapter.id };
  const metrics = chapterProgress(chapter, progress);
  const status = metrics.completed === metrics.total ? "complete" : metrics.completed ? "in-progress" : "not-started";
  const card = link("", route, `chapter-card learning-stage-card stage-${status}`);
  card.setAttribute("aria-label", `Chapter ${chapter.number}: ${chapter.title}. ${statusLabel(status)}. ${metrics.completed} of ${metrics.total} videos complete. Runtime ${chapter.durationLabel}.`);
  if (isCurrent) card.setAttribute("aria-current", "step");
  const top = el("div", { class: "chapter-top" }, [
    el("span", { class: "chapter-num", text: String(chapter.number), attrs: { "aria-hidden": "true" } }),
    el("span", { class: "chapter-arrow", text: "Open →", attrs: { "aria-hidden": "true" } })
  ]);
  const markers = el("div", { class: "stage-markers" }, [
    el("span", { class: `status-pill status-${status}`, text: `${statusSymbol(status)} ${statusLabel(status)}` })
  ]);
  if (isCurrent) markers.append(el("span", { class: "current-marker", text: "Current chapter" }));
  const body = el("div", { class: "stage-body" }, [el("h3", { text: chapter.title }), el("p", { text: chapter.summary })]);
  const meta = el("div", { class: "card-meta" }, [chip(`${chapter.videoCount} videos`), chip(chapter.durationLabel)]);
  if (dueCount) meta.append(chip(`${dueCount} review due`));
  if (labChapter) meta.append(chip(`${labChapter.completed}/${labChapter.total} lab complete`));
  const progressNode = el("div", { class: "card-progress" }, [
    el("span", { text: `${metrics.completed} of ${metrics.total} complete` }),
    progressBar(`Chapter ${chapter.number} completion`, metrics.percent)
  ]);
  card.append(top, markers, body, meta, progressNode);
  return card;
}

function buildMasteryDashboard(catalog, progress, summary, reviewCounts = {}, lab = { byChapter: {} }) {
  const section = el("section", { class: "mastery-dashboard", attrs: { "aria-labelledby": "mastery-title" } });
  const head = el("div", { class: "section-head mastery-head" }, [
    el("div", {}, [el("p", { class: "eyebrow", text: "Visual mastery dashboard" }), el("h2", { text: "All 40 videos at a glance", attrs: { id: "mastery-title" } })]),
    el("p", { text: `${summary.complete} complete · ${summary.inProgress} in progress · ${summary.notStarted} not started` })
  ]);
  const legend = el("div", { class: "mastery-legend", attrs: { "aria-label": "Video status legend" } }, [
    legendItem("not-started"), legendItem("in-progress"), legendItem("complete")
  ]);
  const stateMessage = summary.started === 0
    ? el("div", { class: "mastery-state-message", attrs: { role: "status" } }, [el("strong", { text: "No videos started yet." }), el("span", { text: " All 40 videos are ready. Use the learning map or any video node to begin." })])
    : summary.complete === summary.total
      ? el("div", { class: "mastery-state-message mastery-complete-message", attrs: { role: "status" } }, [el("strong", { text: "Course complete." }), el("span", { text: " Every video is available for review." })])
      : null;
  const chapters = el("div", { class: "mastery-chapters" });
  catalog.chapters.forEach((chapter) => chapters.append(masteryChapter(chapter, progress, reviewCounts, lab.byChapter[chapter.id])));
  section.append(head, legend);
  if (stateMessage) section.append(stateMessage);
  section.append(chapters);
  return section;
}

function legendItem(status) {
  return el("span", { class: `legend-item legend-${status}` }, [
    el("span", { class: "legend-symbol", text: statusSymbol(status), attrs: { "aria-hidden": "true" } }),
    el("span", { text: statusLabel(status) })
  ]);
}

function masteryChapter(chapter, progress, reviewCounts = {}, labChapter = null) {
  const metrics = chapterProgress(chapter, progress);
  const section = el("section", { class: "mastery-chapter", attrs: { "aria-labelledby": `mastery-${chapter.id}` } });
  const heading = el("div", { class: "mastery-chapter-head" }, [
    el("h3", { text: `Chapter ${chapter.number}: ${chapter.title}`, attrs: { id: `mastery-${chapter.id}` } }),
    el("span", { text: `${metrics.completed} of ${metrics.total} videos complete${labChapter ? ` · ${labChapter.completed}/${labChapter.total} lab` : ""}` })
  ]);
  const list = el("ol", { class: "mastery-grid", attrs: { "aria-label": `Chapter ${chapter.number} video mastery` } });
  chapter.videos.forEach((video) => {
    const record = progress.videos[video.id];
    const status = videoStatus(record);
    const route = { name: "video", chapterId: chapter.id, videoId: video.id };
    const item = el("li");
    const node = link("", route, `mastery-node mastery-${status}`);
    node.dataset.videoId = video.id;
    node.dataset.videoStatus = status;
    const due = reviewCounts[video.id]?.due ?? 0;
    node.setAttribute("aria-label", `Chapter ${chapter.number}, Video ${video.sequence}: ${video.title}. ${statusLabel(status)}. ${due ? `${due} review item${due === 1 ? "" : "s"} due. ` : ""}Runtime ${video.durationLabel}.`);
    if (video.id === progress.navigation.lastVideoId) node.setAttribute("aria-current", "location");
    node.append(
      el("span", { class: "mastery-node-top" }, [
        el("span", { class: "mastery-symbol", text: statusSymbol(status), attrs: { "aria-hidden": "true" } }),
        el("span", { class: "mastery-video-number", text: `Video ${video.sequence}` })
      ]),
      el("span", { class: "mastery-title", text: video.title }),
      el("span", { class: "mastery-state", text: due ? `${statusLabel(status)} · ${due} review due` : statusLabel(status) })
    );
    item.append(node);
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

export function renderChapter(main, chapter, context) {
  setTitle(`Chapter ${chapter.number}`);
  const metrics = chapterProgress(chapter, context.progress);
  const reviewCounts = reviewCountsByVideo(context.retrievalBank, context.progress);
  const head = el("header", { class: "page-head" });
  head.append(breadcrumbs([{ text: "Learning dashboard", route: { name: "home" } }, { text: `Chapter ${chapter.number}` }]));
  head.append(el("p", { class: "eyebrow", text: `Chapter ${chapter.number}` }));
  head.append(el("h1", { text: chapter.title, attrs: { id: "page-title" } }));
  head.append(el("p", { class: "lede", text: chapter.summary }));
  head.append(el("div", { class: "page-meta" }, [chip(`${chapter.videoCount} videos`), chip(chapter.durationLabel), chip(`${metrics.completed} complete`)]));
  const chapterProgressNode = el("section", { class: "chapter-progress", attrs: { "aria-label": `Chapter ${chapter.number} progress` } }, [
    el("strong", { text: `${metrics.completed} of ${metrics.total} videos complete` }),
    progressBar(`Chapter ${chapter.number} completion`, metrics.percent)
  ]);
  const labScenarios = scenariosForChapter(context.labBank, chapter.id);
  const labCard = el("section", { class: "chapter-lab-card", attrs: { "aria-labelledby": `chapter-lab-${chapter.id}` } }, [
    el("div", {}, [
      el("p", { class: "eyebrow", text: "Applied lab" }),
      el("h2", { text: `Practice Chapter ${chapter.number}`, attrs: { id: `chapter-lab-${chapter.id}` } }),
      el("p", { text: "Apply this chapter’s concepts in a source-grounded scenario with criterion-based feedback." })
    ])
  ]);
  const labActions = el("div", { class: "chapter-lab-actions" });
  for (const scenario of labScenarios) {
    const record = labScenarioRecord(context.progress, scenario.id);
    const label = record.status === "completed" ? "Review" : record.status === "in-progress" ? "Continue" : "Start";
    labActions.append(link(`${label}: ${scenario.title}`, { name: "lab", scenarioId: scenario.id }, "button"));
  }
  labCard.append(labActions);
  const list = el("div", { class: "video-list", attrs: { "aria-label": `Chapter ${chapter.number} videos` } });
  chapter.videos.forEach((video) => list.append(videoRow(chapter, video, context.progress.videos[video.id], reviewCounts[video.id])));
  main.replaceChildren(...noticeNodes(context), head, chapterProgressNode, labCard, list);
}
function videoRow(chapter, video, record, reviewCount = null) {
  const route = { name: "video", chapterId: chapter.id, videoId: video.id };
  const row = link("", route, "video-row");
  const status = videoStatus(record);
  const sequence = el("span", { class: "video-seq", text: String(video.sequence), attrs: { "aria-hidden": "true" } });
  const details = [statusLabel(status)];
  if (canResume(record)) details.push(`Resume at ${formatTime(record.resumeSeconds)}`);
  if (reviewCount?.due) details.push(`${reviewCount.due} review due`);
  const copy = el("span", { class: "video-copy" }, [el("h2", { text: video.title }), el("p", { text: video.description }), el("span", { class: `status-label status-${status}`, text: details.join(" · ") })]);
  const duration = el("span", { class: "video-duration", text: video.durationLabel, attrs: { "aria-label": `${video.durationLabel} duration` } });
  const arrow = el("span", { class: "video-row-arrow", text: "→", attrs: { "aria-hidden": "true" } });
  row.append(sequence, copy, duration, arrow); return row;
}

export function renderVideo(main, chapter, video, context, route = {}) {
  setTitle(video.title);
  const record = context.progress.videos[video.id] ?? null;
  const head = el("header", { class: "page-head video-page-head" });
  head.append(breadcrumbs([
    { text: "Learning dashboard", route: { name: "home" } },
    { text: `Chapter ${chapter.number}`, route: { name: "chapter", chapterId: chapter.id } },
    { text: `Video ${video.sequence}` }
  ]));
  head.append(el("p", { class: "eyebrow", text: `Chapter ${chapter.number} · Video ${video.sequence} of ${chapter.videoCount}` }));
  head.append(el("h1", { text: video.title, attrs: { id: "page-title" } }));
  const stateChip = chip(statusLabel(videoStatus(record)));
  stateChip.dataset.videoStateChip = "";
  head.append(el("div", { class: "page-meta" }, [chip(video.durationLabel), chip("Portrait video"), stateChip]));

  const layout = el("div", { class: "player-layout iteration7-player-layout" });
  const playerCard = el("section", { class: "player-card", attrs: { "aria-label": `${video.title} video player` } });
  const playerToolbar = el("div", { class: "player-toolbar" }, [
    el("span", { text: "Video focus and playback controls" })
  ]);
  const focusButton = el("button", { class: "button focus-toggle", text: "Enter focus mode", attrs: { type: "button", "aria-pressed": "false" } });
  playerToolbar.append(focusButton);
  const status = el("p", { class: "player-status", text: "Use the browser’s video controls to play, pause, seek, adjust volume, or enter full screen." });

  const progressPanel = buildVideoProgressPanel(video, context);
  let commandBar = null;
  let desktopActions = null;
  let bookmarkTools = null;
  let retrievalTools = null;
  let focusController = null;
  const playbackListeners = new Set();
  const playerApi = createPlayer(video, {
    initialResumeSeconds: record?.resumeSeconds ?? 0,
    onError: () => { status.textContent = "Video unavailable in this copy. Follow the media-copy instructions above."; },
    onProgress: (update) => {
      const result = context.onVideoProgress(video, update);
      progressPanel.refresh(result.record);
    },
    onPlaybackStarted: () => {
      progressPanel.dismissResume();
      const result = context.onVideoProgress(video, { resumeAvailable: false });
      progressPanel.refresh(result.record);
    },
    onPlaybackStateChange: (state) => playbackListeners.forEach((listener) => listener(state)),
    onEnded: ({ durationSeconds }) => {
      const result = context.onVideoProgress(video, {
        range: [Math.max(0, durationSeconds - 1), durationSeconds],
        progressSeconds: durationSeconds,
        resumeSeconds: 0,
        resumeAvailable: false,
        ended: true
      });
      progressPanel.dismissResume();
      progressPanel.refresh(result.record);
    },
    onReady: () => {
      progressPanel.enableResume(playerApi);
      if (Number.isFinite(route.timeSeconds)) {
        progressPanel.dismissResume();
        const destination = Math.max(0, Math.min(route.timeSeconds, video.durationSeconds));
        playerApi.seekTo(destination, { focus: false });
        status.textContent = `Bookmark timestamp ${formatTime(destination)} is ready. Press play when you are ready.`;
      }
      const playbackState = playerApi.getPlaybackState();
      playbackListeners.forEach((listener) => listener(playbackState));
    }
  });
  progressPanel.setPlayer(playerApi);
  playerCard.append(playerToolbar, playerApi.frame, status, progressPanel.node);

  const supporting = el("details", { class: "content-card supporting-content", attrs: { open: "" } });
  const supportingSummary = el("summary", { text: "Supporting description, figure, and video navigation" });
  const content = el("article", { class: "supporting-body" });
  content.append(el("h2", { text: "About this video" }), el("p", { text: video.description }));
  if (video.concept) content.append(el("div", { class: "concept-box" }, [el("strong", { text: "Core concept" }), el("span", { text: video.concept })]));
  const chapterLabScenarios = scenariosForChapter(context.labBank, chapter.id);
  if (chapterLabScenarios.length) {
    const labLinks = el("div", { class: "video-lab-links" });
    for (const scenario of chapterLabScenarios) {
      const labRecord = labScenarioRecord(context.progress, scenario.id);
      const action = labRecord.status === "completed" ? "Review" : labRecord.status === "in-progress" ? "Continue" : "Try";
      labLinks.append(link(`${action} applied lab: ${scenario.modeLabel}`, { name: "lab", scenarioId: scenario.id }, "video-lab-link"));
    }
    content.append(labLinks);
  }
  const figure = el("figure", { class: "figure-card" });
  const image = el("img", { attrs: { src: video.figure.path, alt: video.figure.alt, width: String(video.figure.width), height: String(video.figure.height), loading: "lazy", decoding: "async", fetchpriority: "low" } });
  image.addEventListener("error", () => {
    figure.replaceChildren(noticeBanner("The supporting figure is missing from this copy. Copy the complete media folder and run CHECK-MEDIA.bat.", "warning"));
  }, { once: true });
  const description = el("details", { class: "figure-description" }, [
    el("summary", { text: "Figure description" }),
    el("p", { text: video.figure.alt })
  ]);
  figure.append(image, el("figcaption", { text: "Supporting textbook figure" }), description);
  content.append(figure, buildVideoNav(chapter, video));
  supporting.append(supportingSummary, content);

  focusController = createFocusController({ main, supporting, playerApi, status });
  focusController.register(focusButton);
  bookmarkTools = buildBookmarkTools(context.catalog, video, context, () => playerApi);
  // Keep personal study tools directly below the About/Core concept copy.
  // This preserves the two-column page width and places notes beside the player on desktop,
  // while the same compact panel stacks naturally immediately after About on phones.
  content.insertBefore(bookmarkTools.node, figure);
  retrievalTools = buildRetrievalChecks(video, context);
  const neighbors = courseNeighbors(context.catalog, video);
  desktopActions = buildDesktopLearningActions(chapter, video, neighbors, playerApi, focusController, bookmarkTools);
  playbackListeners.add(desktopActions.refreshPlayback);
  playerCard.append(desktopActions.node);
  commandBar = buildMobileCommandBar(chapter, video, neighbors, playerApi, focusController, bookmarkTools);
  playbackListeners.add(commandBar.refreshPlayback);

  const rightRail = el("aside", { class: "video-study-rail", attrs: { "aria-label": "Video description and personal study tools" } }, [
    supporting
  ]);
  layout.replaceChildren(playerCard, commandBar.node, rightRail);
  const studyNodes = retrievalTools ? [retrievalTools.node] : [];
  main.replaceChildren(...noticeNodes(context), head, layout, ...studyNodes);
  const stopRailSync = syncVideoStudyRail(playerCard, progressPanel.node, rightRail);
  return {
    ...playerApi,
    destroy() {
      stopRailSync();
      playbackListeners.clear();
      commandBar.destroy();
      focusController.destroy();
      playerApi.destroy();
    }
  };
}

function syncVideoStudyRail(playerCard, learningProgress, rightRail) {
  const desktop = window.matchMedia("(min-width: 58rem)");
  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!desktop.matches || document.body.classList.contains("video-focus-mode")) {
        rightRail.style.removeProperty("height");
        rightRail.style.removeProperty("max-height");
        return;
      }
      const playerTop = playerCard.getBoundingClientRect().top;
      const progressBottom = learningProgress.getBoundingClientRect().bottom;
      const targetHeight = Math.max(0, Math.round(progressBottom - playerTop));
      if (targetHeight > 0) {
        rightRail.style.height = `${targetHeight}px`;
        rightRail.style.maxHeight = `${targetHeight}px`;
      }
    });
  };
  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
  resizeObserver?.observe(playerCard);
  resizeObserver?.observe(learningProgress);
  desktop.addEventListener?.("change", update);
  window.addEventListener("resize", update);
  requestAnimationFrame(update);
  return () => {
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    desktop.removeEventListener?.("change", update);
    window.removeEventListener("resize", update);
    rightRail.style.removeProperty("height");
    rightRail.style.removeProperty("max-height");
  };
}

function createFocusController({ main, supporting, playerApi, status }) {
  let active = false;
  let supportingWasOpen = supporting.open;
  const buttons = new Set();
  function refreshButtons() {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "Exit focus mode" : "Enter focus mode";
    }
  }
  function setActive(next) {
    active = Boolean(next);
    if (active) {
      supportingWasOpen = supporting.open;
      supporting.open = false;
    } else {
      supporting.open = supportingWasOpen;
    }
    document.body.classList.toggle("video-focus-mode", active);
    main.classList.toggle("focus-mode-main", active);
    status.textContent = active
      ? "Focus mode is active. Native video controls remain available. Press Escape or use Exit focus mode to return."
      : "Use the browser’s video controls to play, pause, seek, adjust volume, or enter full screen.";
    refreshButtons();
    playerApi.focus();
  }
  function toggle() { setActive(!active); }
  function keyHandler(event) { if (active && event.key === "Escape") setActive(false); }
  document.addEventListener("keydown", keyHandler);
  return {
    register(button) {
      buttons.add(button);
      button.addEventListener("click", toggle);
      refreshButtons();
    },
    toggle,
    setActive,
    get active() { return active; },
    destroy() {
      document.removeEventListener("keydown", keyHandler);
      document.body.classList.remove("video-focus-mode");
      main.classList.remove("focus-mode-main");
    }
  };
}

function courseNeighbors(catalog, video) {
  const videos = catalog.chapters.flatMap((candidateChapter) => candidateChapter.videos);
  const index = videos.findIndex((candidate) => candidate.id === video.id);
  return { previous: index > 0 ? videos[index - 1] : null, next: index >= 0 ? videos[index + 1] ?? null : null };
}

function playbackButton(playerApi, className = "") {
  const button = el("button", { class: `button playback-toggle ${className}`.trim(), text: "Play", attrs: { type: "button" } });
  button.addEventListener("click", () => playerApi.togglePlayback());
  function refresh(state = playerApi.getPlaybackState()) {
    const label = state.ended || state.currentTime <= 0 ? "Play" : state.paused ? "Resume" : "Pause";
    button.textContent = label;
    button.setAttribute("aria-label", `${label} ${document.querySelector("#page-title")?.textContent ?? "video"}`);
  }
  refresh();
  return { button, refresh };
}

function courseNavLink(label, video, className = "") {
  if (!video) return el("span", { class: `button ${className}`.trim(), text: label, attrs: { "aria-disabled": "true" } });
  const node = link(label, { name: "video", chapterId: video.chapterId, videoId: video.id }, `button ${className}`.trim());
  node.setAttribute("aria-label", `${label}: ${video.title}`);
  return node;
}

function buildDesktopLearningActions(chapter, video, neighbors, playerApi, focusController, bookmarkTools) {
  const nav = el("nav", { class: "desktop-learning-actions", attrs: { "aria-label": "Desktop learning controls" } });
  const play = playbackButton(playerApi, "primary");
  const focus = el("button", { class: "button", text: "Enter focus mode", attrs: { type: "button", "aria-pressed": "false" } });
  focusController.register(focus);
  const bookmark = el("button", { class: "button", text: "Add bookmark", attrs: { type: "button" } });
  bookmark.addEventListener("click", () => bookmarkTools.addAtCurrent(""));
  nav.append(
    link("Chapters", { name: "home" }, "button"),
    courseNavLink("Previous", neighbors.previous),
    play.button,
    courseNavLink("Next", neighbors.next),
    focus,
    bookmark
  );
  return { node: nav, refreshPlayback: play.refresh };
}

function buildMobileCommandBar(chapter, video, neighbors, playerApi, focusController, bookmarkTools) {
  const nav = el("nav", { class: "mobile-command-bar", attrs: { "aria-label": "Mobile learning command bar" } });
  const play = playbackButton(playerApi, "command-primary");
  const more = el("details", { class: "command-more" });
  const summary = el("summary", { text: "More" });
  const panel = el("div", { class: "command-more-panel" });
  const focus = el("button", { class: "button", text: "Enter focus mode", attrs: { type: "button", "aria-pressed": "false" } });
  focusController.register(focus);
  const bookmark = el("button", { class: "button", text: "Add bookmark now", attrs: { type: "button" } });
  bookmark.addEventListener("click", () => { more.open = false; bookmarkTools.addAtCurrent(""); });
  const study = el("button", { class: "button", text: "Bookmarks and notes", attrs: { type: "button" } });
  study.addEventListener("click", () => { more.open = false; bookmarkTools.focus(); });
  panel.append(focus, bookmark, study);
  more.append(summary, panel);
  nav.append(
    link("Chapters", { name: "home" }, "command-action"),
    courseNavLink("Previous", neighbors.previous, "command-action"),
    play.button,
    courseNavLink("Next", neighbors.next, "command-action"),
    more
  );
  function updateDocking() {
    const docked = playerApi.frame.getBoundingClientRect().bottom <= 0;
    nav.classList.toggle("command-fixed", docked);
    document.body.classList.toggle("mobile-command-docked", docked);
  }
  window.addEventListener("scroll", updateDocking, { passive: true });
  window.addEventListener("resize", updateDocking);
  requestAnimationFrame(updateDocking);
  return {
    node: nav,
    refreshPlayback: play.refresh,
    destroy() {
      window.removeEventListener("scroll", updateDocking);
      window.removeEventListener("resize", updateDocking);
      document.body.classList.remove("mobile-command-docked");
    }
  };
}

function downloadText(filename, type, text) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildBookmarkTools(catalog, currentVideo, context, getPlayerApi) {
  const section = el("section", { class: "bookmark-tools", attrs: { "aria-labelledby": "bookmark-tools-title", id: "bookmark-tools" } });
  const heading = el("h2", { text: "Timestamped bookmarks and personal notes", attrs: { id: "bookmark-tools-title", tabindex: "-1" } });
  const intro = el("p", { text: "Save a timestamp and optional note while the video is in view. Data stays in this browser unless exported." });
  const form = el("div", { class: "bookmark-create" });
  const label = el("label", { text: "Optional note", attrs: { for: "bookmark-note" } });
  const note = el("textarea", { attrs: { id: "bookmark-note", rows: "2", maxlength: String(MAX_BOOKMARK_NOTE_LENGTH), placeholder: "Add a plain-text note about this moment." } });
  const add = el("button", { class: "button primary", text: "Save bookmark at current time", attrs: { type: "button" } });
  const formStatus = el("p", { class: "bookmark-form-status", attrs: { role: "status", "aria-live": "polite" } });
  form.append(label, note, add, formStatus);

  const transfer = el("div", { class: "bookmark-transfer" });
  const exportJson = el("button", { class: "button", text: "Export JSON", attrs: { type: "button" } });
  const exportMarkdown = el("button", { class: "button", text: "Export Markdown", attrs: { type: "button" } });
  const importLabel = el("label", { class: "button import-label", text: "Import JSON" });
  const importInput = el("input", { class: "sr-only", attrs: { type: "file", accept: ".json,application/json", "aria-label": "Choose bookmark JSON file" } });
  importLabel.append(importInput);
  transfer.append(exportJson, exportMarkdown, importLabel);
  const importState = el("div", { class: "bookmark-import-state", attrs: { "aria-live": "polite" } });
  const listHead = el("div", { class: "bookmark-list-head" }, [el("h3", { text: "Saved bookmarks" }), el("span", { class: "bookmark-count" })]);
  const list = el("div", { class: "bookmark-list" });
  section.append(heading, intro, form, transfer, importState, listHead, list);

  function videoLookup(videoId) {
    for (const chapter of catalog.chapters) {
      const video = chapter.videos.find((candidate) => candidate.id === videoId);
      if (video) return { chapter, video };
    }
    return null;
  }

  function addAtCurrent(noteText = note.value) {
    const playerApi = getPlayerApi();
    const seconds = playerApi?.getCurrentTime?.() ?? 0;
    try {
      const result = context.onAddBookmark(currentVideo, seconds, noteText);
      if (!result.duplicate) note.value = "";
      formStatus.textContent = result.duplicate
        ? `An identical bookmark already exists at ${formatTime(result.bookmark.seconds)}.`
        : `Saved at ${formatTime(result.bookmark.seconds)}.`;
      refresh();
      return result;
    } catch (error) {
      formStatus.textContent = error.message;
      return null;
    }
  }

  function renderBookmark(bookmark) {
    const match = videoLookup(bookmark.videoId);
    if (!match) return null;
    const article = el("article", { class: "bookmark-item", dataset: { bookmarkId: bookmark.id } });
    const title = el("h4", { text: `Chapter ${match.chapter.number} · Video ${match.video.sequence}: ${match.video.title}` });
    const meta = el("p", { class: "bookmark-meta", text: `${formatTime(bookmark.seconds)} · Updated ${new Date(bookmark.updatedAt).toLocaleString()}` });
    const noteText = el("p", { class: `bookmark-note${bookmark.note ? "" : " bookmark-note-empty"}`, text: bookmark.note || "No note." });
    const actions = el("div", { class: "bookmark-actions" });
    const jump = link(`Jump to ${formatTime(bookmark.seconds)}`, { name: "video", chapterId: bookmark.chapterId, videoId: bookmark.videoId, timeSeconds: bookmark.seconds }, "button primary bookmark-jump");
    const edit = el("button", { class: "button", text: "Edit", attrs: { type: "button" } });
    const remove = el("button", { class: "button danger-button", text: "Delete", attrs: { type: "button" } });
    actions.append(jump, edit, remove);
    const editor = el("div", { class: "bookmark-editor", attrs: { hidden: "" } });
    const timeLabel = el("label", { text: "Timestamp in seconds" });
    const timeInput = el("input", { attrs: { type: "number", min: "0", max: String(match.video.durationSeconds), step: "0.1", value: String(bookmark.seconds) } });
    timeLabel.append(timeInput);
    const editLabel = el("label", { text: "Plain-text note" });
    const editNote = el("textarea", { attrs: { rows: "4", maxlength: String(MAX_BOOKMARK_NOTE_LENGTH) } });
    editNote.value = bookmark.note;
    editLabel.append(editNote);
    const editorStatus = el("p", { class: "bookmark-editor-status", attrs: { role: "alert" } });
    const save = el("button", { class: "button primary", text: "Save changes", attrs: { type: "button" } });
    const cancel = el("button", { class: "button", text: "Cancel", attrs: { type: "button" } });
    const editorActions = el("div", { class: "bookmark-actions" }, [save, cancel]);
    editor.append(timeLabel, editLabel, editorStatus, editorActions);
    edit.addEventListener("click", () => { editor.hidden = false; editNote.focus(); });
    cancel.addEventListener("click", () => { editor.hidden = true; editorStatus.textContent = ""; });
    save.addEventListener("click", () => {
      try {
        context.onUpdateBookmark(bookmark.id, { seconds: Number(timeInput.value), note: editNote.value });
        refresh();
      } catch (error) {
        editorStatus.textContent = error.message;
      }
    });
    remove.addEventListener("click", () => { context.onDeleteBookmark(bookmark.id); refresh(); });
    article.append(title, meta, noteText, actions, editor);
    return article;
  }

  function refresh() {
    const bookmarks = [...(context.getProgress().bookmarks ?? [])].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id));
    listHead.querySelector(".bookmark-count").textContent = `${bookmarks.length} saved`;
    list.replaceChildren();
    if (!bookmarks.length) {
      list.append(el("div", { class: "bookmark-empty", attrs: { role: "status" } }, [
        el("strong", { text: "No bookmarks saved yet." }),
        el("p", { text: "Play or seek to a useful moment, then save a bookmark with or without a note." })
      ]));
      return;
    }
    for (const bookmark of bookmarks) {
      const node = renderBookmark(bookmark);
      if (node) list.append(node);
    }
  }

  add.addEventListener("click", () => addAtCurrent());
  exportJson.addEventListener("click", () => {
    const payload = bookmarkExportPayload(context.getProgress(), context.appVersion);
    downloadText("RCEVideo-bookmarks.json", "application/json", `${JSON.stringify(payload, null, 2)}\n`);
    context.announce("Bookmarks exported as JSON.");
  });
  exportMarkdown.addEventListener("click", () => {
    downloadText("RCEVideo-bookmarks.md", "text/markdown", bookmarksMarkdown(catalog, context.getProgress()));
    context.announce("Bookmarks exported as Markdown.");
  });
  importInput.addEventListener("change", async () => {
    importState.replaceChildren();
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = parseBookmarkImport(await file.text(), catalog);
      const plan = planBookmarkImport(context.getProgress().bookmarks ?? [], parsed.bookmarks);
      const preview = el("div", { class: "bookmark-import-preview", attrs: { role: "status" } }, [
        el("strong", { text: "Validated bookmark import" }),
        el("p", { text: `${plan.additions.length} new, ${plan.updates.length} newer updates, and ${plan.duplicates.length} duplicates will be skipped.` })
      ]);
      const confirm = el("button", { class: "button primary", text: "Confirm import", attrs: { type: "button" } });
      const cancel = el("button", { class: "button", text: "Cancel import", attrs: { type: "button" } });
      preview.append(el("div", { class: "bookmark-actions" }, [confirm, cancel]));
      confirm.addEventListener("click", () => {
        context.onImportBookmarks(plan);
        importState.replaceChildren(noticeBanner("Import complete.", "info"));
        importInput.value = "";
        refresh();
      });
      cancel.addEventListener("click", () => { importState.replaceChildren(); importInput.value = ""; });
      importState.append(preview);
      confirm.focus();
    } catch (error) {
      importState.append(noticeBanner(error.message, "error"));
      importInput.value = "";
    }
  });

  refresh();
  return {
    node: section,
    addAtCurrent,
    refresh,
    focus() {
      section.scrollIntoView({ block: "start", behavior: "smooth" });
      heading.focus({ preventScroll: true });
    }
  };
}


function buildRetrievalChecks(video, context) {
  const checks = checksForVideo(context.retrievalBank, video.id);
  if (!checks.length) return null;
  const section = el("section", { class: "retrieval-tools", attrs: { "aria-labelledby": "retrieval-title" } });
  const heading = el("h2", { text: "Check your understanding", attrs: { id: "retrieval-title", tabindex: "-1" } });
  const intro = el("p", { text: "These low-stakes retrieval checks support learning. Results remain separate from video completion and are not certification or mastery scores." });
  const summary = el("p", { class: "retrieval-summary", attrs: { role: "status" } });
  const transfer = el("div", { class: "retrieval-transfer" });
  const exportButton = el("button", { class: "button", text: "Export check history", attrs: { type: "button" } });
  const importLabel = el("label", { class: "button import-label", text: "Import check history" });
  const importInput = el("input", { class: "sr-only", attrs: { type: "file", accept: ".json,application/json", "aria-label": "Choose retrieval-history JSON file" } });
  importLabel.append(importInput);
  const resetButton = el("button", { class: "button danger-button", text: "Reset check history", attrs: { type: "button" } });
  transfer.append(exportButton, importLabel, resetButton);
  const transferState = el("div", { class: "retrieval-transfer-state", attrs: { "aria-live": "polite" } });
  const cards = el("div", { class: "retrieval-list" });
  section.append(heading, intro, summary, transfer, transferState, cards);

  function refreshSummary() {
    const global = retrievalSummary(context.getProgress(), context.retrievalBank);
    const localAttempted = checks.filter((check) => retrievalRecord(context.getProgress(), check.id).attempts.length).length;
    const localReview = checks.filter((check) => retrievalRecord(context.getProgress(), check.id).review).length;
    summary.textContent = `${localAttempted} of ${checks.length} checks attempted for this video · ${localReview} marked for review · ${global.attempted} of ${global.total} course checks attempted`;
  }

  function renderCheck(check) {
    const article = el("article", { class: "retrieval-card", dataset: { checkId: check.id } });
    let retrying = retrievalRecord(context.getProgress(), check.id).attempts.length === 0;

    function paint(focusSelector = null) {
      const record = retrievalRecord(context.getProgress(), check.id);
      const latest = record.attempts.at(-1) ?? null;
      const reviewStatus = reviewStatusForCheck(context.getProgress(), check.id);
      const top = el("div", { class: "retrieval-card-head" }, [
        el("p", { class: "eyebrow", text: `${check.type === "multiple-choice" ? "Multiple choice" : "Selected response"} · ${check.concept.label}` }),
        el("span", { class: "retrieval-attempt-count", text: `${record.attempts.length} attempt${record.attempts.length === 1 ? "" : "s"}` })
      ]);
      top.append(el("span", { class: `review-status review-status-${reviewStatus.state}`, text: reviewStatusLabel(reviewStatus) }));
      const prompt = el("h3", { text: check.prompt });
      const review = el("button", {
        class: `button retrieval-review${record.review ? " is-marked" : ""}`,
        text: record.review ? "Remove review mark" : "Mark for review",
        attrs: { type: "button", "aria-pressed": String(record.review) }
      });
      review.addEventListener("click", () => {
        context.onSetRetrievalReview(check.id, !record.review);
        paint(".retrieval-review");
        refreshSummary();
      });

      const form = el("form", { class: "retrieval-form" });
      const fieldset = el("fieldset");
      const legend = el("legend", { class: "sr-only", text: `Choose one answer for: ${check.prompt}` });
      fieldset.append(legend);
      const selectedChoice = retrying ? null : latest?.choiceId ?? null;
      for (const choice of check.choices) {
        const label = el("label", { class: "retrieval-choice" });
        const input = el("input", { attrs: { type: "radio", name: check.id, value: choice.id } });
        input.checked = selectedChoice === choice.id;
        input.disabled = !retrying;
        label.append(input, el("span", { text: choice.text }));
        fieldset.append(label);
      }
      const submit = el("button", { class: "button primary", text: "Check answer", attrs: { type: "submit" } });
      submit.disabled = !retrying;
      const feedback = el("div", { class: "retrieval-feedback", attrs: { tabindex: "-1", "aria-live": "polite" } });
      form.append(fieldset, submit, feedback);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const chosen = new FormData(form).get(check.id);
        if (!chosen) {
          feedback.replaceChildren(noticeBanner("Choose one answer before checking.", "error"));
          feedback.focus();
          return;
        }
        context.onSubmitRetrieval(check.id, String(chosen));
        retrying = false;
        paint(".retrieval-feedback");
        refreshSummary();
      });

      if (latest && !retrying) {
        const result = el("div", { class: `retrieval-result ${latest.correct ? "result-correct" : "result-incorrect"}` }, [
          el("strong", { text: latest.correct ? "Correct." : "Not correct yet." }),
          el("p", { text: check.explanation })
        ]);
        feedback.append(result);
        const actions = el("div", { class: "retrieval-actions" });
        if (!latest.correct) {
          const retry = el("button", { class: "button primary", text: "Retry", attrs: { type: "button" } });
          retry.addEventListener("click", () => { retrying = true; paint("input[type=radio]"); });
          actions.append(retry);
        }
        const confidence = el("fieldset", { class: "confidence-group" });
        confidence.append(el("legend", { text: "How confident were you?" }));
        for (const value of ["low", "medium", "high"]) {
          const label = el("label", { class: "confidence-choice" });
          const input = el("input", { attrs: { type: "radio", name: `${check.id}-confidence`, value } });
          input.checked = record.confidence === value;
          input.addEventListener("change", () => {
            context.onSetRetrievalConfidence(check.id, value);
            paint(`input[value="${value}"]`);
            refreshSummary();
          });
          label.append(input, el("span", { text: value[0].toUpperCase() + value.slice(1) }));
          confidence.append(label);
        }
        feedback.append(actions, confidence);
      }

      const source = el("details", { class: "retrieval-source" });
      source.append(el("summary", { text: "Source grounding" }));
      const sourceList = el("ul");
      for (const item of check.provenance) sourceList.append(el("li", { text: `${item.locator}: ${item.support}` }));
      source.append(sourceList);
      article.replaceChildren(top, prompt, review, form, source);
      if (focusSelector) requestAnimationFrame(() => article.querySelector(focusSelector)?.focus());
    }
    paint();
    return article;
  }

  function refreshCards() {
    cards.replaceChildren(...checks.map(renderCheck));
    refreshSummary();
  }

  exportButton.addEventListener("click", () => {
    const payload = retrievalExportPayload(context.getProgress(), context.appVersion);
    downloadText("RCEVideo-retrieval-history.json", "application/json", `${JSON.stringify(payload, null, 2)}\n`);
    context.announce("Retrieval-check history exported as JSON.");
  });

  importInput.addEventListener("change", async () => {
    transferState.replaceChildren();
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = parseRetrievalImport(await file.text(), context.retrievalBank);
      const plan = planRetrievalImport(context.getProgress().retrieval, parsed.retrieval, context.retrievalBank);
      const preview = el("div", { class: "retrieval-import-preview", attrs: { role: "status" } }, [
        el("strong", { text: "Validated retrieval-history import" }),
        el("p", { text: `${plan.newItems} new check records, ${plan.updatedItems} updated records, ${plan.newAttempts} new attempts, and ${plan.duplicateItems} duplicates will be skipped.` })
      ]);
      const confirm = el("button", { class: "button primary", text: "Confirm check-history import", attrs: { type: "button" } });
      const cancel = el("button", { class: "button", text: "Cancel import", attrs: { type: "button" } });
      preview.append(el("div", { class: "retrieval-actions" }, [confirm, cancel]));
      confirm.addEventListener("click", () => {
        context.onImportRetrieval(plan);
        transferState.replaceChildren(noticeBanner("Retrieval-history import complete.", "info"));
        importInput.value = "";
        refreshCards();
      });
      cancel.addEventListener("click", () => { transferState.replaceChildren(); importInput.value = ""; });
      transferState.append(preview);
      confirm.focus();
    } catch (error) {
      transferState.append(noticeBanner(error.message, "error"));
      importInput.value = "";
    }
  });

  resetButton.addEventListener("click", () => {
    const confirmation = el("div", { class: "retrieval-reset-confirm", attrs: { role: "alert" } }, [
      el("strong", { text: "Reset all retrieval-check history?" }),
      el("p", { text: "Attempts, confidence ratings, and review marks will be removed. Video progress, bookmarks, and notes will be kept." })
    ]);
    const confirm = el("button", { class: "button danger-button", text: "Confirm check-history reset", attrs: { type: "button" } });
    const cancel = el("button", { class: "button", text: "Cancel reset", attrs: { type: "button" } });
    confirmation.append(el("div", { class: "retrieval-actions" }, [confirm, cancel]));
    confirm.addEventListener("click", () => {
      context.onResetRetrieval();
      transferState.replaceChildren(noticeBanner("Retrieval-check history reset.", "info"));
      refreshCards();
    });
    cancel.addEventListener("click", () => transferState.replaceChildren());
    transferState.replaceChildren(confirmation);
    confirm.focus();
  });

  refreshCards();
  return { node: section, refresh: refreshCards };
}


export function renderReview(main, catalog, context, options = {}) {
  const mode = options.mode === "chapter" ? "chapter" : "quick";
  const chapter = mode === "chapter" ? catalog.chapters.find((item) => item.id === options.chapterId) ?? null : null;
  const titleText = chapter ? `Chapter ${chapter.number} Review` : "Quick Review";
  setTitle(titleText);
  const head = el("header", { class: "page-head review-page-head" });
  head.append(breadcrumbs([{ text: "Learning dashboard", route: { name: "home" } }, { text: titleText }]));
  head.append(el("p", { class: "eyebrow", text: "Spaced review queue" }));
  head.append(el("h1", { text: titleText, attrs: { id: "page-title" } }));
  head.append(el("p", { class: "lede", text: chapter
    ? `Review due retrieval items from Chapter ${chapter.number}. Video completion is not changed.`
    : "Review up to ten highest-priority due items across the course. Video completion is not changed." }));

  const modeNav = el("nav", { class: "review-mode-nav", attrs: { "aria-label": "Review modes" } });
  modeNav.append(link("Quick Review", { name: "review", mode: "quick" }, `button${mode === "quick" ? " primary" : ""}`));
  for (const item of catalog.chapters) {
    modeNav.append(link(`Chapter ${item.number}`, { name: "review", mode: "chapter", chapterId: item.id }, `button${chapter?.id === item.id ? " primary" : ""}`));
  }

  const labBridge = el("aside", { class: "review-lab-bridge", attrs: { "aria-label": "Applied context engineering practice" } }, [
    el("div", {}, [
      el("strong", { text: "Ready to apply the concepts?" }),
      el("p", { text: "The Interactive Context Engineering Lab uses source-grounded scenarios and criterion feedback without changing video completion or review scheduling." })
    ]),
    link(chapter ? `Open Chapter ${chapter.number} lab practice` : "Open the applied lab", chapter ? { name: "lab", scenarioId: scenariosForChapter(context.labBank, chapter.id)[0]?.id ?? null } : { name: "lab", scenarioId: null }, "button")
  ]);

  const globalSummary = reviewSummary(catalog, context.retrievalBank, context.getProgress());
  const scopeSummary = chapter ? globalSummary.byChapter[chapter.id] : globalSummary;
  const summaryNode = el("section", { class: "review-session-summary", attrs: { "aria-label": `${titleText} summary` } }, [
    stat(String(scopeSummary.due ?? 0), "due now"),
    stat(String(scopeSummary.upcoming ?? 0), "upcoming"),
    stat(String(scopeSummary.completed ?? 0), "completed today")
  ]);
  const policy = el("p", { class: "review-policy", text: "Queue order is deterministic: incorrect first, then low confidence, learner-marked, and scheduled elapsed items. Correct responses move through 1-, 3-, 7-, 14-, and 30-day intervals." });
  const queue = buildReviewQueue(catalog, context.retrievalBank, context.getProgress(), { chapterId: chapter?.id ?? null, limit: mode === "quick" ? 10 : null });
  const workspace = el("section", { class: "review-workspace", attrs: { "aria-labelledby": "review-workspace-title" } });
  workspace.append(el("h2", { text: queue.length ? `${queue.length} item${queue.length === 1 ? "" : "s"} ready` : "Nothing is due now", attrs: { id: "review-workspace-title" } }));
  const liveSummary = el("p", { class: "review-live-summary", attrs: { role: "status", "aria-live": "polite" } });
  workspace.append(liveSummary);

  function refreshSummary() {
    const current = reviewSummary(catalog, context.retrievalBank, context.getProgress());
    const scoped = chapter ? current.byChapter[chapter.id] : current;
    liveSummary.textContent = `${scoped.due ?? 0} due now · ${scoped.upcoming ?? 0} upcoming · ${scoped.completed ?? 0} completed today`;
  }

  if (!queue.length) {
    const empty = el("div", { class: "empty-card review-empty" }, [
      el("div", {}, [
        el("strong", { text: "Your due queue is clear." }),
        el("p", { text: "Items will return when a review date arrives, confidence is low, an answer is incorrect, or you mark an item for review." })
      ])
    ]);
    const upcoming = buildReviewQueue(catalog, context.retrievalBank, context.getProgress(), { chapterId: chapter?.id ?? null, limit: 3, includeUpcoming: true });
    if (upcoming.length) {
      const list = el("ul", { class: "review-upcoming-list" });
      for (const entry of upcoming) list.append(el("li", { text: `${entry.check.videoId.toUpperCase()} · ${new Date(entry.status.dueAt).toLocaleDateString()} · ${entry.check.concept.label}` }));
      empty.append(el("h3", { text: "Next scheduled items" }), list);
    }
    workspace.append(empty);
  } else {
    const list = el("div", { class: "review-session-list" });
    for (const entry of queue) list.append(buildReviewSessionCard(entry.check, catalog, context, refreshSummary));
    workspace.append(list);
  }
  refreshSummary();
  main.replaceChildren(...noticeNodes(context), head, modeNav, labBridge, summaryNode, policy, workspace);
}

function buildReviewSessionCard(check, catalog, context, onRefresh) {
  const chapter = catalog.chapters.find((item) => item.id === check.chapterId);
  const video = chapter?.videos.find((item) => item.id === check.videoId);
  const article = el("article", { class: "retrieval-card review-session-card", dataset: { checkId: check.id } });
  let answering = true;

  function paint(focusSelector = null) {
    const record = retrievalRecord(context.getProgress(), check.id);
    const latest = record.attempts.at(-1) ?? null;
    const status = reviewStatusForCheck(context.getProgress(), check.id);
    const top = el("div", { class: "retrieval-card-head" }, [
      el("p", { class: "eyebrow", text: `Chapter ${chapter?.number ?? ""} · Video ${video?.sequence ?? ""} · ${check.concept.label}` }),
      el("span", { class: `review-status review-status-${status.state}`, text: reviewStatusLabel(status) })
    ]);
    const route = video ? link(video.title, { name: "video", chapterId: chapter.id, videoId: video.id }, "review-video-link") : null;
    const prompt = el("h3", { text: check.prompt });
    const review = el("button", { class: `button retrieval-review${record.review ? " is-marked" : ""}`, text: record.review ? "Remove review mark" : "Mark for review", attrs: { type: "button", "aria-pressed": String(record.review) } });
    review.addEventListener("click", () => { context.onSetRetrievalReview(check.id, !record.review); paint(".retrieval-review"); onRefresh(); });

    const form = el("form", { class: "retrieval-form" });
    const fieldset = el("fieldset");
    fieldset.append(el("legend", { class: "sr-only", text: `Choose one answer for: ${check.prompt}` }));
    for (const choice of check.choices) {
      const label = el("label", { class: "retrieval-choice" });
      const input = el("input", { attrs: { type: "radio", name: `review-${check.id}`, value: choice.id } });
      input.disabled = !answering;
      label.append(input, el("span", { text: choice.text }));
      fieldset.append(label);
    }
    const submit = el("button", { class: "button primary", text: "Check review answer", attrs: { type: "submit" } });
    submit.disabled = !answering;
    const feedback = el("div", { class: "retrieval-feedback", attrs: { tabindex: "-1", "aria-live": "polite" } });
    form.append(fieldset, submit, feedback);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const chosen = new FormData(form).get(`review-${check.id}`);
      if (!chosen) { feedback.replaceChildren(noticeBanner("Choose one answer before checking.", "error")); feedback.focus(); return; }
      context.onSubmitRetrieval(check.id, String(chosen));
      answering = false;
      paint(".retrieval-feedback");
      onRefresh();
    });

    if (!answering && latest) {
      const updated = reviewStatusForCheck(context.getProgress(), check.id);
      feedback.append(el("div", { class: `retrieval-result ${latest.correct ? "result-correct" : "result-incorrect"}` }, [
        el("strong", { text: latest.correct ? "Correct." : "Not correct yet." }),
        el("p", { text: check.explanation }),
        el("p", { class: "review-next-date", text: reviewStatusLabel(updated) })
      ]));
      if (!latest.correct) {
        const retry = el("button", { class: "button primary", text: "Retry", attrs: { type: "button" } });
        retry.addEventListener("click", () => { answering = true; paint("input[type=radio]"); });
        feedback.append(retry);
      }
      const confidence = el("fieldset", { class: "confidence-group" });
      confidence.append(el("legend", { text: "How confident were you?" }));
      for (const value of ["low", "medium", "high"]) {
        const label = el("label", { class: "confidence-choice" });
        const input = el("input", { attrs: { type: "radio", name: `review-${check.id}-confidence`, value } });
        input.checked = record.confidence === value;
        input.addEventListener("change", () => { context.onSetRetrievalConfidence(check.id, value); paint(`input[value="${value}"]`); onRefresh(); });
        label.append(input, el("span", { text: value[0].toUpperCase() + value.slice(1) }));
        confidence.append(label);
      }
      feedback.append(confidence);
    }
    const source = el("details", { class: "retrieval-source" }, [el("summary", { text: "Source grounding" })]);
    const sourceList = el("ul");
    for (const item of check.provenance) sourceList.append(el("li", { text: `${item.locator}: ${item.support}` }));
    source.append(sourceList);
    article.replaceChildren(top);
    if (route) article.append(route);
    article.append(prompt, review, form, source);
    if (focusSelector) requestAnimationFrame(() => article.querySelector(focusSelector)?.focus());
  }
  paint();
  return article;
}

function buildVideoProgressPanel(video, context) {
  const initialRecord = context.progress.videos[video.id] ?? null;
  let resumeSnapshot = canResume(initialRecord) ? initialRecord.resumeSeconds : null;
  const panel = el("section", { class: "learning-progress", attrs: { "aria-labelledby": "video-progress-title" } });
  const title = el("h2", { text: "Learning progress", attrs: { id: "video-progress-title" } });
  const statusText = el("p", { class: "video-progress-status" });
  const watched = el("div", { class: "watched-progress" });
  const completeButton = el("button", { class: "button primary", attrs: { type: "button" } });
  const resumeBox = el("div", { class: "resume-box", attrs: { hidden: "" } });
  const privacy = el("p", { class: "privacy-note", text: context.storagePersistent
    ? "Progress is stored only in this browser on this device."
    : "Progress is available only for this browser session." });
  let playerApi = null;

  completeButton.addEventListener("click", () => {
    const current = context.getProgress().videos[video.id];
    const next = context.onToggleComplete(video, !current?.completed);
    if (next.record?.completed) dismissResume();
    refresh(next.record);
  });

  function refresh(record) {
    const state = videoStatus(record);
    const percent = learningProgressPercent(record);
    const displayedPercent = percent >= 100 ? 100 : Math.floor(percent + Number.EPSILON);
    statusText.textContent = state === "complete"
      ? `Complete${record?.completionSource === "automatic" ? " · completed automatically" : " · marked manually"}`
      : `${statusLabel(state)} · ${displayedPercent}% progress`;
    watched.replaceChildren(progressBar(`${video.title} learning progress`, percent, 100, displayedPercent));
    completeButton.textContent = record?.completed ? "Mark as incomplete" : "Mark video complete";
    const stateChip = document.querySelector("[data-video-state-chip]");
    if (stateChip) stateChip.textContent = statusLabel(state);
    completeButton.classList.toggle("primary", !record?.completed);
    // The resume prompt is intentionally not rebuilt from live playback updates.
    // It is based only on the immutable stop position captured when this page opened.
  }

  function buildResumeContents() {
    if (!Number.isFinite(resumeSnapshot)) return;
    const frozenTime = formatTime(resumeSnapshot);
    const resumeButton = el("button", { class: "button primary", text: `Resume at ${frozenTime}`, attrs: { type: "button" } });
    const startButton = el("button", { class: "button", text: "Start over", attrs: { type: "button" } });
    resumeButton.addEventListener("click", () => {
      const position = resumeSnapshot;
      dismissResume();
      context.onVideoProgress(video, { resumeAvailable: false });
      playerApi?.resumeAt(position);
    });
    startButton.addEventListener("click", () => {
      dismissResume();
      playerApi?.startOver();
      const result = context.onVideoProgress(video, { resumeSeconds: 0, resumeAvailable: false });
      refresh(result.record);
    });
    resumeBox.replaceChildren(
      el("strong", { text: "Continue watching?" }),
      el("p", { text: `You stopped at ${frozenTime}.` }),
      el("div", { class: "resume-actions" }, [resumeButton, startButton])
    );
    resumeBox.hidden = false;
  }

  function dismissResume() {
    resumeSnapshot = null;
    resumeBox.hidden = true;
    resumeBox.replaceChildren();
  }

  panel.append(title, statusText, watched, completeButton, resumeBox, privacy);
  refresh(initialRecord);
  return {
    node: panel,
    refresh,
    dismissResume,
    setPlayer(api) { playerApi = api; },
    enableResume(api) {
      playerApi = api;
      if (Number.isFinite(resumeSnapshot)) buildResumeContents();
    }
  };
}

function buildVideoNav(chapter, video) {
  const index = chapter.videos.findIndex((candidate) => candidate.id === video.id);
  const previous = chapter.videos[index - 1] ?? null;
  const next = chapter.videos[index + 1] ?? null;
  const nav = el("nav", { class: "video-nav", attrs: { "aria-label": "Video navigation" } });
  nav.append(navButton(previous ? `← ${previous.title}` : "← Previous", previous ? { name: "video", chapterId: chapter.id, videoId: previous.id } : null, "Previous video"));
  nav.append(navButton(next ? `${next.title} →` : "Next →", next ? { name: "video", chapterId: chapter.id, videoId: next.id } : null, "Next video"));
  return nav;
}
function navButton(text, route, accessibleLabel) {
  if (!route) return el("span", { class: "button", text, attrs: { "aria-disabled": "true" } });
  const node = link(text, route, "button");
  node.setAttribute("aria-label", `${accessibleLabel}: ${text.replace(/[←→]/g, "").trim()}`);
  return node;
}

export function renderLab(main, catalog, context, scenarioId = null) {
  if (!scenarioId) return renderLabHome(main, catalog, context);
  const scenario = findLabScenario(context.labBank, scenarioId);
  if (!scenario) return renderNotFound(main, "The requested applied-lab scenario does not exist.");
  return renderLabScenario(main, catalog, context, scenario);
}

function labStatusText(record) {
  return record.status === "completed" ? "Completed" : record.status === "in-progress" ? "In progress" : "Not started";
}

function renderLabHome(main, catalog, context) {
  setTitle("Interactive Context Engineering Lab");
  const progress = context.getProgress();
  const summary = labSummary(context.labBank, progress);
  const head = el("header", { class: "page-head lab-page-head" });
  head.append(breadcrumbs([{ text: "Learning dashboard", route: { name: "home" } }, { text: "Interactive Context Engineering Lab" }]));
  head.append(el("p", { class: "eyebrow", text: "Iteration 10 applied practice" }));
  head.append(el("h1", { text: "Interactive Context Engineering Lab", attrs: { id: "page-title" } }));
  head.append(el("p", { class: "lede", text: "Apply the book’s five-chapter learning arc through six source-grounded scenarios. Your work and feedback remain local to this browser." }));
  head.append(el("div", { class: "page-meta" }, [chip("6 scenarios"), chip("6 practice modes"), chip("Local-only work") ]));

  const disclaimer = noticeBanner(context.labBank.disclaimer || "Feedback checks documented structural and decision criteria. It is not AI grading, professional advice, certification, or a mastery claim.", "info");
  const metrics = el("section", { class: "lab-summary", attrs: { "aria-label": "Lab progress summary" } }, [
    stat(String(summary.completed), "completed"), stat(String(summary.inProgress), "in progress"), stat(String(summary.notStarted), "not started")
  ]);
  const grid = el("div", { class: "lab-grid", attrs: { "aria-label": "Applied lab scenarios" } });
  for (const scenario of context.labBank.scenarios) {
    const record = labScenarioRecord(progress, scenario.id);
    const card = el("article", { class: `lab-card lab-card-${record.status}`, dataset: { scenarioId: scenario.id } });
    card.append(
      el("div", { class: "lab-card-head" }, [
        el("p", { class: "eyebrow", text: `Chapter ${scenario.chapterNumber} · ${scenario.modeLabel}` }),
        el("span", { class: `lab-status lab-status-${record.status}`, text: labStatusText(record) })
      ]),
      el("h2", { text: scenario.title }),
      el("p", { text: scenario.summary }),
      el("p", { class: "lab-card-scenario", text: scenario.scenario }),
      link(record.status === "completed" ? "Review scenario" : record.status === "in-progress" ? "Continue scenario" : "Start scenario", { name: "lab", scenarioId: scenario.id }, "button primary")
    );
    grid.append(card);
  }
  const transfer = buildLabTransfer(context, () => renderLabHome(main, catalog, { ...context, progress: context.getProgress() }));
  main.replaceChildren(...noticeNodes(context), head, disclaimer, metrics, grid, transfer);
}

function buildLabTransfer(context, onRefresh) {
  const section = el("section", { class: "lab-transfer", attrs: { "aria-labelledby": "lab-transfer-title" } });
  section.append(el("div", {}, [
    el("p", { class: "eyebrow", text: "Local data controls" }),
    el("h2", { text: "Export, import, or reset lab work", attrs: { id: "lab-transfer-title" } }),
    el("p", { text: "Import is validated and previewed before it changes this browser. Resetting lab work does not reset videos, bookmarks, notes, or retrieval history." })
  ]));
  const actions = el("div", { class: "lab-transfer-actions" });
  const exportButton = el("button", { class: "button", text: "Export lab JSON", attrs: { type: "button" } });
  const importLabel = el("label", { class: "button import-label", text: "Import lab JSON" });
  const importInput = el("input", { class: "sr-only", attrs: { type: "file", accept: ".json,application/json", "aria-label": "Choose context lab JSON file" } });
  importLabel.append(importInput);
  const resetButton = el("button", { class: "button danger-button", text: "Reset lab work", attrs: { type: "button" } });
  actions.append(exportButton, importLabel, resetButton);
  const state = el("div", { class: "lab-transfer-state", attrs: { "aria-live": "polite" } });
  section.append(actions, state);

  exportButton.addEventListener("click", () => {
    const payload = labExportPayload(context.getProgress(), context.appVersion);
    downloadText("RCEVideo-context-lab.json", "application/json", `${JSON.stringify(payload, null, 2)}\n`);
    context.announce("Context lab work exported as JSON.");
  });
  importInput.addEventListener("change", async () => {
    state.replaceChildren();
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = parseLabImport(await file.text(), context.labBank);
      const plan = planLabImport(context.getProgress().lab, parsed.lab, context.labBank);
      const preview = el("div", { class: "lab-import-preview", attrs: { role: "status" } }, [
        el("strong", { text: "Validated lab import" }),
        el("p", { text: `${plan.newScenarios} new scenario record${plan.newScenarios === 1 ? "" : "s"}, ${plan.updatedScenarios} updated, ${plan.duplicateScenarios} unchanged, and ${plan.newSubmissions} new submission${plan.newSubmissions === 1 ? "" : "s"}.` })
      ]);
      const confirm = el("button", { class: "button primary", text: "Confirm import", attrs: { type: "button" } });
      const cancel = el("button", { class: "button", text: "Cancel import", attrs: { type: "button" } });
      preview.append(el("div", { class: "lab-transfer-actions" }, [confirm, cancel]));
      confirm.addEventListener("click", () => { context.onImportLab(plan); importInput.value = ""; onRefresh(); });
      cancel.addEventListener("click", () => { importInput.value = ""; state.replaceChildren(); });
      state.append(preview); confirm.focus();
    } catch (error) {
      state.append(noticeBanner(error.message, "error")); importInput.value = "";
    }
  });
  resetButton.addEventListener("click", () => {
    state.replaceChildren();
    const confirmBox = el("div", { class: "lab-reset-confirm", attrs: { role: "alert" } }, [
      el("strong", { text: "Reset all lab drafts and submissions?" }),
      el("p", { text: "Video progress, bookmarks, notes, and retrieval-check history will be kept." })
    ]);
    const confirm = el("button", { class: "button danger-solid", text: "Confirm lab reset", attrs: { type: "button" } });
    const cancel = el("button", { class: "button", text: "Cancel", attrs: { type: "button" } });
    confirmBox.append(el("div", { class: "lab-transfer-actions" }, [confirm, cancel]));
    confirm.addEventListener("click", () => { context.onResetLab(); onRefresh(); });
    cancel.addEventListener("click", () => state.replaceChildren());
    state.append(confirmBox); cancel.focus();
  });
  return section;
}

function renderLabScenario(main, catalog, context, scenario) {
  setTitle(scenario.title);
  const chapter = catalog.chapters.find((item) => item.id === scenario.chapterId);
  const progress = context.getProgress();
  const record = labScenarioRecord(progress, scenario.id);
  const head = el("header", { class: "page-head lab-page-head" });
  head.append(breadcrumbs([
    { text: "Learning dashboard", route: { name: "home" } },
    { text: "Applied lab", route: { name: "lab", scenarioId: null } },
    { text: scenario.title }
  ]));
  head.append(el("p", { class: "eyebrow", text: `Chapter ${scenario.chapterNumber} · ${scenario.modeLabel}` }));
  head.append(el("h1", { text: scenario.title, attrs: { id: "page-title" } }));
  head.append(el("p", { class: "lede", text: scenario.summary }));
  head.append(el("div", { class: "page-meta" }, [chip(labStatusText(record)), chip("Local-only draft"), chip("Criterion-based feedback") ]));

  const scenarioCard = el("section", { class: "lab-scenario-context", attrs: { "aria-labelledby": "lab-scenario-title" } }, [
    el("h2", { text: "Scenario", attrs: { id: "lab-scenario-title" } }),
    el("p", { text: scenario.scenario }),
    el("h3", { text: "Your task" }),
    el("p", { text: scenario.instructions })
  ]);
  const workspace = el("section", { class: "lab-workspace", attrs: { "aria-labelledby": "lab-workspace-title" } });
  workspace.append(el("div", { class: "lab-workspace-head" }, [
    el("div", {}, [el("p", { class: "eyebrow", text: "Practice workspace" }), el("h2", { text: scenario.modeLabel, attrs: { id: "lab-workspace-title" } })]),
    el("span", { class: `lab-status lab-status-${record.status}`, text: labStatusText(record) })
  ]));
  const form = el("form", { class: "lab-form" });
  const draft = structuredClone(record.draft ?? {});
  const controls = buildLabScenarioControls(scenario, draft);
  form.append(controls.node);
  const formStatus = el("p", { class: "lab-form-status", attrs: { role: "status", "aria-live": "polite" } });
  const actions = el("div", { class: "lab-form-actions" });
  const save = el("button", { class: "button", text: "Save draft", attrs: { type: "button" } });
  const submit = el("button", { class: "button primary", text: "Submit for criterion feedback", attrs: { type: "submit" } });
  const reset = el("button", { class: "button danger-button", text: "Reset this scenario", attrs: { type: "button" } });
  actions.append(save, submit, reset);
  const feedback = el("div", { class: "lab-feedback", attrs: { tabindex: "-1", "aria-live": "polite" } });
  form.append(formStatus, actions, feedback);
  workspace.append(form);

  const source = el("details", { class: "source-grounding" }, [el("summary", { text: "Source grounding and feedback limits" })]);
  const sourceList = el("ul");
  for (const item of scenario.provenance) sourceList.append(el("li", { text: `${item.source} · ${item.locator}: ${item.support}` }));
  source.append(
    el("p", { text: "The scenario and rubric are grounded in the owner-approved source material listed below. Structured responses are checked for documented coverage only; professional correctness still requires human review." }),
    sourceList
  );
  const navigation = el("nav", { class: "lab-scenario-nav", attrs: { "aria-label": "Lab scenario navigation" } }, [
    link("← All lab scenarios", { name: "lab", scenarioId: null }, "button"),
    chapter ? link(`Chapter ${chapter.number} videos`, { name: "chapter", chapterId: chapter.id }, "button") : null
  ]);

  function currentResponse() { return controls.read(); }
  function rerender() { renderLabScenario(main, catalog, { ...context, progress: context.getProgress() }, scenario); }
  function paintFeedback(submission) {
    feedback.replaceChildren();
    if (!submission) return;
    const intro = el("div", { class: `lab-feedback-summary ${submission.feedbackState === "all-criteria" ? "feedback-all" : "feedback-review"}` }, [
      el("strong", { text: submission.feedbackState === "all-criteria" ? "All documented criteria are represented." : `${submission.criteriaMet} of ${submission.criteriaTotal} documented criteria are represented.` }),
      el("p", { text: "Use this feedback to inspect the response. It does not evaluate real-world correctness, authorize deployment, or certify mastery." })
    ]);
    const list = el("div", { class: "lab-criteria-list" });
    for (const rubric of scenario.rubric) {
      const result = submission.criteria.find((item) => item.id === rubric.id);
      list.append(el("article", { class: `lab-criterion ${result?.met ? "criterion-met" : "criterion-needs"}` }, [
        el("strong", { text: `${result?.met ? "✓ Represented" : "○ Needs attention"}: ${rubric.label}` }),
        el("p", { text: rubric.support })
      ]));
    }
    feedback.append(intro, list); feedback.focus();
  }

  save.addEventListener("click", () => {
    context.onSaveLabDraft(scenario.id, currentResponse());
    formStatus.textContent = "Draft saved in this browser.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = context.onSubmitLab(scenario.id, currentResponse());
    formStatus.textContent = "Submission saved. Review the documented criteria below.";
    paintFeedback(result.submission);
  });
  reset.addEventListener("click", () => {
    const existing = form.querySelector(".lab-inline-reset-confirm");
    if (existing) { existing.remove(); return; }
    const confirmBox = el("div", { class: "lab-inline-reset-confirm", attrs: { role: "alert" } }, [
      el("strong", { text: "Clear this scenario’s draft and submissions?" })
    ]);
    const confirm = el("button", { class: "button danger-solid", text: "Confirm reset", attrs: { type: "button" } });
    const cancel = el("button", { class: "button", text: "Cancel", attrs: { type: "button" } });
    confirmBox.append(el("div", { class: "lab-transfer-actions" }, [confirm, cancel]));
    confirm.addEventListener("click", () => { context.onResetLabScenario(scenario.id); rerender(); });
    cancel.addEventListener("click", () => confirmBox.remove());
    actions.after(confirmBox); cancel.focus();
  });
  if (record.submissions?.length) paintFeedback(record.submissions.at(-1));
  main.replaceChildren(...noticeNodes(context), head, scenarioCard, workspace, source, navigation);
}

function buildLabScenarioControls(scenario, draft) {
  if (scenario.selection) {
    const fieldset = el("fieldset", { class: "lab-options" });
    fieldset.append(el("legend", { text: "Select every source-supported component" }));
    const selected = new Set(draft.selectedIds ?? []);
    for (const option of scenario.selection.options) {
      const label = el("label", { class: "lab-option" });
      const input = el("input", { attrs: { type: "checkbox", value: option.id } });
      input.checked = selected.has(option.id);
      label.append(input, el("span", {}, [el("strong", { text: option.label }), el("small", { text: option.description })]));
      fieldset.append(label);
    }
    return { node: fieldset, read: () => ({ selectedIds: [...fieldset.querySelectorAll("input:checked")].map((input) => input.value) }) };
  }
  if (scenario.diagnosis) {
    const wrap = el("div", { class: "lab-diagnosis" });
    for (const question of scenario.diagnosis.questions) {
      const fieldset = el("fieldset", { class: "lab-options", dataset: { questionId: question.id } });
      fieldset.append(el("legend", { text: question.prompt }));
      for (const choice of question.choices) {
        const label = el("label", { class: "lab-option" });
        const input = el("input", { attrs: { type: "radio", name: `lab-${scenario.id}-${question.id}`, value: choice.id } });
        input.checked = draft.answers?.[question.id] === choice.id;
        label.append(input, el("span", { text: choice.label })); fieldset.append(label);
      }
      wrap.append(fieldset);
    }
    return { node: wrap, read: () => {
      const answers = {};
      for (const fieldset of wrap.querySelectorAll("fieldset")) {
        const chosen = fieldset.querySelector("input:checked");
        if (chosen) answers[fieldset.dataset.questionId] = chosen.value;
      }
      return { answers };
    } };
  }
  if (scenario.comparison) {
    const wrap = el("div", { class: "lab-comparison" });
    const designs = el("fieldset", { class: "lab-options" });
    designs.append(el("legend", { text: "Choose the stronger design" }));
    for (const design of scenario.comparison.designs) {
      const label = el("label", { class: "lab-option lab-design-option" });
      const input = el("input", { attrs: { type: "radio", name: `lab-${scenario.id}-design`, value: design.id } });
      input.checked = draft.designId === design.id;
      label.append(input, el("span", {}, [el("strong", { text: design.label }), el("small", { text: design.text })])); designs.append(label);
    }
    const reasons = el("fieldset", { class: "lab-options" });
    reasons.append(el("legend", { text: "Select the source-supported reasons" }));
    const selected = new Set(draft.reasonIds ?? []);
    for (const reason of scenario.comparison.reasons) {
      const label = el("label", { class: "lab-option" });
      const input = el("input", { attrs: { type: "checkbox", value: reason.id } }); input.checked = selected.has(reason.id);
      label.append(input, el("span", { text: reason.label })); reasons.append(label);
    }
    wrap.append(designs, reasons);
    return { node: wrap, read: () => ({
      designId: designs.querySelector("input:checked")?.value ?? null,
      reasonIds: [...reasons.querySelectorAll("input:checked")].map((input) => input.value)
    }) };
  }
  const wrap = el("div", { class: "lab-structured-grid" });
  for (const field of scenario.structured?.fields ?? []) {
    const label = el("label", { class: "lab-field" });
    label.append(el("strong", { text: field.label }), el("span", { text: field.prompt }));
    const textarea = el("textarea", { attrs: { rows: "4", maxlength: String(field.maxLength ?? 5000), placeholder: field.placeholder ?? "", "data-field-id": field.id } });
    textarea.value = draft.fields?.[field.id] ?? ""; label.append(textarea); wrap.append(label);
  }
  const checks = el("fieldset", { class: "lab-options lab-self-checks" });
  checks.append(el("legend", { text: "Self-check the source-required decision areas" }));
  const selected = new Set(draft.selfChecks ?? []);
  for (const item of scenario.structured?.selfChecks ?? []) {
    const label = el("label", { class: "lab-option" });
    const input = el("input", { attrs: { type: "checkbox", value: item.id } }); input.checked = selected.has(item.id);
    label.append(input, el("span", { text: item.label })); checks.append(label);
  }
  wrap.append(checks);
  return { node: wrap, read: () => {
    const fields = {};
    for (const textarea of wrap.querySelectorAll("textarea[data-field-id]")) fields[textarea.dataset.fieldId] = textarea.value;
    return { fields, selfChecks: [...checks.querySelectorAll("input:checked")].map((input) => input.value) };
  } };
}


export function renderNotFound(main, message = "The requested learning page could not be found.") {
  setTitle("Page not found");
  const card = el("section", { class: "error-card route-error" }, [
    el("div", {}, [el("p", { class: "eyebrow", text: "Navigation error" }), el("h1", { text: "That page is not available.", attrs: { id: "page-title" } }), el("p", { text: message }), link("Return to learning dashboard", { name: "home" }, "button primary")])
  ]);
  main.replaceChildren(card);
}

export function renderCatalogError(main) {
  setTitle("Unable to load");
  const card = el("section", { class: "error-card" }, [
    el("div", {}, [el("p", { class: "eyebrow", text: "Application error" }), el("h1", { text: "The video library could not be loaded.", attrs: { id: "page-title" } }), el("p", { text: "Run the application through start-server.bat. Opening index.html directly with the file protocol is not supported." })])
  ]);
  main.replaceChildren(card);
}
