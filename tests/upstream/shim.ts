// Runs the tests of mathml-to-latex 1.8.0 (asnunes/mathml-to-latex, MIT, see
// LICENSE.md) against Defuddle's converter. Each input is parsed as HTML, as
// Defuddle sees MathML in a page.
import { parseDocument } from '../helpers';
import { convertMathMLToLatex } from '../../src/elements/mathml-to-latex';

export { InvalidNumberOfChildrenError } from '../../src/elements/mathml-to-latex';

function findMath(doc: Document): Element | null {
	for (const el of Array.from(doc.querySelectorAll('*'))) {
		const name = el.tagName.toLowerCase();
		if (name === 'math' || name.endsWith(':math')) return el;
	}
	return null;
}

export const MathMLToLaTeX = {
	convert(mathml: string): string {
		const math = findMath(parseDocument(`<!doctype html><html><body>${mathml}</body></html>`));
		return math ? convertMathMLToLatex(math) : '';
	},
};
