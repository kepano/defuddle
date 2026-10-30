import { searchDocumentation, type SearchItem } from './search-model';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] ?? character));

export function setupSearch() {
	const trigger = document.querySelector<HTMLButtonElement>('[data-search-trigger]');
	const backdrop = document.querySelector<HTMLElement>('[data-search-backdrop]');
	const input = document.querySelector<HTMLInputElement>('[data-search-input]');
	const clearButton = document.querySelector<HTMLButtonElement>('[data-search-clear]');
	const resultsElement = document.querySelector<HTMLElement>('[data-search-results]');
	const data = document.querySelector<HTMLScriptElement>('#search-index')?.textContent;
	if (!trigger || !backdrop || !input || !clearButton || !resultsElement || !data) return;

	const items = JSON.parse(data) as SearchItem[];
	const mobile = window.matchMedia('(max-width: 760px)');
	let results: SearchItem[] = [];
	let activeIndex = 0;

	const syncClearButton = () => {
		clearButton.hidden = !mobile.matches && input.value.length === 0;
		clearButton.setAttribute('aria-label', mobile.matches ? 'Close search' : 'Clear search');
	};
	const render = () => {
		input.removeAttribute('aria-activedescendant');
		if (!results.length) {
			resultsElement.innerHTML = `<p class="command-empty" role="status">No documentation matches “${escapeHtml(input.value)}”.</p>`;
			return;
		}
		resultsElement.innerHTML = results.map((item, index) => {
			const title = escapeHtml(item.title);
			const titleElement = item.kind === 'field'
				? `<code class="command-result-syntax is-variable">${title}</code>`
				: `<span class="command-result-title">${title}</span>`;
			return `<a id="search-result-${index}" class="${index === activeIndex ? 'is-active' : ''}" href="${escapeHtml(item.href)}" role="option" aria-selected="${index === activeIndex}" tabindex="-1" data-result-index="${index}">
				${titleElement}<p>${escapeHtml(item.summary)}</p><span class="command-result-open" aria-hidden="true">↵</span>
			</a>`;
		}).join('');
		input.setAttribute('aria-activedescendant', `search-result-${activeIndex}`);
	};
	const setActiveIndex = (index: number, scroll = false) => {
		if (!results.length) return;
		activeIndex = Math.max(0, Math.min(index, results.length - 1));
		input.setAttribute('aria-activedescendant', `search-result-${activeIndex}`);
		resultsElement.querySelectorAll<HTMLElement>('[data-result-index]').forEach(result => {
			const active = Number(result.dataset.resultIndex) === activeIndex;
			result.classList.toggle('is-active', active);
			result.setAttribute('aria-selected', String(active));
			if (active && scroll) result.scrollIntoView({ block: 'nearest' });
		});
	};
	const update = () => {
		results = searchDocumentation(items, input.value);
		activeIndex = 0;
		render();
		resultsElement.scrollTop = 0;
	};
	const close = (restoreFocus = true) => {
		if (backdrop.hidden) return;
		input.readOnly = true;
		input.blur();
		backdrop.hidden = true;
		trigger.setAttribute('aria-expanded', 'false');
		document.documentElement.classList.remove('search-open');
		if (restoreFocus) trigger.focus({ preventScroll: true });
	};
	const open = () => {
		document.dispatchEvent(new CustomEvent('defuddle:overlay-open', { detail: 'search' }));
		input.readOnly = false;
		input.value = '';
		update();
		backdrop.hidden = false;
		trigger.setAttribute('aria-expanded', 'true');
		syncClearButton();
		document.documentElement.classList.add('search-open');
		input.focus({ preventScroll: true });
	};
	const navigate = (href: string) => {
		close(false);
		requestAnimationFrame(() => {
			window.location.assign(href);
			const url = new URL(href, location.href);
			if (url.pathname === location.pathname && url.hash) {
				const heading = document.getElementById(decodeURIComponent(url.hash.slice(1)));
				heading?.setAttribute('tabindex', '-1');
				heading?.focus({ preventScroll: true });
			}
		});
	};

	trigger.addEventListener('click', open);
	backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) close(); });
	input.addEventListener('input', () => { syncClearButton(); update(); });
	clearButton.addEventListener('click', () => {
		if (mobile.matches) { close(); return; }
		input.value = '';
		syncClearButton();
		update();
		input.focus();
	});
	mobile.addEventListener('change', syncClearButton);
	resultsElement.addEventListener('mousemove', event => {
		const result = (event.target as Element).closest<HTMLElement>('[data-result-index]');
		if (result) setActiveIndex(Number(result.dataset.resultIndex));
	});
	resultsElement.addEventListener('click', event => {
		const result = (event.target as Element).closest<HTMLAnchorElement>('a[data-result-index]');
		if (!result || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigate(result.href);
	});
	input.addEventListener('keydown', event => {
		if (event.isComposing) return;
		if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(activeIndex + 1, true); }
		if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(activeIndex - 1, true); }
		if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); navigate(results[activeIndex].href); }
	});
	window.addEventListener('keydown', event => {
		if (event.isComposing) return;
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			event.stopPropagation();
			open();
			return;
		}
		if (backdrop.hidden) return;
		if (event.key === 'Escape') { event.preventDefault(); close(); }
		if (event.key === 'Tab') {
			event.preventDefault();
			if (!clearButton.hidden && document.activeElement === input) clearButton.focus();
			else input.focus();
		}
	}, true);
	document.addEventListener('defuddle:overlay-open', event => {
		if ((event as CustomEvent<string>).detail !== 'search') close(false);
	});
	window.addEventListener('pagehide', () => close(false));
}
