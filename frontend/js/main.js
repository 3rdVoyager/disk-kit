// Import file browser functionality
import {
  loadFileBrowser,
  goBack,
  selectFileItem,
  setupFileBrowserButtonListeners,
} from './pages/browse-files.js';

import { openPathSelector } from './popups/folder-picker.js';
import { loadPopups } from './popups/load-popups.js';

import { setupRenameTool } from './tools/rename.js';
import { setupDuplicatesTool } from './tools/duplicates.js';
import { setupConvertTool } from './tools/convert.js';
import { setupComingSoonTool } from './tools/coming-soon.js';
import { checkForUpdates } from './updates.js';
import { setupSettingsTool } from './pages/settings.js';
import { setupOnboarding } from './popups/onboarding.js';

import { escapeHtml, apiFetch, getLastPath, setWorkingPath, getConfiguredDefaultPath, resolveBrowserPath } from './utils.js';

const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
let originalHomeHTML = '';

const TOOL_IDS = ['convert', 'rename', 'duplicates'];
const PAGE_ROUTES = new Set(['browse-files', 'settings']);

const OP_ICONS = {
  rename: { icon: 'edit', color: 'blue' },
  delete: { icon: 'delete_sweep', color: 'green' },
  duplicates: { icon: 'find_replace', color: 'green' },
  convert: { icon: 'transform', color: 'orange' },
};

const TOOL_META = {
  convert: { icon: 'transform', label: 'Convert Files', description: 'Batch convert images' },
  rename: { icon: 'edit', label: 'Batch Rename', description: 'Preview and apply rename rules' },
  duplicates: { icon: 'find_replace', label: 'Duplicate Finder', description: 'Find exact duplicate files' },
  settings: { icon: 'settings', label: 'Settings', description: 'Configure application settings' },
  'browse-files': { icon: 'folder', label: 'Browse Files', description: 'Browse and navigate files' },
  home: { icon: 'home', label: 'Dashboard', description: 'Return to the dashboard' },
};

const DASHBOARD_CARD_COLORS = {
  convert: 'orange',
  rename: 'blue',
  duplicates: 'green',
  'browse-files': 'blue',
  settings: 'gray',
};

function getViewHtmlPath(routeId) {
  if (routeId.startsWith('coming-soon-')) return 'html/tools/coming-soon.html';
  const folder = PAGE_ROUTES.has(routeId) ? 'pages' : 'tools';
  return `html/${folder}/${routeId}.html`;
}

function renderDashboardQuickTools() {
  const grid = document.getElementById('dashboard-quick-tools');
  if (!grid) return;

  grid.innerHTML = '';
  TOOL_IDS.forEach((toolId) => {
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
  renderDashboardQuickTools();
  renderRecentOperations();
}

async function init() {
  originalHomeHTML = contentSection.innerHTML;
  if (navLinks.length > 0) navLinks[0].classList.add('selected');
}

async function loadContent(toolName, pushHistory = true) {
  if (toolName === 'home' || !toolName) {
    document.body.classList.remove('page-browse-files');
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardHome();
    return;
  }

  // Legacy routes removed in v1 simplification
  if (toolName === 'alltools' || toolName === 'storage-overview' || toolName === 'large-files' || toolName === 'organize') {
    toolName = 'home';
    document.body.classList.remove('page-browse-files');
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardHome();
    history.replaceState(null, null, '#home');
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
    if (toolName === 'settings') setTimeout(() => setupSettingsTool(), 0);
    if (toolName === 'convert') setTimeout(() => setupConvertTool(), 0);
    if (toolName === 'rename') setTimeout(() => setupRenameTool(), 0);
    if (toolName === 'duplicates') setTimeout(() => setupDuplicatesTool(), 0);
    if (toolName.startsWith('coming-soon-')) setTimeout(() => setupComingSoonTool(), 0);

    if (pushHistory) history.pushState(null, null, `#${toolName}`);
  } catch (err) {
    console.error('Failed to load tool:', toolName, err);
    contentSection.innerHTML = `<h2>Load Failed</h2><p>Could not load <strong>${toolName}</strong>.<br><small>${err.message}</small></p>`;
  }
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
      navigateTo(card.getAttribute('data-tool') || 'home');
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

async function bootstrap() {
  try {
    await loadPopups();
    await init();
    setupGlobalNavigation();
    setupMenuToggle();
    setupThemeToggle();
    setupChangePath();
    setupOnboarding();
    await loadTheme();
    await initWorkingPath();
    renderDashboardHome();
    checkForUpdates();

    const hash = window.location.hash.slice(1);
    if (hash) navigateTo(hash);
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
}

bootstrap();
