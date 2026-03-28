import { MetadataExtractor } from './metadata';
import { removeHeadingAnchors } from './elements/headings';
import { DefuddleOptions, DefuddleResponse, MetaTagItem, DebugRemoval } from './types';
import { ExtractorRegistry } from './extractor-registry';
import type { ExtractorOptions } from './extractors/_base';
import { BaseExtractor } from './extractors/_base';
import {
	MOBILE_WIDTH,
	BLOCK_ELEMENTS_SELECTOR,
	HIDDEN_EXACT_SKIP_SELECTOR,
	ENTRY_POINT_ELEMENTS
} from './constants';
import { standardizeContent } from './standardize';
import { standardizeFootnotes } from './elements/footnotes';
import { standardizeCallouts } from './elements/callouts';
import { ContentScorer, ContentScore } from './removals/scoring';
import { findSmallImages, removeSmallImages } from './removals/small-images';
import { removeHiddenElements } from './removals/hidden';
import { removeBySelector } from './removals/selectors';
import { removeByContentPattern } from './removals/content-patterns';
import { removeMetadataBlock } from './removals/metadata-block';
import { getComputedStyle, textPreview, countWords } from './utils';
import { parseHTML, serializeHTML, decodeHTMLEntities, isDangerousUrl, getClassName } from './utils/dom';

interface StyleChange {
	selector: string;
	styles: string;
}

/** Keys from extractor variables that map to top-level DefuddleResponse fields */
const STANDARD_VARIABLE_KEYS = new Set(['title', 'author', 'published', 'site', 'description', 'image', 'language']);


export class Defuddle {
	private readonly doc: Document;
	private options: DefuddleOptions;
	private debug: boolean;
	private _schemaOrgData: any = undefined;
	private _schemaOrgExtracted = false;
	private _metaTags: MetaTagItem[] | undefined;
	private _metadata: any | undefined;
	private _mobileStyles: StyleChange[] | undefined;
	private _smallImages: Set<string> | undefined;

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
	 * Lazily extract and cache schema.org data. Must be called before
	 * parse() strips script tags from the document.
	 */
	private getSchemaOrgData(): any {
		if (!this._schemaOrgExtracted) {
			this._schemaOrgData = this._extractSchemaOrgData(this.doc);
			this._schemaOrgExtracted = true;
		}
		return this._schemaOrgData;
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

		// If still very little content, the page may be an index/listing page
		// or a page that reveals content at runtime from a hidden wrapper.
		// Retry once with hidden-element removal disabled.
		if (result.wordCount < 50) {
			this._log('Still very little content, retrying without hidden-element removal');
			const hiddenRetry = this.parseInternal({
				removeHiddenElements: false
			});
			if (hiddenRetry.wordCount > result.wordCount * 2) {
				this._log('Hidden-element retry produced more content');
				result = hiddenRetry;
			}

			// Try targeting the largest hidden subtree directly to avoid body-level
			// leftovers (e.g. FPS counters) when hidden content is the real article.
			const hiddenSelector = this.findLargestHiddenContentSelector();
			if (hiddenSelector) {
				this._log('Retrying with hidden content selector:', hiddenSelector);
				const hiddenSelectorRetry = this.parseInternal({
					removeHiddenElements: false,
					removePartialSelectors: false,
					contentSelector: hiddenSelector
				});
				if (
					hiddenSelectorRetry.wordCount > result.wordCount ||
					(
						hiddenSelectorRetry.wordCount > Math.max(20, result.wordCount * 0.7) &&
						hiddenSelectorRetry.content.length < result.content.length
					)
				) {
					this._log('Hidden-selector retry produced better focused content');
					result = hiddenSelectorRetry;
				}
			}
		}

		// If still very little content, the page may be an index/listing page
		// where card elements were scored as non-content or removed by partial
		// selectors (e.g. "post-preview"). Retry with both disabled.
		if (result.wordCount < 50) {
			this._log('Still very little content, retrying without scoring/partial selectors (possible index page)');
			const indexRetry = this.parseInternal({
				removeLowScoring: false,
				removePartialSelectors: false,
				removeContentPatterns: false
			});
			if (indexRetry.wordCount > result.wordCount) {
				this._log('Index page retry produced more content');
				result = indexRetry;
			}
		}

		// Strip dangerous elements from this.doc before any fallback paths
		// that read from it (e.g. _findContentBySchemaText).
		// This must happen after parseInternal, which needs script tags
		// for schema.org extraction, site-specific extractors, and math.
		this._stripUnsafeElements();

		// If schema.org has a SocialMediaPosting with text content that is
		// significantly longer than what we extracted, the scorer likely picked
		// the wrong element from a feed. Use a 1.5x threshold to avoid triggering
		// when the difference is small (e.g. just related-content link text removed).
		const schemaText = this._getSchemaText(result.schemaOrgData);
		if (schemaText && this.countHtmlWords(schemaText) > result.wordCount * 1.5) {
			const contentHtml = this._findContentBySchemaText(schemaText);
			if (contentHtml) {
				this._log('Found DOM content matching schema.org text');
				result.content = contentHtml;
				result.wordCount = this.countHtmlWords(contentHtml);
			} else {
				this._log('Using schema.org text as content (DOM element not found)');
				result.content = schemaText;
				result.wordCount = this.countHtmlWords(schemaText);
			}
		}

		return result;
	}

