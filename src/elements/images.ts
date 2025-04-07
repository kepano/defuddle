/**
 * Standardization rules for handling images
 */
export const imageRules = [
	// Handle lazy-loaded images
	{
		selector: 'img[data-src], img[data-srcset]',
		element: 'img',
		transform: (el: Element, doc: Document): Element => {
			// Handle data-src
			const dataSrc = el.getAttribute('data-src');
			if (dataSrc && !el.getAttribute('src')) {
				el.setAttribute('src', dataSrc);
			}

			// Handle data-srcset
			const dataSrcset = el.getAttribute('data-srcset');
			if (dataSrcset && !el.getAttribute('srcset')) {
				el.setAttribute('srcset', dataSrcset);
			}

			// Remove lazy loading related classes and attributes
			el.classList.remove('lazy', 'lazyload');
			el.removeAttribute('data-ll-status');
			el.removeAttribute('data-src');
			el.removeAttribute('data-srcset');
			
			return el;
		}
	},
	
	// Additional image standardization rules can be added here
];
