import { MathMLToLaTeX } from 'mathml-to-latex';
import {
	MathData,
	getMathMLFromElement,
	getBasicLatexFromElement,
	isBlockDisplay,
	mathSelectors,
	mathFastCheck
} from './math.base';
import { parseHTML, transferContent } from '../utils/dom';

export const getLatexFromElement = (el: Element): string | null => {
	// First try basic LaTeX extraction
	const basicLatex = getBasicLatexFromElement(el);
	if (basicLatex) {
		return basicLatex;
	}

	// If no LaTeX found but we have MathML, convert it
	const mathData = getMathMLFromElement(el);
	if (mathData?.mathml) {
		try {
			return MathMLToLaTeX.convert(mathData.mathml);
		} catch (e) {
			console.warn('Failed to convert MathML to LaTeX:', e);
		}
	}

	return null;
};

export const createCleanMathEl = (mathData: MathData | null, latex: string | null, isBlock: boolean, doc: Document): Element => {
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
	// If no MathML but we have LaTeX, convert it
	else if (latex) {
		try {
			const temml = require('temml');
			const mathml = temml.renderToString(latex, {
				displayMode: isBlock,
				throwOnError: false
			});
			const fragment = parseHTML(doc, mathml);
			const mathContent = fragment.querySelector('math');
			if (mathContent) {
				while (mathContent.firstChild) {
					cleanMathEl.appendChild(mathContent.firstChild);
				}
			} else {
				cleanMathEl.textContent = latex; // Fallback to LaTeX as text
			}
		} catch (e) {
			console.warn('Failed to convert LaTeX to MathML:', e);
			cleanMathEl.textContent = latex; // Fallback to LaTeX as text
		}
	}

	return cleanMathEl;
};

export const mathRules = [
	{
		selector: mathSelectors,
		element: 'math',
		fastCheck: mathFastCheck,
		transform: (el: Element): Element => {
			if (!('classList' in el) || !('getAttribute' in el) || !('querySelector' in el)) {
				return el;
			}

			const mathData = getMathMLFromElement(el);
			const latex = getLatexFromElement(el);
			const isBlock = isBlockDisplay(el);
			const cleanMathEl = createCleanMathEl(mathData, latex, isBlock, el.ownerDocument);

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