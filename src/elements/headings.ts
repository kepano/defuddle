import { ALLOWED_ATTRIBUTES } from "../constants";

// Footnote references produced by standardizeFootnotes
const FOOTNOTE_REF_MARKER = 'sup[id^="fnref:"]';
const FOOTNOTE_REF = `${FOOTNOTE_REF_MARKER} > a[href^="#fn:"]`;

/**
 * Remove permalink anchors from headings and definition terms.
 * Handles symbols (#, ¶, §, 🔗), empty links, and class-based anchors.
 */
export function removePermalinkAnchors(element: Element): void {
	Array.from(element.querySelectorAll(
		'h1 a, h2 a, h3 a, h4 a, h5 a, h6 a, a.permalink, a.anchor-link, a.heading-anchor'
	)).forEach(link => {
		if (isPermalinkAnchor(link)) {
			link.remove();
		}
	});
}

export function isPermalinkAnchor(node: Element): boolean {
	if (node.tagName.toLowerCase() !== 'a') return false;
	if (node.matches(FOOTNOTE_REF)) return false;
	const href = node.getAttribute('href') || '';
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
			if (el.matches('math') || el.matches(FOOTNOTE_REF_MARKER)) {
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
			const fallback = toRemove[0]?.cloneNode(true);
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
