import { parseHTML, getClassName } from '../utils/dom';
import { isTextNode, isElement } from '../utils';

export interface MathData {
	mathml: string;
	latex: string | null;
	isBlock: boolean;
}

// --- MathJax CHTML (mjx-*) → MathML reconstruction -------------------------
//
// When MathJax v3 renders with the CHTML output and the page ships no
// assistive MathML, the original `<math>` is gone from the live DOM and the
// only math content left is the `mjx-*` render tree. That tree mirrors MathML
// closely — token tags (`mjx-mi`, `mjx-mo`, …) and structural tags
// (`mjx-mfrac`, `mjx-msub`, …) map back by stripping the `mjx-` prefix, glyphs
// live in `mjx-c`, and the rest are layout wrappers. We rebuild a `<math>` so
// the normal MathML→LaTeX path can take over.

// Math glyphs use the Mathematical Alphanumeric Symbols block (𝑧, 𝜎, …); NFKC
// folds them back to plain letters (z, σ). Invisible operators (function
// application, invisible times/separator) carry no LaTeX and are dropped.
const INVISIBLE_MATH_CHARS = /[⁡⁢⁣⁤]/g;
const normalizeMathGlyphs = (s: string): string =>
	s.normalize('NFKC').replace(INVISIBLE_MATH_CHARS, '');

// Leaf token elements: their content is the (normalized) glyph text.
const MJX_TOKEN_TAGS = new Set(['mi', 'mo', 'mn', 'mtext', 'ms', 'mspace', 'mglyph']);
// Structural containers that map name-for-name and pass children through.
const MJX_STRUCTURAL_TAGS = new Set([
	'mrow', 'mstyle', 'mpadded', 'mphantom', 'menclose', 'merror',
	'mtable', 'mtr', 'mtd', 'mlabeledtr'
]);
// Layout-only artifacts that carry no math meaning.
const MJX_DROP_TAGS = new Set([
	'mjx-nstrut', 'mjx-dstrut', 'mjx-strut', 'mjx-line', 'mjx-spacer',
	'mjx-break', 'mjx-mark'
]);

const directChild = (node: Element, tag: string): Element | null => {
	for (const child of Array.from(node.children)) {
		if (child.tagName.toLowerCase() === tag) return child;
	}
	return null;
};

const flattenMjxChildren = (node: Element | null, doc: Document, skip?: Element | null): Node[] => {
	if (!node) return [];
	const out: Node[] = [];
	for (const child of Array.from(node.children)) {
		if (child === skip) continue;
		out.push(...convertMjxNode(child, doc));
	}
	return out;
};

// Collapse a role's parts into a single MathML node (MathML scripts/fractions
// expect exactly one node per slot); wrap multiples in an mrow.
const wrapParts = (parts: Node[], doc: Document): Node => {
	if (parts.length === 1) return parts[0];
	const mrow = doc.createElement('mrow');
	parts.forEach(p => mrow.appendChild(p));
	return mrow;
};

const buildEl = (name: string, children: Node[], doc: Document): Element => {
	const el = doc.createElement(name);
	children.forEach(c => el.appendChild(c));
	return el;
};

