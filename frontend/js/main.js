// Import file browser functionality
import {
  loadFileBrowser,
  goBack,
  goForward,
  setupFileBrowserNavigation,
  setupFileBrowserButtonListeners,
} from './tools/file-browser.js';

import { setupLargeFilesTool } from './tools/large-files.js';
import { setupBatchRenameTool } from './tools/batch-rename.js';
import { setupDuplicateFinderTool } from './tools/duplicate-finder.js';
import { setupSmartOrganizeTool } from './tools/smart-organize.js';
import { setupSettingsTool } from './tools/settings.js';

// Import utilities
import { escapeHtml, apiFetch } from './utils.js';

// DOM elements
const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
const quickToolsList = document.getElementById('quick-tools');
const quickToolsSection = quickToolsList ? quickToolsList.closest('li') : null;
let originalHomeHTML = '';

// ============================================================
// Quick Tools state (persisted via API to backend)
// ============================================================
const DEFAULT_QUICK_TOOLS = [];
let cachedQuickTools = null;
const QUICK_TOOL_EXCLUDED = new Set(['home', 'alltools', 'browse-files', 'settings']);

function isQuickToolEligible(toolId) {
  return Boolean(TOOL_META[toolId]) && !QUICK_TOOL_EXCLUDED.has(toolId);
}

async function getQuickTools() {
  try {
    if (cachedQuickTools !== null) {
      return cachedQuickTools;
    }
    const response = await apiFetch('/api/quick-tools');
    const incomingTools = Array.isArray(response.quickTools) ? response.quickTools : DEFAULT_QUICK_TOOLS;
    const validTools = incomingTools.filter(toolId => isQuickToolEligible(toolId));
    cachedQuickTools = validTools.length > 0 ? validTools : DEFAULT_QUICK_TOOLS;

    // If persisted tools include deprecated entries, self-heal to the active v1 set.
    if (validTools.length !== incomingTools.length || validTools.length === 0) {
      await saveQuickTools(cachedQuickTools);
    }
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
  'large-files':    { icon: 'storage',           label: 'Large Files',        description: 'Find files taking up space' },
  'rename':         { icon: 'edit',              label: 'Batch Rename',       description: 'Preview and apply rename rules' },
  'duplicates':     { icon: 'find_replace',      label: 'Duplicate Finder',   description: 'Find exact duplicate files' },
  'organize':       { icon: 'auto_fix_high',     label: 'Smart Organize',     description: 'Sort files into category folders' },
  'settings':       { icon: 'settings',          label: 'Settings',           description: 'Configure application settings' },
  'browse-files':   { icon: 'folder',            label: 'Browse Files',       description: 'Browse and navigate files' },
  'alltools':       { icon: 'apps',              label: 'All Tools',          description: 'Explore all available tools' },
  'home':           { icon: 'home',              label: 'Dashboard',          description: 'Return to the dashboard' }
};

// Color mapping for dashboard quick tool cards
const DASHBOARD_CARD_COLORS = {
  'large-files': 'orange',
  rename: 'blue',
  duplicates: 'green',
  organize: 'purple',
  'browse-files': 'blue',
  settings: 'gray',
  alltools: 'gray'
};

// ============================================================
// Tool category mapping (maps hash -> subdirectory)
// IMPORTANT!!! When adding a new tool/page, add it here AND in TOOL_META above.
// ============================================================
// ============================================================
// Sidebar: render quick tools list
// ============================================================
async function renderQuickTools() {
  const tools = await getQuickTools();
  quickToolsList.innerHTML = '';

  if (quickToolsSection) {
    quickToolsSection.style.display = tools.length > 0 ? '' : 'none';
  }
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
  if (!isQuickToolEligible(toolId)) return;

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
    const path = `html/tools/${toolName}.html`;
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
      }, 0);
    }
    if (toolName === 'settings') {
      setTimeout(() => setupSettingsTool(), 0);
    }
    if (toolName === 'large-files') {
      setTimeout(() => setupLargeFilesTool(), 0);
    }
    if (toolName === 'rename') {
      setTimeout(() => setupBatchRenameTool(), 0);
    }
    if (toolName === 'duplicates') {
      setTimeout(() => setupDuplicateFinderTool(), 0);
    }
    if (toolName === 'organize') {
      setTimeout(() => setupSmartOrganizeTool(), 0);
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

// ============================================================
// Navigation
// ============================================================
function navigateTo(toolName) {
  loadContent(toolName);
  
  document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('selected'));
  const sidebarLink = document.querySelector(`#sidebar a[href="#${toolName}"]`);
  if (sidebarLink) sidebarLink.classList.add('selected');
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