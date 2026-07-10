import { escapeHtml, apiFetch, formatBytes, getConfiguredFolderScanPath, setWorkingPath } from './utils.js';
import { openPathSelector } from './popups/folder-picker.js';

export const FOLDER_BAR_COLORS = ['blue', 'purple', 'green', 'orange', 'teal', 'yellow'];
export const DASHBOARD_FOLDER_LIMIT = 5;
export const DETAIL_FOLDER_LIMIT = 20;

let storageOverviewCache = null;

export function normalizeScanRoot(path) {
  return (path || '').replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
}

export async function fetchStorageOverview({ forceRefresh = false, folderLimit = DASHBOARD_FOLDER_LIMIT } = {}) {
  const folderScanRoot = normalizeScanRoot(await getConfiguredFolderScanPath());
  const canUseCache = !forceRefresh
    && storageOverviewCache
    && normalizeScanRoot(storageOverviewCache.scanRoot) === folderScanRoot
    && storageOverviewCache.folderLimit >= folderLimit;

  if (canUseCache) {
    return storageOverviewCache.data;
  }

  const data = await apiFetch(`/api/storage?folderLimit=${folderLimit}`);
  storageOverviewCache = {
    scanRoot: data.folderScanRoot || data.path || folderScanRoot,
    folderLimit,
    data,
    fetchedAt: Date.now(),
  };
  return data;
}

export function clearStorageOverviewCache() {
  storageOverviewCache = null;
}

export async function setFolderScanPath(path) {
  if (!path) return;
  const normalized = path.replace(/\\/g, '/');
  await apiFetch('/api/settings', {
    method: 'POST',
    body: { general: { folderScanPath: normalized } },
  });
  clearStorageOverviewCache();
}

export function setupFolderScanPathPicker(buttonId, onPathChanged) {
  const btn = document.getElementById(buttonId);
  if (!btn || btn.dataset.listenerAttached) return;
  btn.dataset.listenerAttached = 'true';

  btn.addEventListener('click', async () => {
    const startPath = await getConfiguredFolderScanPath();
    openPathSelector(async (selectedPath) => {
      await setFolderScanPath(selectedPath);
      if (onPathChanged) await onPathChanged({ forceRefresh: true });
    }, { startPath });
  });
}

function folderRowHtml(folder, index, { detailed = false } = {}) {
  const color = FOLDER_BAR_COLORS[index % FOLDER_BAR_COLORS.length];
  const partialNote = folder.partial ? '+' : '';
  const shareLabel = folder.usedPercent != null ? `${folder.usedPercent}%` : '--';

  if (detailed) {
    return `
      <tr class="storage-folder-row storage-folder-row-clickable" data-path="${escapeHtml(folder.path)}" title="Browse ${escapeHtml(folder.path)}">
        <td class="storage-folder-rank">${index + 1}</td>
        <td class="storage-folder-name">
          <span class="breakdown-icon ${color}"><span class="material-symbols-rounded">folder</span></span>
          <span>${escapeHtml(folder.name)}</span>
        </td>
        <td class="storage-folder-path">${escapeHtml(folder.path)}</td>
        <td class="storage-folder-size">${formatBytes(folder.size)}${partialNote}</td>
        <td class="storage-folder-share">${shareLabel}</td>
        <td class="storage-folder-bar">
          <div class="breakdown-bar">
            <div class="breakdown-fill ${color}" style="width: ${folder.barPercent || 0}%"></div>
          </div>
        </td>
      </tr>
    `;
  }

  return `
    <li class="breakdown-item breakdown-item-clickable" data-path="${escapeHtml(folder.path)}" title="Browse ${escapeHtml(folder.path)}">
      <span class="breakdown-icon ${color}"><span class="material-symbols-rounded">folder</span></span>
      <span class="breakdown-label">${escapeHtml(folder.name)}</span>
      <span class="breakdown-value">${formatBytes(folder.size)}${partialNote}</span>
      <div class="breakdown-bar">
        <div class="breakdown-fill ${color}" style="width: ${folder.barPercent || 0}%"></div>
      </div>
    </li>
  `;
}

