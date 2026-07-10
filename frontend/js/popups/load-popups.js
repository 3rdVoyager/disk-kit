const POPUP_FILES = ['onboarding', 'folder-picker'];

export async function loadPopups() {
  await Promise.all(POPUP_FILES.map(async (name) => {
    const response = await fetch(`html/popups/${name}.html`);
    if (!response.ok) {
      throw new Error(`Could not load popup: ${name}`);
    }
    document.body.insertAdjacentHTML('beforeend', await response.text());
  }));
}