const convertMjxNode = (node: Element, doc: Document): Node[] => {
	const tag = node.tagName.toLowerCase();

	if (tag === 'mjx-c') {
		const text = normalizeMathGlyphs(node.textContent || '');
		return text ? [doc.createTextNode(text)] : [];
	}
	if (MJX_DROP_TAGS.has(tag)) return [];
	if (!tag.startsWith('mjx-')) return [];

	const name = tag.slice(4); // strip 'mjx-'

	if (MJX_TOKEN_TAGS.has(name)) {
		const text = normalizeMathGlyphs(node.textContent || '');
		// Drop tokens left empty after stripping invisible operators.
		if (!text && name !== 'mspace') return [];
		const el = doc.createElement(name);
		if (text) el.textContent = text;
		return [el];
	}

	if (MJX_STRUCTURAL_TAGS.has(name)) {
		return [buildEl(name, flattenMjxChildren(node, doc), doc)];
	}

	switch (name) {
		case 'mfrac': {
			const num = wrapParts(flattenMjxChildren(node.querySelector('mjx-num'), doc), doc);
			const den = wrapParts(flattenMjxChildren(node.querySelector('mjx-den'), doc), doc);
			return [buildEl('mfrac', [num, den], doc)];
		}
		case 'msqrt': {
			// The radicand sits in mjx-box; mjx-surd holds the √ glyph (implicit in MathML).
			const box = node.querySelector('mjx-box');
			return [buildEl('msqrt', flattenMjxChildren(box || node, doc), doc)];
		}
		case 'msub':
		case 'msup': {
			const script = directChild(node, 'mjx-script');
			const base = wrapParts(flattenMjxChildren(node, doc, script), doc);
			const sup = wrapParts(flattenMjxChildren(script, doc), doc);
			return [buildEl(name, [base, sup], doc)];
		}
		case 'msubsup': {
			const script = directChild(node, 'mjx-script');
			const base = wrapParts(flattenMjxChildren(node, doc, script), doc);
			// CHTML stacks the script as [sup, sub] (top→bottom); MathML msubsup
			// expects [base, sub, sup], so the script parts are reversed.
			const parts = flattenMjxChildren(script, doc);
			const sub = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || doc.createElement('mrow'));
			const sup = parts.length > 1 ? parts[0] : doc.createElement('mrow');
			return [buildEl('msubsup', [base, sub, sup], doc)];
		}
		case 'munder':
		case 'mover':
		case 'munderover': {
			// CHTML lays limits out as [over?, box[ munder[ base, under? ] ]];
			// read the role wrappers directly and emit MathML order.
			const base = wrapParts(flattenMjxChildren(node.querySelector('mjx-base'), doc), doc);
			const under = node.querySelector('mjx-under');
			const over = node.querySelector('mjx-over');
			if (name === 'munder') return [buildEl('munder', [base, wrapParts(flattenMjxChildren(under, doc), doc)], doc)];
			if (name === 'mover') return [buildEl('mover', [base, wrapParts(flattenMjxChildren(over, doc), doc)], doc)];
			return [buildEl('munderover', [
				base,
				wrapParts(flattenMjxChildren(under, doc), doc),
				wrapParts(flattenMjxChildren(over, doc), doc)
			], doc)];
		}
		default:
			// Layout wrapper (mjx-frac, mjx-num, mjx-box, mjx-script, …): transparent.
			return flattenMjxChildren(node, doc);
	}
};

/**
 * Rebuild a `<math>` element from a MathJax CHTML `mjx-math` render tree.
 * Returns null when there is nothing to recover (e.g. an unrendered
 * `mjx-lazy` placeholder).
 */
export const reconstructMathMLFromMjx = (mjxMath: Element, doc: Document): MathData | null => {
	const math = doc.createElement('math');
	math.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');

	for (const child of Array.from(mjxMath.children)) {
		for (const n of convertMjxNode(child, doc)) math.appendChild(n);
	}

	if (math.childNodes.length === 0) return null;

	const isBlock = mjxMath.getAttribute('display') === 'true';
	if (isBlock) math.setAttribute('display', 'block');

	return { mathml: math.outerHTML, latex: null, isBlock };
};

/**
 * Flatten a tagged single equation (`\tag{…}`) back into an inline expression.
 *
 * MathJax renders `equation \tag{x}` as an `<mtable>` whose only row is an
 * `<mlabeledtr>`: the first `<mtd>` holds the `(x)` label, the rest holds the
 * equation. MathML Core dropped `mlabeledtr`, so native MathML renderers (e.g.
 * Obsidian's reader) can't lay the table out and collapse the whole equation
 * into a vertical stack. It also breaks the MathML→LaTeX conversion, which
 * emits a bogus `\begin{matrix}` wrapping the label and the equation together.
 *
 * Unwrap the table into the equation content with the label appended on the
 * right, so it renders horizontally everywhere. Multi-row tables (genuine
 * aligned systems) are left untouched.
 */
const flattenTaggedEquationTables = (mathEl: Element): void => {
	const doc = mathEl.ownerDocument;
	if (!doc) return;

	const tables = Array.from(mathEl.querySelectorAll('mtable'));
	for (const table of tables) {
		const rows = Array.from(table.children).filter(child => {
			const name = child.tagName.toLowerCase();
			return name === 'mtr' || name === 'mlabeledtr';
		});
		if (rows.length !== 1) continue;

		const row = rows[0];
		if (row.tagName.toLowerCase() !== 'mlabeledtr') continue;

		const cells = Array.from(row.children).filter(child => child.tagName.toLowerCase() === 'mtd');
		if (cells.length < 2) continue;

		// In an mlabeledtr the first cell is the equation number/label; the
		// remaining cells are the equation itself.
		const [labelCell, ...contentCells] = cells;
		const replacement = doc.createElement('mrow');

		for (const cell of contentCells) {
			while (cell.firstChild) replacement.appendChild(cell.firstChild);
		}

		if (labelCell.childNodes.length > 0) {
			const spacer = doc.createElement('mspace');
			spacer.setAttribute('width', '2em');
			replacement.appendChild(spacer);
			while (labelCell.firstChild) replacement.appendChild(labelCell.firstChild);
		}

		table.replaceWith(replacement);
	}
};

