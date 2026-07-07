const toolContent = {
  home: `
    <div class="bento-grid">
      <p class="reloading">Loading home...</p>
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
    // Reload file browser data since we just restored the HTML
    const fileList = document.getElementById('file-list');
    if (fileList) {
      loadFileBrowser();
    }
    return;
  }
  const content = toolContent[toolName] || `<h2>Tool Coming Soon</h2><p>This feature is under development.</p>`;
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
  const mockFiles = [
    { name: 'Documents', type: 'folder', size: '--' },
    { name: 'Downloads', type: 'folder', size: '--' },
    { name: 'Project', type: 'folder', size: '--' },
    { name: 'notes.txt', type: 'file', size: '2 KB' },
    { name: 'image.png', type: 'file', size: '1.4 MB' },
  ];

  const fileList = document.getElementById('file-list');
  fileList.innerHTML = mockFiles.map(file => `
    <li class="file-item" data-type="${file.type}" data-name="${file.name}">
      <span class="file-icon">📁</span>
      <span class="file-name">${file.name}</span>
      <span class="file-size">${file.size}</span>
    </li>
  `).join('');
}
