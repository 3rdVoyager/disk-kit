import { apiFetch } from './utils.js';

let cachedVersion = null;

export function normalizeVersion(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/^v/i, '').split('+')[0].split('-')[0];
}

export function setCachedAppVersion(version) {
  const normalized = normalizeVersion(version);
  if (normalized) cachedVersion = normalized;
}

export function getCachedAppVersion() {
  return cachedVersion;
}

/**
 * Compare semver strings. Returns 1 if remote > local, -1 if local > remote, 0 if equal.
 */
export function compareVersions(local, remote) {
  const p1 = normalizeVersion(local).split('.').map((part) => parseInt(part, 10) || 0);
  const p2 = normalizeVersion(remote).split('.').map((part) => parseInt(part, 10) || 0);
  const length = Math.max(p1.length, p2.length, 3);

  for (let i = 0; i < length; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n2 > n1) return 1;
    if (n1 > n2) return -1;
  }
  return 0;
}

export function isUpdateAvailable(local, remote) {
  const localNorm = normalizeVersion(local);
  const remoteNorm = normalizeVersion(remote);
  if (!localNorm || !remoteNorm) return false;
  if (localNorm === remoteNorm) return false;
  return compareVersions(localNorm, remoteNorm) > 0;
}

export async function resolveAppVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const data = await apiFetch('/api/version');
    setCachedAppVersion(data.version);
    return cachedVersion;
  } catch {
    // Fall through to static fallbacks.
  }

  const meta = document.querySelector('meta[name="disk-kit-version"]');
  if (meta?.content) {
    setCachedAppVersion(meta.content);
    return cachedVersion;
  }

  const aboutDisplay = document.getElementById('about-version-display')?.textContent?.trim();
  if (aboutDisplay) {
    setCachedAppVersion(aboutDisplay);
    return cachedVersion;
  }

  return null;
}
