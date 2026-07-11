import { formatBytes } from '../utils.js';
export { formatBytes };

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
