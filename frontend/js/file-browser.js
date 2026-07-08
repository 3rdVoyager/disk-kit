// File Browser Module for Disk Kit
// Contains all file browser related functionality

// Import dependencies
import { escapeHtml } from './utils.js';

// ============================================================
// File Browser State
// ============================================================

export let currentFilePath = '';
export let isListView = true;
export let selectedFilePath = null;

// File browser history for navigation
export const fileBrowserHistory = [];
export let currentHistoryIndex = -1;
export let suppressHistoryRecord = false;

// ============================================================
// File Browser - Core Functions
// ============================================================

/**
 * Load and display files from the specified path
 * @param {string} path - The directory path to load
 */
export async function loadFileBrowser(path = '') {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;

  // Update current path
  if (path !== undefined && path !== null) {
    currentFilePath = path;
  }

  try {
    // Fetch files from API
    const response = await apiFetch(`/api/files?path=${encodeURIComponent(currentFilePath)}`);
    
    // Update breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb-path');
    if (breadcrumb) {
      const parts = response.path.split('/').filter(p => p);
      breadcrumb.textContent = `This PC > ${parts.join(' > ')}`;
    }

    // Render file list
    fileList.innerHTML = response.items.map(item => {
      const date = new Date(item.modified).toLocaleString();
      const size = item.type === 'directory' ? '--' : formatFileSize(item.size);
      const typeLabel = item.type === 'directory' ? 'File Folder' : 'File';
      const icon = item.type === 'directory' ? 'folder' : getFileIcon(item.name);
      
      return `
        <li class="file-item" data-type="${item.type}" data-path="${escapeHtml(item.fullPath)}" data-name="${escapeHtml(item.name)}">
          <span class="file-icon material-symbols-rounded">${icon}</span>
          <span class="file-name">${escapeHtml(item.name)}</span>
          <span class="file-date">${date}</span>
          <span class="file-type">${typeLabel}</span>
          <span class="file-size">${size}</span>
        </li>
      `;
    }).join('');

    // Add click handlers for directories
    fileList.querySelectorAll('.file-item[data-type="directory"]').forEach(item => {
      item.addEventListener('dblclick', () => {
        loadFileBrowser(item.dataset.path);
      });
      // Also allow single click for selection
      item.addEventListener('click', () => {
        // Show details for selected directory
        selectFileItem(item);
        showFileDetails(item.dataset);
      });
    });

    // Add click handlers for files
    fileList.querySelectorAll('.file-item[data-type="file"]').forEach(item => {
      item.addEventListener('click', () => {
        selectFileItem(item);
        showFileDetails(item.dataset);
      });
    });

  } catch (err) {
    fileList.innerHTML = `<li class="file-item"><span class="file-name error">Error loading directory: ${escapeHtml(err.message)}</span></li>`;
    console.error('File browser error:', err);
  }
}

// ============================================================
// File Browser - Navigation
// ============================================================

/**
 * Go back to the previous directory in history
 */
export function goBack() {
  // Move back one step in history
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    suppressHistoryRecord = true;
    loadFileBrowser(fileBrowserHistory[currentHistoryIndex]);
  } else if (currentHistoryIndex === 0) {
    // Going back to the initial root (history becomes empty)
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
  const originalLoadFileBrowser = loadFileBrowser;
  loadFileBrowser = async function(path) {
    if (!suppressHistoryRecord) {
      // This is a user-initiated navigation (e.g., double-clicking a directory)
      // Truncate any forward history
      if (currentHistoryIndex < fileBrowserHistory.length - 1) {
        fileBrowserHistory.splice(currentHistoryIndex + 1);
      }
      // Record the path we're navigating TO when it's different from current
      if (path !== currentFilePath && path !== undefined && path !== null) {
        fileBrowserHistory.push(path);
        currentHistoryIndex = fileBrowserHistory.length - 1;
      }
    }
    suppressHistoryRecord = false;
    await originalLoadFileBrowser(path);
    // Update navigation button states after load
    updateNavigationButtons();
  };
}

// ============================================================
// File Browser - UI Functions
// ============================================================

/**
 * Select a file item in the list
 * @param {HTMLElement} item - The file item element
 */
export function selectFileItem(item) {
  // Remove previous selection
  document.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
  // Mark this item as selected
  item.classList.add('selected');
  // Track the file path for delete
  selectedFilePath = item.dataset.path;
}

/**
 * Delete the currently selected file
 */
export async function deleteSelectedFile() {
  if (!selectedFilePath) return;
  if (!confirm(`Are you sure you want to delete "${selectedFilePath.split('/').pop()}"?`)) return;
  try {
    await apiFetch('/api/files/delete', {
      method: 'POST',
      body: { path: selectedFilePath }
    });
    selectedFilePath = null;
    loadFileBrowser(currentFilePath);
  } catch (err) {
    console.error('Delete failed:', err);
    alert(`Delete failed: ${err.message}`);
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
  // Toggle grid/list class on file list and container
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
// File Browser - Event Listeners
// ============================================================

/**
 * Set up file browser button event listeners
 */
export function setupFileBrowserButtonListeners() {
  const deleteBtn = document.querySelector('.btn-tool[title="Delete"]');
  const viewBtn = document.querySelector('.btn-icon[title="View"]');
  const searchInput = document.querySelector('.browser-search-input');
  
  if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedFile);
  if (viewBtn) viewBtn.addEventListener('click', toggleFileView);
  if (searchInput) {
    searchInput.addEventListener('input', filterFileList);
  }
}

/**
 * Set up global navigation listeners including file browser navigation
 */
export function setupGlobalNavigation() {
  document.addEventListener('click', (e) => {
    // Back/Forward buttons
    if (e.target.closest('.btn-tool[title="Back"]')) {
      e.preventDefault();
      goBack();
      return;
    }
    if (e.target.closest('.btn-tool[title="Forward"]')) {
      e.preventDefault();
      goForward();
      return;
    }
    // Hash anchor links
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      e.preventDefault();
      const toolName = link.getAttribute('href').substring(1);
      if (!toolName) return;
      if (typeof navigateTo === 'function') {
        navigateTo(toolName);
      }
      return;
    }
    
    // Dashboard quick tool cards
    const card = e.target.closest('.quick-tool-item');
    if (card) {
      const toolName = card.getAttribute('data-tool') || 'alltools';
      if (typeof navigateTo === 'function') {
        navigateTo(toolName);
      }
      return;
    }
    
    // All Tools page tool cards (exclude checkbox/label clicks)
    const toolCard = e.target.closest('.tool-card');
    if (toolCard && !e.target.closest('.tool-card-checkbox, input, label')) {
      const toolName = toolCard.getAttribute('data-tool');
      if (toolName && typeof navigateTo === 'function') {
        navigateTo(toolName);
      }
      return;
    }
  });
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
