import { MathMLToLaTeX } from 'mathml-to-latex';
import * as temml from 'temml';

export interface MathData {
	mathml: string;
	latex: string | null;
	isBlock: boolean;
}

export const getMathMLFromElement = (el: Element): MathData | null => {
	console.log('getMathMLFromElement input:', el.outerHTML);

	// 1. Direct MathML content
	if (el.tagName.toLowerCase() === 'math') {
		const isBlock = el.getAttribute('display') === 'block';
		console.log('Direct MathML - isBlock:', isBlock);
		return {
			mathml: el.outerHTML,
			latex: el.getAttribute('alttext') || null,
			isBlock
		};
	}

	// 2. MathML in data-mathml attribute
	const mathmlStr = el.getAttribute('data-mathml');
	if (mathmlStr) {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = mathmlStr;
		const mathElement = tempDiv.querySelector('math');
		if (mathElement) {
			const isBlock = mathElement.getAttribute('display') === 'block';
			console.log('data-mathml - isBlock:', isBlock);
			return {
				mathml: mathElement.outerHTML,
				latex: mathElement.getAttribute('alttext') || null,
				isBlock
			};
		}
	}

	// 3. MathJax assistive MathML
	const assistiveMmlContainer = el.querySelector('.MJX_Assistive_MathML, mjx-assistive-mml');
	console.log('Found assistiveMmlContainer:', assistiveMmlContainer?.outerHTML);
	
	if (assistiveMmlContainer) {
		const mathElement = assistiveMmlContainer.querySelector('math');
		console.log('Found mathElement:', mathElement?.outerHTML);
		
		if (mathElement) {
			// Check both the math element and container for display mode
			const mathDisplayAttr = mathElement.getAttribute('display');
			const containerDisplayAttr = assistiveMmlContainer.getAttribute('display');
			console.log('Math display attribute:', mathDisplayAttr);
			console.log('Container display attribute:', containerDisplayAttr);
			
			const isBlock = mathDisplayAttr === 'block' || containerDisplayAttr === 'block';
			console.log('Final isBlock determination:', isBlock);
			
			return {
				mathml: mathElement.outerHTML,
				latex: mathElement.getAttribute('alttext') || null,
				isBlock
			};
		}
	}

	// 4. KaTeX MathML
	const katexMathml = el.querySelector('.katex-mathml math');
	if (katexMathml) {
		console.log('KaTeX MathML found');
		return {
			mathml: katexMathml.outerHTML,
			latex: null, // We'll get LaTeX separately for KaTeX
			isBlock: false // We'll determine this from container
		};
	}

	console.log('No MathML found');
	return null;
};

export const getLatexFromElement = (el: Element): string | null => {
	// 1. Direct data-latex attribute
	const dataLatex = el.getAttribute('data-latex');
	if (dataLatex) {
		return dataLatex;
	}

	// 2. WordPress LaTeX images
	if (el instanceof HTMLImageElement && el.classList.contains('latex')) {
		// Try alt text first as it's cleaner
		const altLatex = el.getAttribute('alt');
		if (altLatex) {
			return altLatex;
		}
		
		// Fallback to extracting from URL
		const src = el.getAttribute('src');
		if (src) {
			const match = src.match(/latex\.php\?latex=([^&]+)/);
			if (match) {
				return decodeURIComponent(match[1])
					.replace(/\+/g, ' ') // Replace + with spaces
					.replace(/%5C/g, '\\'); // Fix escaped backslashes
			}
		}
	}

	// 3. LaTeX in annotation
	const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
	if (annotation?.textContent) {
		return annotation.textContent.trim();
	}

	// 4. KaTeX specific formats
	if (el.matches('.katex')) {
		// Try katex-mathml annotation first
		const katexAnnotation = el.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
		if (katexAnnotation?.textContent) {
			return katexAnnotation.textContent.trim();
		}
	}

	// 5. MathJax specific formats
	if (el.matches('script[type="math/tex"]')) {
		return el.textContent?.trim() || null;
	}

	// 6. Try to convert MathML to LaTeX as last resort
	const mathml = getMathMLFromElement(el);
	if (mathml?.mathml) {
		try {
			return MathMLToLaTeX.convert(mathml.mathml);
		} catch (error) {
			console.error('Error converting MathML to LaTeX:', error);
			return null;
		}
	}

	// 7. Fallback to alt text or text content
	return el.getAttribute('alt') || el.textContent?.trim() || null;
};

