const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

// Linkedom parses MathML as HTML elements. Limit that fallback to presentation
// tags, rather than treating arbitrary HTML inside a math element as MathML.
const PRESENTATION_TAGS = new Set([
	'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'mspace', 'mglyph',
	'mrow', 'mfrac', 'msqrt', 'mroot', 'mstyle', 'merror', 'mpadded',
	'mphantom', 'mfenced', 'menclose', 'msub', 'msup', 'msubsup',
	'munder', 'mover', 'munderover', 'mmultiscripts', 'mprescripts', 'none',
	'mtable', 'mtr', 'mlabeledtr', 'mtd', 'maligngroup', 'malignmark',
	'maction', 'semantics', 'annotation', 'annotation-xml'
]);
const HTML_INTEGRATION_TAGS = new Set(['mi', 'mn', 'mo', 'ms', 'mtext', 'annotation-xml']);

/** MathML descendants only; root/ancestor removal and HTML annotations stay unchanged. */
export function isMathMLArgument(element: Element): boolean {
	const elementTag = element.tagName.toLowerCase();
	const isGlyph = elementTag === 'mglyph' || elementTag === 'malignmark';
	let node: Element | null = element;
	while (node) {
		const tag = node.tagName.toLowerCase();
		if (node.namespaceURI !== MATHML_NAMESPACE &&
			(node.namespaceURI !== HTML_NAMESPACE || !PRESENTATION_TAGS.has(tag))) {
			return false;
		}
		if (tag === 'math') return node !== element;
		// Text integration points can contain HTML even with MathML-looking names.
		if (node !== element && HTML_INTEGRATION_TAGS.has(tag) &&
			(tag === 'annotation-xml' || (element.namespaceURI !== MATHML_NAMESPACE && !isGlyph))) return false;
		node = node.parentElement;
	}
	return false;
}
