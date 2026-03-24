
(function () {
  const cfg = window.POLConfig || { themeStorageKey: 'app_theme' };

  function getStoredTheme() {
    try { return localStorage.getItem(cfg.themeStorageKey); } catch (e) { return null; }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(cfg.themeStorageKey, theme); } catch (e) {}
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  }

  function initTheme() {
    const stored = getStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored || (prefersDark ? 'dark' : 'light'));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function getEnvLabel() {
    const { protocol, hostname } = window.location;
    if (protocol === 'file:') return 'File';
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'Local';
    if (hostname.includes('github.io')) return 'GitHub Pages';
    return 'Web';
  }

  function hydrateShell() {
    const env = getEnvLabel();
    document.querySelectorAll('[data-env-pill]').forEach(el => { el.textContent = env; });
    document.querySelectorAll('[data-version-pill]').forEach(el => {
      el.textContent = (window.POLMissionData && window.POLMissionData.version) || 'v1.1.0';
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(el => el.addEventListener('click', toggleTheme));
  }

  window.POLShell = {
    init() {
      initTheme();
      hydrateShell();
    },
    getEnvLabel,
    setTheme,
    toggleTheme
  };
})();
