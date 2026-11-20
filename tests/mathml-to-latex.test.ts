import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { MathMLToLaTeX as RefMathMLToLaTeX } from 'mathml-to-latex';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { convertMathMLToLatex } from '../src/elements/mathml-to-latex';
import { getFullMathMLCorpus, type MathMLCase } from './mathml-corpus';

const corpus = getFullMathMLCorpus();

function parseMathRoot(html: string, domImpl: 'linkedom' | 'jsdom'): Element {
	const wrapped = `<!doctype html><html><body>${html}</body></html>`;
	const doc = domImpl === 'jsdom'
		? new JSDOM(wrapped).window.document
		: parseLinkedomHTML(wrapped);
	const el = doc.body.firstElementChild;
	if (!el) throw new Error(`Failed to parse root element from: ${html}`);
	return el;
}

describe.each(['linkedom', 'jsdom'] as const)('MathML-to-LaTeX differential (%s)', (domImpl) => {
	test('corpus covers all fixture <math> elements plus generated cases', () => {
		const fixtureCount = corpus.filter(c => c.category === 'fixture').length;
		expect(fixtureCount).toBeGreaterThanOrEqual(90);
		expect(corpus.length).toBeGreaterThanOrEqual(220);
	});

	const matchingCases = corpus.filter(c => !c.expectedDiff && !c.expectThrow);
	const diffCases = corpus.filter(c => !!c.expectedDiff);
	const throwCases = corpus.filter(c => !!c.expectThrow);

	test.each(matchingCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'matches mathml-to-latex: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			const ours = convertMathMLToLatex(el);
			const theirs = RefMathMLToLaTeX.convert(c.html);
			expect(ours).toBe(theirs);
		}
	);

	test.each(diffCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'documents intentional improvement: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			const ours = convertMathMLToLatex(el);
			const theirs = RefMathMLToLaTeX.convert(c.html);
			expect(ours).toBe(c.expectedDiff!.ours);
			expect(theirs).toBe(c.expectedDiff!.theirs);
		}
	);

	test.each(throwCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'throws InvalidNumberOfChildrenError on invalid arity: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			expect(() => convertMathMLToLatex(el)).toThrow();
			expect(() => RefMathMLToLaTeX.convert(c.html)).toThrow();
		}
	);
});
