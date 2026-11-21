import { lookupOperator, lookupSymbol, lookupMathNumber, convertUtf8Char } from './mathml-tables';

export interface MathMLNodeLike {
	nodeName: string;
	tagName?: string;
	nodeType: number;
	textContent?: string | null;
	childNodes?: ArrayLike<Node>;
	getAttribute: (name: string) => string | null;
}

interface IRNode {
	name: string;
	value: string;
	children: IRNode[];
	mathvariant?: string;
	open?: string;
	close?: string;
	separators?: string;
	bevelled?: string;
	linethickness?: string;
	actiontype?: string;
	notation?: string;
	columnalign?: string;
	linebreak?: string;
	innerTable?: boolean;
	bareTable?: boolean;
	bareRow?: boolean;
	out: string;
}

export class InvalidNumberOfChildrenError extends Error {
	constructor(tagName: string, expected: number, actual: number, comparison = 'exactly') {
		super(`${tagName} tag must have ${comparison} ${expected} children. It's actually ${actual}`);
		this.name = 'InvalidNumberOfChildrenError';
	}
}

const DOUBLE_BAR_FENCES = new Set(['||', '\u2016', '\u2225']);
const OPENERS = new Set(['(', '[', '{']);
const CLOSERS = new Set([')', ']', '}']);
const BARS = new Set(['|', ...DOUBLE_BAR_FENCES]);
const SCRIPT_ELEMENTS = new Set(['msub', 'msup', 'msubsup']);
const LATEX_ACCENTS = new Set(['\\hat', '\\bar', '\\overline', '\\underline', '\\underbrace', '\\overbrace']);
const TEX_LENGTH_UNITS = new Set(['pt', 'pc', 'in', 'cm', 'mm', 'em', 'ex', 'bp', 'dd', 'cc']);
const DEFAULT_RULE_THICKNESS_PT = 0.4;
const PT_PER_PX = 0.75;

function normalizeWhitespace(str: string): string {
	return str.replace(/\s+/g, ' ');
}

function normalizeTagName(el: MathMLNodeLike): string {
	const raw = (el.tagName || el.nodeName || '').toLowerCase();
	return raw.startsWith('mml:') ? raw.slice(4) : raw;
}

function readAttr(el: MathMLNodeLike, name: string): string | undefined {
	const val = el.getAttribute(name);
	if (val === null) return undefined;
	return val === name ? '' : val;
}

function toLatexDelimiter(delimiter: string): string {
	if (delimiter === '{') return '\\{';
	if (delimiter === '}') return '\\}';
	if (DOUBLE_BAR_FENCES.has(delimiter)) return '\\|';
	return delimiter;
}

function wrapDelimiters(open: string, close: string, content: string): string {
	return `\\left${toLatexDelimiter(open)}${content}\\right${toLatexDelimiter(close)}`;
}

function wrapParenIfGT1(str: string): string {
	return str.length <= 1 ? str : `\\left(${str}\\right)`;
}

function formatPoints(valuePt: number): string {
	return `${Math.round(valuePt * 10000) / 10000}pt`;
}

function parseLineThickness(raw: string | undefined): string | null {
	if (!raw) return null;
	const value = raw.trim().toLowerCase();
	if (value === 'medium') return null;
	if (value === 'thin') return formatPoints(DEFAULT_RULE_THICKNESS_PT * 0.5);
	if (value === 'thick') return formatPoints(DEFAULT_RULE_THICKNESS_PT * 2);
	const match = value.match(/^(-?\d*\.?\d+)\s*([a-z%]*)$/);
	if (!match) return null;
	const amount = parseFloat(match[1]);
	const unit = match[2];
	if (amount === 0) return '0pt';
	if (unit === '') return amount === 1 ? null : formatPoints(amount * DEFAULT_RULE_THICKNESS_PT);
	if (unit === 'px') return formatPoints(amount * PT_PER_PX);
	if (unit === '%') return formatPoints((amount / 100) * DEFAULT_RULE_THICKNESS_PT);
	if (TEX_LENGTH_UNITS.has(unit)) return `${amount}${unit}`;
	return null;
}

