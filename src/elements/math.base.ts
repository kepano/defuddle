import { parseHTML, getClassName } from '../utils/dom';
import { isTextNode, isElement } from '../utils';

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
		const doc = el.ownerDocument || document;
		const fragment = parseHTML(doc, mathmlStr);
		const mathElement = fragment.querySelector('math');
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

	// For <math> elements, textContent gives clean Unicode (e.g. "f′", "a~")
	// Only safe for <math> — other containers (mjx-container, .katex) have garbage textContent
	if (el.tagName.toLowerCase() === 'math' && el.textContent?.trim()) {
		return el.textContent.trim();
	}

	// Fallback to alt text only
	return el.getAttribute('alt') || null;
};

export const isBlockDisplay = (el: Element): boolean => {
	// Check explicit display attribute
	const displayAttr = el.getAttribute('display');
	if (displayAttr === 'block') {
		return true;
	}

	// Check common class names
	const classNames = getClassName(el).toLowerCase();
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

	// Check parent container display attribute
	const parentContainer = el.closest('[display]');
	if (parentContainer) {
		return parentContainer.getAttribute('display') === 'true';
	}

	return false;
};

// Cheap presence check before running the full mathSelectors scan.
// Must remain a subset of mathSelectors — every selector here should also appear there.
export const mathFastCheck = 'math, mjx-container, .MathJax, .katex, img.latex, [data-math], [data-latex], script[type^="math/"]';

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

/**
 * Check whether the document includes a MathJax or KaTeX library script.
 * This is used as a gate so we only scan for raw `$`-delimited LaTeX on
 * pages that are known to use a math rendering library.
 */
function hasMathLibrary(doc: Document): boolean {
	// Check for MathJax/KaTeX script src
	const scripts = Array.from(doc.querySelectorAll('script[src]'));
	for (const s of scripts) {
		const src = (s.getAttribute('src') || '').toLowerCase();
		if (src.includes('mathjax') || src.includes('katex')) return true;
	}
	// Check for MathJax config objects
	const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])'));
	for (const s of inlineScripts) {
		const text = s.textContent || '';
		if (/MathJax\s*[.=]/.test(text) || /katex/i.test(text)) return true;
	}
	return false;
}

// Combined regex for LaTeX delimiters. Ordered so longer/greedier
// delimiters match first: $$…$$, \[…\], $…$, \(…\).
const LATEX_DELIM_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^\s$][^$]*[^\s$]|[^\s$])\$|\\\(([\s\S]+?)\\\)/g;

const LATEX_CMD_RE = /\\[a-zA-Z]/;
const LATEX_STRUCT_RE = /[_^{}]/;

function containsLatexCommand(s: string): boolean {
	return LATEX_CMD_RE.test(s) || LATEX_STRUCT_RE.test(s);
}

const RAW_LATEX_SKIP_TAGS = new Set(['PRE', 'CODE', 'SCRIPT', 'STYLE', 'MATH', 'SVG', 'TEXTAREA']);

type LatexPart = string | { latex: string; isBlock: boolean };

/**
 * Scan text nodes inside `element` for raw LaTeX delimiters (`$...$`,
 * `$$...$$`, `\(...\)`, `\[...\]`) and wrap each match in a `<math>`
 * element so the existing math pipeline can process them.
 *
 * Only runs when a MathJax or KaTeX script tag is present in the document,
 * to avoid false positives on pages that use `$` for currency.
 */
export function wrapRawLatexDelimiters(element: Element, doc: Document): void {
	if (!hasMathLibrary(doc)) return;

	// Skip if the page already has rendered math elements — the normal
	// math pipeline will handle those.
	if (element.querySelector(mathFastCheck)) return;

	const textNodes: Text[] = [];

	function walk(node: Node): void {
		if (isElement(node) && RAW_LATEX_SKIP_TAGS.has(node.tagName)) return;
		if (isTextNode(node)) {
			textNodes.push(node);
		} else {
			for (let child = node.firstChild; child; child = child.nextSibling) {
				walk(child);
			}
		}
	}
	walk(element);

	for (const textNode of textNodes) {
		const text = textNode.textContent || '';
		if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) continue;

		// First pass: collect all valid LaTeX matches (block display TBD)
		const parts: LatexPart[] = [];
		let lastIndex = 0;
		let hasBlockMath = false;

		LATEX_DELIM_RE.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = LATEX_DELIM_RE.exec(text)) !== null) {
			// Groups: 1=$$…$$, 2=\[…\], 3=$…$, 4=\(…\)
			const blockContent = match[1] ?? match[2];
			const inlineContent = match[3] ?? match[4];
			const isBlock = blockContent !== undefined;
			const latex = (blockContent ?? inlineContent).trim();
			// Backslash delimiters (\[…\], \(…\)) are unambiguous math markers.
			// Dollar delimiters need the heuristic to avoid matching currency.
			const isBackslashDelim = match[2] !== undefined || match[4] !== undefined;
			if (!isBackslashDelim && !containsLatexCommand(latex)) continue;

			if (lastIndex < match.index) {
				parts.push(text.slice(lastIndex, match.index));
			}
			if (isBlock) hasBlockMath = true;
			parts.push({ latex, isBlock });
			lastIndex = match.index + match[0].length;
		}

		if (parts.length === 0) continue;
		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		// Determine if $$...$$ should be forced inline: block only when
		// the text node is the sole content of its parent paragraph.
		if (hasBlockMath) {
			const hasSurroundingText = parts.some(p => typeof p === 'string' && p.trim().length > 0);
			const parent = textNode.parentElement;
			const parentHasOtherContent = parent ? Array.from(parent.childNodes).some(
				n => n !== textNode && ((isTextNode(n) && (n.textContent || '').trim().length > 0) || isElement(n))
			) : false;

			if (hasSurroundingText || parentHasOtherContent) {
				for (const part of parts) {
					if (typeof part !== 'string') part.isBlock = false;
				}
			}
		}

		const frag = doc.createDocumentFragment();
		for (const part of parts) {
			if (typeof part === 'string') {
				frag.appendChild(doc.createTextNode(part));
			} else {
				const mathEl = doc.createElement('math');
				mathEl.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
				mathEl.setAttribute('display', part.isBlock ? 'block' : 'inline');
				mathEl.setAttribute('data-latex', part.latex);
				mathEl.textContent = part.latex;
				frag.appendChild(mathEl);
			}
		}
		textNode.replaceWith(frag);
	}
}
