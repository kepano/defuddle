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
	
	// Standardize complex image elements (figure, picture, source, figcaption)
	{
		selector: 'figure, [class*="figure"], [class*="image"], [class*="img"], [class*="photo"], [class*="picture"], [class*="media"], [class*="caption"]',
		element: 'figure',
		transform: (el: Element, doc: Document): Element => {
			// Check if this element or its children contain an image
			const hasImage = containsImage(el);
			if (!hasImage) {
				return el; // Not an image element, return as is
			}
			
			// Find the main image element
			const imgElement = findMainImage(el);
			if (!imgElement) {
				return el; // No image found, return as is
			}
			
			// Find any caption
			const caption = findCaption(el);
			
			// Process the image element
			const processedImg = processImageElement(imgElement, doc);
			
			// If there's a meaningful caption, wrap in a figure
			if (caption && hasMeaningfulCaption(caption)) {
				// Create a new figure element
				const figure = doc.createElement('figure');
				
				// Add the processed image to the figure
				figure.appendChild(processedImg);
				
				// Add caption
				const figcaption = doc.createElement('figcaption');
				figcaption.innerHTML = caption.innerHTML;
				figure.appendChild(figcaption);
				
				return figure;
			} else {
				// No meaningful caption, just return the image
				return processedImg;
			}
		}
	},
	
	// Additional image standardization rules can be added here
];

/**
 * Check if an element or its children contain an image
 */
function containsImage(element: Element): boolean {
	// Check if element itself is an image
	if (isImageElement(element)) {
		return true;
	}
	
	// Check if element contains an image
	const images = element.querySelectorAll('img, video, picture, source');
	return images.length > 0;
}

/**
 * Check if an element is an image element
 */
function isImageElement(element: Element): boolean {
	const tagName = element.tagName.toLowerCase();
	return tagName === 'img' || tagName === 'video' || tagName === 'picture' || tagName === 'source';
}

/**
 * Find the main image element in a container
 */
function findMainImage(element: Element): Element | null {
	// If element itself is an image, return it
	if (isImageElement(element)) {
		return element;
	}
	
	// Look for img elements first, but skip placeholder images
	const imgElements = Array.from(element.querySelectorAll('img')).filter(img => {
		// Skip placeholder images (SVG data URLs, empty alt, etc.)
		const src = img.getAttribute('src') || '';
		const alt = img.getAttribute('alt') || '';
		
		// Skip SVG data URLs (placeholders)
		if (src.includes('data:image/svg+xml')) {
			return false;
		}
		
		// Skip images with empty src
		if (!src || src === '') {
			return false;
		}
		
		// Skip images with specific classes that indicate placeholders
		if (img.classList.contains('placeholder') || 
			img.classList.contains('lazy-placeholder') ||
			img.parentElement?.classList.contains('Lazyload__loading')) {
			return false;
		}
		
		return true;
	});
	
	if (imgElements.length > 0) {
		// Return the first non-placeholder img element
		return imgElements[0];
	}
	
	// Look for picture elements
	const pictureElements = element.querySelectorAll('picture');
	if (pictureElements.length > 0) {
		return pictureElements[0];
	}
	
	// Look for video elements
	const videoElements = element.querySelectorAll('video');
	if (videoElements.length > 0) {
		return videoElements[0];
	}
	
	// Look for source elements
	const sourceElements = element.querySelectorAll('source');
	if (sourceElements.length > 0) {
		return sourceElements[0];
	}
	
	return null;
}

/**
 * Find caption in an element
 */
