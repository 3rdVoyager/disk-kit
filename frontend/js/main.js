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
// Quick Tools state (persisted in localStorage)
// ============================================================
const STORAGE_KEY = 'disk-kit-quick-tools';
const DEFAULT_QUICK_TOOLS = ['rename', 'convert', 'compress', 'cleanup'];

function getQuickTools() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_QUICK_TOOLS;
  } catch {
    return DEFAULT_QUICK_TOOLS;
  }
}

function saveQuickTools(tools) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
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
function renderQuickTools() {
  const tools = getQuickTools();
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
function renderDashboardQuickTools() {
  const grid = document.getElementById('dashboard-quick-tools');
  if (!grid) return;

  const tools = getQuickTools();
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
function toggleQuickTool(toolId, checked) {
  const tools = getQuickTools();
  if (checked) {
    if (!tools.includes(toolId)) {
      tools.push(toolId);
    }
  } else {
    const idx = tools.indexOf(toolId);
    if (idx > -1) tools.splice(idx, 1);
  }
  saveQuickTools(tools);
  renderQuickTools();
  renderDashboardQuickTools();
}

// ============================================================
// Initialize
// ============================================================
function init() {
  originalHomeHTML = contentSection.innerHTML;
  
  if (navLinks.length > 0) {
    navLinks[0].classList.add('selected');
  }
  
  renderQuickTools();
  
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
      setTimeout(() => loadFileBrowser(), 0);
    }
    if (toolName === 'alltools') {
      attachToggleListeners();
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
function attachToggleListeners() {
  const toggles = document.querySelectorAll('.quick-tool-toggle');
  toggles.forEach(toggle => {
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    newToggle.addEventListener('change', (e) => {
      const toolId = e.target.getAttribute('data-tool');
      toggleQuickTool(toolId, e.target.checked);
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

function setupGlobalNavigation() {
  document.addEventListener('click', (e) => {
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
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('quick-tool-toggle')) {
      const toolId = e.target.getAttribute('data-tool');
      toggleQuickTool(toolId, e.target.checked);
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
// Bootstrap
// ============================================================
function bootstrap() {
  try {
    init();
    setupGlobalNavigation();
    setupToggleListeners();
    setupMenuToggle();
    renderDashboardQuickTools();
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
// File browser mock
// ============================================================
async function loadFileBrowser(path = '') {
  const mockFiles = [
    { name: 'Documents', type: 'folder', size: '--', date: '2025-06-15 14:23' },
    { name: 'Downloads', type: 'folder', size: '--', date: '2025-06-14 09:10' },
    { name: 'Project', type: 'folder', size: '--', date: '2025-06-12 16:45' },
    { name: 'notes.txt', type: 'file', size: '2 KB', date: '2025-06-10 11:30' },
    { name: 'image.png', type: 'file', size: '1.4 MB', date: '2025-06-08 08:15' },
  ];

  const fileList = document.getElementById('file-list');
  fileList.innerHTML = mockFiles.map(file => `
    <li class="file-item" data-type="${file.type}" data-name="${file.name}">
      <span class="file-icon">${file.type === 'folder' ? '📁' : '📄'}</span>
      <span class="file-name">${file.name}</span>
      <span class="file-date">${file.date}</span>
      <span class="file-type">${file.type === 'folder' ? 'File Folder' : 'File'}</span>
      <span class="file-size">${file.size}</span>
    </li>
  `).join('');
}