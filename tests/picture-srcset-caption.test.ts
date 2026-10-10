import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const url = 'https://example.com/article';
const filler = '<p>This article carries enough surrounding prose that the extractor keeps the figure and its caption during content extraction.</p>';

async function extract(body: string): Promise<Element> {
	const doc = parseDocument(`<html><head><title>Figure</title></head><body><article>${filler}${body}${filler}</article></body></html>`, url);
	const result = await Defuddle(doc, url, { contentSelector: 'article' });
	return parseDocument(`<html><body>${result.content}</body></html>`, url).querySelector('figure, picture, img')!;
}

describe('picture src resolution', () => {
	// Issue #406: markdown keeps a single src, so a <picture> must resolve to the
	// largest srcset candidate, not the first (smallest) one.
	test('uses the highest-resolution candidate from a source srcset', async () => {
		const img = await extract(`<picture>
			<source srcset="https://cdn.example.com/img-320.jpg 320w, https://cdn.example.com/img-640.jpg 640w, https://cdn.example.com/img-1200.jpg 1200w">
			<img src="https://cdn.example.com/img-320.jpg" alt="A landscape photo">
		</picture>`);
		expect(img.querySelector('img')!.getAttribute('src')).toBe('https://cdn.example.com/img-1200.jpg');
	});

	test('honours density descriptors as well as widths', async () => {
		const img = await extract(`<picture>
			<source srcset="https://cdn.example.com/photo-1x.jpg 1x, https://cdn.example.com/photo-3x.jpg 3x, https://cdn.example.com/photo-2x.jpg 2x">
			<img src="https://cdn.example.com/photo-1x.jpg" alt="A portrait photo">
		</picture>`);
		expect(img.querySelector('img')!.getAttribute('src')).toBe('https://cdn.example.com/photo-3x.jpg');
	});
});

describe('figcaption formatting', () => {
	// Issue #369: inline formatting inside a caption (links, footnote refs) must
	// survive rather than being flattened to plain text.
	test('preserves a link inside a figcaption', async () => {
		const figure = await extract(`<figure>
			<img src="https://cdn.example.com/photo.jpg" alt="Photo">
			<figcaption>Photo by <a href="https://example.com/jane">Jane Doe</a> for the project.</figcaption>
		</figure>`);
		const link = figure.querySelector('figcaption a');
		expect(link).not.toBeNull();
		expect(link!.getAttribute('href')).toBe('https://example.com/jane');
		expect(link!.textContent).toBe('Jane Doe');
	});
});
