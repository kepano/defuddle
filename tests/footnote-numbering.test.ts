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

	test('collects a footnote once when two collectors find it', () => {
		const markdown = footnoteMarkdown(`
			<p>Text<sup id="fnref:1"><a href="#fn:1">1</a></sup>.</p>
			<div class="footnotes"><aside><ol start="1"><li id="fn:1">Only note</li></ol></aside></div>
		`);

		expect(markdown).toBe('Text[^1].\n\n[^1]: Only note');
	});

	test('converts Tufte CSS sidenotes with label.sidenote-number and input.margin-toggle into footnotes', () => {
		const markdown = footnoteMarkdown(`
			<p>The collective knowledge of shops and kitchens is scattered across every shopkeeper and chef.<label for="sn-mission-1" class="sidenote-number"></label><input type="checkbox" id="sn-mission-1" class="margin-toggle"/><span class="sidenote">Michael Polanyi, <a href="https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html">The Tacit Dimension</a> (1966)</span></p>
			<p>Second note<label for="sn-2" class="margin-toggle sidenote-number"></label><input type="checkbox" id="sn-2" class="margin-toggle"/><span class="sidenote">Second sidenote</span>.</p>
		`);

		expect(markdown).toBe(
			'The collective knowledge of shops and kitchens is scattered across every shopkeeper and chef.[^1]\n\n' +
			'Second note[^2].\n\n' +
			'[^1]: Michael Polanyi, [The Tacit Dimension](https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html) (1966)\n\n' +
			'[^2]: Second sidenote'
		);
	});
});