/** Clone a math element, flatten tagged-equation tables, and serialize it. */
const serializeNormalizedMathML = (mathEl: Element): string => {
	const clone = mathEl.cloneNode(true) as Element;
	flattenTaggedEquationTables(clone);
	return clone.outerHTML;
};

export const getMathMLFromElement = (el: Element): MathData | null => {
	// 1. Direct MathML content
	if (el.tagName.toLowerCase() === 'math') {
		const isBlock = el.getAttribute('display') === 'block';
		return {
			mathml: serializeNormalizedMathML(el),
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
				mathml: serializeNormalizedMathML(mathElement),
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
				mathml: serializeNormalizedMathML(mathElement),
				latex: mathElement.getAttribute('alttext') || null,
				isBlock
			};
		}
	}

	// 4. KaTeX MathML
	const katexMathml = el.querySelector('.katex-mathml math');
	if (katexMathml) {
		return {
			mathml: serializeNormalizedMathML(katexMathml),
			latex: null, // We'll get LaTeX separately for KaTeX
			isBlock: false // We'll determine this from container
		};
	}

	// 5. MathJax v3 CHTML render tree (no assistive MathML / annotation) —
	// reconstruct MathML from the mjx-* tree. Unrendered mjx-lazy placeholders
	// have no mjx-math and fall through to null (the formula is simply dropped).
	const mjxMath = el.tagName.toLowerCase() === 'mjx-math' ? el : el.querySelector('mjx-math');
	if (mjxMath) {
		const doc = el.ownerDocument || document;
		const reconstructed = reconstructMathMLFromMjx(mjxMath, doc);
		if (reconstructed) return reconstructed;
	}

	return null;
};

export const getBasicLatexFromElement = (el: Element): string | null => {
	// Direct data-latex attribute
	const dataLatex = el.getAttribute('data-latex');
	if (dataLatex) {
		return dataLatex;
	}
	const dataMath = el.getAttribute('data-math');                                                                                                                   
	if (dataMath) {
		return dataMath;                                                                                                                                             
	}
	const parentDataEntry = el.parentElement?.classList.contains('hurmet-tex')
		? el.parentElement.getAttribute('data-entry')
		: null;
	if (parentDataEntry) {
		return parentDataEntry;
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

// Precompiled regexes for named query parameters used by LaTeX rendering services.
// latex/tex/eq/math = generic; chl = Google Charts
const LATEX_PARAM_REGEXES = ['latex', 'chl', 'tex', 'eq', 'math'].map(
	param => new RegExp(`[?&]${param}=([^&#]+)`, 'i')
);
export const LOOKS_LIKE_LATEX_RE = /\\[a-zA-Z]{2,}/;

/**
 * Extract LaTeX from an image src URL by detecting URL-encoded LaTeX commands.
 * Works with any LaTeX rendering service without hardcoding domain names.
 */
export function extractLatexFromImageSrc(src: string): string | null {
	// Try named query parameters
	for (const re of LATEX_PARAM_REGEXES) {
		const match = src.match(re);
		if (match) {
			const latex = decodeLatex(match[1]);
			if (latex) return latex;
		}
	}

	// Try the full query string as bare LaTeX (e.g. CodeCogs, mimeTeX)
	const queryMatch = src.match(/\?([^#]+)/);
	if (queryMatch) {
		const latex = decodeLatex(queryMatch[1]);
		if (latex) return latex;
	}

	// Try URL path segments containing encoded LaTeX
	const pathPart = src.split('?')[0];
	const segments = pathPart.split('/');
	for (let i = segments.length - 1; i >= 0; i--) {
		if (/%5[Cc]/.test(segments[i])) {
			const latex = decodeLatex(segments[i]);
			if (latex) return latex;
		}
	}

	return null;
}

/** Decode a URL-encoded string and return it if it contains a LaTeX command. */
function decodeLatex(raw: string): string | null {
	try {
		const decoded = decodeURIComponent(raw.replace(/\+/g, ' '));
		return LOOKS_LIKE_LATEX_RE.test(decoded) ? decoded : null;
	} catch {
		return null;
	}
}

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
