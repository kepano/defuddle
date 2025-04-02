export interface MathData {
	mathml: string;
	latex: string | null;
	isBlock: boolean;
}

export const getMathMLFromElement = (el: Element): MathData | null => {
	// 1. Direct MathML content
	if (el.tagName.toLowerCase() === 'math') {
		const isBlock = el.getAttribute('display') === 'block';
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
			return {
				mathml: mathElement.outerHTML,
				latex: mathElement.getAttribute('alttext') || null,
				isBlock
			};
		}
	}

	// 3. MathJax assistive MathML
	const assistiveMmlContainer = el.querySelector('.MJX_Assistive_MathML, mjx-assistive-mml');
	
	if (assistiveMmlContainer) {
		const mathElement = assistiveMmlContainer.querySelector('math');
		
		if (mathElement) {
			// Check both the math element and container for display mode
			const mathDisplayAttr = mathElement.getAttribute('display');
			const containerDisplayAttr = assistiveMmlContainer.getAttribute('display');		 
			const isBlock = mathDisplayAttr === 'block' || containerDisplayAttr === 'block';
			
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
		return {
			mathml: katexMathml.outerHTML,
			latex: null, // We'll get LaTeX separately for KaTeX
			isBlock: false // We'll determine this from container
		};
	}

	return null;
};

export const getBasicLatexFromElement = (el: Element): string | null => {
	// Direct data-latex attribute
	const dataLatex = el.getAttribute('data-latex');
	if (dataLatex) {
		return dataLatex;
	}

	// WordPress LaTeX images
	if (el.tagName.toLowerCase() === 'img' && el.classList.contains('latex')) {
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

	// LaTeX in annotation
	const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
	if (annotation?.textContent) {
		return annotation.textContent.trim();
	}

	// KaTeX formats
	if (el.matches('.katex')) {
		const katexAnnotation = el.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
		if (katexAnnotation?.textContent) {
			return katexAnnotation.textContent.trim();
		}
	}

	// MathJax scripts
	if (el.matches('script[type="math/tex"]') || el.matches('script[type="math/tex; mode=display"]')) {
		return el.textContent?.trim() || null;
	}

	// Check for sibling script element
	if (el.parentElement) {
		const siblingScript = el.parentElement.querySelector('script[type="math/tex"], script[type="math/tex; mode=display"]');
		if (siblingScript) {
			return siblingScript.textContent?.trim() || null;
		}
	}

	// Fallback to alt text or text content
	return el.getAttribute('alt') || el.textContent?.trim() || null;
};

export const isBlockDisplay = (el: Element): boolean => {
	// Check explicit display attribute
	const displayAttr = el.getAttribute('display');
	if (displayAttr === 'block') {
		return true;
	}

	// Check common class names
	const classNames = el.className.toLowerCase();
	if (classNames.includes('display') || classNames.includes('block')) {
		return true;
	}

	// Check container classes
	const container = el.closest('.katex-display, .MathJax_Display, [data-display="block"]');
	if (container) {
		return true;
	}

	// Check if preceded by block element
	const prevElement = el.previousElementSibling;
	if (prevElement?.tagName.toLowerCase() === 'p') {
		return true;
	}

	// Check specific formats
	if (el.matches('.mwe-math-fallback-image-display')) {
		return true;
	}

	// Check KaTeX display mode
	if (el.matches('.katex')) {
		// KaTeX elements are inline by default
		// Only block if explicitly marked as display
		return el.closest('.katex-display') !== null;
	}

	// Check MathJax v3 display attribute
	if (el.hasAttribute('display')) {
		return el.getAttribute('display') === 'true';
	}

	// Check MathJax script display attribute
	if (el.matches('script[type="math/tex; mode=display"]')) {
		return true;
	}

	if (el.hasAttribute('display')) {
		return el.getAttribute('display') === 'true';
	}

	// Check parent container display attribute
	const parentContainer = el.closest('[display]');
	if (parentContainer) {
		return parentContainer.getAttribute('display') === 'true';
	}

	return false;
};

// Shared selector for math elements
export const mathSelectors = [
	// WordPress LaTeX images
	'img.latex[src*="latex.php"]',

	// MathJax elements (v2 and v3)
	'span.MathJax',
	'mjx-container',
	'script[type="math/tex"]',
	'script[type="math/tex; mode=display"]',
	'.MathJax_Preview + script[type="math/tex"]',
	'.MathJax_Display',
	'.MathJax_SVG',
	'.MathJax_MathML',

	// MediaWiki math elements
	'.mwe-math-element',
	'.mwe-math-fallback-image-inline',
	'.mwe-math-fallback-image-display',
	'.mwe-math-mathml-inline',
	'.mwe-math-mathml-display',

	// KaTeX elements
	'.katex',
	'.katex-display',
	'.katex-mathml',
	'.katex-html',
	'[data-katex]',
	'script[type="math/katex"]',

	// Generic math elements and other formats
	'math',
	'[data-math]',
	'[data-latex]',
	'[data-tex]',
	'script[type^="math/"]',
	'annotation[encoding="application/x-tex"]'
].join(','); 