import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

// GHSA-w8hh-2cpq-9whp: linkedom writes a title's text unescaped, and browsers
// parse it as markup inside math, so the text can become a live element.

const URL_ = 'https://example.com/math';
const PARA = '<p>This paper studies a simple model and explains the derivation in detail, step by step, with worked examples.</p>';

function makeArticle(math: string): string {
	return `<!DOCTYPE html><html><head><title>Math title</title></head><body><article>
<h1>Math title</h1>${PARA}${PARA}
<p>Value ${math} here.</p>
${PARA}${PARA}
</article></body></html>`;
}

describe.each(['linkedom', 'jsdom'])('Title inside math (%s)', implementation => {
	function parse(html: string): Document {
		if (implementation === 'jsdom') return new JSDOM(html, { url: URL_ }).window.document as any;
		return parseLinkedomHTML(html, URL_);
	}

	test.each([
		['after an identifier', '<math><mi>x</mi><title>&lt;img src=x onerror=alert(1)&gt;</title></math>'],
		['nested in mrow', '<math><mrow><title>&lt;img src=x onerror=alert(1)&gt;</title><mi>y</mi></mrow></math>'],
	])('removes a title %s', async (_name, math) => {
		const result = await Defuddle(parse(makeArticle(math)), URL_, { useAsync: false });
		const reparsed = new JSDOM(`<body>${result.content}</body>`).window.document;

		expect(reparsed.querySelectorAll('[onerror]')).toHaveLength(0);
		expect(reparsed.querySelector('math title')).toBeNull();
		expect(result.content).toContain('Value');
	});
});
