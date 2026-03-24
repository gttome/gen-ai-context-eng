
(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function asTextList(items) {
    return Array.isArray(items) ? items.filter(Boolean).map(item => `- ${item}`).join('\n') : '';
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {}
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function uid(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function percentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }
  function scoreBand(score, bands) {
    let current = bands[0];
    bands.forEach(band => {
      if (score >= band.min) current = band;
    });
    return current;
  }
  function plainText(input) {
    return String(input || '').replace(/\s+/g, ' ').trim();
  }
  function countKeywordHits(text, keywords) {
    const lower = plainText(text).toLowerCase();
    let hits = 0;
    keywords.forEach(keyword => {
      if (lower.includes(keyword.toLowerCase())) hits += 1;
    });
    return hits;
  }
  function safeStorageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  window.POLUtils = {
    clamp,
    escapeHtml,
    asTextList,
    copyText,
    uid,
    percentage,
    scoreBand,
    plainText,
    countKeywordHits,
    safeStorageGet,
    safeStorageSet
  };
})();
