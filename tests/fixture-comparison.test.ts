import { expect, test } from 'vitest';
import { normalizeHtmlAttributes, normalizeMarkdownHtml } from './helpers';

test('fixture comparisons ignore attribute order but retain attributes and content', () => {
	const html = '<p id="a" class="b">Text</p>';
	expect(normalizeHtmlAttributes(html)).toBe(normalizeHtmlAttributes('<p class="b" id="a">Text</p>'));
	for (const changed of ['<p id="a">Text</p>', '<p id="a" class="c">Text</p>', '<p id="a" class="b">Other</p>']) {
		expect(normalizeHtmlAttributes(html)).not.toBe(normalizeHtmlAttributes(changed));
	}
});

test('Markdown comparisons normalize embedded SVG without parsing Markdown as HTML', () => {
	const prefix = '```html\n<p id="a" class="b">Example</p>\n```\n\n';
	const svg = '<svg viewBox="0 0 10 10"><path stroke="red" fill="none"></path></svg>';
	const reordered = '<svg viewBox="0 0 10 10"><path fill="none" stroke="red"></path></svg>';
	expect(normalizeMarkdownHtml(prefix + svg)).toBe(normalizeMarkdownHtml(prefix + reordered));
	expect(normalizeMarkdownHtml(prefix + svg)).toContain(prefix);
	expect(normalizeMarkdownHtml(svg)).not.toBe(normalizeMarkdownHtml(svg.replace('red', 'blue')));
	for (const fence of ['```', '````', '~~~']) {
		const code = `${fence}html\n${svg}\n${fence}\n`;
		expect(normalizeMarkdownHtml(code)).toBe(code);
		expect(normalizeMarkdownHtml(code)).not.toBe(normalizeMarkdownHtml(code.replace(svg, reordered)));
	}
});