/** Build an internal IR tree iteratively from a DOM element without mutating the DOM. */
function buildIR(rootEl: MathMLNodeLike): IRNode {
	const makeNode = (el: MathMLNodeLike): { node: IRNode; elemChildren: MathMLNodeLike[] } => {
		const name = normalizeTagName(el);
		const elemChildren: MathMLNodeLike[] = [];
		const childNodes = el.childNodes;
		if (childNodes) {
			for (let i = 0; i < childNodes.length; i++) {
				const child = childNodes[i];
				if (child && child.nodeType === 1) {
					elemChildren.push(child as unknown as MathMLNodeLike);
				}
			}
		}

		const node: IRNode = {
			name,
			value: elemChildren.length === 0 ? (el.textContent || '').replace(/[\r\n]/g, '') : '',
			children: [],
			out: '',
		};

		switch (name) {
			case 'mi':
			case 'mtext':
				node.mathvariant = readAttr(el, 'mathvariant');
				break;
			case 'mfenced':
				node.open = readAttr(el, 'open');
				node.close = readAttr(el, 'close');
				node.separators = readAttr(el, 'separators');
				break;
			case 'mfrac':
				node.bevelled = readAttr(el, 'bevelled');
				node.linethickness = readAttr(el, 'linethickness');
				break;
			case 'maction':
				node.actiontype = readAttr(el, 'actiontype');
				break;
			case 'menclose':
				node.notation = readAttr(el, 'notation');
				break;
			case 'mtable':
			case 'mtr':
			case 'mtd':
				node.columnalign = readAttr(el, 'columnalign');
				break;
			case 'mspace':
				node.linebreak = readAttr(el, 'linebreak');
				break;
		}

		return { node, elemChildren };
	};

	const rootEntry = makeNode(rootEl);
	const stack: Array<{ parent: IRNode; elemChildren: MathMLNodeLike[] }> = [
		{ parent: rootEntry.node, elemChildren: rootEntry.elemChildren }
	];

	while (stack.length > 0) {
		const { parent, elemChildren } = stack.pop()!;
		for (let i = 0; i < elemChildren.length; i++) {
			const childEntry = makeNode(elemChildren[i]);
			parent.children.push(childEntry.node);
			if (childEntry.elemChildren.length > 0) {
				stack.push({ parent: childEntry.node, elemChildren: childEntry.elemChildren });
			}
		}
	}

	return rootEntry.node;
}

function isOpener(node: IRNode): boolean {
	return node.name === 'mo' && OPENERS.has(node.value.trim());
}

function isCloser(node: IRNode): boolean {
	return node.name === 'mo' && CLOSERS.has(node.value.trim());
}

function isBar(node: IRNode): boolean {
	return node.name === 'mo' && BARS.has(node.value.trim());
}

function makeSyntheticFence(opener: IRNode, closer: IRNode, content: IRNode[]): IRNode {
	const inner: IRNode = content.length === 1
		? content[0]
		: { name: 'mrow', value: '', children: content, out: '' };
	return {
		name: 'mfenced',
		value: '',
		children: [inner],
		open: opener.value.trim(),
		close: closer.value.trim(),
		out: '',
	};
}

