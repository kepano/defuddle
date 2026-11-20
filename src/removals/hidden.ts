import { DebugRemoval } from '../types';
import { textPreview, logDebug } from '../utils';
import { hasResponsiveShowClass } from '../utils/dom';

const HIDDEN_STYLE_PATTERN = /(?:^|;\s*)(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*;|\s*$)/i;
const WHITESPACE_SPLIT_RE = /\s+/;

function isCssEmpty(el: Element): boolean {
	for (let node = el.firstChild; node; node = node.nextSibling) {
		if (node.nodeType === 1) return false;
		if (node.nodeType === 3 && (node.nodeValue || '').length > 0) return false;
	}
	return true;
}

function isOrContainsMath(el: Element): boolean {
	if (el.tagName.toUpperCase() === 'MATH' || el.hasAttribute('data-mathml')) return true;
	const cls = el.getAttribute('class');
	if (cls && cls.includes('katex-mathml') && el.classList?.contains('katex-mathml')) return true;
	for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
		if (isOrContainsMath(child)) return true;
	}
	return false;
}

export function removeHiddenElements(doc: Document | Element, debug: boolean, debugRemovals?: DebugRemoval[]) {
	let count = 0;
	const elementsToRemove = new Map<Element, string>();

	// Only use getComputedStyle in browser environments where it's meaningful.
	// In JSDOM/linkedom without stylesheets, it's extremely slow and unreliable.
	const defaultView = ('defaultView' in doc ? doc.defaultView : doc.ownerDocument?.defaultView) ?? null;
	const isBrowser = typeof window !== 'undefined' && defaultView === window;

	const getHiddenReason = (element: Element): string => {
		// Check inline style for hidden patterns
		const style = element.getAttribute('style');
		if (style && HIDDEN_STYLE_PATTERN.test(style)) {
			return style.includes('display') ? 'display:none' :
				style.includes('visibility') ? 'visibility:hidden' : 'opacity:0';
		}

		// Use getComputedStyle only in real browser environments
		if (isBrowser) {
			try {
				const computedStyle = defaultView!.getComputedStyle(element);
				if (computedStyle.display === 'none') return 'display:none';
				if (computedStyle.visibility === 'hidden') return 'visibility:hidden';
				if (computedStyle.opacity === '0') return 'opacity:0';
			} catch (e) {}
		}

		// Detect CSS framework hidden utilities (e.g. Tailwind's "hidden",
		// "sm:hidden", "not-machine:hidden")
		const className = element.getAttribute('class');
		if (className && (className.includes('hidden') || className.includes('invisible'))) {
			if (hasResponsiveShowClass(className)) return '';
			const tokens = className.split(WHITESPACE_SPLIT_RE);

			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i];
				// empty:hidden only hides elements matching :empty.
				if (token.endsWith(':hidden') && token.split(':').includes('empty') &&
					!isCssEmpty(element)) continue;

				// Match exact "hidden"/"invisible" and variant prefixes like
				// "sm:hidden", "lg:invisible". Skip Tailwind arbitrary variants
				// containing "[" (e.g. "[&_.class]:hidden", "group-[.state]:hidden")
				// — those are conditional state selectors, not unconditional hiding.
				const isExact = token === 'hidden' || token === 'invisible';
				const isVariant = !token.includes('[') &&
					(token.endsWith(':hidden') || token.endsWith(':invisible'));

				if (isExact || isVariant) {
					return `class:${token}`;
				}
			}
		}

		return '';
	};

	// Walk the DOM directly, checking hiddenness before math protection so
	// visible elements never scan their subtrees for math.
	const visit = (element: Element): void => {
		const reason = getHiddenReason(element);
		if (reason) {
			// Skip elements that contain math — sites like Wikipedia wrap MathML
			// in display:none spans for accessibility (the visible version is an
			// image/SVG fallback). We need to preserve these for math extraction.
			if (!isOrContainsMath(element)) {
				elementsToRemove.set(element, reason);
				count++;
				// Outside debug mode, descendants will be removed along with this element.
				if (!debug) return;
			}
		}
		for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
			visit(child);
		}
	};

	if ('documentElement' in doc) {
		const root = doc.documentElement;
		if (root) visit(root);
	} else {
		for (let child = doc.firstElementChild; child; child = child.nextElementSibling) {
			visit(child);
		}
	}

	// Batch remove all hidden elements
	elementsToRemove.forEach((reason, el) => {
		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeHiddenElements',
				reason,
				text: textPreview(el)
			});
		}
		el.remove();
	});
	logDebug(debug, 'Removed hidden elements:', count);
}
