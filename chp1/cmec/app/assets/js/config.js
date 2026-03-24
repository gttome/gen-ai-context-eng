export const APP_CONFIG = {
  appName: 'Context Engineering Mission Control',
  version: 'v1.1.8',
  buildId: 'cemc-v1.1.8',
  storageKey: 'cemc_state_v1',
  themeKey: 'app_theme',
  defaultTheme: 'dark',
  environment: detectEnvironment(),
};

export function detectEnvironment() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  if (protocol === 'file:') return 'File';
  if (host === 'localhost' || host === '127.0.0.1') return 'Local';
  if (host.includes('github.io')) return 'GitHub Pages';
  return 'Web';
}