function pairFences(children: IRNode[]): IRNode[] {
	const root: IRNode[] = [];
	const openFrames: Array<{ opener: IRNode; content: IRNode[] }> = [];
	let current = root;
	let paired = false;

	for (const child of children) {
		const top = openFrames[openFrames.length - 1];
		const closesBar = top !== undefined && isBar(child) && isBar(top.opener) &&
			top.opener.value.trim() === child.value.trim();

		if (isOpener(child) || (isBar(child) && !closesBar)) {
			const frame = { opener: child, content: [] as IRNode[] };
			openFrames.push(frame);
			current = frame.content;
			continue;
		}

		if (top !== undefined && ((isCloser(child) && isOpener(top.opener)) || closesBar)) {
			openFrames.pop();
			current = openFrames.length > 0 ? openFrames[openFrames.length - 1].content : root;
			current.push(makeSyntheticFence(top.opener, child, top.content));
			paired = true;
			continue;
		}

		// Closing bar hidden as the base of a script element (e.g. ||P||_F^2)
		if (top !== undefined && isBar(top.opener) && SCRIPT_ELEMENTS.has(child.name) && child.children.length > 0) {
			const base = child.children[0];
			const bar = base.name === 'mrow' && base.children.length === 1 ? base.children[0] : base;
			if (bar.name === 'mo' && bar.value.trim() === top.opener.value.trim()) {
				openFrames.pop();
				current = openFrames.length > 0 ? openFrames[openFrames.length - 1].content : root;
				const fence = makeSyntheticFence(top.opener, bar, top.content);
				current.push({ ...child, children: [fence, ...child.children.slice(1)] });
				paired = true;
				continue;
			}
		}

		current.push(child);
	}

	if (!paired) return children;
	for (const frame of openFrames) {
		root.push(frame.opener);
		for (const node of frame.content) root.push(node);
	}
	return root;
}

/** Pair bare sibling fence `<mo>` operators into synthetic `<mfenced>` nodes. */
function normalizeFences(root: IRNode): void {
	const stack: IRNode[] = [root];
	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node.children.length === 0) continue;
		const paired = pairFences(node.children);
		if (paired !== node.children) node.children = paired;
		for (const child of node.children) stack.push(child);
	}
}

function isLinearSystem(node: IRNode): boolean {
	if (node.name !== 'mrow') return false;
	const c = node.children;
	if (c.length !== 2 && c.length !== 3) return false;
	if (c[0].name !== 'mo' || c[0].value.trim() !== '{') return false;
	if (c[1].name !== 'mtable') return false;
	return c[2] === undefined || (c[2].name === 'mo' && c[2].value.trim() === '');
}

/** Flag inner/bare tables and bare rows so `&`/`\\` always sit inside an environment. */
function annotateTables(root: IRNode): void {
	const stack: Array<{ node: IRNode; insideMtable: boolean; wrapped: boolean }> = [
		{ node: root, insideMtable: false, wrapped: false }
	];
	while (stack.length > 0) {
		const { node, insideMtable, wrapped } = stack.pop()!;
		if (node.name === 'mtable') {
			if (insideMtable) node.innerTable = true;
			else if (!wrapped) node.bareTable = true;
		}
		if (node.name === 'mtr' && !insideMtable) {
			node.bareRow = true;
		}
		const childInsideMtable = insideMtable || node.name === 'mtable';
		const childWrapped = wrapped || node.name === 'mfenced';
		const linearSystemTable = isLinearSystem(node) ? node.children[1] : undefined;
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			stack.push({
				node: child,
				insideMtable: childInsideMtable,
				wrapped: childWrapped || child === linearSystemTable,
			});
		}
	}
}

function hasDescendantNamed(children: IRNode[], targetName: string): boolean {
	const stack = [...children];
	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node.name === targetName) return true;
		for (const c of node.children) stack.push(c);
	}
	return false;
}

function hasEquationAlignment(table: IRNode): boolean {
	let hasRight = false;
	let hasLeft = false;
	const check = (val: string | undefined): void => {
		if (!val) return;
		for (const token of val.trim().split(/\s+/)) {
			if (token === 'right') hasRight = true;
			else if (token === 'left') hasLeft = true;
		}
	};
	check(table.columnalign);
	for (const row of table.children) {
		if (row.name !== 'mtr') continue;
		check(row.columnalign);
		for (const cell of row.children) {
			if (cell.name !== 'mtd') continue;
			check(cell.columnalign);
		}
	}
	return hasRight && hasLeft;
}