export function renderFolderBreakdown(folders, {
  listId = 'storage-folder-breakdown',
  noteId = 'storage-folder-note',
  partial = false,
  limit = DASHBOARD_FOLDER_LIMIT,
  detailed = false,
  onNavigate,
} = {}) {
  const list = document.getElementById(listId);
  const noteEl = noteId ? document.getElementById(noteId) : null;
  if (!list) return;

  if (!folders || folders.length === 0) {
    if (detailed) {
      list.innerHTML = '<tr><td colspan="6" class="storage-folder-empty">No folder sizes available for this path.</td></tr>';
    } else {
      list.innerHTML = '<li class="breakdown-empty">No folder sizes available for this path.</li>';
    }
    if (noteEl) {
      noteEl.hidden = true;
      noteEl.textContent = '';
    }
    return;
  }

  const topFolders = folders.slice(0, limit);
  list.innerHTML = topFolders.map((folder, index) => folderRowHtml(folder, index, { detailed })).join('');

  if (noteEl) {
    if (partial) {
      noteEl.textContent = 'Some folders are still being measured — sizes marked with + may be higher.';
      noteEl.hidden = false;
    } else {
      noteEl.textContent = '';
      noteEl.hidden = true;
    }
  }

  const selector = detailed ? '.storage-folder-row-clickable' : '.breakdown-item-clickable';
  list.querySelectorAll(selector).forEach((item) => {
    item.addEventListener('click', async () => {
      const folderPath = item.getAttribute('data-path');
      if (!folderPath) return;
      if (onNavigate) {
        await onNavigate(folderPath);
        return;
      }
      await setWorkingPath(folderPath, { persistSettings: false });
    });
  });
}

export function applyDashboardStorage(data, { onNavigate } = {}) {
  const pctEl = document.getElementById('storage-percentage');
  const usedEl = document.getElementById('storage-used');
  const freeEl = document.getElementById('storage-free');
  const ringEl = document.getElementById('storage-ring-fill');
  const driveLabel = document.getElementById('storage-drive-label');

  if (!pctEl) return;

  pctEl.textContent = `${data.usedPercent}%`;
  usedEl.textContent = formatBytes(data.used);
  freeEl.textContent = formatBytes(data.free);
  if (ringEl) ringEl.setAttribute('stroke-dasharray', `${data.usedPercent}, 100`);
  if (driveLabel) {
    const scanRoot = data.folderScanRoot || data.path || data.drive;
    driveLabel.textContent = `${scanRoot} — largest folders`;
  }
  renderFolderBreakdown(data.folders || [], {
    partial: data.folderScanPartial,
    limit: DASHBOARD_FOLDER_LIMIT,
    onNavigate,
  });
}

export function applyDetailedStorage(data, { fetchedAt, onNavigate } = {}) {
  const pctEl = document.getElementById('detail-storage-percentage');
  const usedEl = document.getElementById('detail-storage-used');
  const freeEl = document.getElementById('detail-storage-free');
  const totalEl = document.getElementById('detail-storage-total');
  const ringEl = document.getElementById('detail-storage-ring-fill');
  const driveNameEl = document.getElementById('detail-storage-drive');
  const scanPathEl = document.getElementById('detail-storage-scan-path');
  const usedBarEl = document.getElementById('detail-storage-used-bar');
  const freePctEl = document.getElementById('detail-storage-free-percent');
  const updatedEl = document.getElementById('detail-storage-updated');

  if (!pctEl) return;

  const freePercent = data.total ? Math.max(0, 100 - data.usedPercent) : 0;

  pctEl.textContent = `${data.usedPercent}%`;
  if (usedEl) usedEl.textContent = formatBytes(data.used);
  if (freeEl) freeEl.textContent = formatBytes(data.free);
  if (totalEl) totalEl.textContent = formatBytes(data.total);
  if (freePctEl) freePctEl.textContent = `${freePercent}%`;
  if (ringEl) ringEl.setAttribute('stroke-dasharray', `${data.usedPercent}, 100`);
  if (driveNameEl) driveNameEl.textContent = data.drive || 'C:';
  if (scanPathEl) scanPathEl.textContent = data.folderScanRoot || data.path || '--';
  if (usedBarEl) usedBarEl.style.width = `${data.usedPercent}%`;
  if (updatedEl && fetchedAt) {
    updatedEl.textContent = `Last scanned ${new Date(fetchedAt).toLocaleString()}`;
  }

  renderFolderBreakdown(data.folders || [], {
    listId: 'detail-storage-folder-list',
    noteId: 'detail-storage-folder-note',
    partial: data.folderScanPartial,
    limit: DETAIL_FOLDER_LIMIT,
    detailed: true,
    onNavigate,
  });
}

