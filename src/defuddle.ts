import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse } from './types';
import { ExtractorRegistry } from './extractor-registry';
import { 
	HIDDEN_ELEMENT_SELECTORS,
	MOBILE_WIDTH,
	BLOCK_ELEMENTS,
	EXACT_SELECTORS,
	PARTIAL_SELECTORS,
	ENTRY_POINT_ELEMENTS,
	TEST_ATTRIBUTES
} from './constants';
import { standardizeContent } from './standardize';
import { ContentScorer, ContentScore } from './scoring';
import { getComputedStyle } from './utils';

interface StyleChange {
	selector: string;
	styles: string;
}

export class Defuddle {
	private readonly doc: Document;
	private options: DefuddleOptions;
	private debug: boolean;

	/**
	 * Create a new Defuddle instance
	 * @param doc - The document to parse
	 * @param options - Options for parsing
	 */
	constructor(doc: Document, options: DefuddleOptions = {}) {
		this.doc = doc;
		this.options = options;
		this.debug = options.debug || false;
	}

	/**
	 * Parse the document and extract its main content
	 */
	parse(): DefuddleResponse {
		const startTime = Date.now();

		// Extract metadata first since we'll need it in multiple places
		const schemaOrgData = MetadataExtractor.extractSchemaOrgData(this.doc);
		const metadata = MetadataExtractor.extract(this.doc, schemaOrgData);

		try {
			// Try to use a specific extractor first
			const url = this.options.url || this.doc.URL;
			const extractor = ExtractorRegistry.findExtractor(this.doc, url, schemaOrgData);
			if (extractor && extractor.canExtract()) {
				const extracted = extractor.extract();
				const endTime = Date.now();
				
				return {
					content: extracted.contentHtml,
					title: extracted.variables?.title || metadata.title,
					description: metadata.description,
					domain: metadata.domain,
					favicon: metadata.favicon,
					image: metadata.image,
					published: extracted.variables?.published || metadata.published,
					author: extracted.variables?.author || metadata.author,
					site: metadata.site,
					schemaOrgData: metadata.schemaOrgData,
					wordCount: this.countWords(extracted.contentHtml),
					parseTime: Math.round(endTime - startTime),
					extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase()
				};
			}

			// Evaluate styles and sizes on original document
			const mobileStyles = this._evaluateMediaQueries(this.doc);
			
			// Find small images in original document, excluding lazy-loaded ones
			const smallImages = this.findSmallImages(this.doc);
			
			// Clone document
			const clone = this.doc.cloneNode(true) as Document;
			
			// Apply mobile style to clone
			this.applyMobileStyles(clone, mobileStyles);

			// Remove non-content blocks by scoring
			ContentScorer.scoreAndRemove(clone, this.debug);

			// Find main content
			const mainContent = this.findMainContent(clone);
			if (!mainContent) {
				const endTime = Date.now();
				return {
					content: this.doc.body.innerHTML,
					...metadata,
					wordCount: this.countWords(this.doc.body.innerHTML),
					parseTime: Math.round(endTime - startTime)
				};
			}

			// Remove small images
			this.removeSmallImages(clone, smallImages);

			// Remove hidden elements
			this.removeHiddenElements(clone);	

			// Remove clutter using selectors
			this.removeClutter(clone);

			// Normalize the main content
			standardizeContent(mainContent, metadata, this.doc, this.debug);

			const content = mainContent.outerHTML;
			const endTime = Date.now();

			return {
				content,
				...metadata,
				wordCount: this.countWords(content),
				parseTime: Math.round(endTime - startTime)
			};
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			const endTime = Date.now();
			return {
				content: this.doc.body.innerHTML,
				...metadata,
				wordCount: this.countWords(this.doc.body.innerHTML),
				parseTime: Math.round(endTime - startTime)
			};
		}
	}

	private countWords(content: string): number {
		// Create a temporary div to parse HTML content
		const tempDiv = this.doc.createElement('div');
		tempDiv.innerHTML = content;

		// Get text content, removing extra whitespace
		const text = tempDiv.textContent || '';
		const words = text
			.trim()
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.split(' ')
			.filter(word => word.length > 0); // Filter out empty strings

		return words.length;
	}

	// Make all other methods private by removing the static keyword and using private
	private _log(...args: any[]): void {
		if (this.debug) {
			console.log('Defuddle:', ...args);
		}
	}

