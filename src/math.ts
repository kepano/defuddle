import { MathMLToLaTeX } from 'mathml-to-latex';

export interface MathData {
	mathml: string;
	latex: string | null;
	isBlock: boolean;
}

export const getMathMLFromElement = (el: Element): MathData | null => {
	// 1. Direct MathML content
	if (el.tagName.toLowerCase() === 'math') {
		return {
			mathml: el.outerHTML,
			latex: el.getAttribute('alttext') || null,
			isBlock: el.getAttribute('display') === 'block'
		};
	}

	// 2. MathML in data-mathml attribute
	const mathmlStr = el.getAttribute('data-mathml');
	if (mathmlStr) {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = mathmlStr;
		const mathElement = tempDiv.querySelector('math');
		if (mathElement) {
			return {
				mathml: mathElement.outerHTML,
				latex: mathElement.getAttribute('alttext') || null,
				isBlock: mathElement.getAttribute('display') === 'block'
			};
		}
	}

	// 3. MathJax assistive MathML
	const assistiveMml = el.querySelector('.MJX_Assistive_MathML math, mjx-assistive-mml math');
	if (assistiveMml) {
		return {
			mathml: assistiveMml.outerHTML,
			latex: assistiveMml.getAttribute('alttext') || null,
			isBlock: assistiveMml.getAttribute('display') === 'block'
		};
	}

	// 4. KaTeX MathML
	const katexMathml = el.querySelector('.katex-mathml math');
	if (katexMathml) {
		return {
			mathml: katexMathml.outerHTML,
			latex: null, // We'll get LaTeX separately for KaTeX
			isBlock: false // We'll determine this from container
		};
	}

	return null;
};

export const getLatexFromElement = (el: Element): string | null => {
	// 1. Direct data-latex attribute
	const dataLatex = el.getAttribute('data-latex');
	if (dataLatex) {
		return dataLatex;
	}

	// 2. LaTeX in annotation
	const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
	if (annotation?.textContent) {
		return annotation.textContent.trim();
	}

	// 3. KaTeX specific formats
	if (el.matches('.katex')) {
		// Try katex-mathml annotation first
		const katexAnnotation = el.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
		if (katexAnnotation?.textContent) {
			return katexAnnotation.textContent.trim();
		}
	}

	// 4. MathJax specific formats
	if (el.matches('script[type="math/tex"]')) {
		return el.textContent?.trim() || null;
	}

	// 5. Try to convert MathML to LaTeX as last resort
	const mathml = getMathMLFromElement(el);
	if (mathml?.mathml) {
		try {
			return MathMLToLaTeX.convert(mathml.mathml);
		} catch (error) {
			console.error('Error converting MathML to LaTeX:', error);
			return null;
		}
	}

	// 6. Fallback to alt text or text content
	return el.getAttribute('alt') || el.textContent?.trim() || null;
};

export const isBlockMath = (el: Element): boolean => {
	// 1. Check explicit display attribute
	if (el.getAttribute('display') === 'block') {
		return true;
	}

	// 2. Check common class names
	const classNames = el.className.toLowerCase();
	if (classNames.includes('display') || classNames.includes('block')) {
		return true;
	}

	// 3. Check container classes
	const container = el.closest('.katex-display, .MathJax_Display, [data-display="block"]');
	if (container) {
		return true;
	}

	// 4. Check if preceded by block element
	const prevElement = el.previousElementSibling;
	if (prevElement?.tagName.toLowerCase() === 'p') {
		return true;
	}

	// 5. Check specific formats
	if (el.matches('.mwe-math-fallback-image-display')) {
		return true;
	}

	// 6. Check if not explicitly inline
	if (el.matches('.katex')) {
		return !el.classList.contains('math-inline');
	}

	return false;
};

export const createStandardMathElement = (mathData: MathData | null, latex: string | null, isBlock: boolean): Element => {
	const newMath = document.createElement('math');

	// Set display mode
	newMath.setAttribute('display', isBlock ? 'block' : 'inline');

	// Set LaTeX if available
	if (latex) {
		newMath.setAttribute('data-latex', latex);
	}

	// Copy MathML content if available
	if (mathData?.mathml) {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = mathData.mathml;
		const mathContent = tempDiv.querySelector('math');
		if (mathContent) {
			newMath.innerHTML = mathContent.innerHTML;
		}
	}

	return newMath;
};

// Math element standardization rules
export const mathStandardizationRules = [
	{
		// MathJax elements (v2 and v3)
		selector: `
			span.MathJax,
			mjx-container,
			script[type="math/tex"],
			script[type="math/tex; mode=display"],
			.MathJax_Preview + script[type="math/tex"],
			.MathJax_Display,
			.MathJax_SVG,
			.MathJax_MathML
		`.replace(/\s+/g, ','),
		element: 'math',
		transform: (el: Element): Element => {
			if (!(el instanceof HTMLElement)) return el;

			// Get MathML content
			const mathData = getMathMLFromElement(el);
			
			// Get LaTeX formula
			const latex = getLatexFromElement(el);
			
			// Determine display mode
			const isBlock = isBlockMath(el) || el.matches('script[type="math/tex; mode=display"]');
			
			// Create standardized math element
			return createStandardMathElement(mathData, latex, isBlock);
		}
	},
	{
		// MediaWiki math elements
		selector: `
			.mwe-math-element,
			.mwe-math-fallback-image-inline,
			.mwe-math-fallback-image-display,
			.mwe-math-mathml-inline,
			.mwe-math-mathml-display,
			math[xmlns="http://www.w3.org/1998/Math/MathML"]
		`.replace(/\s+/g, ','),
		element: 'math',
		transform: (el: Element): Element => {
			if (!(el instanceof HTMLElement)) return el;

			// Get MathML content
			const mathData = getMathMLFromElement(el);
			
			// Get LaTeX formula
			const latex = getLatexFromElement(el);
			
			// Determine display mode
			const isBlock = isBlockMath(el);
			
			// Create standardized math element
			return createStandardMathElement(mathData, latex, isBlock);
		}
	},
	{
		// KaTeX elements
		selector: `
			.katex,
			.katex-display,
			.katex-mathml,
			.katex-html,
			[data-katex],
			script[type="math/katex"]
		`.replace(/\s+/g, ','),
		element: 'math',
		transform: (el: Element): Element => {
			if (!(el instanceof HTMLElement)) return el;

			// Get MathML content
			const mathData = getMathMLFromElement(el);
			
			// Get LaTeX formula
			const latex = getLatexFromElement(el);
			
			// Determine display mode
			const isBlock = isBlockMath(el);
			
			// Create standardized math element
			return createStandardMathElement(mathData, latex, isBlock);
		}
	},
	{
		// Generic math elements and other formats
		selector: `
			math,
			[data-math],
			[data-latex],
			[data-tex],
			script[type^="math/"],
			annotation[encoding="application/x-tex"]
		`.replace(/\s+/g, ','),
		element: 'math',
		transform: (el: Element): Element => {
			if (!(el instanceof HTMLElement)) return el;

			// Get MathML content
			const mathData = getMathMLFromElement(el);
			
			// Get LaTeX formula
			const latex = getLatexFromElement(el);
			
			// Determine display mode
			const isBlock = isBlockMath(el);
			
			// Create standardized math element
			return createStandardMathElement(mathData, latex, isBlock);
		}
	}
]; 