import { ALLOWED_ATTRIBUTES } from "../constants";

export const headingRules = [
    // Simplify headings by removing internal navigation elements
	{
		selector: 'h1, h2, h3, h4, h5, h6',
		element: 'keep',
		transform: (el: Element): Element => {
			// Get document from element's owner document
			const doc = el.ownerDocument;
			if (!doc) {
				console.warn('No document available');
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

			// Clone the element so we can modify it without affecting the original
			const clone = el.cloneNode(true) as Element;

			// First extract text from navigation elements before removing them
			const navigationText = new Map<Element, string>();
			
			// Find all navigation elements and store their text content
			Array.from(clone.querySelectorAll('*')).forEach(child => {
				let shouldRemove = false;
				
				if (child.tagName.toLowerCase() === 'a') {
					const href = child.getAttribute('href');
					if (href?.includes('#') || href?.startsWith('#')) {
						navigationText.set(child, child.textContent?.trim() || '');
						shouldRemove = true;
					}
				}
				if (child.classList.contains('anchor')) {
					navigationText.set(child, child.textContent?.trim() || '');
					shouldRemove = true;
				}
				if (child.tagName.toLowerCase() === 'button') {
					shouldRemove = true;
				}
				if ((child.tagName.toLowerCase() === 'span' || child.tagName.toLowerCase() === 'div') && 
					child.querySelector('a[href^="#"]')) {
					const anchor = child.querySelector('a[href^="#"]');
					if (anchor) {
						navigationText.set(child, anchor.textContent?.trim() || '');
					}
					shouldRemove = true;
				}

				if (shouldRemove) {
					// If this element contains the only text content of its parent,
					// store its text to be used for the parent
					const parent = child.parentElement;
					if (parent && parent !== clone && 
						parent.textContent?.trim() === child.textContent?.trim()) {
						navigationText.set(parent, child.textContent?.trim() || '');
					}
				}
			});

			// Remove navigation elements
			const toRemove = Array.from(clone.querySelectorAll('*')).filter(child => {
				if (child.tagName.toLowerCase() === 'a') {
					const href = child.getAttribute('href');
					return href?.includes('#') || href?.startsWith('#');
				}
				if (child.classList.contains('anchor')) {
					return true;
				}
				if (child.tagName.toLowerCase() === 'button') {
					return true;
				}
				if ((child.tagName.toLowerCase() === 'span' || child.tagName.toLowerCase() === 'div') && 
					child.querySelector('a[href^="#"]')) {
					return true;
				}
				return false;
			});

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