import { parser } from '@lezer/html';

const blocks = new Set('address article aside blockquote caption dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li main nav ol p pre section summary table tbody td tfoot th thead tr ul'.split(' '));
const preserved = new Set(['pre', 'code', 'textarea', 'script', 'style', 'svg', 'math']);

export function formatHTML(source: string): string {
	const tree = parser.parse(source);
	let invalid = false;
	tree.iterate({ enter(node) { if (node.type.isError) invalid = true; } });
	if (invalid) return source;
	type Node = typeof tree.topNode;
	const text = (node: Node) => source.slice(node.from, node.to);
	const name = (node: Node) => {
		const tag = (node.getChild('OpenTag') ?? node.getChild('SelfClosingTag'))?.getChild('TagName');
		return tag ? text(tag).toLowerCase() : '';
	};
	const children = (node: Node) => {
		const result: Node[] = [];
		for (let child = node.firstChild; child; child = child.nextSibling) result.push(child);
		return result;
	};
	const isWhitespace = (node: Node) => node.name === 'Text' && !text(node).trim();
	const isBlock = (node: Node) => node.name === 'Comment' || (node.name === 'Element' && blocks.has(name(node)));
	function render(node: Node, depth: number): string {
		const indent = '  '.repeat(depth);
		const original = indent + text(node);
		if (node.name !== 'Element' || preserved.has(name(node)) || depth > 100) return original;
		const open = node.getChild('OpenTag'), close = node.getChild('CloseTag');
		if (!open || !close || /(?:white-space\s*:\s*(?:pre|break-spaces)|xml:space\s*=\s*["']preserve)/i.test(text(open))) return original;
		const content = children(node).filter(child => child !== open && child !== close && child.name !== 'OpenTag' && child.name !== 'CloseTag' && !isWhitespace(child));
		// Mixed inline content stays byte-for-byte intact: inserting whitespace
		// between e.g. <strong>Hello</strong><em>world</em> changes the result.
		if (!content.length || !content.every(isBlock)) return original;
		return `${indent}${text(open)}\n${content.map(child => render(child, depth + 1)).join('\n')}\n${indent}${text(close)}`;
	}
	const roots = children(tree.topNode).filter(node => !isWhitespace(node));
	return roots.length && roots.every(isBlock) ? roots.map(node => render(node, 0)).join('\n') : source;
}
