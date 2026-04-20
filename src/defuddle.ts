import { MetadataExtractor } from './metadata';
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
import { removeByContentPattern, removeEyebrowLabel } from './removals/content-patterns';
import { removeMetadataBlock } from './removals/metadata-block';
import { getComputedStyle, textPreview, countWords, isSVGElement } from './utils';
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
	private _inExtractorPipelineRun = false;

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
		// Normalize non-standard attribute casing (e.g. React SSR outputs
		// "srcSet" instead of "srcset") before any image processing.
		if (this.doc.body) {
			this._normalizeAttributes(this.doc.body);
			this._resolveNoscriptImages(this.doc.body);
		}

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
		// that read from it. This must happen after parseInternal, which needs
		// script tags for schema.org extraction, site-specific extractors, and math.
		this._stripUnsafeElements();

		// If schema.org has text content that is significantly longer than what we
		// extracted, the scorer likely picked the wrong element from a feed page.
		// Use a 1.5x threshold to avoid triggering when the difference is small
		// (e.g. just related-content link text removed).
		const schemaText = this._getSchemaText(result.schemaOrgData);
		if (schemaText && this.countHtmlWords(schemaText) > result.wordCount * 1.5) {
			const bestMatch = this._findElementBySchemaText(this.doc.body, schemaText);
			if (bestMatch) {
				// Re-run the full pipeline with the schema-identified element as the
				// content root so it benefits from the same cleanup as normal extraction.
				const selector = this.getElementSelector(bestMatch);
				this._log('Schema.org suggests a better content element, retrying with selector:', selector);
				const schemaRetry = this.parseInternal({ contentSelector: selector });
				result = schemaRetry;
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
		for (const el of dangerousElements) {
			if (el.tagName === 'STYLE' && isSVGElement(el)) continue;
			el.remove();
		}

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
	 * Replace base64 placeholder images with real URLs from <noscript> fallbacks.
	 * Next.js (data-nimg) renders a tiny base64 gif as src with the real image
	 * only inside a <noscript> sibling. This promotes the real URL before
	 * noscript elements are stripped.
	 */

	/**
	 * Remove duplicate images within figures and adjacent elements, keeping
	 * the highest resolution version. Handles Reader mode and lazy-loading
	 * hydration creating a second copy alongside the original.
	 */
	private _deduplicateImages(body: Element): void {
		for (const figure of body.querySelectorAll('figure')) {
			const figImgs = Array.from(figure.querySelectorAll('img'))
				.filter(img => !img.closest('noscript') && img.parentElement);
			if (figImgs.length < 2) continue;

			// Group by alt text; empty-alt images share one group
			const groups = new Map<string | null, Element[]>();
			for (const img of figImgs) {
				const src = img.getAttribute('src') || '';
				if (!src || src.startsWith('data:')) continue;
				const key = (img.getAttribute('alt') || '').trim() || null;
				const group = groups.get(key) || [];
				group.push(img);
				groups.set(key, group);
			}

			for (const [key, group] of groups) {
				if (group.length < 2) continue;
				// Same-src images with alt text are legitimate repeats, not dupes
				if (key !== null && group.every(img => img.getAttribute('src') === group[0].getAttribute('src'))) continue;
				this._keepBestImage(group);
			}
		}

		// Also deduplicate adjacent images outside figures (same alt, different src)
		const imgs = Array.from(body.querySelectorAll('img'));
		for (let i = 0; i < imgs.length; i++) {
			const img = imgs[i];
			if (img.closest('noscript') || img.closest('figure')) continue;
			if (!img.parentElement) continue;

			const alt = (img.getAttribute('alt') || '').trim();
			if (!alt) continue;
			const src = img.getAttribute('src') || '';
			if (!src || src.startsWith('data:')) continue;

			for (let j = i + 1; j < imgs.length; j++) {
				const other = imgs[j];
				if (other.closest('noscript') || other.closest('figure')) continue;
				if (!other.parentElement) continue;

				const otherAlt = (other.getAttribute('alt') || '').trim();
				if (otherAlt !== alt) break;
				const otherSrc = other.getAttribute('src') || '';
				if (!otherSrc || otherSrc.startsWith('data:')) continue;
				if (otherSrc === src) break; // legitimate repeat

				this._keepBestImage([img, other]);
				if (!img.parentElement) break; // img was the loser
			}
		}
	}

	private _keepBestImage(group: Element[]): void {
		let best = group[0];
		for (let i = 1; i < group.length; i++) {
			const winner = this._pickBestImage(best, group[i]);
			(winner === best ? group[i] : best).remove();
			best = winner;
		}
	}

	// Matches width hints in CDN image URLs:
	//   imgproxy:    /width:1300/  or /w:1300/
	//   Cloudinary:  /w_1300/ or ,w_1300,
	//   Query param: ?w=1300 or &width=1300 or ?width=1300
	//   Next.js:     ?w=1300
	private static _urlWidthPattern = /(?:width[=:/]|[/,?&]w[_:=])(\d+)/;

	private _pickBestImage(a: Element, b: Element): Element {
		// Tier 1: prefer images with srcset or inside <picture>
		const tierA = a.getAttribute('srcset') ? 2 : a.closest('picture') ? 1 : 0;
		const tierB = b.getAttribute('srcset') ? 2 : b.closest('picture') ? 1 : 0;
		if (tierA !== tierB) return tierA > tierB ? a : b;

		// Tier 2: compare URL width hints within the same tier
		const widthA = Defuddle._urlWidth(a);
		const widthB = Defuddle._urlWidth(b);
		if (widthA !== widthB) return widthA > widthB ? a : b;

		return a;
	}

	private static _urlWidth(img: Element): number {
		const src = img.getAttribute('src') || '';
		const m = src.match(Defuddle._urlWidthPattern);
		return m ? parseInt(m[1], 10) : 0;
	}

	/**
	 * Rename non-standard HTML attributes to their canonical lowercase forms.
	 * React SSR outputs camelCase attributes like "srcSet" that some DOM
	 * parsers (e.g. linkedom) preserve verbatim instead of lowercasing.
	 */
	private _normalizeAttributes(body: Element): void {
		const renames: [string, string][] = [['srcSet', 'srcset']];
		const elements = body.querySelectorAll('img, source');
		for (const el of elements) {
			for (const [from, to] of renames) {
				const value = el.getAttribute(from);
				if (value !== null) {
					el.removeAttribute(from);
					el.setAttribute(to, value);
				}
			}
		}
	}

	private _resolveNoscriptImages(body: Element): void {
		const noscripts = body.querySelectorAll('noscript');
		for (const noscript of noscripts) {
			// Try direct child query first (linkedom parses noscript children).
			// In browsers with JS enabled, noscript content is raw text:
			// innerHTML is entity-encoded, textContent has the raw HTML.
			let noscriptImg = noscript.querySelector('img');
			if (!noscriptImg) {
				let html = noscript.innerHTML || '';
				if (!html.includes('<img')) {
					html = noscript.textContent || '';
				}
				if (!html.includes('<img')) continue;
				const fragment = parseHTML(this.doc, html);
				noscriptImg = fragment.querySelector('img');
			}
			if (!noscriptImg) continue;

			const realSrc = noscriptImg.getAttribute('src') || '';
			if (!realSrc || realSrc.startsWith('data:')) continue;

			const alt = noscriptImg.getAttribute('alt');
			const parent = noscript.parentElement;
			if (!parent) continue;

			let matched = false;
			const siblingImgs = parent.querySelectorAll(':scope > img');
			for (const img of siblingImgs) {
				const src = img.getAttribute('src') || '';
				if (!src.startsWith('data:')) continue;
				// Match by alt text; require a non-empty alt to avoid false matches
				if (!alt || img.getAttribute('alt') !== alt) continue;

				img.setAttribute('src', realSrc);
				const srcset = noscriptImg.getAttribute('srcset') || '';
				if (srcset) {
					img.setAttribute('srcset', srcset);
				}
				matched = true;
				break;
			}

			// No matching sibling img — promote the noscript img directly.
			// Only promote inside lazy-loading contexts (not tracking pixels)
			// and only when no JS-hydrated image already exists.
			// Exclude noscript children from the check — linkedom parses them
			// as real elements.
			if (!matched && this._isLazyImageContext(noscript)) {
				const container = noscript.closest('figure') || parent;
				const existingImgs = container.querySelectorAll('img');
				let hasRealImage = false;
				for (const img of existingImgs) {
					if (img.closest('noscript')) continue;
					const src = img.getAttribute('src') || '';
					if (src && !src.startsWith('data:')) {
						hasRealImage = true;
						break;
					}
				}
				if (!hasRealImage) {
					const promotedImg = noscriptImg.cloneNode(true) as Element;
					parent.insertBefore(promotedImg, noscript);
				}
			}
		}
	}

	/**
	 * Detect whether a <noscript> is inside a lazy-loading image wrapper
	 * (vs. a standalone tracking pixel that should not be promoted).
	 */
	private _isLazyImageContext(noscript: Element): boolean {
		if (noscript.closest('figure')) return true;

		const parent = noscript.parentElement;
		if (parent) {
			for (const sibling of parent.children) {
				if (sibling === noscript) continue;
				if (getClassName(sibling).toLowerCase().includes('lazy')) return true;
			}
			const parentCls = getClassName(parent).toLowerCase();
			if (parentCls.includes('image') || parentCls.includes('img') ||
				parentCls.includes('picture') || parentCls.includes('photo') ||
				parentCls.includes('media')) return true;
		}

		return false;
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
			const extractorOpts: ExtractorOptions = { includeReplies: this.options.includeReplies ?? 'extractors', language: this.options.language, fetch: this.options.fetch };
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
			const extractorOpts: ExtractorOptions = { includeReplies: this.options.includeReplies ?? 'extractors', language: this.options.language, fetch: this.options.fetch };
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
				fetch: options.fetch,
			};
			if (!this._inExtractorPipelineRun) {
				const extractor = ExtractorRegistry.findExtractor(this.doc, url, schemaOrgData, extractorOpts);
				if (extractor && extractor.canExtract()) {
					const extracted = extractor.extract();
					if (extracted.contentSelector) {
						this._inExtractorPipelineRun = true;
						try {
							const pipelineResult = this.parseInternal({
								contentSelector: extracted.contentSelector,
								removeLowScoring: false,
								removeHiddenElements: false,
							});
							const variables = this.getExtractorVariables(extracted.variables);
							return {
								...pipelineResult,
								title: extracted.variables?.title || pipelineResult.title,
								description: extracted.variables?.description || pipelineResult.description,
								author: extracted.variables?.author || pipelineResult.author,
								published: extracted.variables?.published || pipelineResult.published,
								site: extracted.variables?.site || pipelineResult.site,
								language: extracted.variables?.language || pipelineResult.language,
								extractorType: extractor.constructor.name.replace('Extractor', '').toLowerCase(),
								...(variables ? { variables } : {}),
							};
						} finally {
							this._inExtractorPipelineRun = false;
						}
					}
					return this.buildExtractorResponse(extracted, metadata, startTime, extractor, pageMetaTags);
				}
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

				// If the selected element is inside defuddle extractor output,
				// expand to the whole container so post + comments stay together.
				if (found) {
					const defuddleAncestor = found.closest('[data-defuddle]');
					if (defuddleAncestor) {
						found = defuddleAncestor;
					}
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

			// Remove "eyebrow" category labels before selector removal — these
			// are anchored on the first <h1>, which some sites strip via class
			// (e.g. Substack's .post-title) in the selector phase.
			profileStep('removeEyebrowLabel', () => {
				if (options.removeContentPatterns && mainContent) {
					removeEyebrowLabel(mainContent!, this.debug, debugRemovals);
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
					removeByContentPattern(mainContent!, this.debug, url, metadata.title || '', debugRemovals);
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

			// Remove duplicate images (same alt, different resolution)
			// after all image processing and URL resolution is complete
			this._deduplicateImages(mainContent!);

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
			const tableClass = getClassName(table).toLowerCase();
			return width > 400 ||
				(style?.width?.includes('px') && parseInt(style.width) > 400) ||
				table.getAttribute('align') === 'center' ||
				tableClass.includes('content') ||
				tableClass.includes('article') ||
				// Multi-column layout: a row with 2+ cells where at least one has an explicit width
				Array.from(table.getElementsByTagName('tr')).some(row => {
					const cells = Array.from(row.children).filter(c => c.tagName === 'TD');
					return cells.length >= 2 && cells.some(c => c.getAttribute('width'));
				});
		});

		if (!hasTableLayout) {
			return null; // Don't try table-based extraction for modern layouts
		}

		const cells = Array.from(doc.getElementsByTagName('td'));
		const bestCell = ContentScorer.findBestElement(cells);
		if (!bestCell) return null;

		// If there's more text outside the best cell than inside it,
		// tables are peripheral (TOC, intro boxes, data tables) — not the
		// main content container. Fall back to body.
		const bestCellWords = countWords(bestCell.textContent || '');
		const bodyWords = countWords((doc.body || doc.documentElement).textContent || '');
		if (bestCellWords * 2 < bodyWords) {
			return null;
		}

		return bestCell;
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
