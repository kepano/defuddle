/**
 * Transfer all child nodes from source to target by cloning.
 * Clears target first, then appends deep clones of each child node.
 */
export function transferContent(source: Element, target: Element): void {
	target.replaceChildren();
	for (const child of Array.from(source.childNodes)) {
		target.appendChild(child.cloneNode(true));
	}
}

/**
 * Parse an HTML string into a DocumentFragment.
 * Uses a <template> element when available (safer: no script execution,
 * no resource loading). Falls back to a <div> for environments that
 * don't support template.content (e.g. some server-side DOM libraries).
 */
export function parseHTML(doc: Document, html: string): DocumentFragment {
	const template = doc.createElement('template');
	template.innerHTML = html;
	if (template.content && template.content.childNodes.length > 0) {
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
