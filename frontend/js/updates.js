import { apiFetch } from './utils.js';
import {
  isUpdateAvailable,
  normalizeVersion,
  resolveAppVersion,
} from './version.js';

const DISMISSED_UPDATE_KEY = 'disk-kit-dismissed-update';
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/3rdVoyager/disk-kit/releases/latest';
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/3rdVoyager/disk-kit/main/docs/release/version.json';
const RELEASES_PAGE_URL = 'https://github.com/3rdVoyager/disk-kit/releases/latest';

async function fetchRemoteManifest(localVersion) {
  try {
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (response.ok) {
      const data = await response.json();
      const version = normalizeVersion(data.tag_name);
      if (version) {
        return {
          version,
          downloadUrl: data.html_url,
          notes: (data.body || '').split('\n').find((line) => line.trim()) || '',
        };
      }
    }
  } catch {
    // Fall through to next source.
  }

  try {
    const response = await fetch(REMOTE_VERSION_URL);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        version: normalizeVersion(data.version),
      };
    }
  } catch {
    // Fall through to bundled manifest.
  }

  try {
    const data = await apiFetch('/api/update-manifest');
    return {
      ...data,
      version: normalizeVersion(data.version),
    };
  } catch {
    return {
      version: normalizeVersion(localVersion),
      downloadUrl: RELEASES_PAGE_URL,
      notes: '',
    };
  }
}

function hideUpdateBanner() {
  document.getElementById('update-banner')?.remove();
  document.body.classList.remove('has-update-banner');
}

export async function checkForUpdates(manual = false) {
  try {
    const localVersion = await resolveAppVersion();
    if (!localVersion) {
      if (manual) alert('Could not determine the installed version. Restart the app and try again.');
      return;
    }

    const remoteData = await fetchRemoteManifest(localVersion);
    const remoteVersion = normalizeVersion(remoteData.version);

    if (!isUpdateAvailable(localVersion, remoteVersion)) {
      hideUpdateBanner();
      if (manual) alert(`You are up to date! (v${localVersion})`);
      return;
    }

    const dismissedVersion = normalizeVersion(localStorage.getItem(DISMISSED_UPDATE_KEY));
    if (manual || dismissedVersion !== remoteVersion) {
      showUpdateBanner(remoteData, localVersion);
    }
  } catch (err) {
    console.error('Update check failed:', err);
    if (manual) alert(`Failed to check for updates: ${err.message}`);
  }
}

function showUpdateBanner(data, localVersion) {
  const remoteVersion = normalizeVersion(data.version);
  if (!isUpdateAvailable(localVersion, remoteVersion)) {
    hideUpdateBanner();
    return;
  }

  let banner = document.getElementById('update-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    document.querySelector('main')?.prepend(banner);
  }

  document.body.classList.add('has-update-banner');

  banner.innerHTML = `
    <div class="update-banner-content">
      <span class="material-symbols-rounded">download_for_offline</span>
      <p><strong>Version ${remoteVersion} is available!</strong> You are on v${normalizeVersion(localVersion)}. ${data.notes || ''}</p>
      <div class="update-banner-actions">
        <a href="${data.downloadUrl}" target="_blank" class="btn-banner-primary">Download</a>
        <button class="btn-banner-close" id="dismiss-update">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('dismiss-update')?.addEventListener('click', () => {
    localStorage.setItem(DISMISSED_UPDATE_KEY, remoteVersion);
    hideUpdateBanner();
  });
}
