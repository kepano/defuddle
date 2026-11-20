import { transferContent } from '../utils/dom';

/**
 * Create a standardized callout element.
 */
function createCallout(doc: Document, type: string, title: string, contentSource: Element): Element {
	const callout = doc.createElement('div');
	callout.setAttribute('data-callout', type);
	callout.className = 'callout';

	// Title
	const titleDiv = doc.createElement('div');
	titleDiv.className = 'callout-title';
	const titleInner = doc.createElement('div');
	titleInner.className = 'callout-title-inner';
	titleInner.textContent = title;
	titleDiv.appendChild(titleInner);
	callout.appendChild(titleDiv);

	// Content
	const contentDiv = doc.createElement('div');
	contentDiv.className = 'callout-content';
	transferContent(contentSource, contentDiv);
	callout.appendChild(contentDiv);

	return callout;
}

/**
 * Standardize callout elements from various sources.
 * Runs early in the pipeline (before selector removal) so `.alert`
 * and similar classes don't get stripped.
 */
export function standardizeCallouts(element: Element): void {
	const doc = element.ownerDocument;
	if (!doc) return;

	const obsidianCollapsed: Element[] = [];
	const githubAlerts: Element[] = [];
	const calloutAsides: Element[] = [];
	const admonitions: Element[] = [];
	const bootstrapAlerts: Element[] = [];

	// Single DOM walk to collect all callout candidates instead of 5 querySelectorAll scans
	const walk = (root: Element): void => {
		for (let el = root.firstElementChild; el; el = el.nextElementSibling) {
			const cls = el.getAttribute('class');
			if (cls) {
				const tag = el.tagName.toUpperCase();
				if (tag === 'ASIDE' && cls.includes('callout')) {
					calloutAsides.push(el);
				}
				if (
					cls.includes('callout') ||
					cls.includes('markdown-alert') ||
					cls.includes('admonition') ||
					cls.includes('alert')
				) {
					const tokens = cls.split(/[\t\n\f\r ]+/);
					let hasCallout = false;
					let hasCollapse = false;
					let hasGithubAlert = false;
					let hasAdmonition = false;
					let hasAlert = false;
					for (let i = 0; i < tokens.length; i++) {
						const t = tokens[i];
						if (t === 'callout') hasCallout = true;
						else if (t === 'is-collapsed' || t === 'is-collapsible') hasCollapse = true;
						else if (t === 'markdown-alert') hasGithubAlert = true;
						else if (t === 'admonition') hasAdmonition = true;
						else if (t === 'alert') hasAlert = true;
					}
					if (hasCallout && hasCollapse) obsidianCollapsed.push(el);
					if (hasGithubAlert) githubAlerts.push(el);
					if (hasAdmonition) admonitions.push(el);
					if (hasAlert && cls.includes('alert-')) bootstrapAlerts.push(el);
				}
			}
			if (el.firstElementChild) walk(el);
		}
	};
	walk(element);

	// Obsidian callouts — already use data-callout and
	// .callout-content, but collapsed ones need to be expanded so
	// removeHiddenElements doesn't strip their content.
	// Preserve fold state via data-callout-fold (already set by Obsidian)
	// and transfer is-collapsible/is-collapsed to the standardized element.
	for (const el of obsidianCollapsed) {
		if (!el.parentNode) continue;
		const isCollapsed = el.classList.contains('is-collapsed');
		el.classList.remove('is-collapsed', 'is-collapsible');

		// Ensure data-callout-fold is set for the markdown converter
		if (!el.hasAttribute('data-callout-fold')) {
			el.setAttribute('data-callout-fold', isCollapsed ? '-' : '+');
		}

		const fold = el.querySelector('.callout-fold');
		if (fold) fold.remove();

		// The browser may have applied inline display:none to .callout-content
		// while the callout was collapsed — remove it so the content survives
		// the removeHiddenElements step.
		const content = el.querySelector('.callout-content');
		if (content) {
			const style = content.getAttribute('style');
			if (style) {
				const cleaned = style.replace(/display\s*:\s*none\s*;?/gi, '').trim();
				if (cleaned) {
					content.setAttribute('style', cleaned);
				} else {
					content.removeAttribute('style');
				}
			}
		}
	}

	// GitHub markdown alerts (div.markdown-alert)
	for (const el of githubAlerts) {
		if (!el.parentNode) continue;
		const typeClass = Array.from(el.classList).find(c => c.startsWith('markdown-alert-') && c !== 'markdown-alert');
		const type = typeClass ? typeClass.replace('markdown-alert-', '') : 'note';
		const title = type.charAt(0).toUpperCase() + type.slice(1);

		// Remove the icon/title element before transferring content
		const titleEl = el.querySelector('.markdown-alert-title');
		if (titleEl) {
			titleEl.remove();
		}

		el.replaceWith(createCallout(doc, type, title, el));
	}

	// Callout asides (aside.callout-*)
	for (const el of calloutAsides) {
		if (!el.parentNode) continue;
		const typeClass = Array.from(el.classList).find(c => c.startsWith('callout-'));
		const type = typeClass ? typeClass.replace('callout-', '') : 'note';
		const title = type.charAt(0).toUpperCase() + type.slice(1);

		const contentEl = el.querySelector('.callout-content');
		el.replaceWith(createCallout(doc, type, title, contentEl || el));
	}

	// Hugo/Docsy admonitions (div.admonition)
	if (admonitions.length > 0) {
		const admonitionTypes = new Set(['info', 'warning', 'note', 'tip', 'danger', 'caution', 'important', 'abstract', 'success', 'question', 'failure', 'bug', 'example', 'quote']);
		for (const el of admonitions) {
			if (!el.parentNode) continue;
			// Skip if already processed as a callout
			if (el.getAttribute('data-callout')) continue;

			// Type from class: info, warning, note, tip, danger, etc.
			const type = Array.from(el.classList).find(c => admonitionTypes.has(c)) || 'note';

			// Title from .admonition-title
			const titleEl = el.querySelector('.admonition-title');
			const title = titleEl?.textContent?.trim() || type.charAt(0).toUpperCase() + type.slice(1);
			if (titleEl) {
				titleEl.remove();
			}

			// Content from .admonition-content or .details-content, fall back to the element itself
			const contentEl = el.querySelector('.admonition-content') || el.querySelector('.details-content') || el;

			el.replaceWith(createCallout(doc, type, title, contentEl));
		}
	}

	// Bootstrap alerts (div.alert.alert-*)
	for (const el of bootstrapAlerts) {
		if (!el.parentNode) continue;
		const typeClass = Array.from(el.classList).find(c => c.startsWith('alert-') && c !== 'alert-dismissible');
		const type = typeClass ? typeClass.replace('alert-', '') : 'note';

		// Extract title from .alert-heading or .alert-title, fall back to type
		const titleEl = el.querySelector('.alert-heading, .alert-title');
		const title = titleEl?.textContent?.trim() || type.charAt(0).toUpperCase() + type.slice(1);
		if (titleEl) {
			titleEl.remove();
		}

		el.replaceWith(createCallout(doc, type, title, el));
	}
}
