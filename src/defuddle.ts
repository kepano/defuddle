import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse, DefuddleMetadata } from './types';

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
	// scripts, styles
	'noscript',
	'script',
	'style',

	// ads
	'.ad:not([class*="gradient"])',
	'[class^="ad-" i]',
	'[class$="-ad" i]',
	'[id^="ad-" i]',
	'[id$="-ad" i]',
	'[role="banner" i]',
	'[class="promo" i]',

	// comments
	'[id="comments" i]',

	// header, nav
	'header',
	'nav',
	'[id="header" i]',
	'[class="navigation" i]',
	'[role="navigation" i]',
	'[role="dialog" i]',
	'[role="complementary" i]',
	'[class="pagination" i]',

	// metadata
	'[class="author" i]',
	'[class="date" i]',
	'[class="meta" i]',
	'[class="toc" i]',
	'[href*="/category" i]',
	'[href*="/categories" i]',
	'[href*="/tag/" i]',
	'[href*="/tags/" i]',
	'[href*="/topics" i]',
	'[href*="author" i]',
	'[href="#site-content" i]',
	'[id="title" i]',
	'[id="toc" i]',
	'[src*="author" i]',

	// footer
	'footer',

	// inputs, forms, elements
	'aside',
	'button',
	'canvas',
	'dialog',
	'fieldset',
	'form',
	'input',
	'label',
	'link',
	'option',
	'select',
	'textarea',
	'time',
		// 'iframe' maybe narrow this down to only allow iframes for video
		// '[role="button"]', Medium images

	// logos
	'[class="logo" i]',
	'[id="logo" i]',

	// newsletter
	'[id="newsletter" i]',

	// hidden for print
	'[class="noprint" i]',
	'[data-link-name*="skip" i]',
	'[data-print-layout="hide" i]',

	// footnotes, citations
	'[class*="clickable-icon" i]',
	'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]',
	'a[href^="#"][class*="anchor" i]',
	'a[href^="#"][class*="ref" i]',

	// link lists
	'[data-container*="most-viewed" i]',

	// sidebar
	'[class="sidebar" i]',
	'[id="sidebar" i]',
	'[id="sitesub" i]',
	
	// other
	'[data-optimizely="related-articles-section" i]' // The Economist
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
	'allterms',
	'around-the-web',
	'article__copy',
	'article_date',
	'article-end ',
	'article_header',
	'article__header',
	'article__info',
	'article-info',
	'article__meta',
	'article-subject',
	'article_subject',
	'article-snippet',
	'article-tags',
	'article_tags',
	'article-title',
	'article_title',
	'articletopics',
	'article-topics',
	'article-type',
	'article--lede', // The Verge
//	'author', Gwern
	'back-to-top',
	'backlinks-section',
	'banner',
	'bio-block',
	'blog-pager',
	'bottom-of-article',
	'brand-bar',
	'breadcrumb',
	'button-wrapper',
	'btn-',
	'-btn',
	'byline',
	'captcha',
	'cat_header',
	'catlinks',
	'chapter-list', // The Economist
	'collections',
	'comments',
//	'-comment', Syntax highlighting
	'comment-count',
	'comment-content',
	'comment-form',
	'comment-respond',
	'comment-thread',
	'complementary',
	'consent',
	'content-card', // The Verge
	'contentpromo',
	'core-collateral',
	'_cta',
	'-cta',
	'cta-',
	'cta_',
	'current-issue', // The Nation
	'custom-list-number',
	'dateline',
	'dateheader',
	'date-header',
	'date_header-',
	'dialog',
	'disclaimer',
	'disclosure',
	'discussion',
	'discuss_',
	'disqus',
	'donate',
	'dropdown', // Ars Technica
	'eletters',
	'emailsignup',
	'engagement-widget',
	'entry-author-info',
	'entry-date',
	'entry-meta',
	'entry-title',
	'entry-utility',
	'eyebrow',
	'expand-reduce',
	'externallinkembedwrapper', // The New Yorker
	'facebook',
	'favorite',
	'feedback',
	'feed-links',
	'field-site-sections',
	'fixed',
	'follow',
	'footer',
	'footnote-back',
	'footnoteback',
	'for-you',
	'frontmatter',
	'further-reading',
	'gist-meta',
