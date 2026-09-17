export function setupOutline() {
  const links = document.querySelectorAll<HTMLAnchorElement>('.docs-toc-outline a[href^="#"]');
  const sidebarLinks = document.querySelectorAll<HTMLAnchorElement>('.docs-navigation a[href^="#"]');
  let scrollFrame = 0;

  const scrollToTarget = (target: HTMLElement) => {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    const start = window.scrollY;
    const scrollMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const destination = Math.max(0, start + target.getBoundingClientRect().top - scrollMargin);
    const distance = destination - start;
    const duration = Math.min(300, Math.max(100, Math.abs(distance) * 0.15));
    let startedAt: number | undefined;

    const step = (timestamp: number) => {
      startedAt ??= timestamp;
      let progress = Math.min((timestamp - startedAt) / duration, 1);
      progress *= 2 - progress;
      window.scrollTo({ top: start + distance * progress, behavior: 'instant' });
      scrollFrame = progress < 1 ? window.requestAnimationFrame(step) : 0;
    };
    scrollFrame = window.requestAnimationFrame(step);
  };

  sidebarLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      window.history.pushState(null, '', link.hash);
      scrollToTarget(target);
    });
  });

  const linksByHash = new Map<string, HTMLAnchorElement[]>();
  links.forEach((link) => {
    const matchingLinks = linksByHash.get(link.hash) ?? [];
    matchingLinks.push(link);
    linksByHash.set(link.hash, matchingLinks);
  });
  const sections = [...linksByHash].flatMap(([hash, matchingLinks]) => {
    const heading = document.getElementById(decodeURIComponent(hash.slice(1)));
    return heading ? [{ links: matchingLinks, heading }] : [];
  });
  if (!sections.length) return;

  let activeIndex = -2;
  let frame = 0;

  const update = () => {
    frame = 0;
    // Reader mode's activation zone ends one fifth of the way down the viewport.
    const readingLine = window.innerHeight * 0.2;
    let nextIndex = -1;
    sections.forEach(({ heading }, index) => {
      if (heading.getBoundingClientRect().top <= readingLine) nextIndex = index;
    });

    // Short final sections cannot always reach the activation zone.
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      nextIndex = sections.length - 1;
    }
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    sections.forEach(({ links: matchingLinks }, index) => {
      matchingLinks.forEach((link) => {
        link.classList.toggle('is-read', index < activeIndex);
        if (index === activeIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  };

  const scheduleUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate, { once: true });
  update();
}