	/**
	 * Extract text content from schema.org data (e.g. SocialMediaPosting, Article)
	 */
	private _getSchemaText(schemaOrgData: any, depth: number = 0): string {
		if (!schemaOrgData || depth > 10) return '';

		const items = Array.isArray(schemaOrgData) ? schemaOrgData : [schemaOrgData];
		for (const item of items) {
			// Recurse into nested arrays
			if (Array.isArray(item)) {
				const found = this._getSchemaText(item, depth + 1);
				if (found) return found;
				continue;
			}
			if (item?.text && typeof item.text === 'string') {
				return item.text;
			}
			if (item?.articleBody && typeof item.articleBody === 'string') {
				return item.articleBody;
			}
			// Traverse @graph arrays (common in JSON-LD with multiple entities)
			if (item?.['@graph'] && Array.isArray(item['@graph'])) {
				const found = this._getSchemaText(item['@graph'], depth + 1);
				if (found) return found;
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
					if (isDangerousUrl(attr.value)) {
						el.removeAttribute(attr.name);
					}
				}
			}
		}
	}

	/**
	 * Find the smallest DOM element whose text contains the search phrase
	 * and whose word count is at least 80% of the expected count.
	 * Shared by _findSchemaContentElement and _findContentBySchemaText.
	 */
	private _findElementBySchemaText(root: Element, schemaText: string): Element | null {
		const firstPara = schemaText.split(/\n\s*\n/)[0]?.trim() || '';
		const searchPhrase = firstPara.substring(0, 100).trim();
		if (!searchPhrase) return null;

		const schemaWordCount = countWords(schemaText);
		let bestMatch: Element | null = null;
		let bestSize = Infinity;

		const allElements = root.querySelectorAll('*');
		for (const el of allElements) {
			if (el === root) continue;

			const elText = el.textContent || '';
			if (!elText.includes(searchPhrase)) continue;

			const elWords = countWords(elText);
			if (elWords >= schemaWordCount * 0.8 && elWords < bestSize) {
				bestSize = elWords;
				bestMatch = el;
			}
		}

		return bestMatch;
	}

	/**
	 * Find a DOM element whose text matches the schema.org text content.
	 * Used when the content scorer picked the wrong element from a feed page.
	 * Returns the element's inner HTML including sibling media (images, etc.)
	 */
	private _findContentBySchemaText(schemaText: string): string {
		const body = this.doc.body;
		if (!body) return '';

		const bestMatch = this._findElementBySchemaText(body, schemaText);
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

		// Remove heading anchor links before serialization (e.g. <h2>Title<a href="#foo">#</a></h2>)
		removeHeadingAnchors(bestMatch);

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

	private findLargestHiddenContentSelector(): string | undefined {
		const body = this.doc.body;
		if (!body) return undefined;

		const candidates = Array.from(
			body.querySelectorAll(HIDDEN_EXACT_SKIP_SELECTOR)
		).filter(el => {
			const className = el.getAttribute('class') || '';
			return !className.includes('math');
		});

		let best: Element | null = null;
		let bestWords = 0;
		for (const el of candidates) {
			const words = countWords(el.textContent || '');
			if (words > bestWords) {
				best = el;
				bestWords = words;
			}
		}

		if (!best || bestWords < 30) return undefined;
		return this.getElementSelector(best);
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
	 * Parse the document asynchronously. Checks for extractors that prefer
	 * async (e.g. YouTube transcripts) before sync, then falls back to async
	 * extractors if sync parse yields no content.
	 */
	async parseAsync(): Promise<DefuddleResponse> {
		if (this.options.useAsync !== false) {
			const asyncResult = await this.tryAsyncExtractor(
				ExtractorRegistry.findPreferredAsyncExtractor.bind(ExtractorRegistry)
			);
			if (asyncResult) return asyncResult;
		}

		const result = this.parse();

		if (result.wordCount > 0 || this.options.useAsync === false) {
			return result;
		}

		return (await this.tryAsyncExtractor(
			ExtractorRegistry.findAsyncExtractor.bind(ExtractorRegistry)
		)) ?? result;
	}

	/**
	 * Fetch only async variables (e.g. transcript) without re-parsing.
	 * Safe to call after parse() — uses cached schema.org data since
	 * parse() strips script tags from the document.
	 */
	async fetchAsyncVariables(): Promise<{ [key: string]: string } | null> {
		if (this.options.useAsync === false) return null;

		try {
			const url = this.options.url || this.doc.URL;
			const schemaOrgData = this.getSchemaOrgData();
			const extractorOpts: ExtractorOptions = { includeReplies: this.options.includeReplies ?? 'extractors', language: this.options.language };
			const extractor = ExtractorRegistry.findPreferredAsyncExtractor(this.doc, url, schemaOrgData, extractorOpts);

			if (extractor) {
				const extracted = await extractor.extractAsync();
				return this.getExtractorVariables(extracted.variables) || null;
			}
		} catch (error) {
			console.error('Defuddle', 'Error fetching async variables:', error);
		}

		return null;
	}

	private async tryAsyncExtractor(
		finder: (document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) => BaseExtractor | null
	): Promise<DefuddleResponse | null> {
		try {
			const url = this.options.url || this.doc.URL;
			const schemaOrgData = this.getSchemaOrgData();
			const extractorOpts: ExtractorOptions = { includeReplies: this.options.includeReplies ?? 'extractors', language: this.options.language };
			const extractor = finder(this.doc, url, schemaOrgData, extractorOpts);

			if (extractor) {
				const startTime = Date.now();
				const extracted = await extractor.extractAsync();
				const pageMetaTags = this._collectMetaTags();
				const metadata = MetadataExtractor.extract(this.doc, schemaOrgData, pageMetaTags);
				return this.buildExtractorResponse(extracted, metadata, startTime, extractor, pageMetaTags);
			}
		} catch (error) {
			console.error('Defuddle', 'Error in async extraction:', error);
		}

		return null;
	}

	/**
	 * Internal parse method that does the actual work
	 */
	private parseInternal(overrideOptions: Partial<DefuddleOptions> = {}): DefuddleResponse {
		const startTime = Date.now();
		const profile: Record<string, number> = {};
		const doProfile = this.options.profile ?? false;
		const profileStep = <T>(name: string, fn: () => T): T => {
			if (!doProfile) return fn();
			const t = performance.now();
			const result = fn();
			profile[name] = Math.round(performance.now() - t);
			return result;
		};

		// Guard against empty/broken documents (e.g. empty HTML, bot-blocked pages)
		if (!this.doc.documentElement) {
			const url = this.options.url || '';
			return {
				content: '',
				title: '',
				description: '',
				domain: url ? new URL(url).hostname : '',
				favicon: '',
				image: '',
				language: '',
				parseTime: Date.now() - startTime,
				published: '',
				author: '',
				site: '',
				schemaOrgData: null,
				wordCount: 0,
			};
		}

		const options = {
			removeExactSelectors: true,
			removePartialSelectors: true,
			removeHiddenElements: true,
			removeLowScoring: true,
			removeSmallImages: true,
			removeContentPatterns: true,
			standardize: true,
			includeReplies: 'extractors',
			...this.options,
			...overrideOptions
		};
		const debugRemovals: DebugRemoval[] = [];

		// Extract schema.org data (cached — must happen before _stripUnsafeElements removes scripts)
		const schemaOrgData = this.getSchemaOrgData();

		// Cache meta tags and metadata across retries
		if (!this._metaTags) {
			this._metaTags = this._collectMetaTags();
		}
		const pageMetaTags = this._metaTags;

		if (!this._metadata) {
			this._metadata = MetadataExtractor.extract(this.doc, schemaOrgData, pageMetaTags);
		}
		const metadata = this._metadata;

		if (options.removeImages) {
			this.removeImages(this.doc);
		}

		try {
			// Use site-specific extractor first, if there is one
			const url = options.url || this.doc.URL;
			const extractorOpts: ExtractorOptions = {
				includeReplies: options.includeReplies as ExtractorOptions['includeReplies'],
				language: options.language,
			};
			const extractor = ExtractorRegistry.findExtractor(this.doc, url, schemaOrgData, extractorOpts);
			if (extractor && extractor.canExtract()) {
				const extracted = extractor.extract();
				return this.buildExtractorResponse(extracted, metadata, startTime, extractor, pageMetaTags);
			}

			// Continue if there is no extractor...

			// Evaluate mobile styles and sizes on original document (cached across retries)
			if (!this._mobileStyles) {
				this._mobileStyles = this._evaluateMediaQueries(this.doc);
			}
			const mobileStyles = this._mobileStyles;

			// Find small images in original document (cached across retries)
			if (!this._smallImages) {
				this._smallImages = findSmallImages(this.doc, this.debug);
			}
			const smallImages = this._smallImages;

			// Clone document
			let clone!: Document;
			profileStep('cloneDocument', () => {
				clone = this.doc.cloneNode(true) as Document;
				// Merge adjacent text nodes that some DOM implementations (e.g. linkedom)
				// create when parsing HTML entities like &#39;
				clone.body?.normalize();
			});

			// Flatten shadow DOM content into the clone
			profileStep('flattenShadowRoots', () => this.flattenShadowRoots(this.doc, clone));

			// Resolve React streaming SSR suspense boundaries
			profileStep('resolveStreamedContent', () => this.resolveStreamedContent(clone));

			// Apply mobile styles to clone
			profileStep('applyMobileStyles', () => this.applyMobileStyles(clone, mobileStyles));

			// Find main content
			const mainContent = profileStep('findMainContent', (): Element | null => {
				let found: Element | null = null;
				if (options.contentSelector) {
					found = clone.querySelector(options.contentSelector);
					this._log('Using contentSelector:', options.contentSelector, found ? 'found' : 'not found');
				}
				if (!found) {
					found = this.findMainContent(clone);
				}

				// If we fell back to <body>, try using schema.org articleBody/text
				// to find a more specific content element within the DOM.
				if (found && found.tagName.toLowerCase() === 'body') {
					const schemaText = this._getSchemaText(schemaOrgData);
					if (schemaText) {
						const schemaContent = this._findElementBySchemaText(clone.body, schemaText);
						if (schemaContent) {
							this._log('Found content element via schema.org text');
							found = schemaContent;
						}
					}
				}
				return found;
			});

			if (!mainContent) {
				const fallbackContent = this.doc.body ? this.resolveContentUrls(serializeHTML(this.doc.body)) : '';
				const endTime = Date.now();
				return {
					content: fallbackContent,
					...metadata,
					wordCount: this.countHtmlWords(fallbackContent),
					parseTime: Math.round(endTime - startTime),
					metaTags: pageMetaTags
				};
			}

			// Remove h1-adjacent date/author metadata blocks from the content.
			// These are extracted as frontmatter but also appear in the body when a
			// wide container (e.g. <main>) is selected as the content element.
			profileStep('removeMetadataBlock', () => {
				if (metadata.published || metadata.author) {
					removeMetadataBlock(mainContent!);
				}
				// Remove <wbr> elements — word break opportunity hints that carry no
				// content but cause unwanted whitespace during standardization.
				mainContent!.querySelectorAll('wbr').forEach(el => el.remove());
			});

			// Standardize footnotes before cleanup (CSS sidenotes use display:none)
			profileStep('standardizeFootnotesCallouts', () => {
				if (options.standardize) {
					standardizeFootnotes(mainContent!);
					standardizeCallouts(mainContent!);
				}
			});

			// Remove small images
			profileStep('removeSmallImages', () => {
				if (options.removeSmallImages) {
					removeSmallImages(clone, smallImages, this.debug);
				}
			});

			// Remove hidden elements using computed styles
			profileStep('removeHiddenElements', () => {
				if (options.removeHiddenElements) {
					removeHiddenElements(clone, this.debug, debugRemovals);
				}
			});

			// Remove clutter using selectors — deterministic removal of known
			// non-content elements (nav, footer, .sidebar, etc.) by class/id.
			// Runs before scoring so the heuristic scorer sees a cleaner DOM.
			profileStep('removeBySelector', () => {
				if (options.removeExactSelectors || options.removePartialSelectors) {
					removeBySelector(
						clone,
						this.debug,
						options.removeExactSelectors,
						options.removePartialSelectors,
						mainContent!,
						debugRemovals,
						options.removeHiddenElements === false
					);
				}
			});

			// Remove non-content blocks by scoring — heuristic removal based
			// on link density, text ratios, and navigation indicators.
			profileStep('removeLowScoring', () => {
				if (options.removeLowScoring) {
					ContentScorer.scoreAndRemove(clone, this.debug, debugRemovals, mainContent!);
				}
			});

			// Remove elements by content patterns (read time, boilerplate, article cards)
			profileStep('removeByContentPattern', () => {
				if (options.removeContentPatterns && mainContent) {
					const url = this.options.url || this.doc.URL || '';
					removeByContentPattern(mainContent!, this.debug, url, debugRemovals);
				}
			});

			// Normalize the main content
			profileStep('standardizeContent', () => {
				if (options.standardize) {
					standardizeContent(mainContent!, metadata, this.doc, this.debug, doProfile ? profile : undefined);
				}
			});

			// Resolve relative URLs to absolute
			profileStep('resolveRelativeUrls', () => this.resolveRelativeUrls(mainContent!));

			const content = mainContent.outerHTML;
			const endTime = Date.now();

			const result: DefuddleResponse = {
				content,
				...metadata,
				wordCount: this.countHtmlWords(content),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};

			if (this.debug) {
				result.debug = {
					contentSelector: this.getElementSelector(mainContent),
					removals: debugRemovals
				};
			}

			if (this.options.profile) {
				result.profile = profile;
			}

			return result;
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			const errorContent = this.doc.body ? this.resolveContentUrls(serializeHTML(this.doc.body)) : '';
			const endTime = Date.now();
			return {
				content: errorContent,
				...metadata,
				wordCount: this.countHtmlWords(errorContent),
				parseTime: Math.round(endTime - startTime),
				metaTags: pageMetaTags
			};
		}
	}

	private countHtmlWords(content: string): number {
		// Strip HTML tags and decode common entities without DOM parsing
		const text = content
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/gi, ' ')
			.replace(/&amp;/gi, '&')
			.replace(/&lt;/gi, '<')
			.replace(/&gt;/gi, '>')
			.replace(/&quot;/gi, '"')
			.replace(/&#\d+;/g, ' ')
			.replace(/&\w+;/g, ' ');

		return countWords(text);
	}

	private _log(...args: any[]): void {
		if (this.debug) {
			console.log('Defuddle:', ...args);
		}
	}

	private _evaluateMediaQueries(doc: Document): StyleChange[] {
		const mobileStyles: StyleChange[] = [];
		const maxWidthRegex = /max-width[^:]*:\s*(\d+)/;

		try {
			if (!doc.styleSheets) return mobileStyles;

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
		// Skip this when the parent contains multiple children matching the
		// same selector — that indicates a listing/portfolio page where the
		// parent is the real content container.
		const top = candidates[0];
		let best = top;
		for (let i = 1; i < candidates.length; i++) {
			const child = candidates[i];
			const childWords = countWords(child.element.textContent || '');
			if (child.selectorIndex < best.selectorIndex && best.element.contains(child.element) && childWords > 50) {
				// Count how many candidates share this selector index inside
				// the top element. Use top (not best) as the stable reference
				// so the check isn't affected by earlier iterations.
				let siblingsAtIndex = 0;
				for (const c of candidates) {
					if (c.selectorIndex === child.selectorIndex && top.element.contains(c.element)) {
						if (++siblingsAtIndex > 1) break;
					}
				}
				if (siblingsAtIndex > 1) {
					// Multiple articles/cards inside the parent — it's a listing page
					continue;
				}
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

		doc.querySelectorAll(BLOCK_ELEMENTS_SELECTOR).forEach((element: Element) => {
			const score = ContentScorer.scoreElement(element);
			if (score > 0) {
				candidates.push({ score, element });
			}
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
			} else if (getClassName(current)) {
				selector += '.' + getClassName(current).trim().split(/\s+/).join('.');
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
		const docUrl = this.options.url || this.doc.URL;
		if (!docUrl) return;

		// Respect <base href> for relative URL resolution, matching browser behavior
		let baseUrl = docUrl;
		const baseEl = this.doc.querySelector('base[href]');
		if (baseEl) {
			const baseHref = baseEl.getAttribute('href');
			if (baseHref) {
				try {
					baseUrl = new URL(baseHref, docUrl).href;
				} catch {
					// Invalid base href, fall back to document URL
				}
			}
		}

		const resolve = (url: string): string => {
			// Some pages ship escaped quoted hrefs like \"mailto:...\" in server templates.
			// Normalize these before URL resolution.
			const normalized = url
				.trim()
				.replace(/^\\?["']+/, '')
				.replace(/\\?["']+$/, '');
			// Fragment-only hrefs reference anchors within the same document — keep them relative.
			if (normalized.startsWith('#')) return normalized;
			try {
				return new URL(normalized, baseUrl).href;
			} catch {
				return normalized || url;
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
	 * Flatten shadow DOM content into a cloned document.
	 * Walks both trees in parallel so positional correspondence is exact.
	 */
	private flattenShadowRoots(original: Document, clone: Document): void {
		if (!original.body || !clone.body) return;
		const origElements = Array.from(original.body.querySelectorAll('*'));

		// Find the first element with a shadow root (also serves as the hasShadowRoots check)
		const firstShadow = origElements.find(el => el.shadowRoot);
		if (!firstShadow) return;

		const cloneElements = Array.from(clone.body.querySelectorAll('*'));

		// Check if we can directly read shadow DOM content (main world / Node.js).
		// In content script isolated worlds, shadowRoot exists but content is empty.
		const canReadShadow = (firstShadow.shadowRoot?.childNodes?.length ?? 0) > 0;

		if (canReadShadow) {
			// Direct traversal works (main world / Node.js)
			for (let i = origElements.length - 1; i >= 0; i--) {
				const origEl = origElements[i];
				if (!origEl.shadowRoot) continue;

				const cloneEl = cloneElements[i];
				if (!cloneEl) continue;

				const shadowHtml = origEl.shadowRoot.innerHTML;
				if (shadowHtml.length > 0) {
					this.replaceShadowHost(cloneEl, shadowHtml, clone);
				}
			}
		} else {
			// Content script isolated world — read data-defuddle-shadow attributes
			// stamped by an external main-world script.
			const shadowData: {cloneEl: Element, html: string}[] = [];
			for (let i = 0; i < origElements.length; i++) {
				const origEl = origElements[i];
				const shadowHtml = origEl.getAttribute('data-defuddle-shadow');
				if (!shadowHtml) continue;

				const cloneEl = cloneElements[i];
				if (!cloneEl) continue;

				shadowData.push({cloneEl, html: shadowHtml});
				// Clean up temporary attributes from both original and clone
				origEl.removeAttribute('data-defuddle-shadow');
				cloneEl.removeAttribute('data-defuddle-shadow');
			}
			for (const {cloneEl, html} of shadowData) {
				this.replaceShadowHost(cloneEl, html, clone);
			}
		}
	}

	/**
	 * Resolve React streaming SSR suspense boundaries.
	 * React's streaming SSR places content in hidden divs (id="S:0") and
	 * template placeholders (id="B:0") with $RC scripts to swap them.
	 * Since we don't execute scripts, we perform the swap manually.
	 */
	private resolveStreamedContent(doc: Document): void {
		// Find $RC("B:X","S:X") calls in inline scripts
		const scripts = doc.querySelectorAll('script');
		const swaps: { templateId: string; contentId: string }[] = [];
		const rcPattern = /\$RC\("(B:\d+)","(S:\d+)"\)/g;

		for (const script of scripts) {
			const text = script.textContent || '';
			if (!text.includes('$RC(')) continue;
			rcPattern.lastIndex = 0;
			let match;
			while ((match = rcPattern.exec(text)) !== null) {
				swaps.push({ templateId: match[1], contentId: match[2] });
			}
		}

		if (swaps.length === 0) return;

		let swapCount = 0;
		for (const { templateId, contentId } of swaps) {
			const template = doc.getElementById(templateId);
			const content = doc.getElementById(contentId);
			if (!template || !content) continue;

			const parent = template.parentNode;
			if (!parent) continue;

			// Remove the fallback/skeleton content after the template
			// until the <!--/$--> comment marker
			let next = template.nextSibling;
			let foundMarker = false;
			while (next) {
				const following = next.nextSibling;
				if (next.nodeType === 8 && (next as Comment).data === '/$') {
					next.remove();
					foundMarker = true;
					break;
				}
				next.remove();
				next = following;
			}

			// Skip swap if marker wasn't found — malformed streaming output
			if (!foundMarker) continue;

			// Insert content children before the template position
			while (content.firstChild) {
				parent.insertBefore(content.firstChild, template);
			}

			// Clean up the template and hidden div
			template.remove();
			content.remove();
			swapCount++;
		}

		if (swapCount > 0) {
			this._log('Resolved streamed content:', swapCount, 'suspense boundaries');
		}
	}

	/**
	 * Replace a shadow DOM host element with a div containing its shadow content.
	 * Custom elements (tag names with hyphens) would re-initialize when inserted
	 * into a live DOM, recreating their shadow roots and hiding the content.
	 */
	private replaceShadowHost(el: Element, shadowHtml: string, doc: Document): void {
		const fragment = parseHTML(doc, shadowHtml);
		if (el.tagName.includes('-')) {
			// Custom element — replace with a div to prevent re-initialization
			const div = doc.createElement('div');
			div.appendChild(fragment);
			el.parentNode?.replaceChild(div, el);
		} else {
			el.textContent = '';
			el.appendChild(fragment);
		}
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

	/**
	 * Build a DefuddleResponse from an extractor result with metadata
	 */
	private buildExtractorResponse(
		extracted: { contentHtml: string; variables?: { [key: string]: string } },
		metadata: ReturnType<typeof MetadataExtractor.extract>,
		startTime: number,
		extractor: BaseExtractor,
		pageMetaTags: MetaTagItem[]
	): DefuddleResponse {
		const contentHtml = this.resolveContentUrls(extracted.contentHtml);
		const variables = this.getExtractorVariables(extracted.variables);
		return {
			content: contentHtml,
			title: extracted.variables?.title || metadata.title,
			description: extracted.variables?.description || metadata.description,
			domain: metadata.domain,
			favicon: metadata.favicon,
			image: metadata.image,
			language: extracted.variables?.language || metadata.language,
			published: extracted.variables?.published || metadata.published,
			author: extracted.variables?.author || metadata.author,
			site: extracted.variables?.site || metadata.site,
			schemaOrgData: metadata.schemaOrgData,
			wordCount: this.countHtmlWords(extracted.contentHtml),
			parseTime: Math.round(Date.now() - startTime),
			extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase(),
			metaTags: pageMetaTags,
			...(variables ? { variables } : {}),
		};
	}

	/**
	 * Filter extractor variables to only include custom ones
	 * (exclude standard fields that are already mapped to top-level properties)
	 */
	private getExtractorVariables(variables?: { [key: string]: string }): { [key: string]: string } | undefined {
		if (!variables) return undefined;
		const custom: { [key: string]: string } = {};
		let hasCustom = false;
		for (const [key, value] of Object.entries(variables)) {
			if (!STANDARD_VARIABLE_KEYS.has(key)) {
				custom[key] = value;
				hasCustom = true;
			}
		}
		return hasCustom ? custom : undefined;
	}

}
