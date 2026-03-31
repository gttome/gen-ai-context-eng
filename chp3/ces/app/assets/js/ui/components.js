export function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function inlineBadges(items = []) {
  return `<div class="status-inline">${items.map((item) => `<span class="inline-badge">${escapeHtml(item)}</span>`).join("")}</div>`;
}

export function list(items = [], className = "summary-list") {
  if (!items.length) return `<p class="muted small">None yet.</p>`;
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function blockTypeBadge(type) {
  return `<span class="block-chip">${escapeHtml(type)}</span>`;
}

export function trustBadge(value) {
  return `<span class="block-chip">${escapeHtml(value)}</span>`;
}

export function freshnessBadge(value) {
  return `<span class="block-chip">${escapeHtml(value)}</span>`;
}
