import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

/**
 * Regression for #367: cleanupEmptyElements must not invent a space around
 * sub/sup/code. Those sit tight against neighbours; once a space is injected,
 * H<sub>2</sub>O and an authored "10<sup>−23</sup> J" are indistinguishable.
 */

const FILLER = '<p>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor. '.repeat(30) + '</p>';

function page(body: string): string {
	return `<!doctype html><html><head><title>T</title></head><body><article>${body}${FILLER}</article></body></html>`;
}

describe('tight inline spacing (#367)', () => {
	test('does not insert spaces around chemical subscripts', async () => {
		const html = page('<p>For example, H<sub>2</sub>O is water and (CH<sub>3</sub>)<sub>3</sub>CH is isobutane.</p>');
		const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a');

		expect(result.content).toContain('H<sub>2</sub>O');
		expect(result.content).toContain('(CH<sub>3</sub>)<sub>3</sub>CH');
		expect(result.content).not.toContain('H <sub>2</sub> O');
	});

	test('preserves an authored space before a unit after a superscript', async () => {
		const html = page('<p>The Boltzmann constant is 1.380649×10<sup>−23</sup> J⋅K<sup>−1</sup>.</p>');
		const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a');

		expect(result.content).toContain('10<sup>−23</sup> J');
		expect(result.content).not.toContain('10 <sup>−23</sup>');
	});

	test('does not insert spaces around inline code', async () => {
		const html = page('<p>Use the foo<code>x</code>bar identifier.</p>');
		const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a');

		expect(result.content).toContain('foo<code>x</code>bar');
		expect(result.content).not.toContain('foo <code>x</code> bar');
	});
});
