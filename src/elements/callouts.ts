import { ALLOWED_ATTRIBUTES, NODE_TYPE } from '../constants';

interface CalloutInfo {
	type: string;
	title: string | null;
	iconSVG: string | null;
	content: DocumentFragment;
}

function getCalloutType(element: Element): string {
	const className = element.className.toLowerCase();
	const dataCallout = element.getAttribute('data-callout')?.toLowerCase();

	if (dataCallout) return dataCallout;

	if (className.includes('admonition')) {
		const parts = className.split(' ');
		const typePart = parts.find(part => part !== 'admonition' && part !== 'callout');
		if (typePart) return typePart;
	}

	if (className.includes('markdown-alert')) {
		const match = className.match(/markdown-alert-(\w+)/);
		if (match && match[1]) return match[1];
	}

	if (className.includes('ghd-alert')) {
		const match = className.match(/ghd-alert-(\w+)/);
		// Find the type class that isn't 'accent' or 'default'
		const typeClass = Array.from(element.classList).find(
			c => c.startsWith('ghd-alert-') && c !== 'ghd-alert-accent' && c !== 'ghd-alert-default'
		);
		if (typeClass) {
			return typeClass.replace('ghd-alert-', '');
		}
	}

	return 'note'; // Default type
}

function getTitleCase(text: string): string {
	if (!text) return '';
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function extractCalloutInfo(element: Element, doc: Document): CalloutInfo | null {
	const type = getCalloutType(element);
	let title: string | null = null;
	let iconSVG: string | null = null;
	const contentFragment = doc.createDocumentFragment();

	// Obsidian format
	if (element.matches('div.callout[data-callout]')) {
		const titleEl = element.querySelector('.callout-title-inner');
		title = titleEl?.textContent?.trim() || getTitleCase(type);
		const iconEl = element.querySelector('.callout-icon > svg');
		if (iconEl) {
			iconSVG = iconEl.outerHTML;
		}
		const contentEl = element.querySelector('.callout-content');
		if (contentEl) {
			Array.from(contentEl.childNodes).forEach(child => contentFragment.appendChild(child.cloneNode(true)));
		} else {
			// If no .callout-content, take all children except .callout-title
			Array.from(element.childNodes).forEach(child => {
				if (child.nodeType === NODE_TYPE.ELEMENT_NODE && (child as Element).classList.contains('callout-title')) {
					return;
				}
				contentFragment.appendChild(child.cloneNode(true));
			});
		}
	}
	// GitHub Alert
	else if (element.matches('div.markdown-alert')) {
		const titleEl = element.querySelector('.markdown-alert-title');
		if (titleEl) {
			title = titleEl.textContent?.replace(/<svg.*?>.*?<\/svg>/i, '').trim() || getTitleCase(type);
			const svgEl = titleEl.querySelector('svg');
			if (svgEl) {
				iconSVG = svgEl.outerHTML;
			}
		} else {
			title = getTitleCase(type);
		}

		Array.from(element.children).forEach(child => {
			if (!child.classList.contains('markdown-alert-title')) {
				// If child is a paragraph, append its children, otherwise clone the child
				if (child.tagName.toLowerCase() === 'p') {
					Array.from(child.childNodes).forEach(pChild => contentFragment.appendChild(pChild.cloneNode(true)));
				} else {
					contentFragment.appendChild(child.cloneNode(true));
				}
			}
		});
	}
	// GitHub Docs format
	else if (element.matches('div.ghd-alert')) {
		const titleEl = element.querySelector('p.ghd-alert-title');
		if (titleEl) {
			title = titleEl.textContent?.replace(/<svg.*?>.*?<\/svg>/i, '').trim() || getTitleCase(type);
			const svgEl = titleEl.querySelector('svg');
			if (svgEl) {
				iconSVG = svgEl.outerHTML;
			}
		} else {
			title = getTitleCase(type);
		}

		Array.from(element.children).forEach(child => {
			if (!child.classList.contains('ghd-alert-title')) {
				// If the child is a paragraph, append its children (to unwrap the <p>)
				// otherwise, append the child directly.
				if (child.tagName.toLowerCase() === 'p') {
					Array.from(child.childNodes).forEach(pChild => contentFragment.appendChild(pChild.cloneNode(true)));
				} else {
					contentFragment.appendChild(child.cloneNode(true));
				}
			}
		});
	}
	// Admonition
	else if (element.matches('div.admonition')) {
		const titleEl = element.querySelector('.admonition-title');
		title = titleEl?.textContent?.trim() || getTitleCase(type);

		Array.from(element.children).forEach(child => {
			if (!child.classList.contains('admonition-title')) {
				contentFragment.appendChild(child.cloneNode(true));
			}
		});
	} else {
		return null;
	}
	
	// If contentFragment is empty, but element has direct text children, use them.
	if (!contentFragment.hasChildNodes() && element.textContent?.trim()) {
		let hasNonTitleChild = false;
		Array.from(element.childNodes).forEach(node => {
			if (node.nodeType === NODE_TYPE.ELEMENT_NODE) {
				const elNode = node as Element;
				if (!elNode.classList.contains('admonition-title') && !elNode.classList.contains('markdown-alert-title') && !elNode.classList.contains('callout-title')) {
					hasNonTitleChild = true;
					contentFragment.appendChild(node.cloneNode(true));
				}
			} else {
				hasNonTitleChild = true;
				contentFragment.appendChild(node.cloneNode(true));
			}
		});
		if (!hasNonTitleChild) { // if we only picked up title nodes, clear fragment
			while (contentFragment.firstChild) {
				contentFragment.removeChild(contentFragment.firstChild);
			}
		}
	}


	return { type, title, iconSVG, content: contentFragment };
}

export function standardizeCallout(element: Element, doc: Document): Element {
	const calloutInfo = extractCalloutInfo(element, doc);

	if (!calloutInfo) {
		return element; // Not a recognized callout, return original
	}

	const { type, title, iconSVG, content } = calloutInfo;

	const newCallout = doc.createElement('div');
	newCallout.className = 'callout';
	newCallout.setAttribute('data-callout', type);

	const calloutTitleDiv = doc.createElement('div');
	calloutTitleDiv.className = 'callout-title';

	const calloutIconDiv = doc.createElement('div');
	calloutIconDiv.className = 'callout-icon';
	if (iconSVG) {
		calloutIconDiv.innerHTML = iconSVG;
	} else {
		// Placeholder for default icon logic if needed, or leave empty for Obsidian to handle
		// For now, ensure it's created even if empty.
	}

	const calloutTitleInnerDiv = doc.createElement('div');
	calloutTitleInnerDiv.className = 'callout-title-inner';
	calloutTitleInnerDiv.textContent = title || getTitleCase(type);

	calloutTitleDiv.appendChild(calloutIconDiv);
	calloutTitleDiv.appendChild(calloutTitleInnerDiv);

	const calloutContentDiv = doc.createElement('div');
	calloutContentDiv.className = 'callout-content';
	calloutContentDiv.appendChild(content);
	
	// If content is empty but original element had some text, try to capture it
	if (!calloutContentDiv.textContent?.trim() && element.textContent?.trim()) {
		let directTextContent = '';
		Array.from(element.childNodes).forEach(node => {
			if (node.nodeType === NODE_TYPE.TEXT_NODE && node.textContent?.trim()) {
				directTextContent += node.textContent;
			} else if (node.nodeType === NODE_TYPE.ELEMENT_NODE) {
				const elNode = node as Element;
				if (!elNode.classList.contains('admonition-title') && 
						!elNode.classList.contains('markdown-alert-title') && 
						!elNode.classList.contains('callout-title') &&
						elNode.textContent?.trim()) {
					// Fallback: append children that are not titles and have content
					calloutContentDiv.appendChild(elNode.cloneNode(true));
				}
			}
		});
		if (directTextContent.trim() && !calloutContentDiv.textContent?.trim()) {
			const p = doc.createElement('p');
			p.textContent = directTextContent.trim();
			calloutContentDiv.appendChild(p);
		}
	}


	newCallout.appendChild(calloutTitleDiv);
	newCallout.appendChild(calloutContentDiv);

	// Copy allowed attributes from the original element
	Array.from(element.attributes).forEach(attr => {
		if (ALLOWED_ATTRIBUTES.has(attr.name) && !newCallout.hasAttribute(attr.name)) {
			newCallout.setAttribute(attr.name, attr.value);
		}
	});

	return newCallout;
}

export const calloutRules = [
	{
		selector: 'div.admonition, div.callout[data-callout], div.markdown-alert, div.ghd-alert',
		element: 'div', // Placeholder, as transform handles creation
		transform: standardizeCallout,
	}
];
