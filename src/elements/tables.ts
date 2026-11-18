import { isTextNode } from '../utils';
import { transferContent } from '../utils/dom';

const TABLE_DISPLAYS = new Set([
	'table', 'inline-table', 'table-header-group', 'table-row-group',
	'table-footer-group', 'table-row', 'table-cell'
]);

const GROUP_TAGS: Record<string, string> = {
	'table-header-group': 'thead',
	'table-row-group': 'tbody',
	'table-footer-group': 'tfoot',
};

type Plan = Array<[Element, string]>;

function tableDisplay(element: Element): string {
	// Only generic containers: retagging <a> or <img> would drop href/src.
	if (element.tagName !== 'DIV' && element.tagName !== 'SPAN') return '';
	return Array.from(element.classList).find(name => TABLE_DISPLAYS.has(name)) || '';
}

/** Child elements, or null if the element is empty or holds loose text. */
function structuralChildren(element: Element): Element[] | null {
	const hasText = Array.from(element.childNodes).some(node => isTextNode(node) && node.textContent?.trim());
	return hasText || !element.children.length ? null : Array.from(element.children);
}

function planRow(row: Element, cellTag: string, plan: Plan): boolean {
	const cells = structuralChildren(row);
	if (tableDisplay(row) !== 'table-row' || !cells?.every(cell => tableDisplay(cell) === 'table-cell')) {
		return false;
	}
	plan.push([row, 'tr'], ...cells.map((cell): [Element, string] => [cell, cellTag]));
	return true;
}

/**
 * Map every part of a CSS table to its HTML tag, parents before children.
 * Returns null unless the markup is a strict table > [group >] row > cell
 * hierarchy, so an invalid table is left untouched.
 */
function planTable(table: Element): Plan | null {
	const plan: Plan = [[table, 'table']];
	const parts = structuralChildren(table);
	if (!parts) return null;

	for (const part of parts) {
		const groupTag = GROUP_TAGS[tableDisplay(part)];
		if (!groupTag) {
			if (!planRow(part, 'td', plan)) return null;
			continue;
		}
		const rows = structuralChildren(part);
		if (!rows) return null;
		plan.push([part, groupTag]);
		const cellTag = groupTag === 'thead' ? 'th' : 'td';
		if (!rows.every(row => planRow(row, cellTag, plan))) return null;
	}

	// Single-column CSS tables are layout, not data; leave them as divs.
	const isMultiColumn = plan.some(([el, tag]) => tag === 'tr' && el.children.length > 1);
	return isMultiColumn ? plan : null;
}

/** Replace an element with a new tag, keeping its attributes and children. */
function retag(source: Element, tag: string): void {
	const target = source.ownerDocument.createElement(tag);
	for (const attr of Array.from(source.attributes)) {
		target.setAttribute(attr.name, attr.value);
	}
	// Drop structural utility classes before selector-based removal.
	for (const name of TABLE_DISPLAYS) target.classList.remove(name);
	transferContent(source, target);
	source.replaceWith(target);
}

/**
 * Normalize explicit CSS tables before clutter removal: a Tailwind
 * table-footer-group is table data, not a page footer. Validate the entire
 * row/group/cell hierarchy first so unrelated .table wrappers stay untouched.
 * Only explicit display utility classes are read; stylesheets, inline styles
 * and arbitrary class names are intentionally not inferred.
 */
export function standardizeTables(element: Element): void {
	const tables = [element, ...Array.from(element.querySelectorAll('.table, .inline-table'))]
		.filter(el => ['table', 'inline-table'].includes(tableDisplay(el)));

	// Inner tables first; cell contents (including nested tables) stay intact.
	for (const table of tables.reverse()) {
		const plan = planTable(table);
		if (!plan) continue;

		// Children before parents, so each element is retagged after its contents.
		for (const [source, tag] of plan.reverse()) {
			if (source !== element) {
				retag(source, tag);
				continue;
			}
			// The content root must stay attached, so its table is built inside it.
			const inner = element.ownerDocument.createElement('table');
			transferContent(element, inner);
			element.appendChild(inner);
		}
	}
}
