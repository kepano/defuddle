import { ALLOWED_ATTRIBUTES } from "../constants";

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
	const href = node.getAttribute('href') || '';
	const title = (node.getAttribute('title') || '').toLowerCase();
	const className = (node.getAttribute('class') || '').toLowerCase();
	const text = (node.textContent || '').trim();

	if (href.startsWith('#') || href.includes('#')) return true;
	if (title.includes('permalink')) return true;
	const isPermalinkClass = className.includes('permalink') || className.includes('heading-anchor') || className.includes('anchor-link');
	if (isPermalinkClass) return true;
	if (/^[#¶§🔗\uFEFF]$/.test(text)) return true;

	return false;
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

			// Create new heading of same level
			const newHeading = doc.createElement(el.tagName);

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

			// Single pass: collect navigation text and build removal list
			const navigationText = new Map<Element, string>();
			const toRemove: Element[] = [];

			Array.from(clone.querySelectorAll('*')).forEach(child => {
				if (!isHeadingNavElement(child)) return;

				navigationText.set(child, child.textContent?.trim() || '');

				// If this element contains the only text content of its parent,
				// store its text to be used for the parent
				const parent = child.parentElement;
				if (parent && parent !== clone &&
					parent.textContent?.trim() === child.textContent?.trim()) {
					navigationText.set(parent, child.textContent?.trim() || '');
				}

				toRemove.push(child);
			});

			// Remove navigation elements
			toRemove.forEach(element => element.remove());

			// Get the text content after removing navigation elements
			let textContent = clone.textContent?.trim() || '';

			// If we lost all text content but had navigation text, use that instead
			if (!textContent && navigationText.size > 0) {
				textContent = Array.from(navigationText.values())[0];
			}

			// Set the clean text content
			newHeading.textContent = textContent;

			return newHeading;
		}
	}
];
