import {
	BLOCK_ELEMENTS_SET,
	BLOCK_ELEMENTS_SELECTOR,
	BLOCK_LEVEL_ELEMENTS,
	PRESERVE_ELEMENTS,
	INLINE_ELEMENTS,
	ALLOWED_ATTRIBUTES,
	ALLOWED_ATTRIBUTES_DEBUG,
	ALLOWED_EMPTY_ELEMENTS
} from './constants';

import { DefuddleMetadata } from './types';
import { mathRules } from './elements/math';
import { wrapRawLatexDelimiters } from './elements/math.base';
import { codeBlockRules } from './elements/code';
import { headingRules, removePermalinkAnchors } from './elements/headings';
import { imageRules } from './elements/images';
import { isElement, isTextNode, isCommentNode, getComputedStyle, logDebug } from './utils';
import { transferContent, isDirectTableChild, getClassName } from './utils/dom';

// Module-level debug flag, set by standardizeContent for child functions
let _debug = false;

// Element standardization rules
// Maps selectors to their target HTML element name
interface StandardizationRule {
	selector: string;
	element: string;
	/** Cheap querySelector guard — skip the full selector scan if this returns null */
	fastCheck?: string;
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

			transferContent(el, p);

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
						transferContent(div, p);
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
									transferContent(div, p);
									div.replaceWith(p);
								});
								transferContent(nestedContent, nestedLi);
							}
							
							newNestedList.appendChild(nestedLi);
						});
						
						nestedList.replaceWith(newNestedList);
					});
					
					transferContent(content, li);
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
				transferContent(div, p);
				div.replaceWith(p);
			});
			
			return content;
		}
	}
];

export function standardizeContent(element: Element, metadata: DefuddleMetadata, doc: Document, debug: boolean = false, subProfile?: Record<string, number>): void {
	_debug = debug;

	const step = subProfile
		? <T>(name: string, fn: () => T): T => {
			const t = performance.now();
			const r = fn();
			subProfile[name] = (subProfile[name] ?? 0) + Math.round(performance.now() - t);
			return r;
		}
		: <T>(_: string, fn: () => T): T => fn();

	step('standardizeSpaces', () => standardizeSpaces(element));
	step('removeHtmlComments', () => removeHtmlComments(element));
	step('standardizeHeadings', () => standardizeHeadings(element, metadata.title, doc));
	step('wrapPreformattedCode', () => wrapPreformattedCode(element, doc));
	step('standardizeElements', () => standardizeElements(element, doc, subProfile));

	if (!debug) {
		step('flattenWrapperElements[1]', () => flattenWrapperElements(element, doc));
		step('removePermalinkAnchors', () => removePermalinkAnchors(element));
		step('stripUnwantedAttributes', () => stripUnwantedAttributes(element, debug));
		step('unwrapBareSpans', () => unwrapBareSpans(element));

		step('unwrapSpecialLinks', () => {
			// Unwrap links inside inline code — markdown can't render links in backtick code
			Array.from(element.querySelectorAll('code a')).forEach(unwrapElement);
			// Unwrap javascript: links — keep text, remove the link
			Array.from(element.querySelectorAll('a[href^="javascript:"]')).forEach(unwrapElement);
			// Restructure links that wrap block content containing a heading (e.g. article cards).
			// <a href="/x"><h2>Title</h2><p>desc</p></a>
			// → <h2><a href="/x">Title</a></h2><p>desc</p>
			// This produces valid HTML that any markdown converter handles correctly.
			Array.from(element.querySelectorAll('a')).forEach(link => {
				const href = link.getAttribute('href');
				if (!href || href.startsWith('#')) return;
				const heading = Array.from(link.children).find(
					c => /^H[1-6]$/.test(c.nodeName)
				) as Element | undefined;
				if (!heading) return;
				// Move the href into the heading by wrapping its children in a new <a>
				const innerLink = doc.createElement('a');
				innerLink.setAttribute('href', href);
				while (heading.firstChild) innerLink.appendChild(heading.firstChild);
				heading.appendChild(innerLink);
				// Unwrap the outer <a>, leaving the heading and siblings in place
				unwrapElement(link);
			});
			// Unwrap anchor links that wrap headings (e.g. clickable section headers)
			Array.from(element.querySelectorAll('a[href^="#"]')).forEach(link => {
				if (link.querySelector('h1, h2, h3, h4, h5, h6')) {
					unwrapElement(link);
				}
			});
		});

		step('removeObsoleteElements', () => element.querySelectorAll('object, embed, applet').forEach(el => el.remove()));
		step('removeEmptyElements', () => removeEmptyElements(element));
		step('removeTrailingHeadings', () => removeTrailingHeadings(element));
		step('removeOrphanedDividers[1]', () => removeOrphanedDividers(element));
		step('flattenWrapperElements[2]', () => flattenWrapperElements(element, doc));
		step('removeOrphanedDividers[2]', () => removeOrphanedDividers(element));
		step('stripExtraBrElements', () => stripExtraBrElements(element));
		step('removeEmptyLines', () => removeEmptyLines(element, doc));
	} else {
		step('stripUnwantedAttributes', () => stripUnwantedAttributes(element, debug));
		step('removeTrailingHeadings', () => removeTrailingHeadings(element));
		step('stripExtraBrElements', () => stripExtraBrElements(element));
		logDebug(_debug, 'Debug mode: Skipping div flattening to preserve structure');
	}
}

