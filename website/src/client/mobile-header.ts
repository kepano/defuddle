export function setupMobileHeader() {
  const header = document.querySelector<HTMLElement>('[data-scroll-header]');
  const slot = header?.closest<HTMLElement>('[data-scroll-header-slot]');
  if (!header || !slot) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  const transitionDuration = 240;
  let previousScrollY = window.scrollY;
  let frame = 0;
  let revealFrame = 0;
  let dismissTimer = 0;
  let keepVisibleForHeading = false;

  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--mobile-header-height', `${header.getBoundingClientRect().height}px`);
  }).observe(header);

  const reset = () => {
    if (revealFrame) window.cancelAnimationFrame(revealFrame);
    if (dismissTimer) window.clearTimeout(dismissTimer);
    revealFrame = 0;
    dismissTimer = 0;
    header.classList.remove('is-header-floating', 'is-header-visible');
    slot.style.removeProperty('height');
  };
  const reveal = () => {
    if (!mobile.matches) return;
    if (dismissTimer) window.clearTimeout(dismissTimer);
    dismissTimer = 0;
    if (!header.classList.contains('is-header-floating')) {
      slot.style.height = `${slot.offsetHeight}px`;
      header.classList.add('is-header-floating');
      void header.offsetHeight;
    }
    if (revealFrame) window.cancelAnimationFrame(revealFrame);
    revealFrame = window.requestAnimationFrame(() => {
      revealFrame = 0;
      header.classList.add('is-header-visible');
    });
  };
  const dismiss = () => {
    if (!header.classList.contains('is-header-floating')) return;
    if (!header.classList.contains('is-header-visible') && dismissTimer) return;
    if (revealFrame) window.cancelAnimationFrame(revealFrame);
    revealFrame = 0;
    header.classList.remove('is-header-visible');
    if (dismissTimer) window.clearTimeout(dismissTimer);
    dismissTimer = window.setTimeout(reset, transitionDuration);
  };
  const update = () => {
    frame = 0;
    const currentScrollY = window.scrollY;
    const revealThreshold = slot.offsetTop + slot.offsetHeight + 24;
    const reachedOriginalPosition = currentScrollY <= slot.offsetTop;
    if (!mobile.matches || reachedOriginalPosition) {
      reset();
    } else if (keepVisibleForHeading) {
      reveal();
    } else if (currentScrollY > previousScrollY + 2) {
      dismiss();
    } else if (
      currentScrollY < previousScrollY - 2
      && (header.classList.contains('is-header-floating') || currentScrollY > revealThreshold)
    ) {
      reveal();
    }
    previousScrollY = currentScrollY;
  };
  const scheduleUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-docs-menu-backdrop] a[href^="#"]');
    if (!mobile.matches || !link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (!document.getElementById(decodeURIComponent(link.hash.slice(1)))) return;
    keepVisibleForHeading = true;
    reveal();
  }, true);
  const resumeScrollBehavior = () => { keepVisibleForHeading = false; };
  window.addEventListener('wheel', resumeScrollBehavior, { passive: true });
  window.addEventListener('touchmove', resumeScrollBehavior, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resumeScrollBehavior();
  });
  window.addEventListener('pageshow', () => {
    keepVisibleForHeading = false;
    previousScrollY = window.scrollY;
    reset();
  });
  mobile.addEventListener('change', () => {
    keepVisibleForHeading = false;
    previousScrollY = window.scrollY;
    reset();
  });
  document.addEventListener('defuddle:overlay-open', () => {
    if (window.scrollY > slot.offsetTop + slot.offsetHeight + 24) reveal();
  });
}
