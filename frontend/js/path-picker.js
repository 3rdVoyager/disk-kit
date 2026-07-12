/**
 * Native Path Picker Utility
 * Bridge between frontend and PyWebView native dialogs
 */

import { getLastPath, setLastPath } from './utils.js';

/**
 * Open the native OS folder picker.
 * @param {Object} options
 * @param {string} options.startPath - Initial directory to show
 * @returns {Promise<string|null>} Selected path or null if cancelled
 */
export async function pickFolder({ startPath = '' } = {}) {
  // Use provided startPath, fallback to last used path
  const initial = (startPath || getLastPath() || '').replace(/\\/g, '/');

  if (!window.pywebview?.api?.pick_folder) {
    alert('Folder browse is available in the desktop app. Paste a path instead.');
    return null;
  }

  try {
    const path = await window.pywebview.api.pick_folder(initial);
    if (path) {
      setLastPath(path);
      return path;
    }
    return null;
  } catch (err) {
    console.error('Native folder picker failed:', err);
    return null;
  }
}

/**
 * Standardized helper to wire a Browse button to a path input field.
 * @param {string} inputId - ID of the text input
 * @param {string} buttonId - ID of the Browse button
 * @param {Object} options - Optional configuration
 */
export function setupPathBrowse(inputId, buttonId, options = {}) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(buttonId);
  
  if (!btn || !input) return;

  btn.addEventListener('click', async () => {
    const currentVal = input.value.trim();
    const selected = await pickFolder({ 
      startPath: currentVal || getLastPath() 
    });
    
    if (selected) {
      input.value = selected;
      // Trigger change event if needed for tool previews
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}
