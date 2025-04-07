/**
 * Standardization rules for handling images
 */

// Pre-compile regular expressions
const b64DataUrlRegex = /^data:image\/([^;]+);base64,/;
const srcsetPattern = /\.(jpg|jpeg|png|webp)\s+\d/;
const srcPattern = /^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/;
const imageUrlPattern = /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i;
const widthPattern = /\s(\d+)w/;
const dprPattern = /dpr=(\d+(?:\.\d+)?)/;
const urlPattern = /^([^\s]+)/;
const filenamePattern = /^[\w\-\.\/\\]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const imageRules = [
	// Handle picture elements first to ensure we get the highest resolution
	{
		selector: 'picture',
		element: 'img',
		transform: (el: Element, doc: Document): Element => {
			// Get all source elements
			const sourceElements = el.querySelectorAll('source');
			
			// Create a new img element
			const newImg = doc.createElement('img');
			
			// If we have multiple sources, try to select the best one
			if (sourceElements.length > 1) {
				// Find the best source based on media queries and srcset
				const bestSource = selectBestSource(sourceElements);
				if (bestSource) {
					// Get the srcset from the best source
					const srcset = bestSource.getAttribute('srcset');
					if (srcset) {
						applySrcsetToImage(srcset, newImg);
					}
				}
			} else if (sourceElements.length === 1) {
				// If only one source, use it
				const srcset = sourceElements[0].getAttribute('srcset');
				if (srcset) {
					applySrcsetToImage(srcset, newImg);
				}
			}
			
			// Copy other attributes from the original img if it exists
			const originalImg = el.querySelector('img');
			if (originalImg) {
				// Copy all attributes except srcset
				copyAttributesExcept(originalImg, newImg, ['srcset']);
				
				// Always set the src attribute directly from the original img
				const originalSrc = originalImg.getAttribute('src');
				
				// Always use the original src if it exists
				if (originalSrc) {
					newImg.setAttribute('src', originalSrc);
				}
			}

			if (!newImg.hasAttribute('src') && originalImg) {
				const originalSrc = originalImg.getAttribute('src');
				if (originalSrc) {
					newImg.setAttribute('src', originalSrc);
				}
			}
			
			return newImg;
		}
	},
	
	// Handle lazy-loaded images
	{
		selector: 'img[data-src], img[data-srcset], img[loading="lazy"], img.lazy, img.lazyload',
		element: 'img',
		transform: (el: Element, doc: Document): Element => {
			// Check for base64 placeholder images
			const src = el.getAttribute('src') || '';
			const hasBetterSource = hasBetterImageSource(el);
			
			if (isBase64Placeholder(src) && hasBetterSource) {
				// Remove the placeholder src if we have better alternatives
				el.removeAttribute('src');
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
			for (let i = 0; i < el.attributes.length; i++) {
				const attr = el.attributes[i];
				if (attr.name === 'src' || attr.name === 'srcset' || attr.name === 'alt') {
					continue; // Skip these attributes
				}

				// Check if attribute contains an image URL
				if (srcsetPattern.test(attr.value)) {
					// This looks like a srcset value
					el.setAttribute('srcset', attr.value);
				} else if (srcPattern.test(attr.value)) {
					// This looks like a src value
					el.setAttribute('src', attr.value);
				}
			}

			// Remove lazy loading related classes and attributes
			el.classList.remove('lazy', 'lazyload');
			el.removeAttribute('data-ll-status');
			el.removeAttribute('data-src');
			el.removeAttribute('data-srcset');
			el.removeAttribute('loading');
			
			return el;
		}
	},
	
	// Handle span elements containing images with captions
	{
		selector: 'span:has(img)',
		element: 'span',
		transform: (el: Element, doc: Document): Element => {
			try {
				// Check if this element contains an image
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
			} catch (error) {
				console.warn('Error processing span with image:', error);
				return el; // Return original element on error
			}
		}
	},
	
	// Standardize complex image elements (figure, picture, source, figcaption)
	{
		selector: 'figure, [class*="figure"], [class*="image"], [class*="img"], [class*="photo"], [class*="picture"], [class*="media"], [class*="caption"]',
		element: 'figure',
		transform: (el: Element, doc: Document): Element => {
			try {
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
			} catch (error) {
				console.warn('Error processing complex image element:', error);
				return el; // Return original element on error
			}
		}
	},
];

/**
 * Apply srcset to an image element
 */
function applySrcsetToImage(srcset: string, img: Element): void {
	img.setAttribute('srcset', srcset);
	
	// Extract the first URL from srcset as the src
	const firstUrl = extractFirstUrlFromSrcset(srcset);
	if (firstUrl && isValidImageUrl(firstUrl)) {
		img.setAttribute('src', firstUrl);
	}
}

/**
 * Copy attributes from one element to another, excluding specified attributes
 */
function copyAttributesExcept(source: Element, target: Element, excludeAttrs: string[]): void {
	for (let i = 0; i < source.attributes.length; i++) {
		const attr = source.attributes[i];
		if (!excludeAttrs.includes(attr.name)) {
			target.setAttribute(attr.name, attr.value);
		}
	}
}

/**
 * Check if a string is a base64 placeholder image
 */
function isBase64Placeholder(src: string): boolean {
	// Check if it's a base64 data URL
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
 * Check if a string is an SVG data URL
 */
function isSvgDataUrl(src: string): boolean {
	return src.startsWith('data:image/svg+xml');
}

/**
 * Check if a string is a valid image URL
 */
function isValidImageUrl(src: string): boolean {
	// Skip data URLs (both base64 and SVG)
	if (src.startsWith('data:')) {
		return false;
	}
	
	// Skip empty or invalid URLs
	if (!src || src.trim() === '') {
		return false;
	}
	
	// Check if it's a valid image URL
	return imageUrlPattern.test(src) || 
		src.includes('image') || 
		src.includes('img') || 
		src.includes('photo');
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
	
	// Look for picture elements first - they often contain the highest quality images
	const pictureElements = element.querySelectorAll('picture');
	if (pictureElements.length > 0) {
		// For picture elements, we want to return the picture itself
		// so we can process all its sources
		return pictureElements[0];
	}
	
	// Look for img elements next, but skip placeholder images
	const imgElements = element.querySelectorAll('img');
	const filteredImgElements = [];
	
	for (let i = 0; i < imgElements.length; i++) {
		const img = imgElements[i];
		// Skip placeholder images (SVG data URLs, empty alt, etc.)
		const src = img.getAttribute('src') || '';
		const alt = img.getAttribute('alt') || '';
		
		// Skip SVG data URLs (placeholders)
		if (src.includes('data:image/svg+xml')) {
			continue;
		}
		
		// Skip base64 placeholder images
		if (isBase64Placeholder(src)) {
			continue;
		}
		
		// Skip empty alt text (often indicates decorative images)
		// But only if we have other images with alt text
		if (!alt.trim() && imgElements.length > 1) {
			continue;
		}
		
		filteredImgElements.push(img);
	}
	
	if (filteredImgElements.length > 0) {
		return filteredImgElements[0];
	}
	
	// Look for video elements next
	const videoElements = element.querySelectorAll('video');
	if (videoElements.length > 0) {
		return videoElements[0];
	}
	
	// Look for any source elements as a last resort
	const anySourceElements = element.querySelectorAll('source');
	if (anySourceElements.length > 0) {
		return anySourceElements[0];
	}
	
	// If we still haven't found an image, try a more aggressive search
	// This helps with deeply nested structures like Medium articles
	const allImages = element.querySelectorAll('img, picture, source, video');
	if (allImages.length > 0) {
		return allImages[0];
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
	
	// Combine selectors for a single query
	const combinedSelector = captionSelectors.join(', ');
	const captionElements = element.querySelectorAll(combinedSelector);
	
	for (let i = 0; i < captionElements.length; i++) {
		const captionEl = captionElements[i];
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
		const siblings = parent.children;
		
		for (let i = 0; i < siblings.length; i++) {
			const sibling = siblings[i];
			if (sibling === element) continue;
			
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
	
	// Look for text elements that follow an image within the same parent
	// This handles cases like <p><img><em>caption</em></p>
	const imgElements = element.querySelectorAll('img');
	for (let i = 0; i < imgElements.length; i++) {
		const img = imgElements[i];
		const parent = img.parentElement;
		if (!parent) continue;
		
		// Look for text elements that follow the image
		let nextElement = img.nextElementSibling;
		while (nextElement) {
			// Check if it's a text element (em, strong, span, etc.)
			if (['EM', 'STRONG', 'SPAN', 'I', 'B', 'SMALL', 'CITE'].includes(nextElement.tagName)) {
				const textContent = nextElement.textContent?.trim();
				if (textContent && textContent.length > 0) {
					return nextElement;
				}
			}
			nextElement = nextElement.nextElementSibling;
		}
	}
	
	// Check for text elements that are children of the same parent as the image
	// This handles cases like <span><img><em>caption</em></span>
	for (let i = 0; i < imgElements.length; i++) {
		const img = imgElements[i];
		const parent = img.parentElement;
		if (!parent) continue;
		
		// Get all text elements in the parent
		const textElements = parent.querySelectorAll('em, strong, span, i, b, small, cite');
		for (let j = 0; j < textElements.length; j++) {
			const textEl = textElements[j];
			// Skip if this is the image itself
			if (textEl === img) continue;
			
			const textContent = textEl.textContent?.trim();
			if (textContent && textContent.length > 0) {
				return textEl;
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
			const childNodes = element.childNodes;
			for (let i = 0; i < childNodes.length; i++) {
				processNode(childNodes[i]);
			}
		}
	};
	
	// Process all child nodes
	const childNodes = caption.childNodes;
	for (let i = 0; i < childNodes.length; i++) {
		processNode(childNodes[i]);
	}
	
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
	if (filenamePattern.test(textContent)) {
		return false;
	}
	
	// Check if it's just a number or date
	if (textContent.match(/^\d+$/) || datePattern.test(textContent)) {
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
		return processImgElement(element, doc);
	} else if (tagName === 'picture') {
		return processPictureElement(element, doc);
	} else if (tagName === 'source') {
		return processSourceElement(element, doc);
	}
	
	// Default case: return a clone
	return element.cloneNode(true) as Element;
}

/**
 * Process an img element
 */
function processImgElement(element: Element, doc: Document): Element {
	// For img elements, check if it's a placeholder
	const src = element.getAttribute('src') || '';
	if (isBase64Placeholder(src) || isSvgDataUrl(src)) {
		// Try to find a better image in the parent
		const parent = element.parentElement;
		if (parent) {
			// Look for source elements with data-srcset
			const sourceElements = parent.querySelectorAll('source');
			const filteredSources = [];
			
			for (let i = 0; i < sourceElements.length; i++) {
				const source = sourceElements[i];
				if (source.hasAttribute('data-srcset') && source.getAttribute('data-srcset') !== '') {
					filteredSources.push(source);
				}
			}
			
			if (filteredSources.length > 0) {
				// Create a new img element with the data-src
				const newImg = doc.createElement('img');
				const dataSrc = element.getAttribute('data-src');
				if (dataSrc && !isSvgDataUrl(dataSrc)) {
					newImg.setAttribute('src', dataSrc);
				}
				
				// Copy other attributes
				copyAttributesExcept(element, newImg, ['src']);
				
				return newImg;
			}
		}
	}
	
	// Return a clone of the img element
	return element.cloneNode(true) as Element;
}

/**
 * Process a picture element
 */
function processPictureElement(element: Element, doc: Document): Element {
	// For picture elements, we want to process all sources and select the best one
	// Create a new img element
	const newImg = doc.createElement('img');
	
	// Get all source elements
	const sourceElements = element.querySelectorAll('source');
	
	// If we have multiple sources, try to select the best one
	if (sourceElements.length > 1) {
		// Find the best source based on media queries and srcset
		const bestSource = selectBestSource(sourceElements);
		if (bestSource) {
			// Get the srcset from the best source
			const srcset = bestSource.getAttribute('srcset');
			if (srcset) {
				applySrcsetToImage(srcset, newImg);
			}
		}
	} else if (sourceElements.length === 1) {
		// If only one source, use it
		const srcset = sourceElements[0].getAttribute('srcset');
		if (srcset) {
			applySrcsetToImage(srcset, newImg);
		}
	}
	
	// Copy other attributes from the original img if it exists
	const originalImg = element.querySelector('img');
	if (originalImg) {
		// Copy all attributes except srcset
		copyAttributesExcept(originalImg, newImg, ['srcset']);
		
		// Always set the src attribute directly from the original img
		const originalSrc = originalImg.getAttribute('src');
		if (originalSrc) {
			newImg.setAttribute('src', originalSrc);
		}
	}
	
	return newImg;
}

/**
 * Process a source element
 */
function processSourceElement(element: Element, doc: Document): Element {
	// For source elements, create a new img element
	const newImg = doc.createElement('img');
	
	// Get the srcset from the source
	const srcset = element.getAttribute('srcset');
	if (srcset) {
		applySrcsetToImage(srcset, newImg);
	}
	
	// Try to find a related img element to copy other attributes
	const parent = element.parentElement;
	if (parent) {
		const imgElements = parent.querySelectorAll('img');
		const filteredImgElements = [];
		
		for (let i = 0; i < imgElements.length; i++) {
			const img = imgElements[i];
			const src = img.getAttribute('src') || '';
			if (!isBase64Placeholder(src) && !isSvgDataUrl(src) && src !== '') {
				filteredImgElements.push(img);
			}
		}
		
		if (filteredImgElements.length > 0) {
			copyAttributesExcept(filteredImgElements[0], newImg, ['src', 'srcset']);
			
			// If we still don't have a valid src, use the img's src
			if (!newImg.hasAttribute('src') || !isValidImageUrl(newImg.getAttribute('src') || '')) {
				const imgSrc = filteredImgElements[0].getAttribute('src');
				if (imgSrc && isValidImageUrl(imgSrc)) {
					newImg.setAttribute('src', imgSrc);
				}
			}
		} else {
			// If no good img found, look for one with data-src
			const dataSrcImg = parent.querySelector('img[data-src]');
			if (dataSrcImg) {
				copyAttributesExcept(dataSrcImg, newImg, ['src', 'srcset']);
				
				// If we still don't have a valid src, use the data-src
				if (!newImg.hasAttribute('src') || !isValidImageUrl(newImg.getAttribute('src') || '')) {
					const dataSrc = dataSrcImg.getAttribute('data-src');
					if (dataSrc && isValidImageUrl(dataSrc)) {
						newImg.setAttribute('src', dataSrc);
					}
				}
			}
		}
	}
	
	return newImg;
}

/**
 * Extract the first URL from a srcset attribute
 */
function extractFirstUrlFromSrcset(srcset: string): string | null {
	// Split the srcset by commas
	const parts = srcset.split(',');
	if (parts.length === 0) {
		return null;
	}
	
	// Get the first part
	const firstPart = parts[0].trim();
	
	// Extract the URL (everything before the first space)
	const urlMatch = firstPart.match(urlPattern);
	if (urlMatch && urlMatch[1]) {
		const url = urlMatch[1];
		
		// Skip SVG data URLs
		if (isSvgDataUrl(url)) {
			// Try to find a better URL in the srcset
			for (let i = 1; i < parts.length; i++) {
				const part = parts[i].trim();
				const match = part.match(urlPattern);
				if (match && match[1] && !isSvgDataUrl(match[1])) {
					return match[1];
				}
			}
			return null;
		}
		
		return url;
	}
	
	return null;
}

/**
 * Select the best source element from a list of sources
 * based on media queries and srcset values
 */
function selectBestSource(sources: NodeListOf<Element>): Element | null {
	if (sources.length === 0) {
		return null;
	}
	
	// If only one source, return it
	if (sources.length === 1) {
		return sources[0];
	}
	
	// First, try to find a source without media queries (default)
	for (let i = 0; i < sources.length; i++) {
		if (!sources[i].hasAttribute('media')) {
			return sources[i];
		}
	}
	
	// If no default source, try to find the highest resolution source
	// by analyzing the srcset values
	let bestSource: Element | null = null;
	let maxResolution = 0;
	
	for (let i = 0; i < sources.length; i++) {
		const source = sources[i];
		const srcset = source.getAttribute('srcset');
		if (!srcset) continue;
		
		// Extract width and DPR from srcset
		const widthMatch = srcset.match(widthPattern);
		const dprMatch = srcset.match(dprPattern);
		
		if (widthMatch && widthMatch[1]) {
			const width = parseInt(widthMatch[1], 10);
			const dpr = dprMatch ? parseFloat(dprMatch[1]) : 1;
			
			// Calculate effective resolution (width * DPR)
			const resolution = width * dpr;
			
			if (resolution > maxResolution) {
				maxResolution = resolution;
				bestSource = source;
			}
		}
	}
	
	// If we found a source with resolution, return it
	if (bestSource) {
		return bestSource;
	}
	
	// If no resolution found, return the first source
	return sources[0];
}
