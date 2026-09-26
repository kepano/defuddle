import { describe, expect, test } from 'vitest';
import { removeBySelector } from '../src/removals/selectors';
import { parseDocument } from './helpers';

describe('Accessible separators', () => {
	test.each([
		'class="sr-only"', 'class="visually-hidden"', 'class="screen-reader-text"',
		'class="sr-only-focusable"', 'class="SR-Only"', 'id="sr-only-separator"',
		'class="sr-only" id="screen-reader-text"', 'class="sr-only advertisement"',
	])('preserves operators despite %s', attributes => {
		for (const [left, right] of [
			['<span>4</span>', '<span>3</span>'], ['<sup>4</sup>', '<sub>3</sub>'],
			['<b>4</b>', '<em>3</em>'], ['4', '3'], ['x', 'y'],
		]) {
			const doc = parseDocument(`<html><body><p>${left}<span ${attributes}>/</span>${right}</p></body></html>`);
			removeBySelector(doc, false);
			expect(doc.body.textContent).toBe(left.includes('x') ? 'x/y' : '4/3');
			expect(doc.querySelector(`[${attributes.startsWith('id') ? 'id' : 'class'}]`)).toBeNull();
		}
	});

	test('preserves MediaWiki fraction separators and mixed-number operators', () => {
		// Rendered {{sfrac|4|3}}, {{sfrac|4|1|2}}, {{frac|4|1|2}} and {{sfrac|''x''|''y''}}
		const doc = parseDocument('<html><body><p>'
			+ '<span class="sfrac">&#8288;<span class="tion"><span class="num">4</span><span class="sr-only">/</span><span class="den">3</span></span>&#8288;</span> '
			+ '<span class="sfrac">&#8288;4<span class="sr-only">+</span><span class="tion"><span class="num">1</span><span class="sr-only">/</span><span class="den">2</span></span>&#8288;</span> '
			+ '<span class="frac">4<span class="sr-only">+</span><span class="num">1</span>&#8260;<span class="den">2</span></span> '
			+ '<span class="sfrac">&#8288;<span class="tion"><span class="num"><i>x</i></span><span class="sr-only">/</span><span class="den"><i>y</i></span></span>&#8288;</span>'
			+ '</p></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('\u20604/3\u2060 \u20604+1/2\u2060 4+1\u20442 \u2060x/y\u2060');
		expect(doc.querySelector('.sr-only')).toBeNull();
	});

	test('ignores operands that are themselves being removed', () => {
		const doc = parseDocument('<html><body><p>Score: <span class="sr-only">5 out of 10</span><span aria-hidden="true">5</span><span aria-hidden="true">/</span><span aria-hidden="true">10</span></p></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Score: ');
	});

	test.each([
		'<span class="advertisement">3</span>',
		'<span><span class="advertisement">3</span></span>'
	])('does not leave an operator before a removed operand in %s', right => {
		const doc = parseDocument(`<html><body><p>4<span class="sr-only">/</span>${right}</p></body></html>`);
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('4');
	});

	test('does not treat punctuation as an operand', () => {
		const doc = parseDocument('<html><body><p>Word<span class="sr-only">/</span>.</p></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Word.');
	});

	test('still removes boilerplate, standalone markers, and block-level clutter', () => {
		const doc = parseDocument('<html><body><p>Read <a href="https://example.com">the guide<span class="sr-only">opens in new window</span></a>.</p><p>A <span class="sr-only">·</span> B</p><span class="sr-only">/</span><div>4</div><div class="advertisement">/</div><div>3</div></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Read the guide.A  B43');
	});
});
