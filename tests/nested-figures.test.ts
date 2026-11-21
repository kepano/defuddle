import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { createMarkdownContent } from '../src/markdown';
import { parseDocument } from './helpers';

const url = 'https://example.com/article';
const text = '<p>This article compares separate image panels and provides enough surrounding text to retain the figures during extraction.</p>';

async function extract(figures: string, standardize = true) {
	const html = `<html><head><title>Image panels</title></head><body><article>${text}${figures}${text}</article></body></html>`;
	const result = await Defuddle(parseDocument(html, url), url, { contentSelector: 'article', separateMarkdown: true, standardize });
	const images = Array.from(parseDocument(`<html><body>${result.content}</body></html>`, url).querySelectorAll('img'));
	return { result, sources: images.map(img => img.getAttribute('src')) };
}

describe('nested figures', () => {
	test.each(['', ' alt="Image"'])('keeps separate subfigures with shared alt attributes: %s', async alt => {
		const { result, sources } = await extract(`<figure>
			<figure><img src="/one.png"${alt}><figcaption></figcaption></figure>
			<figure><img src="/two.png"${alt}><figcaption></figcaption></figure>
			<figcaption>Overall comparison caption.</figcaption>
		</figure>`);
		expect(sources).toEqual(['https://example.com/one.png', 'https://example.com/two.png']);
		expect(result.contentMarkdown).toContain(`![${alt ? 'Image' : ''}](https://example.com/two.png)`);
		expect(result.contentMarkdown).toContain('Overall comparison caption.');
	});

	test('keeps subfigure captions and the overall caption during standardization', async () => {
		const { result, sources } = await extract(`<figure>
			<figure><img src="/one.png"><figcaption>First panel caption.</figcaption></figure>
			<figure><img src="/two.png"><figcaption>Second panel caption.</figcaption></figure>
			<figcaption>Overall comparison caption.</figcaption>
		</figure>`);
		expect(sources).toEqual(['https://example.com/one.png', 'https://example.com/two.png']);
		for (const caption of ['First panel caption.', 'Second panel caption.', 'Overall comparison caption.']) {
			expect(result.contentMarkdown?.split(caption)).toHaveLength(2);
		}
	});

	test.each([
		['parent figcaption', '<figcaption class="caption">Overall comparison caption.</figcaption>', 'Overall comparison caption.'],
		['parent class caption', '<div class="caption">Overall comparison caption.</div>', 'Overall comparison caption.'],
		['adjacent discussion', '<div class="text-base"><h2>Discussion</h2><p>Important article text and details that must be retained once.</p></div>', 'Important article text and details that must be retained once.'],
	])('does not copy %s into uncaptioned subfigures', async (_name, adjacentContent, phrase) => {
		const { result, sources } = await extract(`<figure>
			<figure><img src="/one.png" width="672"></figure>
			<figure><img src="/two.png" width="672"></figure>
			${adjacentContent}
		</figure>`);
		expect(sources).toEqual(['https://example.com/one.png', 'https://example.com/two.png']);
		expect(result.content.split(phrase)).toHaveLength(2);
		expect(result.contentMarkdown?.split(phrase)).toHaveLength(2);
	});

	test('does not copy an adjacent subfigure caption into an uncaptioned subfigure', async () => {
		const { result, sources } = await extract(`<figure>
			<figure><img src="/one.png" width="672"></figure>
			<figure class="figure-caption"><img src="/two.png" width="672"><figcaption>Second panel caption with details.</figcaption></figure>
			<figcaption>Overall comparison caption.</figcaption>
		</figure>`);
		expect(sources).toEqual(['https://example.com/one.png', 'https://example.com/two.png']);
		for (const caption of ['Second panel caption with details.', 'Overall comparison caption.']) {
			expect(result.content.split(caption)).toHaveLength(2);
			expect(result.contentMarkdown?.split(caption)).toHaveLength(2);
		}
	});

	test('still recognizes sibling captions for top-level figures', async () => {
		const { result } = await extract('<figure><img src="/one.png" width="672"></figure><div class="caption">A caption outside the top-level figure.</div>');
		const figure = parseDocument(`<html><body>${result.content}</body></html>`, url).querySelector('figure');
		expect(figure?.querySelector('figcaption')?.textContent).toBe('A caption outside the top-level figure.');
	});

	test('still recognizes captions inside a nested figure image wrapper', async () => {
		const { result } = await extract('<figure><figure><span><img src="/one.png" width="672"></span><figcaption class="caption">First panel caption with details.</figcaption></figure><figure><img src="/two.png" width="672"></figure><figcaption>Overall comparison caption.</figcaption></figure>');
		for (const caption of ['First panel caption with details.', 'Overall comparison caption.']) {
			expect(result.content.split(caption)).toHaveLength(2);
			expect(result.contentMarkdown?.split(caption)).toHaveLength(2);
		}
	});

	test('deduplicates hydration copies only within their nearest figure', async () => {
		const { sources } = await extract(`<figure>
			<div><img src="/parent-small.jpg"><img src="/parent-large.jpg" srcset="/parent-large.jpg 2x"></div>
			<figure><img src="/child-small.jpg"><img src="/child-large.jpg" srcset="/child-large.jpg 2x"></figure>
		</figure>`);
		expect(sources).toEqual(['https://example.com/parent-large.jpg', 'https://example.com/child-large.jpg']);
	});

	test('preserves identical images used in separate subfigures without standardization', async () => {
		const { result, sources } = await extract('<figure><figure><img src="/repeated.png"></figure><figure><img src="/repeated.png"></figure></figure>', false);
		expect(sources).toEqual(['https://example.com/repeated.png', 'https://example.com/repeated.png']);
		expect(result.contentMarkdown?.match(/!\[\]\(https:\/\/example.com\/repeated.png\)/g)).toHaveLength(2);
	});

	test('converts all nested subfigures and captions directly to Markdown', () => {
		const markdown = createMarkdownContent('<figure><figure><img src="https://example.com/one.png"><figcaption>First panel caption.</figcaption></figure><figure><img src="https://example.com/two.png"><figcaption>Second panel caption.</figcaption></figure><figcaption>Overall comparison caption.</figcaption></figure>', url);
		expect(markdown).toBe('![](https://example.com/one.png)\n\nFirst panel caption.\n\n![](https://example.com/two.png)\n\nSecond panel caption.\n\nOverall comparison caption.');
	});
});
