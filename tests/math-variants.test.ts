import { describe, test, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { MathMLToLaTeX } from 'mathml-to-latex';
import * as core from '../src/elements/math.core';
import * as full from '../src/elements/math.full';
import { parseDocument, normalizeHtmlAttributes } from './helpers';
import { Defuddle } from '../src/defuddle';
import { standardizeExtractorOutput } from '../src/standardize';

// Vitest aliases './elements/math' to the full implementation, so the
// fixture suite never exercises math.core. These tests call both variants
// directly to pin their shared behavior and their intended differences.

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

describe.each([false, true])('operator attributes (debug=%s)', (debug) => {
	test.each([
		['form', 'prefix'], ['form', 'infix'], ['form', 'postfix'], ['form', 'PrEfIx'],
		['largeop', 'true'], ['largeop', 'false'], ['largeop', 'TrUe'], ['largeop', 'FALSE'],
	])('preserves valid %s=%s spelling on a math operator', (name, value) => {
		const doc = parseDocument('<html><body><math><mstyle><mrow><mo>+</mo></mrow></mstyle></math></body></html>');
		const operator = doc.querySelector('mo')!;
		operator.setAttribute(name, value);
		standardizeExtractorOutput(doc.body, debug);
		expect(operator.getAttribute(name)).toBe(value);
	});

	test.each(['', ' prefix', 'prefix ', 'prefix\n', 'prefix\t', 'preſix', 'false ', 'false\n', '1', 'yes',
		'javascript:alert(1)', 'url(https://example.com/)', 'expression(alert(1))', '" onclick="alert(1)'])('rejects invalid values: %j', (value) => {
		const doc = parseDocument('<html><body><math><mo>+</mo></math></body></html>');
		const operator = doc.querySelector('mo')!;
		operator.setAttribute('form', value);
		operator.setAttribute('largeop', value);
		standardizeExtractorOutput(doc.body, debug);
		expect(operator.hasAttribute('form')).toBe(false);
		expect(operator.hasAttribute('largeop')).toBe(false);
	});

	test.each([
		'<mo form="prefix" largeop="false">+</mo>',
		'<p form="prefix" largeop="false">text</p>',
		'<math><mi form="prefix" largeop="false">x</mi></math>',
		'<math><mtext><mo form="prefix" largeop="false">+</mo></mtext></math>',
		'<math><mi><mo form="prefix" largeop="false">+</mo></mi></math>',
		'<math><mn><mo form="prefix" largeop="false">+</mo></mn></math>',
		'<math><ms><mo form="prefix" largeop="false">+</mo></ms></math>',
		'<math><mo><mo form="prefix" largeop="false">+</mo></mo></math>',
		'<math><semantics><annotation-xml encoding="text/html"><mo form="prefix" largeop="false">+</mo></annotation-xml></semantics></math>',
		'<math><semantics><annotation-xml encoding="application/xhtml+xml"><mo form="prefix" largeop="false">+</mo></annotation-xml></semantics></math>',
		'<math><unknown><mo form="prefix" largeop="false">+</mo></unknown></math>',
	])('does not grant operator attributes to HTML lookalikes: %s', (html) => {
		const doc = parseDocument(`<html><body>${html}</body></html>`);
		standardizeExtractorOutput(doc.body, debug);
		expect(doc.querySelector('[form], [largeop]')).toBeNull();
	});

	test.each(['mo', 'mrow'])('rejects a foreign-namespace %s in a MathML-looking path', (tag) => {
		// linkedom does not retain these namespaces; JSDOM exercises the native guard.
		const { JSDOM } = createRequire(import.meta.url)('jsdom');
		const doc = new JSDOM('<math><mrow><mo form="prefix" largeop="false">+</mo></mrow></math>').window.document as Document;
		const original = doc.querySelector(tag)!;
		const foreign = doc.createElementNS('urn:example', tag);
		while (original.firstChild) foreign.appendChild(original.firstChild);
		for (const attr of Array.from(original.attributes)) foreign.setAttribute(attr.name, attr.value);
		original.replaceWith(foreign);
		standardizeExtractorOutput(doc.body, debug);
		expect(doc.querySelector('[form], [largeop]')).toBeNull();
	});

	test('recognizes a nested math boundary inside HTML integration content', () => {
		const doc = parseDocument('<html><body><math><mtext><math><mo form="postfix" largeop="false">+</mo></math></mtext></math></body></html>');
		standardizeExtractorOutput(doc.body, debug);
		expect(doc.querySelector('mo')?.getAttribute('form')).toBe('postfix');
		expect(doc.querySelector('mo')?.getAttribute('largeop')).toBe('false');
	});

	test('keeps operator intent without relaxing event, URL or CSS sanitization', () => {
		const doc = parseDocument('<html><head></head><body><article><p>Operator context before the expression.</p><math display="block"><mrow><mo form="prefix" largeop="false" onclick="alert(1)" href="javascript:alert(1)" style="color:red" mathcolor="red">+</mo><mi>x</mi><mo form="prefix&#10;" largeop="url(https://example.com/)">+</mo></mrow></math><p>Operator context after the expression.</p></article></body></html>');
		const original = doc.documentElement.outerHTML;
		const result = new Defuddle(doc, { url: 'https://example.com/', contentSelector: 'article', debug, removeLowScoring: false }).parse();
		const output = parseDocument(`<html><body>${result.content}</body></html>`);
		const operators = output.querySelectorAll('mo');
		expect(operators[0].getAttribute('form')).toBe('prefix');
		expect(operators[0].getAttribute('largeop')).toBe('false');
		expect(operators[1].hasAttribute('form')).toBe(false);
		expect(operators[1].hasAttribute('largeop')).toBe(false);
		expect(output.querySelector('[onclick], [href], [style], [mathcolor]')).toBeNull();
		expect(result.warnings).toBeUndefined();
		expect(doc.documentElement.outerHTML).toBe(original);
	});

	test.each(['text/html', 'application/xhtml+xml'])('does not grant attributes when cleanup promotes %s annotation content', (encoding) => {
		const doc = parseDocument(`<html><head></head><body><article><p>Context before.</p><math display="block"><semantics><mrow><mi>x</mi><mo form="prefix">+</mo><mi>y</mi></mrow><annotation-xml encoding="${encoding}"><mo form="postfix" largeop="false" onclick="alert(1)" style="color:red">!</mo></annotation-xml></semantics></math><p>Context after.</p></article></body></html>`);
		const result = new Defuddle(doc, { url: 'https://example.com/', contentSelector: 'article', debug, removeLowScoring: false }).parse();
		const output = parseDocument(`<html><body>${result.content}</body></html>`);
		const operators = output.querySelectorAll('mo');
		expect(operators[0].getAttribute('form')).toBe('prefix');
		expect(operators[1].hasAttribute('form')).toBe(false);
		expect(operators[1].hasAttribute('largeop')).toBe(false);
		expect(output.querySelector('[onclick], [style]')).toBeNull();
		expect(result.warnings).toBeUndefined();
	});
});

type MathModule = typeof core | typeof full;

function transform(mod: MathModule, html: string) {
	const doc = parseDocument(`<html><body>${html}</body></html>`);
	const el = doc.querySelector('#target')!;
	const parent = el.parentElement!;
	const result = mod.mathRules[0].transform(el, doc);
	return { result, parent, html: normalizeHtmlAttributes(result.outerHTML) };
}

const SHARED_CASES: Record<string, string> = {
	'data-mathml with sibling scripts': `<div><span class="MathJax_Preview">x</span><span class="MathJax" id="target" data-mathml="&lt;math xmlns=&quot;${MATHML_NS}&quot;&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;"></span><script type="math/tex">x</script><p>keep</p></div>`,
	'math element without annotation': '<div><math id="target"><mi>x</mi><mo>+</mo><mn>1</mn></math></div>',
	'block math with alttext': '<div><math id="target" display="block" alttext="x+1"><mi>x</mi><mo>+</mo><mn>1</mn></math></div>',
	'KaTeX with TeX annotation': '<p><span class="katex" id="target"><span class="katex-mathml"><math><semantics><mrow><mi>y</mi></mrow><annotation encoding="application/x-tex">y</annotation></semantics></math></span><span class="katex-html">y</span></span></p>',
};

describe.each([
	['core', core],
	['full', full],
] as const)('math rules (%s)', (_name, mod) => {
	test('copies existing MathML and sets math attributes', () => {
		const { result } = transform(mod, SHARED_CASES['data-mathml with sibling scripts']);
		expect(result.tagName.toLowerCase()).toBe('math');
		expect(result.getAttribute('xmlns')).toBe(MATHML_NS);
		expect(result.getAttribute('display')).toBe('inline');
		expect(result.getAttribute('data-latex')).toBe('x');
		expect(result.querySelector('mi')?.textContent).toBe('x');
	});

	test('transforms cloned content in its owner document without mutating the original', () => {
		const doc = parseDocument(`<html><body>${SHARED_CASES['data-mathml with sibling scripts']}</body></html>`);
		const originalHtml = doc.documentElement.outerHTML;
		const clone = doc.cloneNode(true) as Document;
		const el = clone.querySelector('#target')!;

		// The pipeline passes the original document while transforming cloned nodes.
		const result = mod.mathRules[0].transform(el, doc);
		// linkedom clones retain the original ownerDocument; JSDOM uses the clone.
		expect(result.ownerDocument === el.ownerDocument).toBe(true);
		el.replaceWith(result);

		expect(clone.querySelector('math mi')?.textContent).toBe('x');
		expect(clone.querySelector('math')?.getAttribute('data-latex')).toBe('x');
		expect(clone.querySelector('script[type^="math/"], .MathJax_Preview')).toBeNull();
		expect(clone.querySelector('p')?.textContent).toBe('keep');
		expect(doc.documentElement.outerHTML).toBe(originalHtml);
	});

	test('removes sibling math scripts and previews but keeps other content', () => {
		const { parent } = transform(mod, SHARED_CASES['data-mathml with sibling scripts']);
		expect(parent.querySelector('script[type^="math/"]')).toBeNull();
		expect(parent.querySelector('.MathJax_Preview')).toBeNull();
		expect(parent.querySelector('p')?.textContent).toBe('keep');
	});

	test('keeps sibling math scripts when the target is itself a math script', () => {
		const { parent } = transform(mod, '<div><script type="math/tex" id="target">a^2</script><script type="math/tex">b^2</script></div>');
		expect(parent.querySelectorAll('script[type="math/tex"]').length).toBe(2);
	});

	test('reads block display and LaTeX from alttext', () => {
		const { result } = transform(mod, SHARED_CASES['block math with alttext']);
		expect(result.getAttribute('display')).toBe('block');
		expect(result.getAttribute('data-latex')).toBe('x+1');
		expect(result.querySelectorAll('mi, mo, mn').length).toBe(3);
	});

	test('reads LaTeX from a KaTeX annotation', () => {
		const { result } = transform(mod, SHARED_CASES['KaTeX with TeX annotation']);
		expect(result.getAttribute('data-latex')).toBe('y');
		expect(result.querySelector('annotation')?.textContent).toBe('y');
	});
});

describe('math rules core/full parity', () => {
	test.each(Object.keys(SHARED_CASES))('produces identical output: %s', (name) => {
		const coreOut = transform(core, SHARED_CASES[name]);
		const fullOut = transform(full, SHARED_CASES[name]);
		expect(coreOut.html).toBe(fullOut.html);
		expect(normalizeHtmlAttributes(coreOut.parent.outerHTML)).toBe(normalizeHtmlAttributes(fullOut.parent.outerHTML));
	});
});

const LATEX_ONLY = '<div><script type="math/tex; mode=display" id="target">\\frac{a}{b}</script></div>';
const MATHML_ONLY = '<div><mjx-container id="target"><mjx-assistive-mml><math><mfrac><mi>a</mi><mi>b</mi></mfrac></math></mjx-assistive-mml></mjx-container></div>';

describe('math rules variant differences', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('core keeps LaTeX-only math as text', () => {
		const { result } = transform(core, LATEX_ONLY);
		expect(result.getAttribute('display')).toBe('block');
		expect(result.getAttribute('data-latex')).toBe('\\frac{a}{b}');
		expect(result.children.length).toBe(0);
		expect(result.textContent).toBe('\\frac{a}{b}');
	});

	test('full converts LaTeX-only math to MathML', () => {
		const { result } = transform(full, LATEX_ONLY);
		expect(result.getAttribute('display')).toBe('block');
		expect(result.getAttribute('data-latex')).toBe('\\frac{a}{b}');
		expect(result.querySelector('mfrac')).not.toBeNull();
	});

	test('full falls back to LaTeX text when LaTeX conversion throws', () => {
		const temml = createRequire(import.meta.url)('temml');
		vi.spyOn(temml, 'renderToString').mockImplementation(() => { throw new Error('boom'); });
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { result } = transform(full, LATEX_ONLY);
		expect(result.children.length).toBe(0);
		expect(result.textContent).toBe('\\frac{a}{b}');
	});

	test('full falls back to LaTeX text when conversion yields no math element', () => {
		const temml = createRequire(import.meta.url)('temml');
		vi.spyOn(temml, 'renderToString').mockReturnValue('<span></span>');
		const { result } = transform(full, LATEX_ONLY);
		expect(result.children.length).toBe(0);
		expect(result.textContent).toBe('\\frac{a}{b}');
	});

	test('core leaves data-latex empty for MathML without a LaTeX source', () => {
		const { result } = transform(core, MATHML_ONLY);
		expect(result.getAttribute('data-latex')).toBe('');
		expect(result.querySelector('mfrac')).not.toBeNull();
	});

	test('full derives data-latex from MathML without a LaTeX source', () => {
		const { result } = transform(full, MATHML_ONLY);
		expect(result.getAttribute('data-latex')).toBe('\\frac{a}{b}');
		expect(result.querySelector('mfrac')).not.toBeNull();
	});

	test('full keeps MathML and empty data-latex when MathML conversion throws', () => {
		vi.spyOn(MathMLToLaTeX, 'convert').mockImplementation(() => { throw new Error('boom'); });
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { result } = transform(full, MATHML_ONLY);
		expect(result.getAttribute('data-latex')).toBe('');
		expect(result.querySelector('mfrac')).not.toBeNull();
	});
});

