// File Browser Module for Disk Kit
// Contains all file browser related functionality

// Import dependencies
import { escapeHtml, apiFetch, setLastPath, getLastPath, updateBreadcrumb, resolveBrowserPath, formatBytes } from '../utils.js';

// ============================================================
// File Browser State
// ============================================================

export let currentFilePath = '';
export let browserRoot = '';
export let protectionsDisabled = false;
export let isListView = true;
export let selectedFilePath = null;
export let selectedFileRestricted = false;
export let selectedFileType = null;

export const FOLDER_PICKER_LIST_ID = 'folder-picker-file-list';

/**
 * Normalize a path for comparison (forward slashes, no trailing slash).
 * @param {string} path
 * @returns {string}
 */
function normalizePathKey(path) {
  return (path || '').replace(/\\/g, '/').replace(/\/+$/, '');
}

/**
 * Get the parent directory path, or empty string if already at the top level.
 * @param {string} path
 * @returns {string}
 */
export function getParentDirectory(path) {
  if (!path) return '';
  const normalized = normalizePathKey(path);
  // Drive root like "C:" has no parent we can navigate to.
  if (/^[A-Za-z]:$/.test(normalized)) return '';
  return normalized.split('/').slice(0, -1).join('/');
}

/**
 * Whether a path is inside (or equal to) the allowed browser root.
 * @param {string} path
 * @param {string} root
 * @returns {boolean}
 */
function isWithinRoot(path, root) {
  const p = normalizePathKey(path).toLowerCase();
  const r = normalizePathKey(root).toLowerCase();
  if (!p || !r) return false;
  return p === r || p.startsWith(`${r}/`);
}

/**
 * Whether Back can navigate up from the given path.
 * Stops at the allowed sandbox root so we never request a denied parent.
 * @param {string} path
 * @returns {boolean}
 */
export function canNavigateUp(path) {
  const parent = getParentDirectory(path);
  if (!parent) return false;
  if (protectionsDisabled || !browserRoot) return true;
  return isWithinRoot(parent, browserRoot);
}

// ============================================================
// File Browser - Core Functions
// ============================================================

/**
 * Load and display files from the specified path
 * @param {string} path - The directory path to load
 * @param {string} containerId - The ID of the file list container
 */
