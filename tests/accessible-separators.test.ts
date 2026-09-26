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

	test('preserves an operator before a compound operand', () => {
		const doc = parseDocument('<html><body><p>4<span class="sr-only">+</span><span class="sfrac"><span class="num">1</span><span class="sr-only">/</span><span class="den">2</span></span></p></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('4+1/2');
	});

	test('ignores operands that are themselves being removed', () => {
		const doc = parseDocument('<html><body><p>Score: <span class="sr-only">5 out of 10</span><span aria-hidden="true">5</span><span aria-hidden="true">/</span><span aria-hidden="true">10</span></p></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Score: ');
	});

	test('still removes boilerplate, standalone markers, and block-level clutter', () => {
		const doc = parseDocument('<html><body><p>Read <a href="https://example.com">the guide<span class="sr-only">opens in new window</span></a>.</p><span class="sr-only">/</span><div>4</div><div class="advertisement">/</div><div>3</div></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Read the guide.43');
	});
});
