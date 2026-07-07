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
  menu: 'menu',
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
 * Icon Color Mapping
 * Maps each icon key to a consistent color.
 * Change a color here and it updates that icon EVERYWHERE in the app.
 * 
 * Color categories (for reference):
 *   blue   - navigation, editing, info
 *   purple - AI, transformations, smart features
 *   green  - cleaning, finding, positive actions
 *   orange - storage, compression, warnings
 *   gray   - utilities, meta, neutral
 *   red    - destructive actions, errors
 *   yellow - folders, warnings
 *   teal   - audio/media
 */
export const ICON_COLORS = {
  // === TOOLS ===
  rename: 'blue',
  convert: 'purple',
  compress: 'orange',
  cleanup: 'green',
  organize: 'purple',
  duplicateFinder: 'green',
  emptyFolders: 'green',
  largeFiles: 'orange',

  // === SUGGESTED ACTIONS ===
  organizeDownloads: 'purple',
  compressProjects: 'orange',
  removeDuplicates: 'green',
  batchRenamePhotos: 'blue',
  reviewLargeFiles: 'orange',

  // === FILE TYPES ===
  folder: 'yellow',
  file: 'gray',
  image: 'blue',
  video: 'purple',
  document: 'green',
  audio: 'teal',
  archive: 'orange',
  code: 'purple',

  // === NAVIGATION ===
  home: 'blue',
  files: 'yellow',
  allTools: 'gray',
  settings: 'gray',
  history: 'gray',
  trash: 'red',

  // === OPERATIONS ===
  renamed: 'blue',
  converted: 'purple',
  compressed: 'orange',
  duplicateFound: 'green',
  cleaned: 'green',

  // === COMMON ACTIONS ===
  add: 'green',
  cut: 'gray',
  copy: 'gray',
  paste: 'blue',
  delete: 'red',
  sort: 'gray',
  view: 'gray',
  open: 'blue',
  refresh: 'blue',
  search: 'blue',

  // === STORAGE ===
  storage: 'orange',
  storageTotal: 'blue',
  storageAvailable: 'green',
};

/**
 * Background color hex values for each color key.
 * Change these to update the actual background colors across the app.
 */
export const ICON_BG_HEX = {
  blue: '#2563eb',
  purple: '#9333ea',
  green: '#16a34a',
  orange: '#ea580c',
  gray: '#4b5563',
  red: '#dc2626',
  yellow: '#f59e0b',
  teal: '#0d9488',
};

/**
 * Get the color name for a given icon key
 * @param {string} iconKey - Key from ICONS/ICON_COLORS (e.g., 'rename', 'folder')
 * @returns {string} Color name (e.g., 'blue', 'purple')
 */
export function getIconColor(iconKey) {
  return ICON_COLORS[iconKey] || 'gray';
}

/**
 * Get the CSS color class for a given icon key
 * Use this in HTML templates to get the correct color class name
 * @param {string} iconKey - Key from ICONS/ICON_COLORS
 * @returns {string} CSS class name (e.g., 'blue', 'purple')
 */
export function getIconColorClass(iconKey) {
  return getIconColor(iconKey);
}

/**
 * Get the background hex color for a given icon key
 * @param {string} iconKey - Key from ICONS/ICON_COLORS
 * @returns {string} Hex color string
 */
export function getIconBgHex(iconKey) {
  const colorName = getIconColor(iconKey);
  return ICON_BG_HEX[colorName] || ICON_BG_HEX.gray;
}

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

/**
 * Generate full icon HTML with a colored background container
 * Automatically uses the color defined in ICON_COLORS for the given icon key.
 * @param {string} iconKey - Key from ICONS object (e.g., 'rename', 'folder')
 * @param {object} options - Optional settings
 * @param {string} options.containerClass - Additional CSS class for the container
 * @param {number} options.size - Container size in px (default: 40)
 * @param {number} options.iconSize - Icon font size in rem (default: 1.4)
 * @returns {string} HTML string for the icon with colored background
 */
export function getIconWithBg(iconKey, options = {}) {
  const icon = ICONS[iconKey] || 'help';
  const bgColor = getIconBgHex(iconKey);
  const containerClass = options.containerClass || '';
  const size = options.size || 40;
  const iconSize = options.iconSize || 1.4;

  return `<div class="${containerClass}" style="width:${size}px;height:${size}px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background-color:${bgColor};">
    <span class="material-symbols-rounded" style="font-size:${iconSize}rem;color:white;">${icon}</span>
  </div>`;
}