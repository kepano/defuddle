/**
 * Standardization rules for handling images
 */
export const imageRules = [
	// Handle lazy-loaded images
	{
		selector: 'img[data-src], img[data-srcset], img[loading="lazy"], img.lazy, img.lazyload',
		element: 'img',
		transform: (el: Element, doc: Document): Element => {
			// Check for base64 placeholder images
			const src = el.getAttribute('src') || '';
			if (isBase64Placeholder(src)) {
				// Remove the placeholder src if we have better alternatives
				if (hasBetterImageSource(el)) {
					el.removeAttribute('src');
				}
			}

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

			// Check for other attributes that might contain image URLs
			Array.from(el.attributes).forEach(attr => {
				if (attr.name === 'src' || attr.name === 'srcset' || attr.name === 'alt') {
					return; // Skip these attributes
				}

				// Check if attribute contains an image URL
				if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
					// This looks like a srcset value
					el.setAttribute('srcset', attr.value);
				} else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
					// This looks like a src value
					el.setAttribute('src', attr.value);
				}
			});

			// Remove lazy loading related classes and attributes
			el.classList.remove('lazy', 'lazyload');
			el.removeAttribute('data-ll-status');
			el.removeAttribute('data-src');
			el.removeAttribute('data-srcset');
			el.removeAttribute('loading');
			
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
				
				// Add caption - ensure we don't duplicate content
				const figcaption = doc.createElement('figcaption');
				
				// Extract unique caption content
				const uniqueCaptionContent = extractUniqueCaptionContent(caption);
				figcaption.innerHTML = uniqueCaptionContent;
				
				figure.appendChild(figcaption);
				
				// Remove the original caption element to prevent duplication
				if (caption.parentNode) {
					caption.parentNode.removeChild(caption);
				}
				
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
 * Check if a string is a base64 placeholder image
 */
function isBase64Placeholder(src: string): boolean {
	// Check if it's a base64 data URL
	const b64DataUrlRegex = /^data:image\/([^;]+);base64,/;
	const match = src.match(b64DataUrlRegex);
	
	if (!match) {
		return false;
	}
	
	// Skip SVG images as they can be meaningful even when small
	if (match[1] === 'svg+xml') {
		return false;
	}
	
	// Check if the base64 part is too small (likely a placeholder)
	const b64starts = match[0].length;
	const b64length = src.length - b64starts;
	
	// If less than 133 bytes (100 bytes after base64 encoding), it's likely a placeholder
	return b64length < 133;
}

/**
 * Check if an element has better image sources than the current src
 */
function hasBetterImageSource(element: Element): boolean {
	// Check for data-src or data-srcset
	if (element.hasAttribute('data-src') || element.hasAttribute('data-srcset')) {
		return true;
	}
	
	// Check for other attributes that might contain image URLs
	for (let i = 0; i < element.attributes.length; i++) {
		const attr = element.attributes[i];
		if (attr.name === 'src') {
			continue;
		}
		
		if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
			return true;
		}
	}
	
	return false;
}

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
		
		// Skip small base64 images (placeholders)
		if (isBase64Placeholder(src)) {
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
	
	// Look for source elements with data-srcset
	const sourceElements = Array.from(element.querySelectorAll('source')).filter(source => {
		return source.hasAttribute('data-srcset') && source.getAttribute('data-srcset') !== '';
	});
	
	if (sourceElements.length > 0) {
		return sourceElements[0];
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
	
	// Look for any source elements as a last resort
	const anySourceElements = element.querySelectorAll('source');
	if (anySourceElements.length > 0) {
		return anySourceElements[0];
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
		'[class*="credit"]',
		'[class*="text"]',
		'[class*="post-thumbnail-text"]',
		'[class*="image-caption"]',
		'[class*="photo-caption"]',
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
	
	// Check for sibling elements that might contain captions
	// This is useful for cases like the example where the caption is in a sibling div
	if (element.parentElement) {
		const parent = element.parentElement;
		const siblings = Array.from(parent.children).filter(child => child !== element);
		
		for (const sibling of siblings) {
			// Check if the sibling has caption-related classes
			const hasCaptionClass = Array.from(sibling.classList).some(cls => 
				cls.includes('caption') || 
				cls.includes('credit') || 
				cls.includes('text') || 
				cls.includes('description')
			);
			
			if (hasCaptionClass) {
				const textContent = sibling.textContent?.trim();
				if (textContent && textContent.length > 0) {
					return sibling;
				}
			}
		}
	}
	
	return null;
}

/**
 * Extract unique caption content to avoid duplication
 */
function extractUniqueCaptionContent(caption: Element): string {
	// Get all text nodes and elements with text content
	const textNodes: string[] = [];
	const processedTexts = new Set<string>();
	
	// Helper function to process a node
	const processNode = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent?.trim() || '';
			if (text && !processedTexts.has(text)) {
				textNodes.push(text);
				processedTexts.add(text);
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as Element;
			// Process child nodes
			Array.from(element.childNodes).forEach(processNode);
		}
	};
	
	// Process all child nodes
	Array.from(caption.childNodes).forEach(processNode);
	
	// If we found unique text nodes, use them
	if (textNodes.length > 0) {
		return textNodes.join(' ');
	}
	
	// Otherwise, just use the innerHTML but try to clean it up
	const html = caption.innerHTML;
	
	return html;
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
		// For img elements, check if it's a placeholder
		const src = element.getAttribute('src') || '';
		if (isBase64Placeholder(src) || 
			src.includes('data:image/svg+xml')) {
			// Try to find a better image in the parent
			const parent = element.parentElement;
			if (parent) {
				// Look for source elements with data-srcset
				const sourceElements = Array.from(parent.querySelectorAll('source')).filter(source => {
					return source.hasAttribute('data-srcset') && source.getAttribute('data-srcset') !== '';
				});
				
				if (sourceElements.length > 0) {
					// Create a picture element with the source
					const picture = doc.createElement('picture');
					sourceElements.forEach(source => {
						picture.appendChild(source.cloneNode(true));
					});
					
					// Create a new img element with the data-src
					const newImg = doc.createElement('img');
					const dataSrc = element.getAttribute('data-src');
					if (dataSrc) {
						newImg.setAttribute('src', dataSrc);
					}
					
					// Copy other attributes
					Array.from(element.attributes).forEach(attr => {
						if (attr.name !== 'src') {
							newImg.setAttribute(attr.name, attr.value);
						}
					});
					
					picture.appendChild(newImg);
					return picture;
				}
			}
		}
		
		// If we couldn't find a better image, just return a clone
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
			return !isBase64Placeholder(src) && 
				   !src.includes('data:image/svg+xml') && 
				   src !== '';
		});
		
		if (imgElements.length > 0) {
			picture.appendChild(imgElements[0].cloneNode(true));
		} else {
			// If no good img found, create a new one with data-src
			const placeholderImg = element.querySelector('img');
			if (placeholderImg && placeholderImg.hasAttribute('data-src')) {
				const newImg = doc.createElement('img');
				newImg.setAttribute('src', placeholderImg.getAttribute('data-src') || '');
				
				// Copy other attributes
				Array.from(placeholderImg.attributes).forEach(attr => {
					if (attr.name !== 'src') {
						newImg.setAttribute(attr.name, attr.value);
					}
				});
				
				picture.appendChild(newImg);
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
				return !isBase64Placeholder(src) && 
					   !src.includes('data:image/svg+xml') && 
					   src !== '';
			});
			
			if (imgElements.length > 0) {
				picture.appendChild(imgElements[0].cloneNode(true));
			} else {
				// If no good img found, look for one with data-src
				const dataSrcImg = parent.querySelector('img[data-src]');
				if (dataSrcImg) {
					const newImg = doc.createElement('img');
					newImg.setAttribute('src', dataSrcImg.getAttribute('data-src') || '');
					
					// Copy other attributes
					Array.from(dataSrcImg.attributes).forEach(attr => {
						if (attr.name !== 'src') {
							newImg.setAttribute(attr.name, attr.value);
						}
					});
					
					picture.appendChild(newImg);
				}
			}
		}
		
		return picture;
	}
	
	// Default case: return a clone
	return element.cloneNode(true) as Element;
}