//	'global',
	'google',
	'goog-',
	'header-logo',
	'header-pattern', // The Verge
	'hero-list',
	'hide-for-print',
	'hide-print',
	'hidden-sidenote',
	'interlude',
	'interaction',
	'jumplink',
	'keyword',
	'kicker',
	'-labels',
	'latest-content',
	'-ledes-', // The Verge
	'-license',
	'link-box',
	'links-grid', // BBC
	'links-title', // BBC
	'listing-dynamic-terms', // Boston Review
	'loading',
	'loa-info',
	'logo_container',
	'ltx_role_refnum', // Arxiv
	'ltx_tag_bibitem',
	'ltx_error',
	'marketing',
	'media-inquiry',
	'menu-',
	'meta-',
	'metadata',
	'might-like',
	'_modal',
	'-modal',
	'more-',
	'morenews',
	'morestories',
	'mw-editsection',
	'mw-cite-backlink',
	'mw-jump-link',
	'nav-',
	'nav_',
	'navbar',
	'navigation',
	'next-',
	'news-story-title',
//	'newsletter', used on Substack
	'newsletter_',
	'newsletter-signup',
	'newslettersignup',
	'newsletterwidget',
	'newsletterwrapper',
	'not-found',
	'originally-published', // Mercury News
	'overlay',
	'page-title',
	'-partners',
	'pencraft', // Substack
	'plea',
	'popular',
//	'popup', Gwern
	'pop-up',
	'popover',
	'post-bottom',
	'post__category',
	'postcomment',
	'postdate',
	'post-date',
	'post_date',
	'post-feeds',
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
	'posttag',
	'post_tag',
	'post-tag',
//	'preview', used on Obsidian Publish
	'prevnext',
	'previousnext',
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
//	'-share', scitechdaily.com
	'share-box',
	'share-icons',
	'sharelinks',
	'share-section',
	'sidebartitle',
	'sidebar_',
	'similar-',
	'similar_',
	'similars-',
	'sideitems',
	'site-index',
	'site-header',
	'site-logo',
	'site-name',
//	'skip-',
	'skip-link',
	'social',
	'speechify-ignore',
	'sponsor',
//	'-stats',
	'_stats',
	'storyreadtime', // Medium
	'storypublishdate', // Medium
	'subject-label',
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
	'trust-badge',
	'twitter',
	'welcomebox'
];

// Selectors for footnotes and citations
const FOOTNOTE_INLINE_REFERENCES = [
	'sup.reference',
	'cite.ltx_cite',
	'sup[id^="fnr"]',
	'sup[id^="fnref:"]',
	'span.footnote-link',
	'a.citation',
	'a[id^="ref-link"]',
	'a[href^="#fn"]',
	'a[href^="#cite"]',
	'a[href^="#reference"]',
	'a[href^="#footnote"]',
	'a[href^="#r"]', // Common in academic papers
	'a[href^="#b"]', // Common for bibliography references
	'a[href*="cite_note"]',
	'a[href*="cite_ref"]',
	'a.footnote-anchor', // Substack
	'span.footnote-hovercard-target a', // Substack
	'a[role="doc-biblioref"]', // Science.org
	'a[id^="fnref"]',
	'a[id^="ref-link"]', // Nature.com
].join(',');

const FOOTNOTE_LIST_SELECTORS = [
	'div.footnote ol',
	'div.footnotes ol',
	'div[role="doc-endnotes"]',
	'div[role="doc-footnotes"]',
	'ol.footnotes-list',
	'ol.footnotes',
	'ol.references',
	'ol[class*="article-references"]',
	'section.footnotes ol',
	'section[role="doc-endnotes"]',
	'section[role="doc-footnotes"]',
	'section[role="doc-bibliography"]',
	'ul.footnotes-list',
	'ul.ltx_biblist',
	'div.footnote[data-component-name="FootnoteToDOM"]' // Substack
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
	'allow',
	'allowfullscreen',
	'aria-label',
	'class',
	'colspan',
	'controls',
	'data-src',
	'data-srcset',
	'dir',
	'frameborder',
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
	'type',
	'width'
]);

