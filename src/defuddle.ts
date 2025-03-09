import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse } from './types';

// Entry point elements
// These are the elements that will be used to find the main content
const ENTRY_POINT_ELEMENTS = [
	'article',
	'[role="article"]',
	'[itemprop="articleBody"]',
	'.post-content',
	'.article-content',
	'#article-content',
	'.content-article',
	'main',
	'[role="main"]',
	'body' // ensures there is always a match
];

const MOBILE_WIDTH = 600;
const BLOCK_ELEMENTS = ['div', 'section', 'article', 'main'];

// Hidden elements that should be removed
const HIDDEN_ELEMENT_SELECTORS = [
	'[hidden]',
	'[aria-hidden="true"]',
//	'[style*="display: none"]', causes problems for math formulas
//	'[style*="display:none"]',
	'[style*="visibility: hidden"]',
	'[style*="visibility:hidden"]',
	'.hidden',
	'.invisible'
].join(',');

// Selectors to be removed
// Case insensitive, but matches must be exact
const EXACT_SELECTORS = [
	'.ad',
	'aside',
	'button',
	'canvas',
	'#comments',
	'dialog',
	'fieldset',
	'footer',
	'form',
	'header',
	'#header',
	'input',
	'iframe',
	'label',
	'link',
	'.logo',
	'#logo',
	'.meta',
	'nav',
	'#newsletter',
	'noscript',
	'.noprint',
	'option',
	'.promo',
	'script',
	'select',
	'sidebar',
	'.sidebar',
	'#sidebar',
	'#siteSub',
	'style',
	'time',
	'#title',
	'#toc',
	'.toc',
	'textarea',
	'.clickable-icon',
	'a[href^="#"][class*="anchor"]',
	'a[href^="#"][class*="ref"]',
	'[data-link-name*="skip"]',
	'[data-print-layout="hide"]',
	'[data-container*="most-viewed"]',
	'[src*="author"]',
	'[href="#site-content"]',
	'[class^="ad-"]',
	'[class$="-ad"]',
	'[id^="ad-"]',
	'[id$="-ad"]',
	'[role="banner"]',
	'[role="button"]',
	'[role="dialog"]',
	'[role="complementary"]',
	'[role="navigation"]'
];

