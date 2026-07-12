import { apiFetch, escapeHtml, getLastPath } from '../utils.js';
import { formatBytes, renderToolResultList } from './tool-ui.js';
import { setupPathBrowse } from '../path-picker.js';
import { setupToolSteps } from './tool-steps.js';

export function setupDuplicatesTool() {
  const form = document.getElementById('duplicates-form');
  if (!form) return;

  const pathInput = document.getElementById('duplicates-path');
  const browseBtn = document.getElementById('duplicates-browse');
  const minSizeInput = document.getElementById('duplicates-min-size');
  const limitInput = document.getElementById('duplicates-limit');
  const summaryEl = document.getElementById('duplicates-summary');
  const resultsEl = document.getElementById('duplicates-results');

  if (pathInput && !pathInput.value) {
    pathInput.value = getLastPath();
  }

  setupPathBrowse('duplicates-path', 'duplicates-browse');

  const workspace = form.querySelector('.tool-workspace');
  if (workspace) setupToolSteps(workspace);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    summaryEl.textContent = 'Scanning duplicates...';
    resultsEl.innerHTML = '';

    const params = new URLSearchParams({
      minSizeMB: minSizeInput?.value || '1',
      groupLimit: limitInput?.value || '200'
    });
    if (pathInput?.value.trim()) {
      params.set('path', pathInput.value.trim());
    }

    try {
      const result = await apiFetch(`/api/duplicates?${params.toString()}`);
      summaryEl.textContent = `Scanned ${result.scannedFiles} files. Found ${result.totalGroups} duplicate groups; potential reclaim ${formatBytes(result.wastedBytes)}${result.truncated ? ` (showing first ${result.groupLimit})` : ''}.`;
      renderToolResultList(resultsEl, result.groups, group => {
        const files = group.files.map(file => escapeHtml(file.fullPath)).join('<br/>');
        return `
          <strong>${group.count} copies — ${formatBytes(group.size)} each</strong>
          <small>${files}</small>
        `;
      });
    } catch (err) {
      summaryEl.textContent = `Duplicate scan failed: ${err.message}`;
    }
  });
}
