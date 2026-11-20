import { describe, expect, it } from 'vitest';
import { formatHTML } from '../src/client/format-html';

describe('playground HTML formatting', () => {
	it('indents nested blocks and keeps prose on its own line', () => {
		expect(formatHTML('<article>  <p>Hello <strong>world</strong>.</p> <ul><li>One</li><li>Two</li></ul></article>')).toBe('<article>\n  <p>Hello <strong>world</strong>.</p>\n  <ul>\n    <li>One</li>\n    <li>Two</li>\n  </ul>\n</article>');
	});
	it('preserves whitespace-sensitive blocks, entities, and inline adjacency', () => {
		const pre = '<pre><code>  const x = 1;\n\n    x++;</code></pre>';
		const inline = '<p><strong>Hello</strong><em>world</em> &amp; friends</p>';
		expect(formatHTML(`<article>${pre}${inline}</article>`)).toBe(`<article>\n  ${pre}\n  ${inline}\n</article>`);
		const styled = '<div style="white-space: pre-wrap"><p>one</p>  <p>two</p></div>';
		expect(formatHTML(styled)).toBe(styled);
	});
	it('keeps malformed and mixed-content fragments unchanged', () => {
		for (const source of ['<div><p>hello</div', 'Hello <strong>world</strong>', '<div>hello<p>world</p></div>']) expect(formatHTML(source)).toBe(source);
	});
	it('is stable when formatting already formatted output', () => {
		const formatted = formatHTML('<article><p>One</p><p>Two</p></article>');
		expect(formatHTML(formatted)).toBe(formatted);
	});
});
