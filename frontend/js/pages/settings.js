import { apiFetch, getNestedValue, setNestedValue, setLastPath } from '../utils.js';
import { setupPathBrowse } from '../path-picker.js';
import { checkForUpdates } from '../updates.js';
import { setCachedAppVersion } from '../version.js';
import { applyTheme } from '../theme.js';

let currentSettings = null;

function populateBlockedPaths(settings) {
  const textarea = document.getElementById('blockedPaths');
  if (!textarea) return;
  const paths = settings?.security?.blockedPaths;
  textarea.value = Array.isArray(paths) ? paths.join('\n') : '';
}

function gatherBlockedPaths(data) {
  const textarea = document.getElementById('blockedPaths');
  if (!textarea) return;
  const paths = textarea.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  setNestedValue(data, 'security.blockedPaths', paths);
}

function updateDangerZoneState() {
  const disableCheckbox = document.getElementById('disablePathProtections');
  const blockedPaths = document.getElementById('blockedPaths');
  const enabled = Boolean(disableCheckbox?.checked);
  if (blockedPaths) {
    blockedPaths.disabled = enabled;
    blockedPaths.closest('.form-group')?.classList.toggle('is-disabled', enabled);
  }
}

function populateSettingsForm(settings) {
  currentSettings = settings;
  const form = document.getElementById('settings-form');
  if (!form) return;
  Array.from(form.elements).forEach(el => {
    const name = el.getAttribute('name');
    if (!name) return;
    const value = getNestedValue(settings, name);
    if (el.type === 'checkbox') {
      el.checked = Boolean(value);
    } else if (el.type === 'number') {
      el.value = value !== undefined ? value : '';
    } else {
      el.value = value !== undefined ? value : '';
    }
  });
  populateBlockedPaths(settings);
  updateDangerZoneState();
}

function gatherSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return {};
  const data = {};
  Array.from(form.elements).forEach(el => {
    const name = el.getAttribute('name');
    if (!name) return;
    if (el.type === 'checkbox') {
      setNestedValue(data, name, el.checked);
    } else if (el.type === 'number') {
      const num = parseFloat(el.value);
      setNestedValue(data, name, Number.isNaN(num) ? el.value : num);
    } else {
      setNestedValue(data, name, el.value);
    }
  });
  gatherBlockedPaths(data);
  return data;
}

async function loadSettings() {
  try {
    const settings = await apiFetch('/api/settings');
    populateSettingsForm(settings);
    showSettingsMessage('Settings loaded.', 'success');
  } catch (err) {
    console.error(err);
    showSettingsMessage(`Failed to load settings: ${err.message}`, 'error');
  }
}

async function saveSettings() {
  const data = gatherSettingsForm();
  const enablingDangerMode = Boolean(data?.security?.disablePathProtections)
    && !Boolean(currentSettings?.security?.disablePathProtections);
  if (enablingDangerMode) {
    const confirmed = window.confirm(
      'Disable path protections?\n\nYou will be able to access files anywhere on your computer, including system folders. Turn this off again in Settings when you are done.'
    );
    if (!confirmed) return;
  }

  try {
    const result = await apiFetch('/api/settings', {
      method: 'POST',
      body: data
    });
    currentSettings = result.settings;
    const defaultPath = result.settings?.general?.defaultPath;
    if (defaultPath) {
      setLastPath(defaultPath);
    }
    applyTheme(result.settings?.general?.theme);
    showSettingsMessage('Settings saved.', 'success');
  } catch (err) {
    console.error(err);
    showSettingsMessage(`Failed to save settings: ${err.message}`, 'error');
  }
}

async function resetSettings() {
  try {
    const result = await apiFetch('/api/settings/reset', { method: 'POST' });
    populateSettingsForm(result.settings);
    const defaultPath = result.settings?.general?.defaultPath;
    if (defaultPath) {
      setLastPath(defaultPath);
    }
    applyTheme(result.settings?.general?.theme);
    showSettingsMessage('Settings reset to defaults.', 'success');
  } catch (err) {
    console.error(err);
    showSettingsMessage(`Failed to reset settings: ${err.message}`, 'error');
  }
}

function showSettingsMessage(message, type) {
  const el = document.getElementById('settings-message');
  if (!el) return;
  el.textContent = message;
  el.className = `settings-message ${type}`;
}

export function setupSettingsTool() {
  const form = document.getElementById('settings-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) resetBtn.addEventListener('click', () => resetSettings());

  setupPathBrowse('defaultPath', 'settings-browse');

  const disableCheckbox = document.getElementById('disablePathProtections');
  disableCheckbox?.addEventListener('change', updateDangerZoneState);

  document.getElementById('theme')?.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  document.getElementById('check-updates-btn')?.addEventListener('click', () => checkForUpdates(true));
  
  // Update version display from backend
  apiFetch('/api/version').then(data => {
    setCachedAppVersion(data.version);
    const el = document.getElementById('about-version-display');
    if (el) el.textContent = data.version;
  }).catch(() => {});

  loadSettings();
}
