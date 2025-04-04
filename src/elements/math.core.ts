import {
	MathData,
	getMathMLFromElement,
	getBasicLatexFromElement as getLatexFromElement,
	isBlockDisplay,
	mathSelectors
} from './math.base';

export const createCleanMathEl = (doc: Document, mathData: MathData | null, latex: string | null, isBlock: boolean): Element => {
	const cleanMathEl = doc.createElement('math');

	cleanMathEl.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
	cleanMathEl.setAttribute('display', isBlock ? 'block' : 'inline');
	cleanMathEl.setAttribute('data-latex', latex || '');

	// First try to use existing MathML content
	if (mathData?.mathml) {
		const tempDiv = doc.createElement('div');
		tempDiv.innerHTML = mathData.mathml;
		const mathContent = tempDiv.querySelector('math');
		if (mathContent) {
			cleanMathEl.innerHTML = mathContent.innerHTML;
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
		transform: (el: Element, doc: Document): Element => {
			if (!hasHTMLElementProps(el)) return el;

			const mathData = getMathMLFromElement(el);
			const latex = getLatexFromElement(el);
			const isBlock = isBlockDisplay(el);
			const cleanMathEl = createCleanMathEl(doc, mathData, latex, isBlock);

			// Clean up any associated math scripts after we've extracted their content
			if (el.parentElement) {
				// Remove all math-related scripts and previews
				const mathElements = el.parentElement.querySelectorAll(`
					/* MathJax scripts and previews */
					script[type^="math/"],
					.MathJax_Preview,

					/* External math library scripts */
					script[type="text/javascript"][src*="mathjax"],
					script[type="text/javascript"][src*="katex"]
				`);
				mathElements.forEach(el => el.remove());
			}

			return cleanMathEl;
		}
	}
]; 