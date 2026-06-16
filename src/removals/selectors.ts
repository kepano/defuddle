import {
	EXACT_SELECTORS_JOINED,
	HIDDEN_EXACT_SELECTOR,
	HIDDEN_EXACT_SKIP_SELECTOR,
	PARTIAL_SELECTORS,
	PARTIAL_SELECTORS_REGEX,
	PARTIAL_SELECTORS_ANCHORED_REGEX,
	TEST_ATTRIBUTES_SELECTOR,
	FOOTNOTE_LIST_SELECTORS
} from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, logDebug } from '../utils';
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
			? PARTIAL_SELECTORS.map(p => ({ pattern: p, regex: new RegExp(p, 'i'), anchored: new RegExp('^(?:' + p + ')$', 'i') }))
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
			// For headings, only check class — IDs are auto-slugs and data-testid
			// values (e.g. "article-header") cause false positives.
			const isHeading = /^H[1-6]$/.test(tag);
			const attrs = (isHeading
				? getClassName(el)
				: getClassName(el) + ' ' +
					(el.getAttribute('data-component') || '') + ' ' +
					(el.getAttribute('data-test') || '') + ' ' +
					(el.getAttribute('data-testid') || '') + ' ' +
					(el.getAttribute('data-test-id') || '') + ' ' +
					(el.getAttribute('data-qa') || '') + ' ' +
					(el.getAttribute('data-cy') || '')
			).toLowerCase();

			// The id is matched separately. A delimited id (e.g. "feedback-form") is
			// substring-matched like the other attributes, but a delimiter-less id is
			// usually a content anchor concatenated from heading words (e.g.
			// "theroleofthings", "loopsandfeedback") — substring matching would wrongly
			// strip it (hitting 'hero'/'feedback'), so it must equal a selector token
			// outright. Headings skip id entirely (they carry auto-generated slugs).
			const id = isHeading ? '' : (el.id || '').toLowerCase();

			// Skip if nothing to check
			const hasAttrs = attrs.trim() !== '';
			if (!hasAttrs && !id) {
				return;
			}

			// Check for partial match using single regex test
			const attrsMatch = hasAttrs && PARTIAL_SELECTORS_REGEX.test(attrs);
			const idHasDelimiter = id ? /[\s_\-:.]/.test(id) : false;
			const idMatch = id
				? (idHasDelimiter ? PARTIAL_SELECTORS_REGEX.test(id) : PARTIAL_SELECTORS_ANCHORED_REGEX.test(id))
				: false;
			if (attrsMatch || idMatch) {
				// Substring match when it came from attrs or a delimited id;
				// otherwise the id matched a whole selector token (anchored).
				const useSubstring = attrsMatch || idHasDelimiter;
				const matchString = attrsMatch ? attrs : id;
				const matchedPattern = individualRegexes
					? individualRegexes.find(r => (useSubstring ? r.regex : r.anchored).test(matchString))?.pattern
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
		// Buttons that contain media (e.g. Bloomberg image zoom overlays) —
		// extract only the media, discard the button and its non-media children
		// (SVG icons, overlay text) to avoid leaking UI chrome.
		if (el.tagName === 'BUTTON' && el.querySelector('img, picture, video')) {
			const parent = el.parentElement;
			if (parent) {
				for (const media of Array.from(el.querySelectorAll('img, picture, video'))) {
					parent.insertBefore(media, el);
				}
				el.remove();
			}
			return;
		}
		// Unwrap buttons in inline context to preserve text (e.g. LeetCode tooltip terms)
		if (el.tagName === 'BUTTON' && el.closest('p, li, td, th, span, h1, h2, h3, h4, h5, h6')) {
			el.replaceWith(...Array.from(el.childNodes));
			return;
		}
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
