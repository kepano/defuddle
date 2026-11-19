import { describe, test, expect } from 'vitest';
import { standardizeFootnotes } from '../src/elements/footnotes';
import { createMarkdownContent } from '../src/markdown';
import { parseDocument } from './helpers';

function footnoteMarkdown(body: string): string {
	const doc = parseDocument(`<html><body><article>${body}</article></body></html>`, 'https://example.com/post');
	const article = doc.querySelector('article')!;
	standardizeFootnotes(article);
	return createMarkdownContent(article.outerHTML, 'https://example.com/post');
}

describe('Footnote numbering across styles', () => {
	test('keeps an inline sidenote next to a footnote list', () => {
		const markdown = footnoteMarkdown(`
			<p>Side<span class="sidenote-container"><span class="sidenote">Sidenote text</span></span> and list<sup id="fnref:1"><a href="#fn:1">1</a></sup>.</p>
			<div class="footnotes"><ol><li id="fn:1"><p>List text <a href="#fnref:1">↩</a></p></li></ol></div>
		`);

		expect(markdown).toBe('Side[^1] and list[^2].\n\n[^1]: Sidenote text\n\n[^2]: List text');
	});

	test('keeps every list footnote next to a hidden aside footnote', () => {
		const markdown = footnoteMarkdown(`
			<p>A<span data-definition="note-a"><a href="#">*</a></span> B<sup id="fnref:b"><a href="#fn:b">1</a></sup> C<sup id="fnref:c"><a href="#fn:c">2</a></sup>.</p>
			<aside id="note-a" style="display:none">Aside text</aside>
			<div class="footnotes"><ol><li id="fn:b"><p>Note B</p></li><li id="fn:c"><p>Note C</p></li></ol></div>
		`);

		expect(markdown).toBe('A[^1] B[^2] C[^3].\n\n[^1]: Aside text\n\n[^2]: Note B\n\n[^3]: Note C');
	});
});
