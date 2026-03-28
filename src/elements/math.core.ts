import {
	MathData,
	getMathMLFromElement,
	getBasicLatexFromElement as getLatexFromElement,
	isBlockDisplay,
	mathSelectors,
	mathFastCheck
} from './math.base';
import { parseHTML, transferContent } from '../utils/dom';

export const createCleanMathEl = (doc: Document, mathData: MathData | null, latex: string | null, isBlock: boolean): Element => {
	const cleanMathEl = doc.createElement('math');

	cleanMathEl.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
	cleanMathEl.setAttribute('display', isBlock ? 'block' : 'inline');
	cleanMathEl.setAttribute('data-latex', latex || '');

	// First try to use existing MathML content
	if (mathData?.mathml) {
		const fragment = parseHTML(doc, mathData.mathml);
		const mathContent = fragment.querySelector('math');
		if (mathContent) {
			transferContent(mathContent, cleanMathEl);
		}
	}
	// If no MathML content but we have LaTeX, store it as text content
	else if (latex) {
		cleanMathEl.textContent = latex;
	}

	return cleanMathEl;
};

function hasHTMLElementProps(el: Element): boolean {
	return 'classList' in el && 'getAttribute' in el && 'querySelector' in el;
}

// Find math elements
export const mathRules = [
	{
		selector: mathSelectors,
		element: 'math',
		fastCheck: mathFastCheck,
		transform: (el: Element, doc: Document): Element => {
			if (!hasHTMLElementProps(el)) return el;

			const mathData = getMathMLFromElement(el);
			const latex = getLatexFromElement(el);
			const isBlock = isBlockDisplay(el);
			const cleanMathEl = createCleanMathEl(doc, mathData, latex, isBlock);

			// Clean up any associated math scripts after we've extracted their content.
			// Skip when el itself is a math script — it will be replaced by the
			// caller, and removing siblings here would destroy unprocessed scripts.
			if (el.parentElement && !el.matches('script[type^="math/"]')) {
				const mathElements = el.parentElement.querySelectorAll(
					'script[type^="math/"], .MathJax_Preview, script[type="text/javascript"][src*="mathjax"], script[type="text/javascript"][src*="katex"]'
				);
				mathElements.forEach(el => el.remove());
			}

			return cleanMathEl;
		}
	}
]; 