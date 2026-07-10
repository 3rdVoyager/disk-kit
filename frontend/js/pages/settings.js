import { apiFetch, getNestedValue, setNestedValue } from '../utils.js';

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
  try {
    const result = await apiFetch('/api/settings', {
      method: 'POST',
      body: data
    });
    currentSettings = result.settings;
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
  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetSettings());
  }
  loadSettings();
}
