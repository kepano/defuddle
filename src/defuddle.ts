import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse, MetaTagItem, DebugRemoval } from './types';
import { ExtractorRegistry } from './extractor-registry';
import {
	MOBILE_WIDTH,
	BLOCK_ELEMENTS,
	EXACT_SELECTORS,
	PARTIAL_SELECTORS,
	ENTRY_POINT_ELEMENTS,
	TEST_ATTRIBUTES,
	FOOTNOTE_LIST_SELECTORS
} from './constants';
import { standardizeContent } from './standardize';
import { standardizeFootnotes } from './elements/footnotes';
import { ContentScorer, ContentScore } from './scoring';
import { getComputedStyle, textPreview } from './utils';
import { parseHTML, serializeHTML, decodeHTMLEntities } from './utils/dom';

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
		// Try first with default settings
		let result = this.parseInternal();

		// If result has very little content, try again without clutter removal
		if (result.wordCount < 200) {
			this._log('Initial parse returned very little content, trying again');
			const retryResult = this.parseInternal({
				removePartialSelectors: false
			});

			// Only use the retry if it produces significantly more content.
			// A small increase likely means partial selectors correctly removed
			// clutter (author blocks, related articles, etc.) from a short article.
			// A large increase (2x+) suggests partial selectors were too aggressive.
			if (retryResult.wordCount > result.wordCount * 2) {
				this._log('Retry produced more content');
				result = retryResult;
			}
		}

		// Strip dangerous elements from this.doc before any fallback paths
		// that read from it (e.g. _findContentBySchemaText).
		// This must happen after parseInternal, which needs script tags
		// for schema.org extraction, site-specific extractors, and math.
		this._stripUnsafeElements();

		// If schema.org has a SocialMediaPosting with text content that is
		// longer than what we extracted, the scorer likely picked the wrong
		// element from a feed. Find the correct element in the DOM.
		const schemaText = this._getSchemaText(result.schemaOrgData);
		if (schemaText && this.countWords(schemaText) > result.wordCount) {
			const contentHtml = this._findContentBySchemaText(schemaText);
			if (contentHtml) {
				this._log('Found DOM content matching schema.org text');
				result.content = contentHtml;
				result.wordCount = this.countWords(contentHtml);
			} else {
				this._log('Using schema.org text as content (DOM element not found)');
				result.content = schemaText;
				result.wordCount = this.countWords(schemaText);
			}
		}

		return result;
	}

	/**
	 * Extract text content from schema.org data (e.g. SocialMediaPosting, Article)
	 */
	private _getSchemaText(schemaOrgData: any): string {
		if (!schemaOrgData) return '';

		const items = Array.isArray(schemaOrgData) ? schemaOrgData : [schemaOrgData];
		for (const item of items) {
			if (item?.text && typeof item.text === 'string') {
				return item.text;
			}
			if (item?.articleBody && typeof item.articleBody === 'string') {
				return item.articleBody;
			}
		}
		return '';
	}

	/**
	 * Remove dangerous elements and attributes from this.doc.
	 * Called after parseInternal so that extractors and schema extraction
	 * can still read script tags they depend on.
	 */
	private _stripUnsafeElements(): void {
		const body = this.doc.body;
		if (!body) return;

		// Remove dangerous elements. Iframes are kept — same-origin policy
		// isolates them, and they're widely used for legitimate media embeds.
		// Dangerous iframe attributes (srcdoc, javascript: src) are stripped
		// in the attribute pass below. Math scripts are preserved for LaTeX
		// content (matching the EXACT_SELECTORS approach).
		const dangerousElements = body.querySelectorAll(
			'script:not([type^="math/"]), style, noscript, frame, frameset, object, embed, applet, base'
		);
		for (const el of dangerousElements) el.remove();

		// Remove event handler attributes, dangerous URIs, and srcdoc
		const allElements = body.querySelectorAll('*');
		for (const el of allElements) {
			for (const attr of Array.from(el.attributes)) {
				const name = attr.name.toLowerCase();
				if (name.startsWith('on')) {
					el.removeAttribute(attr.name);
				} else if (name === 'srcdoc') {
					el.removeAttribute(attr.name);
				} else if (['href', 'src', 'action', 'formaction', 'xlink:href'].includes(name)) {
					const val = attr.value.replace(/[\s\u0000-\u001F]+/g, '').toLowerCase();
					if (val.startsWith('javascript:') || val.startsWith('data:text/html')) {
						el.removeAttribute(attr.name);
					}
				}
			}
		}
	}

	/**
	 * Find a DOM element whose text matches the schema.org text content.
	 * Used when the content scorer picked the wrong element from a feed page.
	 * Returns the element's inner HTML including sibling media (images, etc.)
	 */
	private _findContentBySchemaText(schemaText: string): string {
		const body = this.doc.body;
		if (!body) return '';

		// Use the first paragraph as the search phrase.
		// DOM textContent concatenates <p> elements without separators,
		// so we can't cross paragraph boundaries when matching.
		const firstPara = schemaText.split(/\n\s*\n/)[0]?.trim() || '';
		const searchPhrase = firstPara.substring(0, 100).trim();
		if (!searchPhrase) return '';

		const schemaWordCount = this.countWords(schemaText);

		// Find the smallest element whose text contains the search phrase
		// and whose word count is close to the schema text's word count
		let bestMatch: Element | null = null;
		let bestSize = Infinity;

		const allElements = body.querySelectorAll('*');
		for (const el of allElements) {
			const elText = (el.textContent || '');
			if (!elText.includes(searchPhrase)) continue;

			const elWords = elText.trim().split(/\s+/).length;
			// Element should contain roughly the same amount of text
			// (allow some slack for surrounding whitespace / minor extras)
			if (elWords >= schemaWordCount * 0.8 && elWords < bestSize) {
				bestSize = elWords;
				bestMatch = el;
			}
		}

		if (!bestMatch) return '';

		// Read the largest sibling image src BEFORE resolveRelativeUrls
		// can mangle comma-containing CDN URLs in srcset attributes
		let imageSrc = '';
		let imageAlt = '';
		const parent = bestMatch.parentElement;
		if (parent && parent !== body) {
			const images = parent.querySelectorAll('img');
			let largestImg: Element | null = null;
			let largestArea = 0;
			for (const img of images) {
				if (bestMatch.contains(img)) continue;
				const w = parseInt(img.getAttribute('width') || '0', 10);
				const h = parseInt(img.getAttribute('height') || '0', 10);
				const area = w * h;
				if (area > largestArea) {
					largestArea = area;
					largestImg = img;
				}
			}
			if (largestImg) {
				imageSrc = this._getLargestImageSrc(largestImg);
				imageAlt = largestImg.getAttribute('alt') || '';
				try {
					const baseUrl = this.options.url || this.doc.URL;
					if (baseUrl) imageSrc = new URL(imageSrc, baseUrl).href;
				} catch {}
			}
		}

		// Now resolve URLs in the text content
		this.resolveRelativeUrls(bestMatch);
		let html = serializeHTML(bestMatch);

		if (imageSrc) {
			const img = this.doc.createElement('img');
			img.setAttribute('src', imageSrc);
			img.setAttribute('alt', imageAlt);
			html += img.outerHTML;
		}

		return html;
	}

	/**
	 * Get the largest available src from an img element,
	 * checking srcset for higher-resolution versions.
	 */
	private _getLargestImageSrc(img: Element): string {
		const srcset = img.getAttribute('srcset') || '';
		if (!srcset) return img.getAttribute('src') || '';

		// Parse srcset entries: each ends with a width descriptor (e.g. "424w")
		// URLs may contain commas (e.g. Substack CDN), so split on width descriptors
		const entryPattern = /(.+?)\s+(\d+(?:\.\d+)?)w/g;
		let bestUrl = '';
		let bestWidth = 0;
		let match;
		let lastIndex = 0;

		while ((match = entryPattern.exec(srcset)) !== null) {
			let url = match[1].trim();
			if (lastIndex > 0) {
				url = url.replace(/^,\s*/, '');
			}
			lastIndex = entryPattern.lastIndex;

			const width = parseFloat(match[2]);
			if (url && width > bestWidth) {
				bestWidth = width;
				bestUrl = url;
			}
		}

		let url = bestUrl || img.getAttribute('src') || '';

		// Strip CDN width/crop constraints to get the full resolution image
		// (e.g. Cloudinary-style params: ,w_852,c_limit → removed)
		url = url.replace(/,w_\d+/g, '').replace(/,c_\w+/g, '');

		return url;
	}

	/**
	 * Parse the document, falling back to async extractors if sync parse yields no content
	 */
	async parseAsync(): Promise<DefuddleResponse> {
		const result = this.parse();

		if (result.wordCount > 0 || this.options.useAsync === false) {
			return result;
		}

		try {
			const url = this.options.url || this.doc.URL;
			const schemaOrgData = this._extractSchemaOrgData(this.doc);
			const extractor = ExtractorRegistry.findAsyncExtractor(this.doc, url, schemaOrgData);

			if (extractor) {
				const startTime = Date.now();
				const extracted = await extractor.extractAsync();
				const contentHtml = this.resolveContentUrls(extracted.contentHtml);

				const pageMetaTags = this._collectMetaTags();
				const metadata = MetadataExtractor.extract(this.doc, schemaOrgData, pageMetaTags);
				const endTime = Date.now();

				return {
					content: contentHtml,
					title: extracted.variables?.title || metadata.title,
					description: metadata.description,
					domain: metadata.domain,
					favicon: metadata.favicon,
					image: metadata.image,
					published: extracted.variables?.published || metadata.published,
					author: extracted.variables?.author || metadata.author,
					site: extracted.variables?.site || metadata.site,
					schemaOrgData: metadata.schemaOrgData,
					wordCount: this.countWords(extracted.contentHtml),
					parseTime: Math.round(endTime - startTime),
					extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase(),
					metaTags: pageMetaTags
				};
			}
		} catch (error) {
			console.error('Defuddle', 'Error in async extraction:', error);
		}

		return result;
	}

	/**
	 * Internal parse method that does the actual work
	 */
	private parseInternal(overrideOptions: Partial<DefuddleOptions> = {}): DefuddleResponse {
		const startTime = Date.now();
		const options = {
			removeExactSelectors: true,
			removePartialSelectors: true,
			removeHiddenElements: true,
			removeLowScoring: true,
			removeSmallImages: true,
			...this.options,
			...overrideOptions
		};
		const debugRemovals: DebugRemoval[] = [];

		// Extract schema.org data
		const schemaOrgData = this._extractSchemaOrgData(this.doc);

		const pageMetaTags = this._collectMetaTags();

		// Extract metadata
		const metadata = MetadataExtractor.extract(this.doc, schemaOrgData, pageMetaTags);

		if (options.removeImages) {
			this.removeImages(this.doc);
		}

		try {
			// Use site-specific extractor first, if there is one
			const url = options.url || this.doc.URL;
			const extractor = ExtractorRegistry.findExtractor(this.doc, url, schemaOrgData);
			if (extractor && extractor.canExtract()) {
				const extracted = extractor.extract();
				const contentHtml = this.resolveContentUrls(extracted.contentHtml);
				const endTime = Date.now();
				// console.log('Using extractor:', extractor.constructor.name.replace('Extractor', ''));
				return {
					content: contentHtml,
					title: extracted.variables?.title || metadata.title,
					description: metadata.description,
					domain: metadata.domain,
					favicon: metadata.favicon,
					image: metadata.image,
					published: extracted.variables?.published || metadata.published,
					author: extracted.variables?.author || metadata.author,
					site: extracted.variables?.site || metadata.site,
					schemaOrgData: metadata.schemaOrgData,
					wordCount: this.countWords(extracted.contentHtml),
					parseTime: Math.round(endTime - startTime),
					extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase(),
					metaTags: pageMetaTags
				};
			}

			// Continue if there is no extractor...

			// Evaluate mobile styles and sizes on original document
			const mobileStyles = this._evaluateMediaQueries(this.doc);

			// Find small images in original document, excluding lazy-loaded ones
			const smallImages = this.findSmallImages(this.doc);
			
			// Clone document
			const clone = this.doc.cloneNode(true) as Document;

			// Apply mobile styles to clone
			this.applyMobileStyles(clone, mobileStyles);

			// Find main content
			let mainContent: Element | null = null;
			if (options.contentSelector) {
				mainContent = clone.querySelector(options.contentSelector);
				this._log('Using contentSelector:', options.contentSelector, mainContent ? 'found' : 'not found');
			}
			if (!mainContent) {
				mainContent = this.findMainContent(clone);
			}
			if (!mainContent) {
				const fallbackContent = this.resolveContentUrls(serializeHTML(this.doc.body));
				const endTime = Date.now();
				return {
					content: fallbackContent,
					...metadata,
					wordCount: this.countWords(fallbackContent),
					parseTime: Math.round(endTime - startTime),
					metaTags: pageMetaTags
				};
			}

			// Standardize footnotes before cleanup (CSS sidenotes use display:none)
			standardizeFootnotes(mainContent);

			// Remove small images
			if (options.removeSmallImages) {
				this.removeSmallImages(clone, smallImages);
			}

			// Remove hidden elements using computed styles
			if (options.removeHiddenElements) {
				this.removeHiddenElements(clone, debugRemovals);
			}

			// Remove non-content blocks by scoring
			// Tries to find lists, navigation based on text content and link density
			if (options.removeLowScoring) {
				ContentScorer.scoreAndRemove(clone, this.debug, debugRemovals);
			}

			// Remove clutter using selectors
			if (options.removeExactSelectors || options.removePartialSelectors) {
				this.removeBySelector(clone, options.removeExactSelectors, options.removePartialSelectors, mainContent, debugRemovals);
			}

			// Normalize the main content
			standardizeContent(mainContent, metadata, this.doc, this.debug);

			// Resolve relative URLs to absolute
			this.resolveRelativeUrls(mainContent);

			const content = mainContent.outerHTML;
			const endTime = Date.now();

			const result: DefuddleResponse = {
				content,
				...metadata,
				wordCount: this.countWords(content),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};

			if (this.debug) {
				result.debug = {
					contentSelector: this.getElementSelector(mainContent),
					removals: debugRemovals
				};
			}

			return result;
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			const errorContent = this.resolveContentUrls(serializeHTML(this.doc.body));
			const endTime = Date.now();
			return {
				content: errorContent,
				...metadata,
				wordCount: this.countWords(errorContent),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};
		}
	}

	private countWords(content: string): number {
		// Parse HTML content to extract text
		const tempDiv = this.doc.createElement('div');
		tempDiv.appendChild(parseHTML(this.doc, content));

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

	private removeImages(doc: Document) {
		const images = doc.getElementsByTagName('img');
		Array.from(images).forEach(image => {
			image.remove();
		});
	}

	private removeHiddenElements(doc: Document, debugRemovals?: DebugRemoval[]) {
		let count = 0;
		const elementsToRemove = new Map<Element, string>();

		// Get all elements and check their styles
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
				if (computedStyle) {
					let reason = '';
					if (computedStyle.display === 'none') reason = 'display:none';
					else if (computedStyle.visibility === 'hidden') reason = 'visibility:hidden';
					else if (computedStyle.opacity === '0') reason = 'opacity:0';

					if (reason) {
						elementsToRemove.set(element, reason);
						count++;
					}
				}
			});
		}

		// Batch remove all hidden elements
		elementsToRemove.forEach((reason, el) => {
			if (this.debug && debugRemovals) {
				debugRemovals.push({
					step: 'removeHiddenElements',
					reason,
					text: textPreview(el)
				});
			}
			el.remove();
		});
		this._log('Removed hidden elements:', count);
	}

	private removeBySelector(doc: Document, removeExact: boolean = true, removePartial: boolean = true, mainContent?: Element | null, debugRemovals?: DebugRemoval[]) {
		const startTime = Date.now();
		let exactSelectorCount = 0;
		let partialSelectorCount = 0;

		// Track all elements to be removed, with their match type
		const elementsToRemove = new Map<Element, { type: 'exact' | 'partial'; selector?: string }>();

		// First collect elements matching exact selectors
		if (removeExact) {
			const exactElements = doc.querySelectorAll(EXACT_SELECTORS.join(','));
			exactElements.forEach(el => {
				if (el?.parentNode) {
					// Skip elements inside code blocks (e.g. syntax highlighting spans)
					if (el.closest('pre, code')) {
						return;
					}
					elementsToRemove.set(el, { type: 'exact' });
					exactSelectorCount++;
				}
			});
		}

		if (removePartial) {
			// Pre-compile regexes and combine into a single regex for better performance
			const combinedPattern = PARTIAL_SELECTORS.join('|');
			const partialRegex = new RegExp(combinedPattern, 'i');

			// Pre-compile individual regexes for debug pattern identification
			const individualRegexes = this.debug
				? PARTIAL_SELECTORS.map(p => ({ pattern: p, regex: new RegExp(p, 'i') }))
				: null;

			// Create an efficient attribute selector for elements we care about
			const attributeSelector = TEST_ATTRIBUTES.map(attr => `[${attr}]`).join(',');
			const allElements = doc.querySelectorAll(attributeSelector);

			// Process elements for partial matches
			allElements.forEach(el => {
				// Skip if already marked for removal
				if (elementsToRemove.has(el)) {
					return;
				}

				// Skip code elements and elements containing code blocks
				// where class names indicate language/syntax, not page structure
				const tag = el.tagName;
				if (tag === 'CODE' || tag === 'PRE' || el.querySelector('pre')) {
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
					const matchedPattern = individualRegexes
						? individualRegexes.find(r => r.regex.test(attrs))?.pattern
						: undefined;
					elementsToRemove.set(el, { type: 'partial', selector: matchedPattern });
					partialSelectorCount++;
				}
			});
		}

		// Remove all collected elements in a single pass
		// Skip elements that are ancestors of mainContent to avoid disconnecting it
		// Skip footnote list containers, their parents, and immediate children
		// Skip anchor links inside headings - the heading transform handles these
		elementsToRemove.forEach(({ type, selector }, el) => {
			if (mainContent && el.contains(mainContent)) {
				return;
			}
			if (el.tagName === 'A' && el.closest('h1, h2, h3, h4, h5, h6')) {
				return;
			}
			try {
				if (el.matches(FOOTNOTE_LIST_SELECTORS) || el.querySelector(FOOTNOTE_LIST_SELECTORS)) {
					return;
				}
				// Protect immediate children of footnote containers (e.g. wikidot div.footnote-footer)
				const parent = el.parentElement;
				if (parent && parent.matches(FOOTNOTE_LIST_SELECTORS)) {
					return;
				}
			} catch (e) {}
			if (this.debug && debugRemovals) {
				debugRemovals.push({
					step: 'removeBySelector',
					selector: type === 'exact' ? 'exact' : selector,
					reason: type === 'exact' ? 'exact selector match' : `partial match: ${selector}`,
					text: textPreview(el)
				});
			}
			el.remove();
		});

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
		];

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
		const candidates: { element: Element; score: number; selectorIndex: number }[] = [];

		ENTRY_POINT_ELEMENTS.forEach((selector, index) => {
			const elements = doc.querySelectorAll(selector);
			elements.forEach(element => {
				// Base score from selector priority (earlier = higher)
				let score = (ENTRY_POINT_ELEMENTS.length - index) * 40;

				// Add score based on content analysis
				score += ContentScorer.scoreElement(element);

				candidates.push({ element, score, selectorIndex: index });
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

		// If the top candidate contains a child candidate that matched a
		// higher-priority selector, prefer the most specific (deepest) child.
		// This prevents e.g. <main> from winning over a contained <article>
		// just because sibling noise inflates the parent's content score.
		// Only prefer the child if it has meaningful content (>50 words),
		// otherwise it may be an empty card element (e.g. related article cards).
		const top = candidates[0];
		let best = top;
		for (let i = 1; i < candidates.length; i++) {
			const child = candidates[i];
			const childWords = (child.element.textContent || '').split(/\s+/).length;
			if (child.selectorIndex < best.selectorIndex && best.element.contains(child.element) && childWords > 50) {
				best = child;
			}
		}
		if (best !== top) {
			return best.element;
		}

		return top.element;
	}

	private findTableBasedContent(doc: Document): Element | null {
		// First check if this looks like an old-style table-based layout
		const tables = Array.from(doc.getElementsByTagName('table'));
		const hasTableLayout = tables.some(table => {
			const width = parseInt(table.getAttribute('width') || '0');
			const style = this.getComputedStyle(table);
			return width > 400 ||
				(style?.width?.includes('px') && parseInt(style.width) > 400) ||
				table.getAttribute('align') === 'center' ||
				(table.className || '').toLowerCase().includes('content') ||
				(table.className || '').toLowerCase().includes('article');
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

	/**
	 * Resolve relative URLs to absolute within a DOM element
	 */
	private resolveRelativeUrls(element: Element): void {
		const baseUrl = this.options.url || this.doc.URL;
		if (!baseUrl) return;

		const resolve = (url: string): string => {
			try {
				return new URL(url, baseUrl).href;
			} catch {
				return url;
			}
		};

		element.querySelectorAll('[href]').forEach(el => {
			const href = el.getAttribute('href');
			if (href) el.setAttribute('href', resolve(href));
		});

		element.querySelectorAll('[src]').forEach(el => {
			const src = el.getAttribute('src');
			if (src) el.setAttribute('src', resolve(src));
		});

		element.querySelectorAll('[srcset]').forEach(el => {
			const srcset = el.getAttribute('srcset');
			if (srcset) {
				// Parse srcset using width/density descriptors as delimiters,
				// not commas — URLs may contain commas (e.g. CDN transform params)
				const entryPattern = /(.+?)\s+(\d+(?:\.\d+)?[wx])/g;
				const entries: string[] = [];
				let match;
				let lastIdx = 0;

				while ((match = entryPattern.exec(srcset)) !== null) {
					let url = match[1].trim();
					if (lastIdx > 0) {
						url = url.replace(/^,\s*/, '');
					}
					lastIdx = entryPattern.lastIndex;
					entries.push(`${resolve(url)} ${match[2]}`);
				}

				if (entries.length > 0) {
					el.setAttribute('srcset', entries.join(', '));
				} else {
					// Fallback: simple comma split for srcsets without descriptors
					const resolved = srcset.split(',').map(entry => {
						const parts = entry.trim().split(/\s+/);
						if (parts[0]) parts[0] = resolve(parts[0]);
						return parts.join(' ');
					}).join(', ');
					el.setAttribute('srcset', resolved);
				}
			}
		});

		element.querySelectorAll('[poster]').forEach(el => {
			const poster = el.getAttribute('poster');
			if (poster) el.setAttribute('poster', resolve(poster));
		});
	}

	/**
	 * Resolve relative URLs in an HTML string
	 */
	private resolveContentUrls(html: string): string {
		const baseUrl = this.options.url || this.doc.URL;
		if (!baseUrl) return html;

		const container = this.doc.createElement('div');
		container.appendChild(parseHTML(this.doc, html));
		this.resolveRelativeUrls(container);
		return serializeHTML(container);
	}

	private _extractSchemaOrgData(doc: Document): any {
		const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
		const rawSchemaItems: any[] = [];

		schemaScripts.forEach(script => {
			let jsonContent = script.textContent || '';
			
			try {
				jsonContent = jsonContent
					.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
					.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
					.replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g, '')
					.trim();
					
				const jsonData = JSON.parse(jsonContent);

				if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
					rawSchemaItems.push(...jsonData['@graph']);
				} else {
					rawSchemaItems.push(jsonData);
				}
			} catch (error) {
				console.error('Defuddle: Error parsing schema.org data:', error);
				if (this.debug) {
					console.error('Defuddle: Problematic JSON content:', jsonContent);
				}
			}
		});

		const decodeStringsInObject = (item: any): any => {
			if (typeof item === 'string') {
				return this._decodeHTMLEntities(item);
			} else if (Array.isArray(item)) {
				return item.map(decodeStringsInObject);
			} else if (typeof item === 'object' && item !== null) {
				const newItem: { [key: string]: any } = {};
				for (const key in item) {
					if (Object.prototype.hasOwnProperty.call(item, key)) {
						newItem[key] = decodeStringsInObject(item[key]);
					}
				}
				return newItem;
			}
			return item;
		};

		return rawSchemaItems.map(decodeStringsInObject);
	}

	private _collectMetaTags(): MetaTagItem[] {
		const pageMetaTags: MetaTagItem[] = [];
		this.doc.querySelectorAll('meta').forEach(meta => {
			const name = meta.getAttribute('name');
			const property = meta.getAttribute('property');
			let content = meta.getAttribute('content');
			if (content) {
				pageMetaTags.push({ name, property, content: this._decodeHTMLEntities(content) });
			}
		});
		return pageMetaTags;
	}

	private _decodeHTMLEntities(text: string): string {
		return decodeHTMLEntities(this.doc, text);
	}
} 
