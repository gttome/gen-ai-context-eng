export function createPlayer(video, options = {}) {
  const {
    onError,
    onProgress,
    onEnded,
    onReady,
    onPlaybackStarted,
    onPlaybackStateChange,
    initialResumeSeconds = 0
  } = options;
  const frame = document.createElement("div");
  frame.className = "video-frame";
  const player = document.createElement("video");
  player.controls = true;
  player.playsInline = true;
  player.preload = "metadata";
  player.poster = video.figure.path;
  player.width = video.media.width;
  player.height = video.media.height;
  player.setAttribute("aria-label", video.title);
  const source = document.createElement("source");
  source.src = video.media.path;
  source.type = video.media.type;
  player.append(source);
  const fallback = document.createElement("p");
  fallback.textContent = "This browser cannot play the supplied MP4 video.";
  player.append(fallback);

  let failed = false;
  let segmentStart = null;
  let lastFlushAt = 0;
  let lastObservedTime = 0;
  let destroyed = false;
  let hasPlayed = false;

  function playbackState() {
    return { paused: player.paused, ended: player.ended, currentTime: Number(player.currentTime) || 0 };
  }

  function notifyPlaybackState() {
    onPlaybackStateChange?.(playbackState());
  }

  function showError() {
    if (failed || destroyed) return;
    failed = true;
    player.remove();
    const error = document.createElement("div");
    error.className = "media-error";
    error.setAttribute("role", "alert");
    const strong = document.createElement("strong");
    strong.textContent = "This video could not be loaded.";
    const detail = document.createElement("p");
    detail.textContent = "Copy the complete site\\media folder from the previous working version, run CHECK-MEDIA.bat, and restart the application.";
    error.append(strong, detail);
    frame.append(error);
    if (typeof onError === "function") onError(video);
  }

  function flush({ force = false, stopped = false, reason = "interval" } = {}) {
    if (destroyed || failed || !Number.isFinite(player.duration)) return;
    const now = performance.now();
    if (!force && now - lastFlushAt < 4500) return;
    const end = player.seeking ? lastObservedTime : player.currentTime;
    const range = segmentStart !== null && end > segmentStart ? [segmentStart, end] : null;
    if (range || (force && hasPlayed)) {
      onProgress?.({
        range,
        progressSeconds: end,
        resumeSeconds: end,
        durationSeconds: player.duration,
        resumeAvailable: stopped,
        reason,
        force
      });
      segmentStart = player.paused || player.ended ? null : end;
      lastFlushAt = now;
    }
  }

  player.addEventListener("loadedmetadata", () => {
    onReady?.({ player, durationSeconds: player.duration, initialResumeSeconds });
    notifyPlaybackState();
  });
  player.addEventListener("play", () => {
    hasPlayed = true;
    lastObservedTime = player.currentTime;
    segmentStart = player.currentTime;
    onPlaybackStarted?.({ resumeSeconds: player.currentTime, durationSeconds: player.duration });
    notifyPlaybackState();
  });
  player.addEventListener("timeupdate", () => {
    if (!player.seeking) lastObservedTime = player.currentTime;
    flush({ reason: "interval" });
  });
  player.addEventListener("pause", () => {
    if (!player.seeking) lastObservedTime = player.currentTime;
    if (!player.ended) flush({ force: true, stopped: true, reason: "pause" });
    notifyPlaybackState();
  });
  player.addEventListener("seeking", () => {
    flush({ force: true, stopped: false, reason: "seeking" });
    segmentStart = null;
  });
  player.addEventListener("seeked", () => {
    lastObservedTime = player.currentTime;
    if (!player.paused) segmentStart = player.currentTime;
    // A timeline-slider move must update learning progress immediately, even
    // before playback starts. Only a paused seek after real playback creates a
    // confirmed stop for a future Continue watching prompt.
    onProgress?.({
      range: null,
      progressSeconds: player.currentTime,
      resumeSeconds: player.currentTime,
      durationSeconds: player.duration,
      resumeAvailable: player.paused && hasPlayed,
      reason: "seeked",
      force: true
    });
    notifyPlaybackState();
  });
  player.addEventListener("ended", () => {
    flush({ force: true, stopped: false, reason: "ended" });
    onEnded?.({ durationSeconds: player.duration });
    notifyPlaybackState();
  });
  player.addEventListener("error", showError, { once: true });
  source.addEventListener("error", showError, { once: true });

  const visibilityHandler = () => {
    if (document.visibilityState === "hidden" && hasPlayed && !player.ended) {
      flush({ force: true, stopped: true, reason: "visibility-hidden" });
    }
  };
  const pageHideHandler = () => {
    if (hasPlayed && !player.ended) flush({ force: true, stopped: true, reason: "pagehide" });
  };
  document.addEventListener("visibilitychange", visibilityHandler);
  window.addEventListener("pagehide", pageHideHandler);

  frame.append(player);
  return {
    frame,
    player,
    getCurrentTime() { return Number(player.currentTime) || 0; },
    getPlaybackState: playbackState,
    seekTo(seconds, { focus = true } = {}) {
      if (!Number.isFinite(player.duration)) return false;
      player.currentTime = Math.max(0, Math.min(Number(seconds) || 0, player.duration));
      if (focus) player.focus();
      return true;
    },
    resumeAt(seconds) { return this.seekTo(seconds); },
    startOver() { return this.seekTo(0); },
    async togglePlayback() {
      if (player.paused || player.ended) {
        try { await player.play(); return true; }
        catch { player.focus(); return false; }
      }
      player.pause();
      return true;
    },
    focus() { player.focus(); },
    destroy() {
      if (destroyed) return;
      if (hasPlayed && !player.ended) flush({ force: true, stopped: true, reason: "route-change" });
      destroyed = true;
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("pagehide", pageHideHandler);
      try { player.pause(); } catch { /* no-op */ }
    }
  };
}
