export function setupPlaygroundTabs() {
  const root = document.querySelector<HTMLElement>('.playground')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-playground-tab]')];
  const mobile = window.matchMedia('(max-width: 760px)');

  const update = () => {
    tabs.forEach((tab) => {
      const name = tab.dataset.playgroundTab!;
      const selected = root.dataset.activePanel === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(`${name}-panel`)!;
      if (mobile.matches) panel.setAttribute('role', 'tabpanel');
      else panel.removeAttribute('role');
      panel.setAttribute('aria-labelledby', `${name}-${mobile.matches ? 'tab' : 'heading'}`);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      root.dataset.activePanel = tab.dataset.playgroundTab;
      update();
    });
    tab.addEventListener('keydown', (event) => {
      let next: number;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    });
  });
  mobile.addEventListener('change', update);
  update();
}
