// Import icon configuration
import { ICONS, getIconHTML } from './config/icons.js';
if (!ICONS || !getIconHTML) {
  console.warn('Icons module failed to load; continuing without icons');
}

// DOM elements
const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
const quickToolsList = document.getElementById('quick-tools');
let originalHomeHTML = '';

// ============================================================
// Quick Tools state (persisted via API to backend)
// ============================================================
const DEFAULT_QUICK_TOOLS = ['rename', 'convert', 'compress', 'cleanup'];
let cachedQuickTools = null;

async function getQuickTools() {
  try {
    if (cachedQuickTools !== null) {
      return cachedQuickTools;
    }
    const response = await apiFetch('/api/quick-tools');
    cachedQuickTools = response.quickTools || DEFAULT_QUICK_TOOLS;
    return cachedQuickTools;
  } catch (err) {
    console.error('Failed to load quick tools:', err);
    return DEFAULT_QUICK_TOOLS;
  }
}

async function saveQuickTools(tools) {
  try {
    await apiFetch('/api/quick-tools', {
      method: 'POST',
      body: { quickTools: tools }
    });
    cachedQuickTools = tools;
  } catch (err) {
    console.error('Failed to save quick tools:', err);
  }
}

// ============================================================
// Central tool metadata — single source of truth for all tools
// ============================================================
const TOOL_META = {
  'rename':         { icon: 'edit',              label: 'Batch Rename',       description: 'Rename multiple files at once' },
  'move':           { icon: 'drive_file_move',   label: 'Move Files',         description: 'Transfer files between folders' },
  'copy':           { icon: 'content_copy',      label: 'Copy Files',         description: 'Duplicate files to another location' },
  'delete':         { icon: 'delete',            label: 'Delete Files',       description: 'Permanently remove selected files' },
  'split':          { icon: 'call_split',        label: 'Split Files',        description: 'Divide large files into smaller parts' },
  'merge':          { icon: 'call_merge',        label: 'Merge Files',        description: 'Combine multiple files into one' },
  'convert':        { icon: 'transform',         label: 'Format Converter',   description: 'Convert between file formats' },
  'image-convert':  { icon: 'image',             label: 'Image Converter',    description: 'Convert image formats (JPG, PNG, WebP)' },
  'video-convert':  { icon: 'movie',             label: 'Video Converter',    description: 'Convert video formats and codecs' },
  'audio-convert':  { icon: 'music_note',        label: 'Audio Converter',    description: 'Convert audio formats (MP3, FLAC, WAV)' },
  'doc-convert':    { icon: 'description',       label: 'Document Converter', description: 'Convert documents (PDF, DOCX, TXT)' },
  'compress':       { icon: 'inventory_2',       label: 'Compress Files',     description: 'Create ZIP, RAR, or 7z archives' },
  'extract':        { icon: 'folder_open',       label: 'Extract Archives',   description: 'Unzip and extract compressed files' },
  'iso-mount':      { icon: 'album',             label: 'Mount ISO',          description: 'Mount disk image files' },
  'cleanup':        { icon: 'cleaning_services', label: 'System Cleanup',     description: 'Remove temporary and cache files' },
  'ai-rename':      { icon: 'auto_awesome',      label: 'AI Rename',          description: 'Smart rename with AI suggestions' },
  'ai-cleanup':     { icon: 'auto_awesome',      label: 'AI Cleanup',         description: 'AI-powered system cleanup' },
  'duplicates':     { icon: 'find_replace',       label: 'Duplicate Finder',   description: 'Find and remove duplicate files' },
  'empty-folders':  { icon: 'delete_sweep',       label: 'Empty Folders',      description: 'Remove empty directories' },
  'large-files':    { icon: 'storage',           label: 'Large Files',        description: 'Find files taking up space' },
  'old-files':      { icon: 'schedule',          label: 'Old Files',          description: 'Identify files not accessed recently' },
  'temp-files':     { icon: 'thermostat',        label: 'Temp Files',         description: 'Clean up temporary system files' },
  'organize':       { icon: 'auto_fix_high',     label: 'Smart Organize',     description: 'Auto-sort files into folders' },
  'sort':           { icon: 'sort',              label: 'Sort Files',         description: 'Sort by name, date, size, type' },
  'deduplicate':    { icon: 'filter_list',       label: 'Deduplicate',        description: 'Remove exact file duplicates' },
  'tag':            { icon: 'label',             label: 'Tag Files',          description: 'Add tags and labels to files' },
  'resize':         { icon: 'photo_size_select_large', label: 'Resize Images', description: 'Batch resize and crop images' },
  'watermark':      { icon: 'water_drop',        label: 'Watermark',          description: 'Add watermarks to images' },
  'thumbnail':      { icon: 'grid_on',           label: 'Thumbnail Generator',description: 'Generate image thumbnails' },
  'metadata':       { icon: 'info',              label: 'Metadata Viewer',    description: 'View and edit EXIF and file metadata' },
  'checksum':       { icon: 'fingerprint',       label: 'Checksum',           description: 'Calculate MD5, SHA-256 hashes' },
  'encrypt':        { icon: 'lock',              label: 'Encrypt Files',      description: 'Secure files with encryption' },
  'sync':           { icon: 'sync',              label: 'File Sync',          description: 'Sync files between directories' },
  'secure-delete':  { icon: 'verified',          label: 'Secure Delete',      description: 'Permanently erase with overwrite' },
  'history':        { icon: 'history',           label: 'History',            description: 'View operation history' },
  'settings':       { icon: 'settings',          label: 'Settings',           description: 'Configure application settings' },
  'trash':          { icon: 'delete',            label: 'Trash',              description: 'View deleted files' },
  'storage-details':{ icon: 'storage',           label: 'Storage Details',    description: 'View detailed storage information' },
  'browse-files':   { icon: 'folder',            label: 'Browse Files',       description: 'Browse and navigate files' },
  'alltools':       { icon: 'apps',              label: 'All Tools',          description: 'Explore all available tools' },
  'home':           { icon: 'home',              label: 'Dashboard',          description: 'Return to the dashboard' }
};

