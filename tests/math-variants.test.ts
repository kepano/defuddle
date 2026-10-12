import { describe, test, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { MathMLToLaTeX } from 'mathml-to-latex';
import * as core from '../src/elements/math.core';
import * as full from '../src/elements/math.full';
import { createMathElement } from '../src/elements/math.base';
import Defuddle from '../src/index';
import { parseDocument, normalizeHtmlAttributes } from './helpers';

// Vitest aliases './elements/math' to the full implementation, so the
// fixture suite never exercises math.core. These tests call both variants
// directly to pin their shared behavior and their intended differences.

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

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

	test.each([
		['dir', 'rtl'],
		['displaystyle', 'true'],
		['mathsize', '200%'],
	])('preserves existing root %s', (name, value) => {
		const { result } = transform(mod, `<p><math id="target" ${name}="${value}"><mi>x</mi></math></p>`);
		expect(normalizeHtmlAttributes(result.outerHTML)).toBe(normalizeHtmlAttributes(
			`<math xmlns="${MATHML_NS}" display="inline" data-latex="x" ${name}="${value}"><mi>x</mi></math>`
		));
	});

	test.each([
		['data-mathml', '<span class="MathJax" id="target" dir="ltr" displaystyle="true" mathsize="50%" data-mathml="&lt;math dir=&quot;rtl&quot; displaystyle=&quot;false&quot; mathsize=&quot;200%&quot;&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;"></span>'],
		['assistive MathML', '<mjx-container id="target" dir="ltr" displaystyle="true" mathsize="50%"><mjx-assistive-mml><math dir="rtl" displaystyle="false" mathsize="200%"><mi>x</mi></math></mjx-assistive-mml></mjx-container>'],
		['KaTeX', '<span class="katex" id="target" dir="ltr" displaystyle="true" mathsize="50%"><span class="katex-mathml"><math dir="rtl" displaystyle="false" mathsize="200%"><mi>x</mi></math></span></span>'],
	])('takes presentation attributes from MathML, not its %s wrapper', (_name, html) => {
		const { result } = transform(mod, html);
		expect(result.getAttribute('dir')).toBe('rtl');
		expect(result.getAttribute('displaystyle')).toBe('false');
		expect(result.getAttribute('mathsize')).toBe('200%');
		expect(result.querySelector('mi')?.textContent).toBe('x');
	});

	test('serializes copied attribute values without creating executable attributes', () => {
		const { result } = transform(mod, '<p><math id="target" mathsize="200%&quot; onmouseover=&quot;alert(1)"><mi>x</mi></math></p>');
		const reparsed = parseDocument(`<html><body>${result.outerHTML}</body></html>`).querySelector('math')!;
		expect(reparsed.getAttribute('mathsize')).toBe('200%" onmouseover="alert(1)');
		expect(Array.from(reparsed.attributes).map(attr => attr.name).sort()).toEqual(
			['data-latex', 'display', 'mathsize', 'xmlns']
		);
	});

	test('copies only root presentation attributes without overriding canonical attributes', () => {
		const doc = parseDocument('<html><body></body></html>');
		const result = mod.createCleanMathEl({
			mathml: '<math xmlns="https://example.com/not-mathml" display="inline" data-latex="forged" dir="rtl" displaystyle="false" mathsize="200%" onclick="alert(1)" onmouseover="alert(1)" href="javascript:alert(1)" xlink:href="javascript:alert(1)" src="data:text/html,evil" srcdoc="evil" style="background:url(https://example.com/track)" class="source" id="source" data-other="source" form="prefix" largeop="true" encoding="text/html" mathcolor="red" mathbackground="yellow"><mi>x</mi></math>',
			latex: 'forged',
			isBlock: false,
		}, 'x', true, doc);
		expect(normalizeHtmlAttributes(result.outerHTML)).toBe(normalizeHtmlAttributes(
			`<math xmlns="${MATHML_NS}" display="block" data-latex="x" dir="rtl" displaystyle="false" mathsize="200%"><mi>x</mi></math>`
		));
	});

	test('does not promote LaTeX source attributes to the rendered root', () => {
		const { result } = transform(mod, '<p><script type="math/tex" id="target" dir="rtl" displaystyle="true" mathsize="200%">\\frac{a}{b}</script></p>');
		for (const name of ['dir', 'displaystyle', 'mathsize']) {
			expect(result.hasAttribute(name)).toBe(false);
		}
		expect(result.getAttribute('data-latex')).toBe('\\frac{a}{b}');
		if (mod === full) expect(result.querySelector('mfrac')).not.toBeNull();
		else expect(result.textContent).toBe('\\frac{a}{b}');
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

test('does not copy rendered LaTeX root attributes through the existing-MathML policy', () => {
	const doc = parseDocument('<html><body></body></html>');
	const render = vi.fn(() => {
		const math = doc.createElement('math');
		math.setAttribute('dir', 'rtl');
		math.setAttribute('displaystyle', 'true');
		math.setAttribute('mathsize', '200%');
		math.appendChild(doc.createElement('mi')).textContent = 'x';
		return math;
	});
	const result = createMathElement(null, 'x', false, doc, render);
	expect(render).toHaveBeenCalledWith('x', false, doc);
	expect(normalizeHtmlAttributes(result.outerHTML)).toBe(normalizeHtmlAttributes(
		`<math xmlns="${MATHML_NS}" display="inline" data-latex="x"><mi>x</mi></math>`
	));
});

test('preserves root attributes through extraction and sanitizes hostile descendants without fallback', () => {
	const log = vi.spyOn(console, 'log').mockImplementation(() => {});
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		const doc = parseDocument(`<html><body><nav>Outside content</nav><article><p>Formula:
			<math dir="rtl" displaystyle="false" mathsize="200%" onclick="alert(1)" href="javascript:alert(1)" style="background:url(https://example.com/track)">
				<mi onclick="alert(1)" href="javascript:alert(1)" style="background:url(https://example.com/track)">x</mi>
			</math> remains readable.</p></article></body></html>`, 'https://example.com/article');
		const response = new Defuddle(doc, { url: 'https://example.com/article', contentSelector: 'article', debug: true }).parse();
		expect(error).not.toHaveBeenCalled();
		expect(response.debug?.errors).toBeUndefined();
		expect(response.debug?.contentSelector).toContain('article');
		expect(response.content).not.toContain('Outside content');
		const math = parseDocument(`<html><body>${response.content}</body></html>`).querySelector('math')!;
		expect(math.getAttribute('dir')).toBe('rtl');
		expect(math.getAttribute('displaystyle')).toBe('false');
		expect(math.getAttribute('mathsize')).toBe('200%');
		expect(math.getAttribute('xmlns')).toBe(MATHML_NS);
		expect(math.getAttribute('data-latex')).toBe('x');
		expect(math.querySelector('mi')?.textContent).toBe('x');
		for (const el of [math, ...Array.from(math.querySelectorAll('*'))]) {
			for (const attr of Array.from(el.attributes)) {
				expect(attr.name).not.toMatch(/^on/i);
				expect(['href', 'src', 'xlink:href', 'style', 'srcdoc']).not.toContain(attr.name);
			}
		}
	} finally {
		log.mockRestore();
		error.mockRestore();
	}
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
