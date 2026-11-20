import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { parseDocument } from './helpers';

// GHSA-3cr7-rgx8-76c3: template fragments evade descendant traversal and can
// become executable through mutation XSS when server output is reparsed.

const PARA = '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris.</p>';

function makeArticle(payload: string): string {
	return `<!DOCTYPE html>
<html>
<head><title>Template payload</title></head>
<body>
<article>
<h1>Template payload</h1>
${PARA}
<p>before ${payload} after</p>
${PARA}
${PARA}
</article>
</body>
</html>`;
}

const PAYLOADS: Array<[string, string]> = [
	['event handler in an SVG-wrapped template', '<svg><template><img src="x" onerror="alert(document.domain)"></template></svg>'],
	['script in a bare template', '<template><script>alert(1)</script></template>'],
	['javascript: URL in a template', '<template><a href="javascript:alert(1)">click</a></template>'],
	['srcdoc iframe in a template', '<template><iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe></template>'],
	['nested templates', '<template><template><img src="x" onerror="alert(1)"></template></template>']
];

describe('Template content sanitization (GHSA-3cr7-rgx8-76c3)', () => {
	for (const [name, payload] of PAYLOADS) {
		test(`strips ${name}`, async () => {
			const url = 'https://example.com/template';
			const result = await Defuddle(parseDocument(makeArticle(payload), url), url);

			expect(result.content).not.toMatch(/<template\b/i);
			expect(result.content).not.toMatch(/\son[a-z]+\s*=/i);
			expect(result.content).not.toMatch(/<script\b/i);
			expect(result.content).not.toContain('javascript:');
			expect(result.content).not.toContain('srcdoc');
			expect(result.content).toContain('before');
			expect(result.content).toContain('after');
		});
	}
});

// contentSelector can make an unsafe element the sanitizer root.
describe.each(['linkedom', 'jsdom'])('Unsafe root element sanitization (%s)', implementation => {
	const URL_ = 'https://example.com/root';

	function parse(html: string): Document {
		if (implementation === 'jsdom') return new JSDOM(html, { url: URL_ }).window.document as any;
		return parseLinkedomHTML(html, URL_);
	}

	const ROOT_PAYLOAD = '<img src="x" onerror="alert(document.domain)"><script>alert(1)</script><a href="javascript:alert(2)">z</a><iframe srcdoc="&lt;script&gt;alert(3)&lt;/script&gt;"></iframe>';

	function pageWithRoot(root: string): string {
		return `<!DOCTYPE html>
<html>
<head><title>Unsafe root</title></head>
<body>
${root}
<article><h1>Unsafe root</h1>${PARA}${PARA}</article>
</body>
</html>`;
	}

	test('omits a <template> named by contentSelector', async () => {
		const result = await Defuddle(parse(pageWithRoot(`<template id="payload">${ROOT_PAYLOAD}</template>`)), URL_, {
			contentSelector: 'template'
		});

		expect(result.content).toBe('');
		expect(result.content).not.toMatch(/\son[a-z]+\s*=/i);
		expect(result.content).not.toMatch(/<script\b/i);
		expect(result.content).not.toContain('javascript:');
		expect(result.content).not.toContain('srcdoc');
		expect(result.content).not.toContain('alert');
	});

	test.each([
		['script', '<script id="payload">alert(1)</script>'],
		['external script', '<script id="payload" src="https://attacker.example/payload.js"></script>'],
		['style', '<style id="payload">@import url("http://attacker.example/leak.css");</style>'],
		['object', '<object id="payload" data="javascript:alert(1)"><img src="x" onerror="alert(2)"></object>'],
		['embed', '<embed id="payload" src="https://attacker.example/payload.html">'],
		['base', '<base id="payload" href="https://attacker.example/">']
	])('omits a <%s> named by contentSelector', async (_tag, root) => {
		const result = await Defuddle(parse(pageWithRoot(root)), URL_, { contentSelector: '#payload' });

		expect(result.content).toBe('');
		expect(result.content).not.toMatch(/\son[a-z]+\s*=/i);
		expect(result.content).not.toContain('javascript:');
		expect(result.content).not.toContain('alert');
		expect(result.content).not.toContain('attacker.example');
	});

	test('a safe root selected by contentSelector still keeps its content', async () => {
		const html = `<!DOCTYPE html>
<html><head><title>Safe root</title></head>
<body><section id="payload"><p>Keep this sentence intact.</p>${PARA}</section></body></html>`;
		const result = await Defuddle(parse(html), URL_, { contentSelector: '#payload' });

		expect(result.content).toContain('Keep this sentence intact.');
	});

	test('preserves a mixed-case math script root', async () => {
		const result = await Defuddle(parse(pageWithRoot(
			'<script id="payload" type="Math/TeX">E = mc^2</script>'
		)), URL_, { contentSelector: '#payload' });

		expect(result.content).toContain('type="Math/TeX"');
		expect(result.content).toContain('E = mc^2');
	});
});

// Preserve debug identity before unsafe-root neutralization strips attributes.
describe('Debug selector for a neutralized root', () => {
	test('still identifies the element named by contentSelector', async () => {
		const url = 'https://example.com/debug-root';
		const html = `<!DOCTYPE html>
<html><head><title>Debug root</title></head>
<body><template id="payload"><p>x</p></template><article>${PARA}${PARA}</article></body></html>`;
		const result = await Defuddle(parseLinkedomHTML(html, url), url, {
			contentSelector: '#payload',
			debug: true
		});

		expect(result.content).toBe('');
		expect(result.debug?.contentSelector).toContain('#payload');
	});
});
