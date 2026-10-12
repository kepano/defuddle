import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle, DefuddleOptions } from '../src/node';
import { parseDocument } from './helpers';

const url = 'https://example.com/annotations';
const expression = '<mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow>';
const annotated = (encoding: string, children: string) =>
	`<math display="block"><semantics>${expression}<annotation-xml encoding="${encoding}">${children}</annotation-xml></semantics></math>`;

async function extract(html: string, options: DefuddleOptions = {}) {
	const doc = parseDocument(`<html><head><title>Annotation example</title></head><body><article><p>Before the expression.</p>${html}<p>After the expression.</p></article></body></html>`, url);
	const original = doc.documentElement.outerHTML;
	const inputAnnotation = doc.querySelector('math annotation-xml');
	const result = await Defuddle(doc, url, {
		contentSelector: 'article',
		removeLowScoring: false,
		useAsync: false,
		separateMarkdown: true,
		...options,
	});
	expect(doc.documentElement.outerHTML).toBe(original);
	// A spec-compliant reparse is required even when extraction uses linkedom.
	const reparsed = new JSDOM(`<html><body>${result.content}</body></html>`).window.document;
	return { result, reparsed, inputAnnotation };
}

describe('MathML annotation-xml extraction and reparse', () => {
	test.each([
		['application/mathml+xml', '<ci>c</ci>', 'ci', 'c'],
		['text/html', '<p>Alternative explanation.</p>', 'p', 'Alternative explanation.'],
		['application/xhtml+xml', '<p>Alternative explanation.</p>', 'p', 'Alternative explanation.'],
		['TEXT/HTML', '<p>Alternative explanation.</p>', 'p', 'Alternative explanation.'],
	])('keeps the annotation boundary and encoding: %s', async (encoding, children, tag, text) => {
		const { result, reparsed, inputAnnotation } = await extract(annotated(encoding, children));
		expect(inputAnnotation?.getAttribute('encoding')).toBe(encoding);
		expect(inputAnnotation?.querySelector(tag)?.textContent).toBe(text);
		const semantics = reparsed.querySelector('math > semantics')!;
		expect(Array.from(semantics.children, child => child.localName)).toEqual(['mrow', 'annotation-xml']);
		const annotation = semantics.querySelector('annotation-xml')!;
		expect(annotation.getAttribute('encoding')).toBe(encoding);
		expect(annotation.querySelector(tag)?.textContent).toBe(text);
		expect(annotation.querySelector(tag)?.namespaceURI).toBe(tag === 'ci'
			? 'http://www.w3.org/1998/Math/MathML'
			: 'http://www.w3.org/1999/xhtml');
		expect(reparsed.querySelector('math')?.getAttribute('data-latex')).toBe('a+b');
		expect(result.contentMarkdown).toBe('Before the expression.\n\n$$\na+b\n$$\n\nAfter the expression.');
	});

	test.each(['text/html', 'application/xhtml+xml'])('still replaces custom HTML elements inside %s', async encoding => {
		const { reparsed } = await extract(annotated(encoding, '<my-note>Alternative explanation.</my-note>'));
		expect(reparsed.querySelector('my-note')).toBeNull();
		expect(reparsed.querySelector('math annotation-xml p')?.textContent).toBe('Alternative explanation.');
	});

	test.each(['annotation-xml', 'my-widget'])('still replaces %s outside math', async tag => {
		const { reparsed } = await extract(`<${tag} encoding="text/html"><p>Orphan explanation.</p></${tag}>`);
		expect(reparsed.querySelector(tag)).toBeNull();
		expect(reparsed.body.textContent).toContain('Orphan explanation.');
	});

	test('does not whitelist encoding on ordinary annotation or HTML elements', async () => {
		const { reparsed } = await extract('<p encoding="text/html">Paragraph.</p><math><semantics><mi>x</mi><annotation encoding="application/x-tex">x</annotation></semantics></math>');
		expect(reparsed.querySelector('[encoding]')).toBeNull();
	});

	test.each([
		'<math><semantics><mi>c</mi><annotation encoding="application/x-tex">alternate</annotation></semantics></math>',
		'<p>Alternative explanation.</p><script type="math/tex">alternate</script>',
	])('does not source the outer formula from TeX inside an XML alternative', async children => {
		const { reparsed, result } = await extract(annotated('text/html', children));
		expect(reparsed.querySelector('math')?.getAttribute('data-latex')).toBe('a+b');
		expect(reparsed.querySelector('math annotation-xml')).not.toBeNull();
		expect(result.contentMarkdown).toBe('Before the expression.\n\n$$\na+b\n$$\n\nAfter the expression.');
	});

	test.each(['text/html', 'application/xhtml+xml'])('sanitizes %s annotations independently of cleanup options', async encoding => {
		const poisoned = annotated(encoding, '<p onclick="alert(1)"><a href="javascript:alert(2)">link</a><a href="blob:https://example.com/token">blob link</a><a href="data:text/html,bad">data link</a></p><script>alert(3)</script><img src="javascript:alert(4)" onerror="alert(5)"><iframe src="javascript:alert(6)" srcdoc="&lt;script&gt;alert(7)&lt;/script&gt;"></iframe><template><img src="x" onerror="alert(8)"></template>');
		for (const options of [{}, { debug: true }, { standardize: false }]) {
			const { reparsed } = await extract(poisoned, options);
			const annotation = reparsed.querySelector('math annotation-xml')!;
			expect(annotation.getAttribute('encoding')).toBe(encoding);
			expect(annotation.textContent).toContain('link');
			expect(reparsed.querySelector('script, template, [srcdoc]')).toBeNull();
			for (const el of Array.from(reparsed.querySelectorAll('*'))) {
				for (const attr of Array.from(el.attributes)) {
					expect(attr.name).not.toMatch(/^on/i);
					if (['href', 'src'].includes(attr.name)) {
						expect(attr.value).not.toMatch(/^(javascript:|blob:|data:text\/html)/i);
					}
				}
			}
		}
	});
});
