/** Segmented step navigation — one panel visible at a time. */
export function setupToolSteps(root, {
  navSelector = '.tool-step-nav',
  tabSelector = '.tool-step-tab',
  panelSelector = '.tool-step-panel',
} = {}) {
  const nav = root.querySelector(navSelector);
  if (!nav) return;

  const tabs = Array.from(nav.querySelectorAll(tabSelector));
  const panels = root.querySelectorAll(panelSelector);
  if (!tabs.length || !panels.length) return;

  const stepIds = tabs.map((tab) => tab.dataset.step);
  const nextBtn = root.querySelector('.tool-step-next');
  const backBtn = root.querySelector('.tool-step-back');
  const finalActions = root.querySelector('.tool-step-final-actions');

  const activate = (stepId) => {
    const index = stepIds.indexOf(stepId);
    if (index < 0) return;

    tabs.forEach((tab) => {
      const active = tab.dataset.step === stepId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      const active = panel.dataset.step === stepId;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });

    const isFirst = index === 0;
    const isLast = index === stepIds.length - 1;

    if (backBtn) backBtn.hidden = isFirst;
    if (nextBtn) nextBtn.hidden = isLast;
    if (finalActions) finalActions.hidden = !isLast;
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.step));
  });

  nextBtn?.addEventListener('click', () => {
    const current = stepIds.findIndex((id) => nav.querySelector(`${tabSelector}.active`)?.dataset.step === id);
    if (current >= 0 && current < stepIds.length - 1) activate(stepIds[current + 1]);
  });

  backBtn?.addEventListener('click', () => {
    const current = stepIds.findIndex((id) => nav.querySelector(`${tabSelector}.active`)?.dataset.step === id);
    if (current > 0) activate(stepIds[current - 1]);
  });

  const initial = nav.querySelector(`${tabSelector}.active`)?.dataset.step || stepIds[0];
  if (initial) activate(initial);
}

/** Pill chip row synced to a hidden <select>. */
export function setupChipSelect({ groupSelector, selectId }) {
  const select = document.getElementById(selectId);
  const group = document.querySelector(groupSelector);
  if (!select || !group) return;

  const chips = group.querySelectorAll('.chip-option');

  const syncFromSelect = () => {
    chips.forEach((chip) => {
      chip.classList.toggle('active', select.value === chip.dataset.value);
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      select.value = chip.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncFromSelect();
    });
  });

  select.hidden = true;
  syncFromSelect();
}
