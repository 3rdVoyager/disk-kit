import { apiFetch } from './utils.js';

const DISMISSED_UPDATE_KEY = 'disk-kit-dismissed-update';
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/3rdVoyager/disk-kit/main/docs/release/version.json';

/**
 * Very basic semver compare: returns 1 if v2 > v1, -1 if v1 > v2, 0 if equal.
 */
function compareVersions(v1, v2) {
  const p1 = v1.replace(/^v/, '').split('.').map(Number);
  const p2 = v2.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n2 > n1) return 1;
    if (n1 > n2) return -1;
  }
  return 0;
}

export async function checkForUpdates(manual = false) {
  try {
    // 1. Get local version from backend
    const localData = await apiFetch('/api/version');
    const localVersion = localData.version;

    // 2. Fetch remote manifest
    // In a real app, you'd use a stable URL. For this demo, we'll try the GitHub raw link.
    const response = await fetch(REMOTE_VERSION_URL);
    if (!response.ok) throw new Error('Could not reach update server');
    const remoteData = await response.json();

    const updateAvailable = compareVersions(localVersion, remoteData.version) > 0;

    if (updateAvailable) {
      const dismissedVersion = localStorage.getItem(DISMISSED_UPDATE_KEY);
      if (manual || dismissedVersion !== remoteData.version) {
        showUpdateBanner(remoteData);
      }
    } else if (manual) {
      alert(`You are up to date! (v${localVersion})`);
    }
  } catch (err) {
    console.error('Update check failed:', err);
    if (manual) alert('Failed to check for updates: ' + err.message);
  }
}

function showUpdateBanner(data) {
  let banner = document.getElementById('update-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    const header = document.querySelector('header') || document.querySelector('.global-header');
    header?.after(banner);
  }

  document.body.classList.add('has-update-banner');

  banner.innerHTML = `
    <div class="update-banner-content">
      <span class="material-symbols-rounded">download_for_offline</span>
      <p><strong>Version ${data.version} is available!</strong> ${data.notes || ''}</p>
      <div class="update-banner-actions">
        <a href="${data.downloadUrl}" target="_blank" class="btn-banner-primary">Download</a>
        <button class="btn-banner-close" id="dismiss-update">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('dismiss-update')?.addEventListener('click', () => {
    localStorage.setItem(DISMISSED_UPDATE_KEY, data.version);
    banner.remove();
    document.body.classList.remove('has-update-banner');
  });
}