// Removal patterns tested against attributes: class, id, data-testid, and data-qa
// Case insensitive, partial matches allowed
const PARTIAL_SELECTORS = [
	'access-wall',
	'activitypub',
	'appendix',
	'avatar',
	'advert',
	'-ad-',
	'_ad_',
	'around-the-web',
	'article__copy',
	'article-end ',
	'article_header',
	'article__header',
	'article__info',
	'article__meta',
	'article-title',
	'articletopics',
	'article-topics',
	'article--lede', // The Verge
	'author',
	'back-to-top',
	'banner',
	'bottom-of-article',
	'brand-bar',
	'breadcrumb',
	'button-wrapper',
	'btn-',
	'-btn',
	'byline',
	'cat_header',
	'catlinks',
	'collections',
	'comments',
	'comment-count',
	'comment-content',
	'comment-form',
	'comment-respond',
	'comment-thread',
	'complementary',
	'content-card', // The Verge
	'core-collateral',
	'_cta',
	'-cta',
	'cta-',
	'cta_',
	'current-issue', // The Nation
	'dateheader',
	'dialog',
	'disclosure',
	'discussion',
	'disqus',
	'donate',
	'dropdown', // Ars Technica
	'eletters',
	'eyebrow',
	'expand-reduce',
	'facebook',
	'favorite',
	'feedback',
	'fixed',
	'follow',
	'footer',
	'footnote-backref',
	'for-you',
	'frontmatter',
//	'global',
	'google',
	'goog-',
	'header-logo',
	'header-pattern', // The Verge
	'hide-print',
	'interlude',
	'interaction',
	'kicker',
	'-labels',
	'latest-content',
	'-ledes-', // The Verge
	'-license',
	'link-box',
	'listing-dynamic-terms', // Boston Review
	'loading',
	'loa-info',
	'logo_container',
	'ltx_role_refnum', // Arxiv
	'ltx_tag_bibitem',
	'marketing',
	'media-inquiry',
	'menu-',
	'meta-',
	'metadata',
	'might-like',
	'more-',
	'mw-editsection',
	'mw-cite-backlink',
	'mw-jump-link',
	'nav-',
	'navbar',
	'navigation',
	'next-',
	'news-story-title',
//	'newsletter', used on Substack
	'newsletter_',
	'newsletter-signup',
	'newslettersignup',
	'newsletterwrapper',
	'not-found',
	'originally-published', // Mercury News
	'overlay',
	'page-title',
	'-partners',
	'pencraft', // Substack
	'plea',
	'popular',
	'popup',
	'pop-up',
	'post-bottom',
	'post__category',
	'postcomment',
	'postdate',
	'post-date',
	'post_date',
	'postinfo',
	'post-info',
	'post_info',
	'post-links',
	'post-meta',
	'postmeta',
	'postsnippet',
	'post_snippet',
	'post-snippet',
	'posttitle',
	'post-title',
	'post_title',
	'posttax',
	'post-tax',
	'post_tax',
	'post_tag',
	'post-tag',
//	'preview', used on Obsidian Publish
	'prevnext',
	'print-none',
	'profile',
//	'promo',
	'pubdate',
	'pub_date',
	'pub-date',
	'publication-date',
	'publicationName', // Medium
	'qr-code',
	'qr_code',
	'readmore',
	'read-next',
	'read_next',
	'read_time',
	'read-time',
	'reading_time',
	'reading-time',
	'reading-list',
	'recommend',
	'recirc',
	'register',
	'related',
	'screen-reader-text',
//	'share',
	'-share',
	'share-icons',
	'share-section',
	'sidebartitle',
	'similar-',
	'similar_',
	'site-index',
	'site-header',
	'site-logo',
	'site-name',
//	'skip-',
	'social',
	'speechify-ignore',
	'sponsor',
//	'-stats',
	'_stats',
	'storyreadtime', // Medium
	'storypublishdate', // Medium
	'subscribe',
	'_tags',
	'tags__item',
	'tag_list',
	'taxonomy',
	'table-of-contents',
	'tabs-',
//	'teaser', Nature
	'terminaltout',
	'time-rubric',
	'timestamp',
	'tip_off',
	'tiptout',
	'-toc',
	'topic-list',
	'toolbar',
	'tooltip',
	'top-wrapper',
	'tree-item',
	'trending',
	'trust-feat',
	'twitter'
];

// Add new selectors for footnotes and citations
const FOOTNOTE_SELECTORS = [
	'sup.reference',
	'cite.ltx_cite',
	'sup[id^="fnref:"]',
	'span.footnote-link',
	'a.citation',
	'a[href^="#fn"]',
	'a[href^="#cite"]',
	'a[href^="#reference"]',
	'a[href^="#footnote"]',
	'a[href^="#r"]', // Common in academic papers
	'a[href^="#b"]', // Common for bibliography references
	'a[href*="cite_note"]',
	'a[href*="cite_ref"]'
].join(',');

const REFERENCE_LIST_SELECTORS = [
	'ol.references',
	'ol.footnotes-list',
	'ul.footnotes-list',
	'div.footnotes ol',
	'div.footnote ol',
	'section.footnotes ol',
	'ul.ltx_biblist',
	'div[role="doc-endnotes"]',
	'section[role="doc-endnotes"]',
	'div[role="doc-footnotes"]',
	'section[role="doc-footnotes"]'
].join(',');

