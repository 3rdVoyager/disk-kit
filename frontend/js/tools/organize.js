import { apiFetch, getLastPath } from '../utils.js';
import { openPathSelector } from '../popups/folder-picker.js';

const CATEGORY_ORDER = ['Images', 'Videos', 'Audio', 'Documents', 'Archives', 'Code', 'Other'];

function renderOrganizeResults(container, operations) {
  if (!container) return;
  if (!operations?.length) {
    container.innerHTML = '<p class="tool-summary">No results found.</p>';
    return;
  }

  const groups = new Map();
  for (const operation of operations) {
    const category = operation.category || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(operation);
  }

  const categories = [...groups.keys()].sort((left, right) => {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);
    const leftRank = leftIndex === -1 ? CATEGORY_ORDER.length : leftIndex;
    const rightRank = rightIndex === -1 ? CATEGORY_ORDER.length : rightIndex;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.localeCompare(right);
  });

  const list = document.createElement('ul');
  list.className = 'tool-results-list';

  for (const category of categories) {
    const files = groups.get(category);
    const header = document.createElement('li');
    header.className = 'organize-category-header';
    header.textContent = `${category} (${files.length})`;
    list.appendChild(header);

    for (const operation of files) {
      const item = document.createElement('li');
      item.className = `tool-results-item ${operation.status || ''}`.trim();
      item.textContent = operation.name;
      list.appendChild(item);
    }
  }

  container.innerHTML = '';
  container.appendChild(list);
}

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
    renderOrganizeResults(resultsEl, result.operations);
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