export async function loadFileBrowser(path = '', containerId = 'file-list') {
  const fileList = document.getElementById(containerId);
  if (!fileList) return;

  const isFolderPicker = containerId === FOLDER_PICKER_LIST_ID;

  let targetPath = path;
  if (targetPath === undefined || targetPath === null || targetPath === '') {
    targetPath = await resolveBrowserPath(isFolderPicker ? getLastPath() : '');
  }

  if (!isFolderPicker) {
    currentFilePath = targetPath;
    if (targetPath) {
      setLastPath(targetPath);
      updateBreadcrumb(targetPath);
    }
  }
  // Update refresh button to show loading state
  const refreshBtn = document.querySelector('.btn-tool[title="Refresh"]');
  if (refreshBtn) {
    const icon = refreshBtn.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.classList.add('spin');
      icon.textContent = 'sync';
    }
  }

  try {
    const apiPath = isFolderPicker ? targetPath : currentFilePath;
    const response = await apiFetch(`/api/files?path=${encodeURIComponent(apiPath)}`);

    protectionsDisabled = Boolean(response.protectionsDisabled);
    if (protectionsDisabled) {
      browserRoot = '';
    } else if (response.root) {
      browserRoot = normalizePathKey(response.root);
    }

    if (!isFolderPicker && response.path) {
      currentFilePath = response.path;
      setLastPath(response.path);
      updateBreadcrumb(response.path);
    }

    if (isFolderPicker) {
      const parts = response.path.split('/').filter(p => p);
      const breadcrumb = document.querySelector('.folder-picker-breadcrumb');
      if (breadcrumb) {
        breadcrumb.textContent = parts.length ? `This PC > ${parts.join(' > ')}` : 'This PC';
      }
      const pathDisplay = document.getElementById('folder-picker-current-path');
      if (pathDisplay) pathDisplay.textContent = response.path;
    }

    // Render file list
    fileList.innerHTML = response.items.map(item => {
      const date = new Date(item.modified).toLocaleString();
      const size = item.type === 'directory' ? '--' : formatBytes(item.size);
      const typeLabel = item.type === 'directory' ? 'File Folder' : 'File';
      const icon = item.type === 'directory' ? 'folder' : getFileIcon(item.name);
      
      return `
        <li class="file-item${item.accessRestricted ? ' restricted' : ''}" data-type="${item.type}" data-path="${escapeHtml(item.fullPath)}" data-name="${escapeHtml(item.name)}" data-size="${item.size || 0}" data-modified="${item.modified || ''}" data-created="${item.created || ''}" data-restricted="${item.accessRestricted ? 'true' : 'false'}">
          <span class="file-icon material-symbols-rounded">${icon}</span>
          <span class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="file-date">${date}</span>
          <span class="file-type">${typeLabel}</span>
          <span class="file-size">${size}</span>
        </li>
      `;
    }).join('');

    // Add click handlers
    fileList.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        if (item.dataset.restricted === 'true') {
          alert('This folder cannot be opened. It links to a restricted system location.');
          return;
        }
        if (item.dataset.type === 'directory') {
          loadFileBrowser(item.dataset.path, containerId);
        }
      });

      item.addEventListener('click', () => {
        selectFileItem(item, containerId);
        if (!isFolderPicker) {
          showFileDetails(item.dataset);
        } else {
          const pathDisplay = document.getElementById('folder-picker-current-path');
          if (pathDisplay) pathDisplay.textContent = item.dataset.path;
        }
      });
    });

  } catch (err) {
    fileList.innerHTML = `<li class="file-item"><span class="file-name error">Error loading directory: ${escapeHtml(err.message)}</span></li>`;
    console.error('File browser error:', err);
  } finally {
        // Update refresh button to show normal state after loading completes
    const refreshBtn = document.querySelector('.btn-tool[title="Refresh"]');
    if (refreshBtn) {
      const icon = refreshBtn.querySelector('.material-symbols-rounded');
      if (icon) {
        setTimeout(() => {
          icon.classList.remove('spin');
          icon.textContent = 'refresh';
        }, 250);
      }
    }
    if (isFolderPicker) {
      const pathDisplay = document.getElementById('folder-picker-current-path');
      const path = pathDisplay?.textContent || '';
      const backBtn = document.getElementById('folder-picker-back');
      if (backBtn) backBtn.classList.toggle('disabled', !canNavigateUp(path));
    } else {
      updateNavigationButtons();
    }
  }
}

// ============================================================
// File Browser - Navigation
// ============================================================

/**
 * Go up to the parent directory.
 * @param {string} containerId - The file list container ID
 */
export async function goBack(containerId = 'file-list') {
  const isFolderPicker = containerId === FOLDER_PICKER_LIST_ID;
  const current = isFolderPicker
    ? (document.getElementById('folder-picker-current-path')?.textContent || '')
    : currentFilePath;

  if (!canNavigateUp(current)) return;

  const parent = getParentDirectory(current);
  await loadFileBrowser(parent, containerId);
}

/**
 * Select a file item in the list
 * @param {HTMLElement} item - The file item element
 * @param {string} containerId - The container ID
 */
export function selectFileItem(item, containerId = 'file-list') {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
  item.classList.add('selected');
  
  if (containerId === 'file-list') {
    selectedFilePath = item.dataset.path;
    selectedFileRestricted = item.dataset.restricted === 'true';
    selectedFileType = item.dataset.type;
  }
}

/**
 * Move the currently selected file or folder to the Recycle Bin
 */
export async function deleteSelectedFile() {
  if (!selectedFilePath) return;
  if (selectedFileRestricted) {
    alert('This item cannot be moved to the Recycle Bin. It is outside your allowed folder or links to a restricted system location.');
    return;
  }
  if (!confirm(`Move this item to the Recycle Bin?\n\n${selectedFilePath}`)) return;
  try {
    await apiFetch('/api/files/delete', {
      method: 'POST',
      body: { path: selectedFilePath }
    });
    selectedFilePath = null;
    selectedFileRestricted = false;
    selectedFileType = null;
    loadFileBrowser(currentFilePath);
  } catch (err) {
    console.error('Recycle Bin move failed:', err);
    alert(`Could not move to Recycle Bin: ${err.message}`);
  }
}