export const isBlockMath = (el: Element): boolean => {
	console.log('isBlockMath checking element:', el.outerHTML);

	// 1. Check explicit display attribute
	const displayAttr = el.getAttribute('display');
	console.log('display attribute:', displayAttr);
	if (displayAttr === 'block') {
		return true;
	}

	// 2. Check common class names
	const classNames = el.className.toLowerCase();
	console.log('class names:', classNames);
	if (classNames.includes('display') || classNames.includes('block')) {
		return true;
	}

	// 3. Check container classes
	const container = el.closest('.katex-display, .MathJax_Display, [data-display="block"]');
	console.log('container found:', container?.outerHTML);
	if (container) {
		return true;
	}

	// 4. Check if preceded by block element
	const prevElement = el.previousElementSibling;
	console.log('previous element:', prevElement?.outerHTML);
	if (prevElement?.tagName.toLowerCase() === 'p') {
		return true;
	}

	// 5. Check specific formats
	if (el.matches('.mwe-math-fallback-image-display')) {
		return true;
	}

	// 6. Check KaTeX display mode
	if (el.matches('.katex')) {
		// KaTeX elements are inline by default
		// Only block if explicitly marked as display
		return el.closest('.katex-display') !== null;
	}

	// 7. Check MathJax v3 display attribute
	if (el.hasAttribute('display')) {
		console.log('Found display attribute:', el.getAttribute('display'));
		return el.getAttribute('display') === 'true';
	}

	// 8. Check parent container display attribute
	const parentContainer = el.closest('[display]');
	if (parentContainer) {
		console.log('Parent container display:', parentContainer.getAttribute('display'));
		return parentContainer.getAttribute('display') === 'true';
	}

	return false;
};

export const createStandardMathElement = (mathData: MathData | null, latex: string | null, isBlock: boolean): Element => {
	console.log('createStandardMathElement inputs:', {
		mathData,
		latex,
		isBlock
	});

	const newMath = document.createElement('math');

	// Set display mode
	newMath.setAttribute('display', isBlock ? 'block' : 'inline');

	// Set LaTeX if available
	if (latex) {
		newMath.setAttribute('data-latex', latex);
	}

	// First try to use existing MathML content
	if (mathData?.mathml) {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = mathData.mathml;
		const mathContent = tempDiv.querySelector('math');
		if (mathContent) {
			newMath.innerHTML = mathContent.innerHTML;
		}
	}
	// If no MathML content but we have LaTeX, convert using Temml
	else if (latex) {
		try {
			console.log('Converting LaTeX to MathML:', latex);
			
			// Convert LaTeX to MathML using Temml
			const mathml = temml.renderToString(latex, {
				displayMode: isBlock,
				throwOnError: false
			});
			console.log('Temml conversion result:', mathml);
			
			if (typeof mathml === 'string') {
				// Extract the inner content of the math element
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = mathml;
				const mathContent = tempDiv.querySelector('math');
				if (mathContent) {
					// Copy attributes except display mode
					Array.from(mathContent.attributes).forEach(attr => {
						if (attr.name !== 'display') {
							newMath.setAttribute(attr.name, attr.value);
						}
					});
					newMath.innerHTML = mathContent.innerHTML;
				} else {
					// Use the entire output as fallback
					newMath.innerHTML = mathml;
				}
			} else {
				newMath.textContent = latex;
			}
		} catch (error) {
			console.error('Error converting LaTeX to MathML:', error);
			newMath.textContent = latex;
		}
	}

	console.log('Created math element:', newMath.outerHTML);
	return newMath;
};

// Math element standardization rules
export const mathStandardizationRules = [
	{
		// WordPress LaTeX images
		selector: 'img.latex[src*="latex.php"]',
		element: 'math',
		transform: (el: Element): Element => {
			if (!(el instanceof HTMLImageElement)) return el;

			// Get LaTeX formula
			const latex = getLatexFromElement(el);
			
			// WordPress LaTeX images are inline by default
			const isBlock = isBlockMath(el);
			
			// Create standardized math element without MathML
			return createStandardMathElement(null, latex, isBlock);
		}
	},
	{
		// MathJax elements (v2 and v3)
		selector: [
			'span.MathJax',
			'mjx-container',
			'script[type="math/tex"]',
			'script[type="math/tex; mode=display"]',
			'.MathJax_Preview + script[type="math/tex"]',
			'.MathJax_Display',
			'.MathJax_SVG',
			'.MathJax_MathML'
		].join(','),
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
		selector: [
			'.mwe-math-element',
			'.mwe-math-fallback-image-inline',
			'.mwe-math-fallback-image-display',
			'.mwe-math-mathml-inline',
			'.mwe-math-mathml-display',
			'math[xmlns="http://www.w3.org/1998/Math/MathML"]'
		].join(','),
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
		selector: [
			'.katex',
			'.katex-display',
			'.katex-mathml',
			'.katex-html',
			'[data-katex]',
			'script[type="math/katex"]'
		].join(','),
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
		selector: [
			'math',
			'[data-math]',
			'[data-latex]',
			'[data-tex]',
			'script[type^="math/"]',
			'annotation[encoding="application/x-tex"]'
		].join(','),
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