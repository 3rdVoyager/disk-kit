// Import file browser functionality
import {
  loadFileBrowser,
  goBack,
  setupFileBrowserNavigation,
  setupFileBrowserButtonListeners,
  selectFileItem,
} from './pages/browse-files.js';

import { openPathSelector } from './popups/folder-picker.js';
import { loadPopups } from './popups/load-popups.js';

import { setupLargeFilesTool } from './tools/large-files.js';
import { setupRenameTool } from './tools/rename.js';
import { setupDuplicatesTool } from './tools/duplicates.js';
import { setupOrganizeTool } from './tools/organize.js';
import { setupSettingsTool } from './pages/settings.js';
import { setupStorageOverviewPage } from './pages/storage-overview.js';
import { setupOnboarding } from './popups/onboarding.js';
import { loadDashboardStorage, setupStorageRefreshButton, setupFolderScanPathPicker } from './storage.js';

import { escapeHtml, apiFetch, getLastPath, setWorkingPath, getConfiguredDefaultPath, resolveBrowserPath } from './utils.js';

const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
const quickToolsList = document.getElementById('quick-tools');
const quickToolsSection = quickToolsList ? quickToolsList.closest('li') : null;
let originalHomeHTML = '';

const DEFAULT_QUICK_TOOLS = ['large-files', 'rename', 'duplicates', 'organize'];
let cachedQuickTools = null;
const QUICK_TOOL_EXCLUDED = new Set(['home', 'alltools', 'browse-files', 'settings', 'storage-overview']);
const PAGE_ROUTES = new Set(['browse-files', 'settings', 'alltools', 'storage-overview']);

const OP_ICONS = {
  rename: { icon: 'edit', color: 'blue' },
  organize: { icon: 'auto_fix_high', color: 'purple' },
  delete: { icon: 'delete_sweep', color: 'green' },
  duplicates: { icon: 'find_replace', color: 'green' },
};

function getViewHtmlPath(routeId) {
  const folder = PAGE_ROUTES.has(routeId) ? 'pages' : 'tools';
  return `html/${folder}/${routeId}.html`;
}

function isQuickToolEligible(toolId) {
  return Boolean(TOOL_META[toolId]) && !QUICK_TOOL_EXCLUDED.has(toolId);
}

async function getQuickTools() {
  try {
    if (cachedQuickTools !== null) return cachedQuickTools;
    const response = await apiFetch('/api/quick-tools');
    const incomingTools = Array.isArray(response.quickTools) ? response.quickTools : DEFAULT_QUICK_TOOLS;
    const validTools = incomingTools.filter(toolId => isQuickToolEligible(toolId));
    cachedQuickTools = validTools.length > 0 ? validTools : DEFAULT_QUICK_TOOLS;
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
    await apiFetch('/api/quick-tools', { method: 'POST', body: { quickTools: tools } });
    cachedQuickTools = tools;
  } catch (err) {
    console.error('Failed to save quick tools:', err);
  }
}

const TOOL_META = {
  'large-files':    { icon: 'storage',           label: 'Large Files',        description: 'Find files taking up space' },
  rename:         { icon: 'edit',              label: 'Batch Rename',       description: 'Preview and apply rename rules' },
  duplicates:     { icon: 'find_replace',      label: 'Duplicate Finder',   description: 'Find exact duplicate files' },
  organize:       { icon: 'auto_fix_high',     label: 'Smart Organize',     description: 'Sort files into category folders' },
  settings:       { icon: 'settings',          label: 'Settings',           description: 'Configure application settings' },
  'browse-files': { icon: 'folder',            label: 'Browse Files',       description: 'Browse and navigate files' },
  alltools:       { icon: 'apps',              label: 'All Tools',          description: 'Explore all available tools' },
  home:           { icon: 'home',              label: 'Dashboard',          description: 'Return to the dashboard' },
};

const DASHBOARD_CARD_COLORS = {
  'large-files': 'orange',
  rename: 'blue',
  duplicates: 'green',
  organize: 'purple',
  'browse-files': 'blue',
  settings: 'gray',
  alltools: 'gray',
};

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

