import { ALLOWED_ATTRIBUTES } from "../constants";

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

/**
 * Remove permalink anchors from headings and definition terms.
 * Handles symbols (#, ¶, §, 🔗), empty links, and class-based anchors.
 */
export function removePermalinkAnchors(element: Element): void {
	const links = Array.from(element.getElementsByTagName('a'));
	for (let i = 0; i < links.length; i++) {
		const link = links[i];
		let inHeading = false;
		for (let cur = link.parentElement; cur; cur = cur.parentElement) {
			if (HEADING_TAGS.has(cur.tagName.toUpperCase())) {
				inHeading = true;
				break;
			}
			if (cur === element) break;
		}
		if (!inHeading) {
			const cls = link.getAttribute('class') || '';
			if (!cls || (!link.classList.contains('permalink') && !link.classList.contains('anchor-link') && !link.classList.contains('heading-anchor'))) {
				continue;
			}
		}
		if (isPermalinkAnchor(link)) {
			link.remove();
		}
	}
}

export function isPermalinkAnchor(node: Element): boolean {
	if (node.tagName.toUpperCase() !== 'A') return false;
	const href = node.getAttribute('href') || '';
	const parent = node.parentElement;
	if (parent && parent.tagName.toUpperCase() === 'SUP' && parent.id.startsWith('fnref:') && href.startsWith('#fn:')) {
		return false;
	}
	const title = (node.getAttribute('title') || '').toLowerCase();
	const className = (node.getAttribute('class') || '').toLowerCase();
	const text = (node.textContent || '').trim();

	if (href.startsWith('#')) return true;
	if (title.includes('permalink')) return true;
	const isPermalinkClass = className.includes('permalink') || className.includes('heading-anchor') || className.includes('anchor-link');
	if (isPermalinkClass) return true;
	if (/^[#¶§🔗\uFEFF]$/.test(text)) return true;

	return false;
}

// Headings are flattened to text, except for math and footnote references
function appendHeadingContent(source: Node, target: Element): void {
	Array.from(source.childNodes).forEach(node => {
		if (node.nodeType === 3) {
			target.appendChild(node);
		} else if (node.nodeType === 1) {
			const el = node as Element;
			const tag = el.tagName.toUpperCase();
			if (tag === 'MATH' || (tag === 'SUP' && el.id.startsWith('fnref:'))) {
				target.appendChild(el);
			} else {
				appendHeadingContent(el, target);
			}
		}
	});
}

function isHeadingNavElement(node: Element): boolean {
	const tag = node.tagName.toLowerCase();
	if (tag === 'button') return true;
	if (tag === 'a' && isPermalinkAnchor(node)) return true;
	if (node.classList.contains('anchor') || node.classList.contains('permalink-widget')) return true;
	if ((tag === 'span' || tag === 'div') && Array.from(node.querySelectorAll('a')).some(a => isPermalinkAnchor(a))) {
		return true;
	}
	return false;
}

export const headingRules = [
    // Simplify headings by removing internal navigation elements
	{
		selector: 'h1, h2, h3, h4, h5, h6',
		element: 'keep',
		transform: (el: Element): Element => {
			// Get document from element's owner document
			const doc = el.ownerDocument;
			if (!doc) {
				// No document available
				return el;
			}

			// DOM tagName is uppercase; linkedom preserves createElement's casing.
			const newHeading = doc.createElement(el.tagName.toLowerCase());

			// Copy allowed attributes from original heading
			Array.from(el.attributes).forEach(attr => {
				if (ALLOWED_ATTRIBUTES.has(attr.name)) {
					newHeading.setAttribute(attr.name, attr.value);
				}
			});

			// Fast path: no child elements means no nav elements to remove
			if (!el.children.length) {
				newHeading.textContent = el.textContent?.trim() || '';
				return newHeading;
			}

			// Clone the element so we can modify it without affecting the original
			const clone = el.cloneNode(true) as Element;

			const toRemove = Array.from(clone.querySelectorAll('*')).filter(isHeadingNavElement);
			// Keep the first navigation element in case it holds the whole title
			const fallback = toRemove[0]?.cloneNode(true) as Element | undefined;
			// A wrapper holding the whole title can also hold its permalink
			if (fallback) {
				const stripped = fallback.cloneNode(true) as Element;
				stripped.querySelectorAll('a').forEach(a => { if (isPermalinkAnchor(a)) a.remove(); });
				if (stripped.textContent?.trim()) fallback.replaceChildren(...Array.from(stripped.childNodes));
			}
			toRemove.forEach(element => element.remove());

			const source = !clone.textContent?.trim() && fallback ? fallback : clone;
			appendHeadingContent(source, newHeading);
			const { firstChild, lastChild } = newHeading;
			if (firstChild?.nodeType === 3) firstChild.textContent = firstChild.textContent!.trimStart();
			if (lastChild?.nodeType === 3) lastChild.textContent = lastChild.textContent!.trimEnd();

			return newHeading;
		}
	}
];
