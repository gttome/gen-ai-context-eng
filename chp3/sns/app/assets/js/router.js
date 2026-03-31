export function readStageFromHash() {
  const stage = window.location.hash.replace("#", "");
  return stage || null;
}

export function setStageHash(stage) {
  const current = window.location.hash.replace("#", "");
  if (current !== stage) {
    history.replaceState(null, "", `#${stage}`);
  }
}
