import { isElement, isTextNode } from '../utils';
import { isDirectTableChild } from '../utils/dom';

export const EQUATION_TABLE_SELECTOR = 'table.ltx_equation, table.ltx_eqn_table, table.ltx_equationgroup';

/** Only unwrap a whole equation, never cell fragments or alternative MathML. */
export function getSingleEquationMath(table: Element): Element | null {
	const maths = Array.from(table.querySelectorAll('math'))
		.filter(math => isDirectTableChild(math, table) && !math.parentElement?.closest('math, annotation-xml'));
	if (maths.length !== 1) return null;
	const math = maths[0];
	// Keep unconvertible sources and XML alternatives in their table context.
	if (!math.getAttribute('data-latex')?.trim() || math.querySelector('annotation-xml, math')) return null;
	// A generated text fallback is not evidence for promoting native inline math.
	if (math.getAttribute('display') !== 'block' && !math.querySelector('annotation')) return null;
	const rows = Array.from(table.querySelectorAll('tr')).filter(row => isDirectTableChild(row, table));
	if (rows.length !== 1) return null;

	const isEquationLayout = (node: Node): boolean => {
		if (node === math) return true;
		if (isTextNode(node)) return !node.textContent?.trim();
		if (!isElement(node)) return node.nodeType === 8;
		// Equation numbers are dropped, as for unwrapped equations before
		if (node.classList.contains('ltx_eqn_eqno')) return true;
		if (!['table', 'tbody', 'tr', 'td'].includes(node.nodeName.toLowerCase())) return false;
		if (node !== table && node.nodeName.toLowerCase() === 'table') return false;
		if (node.hasAttribute('colspan') || node.hasAttribute('rowspan')) return false;
		return Array.from(node.childNodes).every(isEquationLayout);
	};
	return isEquationLayout(table) ? math : null;
}
