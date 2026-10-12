import { describe, test, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Defuddle from '../src/index';
import type { DefuddleOptions } from '../src/index';
import { isMathMLArgument } from '../src/removals/math';
import { parseDocument } from './helpers';

const URL = 'https://example.com/mathml-arguments';
const NS = 'http://www.w3.org/1998/Math/MathML';

function extract(html: string, options: DefuddleOptions = {}) {
	// Stay above the retry threshold so relaxed removal cannot mask a regression.
	const prose = 'These examples explain how the formula fits into the surrounding article text. '.repeat(20);
	const doc = parseDocument(`<html><head><title>MathML arguments</title></head><body><article><h1>MathML arguments</h1><p>${prose}</p>${html}</article></body></html>`, URL);
	const result = new Defuddle(doc, { ...options, debug: true }).parse();
	expect(result.wordCount).toBeGreaterThanOrEqual(200);
	expect(result.debug?.contentSelector).toBe('html > body > article');
	expect(result.debug?.errors || []).toEqual([]);
	return parseDocument(`<html><body>${result.content}</body></html>`, URL);
}

describe('MathML argument removal boundaries', () => {
	afterEach(() => vi.restoreAllMocks());

	test('keeps both fraction arguments through the extraction pipeline', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const html = readFileSync(join(__dirname, 'fixtures/synthetic--mathml-arguments.html'), 'utf8');
		const result = new Defuddle(parseDocument(html, URL), { debug: true }).parse();
		expect(result.wordCount).toBeGreaterThanOrEqual(200);
		expect(result.debug?.contentSelector).toBe('html > body > article');
		expect(result.debug?.errors || []).toEqual([]);
		const fractions = parseDocument(`<html><body>${result.content}</body></html>`, URL).querySelectorAll('mfrac');
		expect(fractions.length).toBe(6);
		for (const [index, fraction] of Array.from(fractions).entries()) {
			expect(fraction.children.length).toBe(2);
			expect(fraction.textContent).toBe(['ab', 'cd', 'ef', 'gh', 'ij', 'kl'][index]);
		}
	});

	test('still removes non-layout alternatives, hidden roots, and external navigation', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const doc = extract(`<p>Alternatives: <math><mrow><mi style="display:none">excluded-style</mi><mi class="hidden">excluded-class</mi><mi hidden>excluded-attribute</mi><mi aria-hidden="true">excluded-aria</mi><mi>x</mi></mrow></math>.</p>
			<p>Roots: <math class="header"><mi>excluded-root-chrome</mi></math><math class="hidden"><mi>excluded-root-class</mi></math><math aria-hidden="true"><mi>excluded-root-aria</mi></math><math style="display:none"><mi>retained-root-style</mi></math>.</p>
			<nav class="navigation">excluded-navigation <math><mi>excluded-nav-math</mi></math></nav>`);
		expect(doc.body.textContent).not.toContain('excluded-');
		expect(doc.querySelector('mrow')?.textContent).toBe('x');
		expect(doc.body.textContent).toContain('retained-root-style');
	});

	test('does not shield HTML annotations or bypass final sanitization', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const doc = extract(`<p>Mixed: <math><semantics><mi onclick="evil()">x</mi><annotation-xml encoding="text/html"><span class="header">excluded-html-chrome</span><span style="visibility:hidden">excluded-html-hidden</span><mi class="header">excluded-html-mi</mi><a href="javascript:evil()" onmouseover="evil()">link</a><script>evil()</script></annotation-xml></semantics></math>.</p>`);
		expect(doc.body.textContent).not.toContain('excluded-');
		expect(doc.body.textContent).not.toContain('evil()');
		expect(doc.querySelector('[onclick], [onmouseover], script')).toBeNull();
		expect(doc.querySelector('a')?.hasAttribute('href')).toBe(false);
		expect(doc.querySelector('math mi')?.textContent).toBe('x');
		const sanitized = extract('<p>Formula: <math><mrow href="javascript:evil()"><mi onclick="evil()">x</mi><script>evil()</script></mrow></math>.</p>', {
			standardize: false, removeExactSelectors: false, removePartialSelectors: false, removeHiddenElements: false
		});
		expect(sanitized.querySelector('[onclick], [href], script')).toBeNull();
		expect(sanitized.querySelector('math mi')?.textContent).toBe('x');
	});

	test('keeps hidden accessibility sources but removes KaTeX/MathJax render duplicates', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		const doc = extract(`<p>KaTeX: <span class="katex"><span class="katex-mathml"><math><mi>x</mi></math></span><span class="katex-html" aria-hidden="true">excluded-katex-render</span></span>.</p>
			<p>MathJax: <mjx-container><mjx-math aria-hidden="true"><mjx-mi>excluded-mathjax-render</mjx-mi></mjx-math><mjx-assistive-mml><math><mi>y</mi></math></mjx-assistive-mml></mjx-container>.</p>
			<p>Accessibility: <span class="mwe-math-mathml-a11y" style="display:none"><math><mi>z</mi></math></span>.</p>`);
		expect(doc.body.textContent).not.toContain('excluded-');
		expect(Array.from(doc.querySelectorAll('math')).map(math => math.textContent)).toEqual(['x', 'y', 'z']);
	});

	test('recognizes namespace-aware MathML without protecting the root or foreign namespaces', () => {
		const doc = parseDocument('<html><body></body></html>');
		const math = doc.createElementNS(NS, 'math');
		const fraction = doc.createElementNS(NS, 'mfrac');
		const token = doc.createElementNS(NS, 'mi');
		math.appendChild(fraction);
		fraction.appendChild(token);
		expect(isMathMLArgument(math)).toBe(false);
		expect(isMathMLArgument(token)).toBe(true);
		const foreign = doc.createElementNS('http://www.w3.org/2000/svg', 'mi');
		fraction.appendChild(foreign);
		expect(isMathMLArgument(foreign)).toBe(false);
		const parsed = parseDocument('<html><body><math><mi><mglyph class="header"></mglyph></mi></math></body></html>');
		expect(isMathMLArgument(parsed.querySelector('mglyph')!)).toBe(true);
	});

	test.each(['mtext', 'annotation-xml'])('does not mistake HTML mi below %s for a MathML argument', (tag) => {
		const doc = parseDocument(`<html><body><math><${tag} encoding="text/html"><mi class="header">HTML</mi><math><mi>nested</mi></math></${tag}></math></body></html>`);
		const tokens = doc.querySelectorAll('mi');
		expect(isMathMLArgument(tokens[0])).toBe(false);
		expect(isMathMLArgument(tokens[1])).toBe(true);
	});
});
