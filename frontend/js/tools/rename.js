import { apiFetch, escapeHtml, getLastPath } from '../utils.js';
import { renderToolResultList } from './tool-ui.js';
import { setupPathBrowse } from '../path-picker.js';

let lastPreviewPayload = null;

function renderRenameResults(resultsEl, items) {
  renderToolResultList(resultsEl, items, (item) => {
    const statusClass = item.status === 'error' || item.status === 'conflict'
      ? 'status-error'
      : (item.status === 'skipped' ? 'status-skipped' : 'status-ok');
    
    const message = item.message ? `<span class="item-message">(${item.message})</span>` : '';

    return `
      <div class="result-item-main">
        <span class="item-name" title="Old name: ${item.oldName}">${item.oldName}</span>
        <span class="material-symbols-rounded">arrow_forward</span>
        <span class="item-name" title="New name: ${item.newName}">${item.newName}</span>
        <span class="item-status ${statusClass}">${item.status.toUpperCase()}</span>
        ${message}
      </div>
    `;
  });
}

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

  // Validation
  if (payload.mode === 'replace') {
    payload.findText = document.getElementById('rename-find')?.value || '';
    payload.replaceText = document.getElementById('rename-replace')?.value || '';
    if (!payload.findText && !dryRun) {
      summaryEl.textContent = 'Error: "Find text" cannot be empty for applying rename.';
      summaryEl.classList.add('status-error');
      return;
    }
  } else if (payload.mode === 'prefix-suffix') {
    payload.prefix = document.getElementById('rename-prefix')?.value || '';
    payload.suffixText = document.getElementById('rename-suffix')?.value || '';
  } else if (payload.mode === 'numbering') {
    payload.baseName = document.getElementById('rename-base')?.value || 'file';
    payload.startIndex = parseInt(document.getElementById('rename-start')?.value || '1', 10);
    payload.padWidth = parseInt(document.getElementById('rename-pad')?.value || '3', 10);
  }

  if (!dryRun && lastPreviewPayload) {
    const hasChanged = JSON.stringify(lastPreviewPayload) !== JSON.stringify({ ...payload, dryRun: true });
    if (hasChanged) {
      const confirmed = window.confirm('Your settings have changed since the last preview. Apply anyway?');
      if (!confirmed) return;
    }
  }

  summaryEl.textContent = dryRun ? 'Generating preview...' : 'Applying rename...';
  summaryEl.classList.remove('status-error');
  resultsEl.innerHTML = '';

  try {
    const result = await apiFetch('/api/batch-rename', {
      method: 'POST',
      body: payload
    });

    if (dryRun) {
      lastPreviewPayload = { ...payload, dryRun: true };
      summaryEl.textContent = `Preview: Found ${result.totalFiles} file(s). ${result.renamedCount} will be renamed, ${result.skippedCount} skipped.`;
    } else {
      lastPreviewPayload = null;
      summaryEl.textContent = `Completed: Renamed ${result.renamedCount} file(s), ${result.skippedCount} skipped, ${result.errorCount} errors.`;
    }

    renderRenameResults(resultsEl, result.items);
  } catch (err) {
    summaryEl.textContent = `Batch rename failed: ${err.message}`;
    summaryEl.classList.add('status-error');
  }
}

export function setupRenameTool() {
  const form = document.getElementById('batch-rename-form');
  if (!form) return;

  const pathInput = document.getElementById('rename-path');
  const browseBtn = document.getElementById('rename-browse');
  const modeSelect = document.getElementById('rename-mode');

  if (pathInput && !pathInput.value) {
    pathInput.value = getLastPath();
  }

  setupPathBrowse('rename-path', 'rename-browse');

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
      el.hidden = groupMode !== mode;
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
