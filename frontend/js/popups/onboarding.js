const ONBOARDED_KEY = 'disk-kit-onboarded';
const TOTAL_STEPS = 4;

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
  };
}

const STEP_TITLES = [
  'Welcome to Disk Kit',
  'Browse Files',
  'Tools',
  'Ready to go',
];

function renderStep() {
  const { steps, title, progress, backBtn, nextBtn } = getElements();
  steps.forEach((el, i) => el.classList.toggle('active', i === currentStep));
  if (title) title.textContent = STEP_TITLES[currentStep];
  if (progress) progress.textContent = `Step ${currentStep + 1} of ${TOTAL_STEPS}`;
  if (backBtn) backBtn.disabled = currentStep === 0;
  if (nextBtn) nextBtn.textContent = currentStep === TOTAL_STEPS - 1 ? 'Finish' : 'Next';
}

export function openOnboarding() {
  const { dialog } = getElements();
  if (!dialog) return;
  currentStep = 0;
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
  const { backBtn, nextBtn, closeBtn, dialog } = getElements();
  if (!dialog) return;

  document.getElementById('take-tour-btn')?.addEventListener('click', () => openOnboarding());

  backBtn?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });

  nextBtn?.addEventListener('click', () => {
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
