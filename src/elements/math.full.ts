import { MathMLToLaTeX } from 'mathml-to-latex';
import * as temml from 'temml';
import {
	MathData,
	getMathMLFromElement,
	getBasicLatexFromElement,
	isBlockDisplay,
	mathSelectors
} from './math.base';

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
		const tempDiv = doc.createElement('div');
		tempDiv.innerHTML = mathData.mathml;
		const mathContent = tempDiv.querySelector('math');
		if (mathContent) {
			cleanMathEl.innerHTML = mathContent.innerHTML;
		}
	}
	// If no MathML but we have LaTeX, convert it
	else if (latex) {
		try {
			const mathml = temml.renderToString(latex, {
				displayMode: isBlock,
				throwOnError: false
			});
			const tempDiv = doc.createElement('div');
			tempDiv.innerHTML = mathml;
			const mathContent = tempDiv.querySelector('math');
			if (mathContent) {
				cleanMathEl.innerHTML = mathContent.innerHTML;
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
		transform: (el: Element): Element => {
			// Check if element is an HTMLElement by checking for common properties
			if (!('style' in el) || !('className' in el)) {
				return el;
			}

			const mathData = getMathMLFromElement(el);
			const latex = getLatexFromElement(el);
			const isBlock = isBlockDisplay(el);
			const cleanMathEl = createCleanMathEl(mathData, latex, isBlock, el.ownerDocument);

			// Clean up any associated math scripts after we've extracted their content
			if (el.parentElement) {
				// Remove all math-related scripts and previews
				const mathElements = el.parentElement.querySelectorAll(
					'script[type^="math/"], .MathJax_Preview, script[type="text/javascript"][src*="mathjax"], script[type="text/javascript"][src*="katex"]'
				);
				mathElements.forEach(el => el.remove());
			}

			return cleanMathEl;
		}
	}
]; 