describe('core math dependencies', () => {
	// The core bundle must not pull in the full build's conversion libraries.
	const FULL_ONLY_DEPS = ['mathml-to-latex', 'temml'];

	function collectSpecifiers(entry: string, seen = new Set<string>(), bare = new Set<string>()) {
		if (seen.has(entry)) return bare;
		seen.add(entry);
		const source = readFileSync(entry, 'utf8');
		const pattern = /(?:from\s+|import\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
		for (const [, specifier] of source.matchAll(pattern)) {
			if (!specifier.startsWith('.')) {
				bare.add(specifier);
				continue;
			}
			const base = resolve(dirname(entry), specifier);
			const file = [`${base}.ts`, resolve(base, 'index.ts')].find(existsSync);
			if (file) collectSpecifiers(file, seen, bare);
		}
		return bare;
	}

	test('math.core does not import full-build conversion libraries', () => {
		const bare = collectSpecifiers(resolve(__dirname, '../src/elements/math.core.ts'));
		for (const dep of FULL_ONLY_DEPS) {
			expect(bare.has(dep), `math.core imports ${dep}`).toBe(false);
		}
	});

	test('dependency scan detects full-build libraries in math.full', () => {
		const bare = collectSpecifiers(resolve(__dirname, '../src/elements/math.full.ts'));
		for (const dep of FULL_ONLY_DEPS) {
			expect(bare.has(dep)).toBe(true);
		}
	});
});