// Color mapping for dashboard quick tool cards
const DASHBOARD_CARD_COLORS = {
  rename: 'blue', move: 'blue', copy: 'blue', delete: 'red', split: 'purple', merge: 'teal',
  convert: 'purple', 'image-convert': 'orange', 'video-convert': 'purple', 'audio-convert': 'green', 'doc-convert': 'yellow',
  compress: 'orange', extract: 'teal', 'iso-mount': 'gray',
  cleanup: 'green', 'ai-rename': 'purple', 'ai-cleanup': 'purple', duplicates: 'green', 'empty-folders': 'green', 'large-files': 'orange', 'old-files': 'yellow', 'temp-files': 'gray',
  organize: 'purple', sort: 'blue', deduplicate: 'teal', tag: 'purple',
  resize: 'blue', watermark: 'purple', thumbnail: 'green', metadata: 'gray',
  checksum: 'yellow', encrypt: 'teal', sync: 'blue', 'secure-delete': 'red',
  history: 'gray', settings: 'gray', trash: 'red', 'storage-details': 'orange',
  alltools: 'gray'
};

// ============================================================
// Tool category mapping (maps hash -> subdirectory)
// IMPORTANT!!! When adding a new tool/page, add it here AND in TOOL_META above.
// ============================================================
const TOOL_CATEGORIES = {
  rename: 'file-operations', move: 'file-operations', copy: 'file-operations',
  delete: 'file-operations', split: 'file-operations', merge: 'file-operations',
  convert: 'conversion', 'image-convert': 'conversion', 'video-convert': 'conversion',
  'audio-convert': 'conversion', 'doc-convert': 'conversion',
  compress: 'compression', extract: 'compression', 'iso-mount': 'compression',
  cleanup: 'cleanup', 'ai-rename': 'cleanup', 'ai-cleanup': 'cleanup', duplicates: 'cleanup',
  'empty-folders': 'cleanup', 'large-files': 'cleanup', 'old-files': 'cleanup', 'temp-files': 'cleanup',
  organize: 'organization', sort: 'organization', deduplicate: 'organization', tag: 'organization',
  resize: 'media', watermark: 'media', thumbnail: 'media', metadata: 'media',
  checksum: 'advanced', encrypt: 'advanced', sync: 'advanced', 'secure-delete': 'advanced',
  history: 'system', settings: 'system', trash: 'system', 'storage-details': 'system'
};

