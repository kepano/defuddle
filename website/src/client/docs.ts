import './page-markdown';
import { setupOutline } from './outline';
import { setupCodeCopy } from './copy';
import { setupMobileHeader } from './mobile-header';
import { setupSearch } from './search';

setupCodeCopy();

const trigger = document.querySelector<HTMLButtonElement>('[data-docs-menu-trigger]')!;
const backdrop = document.querySelector<HTMLElement>('[data-docs-menu-backdrop]')!;
const panel = document.getElementById('mobile-docs-panel')!;
const header = trigger.closest<HTMLElement>('[data-scroll-header]')!;
const mobile = window.matchMedia('(max-width: 760px)');
const updateMenuTop = () => {
	backdrop.style.top = `${header.getBoundingClientRect().bottom}px`;
};
new ResizeObserver(updateMenuTop).observe(header);
window.addEventListener('resize', updateMenuTop);
function closeMenu(restoreFocus = true) {
	backdrop.hidden = true;
	trigger.setAttribute('aria-expanded', 'false');
	trigger.setAttribute('aria-label', 'Open documentation menu');
	document.documentElement.classList.remove('docs-menu-open');
	if (restoreFocus) trigger.focus({ preventScroll: true });
}
trigger.addEventListener('click', event => {
	if (!backdrop.hidden) { closeMenu(); return; }
	document.dispatchEvent(new CustomEvent('defuddle:overlay-open', { detail: 'docs-menu' }));
	backdrop.hidden = false;
	trigger.setAttribute('aria-expanded', 'true');
	trigger.setAttribute('aria-label', 'Close documentation menu');
	document.documentElement.classList.add('docs-menu-open');
	updateMenuTop();
	const target = event.detail === 0 ? backdrop.querySelector<HTMLAnchorElement>('a')! : panel;
	target.focus({ preventScroll: true });
});
backdrop.addEventListener('click', event => {
	const link = (event.target as Element).closest<HTMLAnchorElement>('a');
	if (!link) return;
	closeMenu(false);
	if (link.hash) {
		const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
		heading?.setAttribute('tabindex', '-1');
		heading?.focus({ preventScroll: true });
	}
}, true);
document.addEventListener('keydown', event => {
	if (backdrop.hidden) return;
	if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
	if (event.key === 'Tab') {
		const links = [...backdrop.querySelectorAll<HTMLAnchorElement>('a')];
		if (event.shiftKey && (document.activeElement === links[0] || document.activeElement === panel)) { event.preventDefault(); links.at(-1)!.focus(); }
		else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); links[0].focus(); }
	}
});
mobile.addEventListener('change', () => { if (!mobile.matches) closeMenu(false); });
document.addEventListener('defuddle:overlay-open', event => {
	if ((event as CustomEvent<string>).detail !== 'docs-menu' && !backdrop.hidden) closeMenu(false);
});

setupOutline();
setupMobileHeader();
setupSearch();
