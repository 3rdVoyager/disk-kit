// Utility Functions for Disk Kit

export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function apiFetch(path, options = {}) {
  const base = window.location.origin || 'http://localhost:5000';
  const url = `${base}${path}`;
  const defaults = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  const config = Object.assign({}, defaults, options);
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const err = JSON.parse(errorText);
      message = err.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((acc, part) => {
    if (!(part in acc)) acc[part] = {};
    return acc[part];
  }, obj);
  target[last] = value;
}

const LAST_PATH_KEY = 'disk-kit-last-path';

export function getLastPath() {
  return localStorage.getItem(LAST_PATH_KEY) || '';
}

export function setLastPath(path) {
  if (path) localStorage.setItem(LAST_PATH_KEY, path);
}

export function updateBreadcrumb(path) {
  const parts = path ? path.split('/').filter(Boolean) : [];
  const text = parts.length ? `This PC > ${parts.join(' > ')}` : 'This PC';

  const toolbarBreadcrumb = document.querySelector('#content .toolbar-breadcrumb');
  if (toolbarBreadcrumb) {
    toolbarBreadcrumb.textContent = text;
  }
}

export async function getConfiguredDefaultPath() {
  try {
    const settings = await apiFetch('/api/settings');
    const path = settings?.general?.defaultPath;
    return path ? path.replace(/\\/g, '/') : '';
  } catch {
    return '';
  }
}

/**
 * Resolve the path to open in the file browser.
 * Prefers an explicit path, then last visited, then settings defaultPath.
 */
export async function resolveBrowserPath(explicitPath = '') {
  const normalized = (explicitPath || getLastPath() || '').replace(/\\/g, '/');
  if (normalized) return normalized;
  return getConfiguredDefaultPath();
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