/**
 * Wrap <code> elements that have white-space: pre (via inline style)
 * in a <pre> element, so they get treated as code blocks.
 */
function wrapPreformattedCode(element: Element, doc: Document): void {
	const codeElements = Array.from(element.querySelectorAll('code'));
	for (const code of codeElements) {
		// Skip if already inside a <pre>
		if (code.closest('pre')) continue;

		// Check inline style for white-space: pre
		const style = code.getAttribute('style') || '';
		if (!/white-space\s*:\s*pre/.test(style)) continue;

		// Wrap in <pre>
		const pre = doc.createElement('pre');
		code.parentNode?.insertBefore(pre, code);
		pre.appendChild(code);
	}
}

function standardizeSpaces(element: Element): void {
	const processNode = (node: Node) => {
		// Skip pre and code elements
		if (isElement(node)) {
			const tag = (node as Element).tagName.toLowerCase();
			if (tag === 'pre' || tag === 'code') {
				return;
			}
		}

		// Process text nodes
		if (isTextNode(node)) {
			const text = node.textContent || '';
			// Replace &nbsp; with regular spaces, preserving them between words
			const newText = text.replace(/\xA0/g, ' ');
			
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
			if (isTextNode(sibling)) { // TEXT_NODE
				nextContent += sibling.textContent || '';
			} else if (isElement(sibling)) { // ELEMENT_NODE
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

	for (const heading of headings) {
		if (!hasContentAfter(heading)) {
			heading.remove();
			removedCount++;
		} else {
			// Stop processing once we find a heading with content after it
			break;
		}
	}

	if (removedCount > 0) {
		logDebug(_debug, 'Removed trailing headings:', removedCount);
	}
}

export function removeOrphanedDividers(element: Element): void {
	// Remove leading <hr> elements (skipping whitespace text nodes)
	while (true) {
		let node = element.firstChild;
		while (node && isTextNode(node) && !(node.textContent || '').trim()) {
			node = node.nextSibling;
		}
		if (node && isElement(node) && (node as Element).tagName.toLowerCase() === 'hr') {
			(node as Element).remove();
		} else {
			break;
		}
	}

	// Remove trailing <hr> elements (skipping whitespace text nodes)
	while (true) {
		let node = element.lastChild;
		while (node && isTextNode(node) && !(node.textContent || '').trim()) {
			node = node.previousSibling;
		}
		if (node && isElement(node) && (node as Element).tagName.toLowerCase() === 'hr') {
			(node as Element).remove();
		} else {
			break;
		}
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
		transferContent(h1, h2);
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
	const doc = element.ownerDocument;

	// Use TreeWalker to find comment nodes directly (O(n) instead of O(n*m))
	const walker = doc.createTreeWalker(element, 128 /* NodeFilter.SHOW_COMMENT */);
	const comments: Node[] = [];
	while (walker.nextNode()) {
		comments.push(walker.currentNode);
	}
	for (const node of comments) {
		node.parentNode?.removeChild(node);
		removedCount++;
	}

	logDebug(_debug, 'Removed HTML comments:', removedCount);
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
					attrValue === 'footnote-backref' ||
					/^callout(?:-|$)/.test(attrValue)
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

	logDebug(_debug, 'Stripped attributes:', attributeCount);
}

function unwrapElement(el: Element): void {
	while (el.firstChild) {
		el.parentNode?.insertBefore(el.firstChild, el);
	}
	el.remove();
}

function unwrapBareSpans(element: Element): void {
	// Process deepest spans first so nested bare spans collapse in one pass
	const spans = Array.from(element.querySelectorAll('span')).reverse();
	let unwrappedCount = 0;

	for (const span of spans) {
		if (!span.parentNode) continue;
		if (span.attributes.length > 0) continue;

		const parent = span.parentNode;
		if (!parent) continue;

		// Replace span with its children
		while (span.firstChild) {
			parent.insertBefore(span.firstChild, span);
		}
		span.remove();
		unwrappedCount++;
	}

	// Merge adjacent text nodes left behind in one pass
	if (unwrappedCount > 0) {
		element.normalize();
	}

	logDebug(_debug, 'Unwrapped bare spans:', unwrappedCount);
}

function removeEmptyElements(element: Element): void {
	let removedCount = 0;

	const isEmptyElement = (el: Element): boolean => {
		if (ALLOWED_EMPTY_ELEMENTS.has(el.tagName.toLowerCase())) return false;

		// Special case: divs that only contain spans with commas
		if (el.tagName === 'DIV') {
			const children = el.children;
			if (children.length > 0) {
				let allCommaSpans = true;
				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					if (child.tagName !== 'SPAN') { allCommaSpans = false; break; }
					const content = child.textContent?.trim() || '';
					if (content !== ',' && content !== '' && content !== ' ') { allCommaSpans = false; break; }
				}
				if (allCommaSpans) return true;
			}
		}

		const textContent = el.textContent || '';
		if (textContent.trim().length > 0 || textContent.includes('\u00A0')) return false;

		// Check if element has no meaningful children (no element children, only whitespace text)
		if (!el.hasChildNodes()) return true;
		const childNodes = el.childNodes;
		for (let i = 0; i < childNodes.length; i++) {
			const node = childNodes[i];
			// <br> elements are non-content spacers — treat them as empty
			if (isElement(node) && node.tagName.toLowerCase() === 'br') continue;
			if (!isTextNode(node)) return false;
			const nodeText = node.textContent || '';
			if (nodeText.trim().length > 0 || nodeText.includes('\u00A0')) return false;
		}
		return true;
	};

	// Process deepest-first in a single pass by reversing the element list
	// (querySelectorAll returns document order, reverse gives deepest last → first)
	const allElements = Array.from(element.querySelectorAll('*')).reverse();
	for (const el of allElements) {
		if (el.parentNode && isEmptyElement(el)) {
			el.remove();
			removedCount++;
		}
	}

	logDebug(_debug, 'Removed empty elements:', removedCount);
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
			while (node && isTextNode(node) && !node.textContent?.trim()) {
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
	logDebug(_debug, 'Standardized br elements:', {
		removed: processedCount,
		processingTime: `${(endTime - startTime).toFixed(2)}ms`
	});
}

function moveWhitespaceOutside(node: Element, doc: Document, direction: 'leading' | 'trailing'): number {
	const child = direction === 'leading' ? node.firstChild : node.lastChild;
	if (!child || !isTextNode(child)) return 0;

	const text = child.textContent || '';
	const trimmed = direction === 'leading' ? text.replace(/^\s+/, '') : text.replace(/\s+$/, '');
	if (trimmed === text || !node.parentNode) return 0;

	child.textContent = trimmed;

	// Ensure a space exists on the outside
	const neighbor = direction === 'leading' ? node.previousSibling : node.nextSibling;
	const neighborHasSpace = neighbor && isTextNode(neighbor) && (
		direction === 'leading'
			? (neighbor.textContent || '').endsWith(' ')
			: (neighbor.textContent || '').startsWith(' ')
	);

	if (!neighborHasSpace) {
		const insertBefore = direction === 'leading' ? node : node.nextSibling;
		node.parentNode.insertBefore(doc.createTextNode(' '), insertBefore);
	}

	return 1;
}

function removeEmptyLines(element: Element, doc: Document): void {
	let removedCount = 0;
	const startTime = Date.now();

	// First pass: remove empty text nodes
	const removeEmptyTextNodes = (node: Node) => {
		// Skip if inside pre or code
		if (isElement(node)) {
			const tag = (node as Element).tagName.toLowerCase();
			if (tag === 'pre' || tag === 'code') {
				return;
			}
		}

		// Process children first (depth-first)
		const children = Array.from(node.childNodes);
		children.forEach(removeEmptyTextNodes);

		// Then handle this node
		if (isTextNode(node)) {
			const text = node.textContent || '';
			// If it's completely empty or just zero-width/invisible characters, remove it
			// Preserve nodes with regular spaces or &nbsp; as they may separate words
			if (!text || /^[\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/.test(text)) {
				node.parentNode?.removeChild(node);
				removedCount++;
			} else {
				// Clean up the text content while preserving important spaces
				// Collapse newlines to spaces (CSS white-space: normal behavior)
				const newText = text
					.replace(/[\n\r]+/g, ' ') // Newlines -> spaces
					.replace(/\t+/g, ' ') // Tabs -> spaces
					.replace(/ {2,}/g, ' ') // 2+ spaces -> 1 space
					.replace(/^[ ]+$/, ' ') // Multiple spaces between elements -> single space
					.replace(/\s+([,.!?:;])/g, '$1') // Remove spaces before punctuation
					// Clean up zero-width characters (except ZWNJ \u200C used in Farsi) and multiple non-breaking spaces
					.replace(/[\u200B\u200D\u200E\u200F\uFEFF]+/g, '')
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
		
		// Remove whitespace-only text nodes at start/end
		const whitespacePattern = isBlockElement ? /^[\n\r\t \u200C\u200B\u200D\u200E\u200F\uFEFF\xA0]*$/ : /^[\n\r\t\u200C\u200B\u200D\u200E\u200F\uFEFF]*$/;

		while (node.firstChild &&
			   isTextNode(node.firstChild) &&
			   (node.firstChild.textContent || '').match(whitespacePattern)) {
			node.removeChild(node.firstChild);
			removedCount++;
		}

		while (node.lastChild &&
			   isTextNode(node.lastChild) &&
			   (node.lastChild.textContent || '').match(whitespacePattern)) {
			node.removeChild(node.lastChild);
			removedCount++;
		}

		// For inline elements, move leading/trailing spaces outside the element
		if (!isBlockElement && INLINE_ELEMENTS.has(tag) && node.parentNode) {
			removedCount += moveWhitespaceOutside(node, doc, 'leading');
			removedCount += moveWhitespaceOutside(node, doc, 'trailing');
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
					
					const hasSpace = (isTextNode(current) && 
									(current.textContent || '').endsWith(' ')) ||
									(isTextNode(next) && 
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
	logDebug(_debug, 'Removed empty lines:', {
		charactersRemoved: removedCount,
		processingTime: `${(endTime - startTime).toFixed(2)}ms`
	});
}

function standardizeElements(element: Element, doc: Document, subProfile?: Record<string, number>): void {
	let processedCount = 0;
	const stepSE = subProfile
		? <T>(name: string, fn: () => T): T => {
			const t = performance.now();
			const r = fn();
			subProfile['se:' + name] = (subProfile['se:' + name] ?? 0) + Math.round(performance.now() - t);
			return r;
		}
		: <T>(_: string, fn: () => T): T => fn();

	// Wrap raw $...$ and $$...$$ LaTeX delimiters in <math> elements so the
	// math rules below can process them. Only fires when MathJax/KaTeX scripts
	// are present but haven't rendered (no JS execution).
	stepSE('wrapRawLatexDelimiters', () => wrapRawLatexDelimiters(element, doc));

	// Convert elements based on standardization rules
	ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
		const selectorKey = rule.selector.substring(0, 30);
		stepSE(selectorKey, () => {
			if (rule.fastCheck && !element.querySelector(rule.fastCheck)) return;
			let elements: NodeListOf<Element>;
			try {
				elements = element.querySelectorAll(rule.selector);
			} catch (e) {
				// Some selectors use :has() which isn't supported by jsdom/nwsapi.
				// Skip the rule gracefully in those environments.
				return;
			}
			elements.forEach(el => {
				if (rule.transform) {
					// If there's a transform function, use it to create the new element
					const transformed = rule.transform(el, doc);
					el.replaceWith(transformed);
					processedCount++;
				}
			});
		});
	});

	// Fix invalid <code><pre> nesting left by sites that wrap <pre> in an outer <code>
	// as a highlight container. After codeBlockRules transforms the inner <pre>, the outer
	// <code> still wraps it, producing <code><pre><code>...</code></pre></code> instead of
	// the standard <pre><code>...</code></pre>.
	Array.from(element.querySelectorAll('code > pre')).forEach(pre => {
		const outerCode = pre.parentElement;
		if (!outerCode || outerCode.tagName !== 'CODE') return;
		outerCode.replaceWith(pre);
	});

	// arXiv LaTeXML: Convert equation tables to <math> elements before attribute stripping
	const equationTables = Array.from(element.querySelectorAll('table.ltx_equation, table.ltx_eqn_table, table.ltx_equationgroup'));
	equationTables.forEach(table => {
		const mathElements = table.querySelectorAll('math');
		if (mathElements.length === 0) return;

		const fragment = doc.createDocumentFragment();
		mathElements.forEach(mathEl => {
			// Extract LaTeX from alttext or annotation
			const alttext = mathEl.getAttribute('alttext');
			const annotation = mathEl.querySelector('annotation[encoding="application/x-tex"]');
			const latex = alttext || annotation?.textContent?.trim() || '';

			if (!latex) return;

			const isBlock = mathEl.getAttribute('display') === 'block' ||
				table.classList.contains('ltx_equation') ||
				table.classList.contains('ltx_equationgroup');

			const cleanMath = doc.createElement('math');
			cleanMath.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
			cleanMath.setAttribute('display', isBlock ? 'block' : 'inline');
			cleanMath.setAttribute('data-latex', latex);
			cleanMath.textContent = latex;
			fragment.appendChild(cleanMath);
		});

		if (fragment.childNodes.length > 0) {
			table.replaceWith(fragment);
			processedCount++;
		}
	});

	// arXiv LaTeXML: Remove hidden ltx_note_outer spans (CSS display:none on arxiv.org)
	// These contain duplicated footnote marks and "footnotemark:" text
	const noteOuters = Array.from(element.querySelectorAll('span.ltx_note_outer'));
	noteOuters.forEach(outer => {
		outer.remove();
		processedCount++;
	});

	// arXiv LaTeXML: Unwrap ltx_ref_tag spans so cross-reference numbers are preserved
	// These spans (e.g. <span class="ltx_text ltx_ref_tag">1</span>) get stripped to bare
	// spans during attribute stripping, then unwrapped — but their parent <a> links get
	// removed by the exact selector `a[href^="#"][class*="ref" i]`. Fix by unwrapping the
	// link and keeping the text inline.
	const refLinks = Array.from(element.querySelectorAll('a.ltx_ref'));
	refLinks.forEach(link => {
		const refTag = link.querySelector('span.ltx_ref_tag, span.ltx_text.ltx_ref_tag');
		if (refTag) {
			// Replace the link with just the text content
			const text = doc.createTextNode(link.textContent || '');
			link.replaceWith(text);
			processedCount++;
		}
	});

	// Unwrap single-column layout tables (used for styling/positioning, not data)
	const tables = Array.from(element.querySelectorAll('table'));
	tables.forEach(table => {
		if (!table.parentNode) return;

		const directCells = Array.from(table.querySelectorAll('td, th'))
			.filter(cell => isDirectTableChild(cell, table));

		// Skip data tables that have direct header cells
		if (directCells.some(cell => cell.tagName === 'TH')) return;

		const directRows = Array.from(table.querySelectorAll('tr'))
			.filter(row => isDirectTableChild(row, table));
		if (directRows.length === 0) return;

		// Check that every row has at most one direct cell
		const isSingleColumn = directRows.every(tr =>
			directCells.filter(cell => cell.parentNode === tr).length <= 1
		);
		if (!isSingleColumn) return;

		const fragment = doc.createDocumentFragment();
		directCells.forEach(cell => {
			while (cell.firstChild) {
				fragment.appendChild(cell.firstChild);
			}
		});
		table.replaceWith(fragment);
		processedCount++;
	});

	// Add controls to video elements that don't have them
	element.querySelectorAll('video:not([controls])').forEach(el => {
		el.setAttribute('controls', '');
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

	logDebug(_debug, 'Converted embedded elements:', processedCount);

	// Verso (Lean docs) emits many adjacent command/output blocks.
	// Merge contiguous transformed blocks back into one readable block.
	mergeAdjacentVersoCodeBlocks(element);
}

function mergeAdjacentVersoCodeBlocks(root: Element): void {
	const getCodeNode = (pre: Element): Element | null => {
		let code: Element | null = null;
		for (const child of pre.children) {
			if (child.tagName.toLowerCase() !== 'code') return null;
			if (code) return null;
			code = child;
		}
		return code;
	};

	const getLanguage = (code: Element): string => {
		const dataLang = (code.getAttribute('data-lang') || '').toLowerCase();
		if (dataLang) return dataLang;
		const className = code.getAttribute('class') || '';
		const match = className.match(/(?:^|\s)language-([a-z0-9_+-]+)(?:\s|$)/i);
		return match?.[1]?.toLowerCase() || '';
	};

	// Only visit parents of verso code blocks, not every element in the tree
	const candidates = root.querySelectorAll('pre[data-verso-code="true"]');
	const parents = new Set<Element>();
	for (const candidate of candidates) {
		const parent = candidate.parentElement;
		if (parent) parents.add(parent);
	}

	for (const container of parents) {
		const children = Array.from(container.childNodes);
		for (let i = 0; i < children.length; i++) {
			const startNode = children[i];
			if (!isElement(startNode) || startNode.tagName.toLowerCase() !== 'pre') continue;
			if ((startNode as Element).getAttribute('data-verso-code') !== 'true') continue;

			const startCode = getCodeNode(startNode as Element);
			if (!startCode) continue;
			const language = getLanguage(startCode);
			if (language !== 'lean' && language !== 'lean4') continue;

			const run: { pre: Element; code: Element }[] = [{ pre: startNode as Element, code: startCode }];
			const betweenWhitespace: Node[] = [];
			let j = i + 1;

			while (j < children.length) {
				const node = children[j];
				if (isTextNode(node) && !(node.textContent || '').trim()) {
					betweenWhitespace.push(node);
					j++;
					continue;
				}

				if (!isElement(node) || node.tagName.toLowerCase() !== 'pre') break;
				const pre = node as Element;
				if (pre.getAttribute('data-verso-code') !== 'true') break;
				const code = getCodeNode(pre);
				if (!code || getLanguage(code) !== language) break;

				run.push({ pre, code });
				j++;
			}

			if (run.length <= 1) continue;

			const merged = run
				.map(({ code }) => (code.textContent || '').replace(/\r?\n$/, ''))
				.join('\n')
				.replace(/\n{3,}/g, '\n\n')
				.replace(/^\n+|\n+$/g, '');

			startCode.textContent = merged;

			for (let k = 1; k < run.length; k++) {
				run[k].pre.remove();
			}
			for (const node of betweenWhitespace) {
				node.parentNode?.removeChild(node);
			}

			// Continue scanning after the merged run.
			i = j - 1;
		}
	}
}

function flattenWrapperElements(element: Element, doc: Document): void {
	let processedCount = 0;
	const startTime = Date.now();

	// Process in batches to maintain performance
	let keepProcessing = true;

	// Helper function to check if an element directly contains inline content
	// This helps prevent unwrapping divs that visually act as paragraphs.
	function hasDirectInlineContent(el: Element): boolean {
		for (const child of el.childNodes) {
			// Check for non-empty text nodes
			if (isTextNode(child) && child.textContent?.trim()) {
				return true;
			}
			// Check for element nodes that are considered inline
			if (isElement(child) && INLINE_ELEMENTS.has(child.nodeName.toLowerCase())) {
				return true;
			}
		}
		return false;
	}

	const shouldPreserveElement = (el: Element): boolean => {
		const tagName = el.tagName.toLowerCase();

		// Check if element should be preserved
		if (PRESERVE_ELEMENTS.has(tagName)) return true;

		// Preserve callout structure (div.callout[data-callout] and children)
		if (el.getAttribute('data-callout') || el.closest?.('[data-callout]')) return true;

		// Check for semantic roles
		const role = el.getAttribute('role');
		if (role && ['article', 'main', 'navigation', 'banner', 'contentinfo'].includes(role)) {
			return true;
		}
		
		// Check for semantic classes
		const className = getClassName(el);
		if (className && className.toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)) {
			return true;
		}

		// Check if element contains mixed content types that should be preserved
		const children = Array.from(el.children);
		const hasPreservedElements = children.some(child => 
			PRESERVE_ELEMENTS.has(child.tagName.toLowerCase()) ||
			child.getAttribute('role') === 'article' ||
			!!getClassName(child) && getClassName(child).toLowerCase().match(/(?:article|main|content|footnote|reference|bibliography)/)
		);
		if (hasPreservedElements) return true;
		
		return false;
	};

	const isWrapperElement = (el: Element): boolean => {
		// If it directly contains inline content, it's NOT a wrapper
		if (hasDirectInlineContent(el)) {
			return false;
		}

		// Check if it's just empty space
		if (!el.textContent?.trim()) return true;

		// Check if it only contains other block elements
		const children = Array.from(el.children);
		if (children.length === 0) return true;
		
		// Check if all children are block elements
		const allBlockElements = children.every(child => {
			return BLOCK_LEVEL_ELEMENTS.has(child.tagName.toLowerCase());
		});
		if (allBlockElements) return true;

		// Check for common wrapper patterns
		const className = getClassName(el).toLowerCase();
		const isWrapper = /(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(className);
		if (isWrapper) return true;

		// Check if it has excessive whitespace or empty text nodes
		const textNodes = Array.from(el.childNodes).filter(node => 
			isTextNode(node) && node.textContent?.trim()
		);
		if (textNodes.length === 0) return true;

		// Check if it only contains block elements
		const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
			const tag = child.tagName.toLowerCase();
			return INLINE_ELEMENTS.has(tag);
		});
		if (hasOnlyBlockElements) return true;

		return false;
	};

	// Function to process a single element
	const processElement = (el: Element): boolean => {
		// Skip processing if element has been removed or should be preserved
		if (!el.parentNode || shouldPreserveElement(el)) return false;
		const tagName = el.tagName.toLowerCase();

		// Case 1: Element is truly empty (no text content, no child elements) and not self-closing
		if (!ALLOWED_EMPTY_ELEMENTS.has(tagName) && !el.children.length && !el.textContent?.trim()) {
			el.remove();
			processedCount++;
			return true;
		}

		// Case 2: Top-level element - be more aggressive
		if (el.parentElement === element) {
			const children = Array.from(el.children);
			const hasOnlyBlockElements = children.length > 0 && !children.some(child => {
				const tag = child.tagName.toLowerCase();
				return INLINE_ELEMENTS.has(tag);
			});

			if (hasOnlyBlockElements) {
				const fragment = doc.createDocumentFragment();
				while (el.firstChild) {
					fragment.appendChild(el.firstChild);
				}
				el.replaceWith(fragment);
				processedCount++;
				return true;
			}
		}

		// Case 3: Wrapper element - merge up aggressively
		if (isWrapperElement(el)) {
			const fragment = doc.createDocumentFragment();
			while (el.firstChild) {
				fragment.appendChild(el.firstChild);
			}
			el.replaceWith(fragment);
			processedCount++;
			return true;
		}

		// Case 4: Element only contains text and/or inline elements - convert to paragraph
		const childNodes = Array.from(el.childNodes);
		const hasOnlyInlineOrText = childNodes.length > 0 && childNodes.every(child =>
			(isTextNode(child)) ||
			(isElement(child) && INLINE_ELEMENTS.has(child.nodeName.toLowerCase()))
		);

		if (hasOnlyInlineOrText && el.textContent?.trim()) { // Ensure there's actual content
			const p = doc.createElement('p');
			// Move all children (including inline tags like <font>) to the new <p>
			while (el.firstChild) {
				p.appendChild(el.firstChild);
			}
			el.replaceWith(p);
			processedCount++;
			return true;
		}

		// Case 5: Element has single child - unwrap only if child is block-level
		if (el.children.length === 1) {
			const child = el.firstElementChild!;
			const childTag = child.tagName.toLowerCase();
			
			// Only unwrap if the single child is a block element and not preserved
			if (BLOCK_ELEMENTS_SET.has(childTag) && !shouldPreserveElement(child)) {
				el.replaceWith(child);
				processedCount++;
				return true;
			}
		}

		// Case 6: Deeply nested element - merge up
		let nestingDepth = 0;
		let parent = el.parentElement;
		while (parent) {
			const parentTag = parent.tagName.toLowerCase();
			if (BLOCK_ELEMENTS_SET.has(parentTag)) {
				nestingDepth++;
			}
			parent = parent.parentElement;
		}

		// Only unwrap if nested AND does not contain direct inline content
		if (nestingDepth > 0 && !hasDirectInlineContent(el)) {
			const fragment = doc.createDocumentFragment();
			while (el.firstChild) {
				fragment.appendChild(el.firstChild);
			}
			el.replaceWith(fragment);
			processedCount++;
			return true;
		}

		return false;
	};

	// First pass: Process top-level wrapper elements
	const processTopLevelElements = () => {
		const topElements = Array.from(element.children).filter(
			el => BLOCK_ELEMENTS_SET.has(el.tagName.toLowerCase())
		);
		
		let modified = false;
		topElements.forEach(el => {
			if (processElement(el)) {
				modified = true;
			}
		});
		return modified;
	};

	// Second pass: Process remaining wrapper elements from deepest to shallowest
	const processRemainingElements = () => {
		// Get all wrapper elements
		const allElements = Array.from(element.querySelectorAll(BLOCK_ELEMENTS_SELECTOR))
			.sort((a, b) => {
				// Count nesting depth
				const getDepth = (el: Element): number => {
					let depth = 0;
					let parent = el.parentElement;
					while (parent) {
						const parentTag = parent.tagName.toLowerCase();
						if (BLOCK_ELEMENTS_SET.has(parentTag)) depth++;
						parent = parent.parentElement;
					}
					return depth;
				};
				return getDepth(b) - getDepth(a); // Process deepest first
			});

		let modified = false;
		allElements.forEach(el => {
			if (processElement(el)) {
				modified = true;
			}
		});
		return modified;
	};

	// Final cleanup pass - aggressively flatten remaining wrapper elements
	const finalCleanup = () => {
		const remainingElements = Array.from(element.querySelectorAll(BLOCK_ELEMENTS_SELECTOR));
		let modified = false;
		
		remainingElements.forEach(el => {
			// Check if element only contains paragraphs
			const children = Array.from(el.children);
			const onlyParagraphs = children.length > 0 && children.every(child => child.tagName.toLowerCase() === 'p');
			
			// Unwrap if it only contains paragraphs OR is a non-preserved wrapper element
			if (onlyParagraphs || (!shouldPreserveElement(el) && isWrapperElement(el))) {
				const fragment = doc.createDocumentFragment();
				while (el.firstChild) {
					fragment.appendChild(el.firstChild);
				}
				el.replaceWith(fragment);
				processedCount++;
				modified = true;
			}
		});
		return modified;
	};

	// Execute all passes until no more changes
	do {
		keepProcessing = false;
		if (processTopLevelElements()) keepProcessing = true;
		if (processRemainingElements()) keepProcessing = true;
		if (finalCleanup()) keepProcessing = true;
	} while (keepProcessing);

	const endTime = Date.now();
	logDebug(_debug, 'Flattened wrapper elements:', {
		count: processedCount,
		processingTime: `${(endTime - startTime).toFixed(2)}ms`
	});
}
