import { apiFetch, escapeHtml, getLastPath } from '../utils.js';
import { formatBytes, renderToolResultList } from './tool-ui.js';
import { openPathSelector } from './file-browser.js';

export async function setupLargeFilesTool() {
  const form = document.getElementById('large-files-form');
  if (!form) return;

  const pathInput = document.getElementById('large-files-path');
  const browseBtn = document.getElementById('large-files-browse');
  const minSizeInput = document.getElementById('large-files-min-size');
  const limitInput = document.getElementById('large-files-limit');
  const summaryEl = document.getElementById('large-files-summary');
  const resultsEl = document.getElementById('large-files-results');

  if (pathInput && !pathInput.value) {
    pathInput.value = getLastPath();
  }

  browseBtn?.addEventListener('click', () => {
    openPathSelector((path) => {
      if (pathInput) pathInput.value = path;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    summaryEl.textContent = 'Scanning...';
    resultsEl.innerHTML = '';

    const params = new URLSearchParams({
      minSizeMB: minSizeInput?.value || '100',
      limit: limitInput?.value || '200'
    });
    if (pathInput?.value.trim()) {
      params.set('path', pathInput.value.trim());
    }

    try {
      const result = await apiFetch(`/api/large-files?${params.toString()}`);
      summaryEl.textContent = `Scanned ${result.scannedFiles} files across ${result.scannedDirs} folders. Found ${result.totalMatches} large files${result.truncated ? ` (showing first ${result.limit})` : ''}.`;
      renderToolResultList(resultsEl, result.items, item => `
        <strong>${escapeHtml(item.name)} — ${formatBytes(item.size)}</strong>
        <small>${escapeHtml(item.fullPath)}</small>
      `);
    } catch (err) {
      summaryEl.textContent = `Scan failed: ${err.message}`;
    }
  });
}
