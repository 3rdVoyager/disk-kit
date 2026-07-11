const COMING_SOON_TOOLS = {
  archive: {
    title: 'Archive & Extract',
    icon: 'inventory_2',
    text: 'Batch compress files into ZIP archives or extract multiple archives at once with conflict handling.'
  },
  'smart-sort': {
    title: 'Smart Sort',
    icon: 'auto_fix_high',
    text: 'Automatically organize files into folders based on file type, date, or custom rules.'
  },
  storage: {
    title: 'Storage Insights',
    icon: 'analytics',
    text: 'Visual breakdown of disk usage, including largest folders, file type distribution, and growth over time.'
  },
  search: {
    title: 'Global Search',
    icon: 'search',
    text: 'Powerful file search that scans your entire working directory with filters for size, date, and type.'
  }
};

export function setupComingSoonTool() {
  const hash = window.location.hash.slice(1);
  const toolId = hash.replace('coming-soon-', '');
  const tool = COMING_SOON_TOOLS[toolId];

  if (!tool) return;

  const titleEl = document.getElementById('coming-soon-tool-title');
  const displayTitleEl = document.getElementById('coming-soon-display-title');
  const iconEl = document.getElementById('coming-soon-tool-icon');
  const textEl = document.getElementById('coming-soon-tool-text');

  if (titleEl) titleEl.textContent = tool.title;
  if (displayTitleEl) displayTitleEl.textContent = tool.title + ' is on the way';
  if (iconEl) iconEl.textContent = tool.icon;
  if (textEl) textEl.textContent = tool.text;
}