/**
 * Filter file list based on search input
 */
export function filterFileList() {
  const searchInput = document.querySelector('.browser-search-input');
  const fileList = document.getElementById('file-list');
  if (!searchInput || !fileList) return;
  
  const query = searchInput.value.trim().toLowerCase();
  const items = fileList.querySelectorAll('.file-item');
  
  items.forEach(item => {
    const name = item.querySelector('.file-name')?.textContent?.trim().toLowerCase() || '';
    item.classList.toggle('filtered-out', Boolean(query && !name.includes(query)));
  });
}

/**
 * Toggle between list and grid view
 */
export function toggleFileView() {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;
  isListView = !isListView;
  const viewBtn = document.querySelector('.btn-icon[title="View"]');
  if (viewBtn) {
    const icon = viewBtn.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.textContent = isListView ? 'grid_view' : 'view_list';
    }
  }
  const container = fileList.closest('.file-browser-card');
  if (container) {
    container.classList.toggle('grid-view', !isListView);
  }
  fileList.classList.toggle('grid-view', !isListView);
  filterFileList();
}

/**
 * Update navigation button states
 */
export function updateNavigationButtons() {
  const backBtn = document.querySelector('.btn-tool[title="Back"]');
  if (backBtn) backBtn.classList.toggle('disabled', !canNavigateUp(currentFilePath));

  const defaultPathBtn = document.getElementById('set-default-path-btn');
  if (defaultPathBtn) defaultPathBtn.classList.toggle('disabled', !currentFilePath);
}

/**
 * Save the current browse location as the app default path.
 */
export async function setCurrentPathAsDefault() {
  if (!currentFilePath) return;

  const confirmed = window.confirm(
    `Set this folder as your default path?\n\n${currentFilePath}\n\nTools will use this location when no specific path is entered.`
  );
  if (!confirmed) return;

  const defaultPathBtn = document.getElementById('set-default-path-btn');
  const icon = defaultPathBtn?.querySelector('.material-symbols-rounded');

  try {
    await apiFetch('/api/settings', {
      method: 'POST',
      body: { general: { defaultPath: currentFilePath } },
    });
    setLastPath(currentFilePath);

    if (defaultPathBtn && icon) {
      const originalTitle = defaultPathBtn.title;
      defaultPathBtn.title = 'Default path set';
      icon.textContent = 'check';
      setTimeout(() => {
        defaultPathBtn.title = originalTitle;
        icon.textContent = 'home_pin';
      }, 1500);
    }
  } catch (err) {
    console.error('Failed to set default path:', err);
    alert(`Could not set default path: ${err.message}`);
  }
}

// ============================================================
// File Browser - Event Listeners
// ============================================================

/**
 * Set up file browser button event listeners
 */
export function setupFileBrowserButtonListeners() {
  if (document.getElementById('file-list')?.dataset.listenersAttached) return;
  const fileList = document.getElementById('file-list');
  if (fileList) fileList.dataset.listenersAttached = 'true';
  const refreshBtn = document.querySelector(".btn-tool[title='Refresh']");
  const deleteBtn = document.querySelector('.btn-tool[title="Move to Recycle Bin"]');
  const defaultPathBtn = document.getElementById('set-default-path-btn');
  const viewBtn = document.querySelector('.btn-icon[title="View"]');
  const searchInput = document.querySelector('.browser-search-input');
  const openBtn = document.querySelector('.details-actions .btn-action[data-action="open"]');
  const copyBtn = document.querySelector('.details-actions .btn-action[data-action="copy-path"]');

  if (refreshBtn) refreshBtn.addEventListener('click', () => loadFileBrowser(currentFilePath));
  if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedFile);
  if (defaultPathBtn) defaultPathBtn.addEventListener('click', setCurrentPathAsDefault);
  if (viewBtn) viewBtn.addEventListener('click', toggleFileView);
  if (searchInput) searchInput.addEventListener('input', filterFileList);

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      if (!selectedFilePath || selectedFileType !== 'file' || selectedFileRestricted) return;
      try {
        await apiFetch('/api/files/open', { method: 'POST', body: { path: selectedFilePath } });
      } catch (err) {
        alert(`Could not open file: ${err.message}`);
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!selectedFilePath) return;
      try {
        await navigator.clipboard.writeText(selectedFilePath);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = original; }, 1500);
      } catch (err) {
        alert(`Could not copy path: ${err.message}`);
      }
    });
  }

  updateDetailActionStates();
  updateNavigationButtons();
}