// Element standardization rules
// Maps selectors to their target HTML element name
interface StandardizationRule {
	selector: string;
	element: string;
	transform?: (el: Element) => Element;
}

const ELEMENT_STANDARDIZATION_RULES: StandardizationRule[] = [
	// Simplify headings by removing internal navigation elements
	{
		selector: 'h1, h2, h3, h4, h5, h6',
		element: 'keep',
		transform: (el: Element): Element => {
			// If heading only contains a single anchor with internal link
			if (el.children.length === 1 && 
				el.firstElementChild?.tagName === 'A' &&
				(el.firstElementChild.getAttribute('href')?.includes('#') || 
				 el.firstElementChild.getAttribute('href')?.startsWith('#'))) {
				
				// Create new heading of same level
				const newHeading = document.createElement(el.tagName);
				
				// Copy allowed attributes from original heading
				Array.from(el.attributes).forEach(attr => {
					if (ALLOWED_ATTRIBUTES.has(attr.name)) {
						newHeading.setAttribute(attr.name, attr.value);
					}
				});
				
				// Just use the text content
				newHeading.textContent = el.textContent?.trim() || '';
				
				return newHeading;
			}
			
			// If heading contains navigation buttons or other utility elements
			const buttons = el.querySelectorAll('button');
			if (buttons.length > 0) {
				const newHeading = document.createElement(el.tagName);
				
				// Copy allowed attributes
				Array.from(el.attributes).forEach(attr => {
					if (ALLOWED_ATTRIBUTES.has(attr.name)) {
						newHeading.setAttribute(attr.name, attr.value);
					}
				});
				
				// Just use the text content
				newHeading.textContent = el.textContent?.trim() || '';
				
				return newHeading;
			}
			
			return el;
		}
	},
	// Convert divs with paragraph role to actual paragraphs
	{ 
		selector: 'div[data-testid^="paragraph"], div[role="paragraph"]', 
		element: 'p',
		transform: (el: Element): Element => {
			const p = document.createElement('p');
			
			// Copy innerHTML
			p.innerHTML = el.innerHTML;
			
			// Copy allowed attributes
			Array.from(el.attributes).forEach(attr => {
				if (ALLOWED_ATTRIBUTES.has(attr.name)) {
					p.setAttribute(attr.name, attr.value);
				}
			});
			
			return p;
		}
	},
	// Convert divs with list roles to actual lists
	{ 
		selector: 'div[role="list"]', 
		element: 'ul',
		// Custom handler for list type detection and transformation
		transform: (el: Element): Element => {
			// First determine if this is an ordered list
			const firstItem = el.querySelector('div[role="listitem"] .label');
			const label = firstItem?.textContent?.trim() || '';
			const isOrdered = label.match(/^\d+\)/);
			
			// Create the appropriate list type
			const list = document.createElement(isOrdered ? 'ol' : 'ul');
			
			// Process each list item
			const items = el.querySelectorAll('div[role="listitem"]');
			items.forEach(item => {
				const li = document.createElement('li');
				const content = item.querySelector('.content');
				
				if (content) {
					// Convert any paragraph divs inside content
					const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
					paragraphDivs.forEach(div => {
						const p = document.createElement('p');
						p.innerHTML = div.innerHTML;
						div.replaceWith(p);
					});
					
					// Convert any nested lists recursively
					const nestedLists = content.querySelectorAll('div[role="list"]');
					nestedLists.forEach(nestedList => {
						const firstNestedItem = nestedList.querySelector('div[role="listitem"] .label');
						const nestedLabel = firstNestedItem?.textContent?.trim() || '';
						const isNestedOrdered = nestedLabel.match(/^\d+\)/);
						
						const newNestedList = document.createElement(isNestedOrdered ? 'ol' : 'ul');
						
						// Process nested items
						const nestedItems = nestedList.querySelectorAll('div[role="listitem"]');
						nestedItems.forEach(nestedItem => {
							const nestedLi = document.createElement('li');
							const nestedContent = nestedItem.querySelector('.content');
							
							if (nestedContent) {
								// Convert paragraph divs in nested items
								const nestedParagraphs = nestedContent.querySelectorAll('div[role="paragraph"]');
								nestedParagraphs.forEach(div => {
									const p = document.createElement('p');
									p.innerHTML = div.innerHTML;
									div.replaceWith(p);
								});
								nestedLi.innerHTML = nestedContent.innerHTML;
							}
							
							newNestedList.appendChild(nestedLi);
						});
						
						nestedList.replaceWith(newNestedList);
					});
					
					li.innerHTML = content.innerHTML;
				}
				
				list.appendChild(li);
			});
			
			return list;
		}
	},
	{ 
		selector: 'div[role="listitem"]', 
		element: 'li',
		// Custom handler for list item content
		transform: (el: Element): Element => {
			const content = el.querySelector('.content');
			if (!content) return el;
			
			// Convert any paragraph divs inside content
			const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
			paragraphDivs.forEach(div => {
				const p = document.createElement('p');
				p.innerHTML = div.innerHTML;
				div.replaceWith(p);
			});
			
			return content;
		}
	}
];

