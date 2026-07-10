import { loadFileBrowser, FOLDER_PICKER_LIST_ID, goBack } from '../pages/browse-files.js';
import { getLastPath, resolveBrowserPath } from '../utils.js';

let pathSelectionCallback = null;

function closeFolderPicker() {
  const dialog = document.getElementById('folder-picker-dialog');
  if (!dialog) return;
  dialog.classList.remove('active');
  setTimeout(() => { dialog.style.display = 'none'; }, 300);
}

function setupFolderPickerListeners() {
  const closeBtn = document.getElementById('folder-picker-close');
  const cancelBtn = document.getElementById('folder-picker-cancel');
  const confirmBtn = document.getElementById('folder-picker-confirm');
  const backBtn = document.getElementById('folder-picker-back');

  if (closeBtn && !closeBtn.dataset.listener) {
    closeBtn.addEventListener('click', closeFolderPicker);
    closeBtn.dataset.listener = 'true';
  }
  if (cancelBtn && !cancelBtn.dataset.listener) {
    cancelBtn.addEventListener('click', closeFolderPicker);
    cancelBtn.dataset.listener = 'true';
  }
  if (confirmBtn && !confirmBtn.dataset.listener) {
    confirmBtn.addEventListener('click', () => {
      const pathDisplay = document.getElementById('folder-picker-current-path');
      const selectedPath = pathDisplay ? pathDisplay.textContent : '';
      if (selectedPath && pathSelectionCallback) {
        pathSelectionCallback(selectedPath);
      }
      closeFolderPicker();
    });
    confirmBtn.dataset.listener = 'true';
  }
  if (backBtn && !backBtn.dataset.listener) {
    backBtn.addEventListener('click', () => {
      if (backBtn.classList.contains('disabled')) return;
      goBack(FOLDER_PICKER_LIST_ID);
    });
    backBtn.dataset.listener = 'true';
  }
}

/**
 * Open the folder picker dialog.
 * @param {Function} callback - Function called with selected path
 * @param {{ startPath?: string }} options
 */
export function openPathSelector(callback, { startPath } = {}) {
  const dialog = document.getElementById('folder-picker-dialog');
  if (!dialog) return;

  pathSelectionCallback = callback;
  dialog.style.display = 'flex';
  requestAnimationFrame(() => dialog.classList.add('active'));

  resolveBrowserPath(startPath || getLastPath()).then((resolvedPath) => {
    loadFileBrowser(resolvedPath, FOLDER_PICKER_LIST_ID);
  });
  setupFolderPickerListeners();
}