function wrapMathVariant(value: string, variant: string | undefined): string {
	switch (variant) {
		case 'bold': return `\\mathbf{${value}}`;
		case 'italic': return `\\mathit{${value}}`;
		case 'bold-italic': return `\\mathbf{\\mathit{${value}}}`;
		case 'double-struck': return `\\mathbb{${value}}`;
		case 'bold-fraktur': return `\\mathbf{\\mathfrak{${value}}}`;
		case 'script': return `\\mathcal{${value}}`;
		case 'bold-script': return `\\mathbf{\\mathcal{${value}}}`;
		case 'fraktur': return `\\mathfrak{${value}}`;
		case 'sans-serif': return `\\mathsf{${value}}`;
		case 'bold-sans-serif': return `\\mathbf{\\mathsf{${value}}}`;
		case 'sans-serif-italic': return `\\mathsf{\\mathit{${value}}}`;
		case 'sans-serif-bold-italic': return `\\mathbf{\\mathsf{\\mathit{${value}}}}`;
		case 'monospace': return `\\mathtt{${value}}`;
		default: return value;
	}
}

function wrapTextVariant(value: string, variant: string | undefined): string {
	switch (variant) {
		case 'bold': return `\\textbf{${value}}`;
		case 'italic': return `\\textit{${value}}`;
		case 'bold-italic': return `\\textbf{\\textit{${value}}}`;
		case 'double-struck': return `\\mathbb{${value}}`;
		case 'monospace': return `\\mathtt{${value}}`;
		case 'bold-fraktur':
		case 'fraktur': return `\\mathfrak{${value}}`;
		default: return `\\text{${value}}`;
	}
}

function convertMIValue(rawValue: string, mathvariant: string | undefined): string {
	const normalized = normalizeWhitespace(rawValue);
	if (normalized === ' ') return lookupSymbol(' ');
	const converted = lookupSymbol(normalized.trim());
	const parsed = convertUtf8Char(converted);
	if (parsed !== converted) return parsed;
	return wrapMathVariant(converted, mathvariant);
}

function convertMText(value: string, mathvariant: string | undefined): string {
	let result = '';
	let run = '';
	for (const char of value) {
		const code = char.charCodeAt(0);
		const isAlnumOrSpace =
			char === ' ' ||
			(code >= 48 && code <= 57) ||
			(code >= 65 && code <= 90) ||
			(code >= 97 && code <= 122);
		if (isAlnumOrSpace) {
			run += char;
		} else {
			const converted = convertMIValue(char, undefined);
			// A bare letter after a command like \\alpha would become part of its name.
			if (/^[a-z0-9]$/i.test(converted)) {
				run += converted;
				continue;
			}
			if (run) {
				result += wrapTextVariant(run, mathvariant);
				run = '';
			}
			result += converted;
		}
	}
	if (run) result += wrapTextVariant(run, mathvariant);
	return result;
}

function convertMFenced(node: IRNode): string {
	const open = node.open || '';
	const close = node.close || '';
	const childrenLatex = node.children.map(c => c.out);

	if (hasDescendantNamed(node.children, 'mtable')) {
		let env: string;
		if (open === '(' && close === ')') env = 'pmatrix';
		else if (open === '[' && close === ']') env = 'bmatrix';
		else if (open === '{' && close === '}') env = 'Bmatrix';
		else if (open === '|' && close === '|') env = 'vmatrix';
		else if (open === close && DOUBLE_BAR_FENCES.has(open)) env = 'Vmatrix';
		else if (open !== close) env = 'matrix';
		else env = 'bmatrix';

		const matrix = `\\begin{${env}}\n${childrenLatex.join('')}\n\\end{${env}}`;
		return env === 'matrix' ? wrapDelimiters(open, close, matrix) : matrix;
	}

	const seps = node.separators !== undefined
		? (node.separators ? Array.from(node.separators) : [])
		: [','];

	let joined = '';
	for (let i = 0; i < childrenLatex.length; i++) {
		joined += childrenLatex[i];
		if (i < childrenLatex.length - 1 && seps.length > 0) {
			joined += seps[i] ?? seps[seps.length - 1];
		}
	}

	return wrapDelimiters(open || '(', close || ')', joined);
}

