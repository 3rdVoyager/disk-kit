const COMING_SOON_TOOLS = {
  'empty-folders': {
    title: 'Empty Folder Finder',
    icon: 'folder_off',
    text: 'Scan for empty folders and remove them in batch to reclaim clutter without digging through directories manually.',
  },
  documents: {
    title: 'Document Conversion',
    icon: 'description',
    text: 'Convert PDFs to images, images to PDF, and plain text to PDF — extending the Convert Files tool beyond images.',
  },
  'smart-sort': {
    title: 'Smart Sort',
    icon: 'auto_fix_high',
    text: 'Automatically organize files into folders based on file type, date, or custom rules.',
  },
  storage: {
    title: 'Storage Insights',
    icon: 'analytics',
    text: 'Visual breakdown of disk usage, including largest folders, file type distribution, and growth over time.',
  },
};

export function setupComingSoonTool() {
  const hash = window.location.hash.slice(1);
  const toolId = hash.replace('coming-soon-', '');
  const tool = COMING_SOON_TOOLS[toolId];

  if (!tool) return;

  const titleEl = document.getElementById('coming-soon-tool-title');
  const iconEl = document.getElementById('coming-soon-tool-icon');
  const textEl = document.getElementById('coming-soon-tool-text');

  if (titleEl) titleEl.textContent = tool.title;
  if (iconEl) iconEl.textContent = tool.icon;
  if (textEl) textEl.textContent = tool.text;
}
