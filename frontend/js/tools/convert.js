import { apiFetch, formatBytes, getLastPath } from '../utils.js';
import { openPathSelector } from '../popups/folder-picker.js';
import { renderToolResultList } from './tool-ui.js';

const COMING_SOON_COPY = {
  audio: {
    title: 'Audio conversion coming soon',
    text: 'Batch audio conversion (MP3, WAV, FLAC, and more) is on the way.',
  },
  video: {
    title: 'Video conversion coming soon',
    text: 'Batch video conversion and compression will be available in a future update.',
  },
};

function renderConvertResults(resultsEl, operations) {
  renderToolResultList(resultsEl, operations, (item) => {
    const sizeInfo = item.status === 'completed'
      ? `<span class="size-delta">${formatBytes(item.originalSize)} → ${formatBytes(item.newSize)}</span>`
      : `<span class="size-orig">${formatBytes(item.originalSize)}</span>`;

    const statusClass = item.status === 'error'
      ? 'status-error'
      : (item.status === 'skipped' ? 'status-skipped' : 'status-ok');
    const message = item.message ? `<span class="item-message">(${item.message})</span>` : '';

    return `
      <div class="result-item-main">
        <span class="item-name" title="${item.originalPath}">${item.name}</span>
        <span class="item-status ${statusClass}">${item.status.toUpperCase()}</span>
        ${message}
      </div>
      <div class="result-item-details">
        ${sizeInfo}
        <span class="item-path">${item.outputPath || '—'}</span>
      </div>
    `;
  });
}

async function runConvertRequest(body, { deleteOriginalsChecked, dryRun, summaryEl, resultsEl, label }) {
  summaryEl.textContent = dryRun ? `Generating ${label} preview...` : `Converting ${label}...`;
  summaryEl.classList.remove('convert-summary-error');
  resultsEl.innerHTML = '';

  try {
    const result = await apiFetch('/api/convert', {
      method: 'POST',
      body,
    });

    if (dryRun) {
      const removalNote = deleteOriginalsChecked
        ? ' Successfully converted originals will be moved to the Recycle Bin.'
        : '';
      summaryEl.textContent = `Preview: Found ${result.operations.length} item(s). ${result.skippedCount} will be skipped.${removalNote}`;
    } else {
      summaryEl.textContent = `Completed: Converted ${result.convertedCount} files, ${result.deletedCount} originals recycled, ${result.skippedCount} skipped, ${result.errorCount} errors.`;
    }

    renderConvertResults(resultsEl, result.operations);
  } catch (err) {
    summaryEl.textContent = `Conversion failed: ${err.message}`;
    summaryEl.classList.add('convert-summary-error');
  }
}

async function runImageConvert(dryRun = true) {
  const pathInput = document.getElementById('convert-path');
  const formatSelect = document.getElementById('convert-format');
  const qualityInput = document.getElementById('convert-quality');
  const maxWidthInput = document.getElementById('convert-max-width');
  const maxHeightInput = document.getElementById('convert-max-height');
  const stripMetadataCheckbox = document.getElementById('convert-strip-metadata');
  const deleteOriginalsCheckbox = document.getElementById('convert-delete-originals');
  const outputModeSelect = document.getElementById('convert-output-mode');
  const customPathInput = document.getElementById('convert-custom-path');
  const summaryEl = document.getElementById('convert-summary');
  const resultsEl = document.getElementById('convert-results');

  if (!summaryEl || !resultsEl) return;

  await runConvertRequest({
    path: pathInput.value.trim(),
    category: 'images',
    outputFormat: formatSelect.value,
    quality: parseInt(qualityInput.value, 10),
    maxWidth: maxWidthInput.value ? parseInt(maxWidthInput.value, 10) : null,
    maxHeight: maxHeightInput.value ? parseInt(maxHeightInput.value, 10) : null,
    stripMetadata: stripMetadataCheckbox.checked,
    deleteOriginals: deleteOriginalsCheckbox.checked,
    outputMode: outputModeSelect.value,
    outputPath: customPathInput.value.trim(),
    dryRun,
  }, {
    deleteOriginalsChecked: deleteOriginalsCheckbox.checked,
    dryRun,
    summaryEl,
    resultsEl,
    label: 'image conversion',
  });
}

function switchConvertTab(category) {
  const tabs = document.querySelectorAll('.convert-tab');
  const panels = {
    images: document.getElementById('panel-images'),
    comingSoon: document.getElementById('panel-coming-soon'),
  };
  const summaryEl = document.getElementById('convert-summary');
  const resultsEl = document.getElementById('convert-results');
  const comingSoonTitle = document.getElementById('coming-soon-title');
  const comingSoonText = document.getElementById('coming-soon-text');

  tabs.forEach((tab) => {
    const isActive = tab.dataset.category === category;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const isComingSoon = category === 'audio' || category === 'video';
  panels.images.hidden = category !== 'images';
  panels.comingSoon.hidden = !isComingSoon;

  if (isComingSoon && COMING_SOON_COPY[category]) {
    comingSoonTitle.textContent = COMING_SOON_COPY[category].title;
    comingSoonText.textContent = COMING_SOON_COPY[category].text;
  }

  if (summaryEl) summaryEl.textContent = '';
  if (resultsEl) resultsEl.innerHTML = '';
}

function setupPathBrowse(inputId, buttonId) {
  const pathInput = document.getElementById(inputId);
  const browseBtn = document.getElementById(buttonId);
  browseBtn?.addEventListener('click', () => {
    openPathSelector((path) => {
      pathInput.value = path;
    }, { startPath: pathInput?.value || getLastPath() });
  });
}

export function setupConvertTool() {
  const form = document.getElementById('convert-form');
  if (!form) return;

  const defaultPath = getLastPath() || '';
  const pathInput = document.getElementById('convert-path');
  const qualityInput = document.getElementById('convert-quality');
  const qualityValue = document.getElementById('quality-value');
  const outputModeSelect = document.getElementById('convert-output-mode');
  const customPathRow = document.getElementById('custom-path-row');

  if (pathInput && !pathInput.value) pathInput.value = defaultPath;

  setupPathBrowse('convert-path', 'convert-browse');
  setupPathBrowse('convert-custom-path', 'convert-custom-browse');

  qualityInput?.addEventListener('input', (e) => {
    if (qualityValue) qualityValue.textContent = e.target.value;
  });

  outputModeSelect?.addEventListener('change', (e) => {
    if (customPathRow) customPathRow.hidden = e.target.value !== 'custom';
  });

  document.getElementById('convert-preview-btn')?.addEventListener('click', () => runImageConvert(true));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runImageConvert(false);
  });

  document.querySelectorAll('.convert-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchConvertTab(tab.dataset.category);
    });
  });
}
