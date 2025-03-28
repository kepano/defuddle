import { MetadataExtractor } from './metadata';
import { DefuddleOptions, DefuddleResponse, DefuddleMetadata } from './types';
import { ExtractorRegistry } from './extractor-registry';
import { 
	HIDDEN_ELEMENT_SELECTORS,
	MOBILE_WIDTH,
	BLOCK_ELEMENTS,
	PRESERVE_ELEMENTS,
	INLINE_ELEMENTS,
	ALLOWED_ATTRIBUTES,
	ALLOWED_ATTRIBUTES_DEBUG,
	EXACT_SELECTORS,
	PARTIAL_SELECTORS,
	FOOTNOTE_LIST_SELECTORS,
	FOOTNOTE_INLINE_REFERENCES,
	ENTRY_POINT_ELEMENTS,
	ALLOWED_EMPTY_ELEMENTS,
	TEST_ATTRIBUTES
} from './constants';

import { mathRules } from './elements/math.full';
import { codeBlockRules } from './elements/code';
import { headingRules } from './elements/headings';

// Element standardization rules
// Maps selectors to their target HTML element name
interface StandardizationRule {
	selector: string;
	element: string;
	transform?: (el: Element) => Element;
}

const ELEMENT_STANDARDIZATION_RULES: StandardizationRule[] = [
	...mathRules,
	...codeBlockRules,
	...headingRules,

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
		const startTime = Date.now();

		// Extract metadata first since we'll need it in multiple places
		const schemaOrgData = MetadataExtractor.extractSchemaOrgData(this.doc);
		const metadata = MetadataExtractor.extract(this.doc, schemaOrgData);

		try {
			// Try to use a specific extractor first
			const extractor = ExtractorRegistry.findExtractor(this.doc, this.doc.URL, schemaOrgData);
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
			
			// Check for small images in original document, excluding lazy-loaded ones
			const smallImages = this.findSmallImages(this.doc);
			
			// Clone document
			const clone = this.doc.cloneNode(true) as Document;
			
			// Apply mobile style to clone
			this.applyMobileStyles(clone, mobileStyles);

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

			// Remove small images identified from original document
			this.removeSmallImages(clone, smallImages);

			// Perform other destructive operations on the clone
			this.removeHiddenElements(clone);
			this.removeClutter(clone);

			// Clean up the main content
			this.cleanContent(mainContent, metadata);

			const content = mainContent ? mainContent.outerHTML : this.doc.body.innerHTML;
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
		const tempDiv = document.createElement('div');
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
		const treeWalker = doc.createTreeWalker(
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
			const styles = batch.map(element => {
				try {
					return element.ownerDocument.defaultView?.getComputedStyle(element);
				} catch (e) {
					return null;
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
		elementsToRemove.forEach(el => el.remove());

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

	private flattenDivs(element: Element) {
		let processedCount = 0;
		const startTime = Date.now();

		// Process in batches to maintain performance
		let keepProcessing = true;

		const shouldPreserveElement = (el: Element): boolean => {
			const tagName = el.tagName.toLowerCase();
			
			// Check if element should be preserved
			if (PRESERVE_ELEMENTS.has(tagName)) return true;
			
			// Check for semantic roles
			const role = el.getAttribute('role');
			if (role && ['article', 'main', 'navigation', 'banner', 'contentinfo'].includes(role)) {
				return true;
			}
			
			// Check for semantic classes
			const className = el.className;
			if (typeof className === 'string' && className.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)) {
				return true;
			}

			// Check if div contains mixed content types that should be preserved
			if (tagName === 'div') {
				const children = Array.from(el.children);
				const hasPreservedElements = children.some(child => 
					PRESERVE_ELEMENTS.has(child.tagName.toLowerCase()) ||
					child.getAttribute('role') === 'article' ||
					(child.className && typeof child.className === 'string' && 
						child.className.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/))
				);
				if (hasPreservedElements) return true;
			}
			
			return false;
		};

		const isWrapperDiv = (div: Element): boolean => {
			// Check if it's just empty space
			if (!div.textContent?.trim()) return true;

			// Check if it only contains other divs or block elements
			const children = Array.from(div.children);
			if (children.length === 0) return true;
			
			// Check if all children are block elements
			const allBlockElements = children.every(child => {
				const tag = child.tagName.toLowerCase();
				return tag === 'div' || tag === 'p' || tag === 'h1' || tag === 'h2' || 
					   tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' ||
					   tag === 'ul' || tag === 'ol' || tag === 'pre' || tag === 'blockquote' ||
					   tag === 'figure';
			});
			if (allBlockElements) return true;

			// Check for common wrapper patterns
			const className = div.className.toLowerCase();
			const isWrapper = /(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(className);
			if (isWrapper) return true;

			// Check if it has excessive whitespace or empty text nodes
			const textNodes = Array.from(div.childNodes).filter(node => 
				node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
			);
			if (textNodes.length === 0) return true;

			// Check if it's a div that only contains block elements
			const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
				const tag = child.tagName.toLowerCase();
				return INLINE_ELEMENTS.has(tag);
			});
			if (hasOnlyBlockElements) return true;

			return false;
		};

		// Function to process a single div
		const processDiv = (div: Element): boolean => {
			// Skip processing if div has been removed or should be preserved
			if (!div.isConnected || shouldPreserveElement(div)) return false;

			// Case 1: Empty div or div with only whitespace
			if (!div.hasChildNodes() || !div.textContent?.trim()) {
				div.remove();
				processedCount++;
				return true;
			}

			// Case 2: Top-level div - be more aggressive
			if (div.parentElement === element) {
				const children = Array.from(div.children);
				const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
					const tag = child.tagName.toLowerCase();
					return INLINE_ELEMENTS.has(tag);
				});

				if (hasOnlyBlockElements) {
					const fragment = this.doc.createDocumentFragment();
					while (div.firstChild) {
						fragment.appendChild(div.firstChild);
					}
					div.replaceWith(fragment);
					processedCount++;
					return true;
				}
			}

			// Case 3: Wrapper div - merge up aggressively
			if (isWrapperDiv(div)) {
				// Special case: if div only contains block elements, merge them up
				const children = Array.from(div.children);
				const onlyBlockElements = !children.some(child => {
					const tag = child.tagName.toLowerCase();
					return INLINE_ELEMENTS.has(tag);
				});
				
				if (onlyBlockElements) {
					const fragment = this.doc.createDocumentFragment();
					while (div.firstChild) {
						fragment.appendChild(div.firstChild);
					}
					div.replaceWith(fragment);
					processedCount++;
					return true;
				}

				// Otherwise handle as normal wrapper
				const fragment = this.doc.createDocumentFragment();
				while (div.firstChild) {
					fragment.appendChild(div.firstChild);
				}
				div.replaceWith(fragment);
				processedCount++;
				return true;
			}

			// Case 4: Div only contains text content - convert to paragraph
			if (!div.children.length && div.textContent?.trim()) {
				const p = this.doc.createElement('p');
				p.textContent = div.textContent;
				div.replaceWith(p);
				processedCount++;
				return true;
			}

			// Case 5: Div has single child
			if (div.children.length === 1) {
				const child = div.firstElementChild!;
				const childTag = child.tagName.toLowerCase();
				
				// Don't unwrap if child is inline or should be preserved
				if (!INLINE_ELEMENTS.has(childTag) && !shouldPreserveElement(child)) {
					div.replaceWith(child);
					processedCount++;
					return true;
				}
			}

			// Case 6: Deeply nested div - merge up
			let nestingDepth = 0;
			let parent = div.parentElement;
			while (parent) {
				if (parent.tagName.toLowerCase() === 'div') {
					nestingDepth++;
				}
				parent = parent.parentElement;
			}

			if (nestingDepth > 0) { // Changed from > 1 to > 0 to be more aggressive
				const fragment = this.doc.createDocumentFragment();
				while (div.firstChild) {
					fragment.appendChild(div.firstChild);
				}
				div.replaceWith(fragment);
				processedCount++;
				return true;
			}

			return false;
		};

		// First pass: Process top-level divs
		const processTopLevelDivs = () => {
			const topDivs = Array.from(element.children).filter(
				el => el.tagName.toLowerCase() === 'div'
			);
			
			let modified = false;
			topDivs.forEach(div => {
				if (processDiv(div)) {
					modified = true;
				}
			});
			return modified;
		};

		// Second pass: Process remaining divs from deepest to shallowest
		const processRemainingDivs = () => {
			const allDivs = Array.from(element.getElementsByTagName('div'))
				.sort((a, b) => {
					// Count nesting depth
					const getDepth = (el: Element): number => {
						let depth = 0;
						let parent = el.parentElement;
						while (parent) {
							if (parent.tagName.toLowerCase() === 'div') depth++;
							parent = parent.parentElement;
						}
						return depth;
					};
					return getDepth(b) - getDepth(a); // Process deepest first
				});

			let modified = false;
			allDivs.forEach(div => {
				if (processDiv(div)) {
					modified = true;
				}
			});
			return modified;
		};

		// Final cleanup pass - aggressively flatten remaining divs
		const finalCleanup = () => {
			const remainingDivs = Array.from(element.getElementsByTagName('div'));
			let modified = false;
			
			remainingDivs.forEach(div => {
				// Check if div only contains paragraphs
				const children = Array.from(div.children);
				const onlyParagraphs = children.every(child => child.tagName.toLowerCase() === 'p');
				
				if (onlyParagraphs || (!shouldPreserveElement(div) && isWrapperDiv(div))) {
					const fragment = this.doc.createDocumentFragment();
					while (div.firstChild) {
						fragment.appendChild(div.firstChild);
					}
					div.replaceWith(fragment);
					processedCount++;
					modified = true;
				}
			});
			return modified;
		};

		// Execute all passes until no more changes
		do {
				keepProcessing = false;
				if (processTopLevelDivs()) keepProcessing = true;
				if (processRemainingDivs()) keepProcessing = true;
				if (finalCleanup()) keepProcessing = true;
			} while (keepProcessing);

		const endTime = Date.now();
		this._log('Flattened divs:', {
			count: processedCount,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	private cleanContent(element: Element, metadata: DefuddleMetadata) {
		this.standardizeSpaces(element);

		// Remove HTML comments
		this.removeHtmlComments(element);
		
		// Handle H1 elements - remove first one and convert others to H2
		this.standardizeHeadings(element, metadata.title);
		
		// Standardize footnotes and citations
		this.standardizeFootnotes(element);

		// Handle lazy-loaded images
		this.handleLazyImages(element);

		// Convert embedded content to standard formats
		this.standardizeElements(element);

		// If not debug mode, do the full cleanup
		if (!this.debug) {
			// First pass of div flattening
			this.flattenDivs(element);
			
			// Strip unwanted attributes
			this.stripUnwantedAttributes(element);

			// Remove empty elements
			this.removeEmptyElements(element);

			// Remove trailing headings
			this.removeTrailingHeadings(element);

			// Final pass of div flattening after cleanup operations
			this.flattenDivs(element);

			// Standardize consecutive br elements
			this.stripExtraBrElements(element);

			// Clean up empty lines
			this.removeEmptyLines(element);
		} else {
			// In debug mode, still do basic cleanup but preserve structure
			this.stripUnwantedAttributes(element);
			this.removeEmptyElements(element);
			this.removeTrailingHeadings(element);
			this.stripExtraBrElements(element);
			this._log('Debug mode: Skipping div flattening to preserve structure');
		}
	}

	private standardizeSpaces(element: Element) {
		const processNode = (node: Node) => {
			// Skip pre and code elements
			if (node instanceof Element) {
				const tag = node.tagName.toLowerCase();
				if (tag === 'pre' || tag === 'code') {
					return;
				}
			}

			// Process text nodes
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent || '';
				// Replace &nbsp; with regular spaces, except when it's a single &nbsp; between words
				const newText = text.replace(/\xA0+/g, (match) => {
					// If it's a single &nbsp; between word characters, preserve it
					if (match.length === 1) {
						const prev = node.previousSibling?.textContent?.slice(-1);
						const next = node.nextSibling?.textContent?.charAt(0);
						if (prev?.match(/\w/) && next?.match(/\w/)) {
							return '\xA0';
						}
					}
					return ' '.repeat(match.length);
				});
				
				if (newText !== text) {
					node.textContent = newText;
				}
			}

			// Process children recursively
			if (node.hasChildNodes()) {
				Array.from(node.childNodes).forEach(processNode);
			}
		};

		processNode(element);
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

	private standardizeHeadings(element: Element, title: string) {
		const normalizeText = (text: string): string => {
			return text
				.replace(/\u00A0/g, ' ') // Convert non-breaking spaces to regular spaces
				.replace(/\s+/g, ' ') // Normalize all whitespace to single spaces
				.trim()
				.toLowerCase();
		};

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
			const firstH2Text = normalizeText(firstH2.textContent || '');
			const normalizedTitle = normalizeText(title);
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
			const tag = el.tagName.toLowerCase();
			
			attributes.forEach(attr => {
				const attrName = attr.name.toLowerCase();
				const attrValue = attr.value;

				// Special cases for preserving specific attributes
				if (
					// Preserve footnote IDs
					(attrName === 'id' && (
						attrValue.startsWith('fnref:') || // Footnote reference
						attrValue.startsWith('fn:') || // Footnote content
						attrValue === 'footnotes' // Footnotes container
					)) ||
					// Preserve code block language classes and footnote backref class
					(attrName === 'class' && (
						(tag === 'code' && attrValue.startsWith('language-')) ||
						attrValue === 'footnote-backref'
					))
				) {
					return;
				}

				// In debug mode, allow debug attributes and data- attributes
				if (this.debug) {
					if (!ALLOWED_ATTRIBUTES.has(attrName) && 
						!ALLOWED_ATTRIBUTES_DEBUG.has(attrName) && 
						!attrName.startsWith('data-')) {
						el.removeAttribute(attr.name);
						attributeCount++;
					}
				} else {
					// In normal mode, only allow standard attributes
					if (!ALLOWED_ATTRIBUTES.has(attrName)) {
						el.removeAttribute(attr.name);
						attributeCount++;
					}
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

				// Special case: Check for divs that only contain spans with commas
				if (el.tagName.toLowerCase() === 'div') {
					const children = Array.from(el.children);
					const hasOnlyCommaSpans = children.length > 0 && children.every(child => {
						if (child.tagName.toLowerCase() !== 'span') return false;
						const content = child.textContent?.trim() || '';
						return content === ',' || content === '' || content === ' ';
					});
					if (hasOnlyCommaSpans) return true;
				}

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

	private stripExtraBrElements(element: Element) {
		let processedCount = 0;
		const startTime = Date.now();

		// Use TreeWalker to find text nodes and br elements
		const treeWalker = this.doc.createTreeWalker(
			element,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode: (node: Element) => {
					return node.tagName.toLowerCase() === 'br' ? 
						NodeFilter.FILTER_ACCEPT : 
						NodeFilter.FILTER_SKIP;
				}
			}
		);

		// Keep track of consecutive br elements
		let consecutiveBrs: Element[] = [];
		let currentNode: Element | null;

		// Helper to process collected br elements
		const processBrs = () => {
			if (consecutiveBrs.length > 2) {
				// Keep only two br elements
				for (let i = 2; i < consecutiveBrs.length; i++) {
					consecutiveBrs[i].remove();
					processedCount++;
				}
			}
			consecutiveBrs = [];
		};

		// Find all br elements
		while (currentNode = treeWalker.nextNode() as Element) {
			// Check if this br is consecutive with previous ones
			let isConsecutive = false;
			if (consecutiveBrs.length > 0) {
				const lastBr = consecutiveBrs[consecutiveBrs.length - 1];
				let node: Node | null = currentNode.previousSibling;
				
				// Skip whitespace text nodes
				while (node && node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
					node = node.previousSibling;
				}
				
				if (node === lastBr) {
					isConsecutive = true;
				}
			}

			if (isConsecutive) {
				consecutiveBrs.push(currentNode);
			} else {
				// Process any previously collected brs before starting new group
				processBrs();
				consecutiveBrs = [currentNode];
			}
		}

		// Process any remaining br elements
		processBrs();

		const endTime = Date.now();
		this._log('Standardized br elements:', {
			removed: processedCount,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	private removeEmptyLines(element: Element) {
		let removedCount = 0;
		const startTime = Date.now();

		// First pass: remove empty text nodes
		const removeEmptyTextNodes = (node: Node) => {
			// Skip if inside pre or code
			if (node instanceof Element) {
				const tag = node.tagName.toLowerCase();
				if (tag === 'pre' || tag === 'code') {
					return;
				}
			}

			// Process children first (depth-first)
			const children = Array.from(node.childNodes);
			children.forEach(removeEmptyTextNodes);

			// Then handle this node
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent || '';
				// If it's completely empty or just special characters/whitespace, remove it
				if (!text || text.match(/^[\u200C\u200B\u200D\u200E\u200F\uFEFF\xA0\s]*$/)) {
					node.parentNode?.removeChild(node);
					removedCount++;
				} else {
					// Clean up the text content while preserving important spaces
					const newText = text
						.replace(/\n{3,}/g, '\n\n') // More than 2 newlines -> 2 newlines
						.replace(/^[\n\r\t]+/, '') // Remove leading newlines/tabs (preserve spaces)
						.replace(/[\n\r\t]+$/, '') // Remove trailing newlines/tabs (preserve spaces)
						.replace(/[ \t]*\n[ \t]*/g, '\n') // Remove spaces around newlines
						.replace(/[ \t]{3,}/g, ' ') // 3+ spaces -> 1 space
						.replace(/^[ ]+$/, ' ') // Multiple spaces between elements -> single space
						.replace(/\s+([,.!?:;])/g, '$1') // Remove spaces before punctuation
						// Clean up zero-width characters and multiple non-breaking spaces
						.replace(/[\u200C\u200B\u200D\u200E\u200F\uFEFF]+/g, '')
						.replace(/(?:\xA0){2,}/g, '\xA0'); // Multiple &nbsp; -> single &nbsp;

					if (newText !== text) {
						node.textContent = newText;
						removedCount += text.length - newText.length;
					}
				}
			}
		};

		// Second pass: clean up empty elements and normalize spacing
		const cleanupEmptyElements = (node: Node) => {
			if (!(node instanceof Element)) return;

			// Skip pre and code elements
			const tag = node.tagName.toLowerCase();
			if (tag === 'pre' || tag === 'code') {
				return;
			}

			// Process children first (depth-first)
			Array.from(node.children).forEach(cleanupEmptyElements);

			// Then normalize this element's whitespace
			node.normalize(); // Combine adjacent text nodes

			// Special handling for block elements
			const isBlockElement = getComputedStyle(node).display === 'block';
			
			// Only remove empty text nodes at the start and end if they contain just newlines/tabs
			// For block elements, also remove spaces
			const startPattern = isBlockElement ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;
			const endPattern = isBlockElement ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;
			
			while (node.firstChild && 
				   node.firstChild.nodeType === Node.TEXT_NODE && 
				   (node.firstChild.textContent || '').match(startPattern)) {
				node.removeChild(node.firstChild);
				removedCount++;
			}
			
			while (node.lastChild && 
				   node.lastChild.nodeType === Node.TEXT_NODE && 
				   (node.lastChild.textContent || '').match(endPattern)) {
				node.removeChild(node.lastChild);
				removedCount++;
			}

			// Ensure there's a space between inline elements if needed
			if (!isBlockElement) {
				const children = Array.from(node.childNodes);
				for (let i = 0; i < children.length - 1; i++) {
					const current = children[i];
					const next = children[i + 1];

					// Only add space between elements or between element and text
					if (current instanceof Element || next instanceof Element) {
						// Don't add space if next content starts with punctuation
						const nextContent = next.textContent || '';
						const currentContent = current.textContent || '';
						
						if (!nextContent.match(/^[,.!?:;]/) && 
							!currentContent.match(/[,.!?:;]$/)) {
							// Check if there's already a space
							const hasSpace = (current.nodeType === Node.TEXT_NODE && 
											(current.textContent || '').endsWith(' ')) ||
											(next.nodeType === Node.TEXT_NODE && 
											(next.textContent || '').startsWith(' '));
							
							if (!hasSpace) {
								const space = document.createTextNode(' ');
								node.insertBefore(space, next);
							}
						}
					}
				}
			}
		};

		// Run both passes
		removeEmptyTextNodes(element);
		cleanupEmptyElements(element);

		const endTime = Date.now();
		this._log('Removed empty lines:', {
			charactersRemoved: removedCount,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
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
		newList.id = 'footnotes';
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

		this._log('Converted embedded elements:', processedCount);
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
			if (element instanceof HTMLImageElement) {
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