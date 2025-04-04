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
	ENTRY_POINT_ELEMENTS,
	ALLOWED_EMPTY_ELEMENTS,
	TEST_ATTRIBUTES,
	NODE_TYPE
} from './constants';

import { mathRules } from './elements/math.full';
import { codeBlockRules } from './elements/code';
import { standardizeFootnotes } from './elements/footnotes';
import { headingRules } from './elements/headings';
import { ContentScorer, ContentScore } from './scoring';

// Element standardization rules
// Maps selectors to their target HTML element name
interface StandardizationRule {
	selector: string;
	element: string;
	transform?: (el: Element, doc: Document) => Element;
}

const ELEMENT_STANDARDIZATION_RULES: StandardizationRule[] = [
	...mathRules,
	...codeBlockRules,
	...headingRules,

	// Convert divs with paragraph role to actual paragraphs
	{ 
		selector: 'div[data-testid^="paragraph"], div[role="paragraph"]', 
		element: 'p',
		transform: (el: Element, doc: Document): Element => {
			const p = doc.createElement('p');
			
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
		transform: (el: Element, doc: Document): Element => {
			// First determine if this is an ordered list
			const firstItem = el.querySelector('div[role="listitem"] .label');
			const label = firstItem?.textContent?.trim() || '';
			const isOrdered = label.match(/^\d+\)/);
			
			// Create the appropriate list type
			const list = doc.createElement(isOrdered ? 'ol' : 'ul');
			
			// Process each list item
			const items = el.querySelectorAll('div[role="listitem"]');
			items.forEach(item => {
				const li = doc.createElement('li');
				const content = item.querySelector('.content');
				
				if (content) {
					// Convert any paragraph divs inside content
					const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
					paragraphDivs.forEach(div => {
						const p = doc.createElement('p');
						p.innerHTML = div.innerHTML;
						div.replaceWith(p);
					});
					
					// Convert any nested lists recursively
					const nestedLists = content.querySelectorAll('div[role="list"]');
					nestedLists.forEach(nestedList => {
						const firstNestedItem = nestedList.querySelector('div[role="listitem"] .label');
						const nestedLabel = firstNestedItem?.textContent?.trim() || '';
						const isNestedOrdered = nestedLabel.match(/^\d+\)/);
						
						const newNestedList = doc.createElement(isNestedOrdered ? 'ol' : 'ul');
						
						// Process nested items
						const nestedItems = nestedList.querySelectorAll('div[role="listitem"]');
						nestedItems.forEach(nestedItem => {
							const nestedLi = doc.createElement('li');
							const nestedContent = nestedItem.querySelector('.content');
							
							if (nestedContent) {
								// Convert paragraph divs in nested items
								const nestedParagraphs = nestedContent.querySelectorAll('div[role="paragraph"]');
								nestedParagraphs.forEach(div => {
									const p = doc.createElement('p');
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
		transform: (el: Element, doc: Document): Element => {
			const content = el.querySelector('.content');
			if (!content) return el;
			
			// Convert any paragraph divs inside content
			const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
			paragraphDivs.forEach(div => {
				const p = doc.createElement('p');
				p.innerHTML = div.innerHTML;
				div.replaceWith(p);
			});
			
			return content;
		}
	}
];

interface StyleChange {
	selector: string;
	styles: string;
}

// Type guard
function isElement(node: Node): node is Element {
	return node.nodeType === NODE_TYPE.ELEMENT_NODE;
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

	private getWindow(doc: Document): Window | null {
		// First try defaultView
		if (doc.defaultView) {
			return doc.defaultView;
		}
		
		// Then try ownerWindow
		if ((doc as any).ownerWindow) {
			return (doc as any).ownerWindow;
		}
		
		// Finally try to get window from document
		if ((doc as any).window) {
			return (doc as any).window;
		}
		
		return null;
	}

	private getComputedStyle(element: Element): CSSStyleDeclaration | null {
		const win = this.getWindow(element.ownerDocument);
		if (!win) return null;
		return win.getComputedStyle(element);
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

		// Helper function to check if an element directly contains inline content
		// This helps prevent unwrapping divs that visually act as paragraphs.
		function hasDirectInlineContent(el: Element): boolean {
			for (const child of el.childNodes) {
				// Check for non-empty text nodes
				if (child.nodeType === NODE_TYPE.TEXT_NODE && child.textContent?.trim()) {
					return true;
				}
				// Check for element nodes that are considered inline
				if (child.nodeType === NODE_TYPE.ELEMENT_NODE && INLINE_ELEMENTS.has(child.nodeName.toLowerCase())) {
					return true;
				}
			}
			return false;
		}

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
			// If it directly contains inline content, it's NOT a wrapper
			if (hasDirectInlineContent(div)) {
				return false;
			}

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
				node.nodeType === NODE_TYPE.TEXT_NODE && node.textContent?.trim() // TEXT_NODE
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

			// Case 4: Div only contains text and/or inline elements - convert to paragraph
			const childNodes = Array.from(div.childNodes);
			const hasOnlyInlineOrText = childNodes.length > 0 && childNodes.every(child =>
				(child.nodeType === NODE_TYPE.TEXT_NODE) ||
				(child.nodeType === NODE_TYPE.ELEMENT_NODE && INLINE_ELEMENTS.has(child.nodeName.toLowerCase()))
			);

			if (hasOnlyInlineOrText && div.textContent?.trim()) { // Ensure there's actual content
				const p = this.doc.createElement('p');
				// Move all children (including inline tags like <font>) to the new <p>
				while (div.firstChild) {
					p.appendChild(div.firstChild);
				}
				div.replaceWith(p);
				processedCount++;
				return true;
			}

			// Case 5: Div has single child - unwrap only if child is block-level
			if (div.children.length === 1) {
				const child = div.firstElementChild!;
				const childTag = child.tagName.toLowerCase();
				
				// Only unwrap if the single child is a block element and not preserved
				if (BLOCK_ELEMENTS.includes(childTag) && !shouldPreserveElement(child)) {
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

			// Only unwrap if nested AND does not contain direct inline content
			if (nestingDepth > 0 && !hasDirectInlineContent(div)) {
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
				// Only perform final cleanup/unwrap if the div is still connected,
				// not preserved, and does not contain direct inline content.
				if (div.isConnected && !shouldPreserveElement(div) && !hasDirectInlineContent(div)) {
					const children = Array.from(div.children);
					const onlyParagraphs = children.length > 0 && children.every(child => child.tagName.toLowerCase() === 'p');

					// Unwrap if it only contains paragraphs OR is identified as a wrapper
					if (onlyParagraphs || isWrapperDiv(div)) {
						const fragment = this.doc.createDocumentFragment();
						while (div.firstChild) {
							fragment.appendChild(div.firstChild);
						}
						div.replaceWith(fragment);
						processedCount++;
						modified = true;
					}
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
		standardizeFootnotes(element);

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
			if (node.nodeType === NODE_TYPE.ELEMENT_NODE) {
				const tag = (node as Element).tagName.toLowerCase();
				if (tag === 'pre' || tag === 'code') {
					return;
				}
			}

			// Process text nodes
			if (node.nodeType === NODE_TYPE.TEXT_NODE) {
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
				if (sibling.nodeType === NODE_TYPE.TEXT_NODE) { // TEXT_NODE
					nextContent += sibling.textContent || '';
				} else if (sibling.nodeType === NODE_TYPE.ELEMENT_NODE) { // ELEMENT_NODE
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
			const h2 = this.doc.createElement('h2');
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
		let removedCount = 0;

		// Get all elements and check their child nodes
		const allElements = Array.from(element.getElementsByTagName('*'));
		
		// Process each element's child nodes
		allElements.forEach(el => {
			const childNodes = Array.from(el.childNodes);
			childNodes.forEach(node => {
				if (node.nodeType === 8) { // 8 is the node type for comments
					node.remove();
					removedCount++;
				}
			});
		});

		this._log('Removed HTML comments:', removedCount);
	}

	private stripUnwantedAttributes(element: Element) {
		let attributeCount = 0;

		const processElement = (el: Element) => {
			// Skip SVG elements - preserve all their attributes
			if (el.tagName.toLowerCase() === 'svg' || el.namespaceURI === 'http://www.w3.org/2000/svg') {
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
						if (node.nodeType === NODE_TYPE.TEXT_NODE) { // TEXT_NODE
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

		this._log('Removed empty elements:', removedCount, 'iterations:', iterations);
	}

	private stripExtraBrElements(element: Element) {
		let processedCount = 0;
		const startTime = Date.now();

		// Get all br elements directly
		const brElements = Array.from(element.getElementsByTagName('br'));

		// Keep track of consecutive br elements
		let consecutiveBrs: Element[] = [];

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

		// Process all br elements
		brElements.forEach(currentNode => {
			// Check if this br is consecutive with previous ones
			let isConsecutive = false;
			if (consecutiveBrs.length > 0) {
				const lastBr = consecutiveBrs[consecutiveBrs.length - 1];
				let node: Node | null = currentNode.previousSibling;
				
				// Skip whitespace text nodes
				while (node && node.nodeType === NODE_TYPE.TEXT_NODE && !node.textContent?.trim()) {
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
		});

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
			if (node.nodeType === NODE_TYPE.ELEMENT_NODE) {
				const tag = (node as Element).tagName.toLowerCase();
				if (tag === 'pre' || tag === 'code') {
					return;
				}
			}

			// Process children first (depth-first)
			const children = Array.from(node.childNodes);
			children.forEach(removeEmptyTextNodes);

			// Then handle this node
			if (node.nodeType === NODE_TYPE.TEXT_NODE) {
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
			if (!isElement(node)) return;

			// Skip pre and code elements
			const tag = node.tagName.toLowerCase();
			if (tag === 'pre' || tag === 'code') {
				return;
			}

			// Process children first (depth-first)
			Array.from(node.childNodes)
				.filter(isElement)
				.forEach(cleanupEmptyElements);

			// Then normalize this element's whitespace
			node.normalize(); // Combine adjacent text nodes

			// Special handling for block elements
			const isBlockElement = this.getComputedStyle(node)?.display === 'block';
			
			// Only remove empty text nodes at the start and end if they contain just newlines/tabs
			// For block elements, also remove spaces
			const startPattern = isBlockElement ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;
			const endPattern = isBlockElement ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;
			
			while (node.firstChild && 
				   node.firstChild.nodeType === NODE_TYPE.TEXT_NODE && 
				   (node.firstChild.textContent || '').match(startPattern)) {
				node.removeChild(node.firstChild);
				removedCount++;
			}
			
			while (node.lastChild && 
				   node.lastChild.nodeType === NODE_TYPE.TEXT_NODE && 
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
					if (isElement(current) || isElement(next)) {
						// Don't add space if next content starts with punctuation
						const nextContent = next.textContent || '';
						const currentContent = current.textContent || '';
						
						if (!nextContent.match(/^[,.!?:;]/) && 
							!currentContent.match(/[,.!?:;]$/)) {
							// Check if there's already a space
							const hasSpace = (current.nodeType === NODE_TYPE.TEXT_NODE && 
											(current.textContent || '').endsWith(' ')) ||
											(next.nodeType === NODE_TYPE.TEXT_NODE && 
											(next.textContent || '').startsWith(' '));
							
							if (!hasSpace) {
								const space = this.doc.createTextNode(' ');
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

	private handleLazyImages(element: Element) {
		let processedCount = 0;
		const lazyImages = element.querySelectorAll('img[data-src], img[data-srcset]');

		lazyImages.forEach(img => {
			// Check if element is an image by checking tag name and required properties
			if (img.tagName.toLowerCase() !== 'img' || !('src' in img) || !('srcset' in img)) {
				return;
			}

			// Handle data-src
			const dataSrc = img.getAttribute('data-src');
			if (dataSrc && !img.getAttribute('src')) {
				img.setAttribute('src', dataSrc);
				processedCount++;
			}

			// Handle data-srcset
			const dataSrcset = img.getAttribute('data-srcset');
			if (dataSrcset && !img.getAttribute('srcset')) {
				img.setAttribute('srcset', dataSrcset);
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

	private standardizeElements(element: Element): void {
		let processedCount = 0;

		// Convert elements based on standardization rules
		ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
			const elements = element.querySelectorAll(rule.selector);
			elements.forEach(el => {
				if (rule.transform) {
					// If there's a transform function, use it to create the new element
					const transformed = rule.transform(el, this.doc);
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

			const iframe = this.doc.createElement('iframe');
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
				let score = (ENTRY_POINT_ELEMENTS.length - index) * 10;
				
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
} 
