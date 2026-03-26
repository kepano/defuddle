import { logDebug } from '../utils';
import { getClassName } from '../utils/dom';

const STYLE_WIDTH_PATTERN = /width\s*:\s*(\d+)/;
const STYLE_HEIGHT_PATTERN = /height\s*:\s*(\d+)/;

export function getElementIdentifier(element: Element): string | null {
	// Try to create a unique identifier using various attributes
	if (element.tagName.toLowerCase() === 'img') {
		// For lazy-loaded images, use data-src as identifier if available
		const dataSrc = element.getAttribute('data-src');
		if (dataSrc) return `src:${dataSrc}`;

		const src = element.getAttribute('src') || '';
		const srcset = element.getAttribute('srcset') || '';
		const dataSrcset = element.getAttribute('data-srcset');

		if (src) return `src:${src}`;
		if (srcset) return `srcset:${srcset}`;
		if (dataSrcset) return `srcset:${dataSrcset}`;
	}

	const id = element.id || '';
	const className = getClassName(element);
	const viewBox = element.tagName.toLowerCase() === 'svg' ? element.getAttribute('viewBox') || '' : '';

	if (id) return `id:${id}`;
	if (viewBox) return `viewBox:${viewBox}`;
	if (className) return `class:${className}`;

	return null;
}

// Find small IMG and SVG elements
export function findSmallImages(doc: Document, debug: boolean): Set<string> {
	const MIN_DIMENSION = 33;
	const smallImages = new Set<string>();
	let processedCount = 0;

	const elements = doc.querySelectorAll('img, svg');
	const defaultView = doc.defaultView;
	const isBrowser = typeof window !== 'undefined' && defaultView === window;

	for (const element of elements) {
		const attrWidth = parseInt(element.getAttribute('width') || '0');
		const attrHeight = parseInt(element.getAttribute('height') || '0');

		// Check inline style dimensions
		const style = element.getAttribute('style') || '';
		const styleWidth = parseInt(style.match(STYLE_WIDTH_PATTERN)?.[1] || '0');
		const styleHeight = parseInt(style.match(STYLE_HEIGHT_PATTERN)?.[1] || '0');

		// Use getComputedStyle and getBoundingClientRect only in browser
		let computedWidth = 0, computedHeight = 0;
		if (isBrowser) {
			try {
				const cs = defaultView!.getComputedStyle(element);
				computedWidth = parseInt(cs.width) || 0;
				computedHeight = parseInt(cs.height) || 0;
			} catch (e) {}
			try {
				const rect = element.getBoundingClientRect();
				if (rect.width > 0) computedWidth = computedWidth || rect.width;
				if (rect.height > 0) computedHeight = computedHeight || rect.height;
			} catch (e) {}
		}

		const widths = [attrWidth, styleWidth, computedWidth].filter(d => d > 0);
		const heights = [attrHeight, styleHeight, computedHeight].filter(d => d > 0);

		if (widths.length > 0 && heights.length > 0) {
			const effectiveWidth = Math.min(...widths);
			const effectiveHeight = Math.min(...heights);

			if (effectiveWidth < MIN_DIMENSION || effectiveHeight < MIN_DIMENSION) {
				const identifier = getElementIdentifier(element);
				if (identifier) {
					smallImages.add(identifier);
					processedCount++;
				}
			}
		}
	}

	logDebug(debug, 'Found small elements:', processedCount);
	return smallImages;
}

export function removeSmallImages(doc: Document, smallImages: Set<string>, debug: boolean) {
	let removedCount = 0;

	['img', 'svg'].forEach(tag => {
		const elements = doc.getElementsByTagName(tag);
		Array.from(elements).forEach(element => {
			// Remove images with no source information at all (broken/empty images)
			if (tag === 'img') {
				const hasSrc = element.getAttribute('src') ||
					element.getAttribute('srcset') ||
					element.getAttribute('data-src') ||
					element.getAttribute('data-srcset') ||
					element.getAttribute('data-lazy-src') ||
					element.getAttribute('data-original');
				if (!hasSrc) {
					element.remove();
					removedCount++;
					return;
				}
			}
			const identifier = getElementIdentifier(element);
			if (identifier && smallImages.has(identifier)) {
				element.remove();
				removedCount++;
			}
		});
	});

	logDebug(debug, 'Removed small elements:', removedCount);
}
