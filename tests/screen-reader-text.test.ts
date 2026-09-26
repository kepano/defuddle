import { describe, expect, test } from 'vitest';
import { removeBySelector } from '../src/removals/selectors';
import { parseDocument } from './helpers';

function clean(body: string): string {
	const doc = parseDocument(`<html><body>${body}</body></html>`);
	removeBySelector(doc, false);
	return doc.body.textContent || '';
}

const CLASSES = ['sr-only', 'visually-hidden', 'screen-reader-text', 'govuk-visually-hidden', 'usa-sr-only'];

describe('Screen-reader text', () => {
	test.each(CLASSES)('keeps .%s text as content', name => {
		expect(clean(`<p>4<span class="${name}">/</span>3</p>`)).toBe('4/3');
	});

	test('keeps MediaWiki fraction separators and mixed-number operators', () => {
		// Rendered {{sfrac|4|3}} and {{frac|4|1|2}}
		expect(clean('<p><span class="sfrac">&#8288;<span class="tion"><span class="num">4</span><span class="sr-only">/</span><span class="den">3</span></span>&#8288;</span> '
			+ '<span class="frac">4<span class="sr-only">+</span><span class="num">1</span>&#8260;<span class="den">2</span></span></p>'))
			.toBe('⁠4/3⁠ 4+1⁄2');
	});

	test('keeps screen-reader text in place of its aria-hidden duplicate', () => {
		expect(clean('<p>Score: <span class="sr-only">5 out of 10</span><span aria-hidden="true">5/10</span></p>'))
			.toBe('Score: 5 out of 10');
	});

	test.each(CLASSES)('removes .%s annotations from links with visible text', name => {
		expect(clean(`<p><a href="https://example.com">the guide<span class="${name}">, opens in a new window</span></a>.</p>`))
			.toBe('the guide.');
	});

	test('keeps screen-reader text that is the only text of a link', () => {
		expect(clean('<p><a href="https://example.com"><svg aria-hidden="true"></svg><span class="sr-only">Share</span></a></p>')).toBe('Share');
		expect(clean('<p><a href="https://example.com"><span aria-hidden="true">→</span><span class="sr-only">Next article</span></a></p>')).toBe('Next article');
		expect(clean('<p><a href="#fn1"><span class="sr-only">Footnote</span> <span class="sr-only">1</span></a></p>')).toBe('Footnote 1');
	});
});