// ============================================================
// Sidebar: render quick tools list
// ============================================================
async function renderQuickTools() {
  const tools = await getQuickTools();
  quickToolsList.innerHTML = '';
  
  if (tools.length === 0) return;
  
  tools.forEach(toolId => {
    const meta = TOOL_META[toolId];
    if (!meta) return;
    
    const li = document.createElement('li');
    li.innerHTML = `<a class="nav-link" href="#${toolId}"><span class="nav-icon material-symbols-rounded">${meta.icon}</span><span class="nav-text">${meta.label}</span></a>`;
    quickToolsList.appendChild(li);
  });
}

// ============================================================
// Dashboard: render quick tools card grid
// ============================================================
async function renderDashboardQuickTools() {
  const grid = document.getElementById('dashboard-quick-tools');
  if (!grid) return;

  const tools = await getQuickTools();
  grid.innerHTML = '';

  tools.forEach(toolId => {
    const meta = TOOL_META[toolId];
    if (!meta) return;

    const color = DASHBOARD_CARD_COLORS[toolId] || 'gray';
    const li = document.createElement('li');
    li.className = 'quick-tool-item';
    li.setAttribute('data-tool', toolId);
    li.innerHTML = `
      <div class="tool-icon ${color}">
        <span class="material-symbols-rounded">${meta.icon}</span>
      </div>
      <div class="tool-info">
        <h4>${meta.label}</h4>
        <p>${meta.description}</p>
      </div>
    `;
    grid.appendChild(li);
  });

  // Always append "More Tools" card
  const moreLi = document.createElement('li');
  moreLi.className = 'quick-tool-item';
  moreLi.setAttribute('data-tool', 'alltools');
  moreLi.innerHTML = `
    <div class="tool-icon gray">
      <span class="material-symbols-rounded">apps</span>
    </div>
    <div class="tool-info">
      <h4>More Tools</h4>
      <p>Explore all available tools</p>
    </div>
  `;
  grid.appendChild(moreLi);
}

// ============================================================
// Quick Tools toggle (from All Tools checkboxes)
// ============================================================
async function toggleQuickTool(toolId, checked) {
  const tools = await getQuickTools();
  const newTools = [...tools];
  if (checked) {
    if (!newTools.includes(toolId)) {
      newTools.push(toolId);
    }
  } else {
    const idx = newTools.indexOf(toolId);
    if (idx > -1) newTools.splice(idx, 1);
  }
  await saveQuickTools(newTools);
  renderQuickTools();
  renderDashboardQuickTools();
}

// ============================================================
// Initialize
// ============================================================
async function init() {
  originalHomeHTML = contentSection.innerHTML;
  
  if (navLinks.length > 0) {
    navLinks[0].classList.add('selected');
  }
  
  await renderQuickTools();
  
  const fileList = document.getElementById('file-list');
  if (fileList) {
    loadFileBrowser();
  }
}

