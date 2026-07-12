import { loadPopups } from './popups/load-popups.js';

import { setupRenameTool } from './tools/rename.js';
import { setupDuplicatesTool } from './tools/duplicates.js';
import { setupConvertTool } from './tools/convert.js';
import { checkForUpdates } from './updates.js';
import { resolveAppVersion } from './version.js';
import { setupSettingsTool } from './pages/settings.js';
import { setupOnboarding } from './popups/onboarding.js';
import { initThemeFromSettings } from './theme.js';

import { escapeHtml, apiFetch, getLastPath, setLastPath, getConfiguredDefaultPath } from './utils.js';

const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
let originalHomeHTML = '';

const TOOL_IDS = ['convert', 'rename', 'duplicates'];
const PAGE_ROUTES = new Set(['settings']);

const OP_ICONS = {
  rename: { icon: 'edit' },
  delete: { icon: 'delete_sweep' },
  duplicates: { icon: 'find_replace' },
  convert: { icon: 'transform' },
};

const TOOL_META = {
  convert: {
    icon: 'transform',
    label: 'Convert Files',
    description: 'Batch convert images to WebP, JPEG, or PNG',
  },
  rename: {
    icon: 'edit',
    label: 'Batch Rename',
    description: 'Preview rename rules before applying them to a folder',
  },
  duplicates: {
    icon: 'find_replace',
    label: 'Duplicate Finder',
    description: 'Find exact copies by file size and content hash',
  },
  settings: { icon: 'settings', label: 'Settings', description: 'Configure application settings' },
  home: { icon: 'home', label: 'Dashboard', description: 'Return to the dashboard' },
};

function getViewHtmlPath(routeId) {
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
    const li = document.createElement('li');
    li.className = 'quick-tool-item';
    li.setAttribute('data-tool', toolId);
    li.innerHTML = `
      <div class="tool-icon">
        <span class="material-symbols-rounded">${meta.icon}</span>
      </div>
      <div class="tool-info">
        <h4>${meta.label}</h4>
        <p>${meta.description}</p>
      </div>
      <div class="tool-chevron" aria-hidden="true">
        <span class="material-symbols-rounded">chevron_right</span>
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
      list.innerHTML = `
        <li class="operation-empty">
          <span class="material-symbols-rounded">inbox</span>
          <span>No operations yet — run a tool to see history here.</span>
        </li>`;
      return;
    }

    list.innerHTML = ops.map(op => {
      const meta = OP_ICONS[op.type] || { icon: 'info' };
      return `
        <li class="operation-item">
          <div class="op-icon">
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
    list.innerHTML = `
      <li class="operation-empty">
        <span class="material-symbols-rounded">error_outline</span>
        <span>Could not load history: ${escapeHtml(err.message)}</span>
      </li>`;
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
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardHome();
    return;
  }

  // Legacy routes removed in v1 simplification
  if (toolName === 'alltools' || toolName === 'storage-overview' || toolName === 'large-files' || toolName === 'organize' || toolName === 'browse-files' || toolName.startsWith('coming-soon-')) {
    toolName = 'home';
    contentSection.innerHTML = originalHomeHTML;
    renderDashboardHome();
    history.replaceState(null, null, '#home');
    return;
  }

  try {
    const path = getViewHtmlPath(toolName);
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${path}`);
    contentSection.innerHTML = await response.text();

    if (toolName === 'settings') setTimeout(() => setupSettingsTool(), 0);
    if (toolName === 'convert') setTimeout(() => setupConvertTool(), 0);
    if (toolName === 'rename') setTimeout(() => setupRenameTool(), 0);
    if (toolName === 'duplicates') setTimeout(() => setupDuplicatesTool(), 0);

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

async function initWorkingPath() {
  if (getLastPath()) return;
  const defaultPath = await getConfiguredDefaultPath();
  if (defaultPath) setLastPath(defaultPath);
}

async function bootstrap() {
  try {
    await loadPopups();
    await init();
    setupGlobalNavigation();
    setupMenuToggle();
    setupOnboarding();
    await initThemeFromSettings();
    await initWorkingPath();
    renderDashboardHome();
    await resolveAppVersion();
    checkForUpdates();

    const hash = window.location.hash.slice(1);
    if (hash) navigateTo(hash);
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
}

bootstrap();
