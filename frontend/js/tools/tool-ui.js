export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function renderToolResultList(container, items, renderItem) {
  if (!container) return;
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="tool-summary">No results found.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'tool-results-list';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `tool-results-item ${item.status || ''}`.trim();
    li.innerHTML = renderItem(item);
    list.appendChild(li);
  });
  container.innerHTML = '';
  container.appendChild(list);
}