function updateDetailActionStates() {
  const openBtn = document.querySelector('.details-actions .btn-action[data-action="open"]');
  const copyBtn = document.querySelector('.details-actions .btn-action[data-action="copy-path"]');
  const hasSelection = Boolean(selectedFilePath);
  const canOpen = hasSelection && selectedFileType === 'file' && !selectedFileRestricted;
  if (openBtn) openBtn.disabled = !canOpen;
  if (copyBtn) copyBtn.disabled = !hasSelection;
}

// ============================================================
// File Browser - Utility Functions
// ============================================================

/**
 * Get the appropriate icon for a file based on its extension
 * @param {string} filename - The filename
 * @returns {string} - Material Symbols icon name
 */
export function getFileIcon(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const icons = {
    'txt': 'description',
    'md': 'description',
    'pdf': 'picture_as_pdf',
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
    'mp3': 'music_note', 'wav': 'music_note', 'flac': 'music_note', 'ogg': 'music_note',
    'mp4': 'movie', 'avi': 'movie', 'mkv': 'movie', 'mov': 'movie',
    'zip': 'inventory_2', 'rar': 'inventory_2', '7z': 'inventory_2',
    'doc': 'description', 'docx': 'description',
    'xls': 'grid_view', 'xlsx': 'grid_view',
    'ppt': 'slideshow', 'pptx': 'slideshow',
    'exe': 'terminal',
    'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code',
    'json': 'data_object',
  };
  return icons[extension] || 'insert_drive_file';
}

/**
 * Display file details in the details panel
 * @param {Object} data - File data object
 */
export function showFileDetails(data) {
  const detailsPanel = document.getElementById('details-panel');
  const filenameEl = document.getElementById('detail-filename');
  const filetypeEl = document.getElementById('detail-filetype');
  const locationEl = document.getElementById('detail-location');
  const sizeEl = document.getElementById('detail-size');
  const modifiedEl = document.getElementById('detail-modified');
  const createdEl = document.getElementById('detail-created');

  if (!filenameEl) return;

  if (detailsPanel) {
    detailsPanel.classList.remove('is-empty');
  }

  filenameEl.textContent = data.name || 'Select a file';
  
  if (filetypeEl) {
    filetypeEl.textContent = data.type === 'directory' ? 'Folder' : 
      (data.name ? data.name.split('.').pop().toUpperCase() + ' File' : '--');
  }
  
  if (locationEl) {
    locationEl.textContent = data.path || '--';
  }
  
  if (sizeEl) {
    if (data.type === 'directory') {
      sizeEl.textContent = '--';
    } else if (data.size) {
      sizeEl.textContent = formatBytes(parseInt(data.size));
    } else {
      sizeEl.textContent = '--';
    }
  }
  
  if (modifiedEl && data.modified) {
    modifiedEl.textContent = new Date(parseInt(data.modified)).toLocaleString();
  } else if (modifiedEl) {
    modifiedEl.textContent = '--';
  }
  
  if (createdEl && data.created) {
    createdEl.textContent = new Date(parseInt(data.created)).toLocaleString();
  } else if (createdEl) {
    createdEl.textContent = '--';
  }

  const hintEl = document.getElementById('detail-hint');
  if (hintEl) hintEl.style.display = 'none';

  updateDetailActionStates();
}
