import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

/**
 * cleanupEmptyElements must not pad <br> with spaces: lines would otherwise
 * start or end with a space ("one <br> two"). Collapsible whitespace beside a
 * forced break is invisible in CSS, so source indentation around it goes too.
 */

const FILLER = '<p>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor. '.repeat(30) + '</p>';

function page(body: string): string {
	return `<!doctype html><html><head><title>T</title></head><body><article>${body}${FILLER}</article></body></html>`;
}

async function extract(body: string): Promise<string> {
	const html = page(body);
	const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a');
	return result.content;
}

describe('line break spacing', () => {
	test('does not insert spaces around a line break', async () => {
		const content = await extract('<p>line one<br>line two</p>');
		expect(content).toContain('<p>line one<br>line two</p>');
	});

	test('drops source whitespace and indentation beside a line break', async () => {
		const content = await extract('<p>line one <br>\n    line two\n  <br> line three</p>');
		expect(content).toContain('<p>line one<br>line two<br>line three</p>');
	});

	test('drops spaces moved out of inline elements next to a line break', async () => {
		const content = await extract('<p>Some <b>bold </b><br><em> italic</em> text</p>');
		expect(content).toContain('<p>Some <b>bold</b><br><em>italic</em> text</p>');
	});

	test('keeps spaces between inline elements away from the break', async () => {
		const content = await extract('<p><b>bold</b> <i>italic</i><br><a href="https://example.com/x">link</a> text</p>');
		expect(content).toContain('<b>bold</b> <i>italic</i><br><a href="https://example.com/x">link</a> text');
	});

	test('handles line breaks in list items, table cells and inline containers', async () => {
		const content = await extract(
			'<ul><li>item a <br> item b</li></ul>' +
			'<table><tr><td>cell a<br>cell b</td><td>x</td></tr></table>' +
			'<p><span class="x">span a<br>span b</span> end</p>'
		);
		expect(content).toContain('<li>item a<br>item b</li>');
		expect(content).toContain('cell a<br>cell b');
		expect(content).toContain('span a<br>span b');
	});

	test('keeps pre content byte-exact', async () => {
		const content = await extract('<pre><code>a  b \n  c ,  d</code></pre>');
		expect(content).toContain('<pre><code>a  b \n  c ,  d</code></pre>');
	});
});
