export const storageKey = 'defuddle:playground:column-widths';
export const minimumWidth = 180;

export function setupPlaygroundColumns() {
  const columns = document.querySelector<HTMLElement>('.playground-columns')!;
  const panels = [...columns.querySelectorAll<HTMLElement>('.playground-panel')];
  const handles = [...columns.querySelectorAll<HTMLElement>('.playground-resizer')];
  const desktop = window.matchMedia('(min-width: 761px)');
  const widths = () => panels.map((panel) => panel.getBoundingClientRect().width);

  function apply(values: number[]) {
    const total = values.reduce((sum, value) => sum + value, 0);
    const shares = values.map((value) => value / total);
    columns.style.setProperty('--playground-tracks', shares.map((share) => `minmax(${minimumWidth}px, ${share}fr)`).join(' 1px '));
    updateHandles();
  }

  function save() {
    const values = widths();
    const total = values.reduce((sum, value) => sum + value, 0);
    try {
      localStorage.setItem(storageKey, JSON.stringify(values.map((value) => value / total)));
    } catch {
      // Resizing still works if storage is unavailable or full.
    }
  }

  function updateHandles() {
    const values = widths();
    handles.forEach((handle, index) => {
      const pairWidth = values[index] + values[index + 1];
      handle.setAttribute('aria-valuemin', String(Math.round(minimumWidth / pairWidth * 100)));
      handle.setAttribute('aria-valuemax', String(Math.round((pairWidth - minimumWidth) / pairWidth * 100)));
      handle.setAttribute('aria-valuenow', String(Math.round(values[index] / pairWidth * 100)));
      handle.setAttribute('aria-valuetext', `${Math.round(values[index])} pixels, ${Math.round(values[index + 1])} pixels`);
    });
  }

  function resize(index: number, values: number[], delta: number) {
    const pairWidth = values[index] + values[index + 1];
    const leftWidth = Math.min(pairWidth - minimumWidth, Math.max(minimumWidth, values[index] + delta));
    const next = [...values];
    next[index] = leftWidth;
    next[index + 1] = pairWidth - leftWidth;
    apply(next);
  }

  handles.forEach((handle, index) => {
    let drag: { pointerId: number; x: number; widths: number[] } | undefined;

    const finish = () => {
      if (!drag) return;
      const { pointerId } = drag;
      drag = undefined;
      columns.classList.remove('is-resizing');
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      if (desktop.matches) save();
    };

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.isPrimary || !desktop.matches) return;
      event.preventDefault();
      handle.focus();
      drag = { pointerId: event.pointerId, x: event.clientX, widths: widths() };
      handle.setPointerCapture(event.pointerId);
      columns.classList.add('is-resizing');
    });
    handle.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      resize(index, drag.widths, event.clientX - drag.x);
    });
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('lostpointercapture', finish);
    desktop.addEventListener('change', finish);

    handle.addEventListener('keydown', (event) => {
      if (!desktop.matches) return;
      const values = widths();
      const step = event.shiftKey ? 40 : 16;
      let delta: number;
      if (event.key === 'ArrowLeft') delta = -step;
      else if (event.key === 'ArrowRight') delta = step;
      else if (event.key === 'Home') delta = -values[index];
      else if (event.key === 'End') delta = values[index + 1];
      else return;
      event.preventDefault();
      resize(index, values, delta);
      save();
    });
    handle.addEventListener('dblclick', () => {
      if (!desktop.matches) return;
      const values = widths();
      resize(index, values, (values[index + 1] - values[index]) / 2);
      save();
    });
  });

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (Array.isArray(saved) && saved.length === panels.length && saved.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1)) apply(saved);
  } catch {
    // Keep equal columns if storage is unavailable or invalid.
  }
  new ResizeObserver(() => { if (desktop.matches) updateHandles(); }).observe(columns);
}
