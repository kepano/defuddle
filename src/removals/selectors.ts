import {
	EXACT_SELECTORS_JOINED,
	HIDDEN_EXACT_SELECTOR,
	HIDDEN_EXACT_SKIP_SELECTOR,
	PARTIAL_SELECTORS,
	PARTIAL_SELECTORS_REGEX,
	TEST_ATTRIBUTES_SELECTOR,
	FOOTNOTE_LIST_SELECTORS
} from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, logDebug, isSVGElement } from '../utils';
import { getClassName, hasResponsiveShowClass } from '../utils/dom';

export function removeBySelector(doc: Document, debug: boolean, removeExact: boolean = true, removePartial: boolean = true, mainContent?: Element | null, debugRemovals?: DebugRemoval[], skipHiddenExactSelectors: boolean = false) {
	const startTime = Date.now();
	let exactSelectorCount = 0;
	let partialSelectorCount = 0;

	// Track all elements to be removed, with their match type
	const elementsToRemove = new Map<Element, { type: 'exact' | 'partial'; selector?: string }>();

	// First collect elements matching exact selectors
	if (removeExact) {
		const exactElements = doc.querySelectorAll(EXACT_SELECTORS_JOINED);
		exactElements.forEach(el => {
			if (el?.parentNode) {
				if (skipHiddenExactSelectors) {
					const hiddenAncestor = el.closest(HIDDEN_EXACT_SKIP_SELECTOR);
					const role = (el.getAttribute('role') || '').toLowerCase();
					if (
						el.matches(HIDDEN_EXACT_SELECTOR) ||
						(hiddenAncestor && role === 'dialog')
					) {
						return;
					}
				}
				// Skip elements inside code blocks (e.g. syntax highlighting spans)
				if (el.closest('pre, code')) {
					return;
				}
				if (el.tagName === 'STYLE' && isSVGElement(el)) {
					return;
				}
				// Skip elements with responsive show classes (e.g. "hidden sm:flex")
				if (el.matches(HIDDEN_EXACT_SELECTOR) && hasResponsiveShowClass(getClassName(el))) {
					return;
				}
				elementsToRemove.set(el, { type: 'exact' });
				exactSelectorCount++;
			}
		});
	}

	if (removePartial) {
		// Pre-compile individual regexes for debug pattern identification only
		const individualRegexes = debug
			? PARTIAL_SELECTORS.map(p => ({ pattern: p, regex: new RegExp(p, 'i') }))
			: null;

		// Query both doc and mainContent because linkedom's document-level
		// querySelectorAll can miss elements after prior DOM mutations.
		const docElements = doc.querySelectorAll(TEST_ATTRIBUTES_SELECTOR);
		const mainElements = mainContent ? mainContent.querySelectorAll(TEST_ATTRIBUTES_SELECTOR) : [];
		const allElements = new Set<Element>([...docElements, ...mainElements]);

		// Process elements for partial matches
		allElements.forEach(el => {
			// Skip if already marked for removal
			if (elementsToRemove.has(el)) {
				return;
			}

			// Skip elements inside defuddle extractor output (e.g. comment trees)
			if (el.closest('[data-defuddle]')) {
				return;
			}

			// Skip code elements and elements containing code blocks
			// where class names indicate language/syntax, not page structure
			const tag = el.tagName;
			if (tag === 'CODE' || tag === 'PRE' || el.querySelector('pre') || el.closest('code, pre')) {
				return;
			}

			// Get all relevant attributes and combine into a single string
			// (Hardcoded to match TEST_ATTRIBUTES in constants.ts — avoids array allocation per element)
			// For heading elements, exclude the id attribute — heading IDs are
			// auto-generated slugs from content text (e.g. "3-ignore-the-error")
			// that would falsely match partial selectors like "-error".
			const isHeading = /^H[1-6]$/.test(tag);
			const attrs = (
				getClassName(el) + ' ' +
				(isHeading ? '' : (el.id || '')) + ' ' +
				(el.getAttribute('data-component') || '') + ' ' +
				(el.getAttribute('data-test') || '') + ' ' +
				(el.getAttribute('data-testid') || '') + ' ' +
				(el.getAttribute('data-test-id') || '') + ' ' +
				(el.getAttribute('data-qa') || '') + ' ' +
				(el.getAttribute('data-cy') || '')
			).toLowerCase();

			// Skip if no attributes to check
			if (!attrs.trim()) {
				return;
			}

			// Check for partial match using single regex test
			if (PARTIAL_SELECTORS_REGEX.test(attrs)) {
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
			// Protect footnote backref links generated by standardizeFootnotes
			if (el.classList?.contains('footnote-backref') && el.closest('#footnotes')) {
				return;
			}
		} catch (e) {}
		if (debug && debugRemovals) {
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
	logDebug(debug, 'Removed clutter elements:', {
		exactSelectors: exactSelectorCount,
		partialSelectors: partialSelectorCount,
		total: elementsToRemove.size,
		processingTime: `${(endTime - startTime).toFixed(2)}ms`
	});
}