function convertMMultiscripts(node: IRNode): string {
	const { children } = node;
	if (children.length === 0) {
		throw new InvalidNumberOfChildrenError(node.name, 1, 0, 'at least');
	}
	const rawBase = children[0].out;
	const base = rawBase === '' ? '{}' : rawBase.length === 1 ? rawBase : `{${rawBase}}`;

	const scripts = children.slice(1);
	const markerIdx = scripts.findIndex(c => c.name === 'mprescripts');
	const post = markerIdx === -1 ? scripts : scripts.slice(0, markerIdx);
	const pre = markerIdx === -1 ? [] : scripts.slice(markerIdx + 1);

	const renderPairs = (items: IRNode[], isPrescript: boolean): string => {
		let out = '';
		let attachesToBase = !isPrescript;
		for (let i = 0; i < items.length; i += 2) {
			const subEl = items[i];
			const supEl = items[i + 1];
			const sub = subEl && subEl.name !== 'none' ? subEl.out : '';
			const sup = supEl && supEl.name !== 'none' ? supEl.out : '';
			const pair = (sub ? `_{${sub}}` : '') + (sup ? `^{${sup}}` : '');
			if (!pair) continue;
			out += (attachesToBase ? '' : '{}') + pair;
			attachesToBase = false;
		}
		return out;
	};

	return renderPairs(pre, true) + base + renderPairs(post, false);
}

function convertMEnclose(node: IRNode): string {
	const inner = node.children.map(c => c.out).join(' ');
	switch (node.notation || 'longdiv') {
		case 'actuarial': return `\\overline{\\left.${inner}\\right|}`;
		case 'radical': return `\\sqrt{${inner}}`;
		case 'box':
		case 'roundedbox':
		case 'circle': return `\\boxed{${inner}}`;
		case 'left': return `\\left|${inner}`;
		case 'right': return `${inner}\\right|`;
		case 'top': return `\\overline{${inner}}`;
		case 'bottom': return `\\underline{${inner}}`;
		case 'updiagonalstrike': return `\\cancel{${inner}}`;
		case 'downdiagonalstrike': return `\\bcancel{${inner}}`;
		case 'updiagonalarrow': return `\\cancelto{}{${inner}}`;
		case 'verticalstrike':
		case 'horizontalstrike': return `\\hcancel{${inner}}`;
		case 'madruwb': return `\\underline{${inner}\\right|}`;
		case 'phasorangle': return `{\\angle \\underline{${inner}}}`;
		default: return `\\overline{\\left.\\right)${inner}}`;
	}
}

function scriptBase(baseNode: IRNode): string {
	return baseNode.children.length <= 1 ? baseNode.out : wrapParenIfGT1(baseNode.out);
}