	private _evaluateMediaQueries(doc: Document): StyleChange[] {
		const mobileStyles: StyleChange[] = [];
		const maxWidthRegex = /max-width[^:]*:\s*(\d+)/;

		try {
			// Get all styles, including inline styles
			const sheets = Array.from(doc.styleSheets).filter(sheet => {
				try {
					// Access rules once to check validity
					sheet.cssRules;
					return true;
				} catch (e) {
					// Expected error for cross-origin stylesheets or Node.js environment
					if (e instanceof DOMException && e.name === 'SecurityError') {
						return false;
					}
					return false;
				}
			});
			
			// Process all sheets in a single pass
			const mediaRules = sheets.flatMap(sheet => {
				try {
					// Check if we're in a browser environment where CSSMediaRule is available
					if (typeof CSSMediaRule === 'undefined') {
						return [];
					}

					return Array.from(sheet.cssRules)
						.filter((rule): rule is CSSMediaRule => 
							rule instanceof CSSMediaRule &&
							rule.conditionText.includes('max-width')
						);
				} catch (e) {
					if (this.debug) {
						console.warn('Defuddle: Failed to process stylesheet:', e);
					}
					return [];
				}
			});

			// Process all media rules in a single pass
			mediaRules.forEach(rule => {
				const match = rule.conditionText.match(maxWidthRegex);
				if (match) {
					const maxWidth = parseInt(match[1]);
					
					if (MOBILE_WIDTH <= maxWidth) {
						// Batch process all style rules
						const styleRules = Array.from(rule.cssRules)
							.filter((r): r is CSSStyleRule => r instanceof CSSStyleRule);

						styleRules.forEach(cssRule => {
							try {
								mobileStyles.push({
									selector: cssRule.selectorText,
									styles: cssRule.style.cssText
								});
							} catch (e) {
								if (this.debug) {
									console.warn('Defuddle: Failed to process CSS rule:', e);
								}
							}
						});
					}
				}
			});
		} catch (e) {
			console.error('Defuddle: Error evaluating media queries:', e);
		}

		return mobileStyles;
	}

	private applyMobileStyles(doc: Document, mobileStyles: StyleChange[]) {
		let appliedCount = 0;

		mobileStyles.forEach(({selector, styles}) => {
			try {
				const elements = doc.querySelectorAll(selector);
				elements.forEach(element => {
					element.setAttribute('style', 
						(element.getAttribute('style') || '') + styles
					);
					appliedCount++;
				});
			} catch (e) {
				console.error('Defuddle', 'Error applying styles for selector:', selector, e);
			}
		});

	}

	private removeHiddenElements(doc: Document) {
		let count = 0;
		const elementsToRemove = new Set<Element>();

		// First pass: Get all elements matching hidden selectors
		const hiddenElements = doc.querySelectorAll(HIDDEN_ELEMENT_SELECTORS);
		hiddenElements.forEach(el => elementsToRemove.add(el));
		count += hiddenElements.length;

		// Second pass: Get all elements and check their styles
		const allElements = Array.from(doc.getElementsByTagName('*'));

		// Process styles in batches to minimize layout thrashing
		const BATCH_SIZE = 100;
		for (let i = 0; i < allElements.length; i += BATCH_SIZE) {
			const batch = allElements.slice(i, i + BATCH_SIZE);
			
			// Read phase - gather all computedStyles
			const styles = batch.map(element => {
				try {
					return element.ownerDocument.defaultView?.getComputedStyle(element);
				} catch (e) {
					// If we can't get computed style, check inline styles
					const style = element.getAttribute('style');
					if (!style) return null;
					
					// Create a temporary style element to parse inline styles
					const tempStyle = doc.createElement('style');
					tempStyle.textContent = `* { ${style} }`;
					doc.head.appendChild(tempStyle);
					const computedStyle = element.ownerDocument.defaultView?.getComputedStyle(element);
					doc.head.removeChild(tempStyle);
					return computedStyle;
				}
			});
			
			// Write phase - mark elements for removal
			batch.forEach((element, index) => {
				const computedStyle = styles[index];
				if (computedStyle && (
					computedStyle.display === 'none' ||
					computedStyle.visibility === 'hidden' ||
					computedStyle.opacity === '0'
				)) {
					elementsToRemove.add(element);
					count++;
				}
			});
		}

		// Final pass: Batch remove all hidden elements
		this._log('Removed hidden elements:', count);
	}

