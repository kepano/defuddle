import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { convertMathMLToLatex } from '../src/elements/mathml-to-latex';
import { getFullMathMLCorpus, type MathMLCase } from './mathml-corpus';

const corpus = getFullMathMLCorpus();

// Output of mathml-to-latex 1.8.0, the library this converter replaced, under linkedom and JSDOM.
const reference: Record<string, string> = JSON.parse(readFileSync(join(__dirname, 'mathml-reference.json'), 'utf8'));

function parseMathRoot(html: string, domImpl: 'linkedom' | 'jsdom'): Element {
	const wrapped = `<!doctype html><html><body>${html}</body></html>`;
	const doc = domImpl === 'jsdom'
		? new JSDOM(wrapped).window.document
		: parseLinkedomHTML(wrapped);
	const el = doc.body.firstElementChild;
	if (!el) throw new Error(`Failed to parse root element from: ${html}`);
	return el;
}

describe.each(['linkedom', 'jsdom'] as const)('MathML-to-LaTeX reference output (%s)', (domImpl) => {
	test('corpus covers all fixture <math> elements plus generated cases', () => {
		const fixtureCount = corpus.filter(c => c.category === 'fixture').length;
		expect(fixtureCount).toBeGreaterThanOrEqual(90);
		expect(corpus.length).toBeGreaterThanOrEqual(220);
	});

	// A fixture added later has no reference output.
	const matchingCases = corpus.filter(c => !c.expectedDiff && !c.expectThrow && (c.category !== 'fixture' || c.id in reference));
	const diffCases = corpus.filter(c => !!c.expectedDiff);
	const throwCases = corpus.filter(c => !!c.expectThrow);

	test('every reference output has a corpus case', () => {
		const ids = new Set(matchingCases.map(c => c.id));
		expect(Object.keys(reference).filter(id => !ids.has(id))).toEqual([]);
	});

	test.each(matchingCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'matches mathml-to-latex: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			expect(convertMathMLToLatex(el)).toBe(reference[c.id]);
		}
	);

	test.each(diffCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'documents intentional improvement: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			expect(convertMathMLToLatex(el)).toBe(c.expectedDiff!.ours);
		}
	);

	test.each(throwCases.map(c => [c.id, c] as [string, MathMLCase]))(
		'throws InvalidNumberOfChildrenError on invalid arity: %s',
		(_id, c) => {
			const el = parseMathRoot(c.html, domImpl);
			expect(() => convertMathMLToLatex(el)).toThrow();
		}
	);
});