// Elements that are allowed to be empty
// These are not removed even if they have no content
const ALLOWED_EMPTY_ELEMENTS = new Set([
	'area',
	'audio',
	'base',
	'br',
	'circle',
	'col',
	'defs',
	'ellipse',
	'embed',
	'figure',
	'g',
	'hr',
	'iframe',
	'img',
	'input',
	'line',
	'link',
	'mask',
	'meta',
	'object',
	'param',
	'path',
	'pattern',
	'picture',
	'polygon',
	'polyline',
	'rect',
	'source',
	'stop',
	'svg',
	'td',
	'th',
	'track',
	'use',
	'video',
	'wbr'
]);

// Attributes to keep
const ALLOWED_ATTRIBUTES = new Set([
	'alt',
	'aria-label',
	'class',
	'colspan',
	'data-src',
	'data-srcset',
	'dir',
	'headers',
	'height',
	'href',
	'id',
	'lang',
	'role',
	'rowspan',
	'src',
	'srcset',
	'title',
	'width'
]);

interface ContentScore {
	score: number;
	element: Element;
}

interface StyleChange {
	selector: string;
	styles: string;
}

export class Defuddle {
	private doc: Document;
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
		try {
			// Evaluate styles and sizes on original document
			const mobileStyles = this._evaluateMediaQueries(this.doc);
			const smallImages = this.findSmallImages(this.doc);
			
			// Clone after evaluation
			const clone = this.doc.cloneNode(true) as Document;
			const schemaOrgData = MetadataExtractor.extractSchemaOrgData(this.doc);

			// Apply mobile style to clone
			this.applyMobileStyles(clone, mobileStyles);

			// Find main content
			const mainContent = this.findMainContent(clone);
			if (!mainContent) {
				return {
					content: this.doc.body.innerHTML,
					...MetadataExtractor.extract(this.doc, schemaOrgData)
				};
			}

			// Remove small images identified from original document
			this.removeSmallImages(clone, smallImages);
			
			// Perform other destructive operations on the clone
			this.removeHiddenElements(clone);
			this.removeClutter(clone);

			// Clean up the main content
			this.cleanContent(mainContent);

			const metadata = MetadataExtractor.extract(this.doc, schemaOrgData);

			return {
				content: mainContent ? mainContent.outerHTML : this.doc.body.innerHTML,
				...metadata
			};
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			const schemaOrgData = MetadataExtractor.extractSchemaOrgData(this.doc);
			return {
				content: this.doc.body.innerHTML,
				...MetadataExtractor.extract(this.doc, schemaOrgData)
			};
		}
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
					// Expected error for cross-origin stylesheets
					if (e instanceof DOMException && e.name === 'SecurityError') {
						return false;
					}
					throw e;
				}
			});
			
			// Process all sheets in a single pass
			const mediaRules = sheets.flatMap(sheet => {
				try {
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

		// Second pass: Use TreeWalker for efficient traversal
		const treeWalker = document.createTreeWalker(
			doc.body,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode: (node: Element) => {
					// Skip elements already marked for removal
					if (elementsToRemove.has(node)) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		);

		// Batch style computations
		const elements: Element[] = [];
		let currentNode: Element | null;
		while (currentNode = treeWalker.nextNode() as Element) {
			elements.push(currentNode);
		}

		// Process styles in batches to minimize layout thrashing
		const BATCH_SIZE = 100;
		for (let i = 0; i < elements.length; i += BATCH_SIZE) {
			const batch = elements.slice(i, i + BATCH_SIZE);
			
			// Read phase - gather all computedStyles
			const styles = batch.map(el => window.getComputedStyle(el));
			
			// Write phase - mark elements for removal
			batch.forEach((element, index) => {
				const computedStyle = styles[index];
				if (
					computedStyle.display === 'none' ||
					computedStyle.visibility === 'hidden' ||
					computedStyle.opacity === '0'
				) {
					elementsToRemove.add(element);
					count++;
				}
			});
		}

		// Final pass: Batch remove all hidden elements
		elementsToRemove.forEach(el => el.remove());

		this._log('Removed hidden elements:', count);
	}

	private removeClutter(doc: Document) {
		const startTime = performance.now();
		let exactSelectorCount = 0;
		let partialSelectorCount = 0;

		// Combine all exact selectors into a single selector string
		const combinedExactSelector = EXACT_SELECTORS.join(',');
		
		// First pass: Remove elements matching exact selectors
		const exactElements = doc.querySelectorAll(combinedExactSelector);
		if (exactElements.length > 0) {
			// Batch remove elements
			const fragment = document.createDocumentFragment();
			exactElements.forEach(el => {
				if (el?.parentNode) {
					fragment.appendChild(el);
					exactSelectorCount++;
				}
			});
		}

		// Second pass: Handle partial selectors
		// Pre-compile regexes for better performance
		const partialRegexes = PARTIAL_SELECTORS.map(pattern => ({
			pattern,
			regex: new RegExp(pattern, 'i')
		}));

		// Create an efficient lookup for partial matches
		const shouldRemoveElement = (el: Element): boolean => {
			// Get all relevant attributes once
			const className = el.className && typeof el.className === 'string' ? 
				el.className.toLowerCase() : '';
			const id = el.id ? el.id.toLowerCase() : '';
			const testId = el.getAttribute('data-testid')?.toLowerCase() || '';
			const testQa = el.getAttribute('data-qa')?.toLowerCase() || '';
			const testCy = el.getAttribute('data-cy')?.toLowerCase() || '';

			// Combine attributes for single-pass checking
			const attributeText = `${className} ${id} ${testId} ${testQa} ${testCy}`;
			
			// Early return if no content to check
			if (!attributeText.trim()) {
				return false;
			}

			// Use some() for early termination
			return partialRegexes.some(({ regex }) => regex.test(attributeText));
		};

		// Process elements in batches to avoid long tasks
		const BATCH_SIZE = 100;
		const allElements = Array.from(doc.querySelectorAll('[class], [id], [data-testid], [data-qa], [data-cy]'));
		
		for (let i = 0; i < allElements.length; i += BATCH_SIZE) {
			const batch = allElements.slice(i, i + BATCH_SIZE);
			const elementsToRemove: Element[] = [];

			// Read phase - identify elements to remove
			batch.forEach(el => {
				if (shouldRemoveElement(el)) {
					elementsToRemove.push(el);
					partialSelectorCount++;
				}
			});

			// Write phase - batch remove elements
			if (elementsToRemove.length > 0) {
				const fragment = document.createDocumentFragment();
				elementsToRemove.forEach(el => {
					if (el?.parentNode) {
						fragment.appendChild(el);
					}
				});
			}
		}

		const endTime = performance.now();
		this._log('Found clutter elements:', {
			exactSelectors: exactSelectorCount,
			partialSelectors: partialSelectorCount,
			total: exactSelectorCount + partialSelectorCount,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	private cleanContent(element: Element) {
		// Remove HTML comments
		this.removeHtmlComments(element);
		
		// Handle h1 elements - remove first one and convert others to h2
		this.handleHeadings(element);
		
		// Standardize footnotes and citations
		this.standardizeFootnotes(element);
		
		// Strip unwanted attributes
		this.stripUnwantedAttributes(element);

		// Remove empty elements
		this.removeEmptyElements(element);
	}

	private handleHeadings(element: Element) {
		const h1s = element.getElementsByTagName('h1');
		let isFirstH1 = true;

		Array.from(h1s).forEach(h1 => {
			if (isFirstH1) {
				h1.remove();
				isFirstH1 = false;
			} else {
				// Convert subsequent h1s to h2s
				const h2 = document.createElement('h2');
				h2.innerHTML = h1.innerHTML;
				// Copy allowed attributes
				Array.from(h1.attributes).forEach(attr => {
					if (ALLOWED_ATTRIBUTES.has(attr.name)) {
						h2.setAttribute(attr.name, attr.value);
					}
				});
				h1.parentNode?.replaceChild(h2, h1);
			}
		});
	}

	private removeHtmlComments(element: Element) {
		const comments: Comment[] = [];
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_COMMENT,
			null
		);

		let node;
		while (node = walker.nextNode()) {
			comments.push(node as Comment);
		}

		comments.forEach(comment => {
			comment.remove();
		});

		this._log('Removed HTML comments:', comments.length);
	}

	private stripUnwantedAttributes(element: Element) {
		let attributeCount = 0;

		const processElement = (el: Element) => {
			// Skip SVG elements - preserve all their attributes
			if (el instanceof SVGElement) {
				return;
			}

			const attributes = Array.from(el.attributes);
			
			attributes.forEach(attr => {
				const attrName = attr.name.toLowerCase();
				if (!ALLOWED_ATTRIBUTES.has(attrName) && !attrName.startsWith('data-')) {
					el.removeAttribute(attr.name);
					attributeCount++;
				}
			});
		};

		processElement(element);
		element.querySelectorAll('*').forEach(processElement);

		this._log('Stripped attributes:', attributeCount);
	}

	private removeEmptyElements(element: Element) {
		let removedCount = 0;
		let iterations = 0;
		let keepRemoving = true;

		while (keepRemoving) {
			iterations++;
			keepRemoving = false;
			// Get all elements without children, working from deepest first
			const emptyElements = Array.from(element.getElementsByTagName('*')).filter(el => {
				if (ALLOWED_EMPTY_ELEMENTS.has(el.tagName.toLowerCase())) {
					return false;
				}
				
				// Check if element has only whitespace or &nbsp;
				const textContent = el.textContent || '';
				const hasOnlyWhitespace = textContent.trim().length === 0;
				const hasNbsp = textContent.includes('\u00A0'); // Unicode non-breaking space
				
				// Check if element has no meaningful children
				const hasNoChildren = !el.hasChildNodes() || 
					(Array.from(el.childNodes).every(node => {
						if (node.nodeType === Node.TEXT_NODE) {
							const nodeText = node.textContent || '';
							return nodeText.trim().length === 0 && !nodeText.includes('\u00A0');
						}
						return false;
					}));

				return hasOnlyWhitespace && !hasNbsp && hasNoChildren;
			});

			if (emptyElements.length > 0) {
				emptyElements.forEach(el => {
					el.remove();
					removedCount++;
				});
				keepRemoving = true;
			}
		}

		this._log('Removed empty elements:', {
			count: removedCount,
			iterations
		});
	}

	private standardizeFootnotes(element: Element) {
		const footnotes = new Map<string, number>();
		let footnoteCount = 1;

		// First pass: collect all footnotes and their numbers
		const referenceLists = element.querySelectorAll(REFERENCE_LIST_SELECTORS);
		referenceLists.forEach(list => {
			const items = list.querySelectorAll('li');
			items.forEach(li => {
				let id = '';

				// Extract ID from various formats
				if (li.id.startsWith('bib.bib')) {
					id = li.id.replace('bib.bib', '');
				} else if (li.id.startsWith('fn:')) {
					id = li.id.replace('fn:', '');
				} else {
					const match = li.id.split('/').pop()?.match(/cite_note-(.+)/);
					id = match ? match[1] : li.id;
				}

				if (id && !footnotes.has(id.toLowerCase())) {
					footnotes.set(id.toLowerCase(), footnoteCount++);
				}
			});
		});

		// Second pass: standardize inline references using the collected numbers
		const footnoteElements = element.querySelectorAll(FOOTNOTE_SELECTORS);
		footnoteElements.forEach(el => {
			if (!(el instanceof HTMLElement)) return;

			let footnoteId = '';
			let footnoteContent = '';

			// Extract footnote ID based on element type
			if (el.matches('sup.reference')) {
				const links = el.querySelectorAll('a');
				Array.from(links).forEach(link => {
					const href = link.getAttribute('href');
					if (href) {
						const match = href.split('/').pop()?.match(/(?:cite_note|cite_ref)-(.+)/);
						if (match) {
							footnoteId = match[1].toLowerCase();
						}
					}
				});
			} else if (el.matches('cite.ltx_cite')) {
				const link = el.querySelector('a');
				if (link) {
					const href = link.getAttribute('href');
					if (href) {
						const match = href.split('/').pop()?.match(/bib\.bib(\d+)/);
						if (match) {
							footnoteId = match[1].toLowerCase();
						}
					}
				}
			} else if (el.matches('sup[id^="fnref:"]')) {
				footnoteId = el.id.replace('fnref:', '').toLowerCase();
			} else if (el.matches('span.footnote-link')) {
				footnoteId = el.getAttribute('data-footnote-id') || '';
				footnoteContent = el.getAttribute('data-footnote-content') || '';
			} else if (el.matches('a.citation')) {
				footnoteId = el.textContent?.trim() || '';
				footnoteContent = el.getAttribute('href') || '';
			} else {
				// Handle other citation types
				const href = el.getAttribute('href');
				if (href) {
					const id = href.replace(/^[#]/, '');
					footnoteId = id.toLowerCase();
				}
			}

			if (footnoteId) {
				const footnoteNumber = footnotes.get(footnoteId);
				if (footnoteNumber) {
					// Create standardized footnote reference
					const sup = document.createElement('sup');
					sup.id = `fnref:${footnoteNumber}`;
					const link = document.createElement('a');
					link.href = `#fn:${footnoteNumber}`;
					link.textContent = footnoteNumber.toString();
					sup.appendChild(link);
					el.replaceWith(sup);
				}
			}
		});

		// Third pass: standardize reference lists using the collected numbers
		referenceLists.forEach(list => {
			const items = list.querySelectorAll('li');
			const newList = document.createElement('div');
			newList.className = 'footnotes';
			const orderedList = document.createElement('ol');

			items.forEach(li => {
				let id = '';

				// Extract ID from various formats
				if (li.id.startsWith('bib.bib')) {
					id = li.id.replace('bib.bib', '');
				} else if (li.id.startsWith('fn:')) {
					id = li.id.replace('fn:', '');
				} else {
					const match = li.id.split('/').pop()?.match(/cite_note-(.+)/);
					id = match ? match[1] : li.id;
				}

				const footnoteNumber = footnotes.get(id.toLowerCase());
				if (footnoteNumber) {
					// Remove sup elements that just contain the reference number
					const sup = li.querySelector('sup');
					if (sup && sup.textContent?.trim() === id) {
						sup.remove();
					}

					// Create standardized footnote item
					const newItem = document.createElement('li');
					newItem.className = 'footnote';
					newItem.id = `fn:${footnoteNumber}`;

					// Wrap content in paragraph
					const paragraph = document.createElement('p');
					paragraph.innerHTML = li.innerHTML;

					// Add backlink
					const backlink = document.createElement('a');
					backlink.href = `#fnref:${footnoteNumber}`;
					backlink.title = 'return to article';
					backlink.innerHTML = ' ↩';
					paragraph.appendChild(backlink);

					// Add empty paragraph for spacing
					const spacer = document.createElement('p');

					newItem.appendChild(paragraph);
					newItem.appendChild(spacer);
					orderedList.appendChild(newItem);
				}
			});

			newList.appendChild(orderedList);
			list.replaceWith(newList);
		});
	}

	// Find small IMG and SVG elements
	private findSmallImages(doc: Document): Set<string> {
		const MIN_DIMENSION = 33;
		const smallImages = new Set<string>();
		const transformRegex = /scale\(([\d.]+)\)/;
		const startTime = performance.now();
		let processedCount = 0;

		// 1. READ PHASE - Gather all elements in a single pass
		const elements = [
			...Array.from(doc.getElementsByTagName('img')),
			...Array.from(doc.getElementsByTagName('svg'))
		];

		if (elements.length === 0) {
			return smallImages;
		}

		// 2. BATCH PROCESS - Collect all measurements in one go
		const measurements = elements.map(element => ({
			element,
			// Static attributes (no reflow)
			naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : 0,
			naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : 0,
			attrWidth: parseInt(element.getAttribute('width') || '0'),
			attrHeight: parseInt(element.getAttribute('height') || '0')
		}));

		// 3. BATCH COMPUTE STYLES - Process in chunks to avoid long tasks
		const BATCH_SIZE = 50;
		for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
			const batch = measurements.slice(i, i + BATCH_SIZE);
			
			try {
				// Read phase - compute all styles at once
				const styles = batch.map(({ element }) => window.getComputedStyle(element));
				const rects = batch.map(({ element }) => element.getBoundingClientRect());
				
				// Process phase - no DOM operations
				batch.forEach((measurement, index) => {
					try {
						const style = styles[index];
						const rect = rects[index];
						
						// Get transform scale in the same batch
						const transform = style.transform;
						const scale = transform ? 
							parseFloat(transform.match(transformRegex)?.[1] || '1') : 1;

						// Calculate effective dimensions
						const widths = [
							measurement.naturalWidth,
							measurement.attrWidth,
							parseInt(style.width) || 0,
							rect.width * scale
						].filter(dim => typeof dim === 'number' && dim > 0);

						const heights = [
							measurement.naturalHeight,
							measurement.attrHeight,
							parseInt(style.height) || 0,
							rect.height * scale
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

		const endTime = performance.now();
		this._log('Found small elements:', {
			count: processedCount,
			totalElements: elements.length,
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
		if (element instanceof HTMLImageElement) {
			const src = element.src || element.getAttribute('data-src') || '';
			const srcset = element.srcset || element.getAttribute('data-srcset') || '';
			if (src) return `src:${src}`;
			if (srcset) return `srcset:${srcset}`;
		}

		const id = element.id || '';
		const className = element.className || '';
		const viewBox = element instanceof SVGElement ? element.getAttribute('viewBox') || '' : '';
		
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
				let score = (ENTRY_POINT_ELEMENTS.length - index) * 10;
				
				// Add score based on content analysis
				score += this.scoreElement(element);
				
				candidates.push({ element, score });
			});
		});

		if (candidates.length === 0) {
			// Fall back to scoring block elements
			// Currently <body> element is used as the fallback, so this is not used
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

		return candidates[0].element;
	}

	private findContentByScoring(doc: Document): Element | null {
		const candidates = this.scoreElements(doc);
		return candidates.length > 0 ? candidates[0].element : null;
	}

	private getElementSelector(element: Element): string {
		const parts: string[] = [];
		let current: Element | null = element;
		
		while (current && current !== document.documentElement) {
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

	private scoreElements(doc: Document): ContentScore[] {
		const candidates: ContentScore[] = [];

		BLOCK_ELEMENTS.forEach((tag: string) => {
			Array.from(doc.getElementsByTagName(tag)).forEach((element: Element) => {
				const score = this.scoreElement(element);
				if (score > 0) {
					candidates.push({ score, element });
				}
			});
		});

		return candidates.sort((a, b) => b.score - a.score);
	}

	private scoreElement(element: Element): number {
		let score = 0;

		// Score based on element properties
		const className = element.className && typeof element.className === 'string' ? 
			element.className.toLowerCase() : '';
		const id = element.id ? element.id.toLowerCase() : '';

		// Score based on content
		const text = element.textContent || '';
		const words = text.split(/\s+/).length;
		score += Math.min(Math.floor(words / 100), 3);

		// Score based on link density
		const links = element.getElementsByTagName('a');
		const linkText = Array.from(links).reduce((acc, link) => acc + (link.textContent?.length || 0), 0);
		const linkDensity = text.length ? linkText / text.length : 0;
		if (linkDensity > 0.5) {
			score -= 10;
		}

		// Score based on presence of meaningful elements
		const paragraphs = element.getElementsByTagName('p').length;
		score += paragraphs;

		const images = element.getElementsByTagName('img').length;
		score += Math.min(images * 3, 9);

		return score;
	}
} 