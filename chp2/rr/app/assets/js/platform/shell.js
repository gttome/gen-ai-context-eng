export const APP_THEME_KEY = 'app_theme';

export function detectEnvironment() {
  const { protocol, hostname } = window.location;
  if (protocol === 'file:') return 'File';
  if (/localhost|127\.0\.0\.1/.test(hostname)) return 'Local';
  if (hostname.endsWith('github.io')) return 'GitHub Pages';
  return 'Web';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.textContent = `Theme • ${theme === 'dark' ? 'Dark' : 'Light'}`;
}

export function initThemeToggle() {
  const saved = localStorage.getItem(APP_THEME_KEY);
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(initial);

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(APP_THEME_KEY, next);
      applyTheme(next);
    });
  }
}

export function initShellMeta({ version }) {
  const versionPill = document.getElementById('version-pill');
  const environmentPill = document.getElementById('environment-pill');
  if (versionPill) versionPill.textContent = `Version • ${version}`;
  if (environmentPill) environmentPill.textContent = `Environment • ${detectEnvironment()}`;
  initThemeToggle();
}