function formatRelativeTime(isoString) {
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

async function renderRecentOperations() {
  const list = document.getElementById('recent-operations');
  if (!list) return;

  try {
    const data = await apiFetch('/api/operations?limit=10');
    const ops = data.operations || [];
    if (ops.length === 0) {
      list.innerHTML = '<li class="operation-empty">No operations yet — run a tool to see history here.</li>';
      return;
    }

    list.innerHTML = ops.map(op => {
      const meta = OP_ICONS[op.type] || { icon: 'info', color: 'gray' };
      return `
        <li class="operation-item">
          <div class="op-icon ${meta.color}">
            <span class="material-symbols-rounded">${meta.icon}</span>
          </div>
          <div class="op-details">
            <h4>${escapeHtml(op.title)}</h4>
            <p>${escapeHtml(op.detail || '')}</p>
          </div>
          <div class="op-meta">
            <span class="op-time">${formatRelativeTime(op.timestamp)}</span>
            <span class="badge-success">${escapeHtml(op.status || 'completed')}</span>
          </div>
        </li>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `<li class="operation-empty">Could not load history: ${escapeHtml(err.message)}</li>`;
  }
}

function renderDashboardHome() {
  const onFolderNavigate = async (folderPath) => {
    await setWorkingPath(folderPath, { persistSettings: false });
    navigateTo('browse-files');
  };

  renderDashboardQuickTools();
  setupStorageRefreshButton('storage-refresh-btn', (options) =>
    loadDashboardStorage({ ...options, onNavigate: onFolderNavigate }),
  );
  setupFolderScanPathPicker('storage-browse-path-btn', (options) =>
    loadDashboardStorage({ ...options, onNavigate: onFolderNavigate }),
  );
  loadDashboardStorage({ onNavigate: onFolderNavigate });
  renderRecentOperations();
}

async function toggleQuickTool(toolId, checked) {
  if (!isQuickToolEligible(toolId)) return;
  const tools = await getQuickTools();
  const newTools = [...tools];
  if (checked) {
    if (!newTools.includes(toolId)) newTools.push(toolId);
  } else {
    const idx = newTools.indexOf(toolId);
    if (idx > -1) newTools.splice(idx, 1);
  }
  await saveQuickTools(newTools);
  renderQuickTools();
  renderDashboardQuickTools();
}

async function init() {
  originalHomeHTML = contentSection.innerHTML;
  if (navLinks.length > 0) navLinks[0].classList.add('selected');
  await renderQuickTools();
}

async function loadContent(toolName, pushHistory = true) {
  if (toolName === 'home' || !toolName) {
    document.body.classList.remove('page-browse-files');
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardHome();
    return;
  }

  document.body.classList.toggle('page-browse-files', toolName === 'browse-files');

  try {
    const path = getViewHtmlPath(toolName);
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${path}`);
    contentSection.innerHTML = await response.text();

    if (toolName === 'browse-files') {
      setTimeout(async () => {
        await loadFileBrowser(await resolveBrowserPath(getLastPath()));
        setupFileBrowserButtonListeners();
      }, 0);
    }
    if (toolName === 'alltools') setTimeout(() => initializeAllToolsCheckboxes(), 0);
    if (toolName === 'settings') setTimeout(() => setupSettingsTool(), 0);
    if (toolName === 'storage-overview') {
      setTimeout(() => setupStorageOverviewPage(navigateTo), 0);
    }
    if (toolName === 'large-files') setTimeout(() => setupLargeFilesTool(), 0);
    if (toolName === 'rename') setTimeout(() => setupRenameTool(), 0);
    if (toolName === 'duplicates') setTimeout(() => setupDuplicatesTool(), 0);
    if (toolName === 'organize') setTimeout(() => setupOrganizeTool(), 0);

    if (pushHistory) history.pushState(null, null, `#${toolName}`);
  } catch (err) {
    console.error('Failed to load tool:', toolName, err);
    contentSection.innerHTML = `<h2>Load Failed</h2><p>Could not load <strong>${toolName}</strong>.<br><small>${err.message}</small></p>`;
  }
}

async function initializeAllToolsCheckboxes() {
  const tools = await getQuickTools();
  document.querySelectorAll('.quick-tool-toggle').forEach(checkbox => {
    checkbox.checked = tools.includes(checkbox.getAttribute('data-tool'));
  });
}

function navigateTo(toolName) {
  loadContent(toolName);
  document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('selected'));
  const sidebarLink = document.querySelector(`#sidebar a[href="#${toolName}"]`);
  if (sidebarLink) sidebarLink.classList.add('selected');
}

function setupGlobalNavigation() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-tool[title="Back"]')) {
      e.preventDefault();
      const backBtn = e.target.closest('.btn-tool[title="Back"]');
      if (backBtn?.classList.contains('disabled')) return;
      goBack();
      return;
    }
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      e.preventDefault();
      const toolName = link.getAttribute('href').substring(1);
      if (!toolName) return;
      navigateTo(toolName);
      return;
    }
    const card = e.target.closest('.quick-tool-item');
    if (card) {
      navigateTo(card.getAttribute('data-tool') || 'alltools');
      return;
    }
    const toolCard = e.target.closest('.tool-card');
    if (toolCard && !e.target.closest('.tool-card-checkbox, input, label')) {
      const toolName = toolCard.getAttribute('data-tool');
      if (toolName) navigateTo(toolName);
    }
  });
}