// ============================================================
// Content loading
// ============================================================
async function loadContent(toolName, pushHistory = true) {
  if (toolName === 'home' || !toolName) {
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardQuickTools();
    return;
  }
  
  try {
    const category = TOOL_CATEGORIES[toolName] || '';
    const path = category ? `html/${category}/${toolName}.html` : `html/${toolName}.html`;
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${path}`);
    const html = await response.text();
    contentSection.innerHTML = html;
    
    if (toolName === 'browse-files') {
      setTimeout(() => {
        loadFileBrowser();
        setupFileBrowserButtonListeners();
      }, 0);
    }
    if (toolName === 'alltools') {
      setTimeout(async () => {
        await initializeAllToolsCheckboxes();
        attachToggleListeners();
      }, 0);
    }
    if (toolName === 'settings') {
      setTimeout(() => setupSettings(), 0);
    }
    
    if (pushHistory) {
      history.pushState(null, null, `#${toolName}`);
    }
  } catch (err) {
    console.error('Failed to load tool:', toolName, err);
    contentSection.innerHTML = `<h2>Load Failed</h2><p>Could not load <strong>${toolName}</strong>.<br><small>${err.message}</small></p>`;
  }
}

// ============================================================
// All Tools page: checkbox toggle listeners
// ============================================================
async function initializeAllToolsCheckboxes() {
  const tools = await getQuickTools();
  const checkboxes = document.querySelectorAll('.quick-tool-toggle');
  checkboxes.forEach(checkbox => {
    const toolId = checkbox.getAttribute('data-tool');
    checkbox.checked = tools.includes(toolId);
  });
}

function attachToggleListeners() {
  const toggles = document.querySelectorAll('.quick-tool-toggle');
  toggles.forEach(toggle => {
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    newToggle.addEventListener('change', async (e) => {
      const toolId = e.target.getAttribute('data-tool');
      await toggleQuickTool(toolId, e.target.checked);
    });
  });
}

// ============================================================
// Navigation
// ============================================================
function navigateTo(toolName) {
  loadContent(toolName);
  
  document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('selected'));
  const sidebarLink = document.querySelector(`#sidebar a[href="#${toolName}"]`);
  if (sidebarLink) sidebarLink.classList.add('selected');
  
  history.pushState(null, null, `#${toolName}`);
}

// File browser state
let isListView = true;
let selectedFilePath = null;

function selectFileItem(item) {
  // Remove previous selection
  document.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
  // Mark this item as selected
  item.classList.add('selected');
  // Track the file path for delete
  selectedFilePath = item.dataset.path;
}

async function deleteSelectedFile() {
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

function filterFileList() {
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

function toggleFileView() {
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

function updateNavigationButtons() {
  const backBtn = document.querySelector('.btn-tool[title="Back"]');
  const forwardBtn = document.querySelector('.btn-tool[title="Forward"]');
  if (backBtn) backBtn.classList.toggle('disabled', !(currentHistoryIndex >= 0));
  if (forwardBtn) forwardBtn.classList.toggle('disabled', !(currentHistoryIndex < fileBrowserHistory.length - 1));
}

function setupFileBrowserButtonListeners() {
  const deleteBtn = document.querySelector('.btn-tool[title="Delete"]');
  const viewBtn = document.querySelector('.btn-icon[title="View"]');
  const searchInput = document.querySelector('.browser-search-input');
  
  if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedFile);
  if (viewBtn) viewBtn.addEventListener('click', toggleFileView);
  if (searchInput) {
    searchInput.addEventListener('input', filterFileList);
  }
}

function setupGlobalNavigation() {
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
      navigateTo(toolName);
      return;
    }
    
    // Dashboard quick tool cards
    const card = e.target.closest('.quick-tool-item');
    if (card) {
      const toolName = card.getAttribute('data-tool') || 'alltools';
      navigateTo(toolName);
      return;
    }
    
    // All Tools page tool cards (exclude checkbox/label clicks)
    const toolCard = e.target.closest('.tool-card');
    if (toolCard && !e.target.closest('.tool-card-checkbox, input, label')) {
      const toolName = toolCard.getAttribute('data-tool');
      if (toolName) {
        navigateTo(toolName);
      }
      return;
    }
  });
}

