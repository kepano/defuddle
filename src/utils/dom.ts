/**
 * Move all child nodes from source to target.
 * Clears target first, then moves each child node from source.
 */
export function transferContent(source: Node, target: Node): void {
	if ('replaceChildren' in target) {
		(target as Element).replaceChildren();
	} else {
		while (target.firstChild) {
			target.removeChild(target.firstChild);
		}
	}
	while (source.firstChild) {
		target.appendChild(source.firstChild);
	}
}

/**
 * Read an element's inner HTML.
 */
export function serializeHTML(el: { innerHTML: string }): string {
	return el.innerHTML;
}

/**
 * Decode HTML entities in a string (e.g. `&amp;` → `&`).
 * Uses a <textarea> element which is safe for entity decoding.
 */
export function decodeHTMLEntities(doc: Document, text: string): string {
	const textarea = doc.createElement('textarea');
	textarea.innerHTML = text;
	return textarea.value;
}

/**
 * Escape HTML special characters in a string.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Safely get an element's class name as a string.
 * Handles SVG elements where className is an SVGAnimatedString.
 */
export function getClassName(el: Element): string {
	return typeof el.className === 'string' ? el.className : el.getAttribute('class') || '';
}

/**
 * Check if a class string contains responsive Tailwind show utilities
 * (e.g. "sm:block", "lg:flex") indicating the element is visible at some breakpoints.
 */
const RESPONSIVE_SHOW_RE = /^(sm|md|lg|xl|2xl|min-\[|max-\[):(?:block|flex|grid|inline|table|contents)/;
export function hasResponsiveShowClass(className: string): boolean {
	return className.split(/\s+/).some(t => RESPONSIVE_SHOW_RE.test(t));
}

/**
 * Check if a URL uses a dangerous protocol (javascript:, data:text/html).
 * Strips whitespace and control characters before checking.
 */
export function isDangerousUrl(url: string): boolean {
	const normalized = url.replace(/[\s\u0000-\u001F]+/g, '').toLowerCase();
	return normalized.startsWith('javascript:') || normalized.startsWith('data:text/html');
}

/**
 * Check if an element belongs directly to an ancestor table,
 * not to an intervening nested TABLE.
 */
export function isDirectTableChild(el: Node, ancestor: Node): boolean {
	let parent = el.parentNode;
	while (parent && parent !== ancestor) {
		if (parent.nodeName === 'TABLE') return false;
		parent = parent.parentNode;
	}
	return parent === ancestor;
}

/**
 * Parse an HTML string into a DocumentFragment.
 * Uses a <template> element when available (safer: no script execution,
 * no resource loading). Falls back to a <div> for environments that
 * don't support template.content (e.g. some server-side DOM libraries).
 */
export function parseHTML(doc: Document, html: string): DocumentFragment {
	if (!html) return doc.createDocumentFragment();

	const template = doc.createElement('template');
	template.innerHTML = html;
	if (template.content) {
		return template.content;
	}
	// Fallback for environments without template.content support
	const div = doc.createElement('div');
	div.innerHTML = html;
	const fragment = doc.createDocumentFragment();
	while (div.firstChild) {
		fragment.appendChild(div.firstChild);
	}
	return fragment;
}
