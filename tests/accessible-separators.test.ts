import { describe, expect, test } from 'vitest';
import { removeBySelector } from '../src/removals/selectors';
import { parseDocument } from './helpers';

describe('Accessible separators', () => {
	test.each([
		'class="sr-only"', 'class="visually-hidden"', 'class="screen-reader-text"',
		'class="sr-only-focusable"', 'class="SR-Only"', 'id="sr-only-separator"',
		'class="sr-only" id="screen-reader-text"',
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

	test('still removes boilerplate, standalone markers, and block-level clutter', () => {
		const doc = parseDocument('<html><body><p>Read <a href="https://example.com">the guide<span class="sr-only">opens in new window</span></a>.</p><span class="sr-only">/</span><div>4</div><div class="advertisement">/</div><div>3</div></body></html>');
		removeBySelector(doc, false);
		expect(doc.body.textContent).toBe('Read the guide.43');
	});
});
