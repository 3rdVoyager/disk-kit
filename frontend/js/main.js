const toolContent = {
  home: null, // Will be loaded from saved HTML
  "browse-files": `
    <div class="bento-grid">
      <!-- File Browser Card -->
      <div class="bento-card file-browser-card">
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
      <div class="bento-card details-card">
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
};

// DOM elements
const contentSection = document.getElementById('content');
const navLinks = document.querySelectorAll('#sidebar a');
let originalHomeHTML = '';

// Initialize: Set active state, store home HTML, and load mock files
function init() {
  // Store the original home page HTML for fast restoration
  originalHomeHTML = contentSection.innerHTML;
  
  // Set the first nav link as active if the list is not empty
  if (navLinks.length > 0) {
    navLinks[0].classList.add('selected');
  }
  
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

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupNavigation();
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
