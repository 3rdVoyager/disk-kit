import { apiFetch } from './utils.js';

export const DEFAULT_THEME = 'system';

const SYSTEM_MEDIA = window.matchMedia('(prefers-color-scheme: dark)');
let activePreference = DEFAULT_THEME;
let mediaListener = null;

export function normalizeThemePreference(value) {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return DEFAULT_THEME;
}

function getSystemTheme() {
  return SYSTEM_MEDIA.matches ? 'dark' : 'light';
}

function resolveTheme(preference) {
  const pref = normalizeThemePreference(preference);
  if (pref === 'system') return getSystemTheme();
  return pref;
}

function onSystemThemeChange() {
  if (activePreference === 'system') {
    document.documentElement.setAttribute('data-theme', getSystemTheme());
  }
}

export function applyTheme(preference) {
  activePreference = normalizeThemePreference(preference);
  document.documentElement.setAttribute('data-theme', resolveTheme(activePreference));

  if (activePreference === 'system') {
    if (!mediaListener) {
      mediaListener = () => onSystemThemeChange();
      SYSTEM_MEDIA.addEventListener('change', mediaListener);
    }
    return;
  }

  if (mediaListener) {
    SYSTEM_MEDIA.removeEventListener('change', mediaListener);
    mediaListener = null;
  }
}

export async function initThemeFromSettings() {
  try {
    const settings = await apiFetch('/api/settings');
    applyTheme(settings?.general?.theme || DEFAULT_THEME);
  } catch {
    applyTheme(DEFAULT_THEME);
  }
}
