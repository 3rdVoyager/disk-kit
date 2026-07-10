import { apiFetch, escapeHtml, getLastPath } from '../utils.js';
import { renderToolResultList } from './tool-ui.js';
import { openPathSelector } from '../pages/browse-files.js';

async function runSmartOrganize(dryRun) {
  const pathInput = document.getElementById('organize-path');
  const summaryEl = document.getElementById('organize-summary');
  const resultsEl = document.getElementById('organize-results');

  summaryEl.textContent = dryRun ? 'Generating organization preview...' : 'Applying organization...';
  resultsEl.innerHTML = '';

  try {
    const result = await apiFetch('/api/organize', {
      method: 'POST',
      body: {
        path: pathInput?.value.trim() || '',
        dryRun
      }
    });
    summaryEl.textContent = `${dryRun ? 'Preview' : 'Completed'}: ${result.movedCount} files prepared/moved, ${result.skippedCount} skipped, ${result.errorCount} errors.`;
    renderToolResultList(resultsEl, result.operations, operation => `
      <strong>${escapeHtml(operation.name)} -> ${escapeHtml(operation.category)}</strong>
      <small>${escapeHtml(operation.fromPath)}<br/>${escapeHtml(operation.toPath)}</small>
    `);
  } catch (err) {
    summaryEl.textContent = `Smart organize failed: ${err.message}`;
  }
}

export function setupOrganizeTool() {
  const form = document.getElementById('smart-organize-form');
  if (!form) return;

  const pathInput = document.getElementById('organize-path');
  const browseBtn = document.getElementById('organize-browse');
  const previewBtn = document.getElementById('organize-preview-btn');

  if (pathInput && !pathInput.value) {
    pathInput.value = getLastPath();
  }

  browseBtn?.addEventListener('click', () => {
    openPathSelector((path) => {
      if (pathInput) pathInput.value = path;
    });
  });
  previewBtn?.addEventListener('click', () => runSmartOrganize(true));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await runSmartOrganize(false);
  });
}
