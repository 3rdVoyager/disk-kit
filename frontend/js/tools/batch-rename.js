import { apiFetch, escapeHtml, getLastPath } from '../utils.js';
import { renderToolResultList } from './tool-ui.js';
import { openPathSelector } from './file-browser.js';

async function runBatchRename(dryRun) {
  const pathInput = document.getElementById('rename-path');
  const modeSelect = document.getElementById('rename-mode');
  const summaryEl = document.getElementById('batch-rename-summary');
  const resultsEl = document.getElementById('batch-rename-results');

  const payload = {
    path: pathInput?.value.trim() || '',
    mode: modeSelect?.value || 'replace',
    dryRun
  };

  if (payload.mode === 'replace') {
    payload.findText = document.getElementById('rename-find')?.value || '';
    payload.replaceText = document.getElementById('rename-replace')?.value || '';
  } else if (payload.mode === 'prefix-suffix') {
    payload.prefix = document.getElementById('rename-prefix')?.value || '';
    payload.suffixText = document.getElementById('rename-suffix')?.value || '';
  } else if (payload.mode === 'numbering') {
    payload.baseName = document.getElementById('rename-base')?.value || 'file';
    payload.startIndex = document.getElementById('rename-start')?.value || '1';
    payload.padWidth = document.getElementById('rename-pad')?.value || '3';
  }

  summaryEl.textContent = dryRun ? 'Generating preview...' : 'Applying rename...';
  resultsEl.innerHTML = '';

  try {
    const result = await apiFetch('/api/batch-rename', {
      method: 'POST',
      body: payload
    });
    summaryEl.textContent = `${dryRun ? 'Preview' : 'Completed'}: ${result.renamedCount} renamed, ${result.skippedCount} skipped, ${result.errorCount} errors.`;
    renderToolResultList(resultsEl, result.items, item => `
      <strong>${escapeHtml(item.oldName)} -> ${escapeHtml(item.newName)}</strong>
      <small>${escapeHtml(item.status)}${item.message ? ` — ${escapeHtml(item.message)}` : ''}</small>
    `);
  } catch (err) {
    summaryEl.textContent = `Batch rename failed: ${err.message}`;
  }
}

export function setupBatchRenameTool() {
  const form = document.getElementById('batch-rename-form');
  if (!form) return;

  const pathInput = document.getElementById('rename-path');
  const browseBtn = document.getElementById('rename-browse');
  const modeSelect = document.getElementById('rename-mode');

  if (pathInput && !pathInput.value) {
    pathInput.value = getLastPath();
  }

  browseBtn?.addEventListener('click', () => {
    openPathSelector((path) => {
      if (pathInput) pathInput.value = path;
    });
  });
  const previewBtn = document.getElementById('rename-preview-btn');
  const groups = {
    'replace': document.getElementById('rename-fields-replace'),
    'prefix-suffix': document.getElementById('rename-fields-prefix'),
    'numbering': document.getElementById('rename-fields-numbering')
  };

  const syncModeFields = () => {
    const mode = modeSelect.value;
    Object.entries(groups).forEach(([groupMode, el]) => {
      if (!el) return;
      el.style.display = groupMode === mode ? 'contents' : 'none';
    });
  };

  modeSelect.addEventListener('change', syncModeFields);
  syncModeFields();

  previewBtn?.addEventListener('click', () => runBatchRename(true));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await runBatchRename(false);
  });
}
