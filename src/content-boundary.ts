import { countWords, normalizeText } from './utils';

const DATE_PATTERN = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i;
const BYLINE_PATTERN = /^by\s+\S/i;
const SENTENCE_PUNCT = /[.!?]/;
const HIDDEN_CLASS_RE = /\b(?:isHidden(?:-[A-Za-z0-9_]+)?|is-hidden)\b/;

const CANDIDATE_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'FONT']);
// Leaf-like candidates are preferred over container candidates so a top-level
// wrapper whose textContent happens to qualify doesn't outvote the real paragraph.
const LEAF_CANDIDATE_TAGS = new Set(['P', 'BLOCKQUOTE', 'FONT']);

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';
const SKIP_ANCESTOR_SELECTOR = `aside, nav, header, footer, form, ${DIALOG_SELECTOR}`;
const PROSE_MIN_WORDS = 7;

function findTitleElement(mainContent: Element, title: string): Element | null {
	const normalizedTitle = normalizeText(title);
	if (!normalizedTitle) return null;
	const headings = mainContent.querySelectorAll('h1, h2');
	for (const h of headings) {
		if (normalizeText(h.textContent || '') === normalizedTitle) return h;
	}
	return null;
}

function linkTextLength(el: Element): number {
	let len = 0;
	for (const a of el.querySelectorAll('a')) {
		len += (a.textContent || '').length;
	}
	return len;
}

function isProseBlock(el: Element): boolean {
	if (!el.tagName) return false;
	if (!CANDIDATE_TAGS.has(el.tagName)) return false;
	if (el.closest(SKIP_ANCESTOR_SELECTOR)) return false;
	const className = typeof el.className === 'string' ? el.className : '';
	if (HIDDEN_CLASS_RE.test(className)) return false;
	// A dialog inside the subtree pollutes the element's textContent with modal
	// copy; a script/style descendant pollutes it with source code.
	if (el.querySelector(DIALOG_SELECTOR)) return false;
	if (el.querySelector('script, style')) return false;

	const text = (el.textContent || '').trim();
	if (!text) return false;
	const words = countWords(text);
	if (words < PROSE_MIN_WORDS) return false;
	if (!SENTENCE_PUNCT.test(text)) return false;
	// "By Jane Smith, reporter" — a short text starting with "By" is a byline.
	// Real prose that happens to start with "By" (e.g. "By the residue theorem…")
	// tends to be longer.
	if (BYLINE_PATTERN.test(text) && words < 15) return false;
	if (DATE_PATTERN.test(text) && words < 20) return false;
	if (linkTextLength(el) > text.length * 0.7) return false;
	// A DIV whose text comes from spans/labels (cookie banners, button groups)
	// can pass the word-count bar without actually containing article prose.
	if (el.tagName === 'DIV' && !el.querySelector('p')) return false;

	return true;
}

/**
 * Score-based candidate for "this element is the start of the prose body."
 *
 * Anchor on the title (h1/h2 matching the normalized page title) if present,
 * then walk forward in document order for the first prose-length block — a
 * DOM-shape proxy for "here is where the article actually begins," replacing
 * ad-hoc byte-offset checks like `contentText.indexOf(text) < 300`.
 *
 * Returns `null` when no candidate qualifies; callers should treat that as
 * "no signal" rather than a removal opportunity.
 */
export function findContentStart(mainContent: Element, title: string): Element | null {
	const titleEl = findTitleElement(mainContent, title);
	const start = titleEl || null;

	// Single tree walk that records the first leaf-candidate hit and, separately,
	// the first container-candidate hit. Prefer the leaf — a top-level wrapper
	// would otherwise outvote a real paragraph inside it.
	const doc = mainContent.ownerDocument;
	const walker = doc.createTreeWalker(mainContent, 1 /* NodeFilter.SHOW_ELEMENT */);
	if (start) walker.currentNode = start;

	let leafHit: Element | null = null;
	let containerHit: Element | null = null;
	let node = walker.nextNode();
	while (node) {
		const el = node as Element;
		if (isProseBlock(el)) {
			if (LEAF_CANDIDATE_TAGS.has(el.tagName)) {
				leafHit = el;
				break;
			}
			if (!containerHit) containerHit = el;
		}
		node = walker.nextNode();
	}

	if (leafHit) return leafHit;
	if (containerHit) {
		// Drill down through wrapper containers to find the most specific
		// qualifying block. At each level, if exactly one child qualifies,
		// descend into it. Stop when multiple children qualify (the content
		// area has been reached) or none do.
		let result = containerHit;
		while (true) {
			let qualifyingChild: Element | null = null;
			let multiple = false;
			for (const child of result.children) {
				if (isProseBlock(child)) {
					if (qualifyingChild) { multiple = true; break; }
					qualifyingChild = child;
				}
			}
			if (qualifyingChild && !multiple) {
				result = qualifyingChild;
			} else {
				break;
			}
		}
		return result;
	}

	// If we anchored on the title and found nothing after it, retry from the top.
	if (start) return findContentStart(mainContent, '');
	return null;
}

/**
 * True when `el` is positioned strictly before `boundary` in document order.
 * Safe when `boundary` is null (returns false — treat as "don't know").
 */
export function isAboveContentStart(el: Element, boundary: Element | null): boolean {
	if (!boundary) return false;
	if (el === boundary) return false;
	const pos = el.compareDocumentPosition(boundary);
	// DOCUMENT_POSITION_DISCONNECTED (1) — one of the nodes is detached; treat
	// as unknown rather than above.
	if (pos & 1) return false;
	// DOCUMENT_POSITION_FOLLOWING (4) — boundary follows el → el is above it.
	return !!(pos & 4);
}