function convertNode(node: IRNode): string {
	const { name, children } = node;
	switch (name) {
		case 'math':
			return normalizeWhitespace(children.map(c => c.out).join(' '));
		case 'mi':
			return convertMIValue(node.value, node.mathvariant);
		case 'mo':
			return lookupOperator(normalizeWhitespace(node.value).trim());
		case 'mn': {
			const trimmed = normalizeWhitespace(node.value).trim();
			return lookupMathNumber(trimmed) || trimmed;
		}
		case 'mtext':
			return convertMText(node.value, node.mathvariant);
		case 'msqrt':
			return `\\sqrt{${children.map(c => c.out).join(' ')}}`;
		case 'mroot':
			if (children.length !== 2) throw new InvalidNumberOfChildrenError(name, 2, children.length);
			return `\\sqrt[${children[1].out}]{${children[0].out}}`;
		case 'mfrac': {
			if (children.length !== 2) throw new InvalidNumberOfChildrenError(name, 2, children.length);
			const num = children[0].out;
			const den = children[1].out;
			if (node.bevelled === 'true') return `${wrapParenIfGT1(num)}/${wrapParenIfGT1(den)}`;
			const thickness = parseLineThickness(node.linethickness);
			if (thickness !== null) return `\\genfrac{}{}{${thickness}}{}{${num}}{${den}}`;
			return `\\frac{${num}}{${den}}`;
		}
		case 'msup':
			if (children.length !== 2) throw new InvalidNumberOfChildrenError(name, 2, children.length);
			return `${scriptBase(children[0])}^{${children[1].out}}`;
		case 'msub':
			if (children.length !== 2) throw new InvalidNumberOfChildrenError(name, 2, children.length);
			return `${scriptBase(children[0])}_{${children[1].out}}`;
		case 'msubsup':
			if (children.length !== 3) throw new InvalidNumberOfChildrenError(name, 3, children.length);
			return `${scriptBase(children[0])}_{${children[1].out}}^{${children[2].out}}`;
		case 'mmultiscripts':
			return convertMMultiscripts(node);
		case 'munder':
		case 'mover': {
			if (children.length !== 2) throw new InvalidNumberOfChildrenError(name, 2, children.length);
			const content = children[0].out;
			const accent = children[1].out;
			if (LATEX_ACCENTS.has(accent)) return `${accent}{${content}}`;
			return `${name === 'munder' ? '\\underset' : '\\overset'}{${accent}}{${content}}`;
		}
		case 'munderover':
			if (children.length !== 3) throw new InvalidNumberOfChildrenError(name, 3, children.length);
			return `${children[0].out}_{${children[1].out}}^{${children[2].out}}`;
		case 'mfenced':
			return convertMFenced(node);
		case 'mtable': {
			const content = children.map(c => c.out).join(' \\\\\n');
			if (node.innerTable) return `\\begin{matrix}${content}\\end{matrix}`;
			if (node.bareTable) {
				const env = hasEquationAlignment(node) ? 'aligned' : 'matrix';
				return `\\begin{${env}}${content}\\end{${env}}`;
			}
			return content;
		}
		case 'mtr': {
			const row = children.map(c => c.out).join(' & ');
			return node.bareRow ? `\\begin{matrix}${row}\\end{matrix}` : row;
		}
		case 'mrow':
			if (isLinearSystem(node)) {
				const tableContent = children[1].children.map(c => c.out).join(' \\\\ ');
				return `\\begin{cases} ${tableContent} \\end{cases}`;
			}
			return children.map(c => c.out).join(' ');
		case 'mspace':
			return node.linebreak === 'newline' ? ' \\\\ ' : ' ';
		case 'maction':
			if (!node.actiontype || node.actiontype === 'toggle') {
				return children.map(c => c.out).join(' \\Longrightarrow ');
			}
			return children[0]?.out ?? '';
		case 'menclose':
			return convertMEnclose(node);
		case 'merror':
			return `\\color{red}{${children.map(c => c.out).join(' ')}}`;
		case 'mphantom':
		case 'annotation':
		case 'annotation-xml':
			return '';
		case 'semantics': {
			const primary = children.map(c => c.out).join(' ');
			if (primary.trim()) return primary;
			// Content MathML has no LaTeX form, so use its presentation annotation.
			for (const child of children) {
				if (child.name !== 'annotation-xml') continue;
				const fallback = child.children.map(c => c.out).join(' ');
				if (fallback.trim()) return fallback;
			}
			return '';
		}
		default:
			return children.map(c => c.out).join(' ');
	}
}

/**
 * Convert a DOM MathML `<math>` element directly to LaTeX without XML re-parsing.
 * Works identically across browser DOM, linkedom, JSDOM, and happy-dom.
 */
export function convertMathMLToLatex(element: MathMLNodeLike): string {
	const root = buildIR(element);
	normalizeFences(root);
	annotateTables(root);

	const stack: Array<{ node: IRNode; visited: boolean }> = [{ node: root, visited: false }];
	while (stack.length > 0) {
		const frame = stack[stack.length - 1];
		if (!frame.visited) {
			frame.visited = true;
			for (let i = frame.node.children.length - 1; i >= 0; i--) {
				stack.push({ node: frame.node.children[i], visited: false });
			}
			continue;
		}
		stack.pop();
		frame.node.out = convertNode(frame.node);
	}

	return normalizeWhitespace(root.out).trim();
}

export const MathMLToLaTeX = {
	convert: convertMathMLToLatex,
};
