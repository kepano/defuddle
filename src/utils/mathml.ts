import { parseHTML } from './dom';

const PRESENTATION_TOKENS = new Set(['mi', 'mn', 'mo', 'mtext', 'ms']);
const FOREIGN_SOURCE = new Set(['annotation', 'annotation-xml', 'cs']);

/** Serialize an isolated converter input, without changing source MathML. */
export function serializeMathMLForConversion(source: Element | string, doc: Document): string {
	const math = typeof source === 'string'
		? parseHTML(doc, source).querySelector('math')
		: source.cloneNode(true) as Element;
	if (!math) return '';

	const normalizeTokens = (element: Element): void => {
		const tag = element.tagName.toLowerCase();
		if (FOREIGN_SOURCE.has(tag)) return;
		if (PRESENTATION_TOKENS.has(tag)) {
			// Normalize ASCII indentation around NBSP without collapsing NBSP.
			// Leave ASCII-only and mixed-content token handling unchanged.
			const text = element.textContent || '';
			if (text.includes('\u00A0') && Array.from(element.childNodes).every(node => node.nodeType === 3)) {
				element.textContent = text
					.replace(/[\t\n\r ]+/g, ' ')
					.replace(/^ | $/g, '');
			}
			return;
		}
		Array.from(element.children).forEach(normalizeTokens);
	};
	normalizeTokens(math);

	// The XML converter cannot read the named entity
	return math.outerHTML
		.replace(/&amp;nbsp;/g, '&#xA0;')
		.replace(/&nbsp;/g, '&#xA0;');
}