// ============================================================
// Toggle listeners (delegated for checkboxes)
// ============================================================
function setupToggleListeners() {
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('quick-tool-toggle')) {
      const toolId = e.target.getAttribute('data-tool');
      await toggleQuickTool(toolId, e.target.checked);
    }
  });
}

// ============================================================
// Sidebar collapse toggle
// ============================================================
function setupMenuToggle() {
  const menuToggle = document.getElementById('menu-toggle');
  const mainElement = document.querySelector('main');

  if (!menuToggle || !mainElement) return;

  menuToggle.addEventListener('click', () => {
    const isCollapsed = mainElement.classList.toggle('sidebar-collapsed');
    const iconSpan = menuToggle.querySelector('.material-symbols-rounded');
    if (iconSpan) {
      iconSpan.textContent = isCollapsed ? 'menu_open' : 'menu';
    }
  });
}

// ============================================================
// Theme handling
// ============================================================
async function loadTheme() {
  try {
    const settings = await apiFetch('/api/settings');
    const theme = settings?.general?.theme || 'dark';
    applyTheme(theme);
  } catch (err) {
    console.error('Failed to load theme:', err);
    applyTheme('dark');
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  const isDark = theme === 'dark';
  html.setAttribute('data-theme', theme);
  
  const themeBtn = document.querySelector('.header-icon[title="Theme"]');
  if (themeBtn) {
    const iconSpan = themeBtn.querySelector('.material-symbols-rounded');
    if (iconSpan) {
      iconSpan.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
  }
  
  localStorage.setItem('disk-kit-theme', theme);
}

async function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  
  try {
    await apiFetch('/api/settings', {
      method: 'POST',
      body: { general: { theme: newTheme } }
    });
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

function setupThemeToggle() {
  const themeBtn = document.querySelector('.header-icon[title="Theme"]');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => toggleTheme());
  }
}

// ============================================================
// File Browser Navigation (Back/Forward)
// ============================================================
const fileBrowserHistory = [];
let currentHistoryIndex = -1;
let suppressHistoryRecord = false;

function goBack() {
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

function goForward() {
  if (currentHistoryIndex < fileBrowserHistory.length - 1) {
    currentHistoryIndex++;
    suppressHistoryRecord = true;
    loadFileBrowser(fileBrowserHistory[currentHistoryIndex]);
  }
}

function setupFileBrowserNavigation() {
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
// Help dialog
// ============================================================
let helpData = null;

async function loadHelpData() {
  try {
    const response = await fetch('help/tips.json');
    if (!response.ok) throw new Error('Failed to load help data');
    helpData = await response.json();
    return helpData;
  } catch (err) {
    console.error('Failed to load help data:', err);
    return null;
  }
}

function renderHelpSection(sectionKey) {
  const container = document.getElementById('help-content');
  if (!container || !helpData) return;
  
  const items = helpData[sectionKey] || [];
  container.innerHTML = items.map(item => `
    <div class="help-section active">
      <div class="help-item">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.content)}</p>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openHelpDialog() {
  const dialog = document.getElementById('help-dialog');
  if (!dialog) return;
  
  dialog.style.display = 'flex';
  requestAnimationFrame(() => {
    dialog.classList.add('active');
  });
  
  if (!helpData) {
    loadHelpData().then(() => {
      renderHelpSection('gettingStarted');
    });
  } else {
    renderHelpSection('gettingStarted');
  }
}

function closeHelpDialog() {
  const dialog = document.getElementById('help-dialog');
  if (!dialog) return;
  
  dialog.classList.remove('active');
  setTimeout(() => {
    dialog.style.display = 'none';
  }, 300);
}

function setupHelpTabs() {
  const tabs = document.querySelectorAll('.help-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabKey = tab.getAttribute('data-tab');
      renderHelpSection(tabKey);
    });
  });
}

function setupHelpDialog() {
  const helpBtn = document.querySelector('.header-icon[title="Help"]');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => openHelpDialog());
  }
  
  const closeBtn = document.getElementById('help-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeHelpDialog());
  }
  
  const dialog = document.getElementById('help-dialog');
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeHelpDialog();
      }
    });
  }
  
  setupHelpTabs();
}

// ============================================================
// Bootstrap
// ============================================================
async function bootstrap() {
  try {
    await init();
    setupGlobalNavigation();
    setupToggleListeners();
    setupMenuToggle();
    setupThemeToggle();
    setupHelpDialog();
    setupFileBrowserNavigation();
    await loadTheme();
    await renderDashboardQuickTools();
    
    // Load tab from URL hash on page load
    const hash = window.location.hash.slice(1);
    if (hash) {
      navigateTo(hash);
    }
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
}

bootstrap();

// ============================================================
// Settings helpers
// ============================================================
let currentSettings = null;

async function apiFetch(path, options = {}) {
    const base = window.location.origin || 'http://localhost:5000';
    const url = `${base}${path}`;
    const defaults = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    const config = Object.assign({}, defaults, options);
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }
    const response = await fetch(url, config);
    if (!response.ok) {
        const errorText = await response.text();
        let message = `HTTP ${response.status}`;
        try {
            const err = JSON.parse(errorText);
            message = err.error || message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
        if (!(part in acc)) acc[part] = {};
        return acc[part];
    }, obj);
    target[last] = value;
}

function populateSettingsForm(settings) {
    currentSettings = settings;
    const form = document.getElementById('settings-form');
    if (!form) return;
    Array.from(form.elements).forEach(el => {
        const name = el.getAttribute('name');
        if (!name) return;
        const value = getNestedValue(settings, name);
        if (el.type === 'checkbox') {
            el.checked = Boolean(value);
        } else if (el.type === 'number') {
            el.value = value !== undefined ? value : '';
        } else {
            el.value = value !== undefined ? value : '';
        }
    });
}

function gatherSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return {};
    const data = {};
    Array.from(form.elements).forEach(el => {
        const name = el.getAttribute('name');
        if (!name) return;
        if (el.type === 'checkbox') {
            setNestedValue(data, name, el.checked);
        } else if (el.type === 'number') {
            const num = parseFloat(el.value);
            setNestedValue(data, name, Number.isNaN(num) ? el.value : num);
        } else {
            setNestedValue(data, name, el.value);
        }
    });
    return data;
}

async function loadSettings() {
    try {
        const settings = await apiFetch('/api/settings');
        populateSettingsForm(settings);
        showSettingsMessage('Settings loaded.', 'success');
    } catch (err) {
        console.error(err);
        showSettingsMessage(`Failed to load settings: ${err.message}`, 'error');
    }
}

async function saveSettings() {
    const data = gatherSettingsForm();
    try {
        const result = await apiFetch('/api/settings', {
            method: 'POST',
            body: data
        });
        currentSettings = result.settings;
        showSettingsMessage('Settings saved.', 'success');
    } catch (err) {
        console.error(err);
        showSettingsMessage(`Failed to save settings: ${err.message}`, 'error');
    }
}

async function resetSettings() {
    try {
        const result = await apiFetch('/api/settings/reset', { method: 'POST' });
        populateSettingsForm(result.settings);
        showSettingsMessage('Settings reset to defaults.', 'success');
    } catch (err) {
        console.error(err);
        showSettingsMessage(`Failed to reset settings: ${err.message}`, 'error');
    }
}

function showSettingsMessage(message, type) {
    const el = document.getElementById('settings-message');
    if (!el) return;
    el.textContent = message;
    el.className = `settings-message ${type}`;
}

function setupSettings() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetSettings());
    }
    loadSettings();
}

// ============================================================
// Content loading
// ============================================================
// ============================================================
// File browser - real implementation
// ============================================================
let currentFilePath = '';

async function loadFileBrowser(path = '') {
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

function getFileIcon(filename) {
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

function showFileDetails(data) {
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

function formatFileSize(bytes) {
  if (bytes === 0 || bytes === undefined) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}