import { loadDetailedStorage, setupStorageRefreshButton, setupFolderScanPathPicker } from '../storage.js';
import { setWorkingPath } from '../utils.js';

export function setupStorageOverviewPage(navigateFn) {
  const onNavigate = async (folderPath) => {
    await setWorkingPath(folderPath, { persistSettings: false });
    navigateFn('browse-files');
  };

  setupStorageRefreshButton('detail-storage-refresh-btn', (options) =>
    loadDetailedStorage({ ...options, onNavigate }),
  );
  setupFolderScanPathPicker('detail-storage-browse-path-btn', (options) =>
    loadDetailedStorage({ ...options, onNavigate }),
  );
  loadDetailedStorage({ onNavigate });
}