function findCaption(element: Element): Element | null {
	// Check for existing figcaption
	const figcaption = element.querySelector('figcaption');
	if (figcaption) {
		return figcaption;
	}
	
	// Check for elements with caption-related classes or attributes
	const captionSelectors = [
		'[class*="caption"]',
		'[class*="description"]',
		'[class*="alt"]',
		'[class*="title"]',
		'[aria-label]',
		'[title]'
	];
	
	// Track found captions to avoid duplicates
	const foundCaptions = new Set<string>();
	
	for (const selector of captionSelectors) {
		const captionElements = element.querySelectorAll(selector);
		for (const captionEl of captionElements) {
			// Skip if this is the image element itself
			if (isImageElement(captionEl)) {
				continue;
			}
			
			// Check if this element has text content
			const textContent = captionEl.textContent?.trim();
			if (textContent && textContent.length > 0) {
				// Check if we've already found this caption text
				if (!foundCaptions.has(textContent)) {
					foundCaptions.add(textContent);
					return captionEl;
				}
			}
		}
	}
	
	// Check for alt attribute on image
	const imgElement = element.querySelector('img');
	if (imgElement && imgElement.hasAttribute('alt')) {
		const altText = imgElement.getAttribute('alt');
		if (altText && altText.trim().length > 0) {
			// Create a new element for the alt text
			const captionEl = element.ownerDocument.createElement('div');
			captionEl.textContent = altText;
			return captionEl;
		}
	}
	
	return null;
}

/**
 * Check if a caption is meaningful enough to warrant a figure element
 */
function hasMeaningfulCaption(caption: Element): boolean {
	// Get the text content
	const textContent = caption.textContent?.trim() || '';
	
	// If it's just a URL or very short, it's not meaningful
	if (textContent.length < 10 || 
		textContent.startsWith('http://') || 
		textContent.startsWith('https://')) {
		return false;
	}
	
	// Check if it's just a filename or path
	if (textContent.match(/^[\w\-\.\/\\]+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
		return false;
	}
	
	// Check if it's just a number or date
	if (textContent.match(/^\d+$/) || textContent.match(/^\d{4}-\d{2}-\d{2}$/)) {
		return false;
	}
	
	return true;
}

/**
 * Process an image element
 */
function processImageElement(element: Element, doc: Document): Element {
	const tagName = element.tagName.toLowerCase();
	
	// Handle different types of image elements
	if (tagName === 'img') {
		// For img elements, just return a clone
		return element.cloneNode(true) as Element;
	} else if (tagName === 'video') {
		// For video elements, return a clone
		return element.cloneNode(true) as Element;
	} else if (tagName === 'picture') {
		// For picture elements, process its children
		const picture = doc.createElement('picture');
		
		// Process source elements
		const sources = element.querySelectorAll('source');
		sources.forEach(source => {
			picture.appendChild(source.cloneNode(true));
		});
		
		// Process img element - find the best one (not a placeholder)
		const imgElements = Array.from(element.querySelectorAll('img')).filter(img => {
			const src = img.getAttribute('src') || '';
			return !src.includes('data:image/svg+xml') && src !== '';
		});
		
		if (imgElements.length > 0) {
			picture.appendChild(imgElements[0].cloneNode(true));
		} else {
			// If no good img found, just use the first one
			const img = element.querySelector('img');
			if (img) {
				picture.appendChild(img.cloneNode(true));
			}
		}
		
		return picture;
	} else if (tagName === 'source') {
		// For source elements, create a picture element with the source
		const picture = doc.createElement('picture');
		picture.appendChild(element.cloneNode(true));
		
		// Try to find a related img element
		const parent = element.parentElement;
		if (parent) {
			const imgElements = Array.from(parent.querySelectorAll('img')).filter(img => {
				const src = img.getAttribute('src') || '';
				return !src.includes('data:image/svg+xml') && src !== '';
			});
			
			if (imgElements.length > 0) {
				picture.appendChild(imgElements[0].cloneNode(true));
			} else {
				// If no good img found, just use the first one
				const img = parent.querySelector('img');
				if (img) {
					picture.appendChild(img.cloneNode(true));
				}
			}
		}
		
		return picture;
	}
	
	// Default case: return a clone
	return element.cloneNode(true) as Element;
}
