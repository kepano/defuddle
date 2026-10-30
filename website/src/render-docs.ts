import { parseHTML } from 'linkedom';
import { parser as htmlParser } from '@lezer/html';
import { highlightTree } from '@lezer/highlight';
import { highlightCode } from './client/highlight';
import { htmlHighlightStyle } from './client/html-highlighting';

const escapeHTML = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function highlightHTML(code: string): string {
	const lines = [''];
	const append = (value: string, classes?: string) => {
		value.split('\n').forEach((line, index) => {
			if (index) lines.push('');
			lines[lines.length - 1] += classes ? `<span class="${classes}">${escapeHTML(line)}</span>` : escapeHTML(line);
		});
	};
	let offset = 0;
	highlightTree(htmlParser.parse(code), htmlHighlightStyle, (from, to, classes) => {
		append(code.slice(offset, from));
		append(code.slice(from, to), classes);
		offset = to;
	});
	append(code.slice(offset));
	return lines.map((line, index) => `<span class="doc-code-line"><span class="doc-line-number" hidden>${index + 1}</span><span class="doc-code-source">${line}</span></span>`).join('');
}

// Input is trusted, authored documentation, never fetched or user-provided HTML.
export function renderDocsContent(source: string) {
	const { document } = parseHTML(`<html><body>${source}</body></html>`);
	const headings = [...document.querySelectorAll('h2, h3')];
	const ids = new Set(headings.map(heading => heading.id).filter(Boolean));
	for (const heading of headings) {
		if (!heading.id) {
			const base = (heading.textContent ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
			let id = base;
			for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`;
			heading.id = id;
			ids.add(id);
		}
	}
	let inChildren = false;
	const outlineLinks = headings.map(heading => {
		const child = heading.tagName === 'H3';
		const boundary = child && !inChildren ? '<div class="docs-toc-children">' : !child && inChildren ? '</div>' : '';
		inChildren = child;
		return `${boundary}<a href="#${escapeHTML(heading.id)}" data-depth="${child ? 3 : 2}">${escapeHTML(heading.textContent ?? '')}</a>`;
	}).join('');
	const outline = `<div class="docs-toc-outline">${outlineLinks}${inChildren ? '</div>' : ''}</div>`;
	for (const code of document.querySelectorAll('pre > code')) {
		const value = code.textContent ?? '';
		const language = code.classList.contains('language-bash') ? 'shell' : code.classList.contains('language-html') ? 'html' : 'ts';
		const highlighted = language === 'html' ? highlightHTML(value) : highlightCode(value, language);
		const figure = document.createElement('figure');
		figure.className = 'doc-code doc-code-unlabeled';
		figure.setAttribute('data-code-block', '');
		figure.innerHTML = `<span class="doc-code-actions"><button aria-label="Copy code" class="doc-code-copy" title="Copy code" type="button" data-copy-code><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button></span><pre><code class="language-${language}" data-language="${language}">${highlighted}</code></pre>`;
		code.parentElement!.replaceWith(figure);
	}
	for (const table of document.querySelectorAll('table')) {
		const wrapper = document.createElement('div');
		wrapper.className = 'table-wrap';
		wrapper.setAttribute('role', 'region');
		wrapper.setAttribute('tabindex', '0');
		let previous = table.previousElementSibling;
		while (previous && !/^H[23]$/.test(previous.tagName)) previous = previous.previousElementSibling;
		if (previous?.id) wrapper.setAttribute('aria-labelledby', previous.id);
		table.replaceWith(wrapper);
		wrapper.append(table);
	}
	return { content: document.body.innerHTML, outline };
}