export async function loadDashboardStorage({ forceRefresh = false, onNavigate } = {}) {
  const pctEl = document.getElementById('storage-percentage');
  const folderList = document.getElementById('storage-folder-breakdown');
  const folderNote = document.getElementById('storage-folder-note');
  const driveLabel = document.getElementById('storage-drive-label');
  const ringEl = document.getElementById('storage-ring-fill');

  if (!pctEl) return;

  if (forceRefresh || !storageOverviewCache) {
    if (folderList) folderList.innerHTML = '<li class="breakdown-empty">Scanning folders...</li>';
    if (folderNote) {
      folderNote.hidden = true;
      folderNote.textContent = '';
    }
  }

  try {
    const data = await fetchStorageOverview({ forceRefresh, folderLimit: DASHBOARD_FOLDER_LIMIT });
    applyDashboardStorage(data, { onNavigate });
  } catch (err) {
    pctEl.textContent = '--';
    const usedEl = document.getElementById('storage-used');
    const freeEl = document.getElementById('storage-free');
    if (usedEl) usedEl.textContent = 'Unavailable';
    if (freeEl) freeEl.textContent = '--';
    if (ringEl) ringEl.setAttribute('stroke-dasharray', '0, 100');
    if (driveLabel) driveLabel.textContent = err.message || 'Could not read drive stats';
    if (folderList) {
      folderList.innerHTML = `<li class="breakdown-empty">${escapeHtml(err.message || 'Could not load folder breakdown')}</li>`;
    }
  }
}

export async function loadDetailedStorage({ forceRefresh = false, onNavigate } = {}) {
  const pctEl = document.getElementById('detail-storage-percentage');
  const folderList = document.getElementById('detail-storage-folder-list');
  const folderNote = document.getElementById('detail-storage-folder-note');

  if (!pctEl) return;

  if (forceRefresh || !storageOverviewCache || storageOverviewCache.folderLimit < DETAIL_FOLDER_LIMIT) {
    if (folderList) {
      folderList.innerHTML = '<tr><td colspan="6" class="storage-folder-empty">Scanning folders...</td></tr>';
    }
    if (folderNote) {
      folderNote.hidden = true;
      folderNote.textContent = '';
    }
  }

  try {
    const data = await fetchStorageOverview({ forceRefresh, folderLimit: DETAIL_FOLDER_LIMIT });
    applyDetailedStorage(data, { fetchedAt: storageOverviewCache?.fetchedAt, onNavigate });
  } catch (err) {
    pctEl.textContent = '--';
    if (folderList) {
      folderList.innerHTML = `<tr><td colspan="6" class="storage-folder-empty">${escapeHtml(err.message || 'Could not load storage overview')}</td></tr>`;
    }
  }
}

export function setupStorageRefreshButton(buttonId, loadFn) {
  const btn = document.getElementById(buttonId);
  if (!btn || btn.dataset.listenerAttached) return;
  btn.dataset.listenerAttached = 'true';

  btn.addEventListener('click', async () => {
    const icon = btn.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.classList.add('spin');
      icon.textContent = 'sync';
    }
    btn.disabled = true;
    try {
      await loadFn({ forceRefresh: true });
    } finally {
      btn.disabled = false;
      if (icon) {
        icon.classList.remove('spin');
        icon.textContent = 'refresh';
      }
    }
  });
}
