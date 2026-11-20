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
	if (!text || !text.includes('&')) return text;
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
 * Check if a URL uses a dangerous protocol (javascript:, blob:, non-image data:).
 * Strips whitespace and control characters before checking.
 *
 * data: and blob: smuggle a whole document into an attribute, bypassing the
 * script and event-handler stripping done elsewhere. Inline images are the one
 * benign use of data:, so those are allowed and every other media type is
 * rejected. Relative URLs (no scheme) are always allowed — the bbcode and
 * comment builders pass them.
 */
export function isDangerousUrl(url: string, allowInlineImage: boolean = true): boolean {
	const normalized = url.replace(/[\s\u0000-\u001F]+/g, '').toLowerCase();
	if (normalized.startsWith('javascript:') || normalized.startsWith('blob:')) return true;
	if (normalized.startsWith('data:')) {
		return !(allowInlineImage && normalized.startsWith('data:image/'));
	}
	return false;
}

// Keep this list in sync with UNSAFE_ELEMENT_SELECTOR.
const UNSAFE_ELEMENT_TAGS = new Set([
	'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'FRAME', 'FRAMESET', 'OBJECT', 'EMBED', 'APPLET', 'BASE',
	'ANIMATE', 'SET', 'ANIMATEMOTION', 'ANIMATETRANSFORM', 'ANIMATECOLOR', 'DISCARD'
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'xlink:href']);

function isUnsafeElement(el: Element, inMath?: boolean): boolean {
	const tag = el.tagName.toUpperCase();
	if (tag === 'SCRIPT') return !(el.getAttribute('type') || '').toLowerCase().startsWith('math/');
	// linkedom writes title text unescaped, but browsers parse it as markup inside math.
	if (tag === 'TITLE') return inMath !== undefined ? inMath : !!el.closest('math');
	return UNSAFE_ELEMENT_TAGS.has(tag);
}

function neutralizeUnsafeElement(el: Element): void {
	for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
	while (el.firstChild) el.removeChild(el.firstChild);
	const content = (el as HTMLTemplateElement).content;
	if (content) {
		while (content.firstChild) content.removeChild(content.firstChild);
	}
}

function stripUnsafeAttributes(el: Element): void {
	const attrs = el.attributes;
	if (attrs.length === 0) return;
	let toRemove: string[] | null = null;
	for (let i = 0; i < attrs.length; i++) {
		const attr = attrs[i];
		const name = attr.name.toLowerCase();
		if (name.startsWith('on') || name === 'srcdoc') {
			if (!toRemove) toRemove = [];
			toRemove.push(attr.name);
		} else if (URL_ATTRIBUTES.has(name)) {
			// SVG data URLs can run scripts in iframes.
			const allowInlineImage = !(name === 'src' && el.tagName.toUpperCase() === 'IFRAME');
			if (isDangerousUrl(attr.value, allowInlineImage)) {
				if (!toRemove) toRemove = [];
				toRemove.push(attr.name);
			}
		}
	}
	if (toRemove) {
		for (let i = 0; i < toRemove.length; i++) {
			el.removeAttribute(toRemove[i]);
		}
	}
}

/** Returns true if the root is unsafe and must not be serialized. */
export function stripUnsafeElements(root: Element): boolean {
	const unsafeRoot = isUnsafeElement(root);
	if (unsafeRoot) {
		neutralizeUnsafeElement(root);
	} else {
		stripUnsafeAttributes(root);
	}

	let rootInMath = root.tagName.toUpperCase() === 'MATH';
	if (!rootInMath) {
		for (let cur = root.parentElement; cur; cur = cur.parentElement) {
			if (cur.tagName.toUpperCase() === 'MATH') {
				rootInMath = true;
				break;
			}
		}
	}

	const walk = (parent: Element, inMath: boolean): void => {
		let child = parent.firstElementChild;
		while (child) {
			const next = child.nextElementSibling;
			if (isUnsafeElement(child, inMath)) {
				child.parentNode?.removeChild(child);
			} else {
				stripUnsafeAttributes(child);
				if (child.firstElementChild) {
					walk(child, inMath || child.tagName.toUpperCase() === 'MATH');
				}
			}
			child = next;
		}
	};

	walk(root, rootInMath);

	return unsafeRoot;
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

/** Document order without relying on linkedom's cross-parent compareDocumentPosition. */
export function isNodeBefore(node: Node, other: Node): boolean {
	if (node === other) return false;
	const ancestors = (current: Node): Node[] => {
		const path: Node[] = [];
		for (let n: Node | null = current; n; n = n.parentNode) path.push(n);
		return path;
	};
	const left = ancestors(node);
	const right = ancestors(other);
	// Detached subtrees have no shared document order.
	if (left[left.length - 1] !== right[right.length - 1]) return false;
	while (left.length && right.length && left[left.length - 1] === right[right.length - 1]) {
		left.pop();
		right.pop();
	}
	if (!left.length) return true; // node is an ancestor of other
	if (!right.length) return false;
	for (let sibling: Node | null = left[left.length - 1].nextSibling; sibling; sibling = sibling.nextSibling) {
		if (sibling === right[right.length - 1]) return true;
	}
	return false;
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

const PLAIN_CSS_IDENT_RE = /^(?:--|-?[a-zA-Z_])[a-zA-Z0-9_-]*$/;
// NUL and non-ASCII whitespace don't round-trip through selectors in every DOM engine.
const UNSELECTABLE_VALUE_RE = /\0|[^\S\t\n\f\r ]/;

/**
 * Build a selector matching a class token or ID, or null if DOM engines can't
 * round-trip the value. Special values use quoted attribute selectors because
 * JSDOM mismatches escaped identifiers that are followed by more selector text.
 */
export function classOrIdSelector(attribute: 'class' | 'id', value: string): string | null {
	if (!value || UNSELECTABLE_VALUE_RE.test(value)) return null;
	if (PLAIN_CSS_IDENT_RE.test(value)) return (attribute === 'class' ? '.' : '#') + value;
	const escaped = value.replace(/["\\]/g, '\\$&')
		.replace(/[\x01-\x1f\x7f]/g, char => `\\${char.charCodeAt(0).toString(16)} `);
	return `[${attribute}${attribute === 'class' ? '~' : ''}="${escaped}"]`;
}
