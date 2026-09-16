import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

const PARA = '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris.</p>';

describe.each(['linkedom', 'jsdom'])('Declarative shadow DOM (%s)', implementation => {
	const URL_ = 'https://example.com/dsd';

	function parse(html: string): Document {
		if (implementation === 'jsdom') return new JSDOM(html, { url: URL_ }).window.document as any;
		return parseLinkedomHTML(html, URL_);
	}

	function page(inner: string): string {
		return `<!DOCTYPE html>
<html><head><title>Declarative shadow DOM</title></head>
<body><article><h1>Declarative shadow DOM</h1>${PARA}<div>${inner}</div>${PARA}${PARA}</article></body></html>`;
	}

	test.each(['shadowrootmode', 'shadowroot'])('keeps content behind a %s template', async attr => {
		const result = await Defuddle(
			parse(page(`<template ${attr}="open"><p>Shadow body text worth keeping.</p></template>`)),
			URL_
		);

		expect(result.content).toContain('Shadow body text worth keeping.');
		expect(result.content).not.toMatch(/<template\b/i);
	});

	test.each(['shadowrootmode', 'shadowroot'])('does not hoist an invalid %s mode', async attr => {
		const result = await Defuddle(
			parse(page(`<template ${attr}="bogus"><p>Inert shadow text must stay hidden.</p></template>`)),
			URL_
		);

		expect(result.content).not.toContain('Inert shadow text must stay hidden.');
		expect(result.content).not.toMatch(/<template\b/i);
	});

	test('keeps content behind a nested declarative shadow root', async () => {
		const result = await Defuddle(
			parse(page('<template shadowrootmode="open"><div><template shadowrootmode="open"><p>Nested shadow text worth keeping.</p></template></div></template>')),
			URL_
		);

		expect(result.content).toContain('Nested shadow text worth keeping.');
		expect(result.content).not.toMatch(/<template\b/i);
	});

	test('still sanitizes a payload inside a declarative shadow root', async () => {
		const result = await Defuddle(
			parse(page('<template shadowrootmode="open"><p>Shadow body text worth keeping.</p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">z</a></template>')),
			URL_
		);

		expect(result.content).toContain('Shadow body text worth keeping.');
		expect(result.content).not.toMatch(/\son[a-z]+\s*=/i);
		expect(result.content).not.toMatch(/<script\b/i);
		expect(result.content).not.toContain('javascript:');
	});

	test('keeps positional mapping when declarative and imperative roots coexist', async () => {
		const doc = parse(page(
			'<template shadowrootmode="open"><p>Declarative shadow one.</p><p>Declarative shadow two.</p></template>' +
			'<div id="imperative-shadow-host"></div>'
		));
		const host = doc.querySelector('#imperative-shadow-host') as HTMLElement;
		host.attachShadow({ mode: 'open' }).innerHTML = '<p>Imperative shadow text.</p>';

		const result = await Defuddle(doc, URL_);

		expect(result.content).toContain('Declarative shadow one.');
		expect(result.content).toContain('Declarative shadow two.');
		expect(result.content).toContain('Imperative shadow text.');
	});
});
