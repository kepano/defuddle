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
