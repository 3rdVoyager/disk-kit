// Import icon configuration
import { ICONS, getIconHTML } from './config/icons.js';

const toolContent = {
  home: null, // Will be loaded from saved HTML
  "browse-files": `
    <div class="dashboard-grid">
      <!-- File Browser Card -->
      <div class="dashboard-card file-browser-card">
        <div class="browser-toolbar">
          <div class="toolbar-left">
            <button class="btn-tool" title="New">
              <span class="material-symbols-rounded">add</span>
            </button>
            <button class="btn-tool" title="Cut">
              <span class="material-symbols-rounded">content_cut</span>
            </button>
            <button class="btn-tool" title="Copy">
              <span class="material-symbols-rounded">content_copy</span>
            </button>
            <button class="btn-tool" title="Paste">
              <span class="material-symbols-rounded">content_paste</span>
            </button>
            <button class="btn-tool" title="Delete">
              <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" title="Sort">
              <span class="material-symbols-rounded">sort</span>
            </button>
            <button class="btn-icon" title="View">
              <span class="material-symbols-rounded">grid_view</span>
            </button>
          </div>
        </div>
        <div class="file-list-header">
          <span class="col-name">Name</span>
          <span class="col-date">Date Modified</span>
          <span class="col-type">Type</span>
          <span class="col-size">Size</span>
        </div>
        <ul class="file-list" id="file-list">
          <!-- Files will be loaded here -->
        </ul>
      </div>

      <!-- File Details Panel -->
      <div class="dashboard-card details-card">
        <div class="details-header">
          <div class="file-thumbnail">
            <span class="material-symbols-rounded">insert_drive_file</span>
          </div>
          <div class="file-info">
            <h3 id="detail-filename">Select a file</h3>
            <p class="file-type" id="detail-filetype">--</p>
          </div>
        </div>
        <div class="details-meta">
          <div class="meta-row">
            <span class="meta-label">Location</span>
            <span class="meta-value" id="detail-location">--</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Size</span>
            <span class="meta-value" id="detail-size">--</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date Modified</span>
            <span class="meta-value" id="detail-modified">--</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date Created</span>
            <span class="meta-value" id="detail-created">--</span>
          </div>
        </div>
        <div class="details-actions">
          <button class="btn-action">Open</button>
          <button class="btn-action">Open Containing Folder</button>
          <button class="btn-action">Copy Path</button>
        </div>
      </div>
    </div>
  `,
  rename: `
    <h2>Rename</h2>
    <p>Batch rename your files with this simple tool.</p>
  `,
  convert: `
    <h2>Convert</h2>
    <p>Convert file formats (images, documents, audio, video).</p>
  `,
  compress: `
    <h2>Compress</h2>
    <p>Use this tool to compress your files.</p>
  `,
  cleanup: `
    <h2>Cleanup</h2>
    <p>Find and remove duplicate files, empty folders, and temporary files.</p>
  `,
  "ai-rename": `
    <h2>AI Rename</h2>
    <p>Use AI to intelligently rename files based on their content.</p>
  `,
  "ai-cleanup": `
    <h2>AI Cleanup</h2>
    <p>AI-powered cleanup suggestions for your storage.</p>
  `,
  alltools: `
    <div class="all-tools-container">
      <h2>All Tools</h2>
      <p class="all-tools-subtitle">Explore the complete toolkit. Hover over a tool to add it to Quick Tools.</p>
      
      <!-- File Operations Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">File Operations</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="rename">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="rename" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon blue"><span class="material-symbols-rounded">edit</span></div>
            <div class="tool-card-info">
              <h4>Batch Rename</h4>
              <p>Rename multiple files at once</p>
            </div>
          </div>
          <div class="tool-card" data-tool="move">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="move">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon teal"><span class="material-symbols-rounded">drive_file_move</span></div>
            <div class="tool-card-info">
              <h4>Move Files</h4>
              <p>Transfer files between folders</p>
            </div>
          </div>
          <div class="tool-card" data-tool="copy">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="copy">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon blue"><span class="material-symbols-rounded">content_copy</span></div>
            <div class="tool-card-info">
              <h4>Copy Files</h4>
              <p>Duplicate files to another location</p>
            </div>
          </div>
          <div class="tool-card" data-tool="delete">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="delete">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon red"><span class="material-symbols-rounded">delete</span></div>
            <div class="tool-card-info">
              <h4>Delete Files</h4>
              <p>Permanently remove selected files</p>
            </div>
          </div>
          <div class="tool-card" data-tool="split">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="split">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">call_split</span></div>
            <div class="tool-card-info">
              <h4>Split Files</h4>
              <p>Divide large files into smaller parts</p>
            </div>
          </div>
          <div class="tool-card" data-tool="merge">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="merge">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon teal"><span class="material-symbols-rounded">call_merge</span></div>
            <div class="tool-card-info">
              <h4>Merge Files</h4>
              <p>Combine multiple files into one</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversion Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Conversion</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="convert">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="convert" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">transform</span></div>
            <div class="tool-card-info">
              <h4>Format Converter</h4>
              <p>Convert between file formats</p>
            </div>
          </div>
          <div class="tool-card" data-tool="image-convert">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="image-convert">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon orange"><span class="material-symbols-rounded">image</span></div>
            <div class="tool-card-info">
              <h4>Image Converter</h4>
              <p>Convert image formats (JPG, PNG, WebP)</p>
            </div>
          </div>
          <div class="tool-card" data-tool="video-convert">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="video-convert">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">movie</span></div>
            <div class="tool-card-info">
              <h4>Video Converter</h4>
              <p>Convert video formats and codecs</p>
            </div>
          </div>
          <div class="tool-card" data-tool="audio-convert">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="audio-convert">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon green"><span class="material-symbols-rounded">music_note</span></div>
            <div class="tool-card-info">
              <h4>Audio Converter</h4>
              <p>Convert audio formats (MP3, FLAC, WAV)</p>
            </div>
          </div>
          <div class="tool-card" data-tool="doc-convert">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="doc-convert">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon yellow"><span class="material-symbols-rounded">description</span></div>
            <div class="tool-card-info">
              <h4>Document Converter</h4>
              <p>Convert documents (PDF, DOCX, TXT)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Compression Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Compression</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="compress">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="compress" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon orange"><span class="material-symbols-rounded">inventory_2</span></div>
            <div class="tool-card-info">
              <h4>Compress Files</h4>
              <p>Create ZIP, RAR, or 7z archives</p>
            </div>
          </div>
          <div class="tool-card" data-tool="extract">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="extract">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon teal"><span class="material-symbols-rounded">folder_open</span></div>
            <div class="tool-card-info">
              <h4>Extract Archives</h4>
              <p>Unzip and extract compressed files</p>
            </div>
          </div>
          <div class="tool-card" data-tool="iso-mount">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="iso-mount">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon gray"><span class="material-symbols-rounded">album</span></div>
            <div class="tool-card-info">
              <h4>Mount ISO</h4>
              <p>Mount disk image files</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cleanup Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Cleanup & Optimization</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="cleanup">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="cleanup" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon green"><span class="material-symbols-rounded">cleaning_services</span></div>
            <div class="tool-card-info">
              <h4>System Cleanup</h4>
              <p>Remove temporary and cache files</p>
            </div>
          </div>
          <div class="tool-card" data-tool="duplicates">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="duplicates" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon green"><span class="material-symbols-rounded">find_replace</span></div>
            <div class="tool-card-info">
              <h4>Duplicate Finder</h4>
              <p>Find and remove duplicate files</p>
            </div>
          </div>
          <div class="tool-card" data-tool="empty-folders">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="empty-folders" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon green"><span class="material-symbols-rounded">delete_sweep</span></div>
            <div class="tool-card-info">
              <h4>Empty Folders</h4>
              <p>Remove empty directories</p>
            </div>
          </div>
          <div class="tool-card" data-tool="large-files">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="large-files" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon orange"><span class="material-symbols-rounded">storage</span></div>
            <div class="tool-card-info">
              <h4>Large Files</h4>
              <p>Find files taking up space</p>
            </div>
          </div>
          <div class="tool-card" data-tool="old-files">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="old-files">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon yellow"><span class="material-symbols-rounded">schedule</span></div>
            <div class="tool-card-info">
              <h4>Old Files</h4>
              <p>Identify files not accessed recently</p>
            </div>
          </div>
          <div class="tool-card" data-tool="temp-files">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="temp-files">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon gray"><span class="material-symbols-rounded">thermostat</span></div>
            <div class="tool-card-info">
              <h4>Temp Files</h4>
              <p>Clean up temporary system files</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Organization Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Organization</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="organize">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="organize" checked>
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">auto_fix_high</span></div>
            <div class="tool-card-info">
              <h4>Smart Organize</h4>
              <p>Auto-sort files into folders</p>
            </div>
          </div>
          <div class="tool-card" data-tool="sort">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="sort">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon blue"><span class="material-symbols-rounded">sort</span></div>
            <div class="tool-card-info">
              <h4>Sort Files</h4>
              <p>Sort by name, date, size, type</p>
            </div>
          </div>
          <div class="tool-card" data-tool="deduplicate">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="deduplicate">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon teal"><span class="material-symbols-rounded">filter_list</span></div>
            <div class="tool-card-info">
              <h4>Deduplicate</h4>
              <p>Remove exact file duplicates</p>
            </div>
          </div>
          <div class="tool-card" data-tool="tag">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="tag">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">label</span></div>
            <div class="tool-card-info">
              <h4>Tag Files</h4>
              <p>Add tags and labels to files</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Media Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Media</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="resize">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="resize">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon blue"><span class="material-symbols-rounded">photo_size_select_large</span></div>
            <div class="tool-card-info">
              <h4>Resize Images</h4>
              <p>Batch resize and crop images</p>
            </div>
          </div>
          <div class="tool-card" data-tool="watermark">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="watermark">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon purple"><span class="material-symbols-rounded">water_drop</span></div>
            <div class="tool-card-info">
              <h4>Watermark</h4>
              <p>Add watermarks to images</p>
            </div>
          </div>
          <div class="tool-card" data-tool="thumbnail">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="thumbnail">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon green"><span class="material-symbols-rounded">grid_on</span></div>
            <div class="tool-card-info">
              <h4>Thumbnail Generator</h4>
              <p>Generate image thumbnails</p>
            </div>
          </div>
          <div class="tool-card" data-tool="metadata">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="metadata">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon gray"><span class="material-symbols-rounded">info</span></div>
            <div class="tool-card-info">
              <h4>Metadata Viewer</h4>
              <p>View and edit EXIF and file metadata</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Tools Grid -->
      <div class="tools-section">
        <h3 class="tools-section-title">Advanced</h3>
        <div class="tools-grid">
          <div class="tool-card" data-tool="checksum">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="checksum">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon yellow"><span class="material-symbols-rounded">fingerprint</span></div>
            <div class="tool-card-info">
              <h4>Checksum</h4>
              <p>Calculate MD5, SHA-256 hashes</p>
            </div>
          </div>
          <div class="tool-card" data-tool="encrypt">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="encrypt">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon teal"><span class="material-symbols-rounded">lock</span></div>
            <div class="tool-card-info">
              <h4>Encrypt Files</h4>
              <p>Secure files with encryption</p>
            </div>
          </div>
          <div class="tool-card" data-tool="sync">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="sync">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon blue"><span class="material-symbols-rounded">sync</span></div>
            <div class="tool-card-info">
              <h4>File Sync</h4>
              <p>Sync files between directories</p>
            </div>
          </div>
          <div class="tool-card" data-tool="secure-delete">
            <label class="tool-card-checkbox">
              <input type="checkbox" class="quick-tool-toggle" data-tool="secure-delete">
              <span class="checkmark"></span>
            </label>
            <div class="tool-card-icon red"><span class="material-symbols-rounded">verified</span></div>
            <div class="tool-card-info">
              <h4>Secure Delete</h4>
              <p>Permanently erase with overwrite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};

// DOM elements
const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
const quickToolsList = document.getElementById('quick-tools');
let originalHomeHTML = '';

// Quick Tools state management
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

function renderQuickTools() {
  const tools = getQuickTools();
  
  // Clear current quick tools list
  quickToolsList.innerHTML = '';
  
  if (tools.length === 0) {
    // If no tools selected, leave the list empty
    return;
  }
  
  // Map tool IDs to their display info
  const toolMap = {
    'rename': { icon: 'edit', label: 'Rename' },
    'move': { icon: 'drive_file_move', label: 'Move Files' },
    'copy': { icon: 'content_copy', label: 'Copy Files' },
    'delete': { icon: 'delete', label: 'Delete Files' },
    'split': { icon: 'call_split', label: 'Split Files' },
    'merge': { icon: 'call_merge', label: 'Merge Files' },
    'convert': { icon: 'transform', label: 'Convert' },
    'image-convert': { icon: 'image', label: 'Image Convert' },
    'video-convert': { icon: 'movie', label: 'Video Convert' },
    'audio-convert': { icon: 'music_note', label: 'Audio Convert' },
    'doc-convert': { icon: 'description', label: 'Doc Convert' },
    'compress': { icon: 'inventory_2', label: 'Compress' },
    'extract': { icon: 'folder_open', label: 'Extract' },
    'iso-mount': { icon: 'album', label: 'Mount ISO' },
    'cleanup': { icon: 'cleaning_services', label: 'Cleanup' },
    'duplicates': { icon: 'find_replace', label: 'Duplicates' },
    'empty-folders': { icon: 'delete_sweep', label: 'Empty Folders' },
    'large-files': { icon: 'storage', label: 'Large Files' },
    'old-files': { icon: 'schedule', label: 'Old Files' },
    'temp-files': { icon: 'thermostat', label: 'Temp Files' },
    'organize': { icon: 'auto_fix_high', label: 'Organize' },
    'sort': { icon: 'sort', label: 'Sort' },
    'deduplicate': { icon: 'filter_list', label: 'Deduplicate' },
    'tag': { icon: 'label', label: 'Tag' },
    'resize': { icon: 'photo_size_select_large', label: 'Resize' },
    'watermark': { icon: 'water_drop', label: 'Watermark' },
    'thumbnail': { icon: 'grid_on', label: 'Thumbnails' },
    'metadata': { icon: 'info', label: 'Metadata' },
    'checksum': { icon: 'fingerprint', label: 'Checksum' },
    'encrypt': { icon: 'lock', label: 'Encrypt' },
    'sync': { icon: 'sync', label: 'Sync' },
    'secure-delete': { icon: 'verified', label: 'Secure Delete' }
  };
  
  tools.forEach(toolId => {
    const tool = toolMap[toolId];
    if (!tool) return;
    
    const li = document.createElement('li');
    li.innerHTML = `<a class="nav-link" href="#${toolId}"><span class="nav-icon material-symbols-rounded">${tool.icon}</span><span class="nav-text">${tool.label}</span></a>`;
    quickToolsList.appendChild(li);
  });
  
}

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
}

// Initialize: Set active state, store home HTML, and load mock files
function init() {
  // Store the original home page HTML for fast restoration
  originalHomeHTML = contentSection.innerHTML;
  
  // Set the first nav link as active if the list is not empty
  if (navLinks.length > 0) {
    navLinks[0].classList.add('selected');
  }
  
  // Render quick tools in sidebar
  renderQuickTools();
  
  // Load mock file browser data
  const fileList = document.getElementById('file-list');
  if (fileList) {
    loadFileBrowser();
  }
}

// Load content for a given tool
function loadContent(toolName) {
  if (toolName === 'home') {
    // Restore the original home HTML from memory (instant, no re-parsing)
    contentSection.innerHTML = originalHomeHTML;
    return;
  }
  
  const content = toolContent[toolName];
  if (!content) {
    contentSection.innerHTML = `<h2>Tool Coming Soon</h2><p>This feature is under development.</p>`;
    return;
  }
  
  if (toolName === 'browse-files') {
    // Load the file browser view
    contentSection.innerHTML = content;
    // Initialize file browser after the DOM is updated
    setTimeout(() => {
      loadFileBrowser();
    }, 0);
    return;
  }
  
  contentSection.innerHTML = content;
  
  // Attach event listeners to quick tool toggles when viewing alltools
  if (toolName === 'alltools') {
    attachToggleListeners();
  }
}

// Attach event listeners to checkboxes
function attachToggleListeners() {
  const toggles = document.querySelectorAll('.quick-tool-toggle');
  toggles.forEach(toggle => {
    // Remove old listener by cloning
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    newToggle.addEventListener('change', (e) => {
      const toolId = e.target.getAttribute('data-tool');
      toggleQuickTool(toolId, e.target.checked);
    });
  });
}

// Handle navigation clicks
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent page jump from #hash

      const toolName = this.getAttribute('href').substring(1); // Remove the #

      // Update content
      loadContent(toolName);

      // Update selected state
      navLinks.forEach(l => l.classList.remove('selected'));
      this.classList.add('selected');

      // Update browser history (optional but nice)
      history.pushState(null, null, `#${toolName}`);
    });
  });
}

// Toggle sidebar open/closed state
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

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupNavigation();
  setupMenuToggle();
});

async function loadFileBrowser(path = '') {
  // For now, mock data - later connect to backend
  const now = new Date();
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