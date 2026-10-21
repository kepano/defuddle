import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const URL_ = 'https://example.com/article';
const html = readFileSync(join(__dirname, 'fixtures/issues--360-with-ad-content.html'), 'utf8');

async function extract(source: string) {
	const result = await Defuddle(parseDocument(source, URL_), URL_);
	return parseDocument(`<!DOCTYPE html><html><body>${result.content}</body></html>`, URL_);
}

describe('Ad selectors', () => {
	test('preserves article continuations and charts inside with-ad wrappers', async () => {
		const source = parseDocument(html, URL_);
		const content = await extract(html);

		for (const paragraph of source.querySelectorAll('article > p, .with-ad blockquote p')) {
			expect.soft(content.body.textContent).toContain(paragraph.textContent);
		}
		expect(content.querySelector('img')?.getAttribute('src')).toBe('https://example.com/chart.png');
		expect(content.body.textContent).not.toContain('Advertisement:');
	});

	test.each(['with-ad', 'article-section with-ad', 'with-ad article-section', 'WITH-AD'])(
		'preserves the class token in %s regardless of ordering', async className => {
			const content = await extract(html.replaceAll('class="with-ad"', `class="${className}"`));
			expect(content.body.textContent).toContain('The first continuation explains the measurements');
			expect(content.body.textContent).not.toContain('Advertisement:');
		}
	);

	test.each([
		'display-ad', 'SPONSOR-AD', 'not-with-ad', 'with-ad-extra-ad',
		'ad with-ad', 'ad-zone with-ad', 'promo with-ad', 'inarticle-ad with-ad',
	])('still removes advertising marked with %s', async className => {
		const content = await extract(html.replace(
			'<div class="display-ad">', `<div class="${className}">`
		));
		expect(content.body.textContent).not.toContain('unrelated paid placement');
	});
});
