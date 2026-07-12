import { apiFetch, setLastPath } from '../utils.js';
import { openPathSelector } from './folder-picker.js';
import { applyTheme, DEFAULT_THEME } from '../theme.js';

const ONBOARDED_KEY = 'disk-kit-onboarded';
const SETUP_STEP_INDEX = 3;
const TOTAL_STEPS = 5;

let currentStep = 0;

function getElements() {
  return {
    dialog: document.getElementById('onboarding-dialog'),
    title: document.getElementById('onboarding-title'),
    progress: document.getElementById('onboarding-progress'),
    backBtn: document.getElementById('onboarding-back'),
    nextBtn: document.getElementById('onboarding-next'),
    closeBtn: document.getElementById('onboarding-close'),
    steps: document.querySelectorAll('.onboarding-step'),
    pathInput: document.getElementById('onboarding-default-path'),
    themeSelect: document.getElementById('onboarding-theme'),
    browseBtn: document.getElementById('onboarding-browse'),
    errorEl: document.getElementById('onboarding-error'),
  };
}

const STEP_TITLES = [
  'Welcome to Disk Kit',
  'Browse Files',
  'Your toolkit',
  'Set up your workspace',
  'Ready to go',
];

function showOnboardingError(message) {
  const { errorEl } = getElements();
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

async function loadOnboardingSettings() {
  const { pathInput, themeSelect } = getElements();
  try {
    const settings = await apiFetch('/api/settings');
    if (pathInput) {
      pathInput.value = settings?.general?.defaultPath || '';
    }
    if (themeSelect) {
      themeSelect.value = settings?.general?.theme || DEFAULT_THEME;
    }
  } catch (err) {
    console.error('Failed to load onboarding settings:', err);
  }
}

async function saveOnboardingSettings() {
  const { pathInput, themeSelect } = getElements();
  const defaultPath = pathInput?.value.trim() || '';
  const theme = themeSelect?.value || DEFAULT_THEME;

  if (!defaultPath) {
    showOnboardingError('Please choose a default folder before continuing.');
    return false;
  }

  try {
    const result = await apiFetch('/api/settings', {
      method: 'POST',
      body: {
        general: {
          defaultPath,
          theme,
        },
      },
    });
    applyTheme(theme);
    const savedPath = result.settings?.general?.defaultPath;
    if (savedPath) {
      setLastPath(savedPath);
    }
    showOnboardingError('');
    return true;
  } catch (err) {
    showOnboardingError(`Could not save settings: ${err.message}`);
    return false;
  }
}

function renderStep() {
  const { steps, title, progress, backBtn, nextBtn } = getElements();
  steps.forEach((el, i) => el.classList.toggle('active', i === currentStep));
  if (title) title.textContent = STEP_TITLES[currentStep];
  if (progress) progress.textContent = `Step ${currentStep + 1} of ${TOTAL_STEPS}`;
  if (backBtn) backBtn.disabled = currentStep === 0;
  if (nextBtn) nextBtn.textContent = currentStep === TOTAL_STEPS - 1 ? 'Finish' : 'Next';
  showOnboardingError('');
}

export function openOnboarding() {
  const { dialog } = getElements();
  if (!dialog) return;
  currentStep = 0;
  loadOnboardingSettings();
  renderStep();
  dialog.style.display = 'flex';
  requestAnimationFrame(() => dialog.classList.add('active'));
}

function closeOnboarding() {
  const { dialog } = getElements();
  if (!dialog) return;
  dialog.classList.remove('active');
  setTimeout(() => { dialog.style.display = 'none'; }, 300);
}

function finishOnboarding() {
  localStorage.setItem(ONBOARDED_KEY, 'true');
  closeOnboarding();
}

export function setupOnboarding() {
  const { backBtn, nextBtn, closeBtn, dialog, browseBtn, pathInput, themeSelect } = getElements();
  if (!dialog) return;

  document.getElementById('take-tour-btn')?.addEventListener('click', () => openOnboarding());

  browseBtn?.addEventListener('click', () => {
    openPathSelector((path) => {
      if (pathInput) pathInput.value = path;
    }, { startPath: pathInput?.value || '' });
  });

  themeSelect?.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  backBtn?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });

  nextBtn?.addEventListener('click', async () => {
    if (currentStep === SETUP_STEP_INDEX) {
      const saved = await saveOnboardingSettings();
      if (!saved) return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      currentStep += 1;
      renderStep();
    } else {
      finishOnboarding();
    }
  });

  closeBtn?.addEventListener('click', () => closeOnboarding());

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeOnboarding();
  });

  if (!localStorage.getItem(ONBOARDED_KEY)) {
    setTimeout(() => openOnboarding(), 500);
  }
}