	private removeClutter(doc: Document) {
		const startTime = Date.now();
		let exactSelectorCount = 0;
		let partialSelectorCount = 0;

		// Track all elements to be removed
		const elementsToRemove = new Set<Element>();

		// First collect elements matching exact selectors
		const exactElements = doc.querySelectorAll(EXACT_SELECTORS.join(','));
		exactElements.forEach(el => {
			if (el?.parentNode) {
				elementsToRemove.add(el);
				exactSelectorCount++;
			}
		});

		// Pre-compile regexes and combine into a single regex for better performance
		const combinedPattern = PARTIAL_SELECTORS.join('|');
		const partialRegex = new RegExp(combinedPattern, 'i');

		// Create an efficient attribute selector for elements we care about
		const attributeSelector = TEST_ATTRIBUTES.map(attr => `[${attr}]`).join(',');
		const allElements = doc.querySelectorAll(attributeSelector);

		// Process elements for partial matches
		allElements.forEach(el => {
			// Skip if already marked for removal
			if (elementsToRemove.has(el)) {
				return;
			}

			// Get all relevant attributes and combine into a single string
			const attrs = TEST_ATTRIBUTES.map(attr => {
				if (attr === 'class') {
					return el.className && typeof el.className === 'string' ? el.className : '';
				}
				if (attr === 'id') {
					return el.id || '';
				}
				return el.getAttribute(attr) || '';
			}).join(' ').toLowerCase();

			// Skip if no attributes to check
			if (!attrs.trim()) {
				return;
			}

			// Check for partial match using single regex test
			if (partialRegex.test(attrs)) {
				elementsToRemove.add(el);
				partialSelectorCount++;
			}
		});

		// Remove all collected elements in a single pass
		elementsToRemove.forEach(el => el.remove());

		const endTime = Date.now();
		this._log('Removed clutter elements:', {
			exactSelectors: exactSelectorCount,
			partialSelectors: partialSelectorCount,
			total: elementsToRemove.size,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	// Find small IMG and SVG elements
	private findSmallImages(doc: Document): Set<string> {
		const MIN_DIMENSION = 33;
		const smallImages = new Set<string>();
		const transformRegex = /scale\(([\d.]+)\)/;
		const startTime = Date.now();
		let processedCount = 0;

		// 1. Read phase - Gather all elements in a single pass
		const elements = [
			...Array.from(doc.getElementsByTagName('img')),
			...Array.from(doc.getElementsByTagName('svg'))
		].filter(element => {
			// Skip lazy-loaded images that haven't been processed yet
			// and math images which may be small
			if (element.tagName.toLowerCase() === 'img') {
				const ignoredImage = element.classList.contains('lazy') || 
					element.classList.contains('lazyload') ||
					element.classList.contains('latex') ||
					element.hasAttribute('decoding') ||
					element.hasAttribute('data-src') ||
					element.hasAttribute('data-srcset') ||
					element.hasAttribute('loading');
				return !ignoredImage;
			}
			return true;
		});

		if (elements.length === 0) {
			return smallImages;
		}

		// 2. Batch process - Collect all measurements in one go
		const measurements = elements.map(element => ({
			element,
			// Static attributes (no reflow)
			naturalWidth: element.tagName.toLowerCase() === 'img' ? 
				parseInt(element.getAttribute('width') || '0') || 0 : 0,
			naturalHeight: element.tagName.toLowerCase() === 'img' ? 
				parseInt(element.getAttribute('height') || '0') || 0 : 0,
			attrWidth: parseInt(element.getAttribute('width') || '0'),
			attrHeight: parseInt(element.getAttribute('height') || '0')
		}));

		// 3. Batch compute styles - Process in chunks to avoid long tasks
		const BATCH_SIZE = 50;
		for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
			const batch = measurements.slice(i, i + BATCH_SIZE);
			
			try {
				// Read phase - compute all styles at once
				const styles = batch.map(({ element }) => {
					try {
						return element.ownerDocument.defaultView?.getComputedStyle(element);
					} catch (e) {
						return null;
					}
				});

				// Get bounding rectangles if available
				const rects = batch.map(({ element }) => {
					try {
						return element.getBoundingClientRect();
					} catch (e) {
						return null;
					}
				});
				
				// Process phase - no DOM operations
				batch.forEach((measurement, index) => {
					try {
						const style = styles[index];
						const rect = rects[index];
						
						if (!style) return;
						
						// Get transform scale in the same batch
						const transform = style.transform;
						const scale = transform ? 
							parseFloat(transform.match(transformRegex)?.[1] || '1') : 1;

						// Calculate effective dimensions
						const widths = [
							measurement.naturalWidth,
							measurement.attrWidth,
							parseInt(style.width) || 0,
							rect ? rect.width * scale : 0
						].filter(dim => typeof dim === 'number' && dim > 0);

						const heights = [
							measurement.naturalHeight,
							measurement.attrHeight,
							parseInt(style.height) || 0,
							rect ? rect.height * scale : 0
						].filter(dim => typeof dim === 'number' && dim > 0);

						// Decision phase - no DOM operations
						if (widths.length > 0 && heights.length > 0) {
							const effectiveWidth = Math.min(...widths);
							const effectiveHeight = Math.min(...heights);

							if (effectiveWidth < MIN_DIMENSION || effectiveHeight < MIN_DIMENSION) {
								const identifier = this.getElementIdentifier(measurement.element);
								if (identifier) {
									smallImages.add(identifier);
									processedCount++;
								}
							}
						}
					} catch (e) {
						if (this.debug) {
							console.warn('Defuddle: Failed to process element dimensions:', e);
						}
					}
				});
			} catch (e) {
				if (this.debug) {
					console.warn('Defuddle: Failed to process batch:', e);
				}
			}
		}

		const endTime = Date.now();
		this._log('Found small elements:', {
			count: processedCount,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});

		return smallImages;
	}

	private removeSmallImages(doc: Document, smallImages: Set<string>) {
		let removedCount = 0;

		['img', 'svg'].forEach(tag => {
			const elements = doc.getElementsByTagName(tag);
			Array.from(elements).forEach(element => {
				const identifier = this.getElementIdentifier(element);
				if (identifier && smallImages.has(identifier)) {
					element.remove();
					removedCount++;
				}
			});
		});

		this._log('Removed small elements:', removedCount);
	}

	private getElementIdentifier(element: Element): string | null {
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
		const className = element.className || '';
		const viewBox = element.tagName.toLowerCase() === 'svg' ? element.getAttribute('viewBox') || '' : '';
		
		if (id) return `id:${id}`;
		if (viewBox) return `viewBox:${viewBox}`;
		if (className) return `class:${className}`;
		
		return null;
	}

	private findMainContent(doc: Document): Element | null {
		// Find all potential content containers
		const candidates: { element: Element; score: number }[] = [];

		ENTRY_POINT_ELEMENTS.forEach((selector, index) => {
			const elements = doc.querySelectorAll(selector);
			elements.forEach(element => {
				// Base score from selector priority (earlier = higher)
				let score = (ENTRY_POINT_ELEMENTS.length - index) * 40;

				// Add score based on content analysis
				score += ContentScorer.scoreElement(element);
				
				candidates.push({ element, score });
			});
		});

		if (candidates.length === 0) {
			// Fall back to scoring block elements
			return this.findContentByScoring(doc);
		}

		// Sort by score descending
		candidates.sort((a, b) => b.score - a.score);
		
		if (this.debug) {
			this._log('Content candidates:', candidates.map(c => ({
				element: c.element.tagName,
				selector: this.getElementSelector(c.element),
				score: c.score
			})));
		}

		// If we only matched body, try table-based detection
		if (candidates.length === 1 && candidates[0].element.tagName.toLowerCase() === 'body') {
			const tableContent = this.findTableBasedContent(doc);
			if (tableContent) {
				return tableContent;
			}
		}

		return candidates[0].element;
	}

	private findTableBasedContent(doc: Document): Element | null {
		// First check if this looks like an old-style table-based layout
		const tables = Array.from(doc.getElementsByTagName('table'));
		const hasTableLayout = tables.some(table => {
			const width = parseInt(table.getAttribute('width') || '0');
			const style = this.getComputedStyle(table);
			return width > 400 || 
				(style?.width.includes('px') && parseInt(style.width) > 400) ||
				table.getAttribute('align') === 'center' ||
				table.className.toLowerCase().includes('content') ||
				table.className.toLowerCase().includes('article');
		});

		if (!hasTableLayout) {
			return null; // Don't try table-based extraction for modern layouts
		}

		const cells = Array.from(doc.getElementsByTagName('td'));
		return ContentScorer.findBestElement(cells);
	}

	private findContentByScoring(doc: Document): Element | null {
		const candidates: ContentScore[] = [];

		BLOCK_ELEMENTS.forEach((tag: string) => {
			Array.from(doc.getElementsByTagName(tag)).forEach((element: Element) => {
				const score = ContentScorer.scoreElement(element);
				if (score > 0) {
					candidates.push({ score, element });
				}
			});
		});

		return candidates.length > 0 ? candidates.sort((a, b) => b.score - a.score)[0].element : null;
	}

	private getElementSelector(element: Element): string {
		const parts: string[] = [];
		let current: Element | null = element;
		
		while (current && current !== this.doc.documentElement) {
			let selector = current.tagName.toLowerCase();
			if (current.id) {
				selector += '#' + current.id;
			} else if (current.className && typeof current.className === 'string') {
				selector += '.' + current.className.trim().split(/\s+/).join('.');
			}
			parts.unshift(selector);
			current = current.parentElement;
		}
		
		return parts.join(' > ');
	}

	private getComputedStyle(element: Element): CSSStyleDeclaration | null {
		return getComputedStyle(element);
	}
} 
