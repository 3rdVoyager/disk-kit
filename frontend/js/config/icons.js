/**
 * Icon Configuration
 * Centralized mapping of actions/tools to Material Symbols icons
 * For easy editing and consistency across the app
 */

export const ICONS = {
  // Tools (matches tool names in main.js)
  rename: 'edit',
  convert: 'transform',
  compress: 'inventory_2',
  cleanup: 'cleaning_services',
  organize: 'auto_fix_high',
  duplicateFinder: 'find_replace',
  emptyFolders: 'delete_sweep',
  largeFiles: 'storage',
  
  // Suggested Actions
  organizeDownloads: 'auto_fix_high',
  compressProjects: 'inventory_2',
  removeDuplicates: 'find_replace',
  batchRenamePhotos: 'edit',
  reviewLargeFiles: 'storage',
  
  // File Types
  folder: 'folder',
  file: 'insert_drive_file',
  image: 'image',
  video: 'movie',
  document: 'description',
  audio: 'audiotrack',
  archive: 'archive',
  code: 'code',
  
  // Navigation
  home: 'home',
  files: 'folder',
  allTools: 'apps',
  settings: 'settings',
  history: 'history',
  trash: 'delete',
  
  // Operations
  renamed: 'edit',
  converted: 'transform',
  compressed: 'inventory_2',
  duplicateFound: 'find_replace',
  cleaned: 'cleaning_services',
  
  // Common Actions
  add: 'add',
  cut: 'content_cut',
  copy: 'content_copy',
  paste: 'content_paste',
  delete: 'delete',
  sort: 'sort',
  view: 'grid_view',
  open: 'open_in_new',
  refresh: 'refresh',
  search: 'search',
  
  // Storage
  storage: 'storage',
  storageTotal: 'sd_card',
  storageAvailable: 'sd_card',
};

/**
 * Get icon class string for Material Symbols
 * @param {string} iconName - Key from ICONS object
 * @returns {string} Complete class string for span element
 */
export function getIconClass(iconName) {
  const icon = ICONS[iconName] || 'help';
  return `material-symbols-rounded">${icon}`;
}

/**
 * Get Material Symbol icon HTML string
 * @param {string} iconName - Key from ICONS object  
 * @param {string} wrapperTag - HTML tag to wrap icon (default: span)
 * @returns {string} HTML string
 */
export function getIconHTML(iconName, wrapperTag = 'span') {
  const icon = ICONS[iconName] || 'help';
  return `<${wrapperTag} class="material-symbols-rounded">${icon}</${wrapperTag}>`;
}

/**
 * Get icon with custom class prefix for colored variants
 * @param {string} iconName - Key from ICONS object
 * @param {string} colorClass - Color variant (blue, purple, green, orange, gray)
 * @returns {string} HTML string with icon and color class
 */
export function getColoredIcon(iconName, colorClass = '') {
  const icon = ICONS[iconName] || 'help';
  const classAttr = colorClass ? ` class="material-symbols-rounded ${colorClass}"` : '';
  return `<span${classAttr}>${icon}</span>`;
}

// Color variants for tools (can be imported separately if needed)
export const ICON_COLORS = {
  blue: '#2563eb',
  purple: '#9333ea',
  green: '#16a34a',
  orange: '#ea580c',
  gray: '#4b5563',
  red: '#dc2626',
  yellow: '#f59e0b',
  teal: '#0d9488',
};