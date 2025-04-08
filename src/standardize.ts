import { 
	BLOCK_ELEMENTS,
	PRESERVE_ELEMENTS,
	INLINE_ELEMENTS,
	ALLOWED_ATTRIBUTES,
	ALLOWED_ATTRIBUTES_DEBUG,
	ALLOWED_EMPTY_ELEMENTS,
	NODE_TYPE
} from './constants';

import { DefuddleMetadata } from './types';
import { mathRules } from './elements/math.full';
import { codeBlockRules } from './elements/code';
import { standardizeFootnotes } from './elements/footnotes';
import { headingRules } from './elements/headings';
import { imageRules } from './elements/images';
import { isElement, getComputedStyle, getWindow, logDebug } from './utils';

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
	...imageRules,

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

export function standardizeContent(element: Element, metadata: DefuddleMetadata, doc: Document, debug: boolean = false): void {
    standardizeSpaces(element);

    // Remove HTML comments
    removeHtmlComments(element);

    // Handle H1 elements - remove first one and convert others to H2
    standardizeHeadings(element, metadata.title, doc);

    // Standardize footnotes and citations
    standardizeFootnotes(element);

    // Convert embedded content to standard formats
    standardizeElements(element, doc);

    // If not debug mode, do the full cleanup
    if (!debug) {
        // First pass of div flattening
        flattenDivs(element, doc);
        
        // Strip unwanted attributes
        stripUnwantedAttributes(element, debug);

        // Remove empty elements
        removeEmptyElements(element);

        // Remove trailing headings
        removeTrailingHeadings(element);

        // Final pass of div flattening after cleanup operations
        flattenDivs(element, doc);

        // Standardize consecutive br elements
        stripExtraBrElements(element);

        // Clean up empty lines
        removeEmptyLines(element, doc);
    } else {
        // In debug mode, still do basic cleanup but preserve structure
        stripUnwantedAttributes(element, debug);
        removeEmptyElements(element);
        removeTrailingHeadings(element);
        stripExtraBrElements(element);
        logDebug('Debug mode: Skipping div flattening to preserve structure');
    }
}

function standardizeSpaces(element: Element): void {
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

function removeTrailingHeadings(element: Element): void {
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
        logDebug('Removed trailing headings:', removedCount);
    }
}

function standardizeHeadings(element: Element, title: string, doc: Document): void {
    const normalizeText = (text: string): string => {
        return text
            .replace(/\u00A0/g, ' ') // Convert non-breaking spaces to regular spaces
            .replace(/\s+/g, ' ') // Normalize all whitespace to single spaces
            .trim()
            .toLowerCase();
    };

    const h1s = element.getElementsByTagName('h1');

    Array.from(h1s).forEach(h1 => {
        const h2 = doc.createElement('h2');
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

function removeHtmlComments(element: Element): void {
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

    logDebug('Removed HTML comments:', removedCount);
}

function stripUnwantedAttributes(element: Element, debug: boolean): void {
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
            if (debug) {
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

    logDebug('Stripped attributes:', attributeCount);
}

function removeEmptyElements(element: Element): void {
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

    logDebug('Removed empty elements:', removedCount, 'iterations:', iterations);
}

function stripExtraBrElements(element: Element): void {
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
    logDebug('Standardized br elements:', {
        removed: processedCount,
        processingTime: `${(endTime - startTime).toFixed(2)}ms`
    });
}

function removeEmptyLines(element: Element, doc: Document): void {
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
        const isBlockElement = getComputedStyle(node)?.display === 'block';
        
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
                    // Get the text content
                    const nextContent = next.textContent || '';
                    const currentContent = current.textContent || '';
                    
                    // Don't add space if:
                    // 1. Next content starts with punctuation or closing parenthesis
                    // 2. Current content ends with punctuation or opening parenthesis
                    // 3. There's already a space
                    const nextStartsWithPunctuation = nextContent.match(/^[,.!?:;)\]]/);
                    const currentEndsWithPunctuation = currentContent.match(/[,.!?:;(\[]\s*$/);
                    
                    const hasSpace = (current.nodeType === NODE_TYPE.TEXT_NODE && 
                                    (current.textContent || '').endsWith(' ')) ||
                                    (next.nodeType === NODE_TYPE.TEXT_NODE && 
                                    (next.textContent || '').startsWith(' '));
                    
                    // Only add space if none of the above conditions are true
                    if (!nextStartsWithPunctuation && 
                        !currentEndsWithPunctuation && 
                        !hasSpace) {
                        const space = doc.createTextNode(' ');
                        node.insertBefore(space, next);
                    }
                }
            }
        }
    };

    // Run both passes
    removeEmptyTextNodes(element);
    cleanupEmptyElements(element);

    const endTime = Date.now();
    logDebug('Removed empty lines:', {
        charactersRemoved: removedCount,
        processingTime: `${(endTime - startTime).toFixed(2)}ms`
    });
}

function standardizeElements(element: Element, doc: Document): void {
    let processedCount = 0;

    // Convert elements based on standardization rules
    ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
        const elements = element.querySelectorAll(rule.selector);
        elements.forEach(el => {
            if (rule.transform) {
                // If there's a transform function, use it to create the new element
                const transformed = rule.transform(el, doc);
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

        const iframe = doc.createElement('iframe');
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

    logDebug('Converted embedded elements:', processedCount);
}

function flattenDivs(element: Element, doc: Document): void {
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
                const fragment = doc.createDocumentFragment();
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
                const fragment = doc.createDocumentFragment();
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                div.replaceWith(fragment);
                processedCount++;
                return true;
            }

            // Otherwise handle as normal wrapper
            const fragment = doc.createDocumentFragment();
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
            const p = doc.createElement('p');
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
            const fragment = doc.createDocumentFragment();
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
                    const fragment = doc.createDocumentFragment();
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
    logDebug('Flattened divs:', {
        count: processedCount,
        processingTime: `${(endTime - startTime).toFixed(2)}ms`
    });
}