interface FootnoteData {
	content: Element | string;
	originalId: string;
	refs: string[];
}

interface FootnoteCollection {
	[footnoteNumber: number]: FootnoteData;
}

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
		// Extract metadata first since we'll need it in multiple places
		const schemaOrgData = MetadataExtractor.extractSchemaOrgData(this.doc);
		const metadata = MetadataExtractor.extract(this.doc, schemaOrgData);

		try {
			// Evaluate styles and sizes on original document
			const mobileStyles = this._evaluateMediaQueries(this.doc);
			
			// Check for small images in original document, excluding lazy-loaded ones
			const smallImages = this.findSmallImages(this.doc);
			
			// Clone document
			const clone = this.doc.cloneNode(true) as Document;
			
			// Apply mobile style to clone
			this.applyMobileStyles(clone, mobileStyles);

			// Find main content
			const mainContent = this.findMainContent(clone);
			if (!mainContent) {
				return {
					content: this.doc.body.innerHTML,
					...metadata
				};
			}

			// Remove small images identified from original document
			this.removeSmallImages(clone, smallImages);
			
			// Perform other destructive operations on the clone
			this.removeHiddenElements(clone);
			this.removeClutter(clone);

			// Clean up the main content
			this.cleanContent(mainContent, metadata);

			return {
				content: mainContent ? mainContent.outerHTML : this.doc.body.innerHTML,
				...metadata
			};
		} catch (error) {
			console.error('Defuddle', 'Error processing document:', error);
			return {
				content: this.doc.body.innerHTML,
				...metadata
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
		const attributeSelector = '[class],[id],[data-testid],[data-qa],[data-cy]';
		const allElements = doc.querySelectorAll(attributeSelector);

		// Process elements for partial matches
		allElements.forEach(el => {
			// Skip if already marked for removal
			if (elementsToRemove.has(el)) {
				return;
			}

			// Get all relevant attributes and combine into a single string
			const attrs = [
				el.className && typeof el.className === 'string' ? el.className : '',
				el.id || '',
				el.getAttribute('data-testid') || '',
				el.getAttribute('data-qa') || '',
				el.getAttribute('data-cy') || ''
			].join(' ').toLowerCase();

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

		const endTime = performance.now();
		this._log('Removed clutter elements:', {
			exactSelectors: exactSelectorCount,
			partialSelectors: partialSelectorCount,
			total: elementsToRemove.size,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	private cleanContent(element: Element, metadata: DefuddleMetadata) {
		// Remove HTML comments
		this.removeHtmlComments(element);
		
		// Handle H1 elements - remove first one and convert others to H2
		this.handleHeadings(element, metadata.title);
		
		// Standardize footnotes and citations
		this.standardizeFootnotes(element);

		// Handle lazy-loaded images
		this.handleLazyImages(element);

		// Convert embedded content to standard formats
		this.standardizeElements(element);
		
		// Strip unwanted attributes
		this.stripUnwantedAttributes(element);

		// Remove empty elements
		this.removeEmptyElements(element);

		// Remove trailing headings
		this.removeTrailingHeadings(element);
	}

	private removeTrailingHeadings(element: Element) {
		let removedCount = 0;

		const hasContentAfter = (el: Element): boolean => {
			// Check if there's any meaningful content after this element
			let nextContent = '';
			let sibling = el.nextSibling;

			// First check direct siblings
			while (sibling) {
				if (sibling.nodeType === Node.TEXT_NODE) {
					nextContent += sibling.textContent || '';
				} else if (sibling.nodeType === Node.ELEMENT_NODE) {
					// If we find an element sibling, check its content
					nextContent += (sibling as Element).textContent || '';
				}
				sibling = sibling.nextSibling;
			}

			// If we found meaningful content at this level, return true
			if (nextContent.trim()) {
				return true;
			}

			// If no content found at this level and we have a parent,
			// check for content after the parent
			const parent = el.parentElement;
			if (parent && parent !== element) {
				return hasContentAfter(parent);
			}

			return false;
		};

		// Process all headings from bottom to top
		const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
			.reverse();

		headings.forEach(heading => {
			if (!hasContentAfter(heading)) {
				heading.remove();
				removedCount++;
			} else {
				// Stop processing once we find a heading with content after it
				return;
			}
		});

		if (removedCount > 0) {
			this._log('Removed trailing headings:', removedCount);
		}
	}

	private handleHeadings(element: Element, title: string) {
		const h1s = element.getElementsByTagName('h1');

		Array.from(h1s).forEach(h1 => {
			const h2 = document.createElement('h2');
			h2.innerHTML = h1.innerHTML;
			// Copy allowed attributes
			Array.from(h1.attributes).forEach(attr => {
				if (ALLOWED_ATTRIBUTES.has(attr.name)) {
					h2.setAttribute(attr.name, attr.value);
				}
			});
			h1.parentNode?.replaceChild(h2, h1);
		});

		// Remove first H2 if it matches title
		const h2s = element.getElementsByTagName('h2');
		if (h2s.length > 0) {
			const firstH2 = h2s[0];
			const firstH2Text = firstH2.textContent?.trim().toLowerCase() || '';
			const normalizedTitle = title.toLowerCase().trim();
			if (normalizedTitle && normalizedTitle === firstH2Text) {
				firstH2.remove();
			}
		}
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

	private createFootnoteItem(
		footnoteNumber: number,
		content: string | Element,
		refs: string[]
	): HTMLLIElement {
		const newItem = document.createElement('li');
		newItem.className = 'footnote';
		newItem.id = `fn:${footnoteNumber}`;

		// Handle content
		if (typeof content === 'string') {
			const paragraph = document.createElement('p');
			paragraph.innerHTML = content;
			newItem.appendChild(paragraph);
		} else {
			// Get all paragraphs from the content
			const paragraphs = Array.from(content.querySelectorAll('p'));
			if (paragraphs.length === 0) {
				// If no paragraphs, wrap content in a paragraph
				const paragraph = document.createElement('p');
				paragraph.innerHTML = content.innerHTML;
				newItem.appendChild(paragraph);
			} else {
				// Copy existing paragraphs
				paragraphs.forEach(p => {
					const newP = document.createElement('p');
					newP.innerHTML = p.innerHTML;
					newItem.appendChild(newP);
				});
			}
		}

		// Add backlink(s) to the last paragraph
		const lastParagraph = newItem.querySelector('p:last-of-type') || newItem;
		refs.forEach((refId, index) => {
			const backlink = document.createElement('a');
			backlink.href = `#${refId}`;
			backlink.title = 'return to article';
			backlink.className = 'footnote-backref';
			backlink.innerHTML = '↩';
			if (index < refs.length - 1) {
				backlink.innerHTML += ' ';
			}
			lastParagraph.appendChild(backlink);
		});

		return newItem;
	}

	private collectFootnotes(element: Element): FootnoteCollection {
		const footnotes: FootnoteCollection = {};
		let footnoteCount = 1;
		const processedIds = new Set<string>(); // Track processed IDs

		// Collect all footnotes and their IDs from footnote lists
		const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
		footnoteLists.forEach(list => {
			// Substack has individual footnote divs with no parent
			if (list.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
				const anchor = list.querySelector('a.footnote-number');
				const content = list.querySelector('.footnote-content');
				if (anchor && content) {
					const id = anchor.id.replace('footnote-', '').toLowerCase();
					if (id && !processedIds.has(id)) {
						footnotes[footnoteCount] = {
							content: content,
							originalId: id,
							refs: []
						};
						processedIds.add(id);
						footnoteCount++;
					}
				}
				return;
			}

			// Common format using OL/UL and LI elements
			const items = list.querySelectorAll('li, div[role="listitem"]');
			items.forEach(li => {
				let id = '';
				let content: Element | null = null;

				// Handle citations with .citations class
				const citationsDiv = li.querySelector('.citations');
				if (citationsDiv?.id?.toLowerCase().startsWith('r')) {
					id = citationsDiv.id.toLowerCase();
					// Look for citation content within the citations div
					const citationContent = citationsDiv.querySelector('.citation-content');
					if (citationContent) {
						content = citationContent;
					}
				} else {
					// Extract ID from various formats
					if (li.id.toLowerCase().startsWith('bib.bib')) {
						id = li.id.replace('bib.bib', '').toLowerCase();
					} else if (li.id.toLowerCase().startsWith('fn:')) {
						id = li.id.replace('fn:', '').toLowerCase();
					} else if (li.id.toLowerCase().startsWith('fn')) {
						id = li.id.replace('fn', '').toLowerCase();
					// Nature.com
					} else if (li.hasAttribute('data-counter')) {
						id = li.getAttribute('data-counter')?.replace(/\.$/, '')?.toLowerCase() || '';
					} else {
						const match = li.id.split('/').pop()?.match(/cite_note-(.+)/);
						id = match ? match[1].toLowerCase() : li.id.toLowerCase();
					}
					content = li;
				}

				if (id && !processedIds.has(id)) {
					footnotes[footnoteCount] = {
						content: content || li,
						originalId: id,
						refs: []
					};
					processedIds.add(id);
					footnoteCount++;
				}
			});
		});

		return footnotes;
	}

	private findOuterFootnoteContainer(el: Element): Element {
		let current: Element | null = el;
		let parent: Element | null = el.parentElement;
		
		// Keep going up until we find an element that's not a span or sup
		while (parent && (
			parent.tagName.toLowerCase() === 'span' || 
			parent.tagName.toLowerCase() === 'sup'
		)) {
			current = parent;
			parent = parent.parentElement;
		}
		
		return current;
	}

	// Every footnote reference should be a sup element with an anchor inside
	// e.g. <sup id="fnref:1"><a href="#fn:1">1</a></sup>
	private createFootnoteReference(footnoteNumber: string, refId: string): HTMLElement {
		const sup = document.createElement('sup');
		sup.id = refId;
		const link = document.createElement('a');
		link.href = `#fn:${footnoteNumber}`;
		link.textContent = footnoteNumber;
		sup.appendChild(link);
		return sup;
	}

	private standardizeFootnotes(element: Element) {
		const footnotes = this.collectFootnotes(element);

		// Standardize inline footnotes using the collected IDs
		const footnoteInlineReferences = element.querySelectorAll(FOOTNOTE_INLINE_REFERENCES);
		
		// Group references by their parent sup element
		const supGroups = new Map<Element, Element[]>();
		
		footnoteInlineReferences.forEach(el => {
			if (!(el instanceof HTMLElement)) return;

			let footnoteId = '';
			let footnoteContent = '';

			// Extract footnote ID based on element type
			// Nature.com
			if (el.matches('a[id^="ref-link"]')) {
				footnoteId = el.textContent?.trim() || '';
			// Science.org
			} else if (el.matches('a[role="doc-biblioref"]')) {
				const xmlRid = el.getAttribute('data-xml-rid');
				if (xmlRid) {
					footnoteId = xmlRid;
				} else {
					const href = el.getAttribute('href');
					if (href?.startsWith('#core-R')) {
						footnoteId = href.replace('#core-', '');
					}
				}
			// Substack
			} else if (el.matches('a.footnote-anchor, span.footnote-hovercard-target a')) {
				const id = el.id?.replace('footnote-anchor-', '') || '';
				if (id) {
					footnoteId = id.toLowerCase();
				}
			// Arxiv
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
			} else if (el.matches('sup.reference')) {
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
			} else if (el.matches('sup[id^="fnref:"]')) {
				footnoteId = el.id.replace('fnref:', '').toLowerCase();
			} else if (el.matches('sup[id^="fnr"]')) {
				footnoteId = el.id.replace('fnr', '').toLowerCase();
			} else if (el.matches('span.footnote-reference')) {
				footnoteId = el.getAttribute('data-footnote-id') || '';
			} else if (el.matches('span.footnote-link')) {
				footnoteId = el.getAttribute('data-footnote-id') || '';
				footnoteContent = el.getAttribute('data-footnote-content') || '';
			} else if (el.matches('a.citation')) {
				footnoteId = el.textContent?.trim() || '';
				footnoteContent = el.getAttribute('href') || '';
			} else if (el.matches('a[id^="fnref"]')) {
				footnoteId = el.id.replace('fnref', '').toLowerCase();
			} else {
				// Other citation types
				const href = el.getAttribute('href');
				if (href) {
					const id = href.replace(/^[#]/, '');
					footnoteId = id.toLowerCase();
				}
			}

			if (footnoteId) {
				// Find the footnote number by matching the original ID
				const footnoteEntry = Object.entries(footnotes).find(
					([_, data]) => data.originalId === footnoteId.toLowerCase()
				);

				if (footnoteEntry) {
					const [footnoteNumber, footnoteData] = footnoteEntry;
					
					// Create footnote reference ID
					const refId = footnoteData.refs.length > 0 ? 
						`fnref:${footnoteNumber}-${footnoteData.refs.length + 1}` : 
						`fnref:${footnoteNumber}`;
					
					footnoteData.refs.push(refId);

					// Find the outermost container (span or sup)
					const container = this.findOuterFootnoteContainer(el);
					
					// If container is a sup, group references
					if (container.tagName.toLowerCase() === 'sup') {
						if (!supGroups.has(container)) {
							supGroups.set(container, []);
						}
						const group = supGroups.get(container)!;
						group.push(this.createFootnoteReference(footnoteNumber, refId));
					} else {
						// Replace the container directly
						container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
					}
				}
			}
		});

		// Handle grouped references
		supGroups.forEach((references, container) => {
			if (references.length > 0) {
				// Create a document fragment to hold all the references
				const fragment = document.createDocumentFragment();
				
				// Add each reference as its own sup element
				references.forEach((ref, index) => {
					const link = ref.querySelector('a');
					if (link) {
						const sup = document.createElement('sup');
						sup.id = ref.id;
						sup.appendChild(link.cloneNode(true));
						fragment.appendChild(sup);
					}
				});
				
				container.replaceWith(fragment);
			}
		});

		// Create the standardized footnote list
		const newList = document.createElement('div');
		newList.className = 'footnotes';
		const orderedList = document.createElement('ol');

		// Create footnote items in order
		Object.entries(footnotes).forEach(([number, data]) => {
			const newItem = this.createFootnoteItem(
				parseInt(number),
				data.content,
				data.refs
			);
			orderedList.appendChild(newItem);
		});

		// Remove original footnote lists
		const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
		footnoteLists.forEach(list => list.remove());

		// If we have any footnotes, add the new list to the document
		if (orderedList.children.length > 0) {
			newList.appendChild(orderedList);
			element.appendChild(newList);
		}
	}

	private handleLazyImages(element: Element) {
		let processedCount = 0;
		const lazyImages = element.querySelectorAll('img[data-src], img[data-srcset]');

		lazyImages.forEach(img => {
			if (!(img instanceof HTMLImageElement)) return;

			// Handle data-src
			const dataSrc = img.getAttribute('data-src');
			if (dataSrc && !img.src) {
				img.src = dataSrc;
				processedCount++;
			}

			// Handle data-srcset
			const dataSrcset = img.getAttribute('data-srcset');
			if (dataSrcset && !img.srcset) {
				img.srcset = dataSrcset;
				processedCount++;
			}

			// Remove lazy loading related classes and attributes
			img.classList.remove('lazy', 'lazyload');
			img.removeAttribute('data-ll-status');
			img.removeAttribute('data-src');
			img.removeAttribute('data-srcset');
		});

		this._log('Processed lazy images:', processedCount);
	}

	private standardizeElements(element: Element) {
		let processedCount = 0;

		// Convert elements based on standardization rules
		ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
			const elements = element.querySelectorAll(rule.selector);
			elements.forEach(el => {
				if (rule.transform) {
					// If there's a transform function, use it to create the new element
					const transformed = rule.transform(el);
					el.replaceWith(transformed);
					processedCount++;
				}
			});
		});

		// Convert lite-youtube elements
		const liteYoutubeElements = element.querySelectorAll('lite-youtube');
		liteYoutubeElements.forEach(el => {
			const videoId = el.getAttribute('videoid');
			if (!videoId) return;

			const iframe = document.createElement('iframe');
			iframe.width = '560';
			iframe.height = '315';
			iframe.src = `https://www.youtube.com/embed/${videoId}`;
			iframe.title = el.getAttribute('videotitle') || 'YouTube video player';
			iframe.frameBorder = '0';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
			iframe.setAttribute('allowfullscreen', '');

			el.replaceWith(iframe);
			processedCount++;
		});

		// Add future embed conversions (Twitter, Instagram, etc.)

		this._log('Converted embedded elements:', processedCount);
	}

	// Find small IMG and SVG elements
	private findSmallImages(doc: Document): Set<string> {
		const MIN_DIMENSION = 33;
		const smallImages = new Set<string>();
		const transformRegex = /scale\(([\d.]+)\)/;
		const startTime = performance.now();
		let processedCount = 0;

		// 1. Read phase - Gather all elements in a single pass
		const elements = [
			...Array.from(doc.getElementsByTagName('img')),
			...Array.from(doc.getElementsByTagName('svg'))
		].filter(element => {
			// Skip lazy-loaded images that haven't been processed yet
			if (element instanceof HTMLImageElement) {
				const isLazy = element.classList.contains('lazy') || 
					element.classList.contains('lazyload') ||
					element.hasAttribute('data-src') ||
					element.hasAttribute('data-srcset');
				return !isLazy;
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
			naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : 0,
			naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : 0,
			attrWidth: parseInt(element.getAttribute('width') || '0'),
			attrHeight: parseInt(element.getAttribute('height') || '0')
		}));

		// 3. Batch compute styles - Process in chunks to avoid long tasks
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
			// For lazy-loaded images, use data-src as identifier if available
			const dataSrc = element.getAttribute('data-src');
			if (dataSrc) return `src:${dataSrc}`;
			
			const src = element.src || '';
			const srcset = element.srcset || '';
			const dataSrcset = element.getAttribute('data-srcset');
			
			if (src) return `src:${src}`;
			if (srcset) return `srcset:${srcset}`;
			if (dataSrcset) return `srcset:${dataSrcset}`;
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