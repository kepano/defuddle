import { DebugRemoval } from '../types';
import { textPreview, logDebug } from '../utils';
import { hasResponsiveShowClass } from '../utils/dom';

export function removeHiddenElements(doc: Document, debug: boolean, debugRemovals?: DebugRemoval[]) {
	let count = 0;
	const elementsToRemove = new Map<Element, string>();

	// Check inline styles and CSS class-based hidden patterns.
	const hiddenStylePattern = /(?:^|;\s*)(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*;|\s*$)/i;

	// Only use getComputedStyle in browser environments where it's meaningful.
	// In JSDOM/linkedom without stylesheets, it's extremely slow and unreliable.
	const defaultView = doc.defaultView;
	const isBrowser = typeof window !== 'undefined' && defaultView === window;

	const allElements = doc.querySelectorAll('*');
	for (const element of allElements) {
		// Skip elements that contain math — sites like Wikipedia wrap MathML
		// in display:none spans for accessibility (the visible version is an
		// image/SVG fallback). We need to preserve these for math extraction.
		if (element.querySelector('math, [data-mathml], .katex-mathml') ||
			element.tagName.toLowerCase() === 'math') {
			continue;
		}

		// Check inline style for hidden patterns
		const style = element.getAttribute('style');
		if (style && hiddenStylePattern.test(style)) {
			const reason = style.includes('display') ? 'display:none' :
				style.includes('visibility') ? 'visibility:hidden' : 'opacity:0';
			elementsToRemove.set(element, reason);
			count++;
			continue;
		}

		// Use getComputedStyle only in real browser environments
		if (isBrowser) {
			try {
				const computedStyle = defaultView!.getComputedStyle(element);
				let reason = '';
				if (computedStyle.display === 'none') reason = 'display:none';
				else if (computedStyle.visibility === 'hidden') reason = 'visibility:hidden';
				else if (computedStyle.opacity === '0') reason = 'opacity:0';
				if (reason) {
					elementsToRemove.set(element, reason);
					count++;
					continue;
				}
			} catch (e) {}
		}

		// Detect CSS framework hidden utilities (e.g. Tailwind's "hidden",
		// "sm:hidden", "not-machine:hidden")
		const className = element.getAttribute('class') || '';
		if (className) {
			const tokens = className.split(/\s+/);
			if (hasResponsiveShowClass(className)) continue;

			for (const token of tokens) {
				if (token === 'hidden' || token === 'invisible' ||
					token.endsWith(':hidden') || token.endsWith(':invisible')) {
					elementsToRemove.set(element, `class:${token}`);
					count++;
					break;
				}
			}
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