function setupToggleListeners() {
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('quick-tool-toggle')) {
      await toggleQuickTool(e.target.getAttribute('data-tool'), e.target.checked);
    }
  });
}

function setupMenuToggle() {
  const menuToggle = document.getElementById('menu-toggle');
  const mainElement = document.querySelector('main');
  if (!menuToggle || !mainElement) return;
  menuToggle.addEventListener('click', () => {
    const isCollapsed = mainElement.classList.toggle('sidebar-collapsed');
    const iconSpan = menuToggle.querySelector('.material-symbols-rounded');
    if (iconSpan) iconSpan.textContent = isCollapsed ? 'menu_open' : 'menu';
  });
}

async function loadTheme() {
  try {
    const settings = await apiFetch('/api/settings');
    applyTheme(settings?.general?.theme || 'dark');
  } catch (err) {
    console.error('Failed to load theme:', err);
    applyTheme('dark');
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeBtn = document.querySelector('.header-icon[title="Theme"]');
  if (themeBtn) {
    const iconSpan = themeBtn.querySelector('.material-symbols-rounded');
    if (iconSpan) iconSpan.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  }
  localStorage.setItem('disk-kit-theme', theme);
}

async function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  try {
    await apiFetch('/api/settings', { method: 'POST', body: { general: { theme: newTheme } } });
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

function setupThemeToggle() {
  document.querySelector('.header-icon[title="Theme"]')?.addEventListener('click', () => toggleTheme());
}

function setupChangePath() {
  document.getElementById('change-path-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openPathSelector(async (path) => {
      await setWorkingPath(path);
      await loadDashboardStorage({ forceRefresh: true });
    });
  });
}

async function initWorkingPath() {
  const last = getLastPath();
  if (last) {
    await setWorkingPath(last, { persistSettings: false });
    return;
  }
  const defaultPath = await getConfiguredDefaultPath();
  if (defaultPath) {
    await setWorkingPath(defaultPath, { persistSettings: false });
  }
}

let searchTimeout = null;

function setupGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const resultsEl = document.getElementById('global-search-results');
  if (!input || !resultsEl) return;

  const hideResults = () => {
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
  };

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = input.value.trim();
    if (!query) {
      hideResults();
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const path = getLastPath();
        const params = new URLSearchParams({ q: query, limit: '50' });
        if (path) params.set('path', path);
        const data = await apiFetch(`/api/search?${params.toString()}`);
        if (!data.items?.length) {
          resultsEl.innerHTML = '<div class="search-result-empty">No matches found</div>';
        } else {
          resultsEl.innerHTML = data.items.map(item => `
            <button type="button" class="search-result-item" data-path="${escapeHtml(item.fullPath)}" data-type="${item.type}">
              <span class="material-symbols-rounded">${item.type === 'directory' ? 'folder' : 'insert_drive_file'}</span>
              <span class="search-result-name">${escapeHtml(item.name)}</span>
              <span class="search-result-path">${escapeHtml(item.fullPath)}</span>
            </button>
          `).join('') + (data.truncated ? '<div class="search-result-empty">Results capped — refine your search</div>' : '');
        }
        resultsEl.hidden = false;
      } catch (err) {
        resultsEl.innerHTML = `<div class="search-result-empty">${escapeHtml(err.message)}</div>`;
        resultsEl.hidden = false;
      }
    }, 300);
  });

  resultsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.search-result-item');
    if (!btn) return;
    const fullPath = btn.dataset.path;
    const isDir = btn.dataset.type === 'directory';
    // Working path is the folder itself, or the parent folder for a file.
    const workingPath = isDir ? fullPath : (fullPath.split('/').slice(0, -1).join('/') || fullPath);
    hideResults();
    input.value = '';
    await setWorkingPath(workingPath);
    navigateTo('browse-files');
    setTimeout(async () => {
      await loadFileBrowser(workingPath);
      setupFileBrowserButtonListeners();
      if (!isDir) {
        const fileList = document.getElementById('file-list');
        const items = fileList?.querySelectorAll('.file-item') || [];
        const match = [...items].find(el => el.dataset.path === fullPath);
        if (match) {
          selectFileItem(match);
          match.scrollIntoView({ block: 'nearest' });
        }
      }
    }, 100);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideResults();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) hideResults();
  });
}

async function bootstrap() {
  try {
    await loadPopups();
    await init();
    setupGlobalNavigation();
    setupToggleListeners();
    setupMenuToggle();
    setupThemeToggle();
    setupChangePath();
    setupGlobalSearch();
    setupOnboarding();
    setupFileBrowserNavigation();
    await loadTheme();
    await initWorkingPath();
    renderDashboardHome();

    const hash = window.location.hash.slice(1);
    if (hash) navigateTo(hash);
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
}

bootstrap();
