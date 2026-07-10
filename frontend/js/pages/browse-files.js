// File Browser Module for Disk Kit
// Contains all file browser related functionality

// Import dependencies
import { escapeHtml, apiFetch, setLastPath, getLastPath } from '../utils.js';

// ============================================================
// File Browser State
// ============================================================

export let currentFilePath = '';
export let isListView = true;
export let selectedFilePath = null;
export let selectedFileRestricted = false;

// File browser history for navigation
export const fileBrowserHistory = [];
export let currentHistoryIndex = -1;
export let suppressHistoryRecord = false;

// Selection API state
let pathSelectionCallback = null;

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

  const isSelector = containerId === 'selector-file-list';

  // Track history for the main browser only.
  // Keep root ("") out of history so Back can return to root as a special case.
  if (!isSelector && !suppressHistoryRecord) {
    const hasExplicitPath = path !== undefined && path !== null;
    const shouldTrack = hasExplicitPath && path !== '' && path !== currentFilePath;
    if (shouldTrack) {
      if (currentHistoryIndex < fileBrowserHistory.length - 1) {
        fileBrowserHistory.splice(currentHistoryIndex + 1);
      }
      fileBrowserHistory.push(path);
      currentHistoryIndex = fileBrowserHistory.length - 1;
    }
  }
  suppressHistoryRecord = false;

  // Update current path (only for main browser)
  if (!isSelector && path !== undefined && path !== null) {
    currentFilePath = path;
    setLastPath(path);
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
    const targetPath = isSelector ? (path || getLastPath() || '') : currentFilePath;
    
    // Fetch files from API
    const response = await apiFetch(`/api/files?path=${encodeURIComponent(targetPath)}`);
    
    // Update breadcrumb
    const breadcrumbSelector = isSelector ? '.selector-breadcrumb' : '.breadcrumb-path';
    const breadcrumb = document.querySelector(breadcrumbSelector);
    if (breadcrumb) {
      const parts = response.path.split('/').filter(p => p);
      breadcrumb.textContent = `This PC > ${parts.join(' > ')}`;
    }

    if (isSelector) {
      const pathDisplay = document.getElementById('selector-current-path');
      if (pathDisplay) pathDisplay.textContent = response.path;
    }

    // Render file list
    fileList.innerHTML = response.items.map(item => {
      const date = new Date(item.modified).toLocaleString();
      const size = item.type === 'directory' ? '--' : formatFileSize(item.size);
      const typeLabel = item.type === 'directory' ? 'File Folder' : 'File';
      const icon = item.type === 'directory' ? 'folder' : getFileIcon(item.name);
      
      return `
        <li class="file-item${item.accessRestricted ? ' restricted' : ''}" data-type="${item.type}" data-path="${escapeHtml(item.fullPath)}" data-name="${escapeHtml(item.name)}" data-restricted="${item.accessRestricted ? 'true' : 'false'}">
          <span class="file-icon material-symbols-rounded">${icon}</span>
          <span class="file-name">${escapeHtml(item.name)}</span>
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
        if (!isSelector) {
          showFileDetails(item.dataset);
        } else {
          const pathDisplay = document.getElementById('selector-current-path');
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
    if (!isSelector) {
      updateNavigationButtons();
    }
  }
}

// ============================================================
// File Browser - Navigation
// ============================================================

/**
 * Go back to the previous directory in history
 */
export function goBack() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    suppressHistoryRecord = true;
    loadFileBrowser(fileBrowserHistory[currentHistoryIndex]);
  } else if (currentHistoryIndex === 0) {
    suppressHistoryRecord = true;
    currentHistoryIndex--;
    loadFileBrowser('');
  }
}

/**
 * Go forward to the next directory in history
 */
export function goForward() {
  if (currentHistoryIndex < fileBrowserHistory.length - 1) {
    currentHistoryIndex++;
    suppressHistoryRecord = true;
    loadFileBrowser(fileBrowserHistory[currentHistoryIndex]);
  }
}

/**
 * Set up file browser navigation with history tracking
 */
export function setupFileBrowserNavigation() {
  // History tracking now happens directly in loadFileBrowser().
  updateNavigationButtons();
}

// ============================================================
// File Browser - UI Functions
// ============================================================

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
    if (!query || name.includes(query)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
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
}

/**
 * Update navigation button states (back/forward)
 */
export function updateNavigationButtons() {
  const backBtn = document.querySelector('.btn-tool[title="Back"]');
  const forwardBtn = document.querySelector('.btn-tool[title="Forward"]');
  if (backBtn) backBtn.classList.toggle('disabled', !(currentHistoryIndex >= 0));
  if (forwardBtn) forwardBtn.classList.toggle('disabled', !(currentHistoryIndex < fileBrowserHistory.length - 1));
}

// ============================================================
// File Browser - Selection API
// ============================================================

/**
 * Open the path selector dialog
 * @param {Function} callback - Function called with selected path
 */
export function openPathSelector(callback) {
  const dialog = document.getElementById('browser-selector-dialog');
  if (!dialog) return;

  pathSelectionCallback = callback;
  dialog.style.display = 'flex';
  requestAnimationFrame(() => dialog.classList.add('active'));

  // Initialize selector browser
  loadFileBrowser(getLastPath(), 'selector-file-list');

  // Setup selector-specific listeners if not already done
  setupSelectorListeners();
}

function setupSelectorListeners() {
  const closeBtn = document.getElementById('browser-selector-close');
  const cancelBtn = document.getElementById('selector-cancel');
  const confirmBtn = document.getElementById('selector-confirm');
  const backBtn = document.getElementById('selector-back');
  const forwardBtn = document.getElementById('selector-forward');
  
  const close = () => {
    const dialog = document.getElementById('browser-selector-dialog');
    dialog.classList.remove('active');
    setTimeout(() => dialog.style.display = 'none', 300);
  };

  if (closeBtn && !closeBtn.dataset.listener) {
    closeBtn.addEventListener('click', close);
    closeBtn.dataset.listener = 'true';
  }
  if (cancelBtn && !cancelBtn.dataset.listener) {
    cancelBtn.addEventListener('click', close);
    cancelBtn.dataset.listener = 'true';
  }
  if (confirmBtn && !confirmBtn.dataset.listener) {
    confirmBtn.addEventListener('click', () => {
      const pathDisplay = document.getElementById('selector-current-path');
      const selectedPath = pathDisplay ? pathDisplay.textContent : '';
      if (selectedPath && pathSelectionCallback) {
        pathSelectionCallback(selectedPath);
      }
      close();
    });
    confirmBtn.dataset.listener = 'true';
  }
  if (backBtn && !backBtn.dataset.listener) {
    backBtn.addEventListener('click', () => {
      // For now, selector doesn't have its own history, it just goes up one level
      const pathDisplay = document.getElementById('selector-current-path');
      const current = pathDisplay ? pathDisplay.textContent : '';
      if (current) {
        const parent = current.split('/').slice(0, -1).join('/') || '';
        loadFileBrowser(parent, 'selector-file-list');
      }
    });
    backBtn.dataset.listener = 'true';
  }
}

// ============================================================
// File Browser - Event Listeners
// ============================================================

/**
 * Set up file browser button event listeners
 */
export function setupFileBrowserButtonListeners() {
  const refreshBtn = document.querySelector(".btn-tool[title='Refresh']");
  const deleteBtn = document.querySelector('.btn-tool[title="Move to Recycle Bin"]');
  const viewBtn = document.querySelector('.btn-icon[title="View"]');
  const searchInput = document.querySelector('.browser-search-input');
  
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    loadFileBrowser(currentFilePath);
  });
  if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedFile);
  if (viewBtn) viewBtn.addEventListener('click', toggleFileView);
  if (searchInput) {
    searchInput.addEventListener('input', filterFileList);
  }
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
  const filenameEl = document.getElementById('detail-filename');
  const filetypeEl = document.getElementById('detail-filetype');
  const locationEl = document.getElementById('detail-location');
  const sizeEl = document.getElementById('detail-size');
  const modifiedEl = document.getElementById('detail-modified');
  const createdEl = document.getElementById('detail-created');

  if (!filenameEl) return;

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
      sizeEl.textContent = formatFileSize(parseInt(data.size));
    } else {
      sizeEl.textContent = '--';
    }
  }
  
  if (modifiedEl && data.modified) {
    modifiedEl.textContent = new Date(parseInt(data.modified)).toLocaleString();
  }
  
  if (createdEl && data.created) {
    createdEl.textContent = new Date(parseInt(data.created)).toLocaleString();
  }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0 || bytes === undefined) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
